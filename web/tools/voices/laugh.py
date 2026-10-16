"""
The whole crew laughing together (sound effect `laugh` in src/lib/sfx.ts), made from the crew's own voices:
each child's voice laughs with the excited tone, a moment apart, mixed into one clip in public/sfx/.

  python tools/voices/laugh.py --models <folder with kokoro-v1.0.onnx and voices-v1.0.bin>
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from generate import SR, act, normalise, pitch_shift  # noqa: E402

HERE = os.path.dirname(__file__)
WEB = os.path.abspath(os.path.join(HERE, '..', '..'))
# Who laughs, what they say, and when they start (seconds). Different laughs so it sounds like a group.
LAUGHS = [
    ('kiki', 'Ha ha ha ha ha ha!', 0.0),
    ('bunty', 'Hee hee hee hee hee!', 0.25),
    ('you-a', 'Ha ha ha ha!', 0.45),
    ('ro', 'Ha ha ha ha ha!', 0.7),
    ('meera', 'Ha ha ha ha!', 0.95),
    ('kiki', 'Hee hee hee!', 1.6),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True)
    args = ap.parse_args()
    from kokoro_onnx import Kokoro
    cast = json.load(open(os.path.join(WEB, 'src', 'data', 'voice-cast.json'), encoding='utf-8'))
    tone = cast['tones']['excited']
    kokoro = Kokoro(os.path.join(args.models, 'kokoro-v1.0.onnx'), os.path.join(args.models, 'voices-v1.0.bin'))
    parts = []
    for voice, text, start in LAUGHS:
        cfg = cast['voices'][voice]
        semis = cfg.get('semitones', 0)
        ratio = 2 ** (semis / 12)
        speed = max(0.5, min(2.0, cfg.get('speed', 1.0) * tone.get('speed', 1.0) * 1.15 / ratio))
        lang = 'en-gb' if cfg['model'].startswith('b') else 'en-us'
        audio, _sr, _timings = kokoro.create_timed(text, voice=cfg['model'], speed=speed, lang=lang)
        audio = act(pitch_shift(np.asarray(audio, dtype=np.float32), semis), tone)
        audio = normalise(audio, -21.0)
        parts.append((int(start * SR), audio))
    length = max(off + len(a) for off, a in parts) + int(0.15 * SR)
    mix = np.zeros(length, dtype=np.float32)
    for off, a in parts:
        mix[off:off + len(a)] += a * 0.7
    mix = normalise(mix, -18.0)
    out_dir = os.path.join(WEB, 'public', 'sfx')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, 'crew-laugh.mp3')
    sf.write(out, mix, SR, format='MP3', subtype='MPEG_LAYER_III')
    print(f'crew laugh: {len(mix) / SR:.2f}s -> {out}')


if __name__ == '__main__':
    main()
