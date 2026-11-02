import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit log · Admin',
  robots: { index: false, follow: false },
};

/*
 * Esta página mostraba entradas de audit log inventadas (export GDPR,
 * eliminaciones, accesos) con fechas y actores ficticios.
 *
 * Es el caso más grave entre las pantallas admin con datos falsos: un registro
 * de audit sirve para demostrar qué ocurrió de verdad, en una verificación o
 * una controversia. Un registro con entradas fabricadas no es una pantalla
 * incompleta, es un documento falso — y la tabla `audit_log` real ya existe y
 * la escriben los endpoints GDPR, así que la ficción ocultaba datos verdaderos.
 *
 * El markup anterior permanece en el historial de git.
 */
export default function AdminAuditPage() {
  return (
    <div className="stack stack-6">
      <header className="stack stack-2">
        <span className="eyebrow">Admin</span>
        <h1>Audit log</h1>
        <p className="muted">Registro de acciones sobre datos personales.</p>
      </header>

      <div className="card card-padded stack stack-4">
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Aún no conectado al registro real</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Las entradas de ejemplo se eliminaron. La tabla <code className="mono">audit_log</code>{' '}
          existe y la pueblan de verdad los endpoints GDPR (Arts. 15 y 17): esta pantalla debe
          conectarse a esos datos, no rellenarse con placeholders, porque un registro de audit solo
          vale si refleja lo que ocurrió de verdad.
        </p>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          Fuente autoritativa mientras tanto: la tabla <code className="mono">audit_log</code> en el
          proyecto Supabase.
        </p>
      </div>
    </div>
  );
}
