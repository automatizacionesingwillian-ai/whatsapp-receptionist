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
  title: 'Centro de ayuda',
  description:
    'Guías paso a paso, FAQ y contacto directo para configurar WhatsApp, Google Calendar, facturación y GDPR de tu recepción AI.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Centro de ayuda Ambrogio.ai',
    description: 'Guías prácticas, FAQ y contacto directo para tu recepción AI.',
    url: '/help',
    type: 'website',
    locale: 'es_419',
  },
};

interface HelpItem {
  label: string;
  slug: string;
}

interface HelpTopic {
  title: string;
  items: ReadonlyArray<HelpItem>;
}

const TOPICS: ReadonlyArray<HelpTopic> = [
  {
    title: 'Configuración e incorporación',
    items: [
      {
        label: 'Cómo conectar el número de WhatsApp Business',
        slug: 'come-collegare-il-numero-whatsapp-business',
      },
      { label: 'Cómo autorizar Google Calendar', slug: 'come-autorizzare-google-calendar' },
      { label: 'Cargar el tarifario de servicios', slug: 'caricare-il-listino-servizi' },
      { label: 'Configurar horarios de apertura', slug: 'configurare-gli-orari-di-apertura' },
    ],
  },
  {
    title: 'Conversaciones',
    items: [
      { label: 'Cómo funciona el filtro AI', slug: 'come-funziona-il-filtro-ai' },
      { label: 'Cuándo interviene un humano', slug: 'quando-interviene-un-umano' },
      { label: 'Gestionar audios y multimedia', slug: 'gestire-vocali-e-media' },
      { label: 'Respuestas rápidas predefinidas', slug: 'risposte-rapide-preconfezionate' },
    ],
  },
  {
    title: 'Calendario y reservas',
    items: [
      { label: 'Cómo Ambrogio reserva citas', slug: 'come-ambrogio-prenota-appuntamenti' },
      { label: 'Gestionar conflictos de calendario', slug: 'gestire-conflitti-calendario' },
      { label: 'Recordatorios automáticos', slug: 'reminder-automatici' },
      { label: 'Gestionar cancelaciones', slug: 'gestire-le-disdette' },
    ],
  },
  {
    title: 'Cuenta y facturación',
    items: [
      { label: 'Cambiar de plan', slug: 'cambiare-piano' },
      { label: 'Descargar facturas electrónicas', slug: 'scaricare-fatture-elettroniche-sdi' },
      { label: 'Actualizar datos fiscales', slug: 'aggiornare-dati-piva' },
      { label: 'Exportar mis datos (GDPR)', slug: 'esportare-i-miei-dati-gdpr' },
      { label: 'Eliminar cuenta', slug: 'cancellare-account' },
    ],
  },
] as const;

export default async function HelpPage() {
  const allItems = TOPICS.flatMap((topic) => topic.items);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Inicio', url: '/' },
          { name: 'Centro de ayuda', url: '/help' },
        ])}
      />
      <JsonLd
        data={buildCollectionPageSchema({
          name: 'Centro de ayuda Ambrogio.ai',
          description: 'Guías prácticas, FAQ y tutoriales para usar Ambrogio.',
          url: '/help',
          hasPart: allItems.map((it) => ({
            name: it.label,
            url: `/help/articles/${it.slug}`,
          })),
        })}
      />
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container">
            <div
              className="stack stack-4 text-center"
              style={{ maxWidth: '720px', margin: '0 auto var(--space-12)' }}
            >
              <span className="badge">Centro de ayuda</span>
              <h1 className="display text-balance">¿Cómo podemos ayudarte?</h1>
              <p className="lead text-pretty" style={{ margin: '0 auto' }}>
                Guías, FAQ y canales directos. Respuesta en 4 horas hábiles para Starter, 1 hora para
                Professional, inmediata para Agency.
              </p>
              <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-3)' }}>
                <label htmlFor="help-search" className="sr-only">
                  Buscar en el centro de ayuda
                </label>
                <input
                  id="help-search"
                  type="search"
                  placeholder="Busca una guía o pregunta"
                  className="input"
                  style={{ maxWidth: '420px' }}
                />
                <button type="button" className="btn btn-primary">
                  Buscar
                </button>
              </div>
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
            >
              {TOPICS.map((topic) => (
                <article key={topic.title} className="card stack stack-4">
                  <h2 style={{ fontSize: 'var(--text-xl)' }}>{topic.title}</h2>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    {topic.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/help/articles/${item.slug}`}
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
          </div>
        </section>

        <section
          className="section section-divider"
          style={{ background: 'var(--color-surface-sunken)' }}
        >
          <div className="container">
            <div
              className="stack stack-6 text-center"
              style={{ maxWidth: '640px', margin: '0 auto' }}
            >
              <h2>¿No encontraste lo que buscabas?</h2>
              <p className="muted text-pretty">
                Contáctanos directamente. Respondemos en 4 horas hábiles.
              </p>
              <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-3)' }}>
                <Link href="/contact" className="btn btn-primary btn-lg">
                  Abrir un ticket
                </Link>
                <Link href="/status" className="btn btn-secondary btn-lg">
                  Estado del servicio
                </Link>
              </div>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                Correo directo:{' '}
                <a href="mailto:support@ambrogio.ai" className="btn-link">
                  support@ambrogio.ai
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
