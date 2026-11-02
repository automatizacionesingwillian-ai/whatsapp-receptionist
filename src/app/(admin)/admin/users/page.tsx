import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usuarios · Admin',
  robots: { index: false, follow: false },
};

/*
 * Esta página listaba usuarios inventados (email, tenant de pertenencia,
 * rol, último acceso) presentados como reales. El markup anterior permanece
 * en el historial de git.
 *
 * Como con el listado de tenants, la lectura cross-tenant requiere un servicio
 * dedicado con tests de aislamiento: aquí se leerían datos personales de
 * usuarios de tenants distintos, así que también es una superficie GDPR.
 */
export default function AdminUsersPage() {
  return (
    <div className="stack stack-6">
      <header className="stack stack-2">
        <span className="eyebrow">Admin</span>
        <h1>Usuarios</h1>
        <p className="muted">Usuarios registrados en todos los tenants.</p>
      </header>

      <div className="card card-padded stack stack-4">
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Aún no conectado a datos reales</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Se eliminaron los datos de ejemplo. Esta vista lee datos personales de usuarios de
          tenants distintos: además del servicio cross-tenant hay que decidir qué campos debe ver
          un super-admin, y registrar el acceso en <code className="mono">audit_log</code> como ya
          ocurre con los endpoints GDPR.
        </p>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          Fuente autoritativa mientras tanto: la sección Authentication del proyecto Supabase.
        </p>
      </div>
    </div>
  );
}
