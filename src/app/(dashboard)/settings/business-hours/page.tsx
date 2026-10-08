import type { Metadata } from 'next';
import Link from 'next/link';

import { BusinessHoursForm } from '@/components/settings/BusinessHoursForm';
import { type BusinessHourView } from '@/components/settings/business-hours-model';
import { requireSession, type AuthSession } from '@/lib/auth/session';
import { logger } from '@/lib/logging/logger';
import { createTenantSettingsService } from '@/server/settings/tenant-settings';

export const metadata: Metadata = {
  title: 'Horarios de apertura · Configuración · Ambrogio.ai',
};

// Gli orari dipendono dalla sessione: non devono finire in cache statica.
export const dynamic = 'force-dynamic';

type LoadResult =
  | { readonly ok: true; readonly hours: readonly BusinessHourView[] }
  | { readonly ok: false };

async function loadHours(session: AuthSession): Promise<LoadResult> {
  try {
    const service = createTenantSettingsService();
    const hours = await service.listBusinessHours({ session });

    return {
      ok: true,
      // Al client passiamo solo i campi che l'editor usa davvero.
      hours: hours.map((hour) => ({
        id: hour.id,
        weekday: hour.weekday,
        opensAt: hour.opensAt,
        closesAt: hour.closesAt,
        active: hour.active,
      })),
    };
  } catch (error) {
    // Il layout ha già garantito la sessione: un errore qui viene dal datastore.
    logger.error({ err: error, tenantId: session.tenantId }, 'Lettura orari di apertura fallita');
    return { ok: false };
  }
}

export default async function BusinessHoursSettingsPage() {
  const session = await requireSession();
  const result = await loadHours(session);

  return (
    <>
      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">
            <Link href="/settings" className="btn-link">
              Configuración
            </Link>{' '}
            / Negocio
          </span>
          <h1>Horarios de apertura</h1>
          <p className="muted">
            Son los datos con los que Ambrogio calcula la disponibilidad. Un error aquí se traduce en
            citas fijadas cuando el negocio está cerrado.
          </p>
        </div>
      </div>

      {result.ok ? (
        <BusinessHoursForm
          hours={result.hours}
          canManage={session.role === 'owner' || session.role === 'admin'}
        />
      ) : (
        <section className="card stack stack-3">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Horarios no legibles</h2>
          <p className="muted">
            No pudimos recuperar los horarios guardados. No significa que se hayan perdido:
            solo falló la lectura. Recarga en un momento y, si el problema continúa, escríbenos desde
            la página de contacto.
          </p>
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <Link href="/settings/business-hours" className="btn btn-secondary btn-sm">
              Reintentar
            </Link>
            <Link href="/contact" className="btn btn-ghost btn-sm">
              Contactar soporte
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
