import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Party Galaxy',
    short_name: 'Party Galaxy',
    description: 'An anime adventure where you lead a crew through a galaxy of silly game worlds.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#120E2B',
    theme_color: '#120E2B',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
