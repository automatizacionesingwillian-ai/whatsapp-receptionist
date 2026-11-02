import type { Metadata } from 'next';
import Link from 'next/link';

import { buildBreadcrumbSchema, JsonLd } from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Casos de estudio · Programa piloto',
  description:
    'Ningún caso de estudio publicado: Ambrogio.ai está en beta. Publicaremos resultados solo cuando estén medidos y validados por el cliente.',
  alternates: { canonical: '/case-studies' },
  openGraph: {
    title: 'Casos de estudio Ambrogio.ai · Programa piloto',
    description: 'Resultados publicados solo cuando estén medidos y validados por el cliente.',
    url: '/case-studies',
    type: 'website',
    locale: 'es_419',
  },
};

/*
 * Esta página no expone `CollectionPage` con `hasPart`: aún no hay casos de
 * estudio que listar, y declarar a Google elementos inexistentes viola las
 * políticas de datos estructurados.
 */

const COMMITMENTS = [
  {
    title: 'Métricas medidas, no estimadas',
    body: 'Comparación entre los 90 días previos y los 90 posteriores a la activación, con datos del sistema del cliente, no con nuestras proyecciones.',
  },
  {
    title: 'Validación firmada por el cliente',
    body: 'Ningún número se publica sin aprobación explícita y por escrito de quien lo generó, con nombre y rol verificables.',
  },
  {
    title: 'Método declarado por completo',
    body: 'Publicamos periodo, tamaño de la muestra y qué no es atribuible a Ambrogio. Un número sin método no es una prueba.',
  },
] as const;

export default function CaseStudiesPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Casos de estudio', url: '/case-studies' },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container">
            <div
              className="stack stack-4"
              style={{ maxWidth: '720px', marginBottom: 'var(--space-12)' }}
            >
              <span className="badge">Casos de estudio</span>
              <h1 className="display text-balance">Ningún caso de estudio publicado. Todavía no.</h1>
              <p className="lead text-pretty">
                Ambrogio.ai está en beta con los primeros estudios piloto. Aún no tenemos resultados
                medidos en un periodo lo bastante largo como para publicarlos como prueba, y
                preferimos decirlo en lugar de llenar esta página de números plausibles.
              </p>
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
            >
              {COMMITMENTS.map((commitment) => (
                <article key={commitment.title} className="card card-padded stack stack-3">
                  <h2 style={{ fontSize: 'var(--text-lg)' }}>{commitment.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{commitment.body}</p>
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
              <h3>Mientras tanto, puedes verificar el producto tú mismo</h3>
              <p className="muted" style={{ maxWidth: '56ch' }}>
                El código es público con licencia MIT: puedes leerlo, instalarlo y probarlo sin
                pedir permiso a nadie. Es la forma de prueba que podemos ofrecer hoy.
              </p>
              <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <a
                  href="https://github.com/Hiberius/whatsapp-receptionist"
                  className="btn btn-primary"
                  rel="noreferrer"
                >
                  Ver el código en GitHub
                </a>
                <Link href="/contact" className="btn btn-secondary">
                  Participar en el programa piloto
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
