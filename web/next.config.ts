import type { NextConfig } from 'next';

// The game runs in the browser inside Next.js. Cache Components (React Activity) would keep
// hidden routes mounted; game screens must stop voices, music and animation the moment the
// player leaves them, so the classic unmount-on-navigation model is used here.
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      // Clip names include the voice settings and the text, so a clip never changes: cache it forever.
      { source: '/voices/:version/:voice/:clip', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // The list of clips changes whenever lines are recorded, so browsers always check it.
      { source: '/voices/:version/manifest.json', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
};

export default nextConfig;
