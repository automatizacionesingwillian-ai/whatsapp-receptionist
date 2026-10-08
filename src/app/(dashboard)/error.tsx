'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary dell'area autenticata. Resta dentro la shell della dashboard,
 * quindi l'utente mantiene la navigazione laterale invece di essere buttato
 * sulla pagina di errore globale.
 */
export default function DashboardError({ error, reset }: Readonly<DashboardErrorProps>) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Error · Ambrogio.ai';

    return () => {
      document.title = previousTitle;
    };
  }, [error]);

  return (
    <section className="card card-padded stack stack-4" role="alert">
      <div className="stack stack-2">
        <span className="eyebrow">Error</span>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>No pudimos cargar estos datos.</h1>
        <p className="muted">
          El problema es de nuestro lado, no tuyo: ninguna conversación se perdió y Ambrogio
          sigue respondiendo en WhatsApp. Reintenta en unos segundos.
        </p>
      </div>

      {error.digest ? (
        <p className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
          Referencia de error: {error.digest}
        </p>
      ) : null}

      <div className="row" style={{ gap: 'var(--space-3)' }}>
        <button type="button" onClick={reset} className="btn btn-primary">
          Reintentar
        </button>
        <Link href="/dashboard" className="btn btn-secondary">
          Volver al resumen
        </Link>
        <Link href="/help" className="btn btn-ghost">
          Contáctanos
        </Link>
      </div>
    </section>
  );
}
