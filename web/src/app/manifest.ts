import type { MetadataRoute } from 'next';

// The install manifest: lets Android, iPhone and desktop browsers add the game to the home screen
// so it opens full screen like an app. PNG icons are needed for installing (an SVG alone is not enough).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Party Galaxy',
    short_name: 'Party Galaxy',
    description: 'An anime adventure where you lead a crew through a galaxy of silly game worlds.',
    start_url: '/',
    scope: '/',
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'portrait',
    background_color: '#120E2B',
    theme_color: '#120E2B',
    categories: ['games', 'kids', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
