// Things characters hold. Drawn in hand space: the hand is at (0,0) and +y continues along the
// forearm, so a prop always points the way the arm points.
import type { PropId } from './types';

const star = (cx: number, cy: number, r: number, fill: string, stroke = '#c99a2e') => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
};

export const PROPS: Record<PropId, string> = {
  token: `<circle cx="0" cy="12" r="13" fill="#ffd36e" stroke="#c99a2e" stroke-width="3"/><circle cx="0" cy="12" r="8" fill="none" stroke="#fff4c7" stroke-width="2"/>`,
  paddle: `<rect x="-4" y="-34" width="8" height="84" rx="4" fill="#c48a64" stroke="#8a5a3a" stroke-width="2"/><rect x="-15" y="44" width="30" height="40" rx="8" fill="#e8b878" stroke="#a8724a" stroke-width="3"/><path d="M-8 44v40M0 44v40M8 44v40M-15 58h30M-15 70h30" stroke="#a8724a" stroke-width="1.5"/>`,
  lollipop: `<rect x="-3" y="-4" width="6" height="56" rx="3" fill="#fff8ee" stroke="#d8cfc0" stroke-width="1.5"/><circle cx="0" cy="68" r="22" fill="#ff9fcf" stroke="#e0679f" stroke-width="2.5"/><path d="M0 68m-14 0a14 14 0 1 0 28 0a9 9 0 1 0 -18 0a4 4 0 1 0 8 0" stroke="#ffd36e" stroke-width="5" fill="none"/>`,
  lollipiece: `<rect x="-2" y="-2" width="4" height="26" rx="2" fill="#fff8ee"/><path d="M-12 30 L12 30 L0 50 Z" fill="#ff9fcf" stroke="#e0679f" stroke-width="2"/>`,
  gumball: `<rect x="-9" y="-6" width="18" height="52" rx="8" fill="#8fc8ff" stroke="#3f6fb0" stroke-width="2.5"/><path d="M-9 8h18M-9 22h18M-9 36h18" stroke="#fff" stroke-width="4"/><circle cx="0" cy="54" r="11" fill="#ff9fcf" stroke="#e0679f" stroke-width="2"/>`,
  shield: `<circle cx="0" cy="22" r="40" fill="#ff9fcf" stroke="#e0679f" stroke-width="4"/><circle cx="0" cy="22" r="28" fill="#ffd1e8"/><path d="M0 22m-18 0a18 18 0 1 0 36 0a11 11 0 1 0 -22 0a5 5 0 1 0 10 0" stroke="#7fe6c9" stroke-width="6" fill="none"/><ellipse cx="-14" cy="6" rx="10" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 -14 6)"/>`,
  map: `<rect x="-26" y="2" width="52" height="40" rx="5" fill="#ffd1e8" stroke="#ff7ab8" stroke-width="3"/><path d="M-9 2v40M9 2v40" stroke="#ff7ab8" stroke-width="2"/><circle cx="0" cy="22" r="5" fill="#7fe6c9"/><path d="M-20 34 q8 -10 16 -2 t16 -8" stroke="#8a5a3a" stroke-width="2" fill="none" stroke-dasharray="3 3"/>`,
  star: star(0, 26, 30, '#ffd36e'),
  candyfloss: `<rect x="-3" y="-4" width="6" height="44" rx="3" fill="#fff8ee"/><circle cx="-12" cy="52" r="16" fill="#ffc6e4"/><circle cx="10" cy="50" r="18" fill="#ffd1e8"/><circle cx="0" cy="66" r="17" fill="#ffb7dc"/>`,
  wafer: `<rect x="-24" y="4" width="48" height="30" rx="4" fill="#e8b878" stroke="#a8724a" stroke-width="2.5"/><path d="M-16 4v30M-8 4v30M0 4v30M8 4v30M16 4v30M-24 14h48M-24 24h48" stroke="#a8724a" stroke-width="1.2"/>`,
  sketchbook: `<rect x="-22" y="0" width="44" height="34" rx="4" fill="#fffaf0" stroke="#9a7cf0" stroke-width="3"/><path d="M-14 22 q6 -12 12 -2 t12 -6" stroke="#ff9fcf" stroke-width="2.5" fill="none"/><circle cx="10" cy="10" r="4" fill="#ffd36e"/>`,
  badge: star(0, 18, 18, '#ffd36e'),
  mic: `<rect x="-5" y="0" width="10" height="34" rx="5" fill="#3b2f86"/><circle cx="0" cy="40" r="10" fill="#c9c3f2"/>`,
  rulecard: `<rect x="-20" y="2" width="40" height="52" rx="6" fill="#fff" stroke="#7B61FF" stroke-width="3"/><path d="M-12 16h24M-12 26h24M-12 36h16" stroke="#c9b6ff" stroke-width="3.5" stroke-linecap="round"/>`,
  bow: `<path d="M0 -6 C-26 -30 -34 4 -4 2 C-34 14 -20 34 0 6 C20 34 34 14 4 2 C34 4 26 -30 0 -6 Z" fill="#ff8f7e" stroke="#c4554a" stroke-width="2.5"/><circle cx="0" cy="0" r="6" fill="#ffb3a6" stroke="#c4554a" stroke-width="2"/>`,
  gumdrop: `<path d="M-22 30 Q-22 2 0 0 Q22 2 22 30 Z" fill="#7fe6c9" stroke="#2a1838" stroke-width="3"/><ellipse cx="-8" cy="10" rx="5" ry="3" fill="#fff" opacity=".6"/>`,
  boots: `<path d="M-22 0h14v26c0 2 2 3 4 3h8c3 0 5 2 5 5v4h-31z" fill="#7fe6c9" stroke="#3fae90" stroke-width="2.5"/><path d="M4 4h14v26c0 2 2 3 4 3h8c3 0 5 2 5 5v4h-31z" fill="#7fe6c9" stroke="#3fae90" stroke-width="2.5"/>`,
};
