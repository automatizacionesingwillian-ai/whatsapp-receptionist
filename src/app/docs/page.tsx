import type { Metadata } from 'next';
import Link from 'next/link';

import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  JsonLd,
} from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Documentación técnica',
  description:
    'Guías técnicas, integraciones, webhooks y API reference de Ambrogio.ai. Todo para desarrolladores y agencias.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'Documentación Ambrogio.ai',
    description: 'Guías técnicas, integraciones y API reference para desarrolladores.',
    url: '/docs',
    type: 'website',
    locale: 'es_419',
  },
};

interface DocItem {
  label: string;
  href: string;
}

interface DocSection {
  title: string;
  items: ReadonlyArray<DocItem>;
}

const SECTIONS: ReadonlyArray<DocSection> = [
  {
    title: 'Guías rápidas',
    items: [
      {
        label: 'Setup del número de WhatsApp Business',
        href: '/help/articles/come-collegare-il-numero-whatsapp-business',
      },
      {
        label: 'Conexión de Google Calendar',
        href: '/help/articles/come-autorizzare-google-calendar',
      },
      {
        label: 'Carga del tarifario de servicios',
        href: '/help/articles/caricare-il-listino-servizi',
      },
      {
        label: 'Configuración de horarios',
        href: '/help/articles/configurare-gli-orari-di-apertura',
      },
    ],
  },
  {
    title: 'AI y reservas',
    items: [
      { label: 'Filtro AI y clasificación', href: '/help/articles/come-funziona-il-filtro-ai' },
      { label: 'Cuándo interviene un humano', href: '/help/articles/quando-interviene-un-umano' },
      {
        label: 'Reserva de citas',
        href: '/help/articles/come-ambrogio-prenota-appuntamenti',
      },
      { label: 'Recordatorios automáticos', href: '/help/articles/reminder-automatici' },
    ],
  },
  {
    title: 'Cuenta y GDPR',
    items: [
      { label: 'Cambio de plan', href: '/help/articles/cambiare-piano' },
      {
        label: 'Facturación electrónica',
        href: '/help/articles/scaricare-fatture-elettroniche-sdi',
      },
      { label: 'Exportación de datos GDPR', href: '/help/articles/esportare-i-miei-dati-gdpr' },
      { label: 'Eliminación de cuenta', href: '/help/articles/cancellare-account' },
    ],
  },
];

export default function DocsPage() {
  const allItems = SECTIONS.flatMap((s) => s.items);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Documentación', url: '/docs' },
        ])}
      />
      <JsonLd
        data={buildCollectionPageSchema({
          name: 'Documentación Ambrogio.ai',
          description: 'Guías técnicas, integraciones y API reference.',
          url: '/docs',
          hasPart: allItems.map((it) => ({ name: it.label, url: it.href })),
        })}
      />
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container">
            <div
              className="stack stack-4"
              style={{ maxWidth: '720px', marginBottom: 'var(--space-12)' }}
            >
              <span className="badge">Documentación</span>
              <h1 className="display text-balance">
                Todo lo que necesitas para integrar Ambrogio.
              </h1>
              <p className="lead text-pretty">
                Guías prácticas, ejemplos de código y best practices. Para estudios que quieren
                entender cómo funciona Ambrogio bajo el capó.
              </p>
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
            >
              {SECTIONS.map((section) => (
                <article key={section.title} className="card card-padded stack stack-4">
                  <h2 style={{ fontSize: 'var(--text-xl)' }}>{section.title}</h2>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="btn-link"
                          style={{ fontSize: 'var(--text-sm)' }}
                        >
                          → {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div
              className="card card-padded stack stack-4 text-center"
              style={{
                marginTop: 'var(--space-12)',
                background: 'var(--color-surface-sunken)',
                alignItems: 'center',
              }}
            >
              <h3>API Reference (próximamente)</h3>
              <p className="muted" style={{ maxWidth: '50ch' }}>
                La documentación completa de la API con webhooks, SDK y ejemplos estará disponible
                para clientes Professional y Agency en el Q3 2026.
              </p>
              <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Link href="/help" className="btn btn-secondary">
                  Centro de ayuda
                </Link>
                <Link href="/contact?topic=docs" className="btn btn-primary">
                  Solicitar acceso anticipado
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
