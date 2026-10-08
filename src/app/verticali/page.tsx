import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  JsonLd,
} from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Verticales · Sectores de Ambrogio.ai',
  description:
    'Clínicas dentales, centros de estética, gimnasios y negocios profesionales. Recepción AI ajustada a tu sector con prompts y flujos dedicados.',
  alternates: { canonical: '/verticali' },
  openGraph: {
    title: 'Verticales cubiertos por Ambrogio.ai',
    description: 'Cuatro sectores, una plataforma. Recepción AI ajustada a tu oficio.',
    url: '/verticali',
    type: 'website',
    locale: 'es_419',
  },
};

const VERTICALS = [
  {
    slug: 'dental',
    title: 'Clínicas dentales',
    body: 'Higiene, urgencias, controles, ortodoncia. Ambrogio distingue dolor agudo de una solicitud de presupuesto.',
    icon: '/assets/site-images/ambrogio/svg/06-vertical-dental.svg',
    benefits: [
      'Filtra urgencias reales',
      'Recordatorios semestrales automáticos',
      'Pre-anamnesis por chat',
    ],
  },
  {
    slug: 'beauty',
    title: 'Centros de estética y SPA',
    body: 'Tratamientos, paquetes, tarjetas regalo. Cada servicio tiene su tiempo, costo y material.',
    icon: '/assets/site-images/ambrogio/svg/07-vertical-beauty.svg',
    benefits: ['Tarifario dinámico', 'Promociones de temporada', 'Tarjetas regalo y membresías'],
  },
  {
    slug: 'fitness',
    title: 'Gimnasios y entrenadores personales',
    body: 'Clases grupales, slots de PT, membresías, cupos limitados. Reduce bajas con recordatorios humanos.',
    icon: '/assets/site-images/ambrogio/svg/08-vertical-fitness.svg',
    benefits: ['Calendario de clases', 'Lista de espera inteligente', 'Recordatorio pre-clase'],
  },
  {
    slug: 'professional',
    title: 'Negocios profesionales',
    body: 'Abogados, contadores, consultores. Filtra solicitudes, califica leads y agenda solo reuniones que valen.',
    icon: '/assets/site-images/ambrogio/svg/09-vertical-professional-office.svg',
    benefits: ['Calificación de leads', 'Briefing automático', 'Confidencialidad primero'],
  },
] as const;

export default async function VerticalsIndexPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Verticales', url: '/verticali' },
        ])}
      />
      <JsonLd
        data={buildCollectionPageSchema({
          name: 'Verticales cubiertos por Ambrogio.ai',
          description: 'Cuatro sectores, prompts y flujos dedicados para cada uno.',
          url: '/verticali',
          hasPart: VERTICALS.map((v) => ({ name: v.title, url: `/verticali/${v.slug}` })),
        })}
      />
      <SiteHeader />
      <main id="main">
        <section
          className="section"
          style={{
            paddingTop: 'clamp(3rem, 4vw + 1rem, 5rem)',
            paddingBottom: 'var(--space-section)',
          }}
        >
          <div className="container">
            <div
              className="stack stack-4 text-center"
              style={{ maxWidth: '720px', margin: '0 auto var(--space-12)' }}
            >
              <span className="badge">4 verticales, 1 plataforma</span>
              <h1 className="display text-balance">
                Cada sector habla su idioma. Ambrogio lo conoce.
              </h1>
              <p className="lead text-pretty" style={{ margin: '0 auto' }}>
                Nada de IA genérica. Modelos, prompts y flujos ajustados a cómo se habla de verdad en
                cada oficio.
              </p>
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
            >
              {VERTICALS.map((v) => (
                <Link
                  key={v.slug}
                  href={`/verticali/${v.slug}`}
                  className="card card-padded card-interactive stack stack-4"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="feature-icon-tile" aria-hidden="true">
                    <Image src={v.icon} alt="" width={40} height={40} />
                  </div>
                  <h2 style={{ fontSize: 'var(--text-2xl)' }}>{v.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{v.body}</p>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                    }}
                  >
                    {v.benefits.map((b) => (
                      <li
                        key={b}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <span
                    className="row plan-card-actions"
                    style={{
                      gap: 'var(--space-2)',
                      color: 'var(--color-accent)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Ver caso de uso completo <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
