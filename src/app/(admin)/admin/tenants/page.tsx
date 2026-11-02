import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tenants · Admin',
  robots: { index: false, follow: false },
};

/*
 * Esta página mostraba un listado de tenants inventados (nombres de estudios,
 * planes, MRR, fechas de activación) presentados como datos reales. El markup
 * anterior permanece en el historial de git y es recuperable cuando se cablee
 * la página.
 *
 * No se cableó de inmediato porque un listado cross-tenant requiere queries en
 * service_role que saltan la RLS: es la superficie más delicada del producto y
 * merece un servicio dedicado con tests de aislamiento, no una query añadida
 * de prisa a una página.
 */
export default function AdminTenantsPage() {
  return (
    <div className="stack stack-6">
      <header className="stack stack-2">
        <span className="eyebrow">Admin</span>
        <h1>Tenants</h1>
        <p className="muted">Listado de tenants registrados en la plataforma.</p>
      </header>

      <div className="card card-padded stack stack-4">
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Aún no conectado a datos reales</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Esta pantalla mostraba datos de ejemplo. Se eliminaron: un panel de administración que
          muestra números inventados es peor que un panel ausente, porque quien lo consulta saca
          conclusiones equivocadas.
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Para conectarla hace falta un servicio cross-tenant dedicado en{' '}
          <code className="mono">src/server/admin/</code>, con sus propios tests de aislamiento: las
          queries cross-tenant corren en <code className="mono">service_role</code> y saltan la RLS,
          así que no deben improvisarse dentro de una página.
        </p>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          Mientras tanto la fuente autoritativa es la tabla <code className="mono">tenants</code> en
          el proyecto Supabase.
        </p>
      </div>
    </div>
  );
}
