import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rakshi Coco ERP',
    short_name: 'Rakshi Coco',
    description: 'Coconut Business Management & ERP System',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F8FAF6',
    theme_color: '#0B4A28',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
