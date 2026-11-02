import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ambrogio.ai';

interface RssEntry {
  date: string;
  isoDate: string;
  title: string;
  body: string;
  category: string;
}

const ENTRIES: RssEntry[] = [
  {
    date: '8 de mayo de 2026',
    isoDate: 'Thu, 08 May 2026 10:00:00 -0600',
    title: 'Lanzamiento beta privada · v0.1.0',
    body: 'Ambrogio.ai entra en beta privada. WhatsApp + voice + Google Calendar + Stripe billing + facturación electrónica.',
    category: 'Nuevo',
  },
  {
    date: '5 de mayo de 2026',
    isoDate: 'Mon, 05 May 2026 10:00:00 -0600',
    title: 'CSP con nonce + GDPR Arts. 15/17',
    body: 'Hardening completo: CSP con nonce por request, COEP/COOP/CORP, endpoints de exportación y eliminación GDPR, rate limiting Upstash en todos los endpoints sensibles.',
    category: 'Seguridad',
  },
  {
    date: '2 de mayo de 2026',
    isoDate: 'Fri, 02 May 2026 10:00:00 -0600',
    title: 'TypeScript strict + exactOptionalPropertyTypes',
    body: 'Tooling DX: ESLint 9 + Prettier + Husky pre-commit, webhook de Stripe con discriminant guards type-safe.',
    category: 'Mejora',
  },
  {
    date: '27 de abril de 2026',
    isoDate: 'Mon, 27 Apr 2026 10:00:00 -0600',
    title: 'AI booking extractor v1',
    body: 'Extracción estructurada de intent, servicio, fecha/hora y urgencia desde conversaciones de WhatsApp. Eval set determinístico.',
    category: 'Nuevo',
  },
  {
    date: '24 de abril de 2026',
    isoDate: 'Fri, 24 Apr 2026 10:00:00 -0600',
    title: 'Backend MVP scaffolding',
    body: 'Setup inicial Next 15 + Supabase con RLS, auth multi-tenant, webhooks de Stripe y WhatsApp con verificación de firma.',
    category: 'Nuevo',
  },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET(): NextResponse {
  const items = ENTRIES.map(
    (entry) => `
  <item>
    <title>${escapeXml(entry.title)}</title>
    <link>${SITE_URL}/changelog</link>
    <guid isPermaLink="false">${SITE_URL}/changelog#${escapeXml(entry.isoDate)}</guid>
    <pubDate>${entry.isoDate}</pubDate>
    <category>${escapeXml(entry.category)}</category>
    <description>${escapeXml(entry.body)}</description>
  </item>`,
  ).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ambrogio.ai Changelog</title>
    <link>${SITE_URL}/changelog</link>
    <description>Actualizaciones, nuevas funciones y fixes de Ambrogio.ai.</description>
    <language>es-419</language>
    <atom:link href="${SITE_URL}/changelog/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>Thu, 08 May 2026 10:00:00 -0600</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
