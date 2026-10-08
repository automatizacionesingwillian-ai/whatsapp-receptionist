import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
});

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://ambrogio.ai';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ambrogio.ai — recepcionista con IA para negocios',
    template: '%s · Ambrogio.ai',
  },
  description:
    'WhatsApp, voz y reservas automáticas. Sin llamadas perdidas ni clientes que se van. Configuración en 24 h.',
  applicationName: 'Ambrogio.ai',
  authors: [{ name: 'Ambrogio.ai Team', url: SITE_URL }],
  creator: 'Ambrogio.ai Team',
  publisher: 'Ambrogio.ai',
  generator: 'Next.js',
  keywords: [
    'recepcionista IA',
    'recepción virtual',
    'WhatsApp Business automático',
    'reservas automáticas',
    'IA para clínicas dentales',
    'IA para centros de estética',
    'IA para gimnasios',
    'servicios profesionales',
    'Latinoamérica',
    'GDPR',
  ],
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'es_419',
    url: SITE_URL,
    siteName: 'Ambrogio.ai',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ambrogio_ai',
    creator: '@ambrogio_ai',
  },
  alternates: {
    canonical: '/',
    languages: {
      'es-419': SITE_URL,
      'x-default': SITE_URL,
    },
    types: {
      'application/rss+xml': `${SITE_URL}/changelog/feed.xml`,
    },
  },
  appleWebApp: {
    capable: true,
    title: 'Ambrogio.ai',
    statusBarStyle: 'default',
  },
  other: {
    'msapplication-TileColor': '#0d766e',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d766e',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  name: 'Ambrogio.ai',
  url: SITE_URL,
  inLanguage: 'es-419',
  publisher: { '@id': `${SITE_URL}#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/help?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const headerList = await headers();
  const nonce = headerList.get('x-nonce') ?? undefined;

  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://api.elevenlabs.io" />
        <link rel="dns-prefetch" href="https://graph.facebook.com" />
        <link rel="me" href="https://twitter.com/ambrogio_ai" />
        <link rel="me" href="https://linkedin.com/company/ambrogio-ai" />
        <link rel="alternate" hrefLang="es-419" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <meta name="author" content="Ambrogio.ai Team" />
        <meta name="application-name" content="Ambrogio.ai" />
        <meta name="apple-mobile-web-app-title" content="Ambrogio.ai" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0d766e" />
        <meta name="format-detection" content="telephone=no" />
        {/*
          Los navegadores quitan el atributo `nonce` del DOM tras aplicar CSP:
          sin suppressHydrationWarning React marca un mismatch SSR/cliente.
        */}
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body data-csp-nonce={nonce}>
        <a href="#main" className="skip-link">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
