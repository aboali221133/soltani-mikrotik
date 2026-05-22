import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Soltani MikroTik Dashboard',
    short_name: 'SoltaniMT',
    description: 'Progressive Web App to dynamically manage multiple MikroTik routers via RouterOS v7',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      }
    ],
  }
}
