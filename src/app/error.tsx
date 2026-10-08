'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global client-side error boundary.
 *
 * Since error.tsx is a client component it cannot export `metadata`.
 * We inject `noindex` and a contextual title into the document head on mount
 * so SERPs do not capture transient error states.
 */
export default function GlobalError({ error, reset }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    // Le digest sono disponibili lato client per matching con i log server.
    // Niente console.log su PII; il logger server gestisce il dettaglio.

    // Inject noindex meta + custom title for crawlers that may still pick up
    // this rendered output. Cleaned up on unmount to avoid leaking state.
    const previousTitle = document.title;
    document.title = 'Error · Ambrogio.ai';

    const robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');
    document.head.appendChild(robotsMeta);

    return () => {
      document.title = previousTitle;
      robotsMeta.remove();
    };
  }, [error]);

  return (
    <main
      id="main"
      style={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-section) 0',
        background: 'var(--color-bg)',
      }}
    >
      <div className="container-narrow stack stack-6 text-center">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-5xl)',
            fontWeight: 700,
            color: 'var(--color-danger)',
          }}
          aria-hidden="true"
        >
          ⚠
        </span>
        <div className="stack stack-3" style={{ alignItems: 'center' }}>
          <h1 className="text-balance">Algo salió mal.</h1>
          <p className="lead text-pretty">
            Ya recibimos el reporte y estamos trabajando en ello. Mientras tanto, intenta recargar
            la página. Si persiste, escríbenos desde el centro de ayuda.
          </p>
          {error.digest ? (
            <p className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
              Referencia del error: {error.digest}
            </p>
          ) : null}
        </div>
        <div className="row" style={{ gap: 'var(--space-3)', justifyContent: 'center' }}>
          <button type="button" onClick={reset} className="btn btn-primary btn-lg">
            Reintentar
          </button>
          <Link href="/" className="btn btn-secondary btn-lg">
            Volver al inicio
          </Link>
          <Link href="/help" className="btn btn-ghost btn-lg">
            Contáctanos
          </Link>
        </div>
      </div>
    </main>
  );
}
