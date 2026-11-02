import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ambrogio.ai',
    short_name: 'Ambrogio',
    description:
      'Recepción AI siempre activa para estudios y PyMEs. WhatsApp, voz y reservas automáticas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8faf8',
    theme_color: '#0d766e',
    lang: 'es-419',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['business', 'productivity'],
  };
}
