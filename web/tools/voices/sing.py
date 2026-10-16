"""Fizz sings. Turns a spoken song line into a sung robot-disco track.

Kokoro can only speak, and Fizz is a disco-ball robot, so his songs use a vocoder (the classic
robot-singing sound): the spoken lyric gives the words (its spectral envelope: vowels and
consonants), and a synthesised tone gives the melody. Each word is stretched onto its beat,
sung on its note with a little vibrato, and mixed over a disco backing (four-on-the-floor kick,
claps, hats, octave bass and chord stabs). The caption words get their start times on the beat,
so the karaoke highlight follows the singing.

Song lines and their melodies live in songs.json (keyed by the caption text).
"""
import numpy as np
from scipy.signal import stft, istft, butter, sosfilt

SR = 24000
N_FFT, HOP = 1024, 256
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def chord_notes(name: str):
    """'C', 'Am', 'F', 'G7'... -> root midi in octave 3, and the triad intervals."""
    root = NOTE[name[0]] + (1 if len(name) > 1 and name[1] == '#' else 0)
    minor = 'm' in name[1:]
    return 48 + root, [0, 3 if minor else 4, 7]


VOWELS = set('aeiouyɑɐɒæɛɜəɪʊʌɔɚɝøœɨʉɯɤ')


def word_spans(timings, n_words: int, total: float):
    """(start, vowel start, vowel end, end) in seconds for each spoken word, from the phoneme timings.
    The vowel is the part a singer holds; consonants keep their natural length."""
    words, cur = [], None
    for t in timings or []:
        ph = t.phoneme
        if ph.strip() == '' or ph in ',.!?;:—–-…"“”':
            if cur:
                words.append(cur)
                cur = None
            continue
        if cur is None:
            cur = []
        cur.append((ph, t.start, t.end))
    if cur:
        words.append(cur)
    if len(words) != n_words:  # fall back to an even split of the clip
        out = []
        for i in range(n_words):
            a, b = total * i / n_words, total * (i + 1) / n_words
            out.append((a, a + 0.3 * (b - a), a + 0.7 * (b - a), b))
        return out
    out = []
    for w in words:
        ws, we = w[0][1], w[-1][1] + min(0.12, w[-1][2] - w[-1][1])  # trim trailing silence off the last sound
        # the longest vowel (with its length mark) is the one to hold
        best, i = None, 0
        while i < len(w):
            ph, a, b = w[i]
            if any(c in VOWELS for c in ph):
                j = i + 1
                while j < len(w) and w[j][0] in ('ː', 'ˑ'):
                    b = w[j][2]
                    j += 1
                if best is None or (b - a) > (best[1] - best[0]):
                    best = (a, b)
                i = j
            else:
                i += 1
        vs, ve = best if best else (ws + 0.3 * (we - ws), ws + 0.7 * (we - ws))
        out.append((ws, vs, min(ve, we), we))
    return out


def envelope(mag: np.ndarray, lifter: int = 34) -> np.ndarray:
    """Smooth spectral envelope of each frame (cepstral liftering): the shape of the vowel, without pitch."""
    logm = np.log(mag + 1e-7)
    cep = np.fft.irfft(logm, axis=0)
    cep[lifter:-lifter, :] = 0
    return np.exp(np.fft.rfft(cep, axis=0).real)


def saw(freqs: np.ndarray, kmax_hz: float = 10500.0) -> np.ndarray:
    """Band-limited sawtooth following a per-sample frequency track (no aliasing)."""
    phase = 2 * np.pi * np.cumsum(freqs) / SR
    out = np.zeros_like(freqs)
    k = 1
    while k * float(np.max(freqs)) < kmax_hz:
        out += np.sin(k * phase) / k
        k += 1
    return out


def time_map(u: float, span, dur: float) -> float:
    """The source time (in the spoken clip) to use `u` seconds into a word's sung slot of length `dur`:
    the onset consonants at natural speed, the vowel held for as long as the note lasts, then the
    closing consonants at natural speed."""
    ws, vs, ve, we = span
    onset, vowel, coda = vs - ws, max(ve - vs, 0.02), we - ve
    if dur <= onset + vowel + coda:
        return ws + (we - ws) * min(1.0, u / max(dur, 1e-6))
    if u < onset:
        return ws + u
    if u > dur - coda:
        return ve + (u - (dur - coda))
    return vs + vowel * (u - onset) / max(dur - onset - coda, 1e-6)


def env_adsr(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(attack, 1e-4)) * np.exp(-t / decay)


def place(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += gain * sig[: j - i]


def backing(total: float, tempo: float, chords, style: str, rng) -> np.ndarray:
    """A small disco band: kick on every beat, claps on 2 and 4, hats off the beat, octave bass, chord stabs."""
    beat = 60.0 / tempo
    n = int(total * SR)
    out = np.zeros(n, dtype=np.float64)
    soft = style == 'soft'
    hp = butter(4, 7000, 'highpass', fs=SR, output='sos')
    bp = butter(2, [900, 3200], 'bandpass', fs=SR, output='sos')
    lp_bass = butter(2, 700, 'lowpass', fs=SR, output='sos')
    lp_keys = butter(2, 2200, 'lowpass', fs=SR, output='sos')
    nbeats = int(total / beat) + 1
    # drums
    t = np.arange(int(0.3 * SR)) / SR
    f = 45 + 95 * np.exp(-t / 0.03)
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.16 if soft else 0.12))
    clap = sosfilt(bp, rng.standard_normal(int(0.18 * SR))) * env_adsr(int(0.18 * SR), 0.001, 0.05)
    hat = sosfilt(hp, rng.standard_normal(int(0.08 * SR))) * env_adsr(int(0.08 * SR), 0.001, 0.025)
    for b in range(nbeats):
        at = b * beat
        place(out, kick, at, 0.5 if soft else 0.9)
        if b % 2 == 1 and not soft:
            place(out, clap, at, 0.45)
            place(out, clap, at + 0.012, 0.25)
        place(out, hat, at + beat / 2, 0.12 if soft else 0.22)
    # bass and chord stabs follow the chords
    spans = []
    for i, (start, name) in enumerate(chords):
        end = chords[i + 1][0] if i + 1 < len(chords) else total / beat + 1
        spans.append((start, end, name))
    for start, end, name in spans:
        root, triad = chord_notes(name)
        e = start
        while e < end - 1e-6:
            at = e * beat
            if at >= total:
                break
            octave = 12 if int(round(e * 2)) % 2 else 0  # disco octave bass
            nlen = int(beat * 0.45 * SR)
            freqs = np.full(nlen, hz(root - 12 + octave))
            place(out, sosfilt(lp_bass, saw(freqs, 4000)) * env_adsr(nlen, 0.004, 0.12), at, 0.35 if soft else 0.5)
            e += 0.5
        for b in np.arange(start, end, 1.0):
            at = (b + (0 if soft else 0.5)) * beat
            if at >= total:
                break
            nlen = int(beat * (0.9 if soft else 0.3) * SR)
            stab = np.zeros(nlen)
            for iv in triad:
                stab += saw(np.full(nlen, hz(root + 12 + iv)), 6000)
            place(out, sosfilt(lp_keys, stab) * env_adsr(nlen, 0.01 if soft else 0.003, 0.5 if soft else 0.1), at, 0.08 if soft else 0.1)
    return out


def sing(kokoro, say: str, cfg: dict, spec: dict, caption_tokens: list, lang: str):
    """Returns (audio, caption word start times) for one sung line."""
    rng = np.random.default_rng(7)
    tempo = float(spec['tempo'])
    beat = 60.0 / tempo
    notes = spec['notes']  # [[midi, beats], ...] one per sung word
    intro = float(spec.get('intro', 2))
    outro = float(spec.get('outro', 1))
    style = spec.get('style', 'disco')
    words = [w for w in caption_tokens if any(c.isalnum() for c in w)]
    if len(words) != len(notes):
        raise ValueError(f'song "{say}": {len(words)} words but {len(notes)} notes')

    # 1. The spoken lyric (clear, a little slow) is the modulator.
    speech, _, timings = kokoro.create_timed(say, voice=cfg['model'], speed=0.92, lang=lang)
    speech = np.asarray(speech, dtype=np.float64)
    spans = word_spans(timings, len(words), len(speech) / SR)

    # 2. Where each word goes in the song.
    starts, durs, t = [], [], intro
    for _, nb in notes:
        starts.append(t * beat)
        durs.append(nb * beat * 0.94)
        t += nb
    total = (t + outro) * beat + 0.4
    n = int(total * SR)

    # 3. Pitch track (with glides and vibrato) and a gate for silence between words.
    f0 = np.zeros(n)
    gate = np.zeros(n)
    for (midi, _), s0, d in zip(notes, starts, durs):
        i0, i1 = int(s0 * SR), min(n, int((s0 + d) * SR))
        tt = np.arange(i1 - i0) / SR
        vib = np.where(tt > 0.22, 0.012 * np.sin(2 * np.pi * 5.6 * tt) * np.minimum(1, (tt - 0.22) / 0.3), 0)
        f0[i0:i1] = hz(midi) * 2 ** vib
        g = np.ones(i1 - i0)
        a, r = int(0.012 * SR), int(0.05 * SR)
        g[:a] = np.linspace(0, 1, a)
        g[-r:] *= np.linspace(1, 0, r)
        gate[i0:i1] = g
    # glide: fill gaps with the previous pitch and smooth the jumps (portamento)
    last = hz(notes[0][0])
    for i in range(n):
        if f0[i] == 0:
            f0[i] = last
        else:
            last = f0[i]
    k = int(0.035 * SR)
    f0 = np.convolve(f0, np.ones(k) / k, mode='same')

    # 4. Carrier: two slightly detuned saws (a warm robot choir) plus a little noise for consonants.
    carrier = saw(f0) + 0.6 * saw(f0 * 2 ** (8 / 1200)) + 0.18 * rng.standard_normal(n)
    _, _, C = stft(carrier, fs=SR, nperseg=N_FFT, noverlap=N_FFT - HOP)
    Cw = C / (envelope(np.abs(C)) + 1e-6)  # flat ("white") carrier

    # 5. Modulator envelope, time-warped so each word fills its sung slot.
    _, _, M = stft(speech, fs=SR, nperseg=N_FFT, noverlap=N_FFT - HOP)
    Menv = envelope(np.abs(M))
    frame_t = np.arange(Cw.shape[1]) * HOP / SR
    E = np.zeros_like(np.abs(Cw))
    for span, s0, d in zip(spans, starts, durs):
        sel = np.where((frame_t >= s0) & (frame_t < s0 + d))[0]
        for j in sel:
            src_frame = time_map(frame_t[j] - s0, span, d) * SR / HOP
            a = int(np.clip(np.floor(src_frame), 0, Menv.shape[1] - 1))
            b = min(a + 1, Menv.shape[1] - 1)
            w = src_frame - np.floor(src_frame)
            E[:, j] = (1 - w) * Menv[:, a] + w * Menv[:, b]
    _, voice = istft(Cw * E, fs=SR, nperseg=N_FFT, noverlap=N_FFT - HOP)
    voice = voice[:n] if len(voice) >= n else np.pad(voice, (0, n - len(voice)))
    voice *= gate
    voice /= max(1e-6, float(np.max(np.abs(voice))))

    # 6. Band, mix, gentle fade out.
    band = backing(total, tempo, spec['chords'], style, rng)
    band /= max(1e-6, float(np.max(np.abs(band))))
    mix = 0.78 * voice + (0.32 if style == 'soft' else 0.42) * band
    fade = int(0.35 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)

    # 7. Caption timings: notes and words on the beat; the closing note symbol at the last word's end.
    out_starts, wi = [], 0
    for tok in caption_tokens:
        if any(c.isalnum() for c in tok):
            out_starts.append(round(starts[wi], 3))
            wi += 1
        else:
            out_starts.append(round(0.0 if wi == 0 else starts[wi - 1] + durs[wi - 1], 3))
    return mix.astype(np.float32), out_starts
