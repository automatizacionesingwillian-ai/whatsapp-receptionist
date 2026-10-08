import Link from 'next/link';

const NAV_LINKS = [
  { href: '/#features', label: 'Funcionalidades' },
  { href: '/verticali', label: 'Verticales' },
  { href: '/pricing', label: 'Planes' },
  { href: '/blog', label: 'Blog' },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="container site-header-inner">
        <Link href="/" className="site-logo" aria-label="Ambrogio.ai - inicio">
          Ambrogio<span style={{ color: 'var(--color-accent)' }}>.ai</span>
        </Link>
        <nav aria-label="Navegación principal">
          <ul className="site-nav">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="row site-header-actions" style={{ gap: 'var(--space-3)' }}>
          <Link
            href="/pricing"
            className="btn btn-ghost btn-sm site-header-mobile-link"
            aria-label="Abrir menú (ir a planes)"
          >
            Menú
          </Link>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Iniciar sesión
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Prueba gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
