"""Records every spoken line of Party Galaxy with a distinct voice per character.

Engine: Kokoro-82M v1.0 (Apache-2.0) through kokoro-onnx, run offline on this computer.
Children's voices are adult voices raised a few semitones (generated slower, then resampled, so
the tempo stays natural); the storyteller keeps a calm adult voice; Fizz gets a light, friendly
robot shimmer. Every clip is loudness-matched and saved as MP3, and the manifest records each
clip's length and when each caption word starts (for the karaoke highlight).

Usage (from the web folder):
  npx tsx tools/voices/export-lines.ts
  python tools/voices/generate.py --models <folder with kokoro-v1.0.onnx and voices-v1.0.bin>

Re-running only records lines that are new or changed. Requirements: tools/voices/requirements.txt
"""
import argparse
import json
import math
import os
import re
import sys
import time
from fractions import Fraction

import numpy as np
import pyworld as pw
import soundfile as sf
from scipy.signal import resample_poly

from sing import sing  # Fizz's sung lines (vocoder + disco backing), see sing.py and songs.json

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, '..', '..'))
SR = 24000


def fnv1a(text: str) -> str:
    h = 0x811C9DC5
    for b in text.encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


def js_num(x) -> str:
    """Formats a number the way JavaScript's String() does (1.0 -> '1', 0.93 -> '0.93')."""
    if isinstance(x, float) and x.is_integer():
        return str(int(x))
    return repr(x) if isinstance(x, float) else str(x)


PROSODY = ''  # set from voice-cast.json in main()


def voice_signature(cfg: dict) -> str:
    """Mirrors voiceSignature() in src/lib/voice-text.ts: everything that changes how a voice sounds."""
    return f"{cfg['model']}:{js_num(cfg.get('semitones', 0))}:{js_num(cfg.get('speed', 1))}:{cfg.get('fx', '')}:{PROSODY}"


def clip_name(voice: str, cfg: dict, say: str, tone: str) -> str:
    """Mirrors clipName() in src/lib/voice-text.ts: named after the voice settings, the tone and the
    spoken text, so a changed voice, tone or reading gets new file names."""
    return fnv1a(f'{voice}|{voice_signature(cfg)}|{tone}|{say}')


def act(audio: np.ndarray, t: dict) -> np.ndarray:
    """Performs a line in its tone with the WORLD vocoder: moves the voice's pitch up or down, widens
    or narrows its melody (excited speech swings more, sad speech less), lifts the end of questions,
    adds a little shake for worry, and makes it louder or softer. Timing is unchanged, so the caption
    word times still fit."""
    x = audio.astype(np.float64)
    f0, tt = pw.harvest(x, SR, f0_floor=70.0, f0_ceil=900.0, frame_period=5.0)
    sp = pw.cheaptrick(x, f0, tt, SR)
    ap = pw.d4c(x, f0, tt, SR)
    v = f0 > 0
    if not v.any():
        return audio
    lf = np.log2(np.where(v, f0, 1.0))
    m = float(np.median(lf[v]))
    n = len(f0)
    pos = np.arange(n) / max(1, n - 1)
    shape = (lf - m) * t.get('range', 1.0) + t.get('shift', 0) / 12
    shape += t.get('rise', 0) / 12 * np.clip((pos - 0.72) / 0.28, 0, 1) ** 1.5
    wob = t.get('wobble', 0)
    if wob:
        shape += wob / 12 * np.sin(2 * np.pi * 6.0 * tt) * 0.5
    f02 = np.where(v, 2 ** (m + shape), 0.0)
    y = pw.synthesize(f02, sp, ap, SR, frame_period=5.0)
    y = y[: len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))
    return (y * 10 ** (t.get('gain', 0) / 20)).astype(np.float32)


def caption_words(text: str):
    return [w for w in re.split(r'\s+', text) if w]


def pitch_shift(audio: np.ndarray, semitones: float) -> np.ndarray:
    """Plays the clip back faster by the pitch ratio (it was generated slower to compensate)."""
    if not semitones:
        return audio
    ratio = 2 ** (semitones / 12)
    frac = Fraction(1 / ratio).limit_denominator(200)
    return resample_poly(audio, frac.numerator, frac.denominator).astype(np.float32)


def robot(audio: np.ndarray) -> np.ndarray:
    """A light comb filter and a touch of ring modulation: friendly, still easy to understand."""
    d = int(0.0035 * SR)
    y = audio.copy()
    y[d:] += 0.4 * audio[:-d]
    t = np.arange(len(y)) / SR
    y = 0.8 * y + 0.2 * y * np.sin(2 * np.pi * 60 * t)
    return y.astype(np.float32)


def normalise(audio: np.ndarray, target_db: float = -19.0) -> np.ndarray:
    voiced = audio[np.abs(audio) > 0.01]
    rms = math.sqrt(float(np.mean(voiced ** 2))) if len(voiced) else 1e-4
    gain = (10 ** (target_db / 20)) / max(rms, 1e-4)
    y = audio * gain
    peak = float(np.max(np.abs(y))) if len(y) else 0.0
    if peak > 0.89:
        y = y * (0.89 / peak)
    return y.astype(np.float32)


def word_starts(timings, n_caption_words: int, ratio: float, lead: float):
    """Start time of each spoken word from the phoneme timings, if they line up with the caption."""
    if not timings:
        return None
    starts, in_word = [], False
    for t in timings:
        ph = t.phoneme
        if ph.strip() == '' or ph in ',.!?;:—–-…"“”':
            in_word = False
            continue
        if not in_word:
            starts.append(round(t.start / ratio + lead, 3))
            in_word = True
    return starts if len(starts) == n_caption_words else None


def median_pitch(audio: np.ndarray) -> float:
    """Rough median pitch (Hz) by autocorrelation over voiced frames, to check voices differ."""
    frame, hop = 1024, 512
    pitches = []
    for i in range(0, len(audio) - frame, hop):
        x = audio[i:i + frame]
        if np.sqrt(np.mean(x ** 2)) < 0.03:
            continue
        x = x - x.mean()
        ac = np.correlate(x, x, 'full')[frame - 1:]
        lo, hi = int(SR / 450), int(SR / 70)
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.3 * ac[0]:
            pitches.append(SR / k)
    return float(np.median(pitches)) if pitches else 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True, help='folder with kokoro-v1.0.onnx and voices-v1.0.bin')
    ap.add_argument('--only', default='', help='comma-separated voices to record (default: all)')
    ap.add_argument('--force', action='store_true', help='record again even if the clip exists')
    ap.add_argument('--sample', type=int, default=0, help='record only the first N lines of each voice (for a quick check)')
    ap.add_argument('--migrate', action='store_true', help='rename clips recorded under the old naming (voice|text) to the current names, without recording')
    ap.add_argument('--songs', action='store_true', help='record only the sung lines (songs.json)')
    args = ap.parse_args()

    from kokoro_onnx import Kokoro  # imported here so --help works without the engine

    cast = json.load(open(os.path.join(GAME, 'src', 'data', 'voice-cast.json'), encoding='utf-8'))
    global PROSODY
    PROSODY = cast.get('prosody', '')
    tones = cast['tones']
    data = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
    if data['version'] != cast['version']:
        sys.exit('lines.json is out of date: run npx tsx tools/voices/export-lines.ts')
    out_dir = os.path.join(GAME, 'public', 'voices', cast['version'])
    os.makedirs(out_dir, exist_ok=True)
    man_path = os.path.join(out_dir, 'manifest.json')
    manifest = json.load(open(man_path, encoding='utf-8')) if os.path.exists(man_path) else {}

    songs = json.load(open(os.path.join(HERE, 'songs.json'), encoding='utf-8'))['songs']
    only = set(v for v in args.only.split(',') if v)
    todo = [l for l in data['lines'] if (not only or l['voice'] in only)]
    if args.songs:
        todo = [l for l in todo if l['text'] in songs]
    if args.sample:
        seen = {}
        todo = [l for l in todo if seen.setdefault(l['voice'], []).append(l) or len(seen[l['voice']]) <= args.sample]
    wanted = {l['key'] for l in data['lines']}

    # The game and this script must name clips the same way.
    for line in data['lines']:
        if f"{line['voice']}|{clip_name(line['voice'], cast['voices'][line['voice']], line['say'], line['tone'])}" != line['key']:
            sys.exit('clip names in lines.json do not match: run npx tsx tools/voices/export-lines.ts')

    if args.migrate:
        moved = 0
        for line in data['lines']:
            voice = line['voice']
            old = fnv1a(f"{voice}|{line['text']}")
            new = line['key'].split('|')[1]
            old_path, new_path = os.path.join(out_dir, voice, f'{old}.mp3'), os.path.join(out_dir, voice, f'{new}.mp3')
            if os.path.exists(old_path) and f'{voice}|{old}' in manifest and not os.path.exists(new_path):
                os.replace(old_path, new_path)
                manifest[line['key']] = manifest.pop(f'{voice}|{old}')
                moved += 1
        json.dump(manifest, open(man_path, 'w', encoding='utf-8'), separators=(',', ':'))
        print(f'renamed {moved} clips to the current names')
        return

    kokoro = Kokoro(os.path.join(args.models, 'kokoro-v1.0.onnx'), os.path.join(args.models, 'voices-v1.0.bin'))
    pitches = {}
    done = 0
    t0 = time.time()
    for line in todo:
        voice = line['voice']
        cfg = cast['voices'][voice]
        key = line['key']
        name = key.split('|')[1]
        path = os.path.join(out_dir, voice, f'{name}.mp3')
        if not args.force and os.path.exists(path) and key in manifest:
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        lang = 'en-gb' if cfg['model'].startswith('b') else 'en-us'
        if line['text'] in songs:
            # A song: sung on its melody over a backing track, words on the beat.
            sung, starts = sing(kokoro, line['say'], cfg, songs[line['text']], caption_words(line['text']), lang)
            lead = 0.06
            audio = normalise(np.concatenate([np.zeros(int(lead * SR), dtype=np.float32), sung]), -17.0)
            sf.write(path, audio, SR, format='MP3', subtype='MPEG_LAYER_III')
            manifest[key] = [round(len(audio) / SR, 3), [round(s + lead, 3) for s in starts]]
            done += 1
            print(f'sang: {line["text"]} ({manifest[key][0]}s)', flush=True)
            continue
        tone = tones.get(line['tone'], tones['plain'])
        semis = cfg.get('semitones', 0)
        ratio = 2 ** (semis / 12)
        speed = max(0.5, min(2.0, cfg.get('speed', 1.0) * tone.get('speed', 1.0) / ratio))
        audio, sr, timings = kokoro.create_timed(line['say'], voice=cfg['model'], speed=speed, lang=lang)
        audio = pitch_shift(np.asarray(audio, dtype=np.float32), semis)
        audio = act(audio, tone)
        if cfg.get('fx') == 'robot':
            audio = robot(audio)
        lead = 0.06
        audio = np.concatenate([np.zeros(int(lead * SR), dtype=np.float32), audio, np.zeros(int(0.12 * SR), dtype=np.float32)])
        audio = normalise(audio, -19.0 + tone.get('gain', 0))  # louder for excited lines, softer for sad ones
        sf.write(path, audio, SR, format='MP3', subtype='MPEG_LAYER_III')
        dur = round(len(audio) / SR, 3)
        starts = word_starts(timings, len(caption_words(line['text'])), ratio, lead)
        manifest[key] = [dur, starts] if starts else [dur, []]
        if voice not in pitches or len(pitches[voice]) < 3:
            pitches.setdefault(voice, []).append(median_pitch(audio))
        done += 1
        if done % 10 == 0:
            json.dump(manifest, open(man_path, 'w', encoding='utf-8'), separators=(',', ':'))
            print(f'{done}/{len(todo)} recorded ({time.time() - t0:.0f}s)', flush=True)

    # Drop clips for lines that no longer exist.
    removed = 0
    for key in list(manifest):
        if key not in wanted:
            voice, name = key.split('|')
            p = os.path.join(out_dir, voice, f'{name}.mp3')
            if os.path.exists(p):
                os.remove(p)
            del manifest[key]
            removed += 1
    json.dump(manifest, open(man_path, 'w', encoding='utf-8'), separators=(',', ':'))
    timed = sum(1 for v in manifest.values() if v[1])
    print(f'recorded {done}, removed {removed}, total clips {len(manifest)}, with word timings {timed}')
    if pitches:
        print('median pitch by voice (Hz):')
        for v, ps in sorted(pitches.items(), key=lambda kv: np.median(kv[1])):
            print(f'  {v:9s} {np.median(ps):6.0f}')


if __name__ == '__main__':
    main()
