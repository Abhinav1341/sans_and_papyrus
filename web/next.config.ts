import type { NextConfig } from 'next';

// The game runs in the browser inside Next.js. Cache Components (React Activity) would keep
// hidden routes mounted; game screens must stop voices, music and animation the moment the
// player leaves them, so the classic unmount-on-navigation model is used here.
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Lets a phone on the same Wi-Fi open the dev server (http://<laptop-ip>:3000) for testing.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*', '*.local'],
  async headers() {
    return [
      // The service worker must always be fresh, or players would keep an old version of the game.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      // Clip names include the voice settings and the text, so a clip never changes: cache it forever.
      { source: '/voices/:version/:voice/:clip', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // The list of clips changes whenever lines are recorded, so browsers always check it.
      { source: '/voices/:version/manifest.json', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
};

export default nextConfig;
