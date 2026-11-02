import { headers } from 'next/headers';

/**
 * JSON-LD inline component. Usa il CSP nonce se presente.
 * Server-side: produces a <script type="application/ld+json">.
 */
export async function JsonLd({ data }: Readonly<{ data: object }>) {
  const headerList = await headers();
  const nonce = headerList.get('x-nonce') ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Los navegadores quitan `nonce` del DOM tras aplicar CSP → mismatch SSR/client.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://ambrogio.ai';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: 'Ambrogio.ai',
  legalName: 'Ambrogio.ai',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/icon.svg`,
    width: 512,
    height: 512,
  },
  image: `${SITE_URL}/opengraph-image`,
  description:
    'Recepción AI siempre activa para negocios y PyMEs. WhatsApp, voz, reservas automáticas.',
  email: 'hello@ambrogio.ai',
  foundingDate: '2026-04-24',
  foundingLocation: { '@type': 'Country', name: 'México' },
  areaServed: { '@type': 'Place', name: 'América Latina y Unión Europea' },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'MX',
    addressLocality: 'Ciudad de México',
    addressRegion: 'CDMX',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@ambrogio.ai',
      areaServed: 'LATAM',
      availableLanguage: ['Spanish', 'English'],
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'hello@ambrogio.ai',
      areaServed: 'LATAM',
      availableLanguage: ['Spanish', 'English'],
    },
    {
      '@type': 'ContactPoint',
      contactType: 'data protection officer',
      email: 'dpo@ambrogio.ai',
      areaServed: 'EU',
      availableLanguage: ['Spanish', 'English'],
    },
  ],
  knowsLanguage: ['es', 'en'],
  sameAs: ['https://twitter.com/ambrogio_ai', 'https://linkedin.com/company/ambrogio-ai'],
} as const;

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ambrogio.ai',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'AI Receptionist / Booking',
  operatingSystem: 'Web',
  url: SITE_URL,
  description:
    'Recepcionista AI para negocios y PyMEs. WhatsApp, voz, reservas automáticas, calendario sincronizado.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: '97',
    highPrice: '897',
    offerCount: 3,
    priceValidUntil: '2027-12-31',
  },
  // Ningún `aggregateRating`: solo se publica ante reseñas reales y
  // verificables. Declararlo sin reseñas viola las políticas de datos
  // estructurados de Google y configura una práctica comercial engañosa.
  inLanguage: 'es-419',
  publisher: { '@id': `${SITE_URL}#organization` },
} as const;

export {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqSchema,
  buildHowToSchema,
  buildPersonSchema,
  buildProductOffersSchema,
  buildServiceSchema,
  buildSpeakableSchema,
} from './schema-builders';

export {
  buildDefinedTermSetSchema,
  buildEventSchema,
  buildHowToEnrichedSchema,
  buildQAPageSchema,
  buildReviewSchema,
  buildWebPageSchema,
} from './schema-builders-aeo';
