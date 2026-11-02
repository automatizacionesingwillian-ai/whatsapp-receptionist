'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary del panel cross-tenant.
 *
 * Sustituye el error boundary global en las rutas admin: aquí el fallo más
 * probable no es un bug de aplicación sino una dependencia que no responde
 * (base de datos o proveedor externo). El mensaje lo dice explícitamente en
 * lugar de sugerir que el dato mostrado antes era válido.
 */
export default function AdminError({ error, reset }: Readonly<AdminErrorProps>) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Error · Admin';
    return () => {
      document.title = previousTitle;
    };
  }, [error]);

  return (
    <div className="stack stack-6">
      <div className="stack stack-2">
        <span className="badge badge-danger">Error</span>
        <h1>Panel no disponible</h1>
        <p className="muted">
          Falló la carga de los datos cross-tenant. No se muestra ningún valor: preferimos una
          página vacía a números no verificados.
        </p>
      </div>

      <section className="card stack stack-4">
        <p style={{ fontSize: 'var(--text-sm)' }}>
          Causas típicas: base de datos Supabase no alcanzable, credenciales de servicio no
          configuradas, o timeout de un proveedor externo. El estado de cada dependencia también
          se puede consultar fuera del panel en <code className="mono">/api/health/deep</code>.
        </p>

        {error.digest ? (
          <p className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
            Referencia de error: {error.digest}
          </p>
        ) : null}

        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <button type="button" onClick={reset} className="btn btn-primary">
            Reintentar
          </button>
          <Link href="/admin" className="btn btn-secondary">
            Volver al overview
          </Link>
          <Link href="/status" className="btn btn-ghost">
            Estado de dependencias
          </Link>
        </div>
      </section>
    </div>
  );
}
