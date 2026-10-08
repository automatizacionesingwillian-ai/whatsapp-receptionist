import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description:
    'La página que buscas no existe o fue movida. Vuelve al inicio de Ambrogio.ai.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        style={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
          padding: 'var(--space-section) 0',
        }}
      >
        <div className="container-narrow stack stack-6 text-center">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(6rem, 4rem + 8vw, 12rem)',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: 'var(--color-accent)',
            }}
          >
            404
          </span>
          <div className="stack stack-3" style={{ alignItems: 'center' }}>
            <h1 className="text-balance">Esta página no responde.</h1>
            <p className="lead text-pretty">
              Tal vez colgó el teléfono. O quizá llegaste con un enlace incorrecto. En cualquier
              caso, Ambrogio sigue aquí para ayudarte a volver al camino.
            </p>
          </div>
          <div className="row" style={{ gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link href="/" className="btn btn-primary btn-lg">
              Volver al inicio
            </Link>
            <Link href="/help" className="btn btn-secondary btn-lg">
              Centro de ayuda
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
