// Party Galaxy service worker: makes the game installable and quick to reopen, and keeps it playing
// offline once a chapter has been heard. Only same-origin GET requests are handled.
//   - App code, fonts, icons and voice clips never change under the same name: cache first.
//   - Pages and the voice list can change: network first, cached copy when offline.
const SHELL = 'pg-shell-v2';
const ASSETS = 'pg-assets-v2';
const PAGES = ['/', '/home', '/login', '/hero', '/map', '/profile'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PAGES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, ASSETS]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))).catch(() => {}).then(() => self.clients.claim()),
  );
});

const immutable = (url) => url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')
  || (url.pathname.startsWith('/voices/') && url.pathname.endsWith('.mp3'));

// Storage can fail (private browsing, a full phone, a broken profile). Caching is only a bonus:
// whatever happens to the cache, the page always gets the network response.
async function openCache(name) {
  try { return await caches.open(name); } catch { return null; }
}

async function cacheFirst(req) {
  const cache = await openCache(ASSETS);
  const hit = cache ? await cache.match(req).catch(() => null) : null;
  if (hit) return hit;
  const res = await fetch(req);
  if (cache && res.ok && res.status === 200) {
    const copy = res.clone();
    cache.put(req, copy).catch(() => {});
  }
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const copy = res.clone();
      openCache(SHELL).then((c) => c && c.put(req, copy)).catch(() => {});
    }
    return res;
  } catch (err) {
    const cache = await openCache(SHELL);
    const hit = cache ? (await cache.match(req).catch(() => null)) || (req.mode === 'navigate' ? await cache.match('/home').catch(() => null) : null) : null;
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range')) return; // media range requests go straight to the network
  event.respondWith(immutable(url) ? cacheFirst(req) : networkFirst(req));
});
