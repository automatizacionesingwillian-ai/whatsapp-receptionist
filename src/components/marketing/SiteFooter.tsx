import Link from 'next/link';

const FOOTER_COLUMNS = [
  {
    title: 'Producto',
    links: [
      { href: '/#features', label: 'Funcionalidades' },
      { href: '/pricing', label: 'Planes y precios' },
      { href: '/verticali/dental', label: 'Para dentistas' },
      { href: '/verticali/beauty', label: 'Para centros de estética' },
      { href: '/verticali/fitness', label: 'Para gimnasios y PT' },
      { href: '/verticali/professional', label: 'Servicios profesionales' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/case-studies', label: 'Casos de éxito' },
      { href: '/blog', label: 'Blog' },
      { href: '/changelog', label: 'Changelog' },
      { href: '/docs', label: 'Documentación' },
      { href: '/help', label: 'Centro de ayuda' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/about', label: 'Quiénes somos' },
      { href: '/contact', label: 'Contacto' },
      { href: '/status', label: 'Estado del servicio' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Política de privacidad' },
      { href: '/legal/terms', label: 'Términos' },
      { href: '/legal/dpa', label: 'DPA' },
      { href: '/legal/cookie', label: 'Política de cookies' },
      { href: '/legal/security', label: 'Seguridad' },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col stack stack-3">
            <Link href="/" className="site-logo">
              Ambrogio<span style={{ color: 'var(--color-accent)' }}>.ai</span>
            </Link>
            <p className="muted" style={{ fontSize: 'var(--text-sm)', maxWidth: '36ch' }}>
              Recepción AI siempre activa para PyMEs. WhatsApp, voz, reservas automáticas y ROI
              medible.
            </p>
            <div
              className="row"
              style={{ gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}
              data-testid="trust-badges"
            >
              <span className="badge badge-success" data-trust="hosted-eu">
                Hosted EU
              </span>
              <span className="badge badge-neutral" data-trust="gdpr">
                GDPR ready
              </span>
              <span className="badge badge-neutral" data-trust="italian">
                Hecho en la UE
              </span>
            </div>
            <address
              className="muted"
              style={{
                fontSize: 'var(--text-xs)',
                fontStyle: 'normal',
                lineHeight: 'var(--leading-relaxed)',
                marginTop: 'var(--space-3)',
              }}
            >
              Ambrogio.ai · Roma, Italia
              <br />
              <a href="mailto:hello@ambrogio.ai" style={{ color: 'var(--color-text-secondary)' }}>
                hello@ambrogio.ai
              </a>
            </address>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div className="footer-col" key={column.title}>
              <h4>{column.title}</h4>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <hr className="divider" />
        <div className="row-between" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            © {new Date().getFullYear()} Ambrogio.ai — Hecho con cuidado en la UE.
          </p>
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            v0.1.0 ·{' '}
            <Link href="/status" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              <span className="sr-only">Estado del servicio: </span>
              <span aria-hidden="true">● </span>
              Operativo
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
