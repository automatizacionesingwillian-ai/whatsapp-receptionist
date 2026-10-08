import Image from 'next/image';
import Link from 'next/link';

const VERTICALS = [
  {
    slug: 'dental',
    title: 'Clínicas dentales',
    body: 'Higiene, urgencias, controles. Gestiona recall semestral y entiende cuándo hace falta el doctor.',
    icon: '/assets/site-images/ambrogio/svg/06-vertical-dental.svg',
    accent: 'oklch(45% 0.12 175)',
  },
  {
    slug: 'beauty',
    title: 'Centros de estética',
    body: 'Tratamientos, paquetes, gift cards. Cada servicio tiene su tiempo y precio; Ambrogio los conoce.',
    icon: '/assets/site-images/ambrogio/svg/07-vertical-beauty.svg',
    accent: 'oklch(60% 0.13 350)',
  },
  {
    slug: 'fitness',
    title: 'Gimnasios y entrenadores',
    body: 'Clases grupales, slots PT, membresías. Reduce abandonos con recordatorios humanos.',
    icon: '/assets/site-images/ambrogio/svg/08-vertical-fitness.svg',
    accent: 'oklch(55% 0.15 30)',
  },
  {
    slug: 'professional',
    title: 'Servicios profesionales',
    body: 'Abogados, contadores, consultores. Filtra solicitudes, entiende prioridades y agenda reuniones.',
    icon: '/assets/site-images/ambrogio/svg/09-vertical-professional-office.svg',
    accent: 'oklch(50% 0.10 250)',
  },
] as const;

export function VerticalsSection() {
  return (
    <section className="section section-divider" aria-labelledby="verticals-heading">
      <div className="container stack stack-12">
        <div className="stack stack-4" style={{ maxWidth: '52ch' }}>
          <span className="eyebrow">Verticales</span>
          <h2 id="verticals-heading" className="text-balance">
            Cuatro rubros, la misma promesa: ningún cliente perdido.
          </h2>
          <p className="lead">
            Ambrogio entiende el lenguaje de tu sector. Conoce servicios, tiempos y urgencias. Nada
            de respuestas robóticas.
          </p>
        </div>

        <div className="feature-grid stagger-children">
          {VERTICALS.map((v, index) => (
            <Link
              key={v.slug}
              href={`/verticali/${v.slug}`}
              className="card card-interactive stack stack-4 vertical-card"
              style={
                {
                  textDecoration: 'none',
                  color: 'inherit',
                  '--vertical-accent': v.accent,
                  '--i': index,
                } as React.CSSProperties
              }
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div className="vertical-icon-tile feature-icon-tile" aria-hidden="true">
                  <Image src={v.icon} alt="" width={36} height={36} />
                </div>
                <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{v.title}</h3>
              </div>
              <p style={{ color: 'var(--color-text-secondary)' }}>{v.body}</p>
              <span
                className="row plan-card-actions"
                style={{
                  gap: 'var(--space-2)',
                  color: v.accent,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                }}
              >
                Descubre el caso de uso <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
