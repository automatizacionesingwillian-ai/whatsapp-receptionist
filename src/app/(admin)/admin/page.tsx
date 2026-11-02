import type { Metadata } from 'next';
import Link from 'next/link';

import {
  type HealthCheck,
  type HealthStatus,
  overallStatus,
  runHealthChecks,
} from '@/lib/health/checks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Admin · Ambrogio.ai',
  robots: { index: false, follow: false },
};

/** I conteggi e le probe devono riferirsi al momento in cui la pagina viene aperta. */
export const dynamic = 'force-dynamic';

const CONVERSATION_WINDOW_HOURS = 24;

interface PlatformCounts {
  readonly activeTenants: number;
  readonly totalTenants: number;
  readonly users: number;
  readonly recentConversations: number;
}

/**
 * Conteggi cross-tenant letti direttamente dal database con la chiave di
 * servizio.
 *
 * Non esiste ancora un servizio applicativo cross-tenant in `src/server`: i
 * servizi esistenti sono tutti scoped su un singolo tenant. Finché non c'è,
 * questa lettura sola-conteggio resta qui invece di duplicare un livello di
 * astrazione a metà.
 *
 * @returns `null` quando il database non risponde. Nessun fallback a zero: uno
 * zero verrebbe letto come "nessun tenant", che è un'affermazione diversa da
 * "non lo sappiamo".
 */
async function loadPlatformCounts(): Promise<PlatformCounts | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const since = new Date(Date.now() - CONVERSATION_WINDOW_HOURS * 3600_000).toISOString();

    const [activeTenants, totalTenants, users, recentConversations] = await Promise.all([
      supabase
        .from('tenants')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase.from('tenants').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('last_message_at', since),
    ]);

    if (activeTenants.error || totalTenants.error || users.error || recentConversations.error) {
      return null;
    }

    return {
      activeTenants: activeTenants.count ?? 0,
      totalTenants: totalTenants.count ?? 0,
      users: users.count ?? 0,
      recentConversations: recentConversations.count ?? 0,
    };
  } catch {
    return null;
  }
}

const HEALTH_PRESENTATION: Record<
  HealthStatus,
  { label: string; color: string; background: string }
> = {
  ok: {
    label: 'Operativo',
    color: 'var(--color-success)',
    background: 'var(--color-success-soft)',
  },
  degraded: {
    label: 'Degradado',
    color: 'var(--color-warning)',
    background: 'var(--color-warning-soft)',
  },
  down: {
    label: 'No alcanzable',
    color: 'var(--color-danger)',
    background: 'var(--color-danger-soft)',
  },
};

export default async function AdminOverviewPage() {
  const [checks, counts] = await Promise.all([runHealthChecks(), loadPlatformCounts()]);

  const overallKey = overallStatus(checks);
  const overall = HEALTH_PRESENTATION[overallKey];
  const failing = checks.filter((check) => check.status !== 'ok');
  const measuredAt = new Date().toLocaleString('es-419', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Mexico_City',
  });

  return (
    <div className="stack stack-8">
      <div className="stack stack-2">
        <span className="badge badge-warm">Cross-tenant</span>
        <h1>Sistema Ambrogio.ai</h1>
        <p className="muted">
          Vista super-admin. Los números son conteos leídos de la base de datos al cargar la página,
          no estimaciones.
        </p>
      </div>

      {counts === null ? (
        <section
          className="card stack stack-3"
          style={{ background: 'var(--color-danger-soft)', borderColor: 'var(--color-danger)' }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)' }}>Conteos no disponibles</h2>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            La base de datos no respondió a las consultas de conteo, así que no se muestra ningún
            número. El estado de las dependencias abajo indica dónde mirar; el detalle de la
            configuración está en{' '}
            <Link href="/admin/system" className="btn-link">
              Sistema
            </Link>
            .
          </p>
        </section>
      ) : (
        <>
          <section className="kpi-grid">
            <article className="kpi">
              <span className="kpi-label">Tenants activos</span>
              <span className="kpi-value">{counts.activeTenants.toLocaleString('es-419')}</span>
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                de {counts.totalTenants.toLocaleString('es-419')} registrados
              </span>
            </article>
            <article className="kpi">
              <span className="kpi-label">Usuarios</span>
              <span className="kpi-value">{counts.users.toLocaleString('es-419')}</span>
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                cuentas vinculadas a un tenant
              </span>
            </article>
            <article className="kpi">
              <span className="kpi-label">Conversaciones activas 24h</span>
              <span className="kpi-value">
                {counts.recentConversations.toLocaleString('es-419')}
              </span>
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                con al menos un mensaje en las últimas {CONVERSATION_WINDOW_HOURS} horas
              </span>
            </article>
          </section>

          {counts.totalTenants === 0 ? (
            <section className="card stack stack-3">
              <h2 style={{ fontSize: 'var(--text-lg)' }}>Ningún tenant registrado</h2>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                La plataforma está configurada pero aún no tiene clientes. El primer tenant nace de
                un registro: a partir de ahí aparecen conversaciones, colas de trabajo y facturación.
              </p>
              <div className="row" style={{ gap: 'var(--space-3)' }}>
                <Link href="/register" className="btn btn-primary">
                  Abrir el registro
                </Link>
                <Link href="/admin/system" className="btn btn-secondary">
                  Verificar la configuración
                </Link>
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="card stack stack-4">
        <div className="row-between">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Dependencias externas</h2>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Medidas a las {measuredAt}
          </span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-full)',
            background: overall.background,
            color: overall.color,
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            width: 'fit-content',
          }}
        >
          <span aria-hidden="true">●</span>
          {overall.label}
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack-2">
          {checks.map((check) => (
            <HealthRow key={check.name} check={check} />
          ))}
        </ul>

        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Cada fila es una sonda real ejecutada al cargar. No hay auto-refresh: recarga la página
          para una nueva medición.
        </p>
      </section>

      {failing.length > 0 ? (
        <section
          className="card stack stack-3"
          style={{ background: overall.background, borderColor: overall.color }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)' }}>
            {failing.length === 1
              ? '1 dependencia no responde como se esperaba'
              : `${failing.length} dependencias no responden como se esperaba`}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--text-sm)' }}>
            {failing.map((check) => (
              <li key={check.name}>
                <strong>{check.label}</strong> — {HEALTH_PRESENTATION[check.status].label}
                {check.details ? (
                  <>
                    {' · '}
                    <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                      {check.details}
                    </span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            Una sonda fallida puede deberse a credenciales faltantes: revisa las variables en{' '}
            <Link href="/admin/system" className="btn-link">
              Sistema
            </Link>
            .
          </p>
        </section>
      ) : null}
    </div>
  );
}

function HealthRow({ check }: Readonly<{ check: HealthCheck }>) {
  const presentation = HEALTH_PRESENTATION[check.status];
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 'var(--space-4)',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-sunken)',
      }}
    >
      <div className="stack stack-2">
        <span style={{ fontWeight: 500 }}>{check.label}</span>
        {check.details ? (
          <span className="mono muted" style={{ fontSize: 'var(--text-xs)' }}>
            {check.details}
          </span>
        ) : null}
      </div>
      <span className="mono muted" style={{ fontSize: 'var(--text-xs)' }}>
        {check.latencyMs === undefined ? '—' : `${check.latencyMs} ms`}
      </span>
      <span
        style={{
          color: presentation.color,
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
        }}
      >
        ● {presentation.label}
      </span>
    </li>
  );
}
