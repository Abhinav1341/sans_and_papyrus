// UI icons, anime emote bubbles (manpu) and collectible art. All inline SVG strings,
// rendered with the <Svg> component (trusted, generated in code, never from user input).
const wrap = (body: string, vb = '0 0 24 24') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
const st = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';

export const ICON = {
  play: wrap('<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>'),
  pause: wrap(`<rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/>`),
  home: wrap(`<path d="M3 11.5 12 4l9 7.5" ${st}/><path d="M5.5 10v9.5h13V10" ${st}/><path d="M10 19.5v-5h4v5" ${st}/>`),
  gear: wrap(`<path d="M10.3 3h3.4l.5 2.4 1.7.7 2-1.4 2.4 2.4-1.4 2 .7 1.7 2.4.5v3.4l-2.4.5-.7 1.7 1.4 2-2.4 2.4-2-1.4-1.7.7-.5 2.4h-3.4l-.5-2.4-1.7-.7-2 1.4-2.4-2.4 1.4-2-.7-1.7L3 13.7v-3.4l2.4-.5.7-1.7-1.4-2 2.4-2.4 2 1.4 1.7-.7z" ${st}/><circle cx="12" cy="12" r="3" ${st}/>`),
  user: wrap(`<circle cx="12" cy="8.5" r="4" ${st}/><path d="M4 20.5c1.4-4 4.4-6 8-6s6.6 2 8 6" ${st}/>`),
  lock: wrap(`<rect x="5" y="11" width="14" height="10" rx="2.5" ${st}/><path d="M8 11V8a4 4 0 0 1 8 0v3" ${st}/>`),
  back: wrap(`<path d="M15 5l-7 7 7 7" ${st}/>`),
  close: wrap(`<path d="M6 6l12 12M18 6 6 18" ${st}/>`),
  auto: wrap(`<circle cx="12" cy="12" r="9" ${st}/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/>`),
  log: wrap(`<path d="M5 6h14M5 12h14M5 18h9" ${st}/>`),
  speaker: wrap(`<path d="M4 9.5h4l5-4v13l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" ${st}/>`),
  mute: wrap(`<path d="M4 9.5h4l5-4v13l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" ${st}/>`),
  voice: wrap(`<path d="M5 18c0-3 2-4.5 4.5-4.5h1" ${st}/><circle cx="9" cy="8" r="3.5" ${st}/><path d="M15 8.5c1.2 1 1.2 3 0 4M17.6 6.5c2.4 2.2 2.4 5.8 0 8" ${st}/>`),
  moon: wrap(`<path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5z" fill="currentColor"/>`),
  text: wrap(`<path d="M5 6h14M12 6v13M8.5 19h7" ${st}/>`),
  skip: wrap('<path d="M4.5 5v14l9-7zM13 5v14l9-7z" fill="currentColor"/>'),
  next: wrap(`<path d="M9 5l7 7-7 7" ${st}/>`),
  down: wrap('<path d="M5 8l7 8 7-8z" fill="currentColor"/>'),
  star: wrap('<path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z" fill="currentColor"/>'),
  map: wrap(`<path d="M3 6.5 9 4l6 2.5 6-2.5v13.5L15 20l-6-2.5L3 20z" ${st}/><path d="M9 4v13.5M15 6.5V20" ${st}/>`),
  grownup: wrap(`<circle cx="8" cy="7" r="3" ${st}/><circle cx="17" cy="10" r="2.2" ${st}/><path d="M3 20c.6-4 2.6-6 5-6s4.4 2 5 6M13.5 20c.4-2.6 1.7-4 3.5-4s3.1 1.4 3.5 4" ${st}/>`),
  check: wrap(`<path d="M5 12.5l4.5 4.5L19 7.5" ${st}/>`),
  mail: wrap(`<rect x="3" y="5.5" width="18" height="13" rx="2.5" ${st}/><path d="M3.5 7l8.5 6.5L20.5 7" ${st}/>`),
  rocket: wrap(`<path d="M12 3c3.5 2 5 5.5 5 9.5l-2.5 3h-5L7 12.5C7 8.5 8.5 5 12 3z" ${st}/><circle cx="12" cy="10" r="1.8" fill="currentColor"/><path d="M9.5 15.5 8 20l2.5-1.5M14.5 15.5 16 20l-2.5-1.5" ${st}/>`),
  heart: wrap('<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="currentColor"/>'),
  replay: wrap(`<path d="M4 12a8 8 0 1 0 2.6-5.9" ${st}/><path d="M4 4v4.5h4.5" ${st}/><path d="M10 9v6l5-3z" fill="currentColor"/>`),
  film: wrap(`<rect x="3" y="5" width="18" height="14" rx="2.5" ${st}/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" ${st}/>`),
  music: wrap(`<path d="M9 17.5V6l10-2v11.5" ${st}/><circle cx="6.5" cy="17.5" r="2.5" fill="currentColor"/><circle cx="16.5" cy="15.5" r="2.5" fill="currentColor"/>`),
  book: wrap(`<path d="M4 5.5c2.5-1 5.5-1 8 .8 2.5-1.8 5.5-1.8 8-.8v13c-2.5-1-5.5-1-8 .8-2.5-1.8-5.5-1.8-8-.8z" ${st}/><path d="M12 6.3v13" ${st}/>`),
  speed: wrap(`<path d="M4 16a8 8 0 1 1 16 0" ${st}/><path d="M12 16l4-5" ${st}/>`),
  sliders: wrap(`<path d="M6 4v16M12 4v16M18 4v16" ${st}/><circle cx="6" cy="14" r="2.2" fill="currentColor"/><circle cx="12" cy="8" r="2.2" fill="currentColor"/><circle cx="18" cy="15" r="2.2" fill="currentColor"/>`),
  download: wrap(`<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" ${st}/><path d="M5 19h14" ${st}/>`),
  phone: wrap(`<rect x="7" y="2.5" width="10" height="19" rx="2.5" ${st}/><path d="M11 18.5h2" ${st}/>`),
};

export type IconName = keyof typeof ICON;

export const GOOGLE_G = `<svg class="google-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

/* ---------- emote bubbles (anime reactions) ---------- */
const bubble = (inner: string) => `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 4C15 4 5 13 5 25s10 21 25 21c3 0 6-.5 8.5-1.3L48 52l-1.5-11C52 37 55 31.5 55 25 55 13 45 4 30 4z" fill="#fff" stroke="#1a1022" stroke-width="3"/>${inner}</svg>`;
export const EMOTE: Record<string, string> = {
  '!': bubble('<path d="M30 12v18" stroke="#ff8f3e" stroke-width="7" stroke-linecap="round"/><circle cx="30" cy="38" r="4" fill="#ff8f3e"/>'),
  '?': bubble('<path d="M23 18c0-5 4-7 7.5-7s7.5 2.5 7.5 7c0 6-7.5 6-7.5 12" stroke="#7B61FF" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="30.5" cy="38" r="4" fill="#7B61FF"/>'),
  sweat: `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 6C26 18 18 26 18 36a12 12 0 0 0 24 0c0-10-8-18-12-30z" fill="#8fc8ff" stroke="#3f6fb0" stroke-width="3"/><path d="M24 36a6 6 0 0 0 4 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  note: bubble('<path d="M24 34V14l14-3v18" stroke="#ff7ab8" stroke-width="4" fill="none"/><ellipse cx="21" cy="34" rx="5" ry="4" fill="#ff7ab8"/><ellipse cx="35" cy="30" rx="5" ry="4" fill="#ff7ab8"/>'),
  anger: `<svg viewBox="0 0 60 60" aria-hidden="true"><g stroke="#ff7a9a" stroke-width="6" stroke-linecap="round" fill="none"><path d="M14 22c6 0 8-2 8-8M38 14c0 6 2 8 8 8M46 38c-6 0-8 2-8 8M22 46c0-6-2-8-8-8"/></g></svg>`,
  dots: bubble('<circle cx="19" cy="25" r="4" fill="#1a1022"/><circle cx="30" cy="25" r="4" fill="#1a1022"/><circle cx="41" cy="25" r="4" fill="#1a1022"/>'),
  heart: bubble('<path d="M30 37s-11-6.5-11-14a6.5 6.5 0 0 1 11-4.5A6.5 6.5 0 0 1 41 23c0 7.5-11 14-11 14z" fill="#ff7ab8"/>'),
  idea: bubble('<path d="M30 10a10 10 0 0 0-6 18v5h12v-5a10 10 0 0 0-6-18z" fill="#ffd36e" stroke="#c99a2e" stroke-width="2.5"/><path d="M25 37h10" stroke="#c99a2e" stroke-width="3" stroke-linecap="round"/>'),
  zzz: bubble('<text x="30" y="33" font-family="Baloo 2, sans-serif" font-weight="800" font-size="20" fill="#7B61FF" text-anchor="middle">zzz</text>'),
  sparkle: `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 4l5 19 19 7-19 6-5 20-5-20-19-6 19-7z" fill="#ffd36e" stroke="#c99a2e" stroke-width="2"/></svg>`,
  shine: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l2.5 8.5L23 12l-8.5 2.5L12 23l-2.5-8.5L1 12l8.5-2.5z" fill="currentColor"/></svg>`,
};

/* ---------- collectibles ---------- */
const COL = (body: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
export const COLLECTIBLE_ART: Record<string, string> = {
  'golden-token': COL('<circle cx="32" cy="32" r="24" fill="#ffd36e" stroke="#c99a2e" stroke-width="4"/><circle cx="32" cy="32" r="16" fill="none" stroke="#fff4c7" stroke-width="3"/><path d="M32 22l3 7 7 .6-5.3 4.6 1.6 7-6.3-3.8-6.3 3.8 1.6-7L22 29.6l7-.6z" fill="#fff4c7"/>'),
  'captain-badge': COL('<path d="M32 6l7 14 15 2-11 10 3 15-14-7-14 7 3-15L10 22l15-2z" fill="#ffd36e" stroke="#c99a2e" stroke-width="3"/><circle cx="32" cy="29" r="7" fill="#7B61FF"/>'),
  'rule-card': COL('<rect x="12" y="8" width="40" height="50" rx="6" fill="#fff" stroke="#7B61FF" stroke-width="4"/><path d="M20 20h24M20 29h24M20 38h16" stroke="#c9b6ff" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="46" r="7" fill="#8fc8ff"/>'),
  'candy-map': COL('<path d="M8 14l16-6 16 6 16-6v42l-16 6-16-6-16 6z" fill="#ffd1e8" stroke="#ff7ab8" stroke-width="3"/><path d="M24 8v42M40 14v42" stroke="#ff7ab8" stroke-width="2.5"/><circle cx="32" cy="30" r="5" fill="#7fe6c9"/>'),
  'wafer-paddle': COL('<rect x="28" y="6" width="8" height="30" rx="4" fill="#c48a64"/><rect x="20" y="34" width="24" height="24" rx="6" fill="#e8b878" stroke="#a8724a" stroke-width="3"/><path d="M26 34v24M32 34v24M38 34v24M20 42h24M20 50h24" stroke="#a8724a" stroke-width="1.5"/>'),
  'lollipop-stick': COL('<rect x="29" y="30" width="6" height="30" rx="3" fill="#fff8ee" stroke="#ddd" stroke-width="1.5"/><circle cx="32" cy="22" r="16" fill="#ff9fcf"/><path d="M32 22m-10 0a10 10 0 1 0 20 0a6 6 0 1 0-12 0" stroke="#ffd36e" stroke-width="4" fill="none"/>'),
  'sprinkle-shower': COL('<circle cx="32" cy="32" r="26" fill="#3b2f86"/><g stroke-linecap="round" stroke-width="5"><path d="M18 16l4 6" stroke="#ff9fcf"/><path d="M32 12l0 7" stroke="#7fe6c9"/><path d="M46 16l-4 6" stroke="#ffd36e"/><path d="M14 32l6 2" stroke="#8fc8ff"/><path d="M50 32l-6 2" stroke="#c9b6ff"/><path d="M24 42l3 5" stroke="#ffd36e"/><path d="M40 42l-3 5" stroke="#ff9fcf"/></g><circle cx="32" cy="32" r="7" fill="#ffd36e"/>'),
  'captains-call': COL('<circle cx="32" cy="32" r="26" fill="#7B61FF"/><path d="M20 26h8l10-8v28l-10-8h-8z" fill="#fff"/><path d="M42 24a10 10 0 0 1 0 16M46 19a16 16 0 0 1 0 26" stroke="#ffd36e" stroke-width="4" fill="none" stroke-linecap="round"/>'),
  locked: COL('<circle cx="32" cy="32" r="26" fill="#2a2163" stroke="#4b3f9a" stroke-width="3"/><text x="32" y="42" font-family="Baloo 2, sans-serif" font-weight="800" font-size="28" fill="#8f84d8" text-anchor="middle">?</text>'),
};
