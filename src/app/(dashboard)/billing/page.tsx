import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireSession, type AuthSession } from '@/lib/auth/session';
import { toAppError } from '@/lib/errors/app-error';
import { getClientIp } from '@/lib/http/request';
import { logger } from '@/lib/logging/logger';
import {
  createStripeBillingService,
  type BillingPlan,
  type BillingStatus,
  type BillingTenantStatus,
  type CheckoutPlan,
} from '@/server/billing/stripe-billing';
import { createTenantSettingsService } from '@/server/settings/tenant-settings';
import { createUsageLimitsService, type UsageSnapshot } from '@/server/usage/limits';

export const metadata: Metadata = {
  title: 'Facturación · Ambrogio.ai',
};

const PLAN_LABEL: Record<BillingPlan, string> = {
  trial: 'Prueba gratuita',
  starter: 'Starter',
  professional: 'Professional',
  agency: 'Agency',
};

const TENANT_STATUS: Record<
  BillingTenantStatus,
  { readonly label: string; readonly badge: string }
> = {
  active: { label: 'Activo', badge: 'badge-success' },
  expired: { label: 'Vencido', badge: 'badge-danger' },
  suspended: { label: 'Suspendido', badge: 'badge-warm' },
  cancelled: { label: 'Cancelado', badge: 'badge-neutral' },
};

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: 'Suscripción activa',
  trialing: 'En periodo de prueba',
  past_due: 'Pago atrasado',
  canceled: 'Suscripción cancelada',
  incomplete: 'Pago por completar',
  incomplete_expired: 'Pago no completado',
  unpaid: 'Factura impaga',
  paused: 'Suscripción en pausa',
};

type BillingData = {
  readonly status: BillingStatus;
  readonly usage: UsageSnapshot | null;
  readonly profile: BillingProfile | null;
};

type BillingProfile = {
  readonly name: string;
  readonly email: string | null;
  readonly address: string | null;
};

type BillingResult = { readonly ok: true; readonly data: BillingData } | { readonly ok: false };

export default async function BillingPage() {
  /**
   * Il portale clienti Stripe e' l'unica fonte autorevole per fatture, metodo
   * di pagamento e disdetta: non replichiamo quei dati, ci mandiamo l'utente.
   * La rotta `POST /api/billing/portal` fa esattamente questa chiamata: qui la
   * riusiamo come Server Action per non dover passare da JavaScript client.
   */
  async function openBillingPortal(): Promise<void> {
    'use server';

    const actionSession = await requireSession();
    const requestHeaders = await headers();
    const { url } = await createStripeBillingService().createPortalSession({
      session: actionSession,
      ipAddress: getClientIp(requestHeaders),
      userAgent: requestHeaders.get('user-agent'),
    });

    redirect(url);
  }

  async function startCheckout(plan: CheckoutPlan): Promise<void> {
    'use server';

    const actionSession = await requireSession();
    const requestHeaders = await headers();
    const { url } = await createStripeBillingService().createCheckoutSession({
      session: actionSession,
      plan,
      ipAddress: getClientIp(requestHeaders),
      userAgent: requestHeaders.get('user-agent'),
    });

    redirect(url);
  }

  const session = await requireSession();
  const result = await loadBilling(session);

  if (!result.ok) {
    return (
      <>
        <BillingHeader />
        <section className="card card-padded stack stack-3">
          <h2 style={{ fontSize: 'var(--text-lg)' }}>No puedo leer tu suscripción</h2>
          <p className="muted">
            Los datos de facturación no están disponibles en este momento. Reintenta en unos
            instantes: mientras tanto puedes gestionar todo desde el portal de clientes de Stripe
            que te enviamos por correo al suscribirte.
          </p>
          <Link href="/status" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
            Estado del servicio
          </Link>
        </section>
      </>
    );
  }

  const { status, usage, profile } = result.data;
  const tenantStatus = TENANT_STATUS[status.status];

  return (
    <>
      <BillingHeader />

      <div className="dashboard-content-grid">
        <section className="card stack stack-6">
          <div className="row-between" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div className="stack stack-2">
              <span className="badge">Plan actual</span>
              <h2 style={{ fontSize: 'var(--text-2xl)' }}>{PLAN_LABEL[status.plan]}</h2>
              <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span className={`badge ${tenantStatus.badge}`}>{tenantStatus.label}</span>
                {status.subscriptionStatus ? (
                  <span className="badge badge-neutral">
                    {SUBSCRIPTION_STATUS_LABEL[status.subscriptionStatus] ??
                      status.subscriptionStatus}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Link href="/pricing" className="btn btn-secondary">
                Comparar planes
              </Link>
              {status.canManageBilling ? (
                <form action={openBillingPortal}>
                  <button type="submit" className="btn btn-primary">
                    Abrir portal de Stripe
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <dl className="stack stack-3" style={{ margin: 0 }}>
            <BillingFact
              label="Renovación del periodo"
              value={formatDate(status.currentPeriodEnd)}
              hint={
                status.cancelAtPeriodEnd
                  ? 'Suscripción cancelada: no se renovará al final del periodo.'
                  : null
              }
            />
            {status.plan === 'trial' || status.trialEndsAt ? (
              <BillingFact label="Fin de la prueba" value={formatDate(status.trialEndsAt)} />
            ) : null}
            <BillingFact
              label="Cliente Stripe"
              value={status.hasStripeCustomer ? 'Conectado' : 'Aún no conectado'}
            />
          </dl>

          {status.canCheckout && status.availablePlans.length > 0 ? (
            <div className="stack stack-3">
              <hr className="divider" style={{ margin: 0 }} />
              <h3 style={{ fontSize: 'var(--text-lg)' }}>Activar una suscripción</h3>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                El pago se completa en Stripe. Puedes cambiar o cancelar en cualquier momento desde
                el portal de clientes.
              </p>
              <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {status.availablePlans.map((plan) => (
                  <form key={plan} action={startCheckout.bind(null, plan)}>
                    <button type="submit" className="btn btn-primary">
                      Activar {PLAN_LABEL[plan]}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}

          {!status.canManageBilling && !status.canCheckout ? (
            <p className="helper">
              Solo los perfiles owner y admin del negocio pueden gestionar suscripción y pagos.
            </p>
          ) : null}
        </section>

        <aside className="card stack stack-3">
          <span className="eyebrow">Datos de facturación</span>
          {profile ? (
            <>
              <p style={{ fontWeight: 600 }}>{profile.name}</p>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                {profile.email ?? 'Correo no disponible'}
                <br />
                {profile.address ?? 'Dirección no disponible'}
              </p>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              Datos del negocio no disponibles en este momento.
            </p>
          )}
          <p className="helper">
            Razón social, NIF/CIF y datos fiscales usados en factura se modifican desde el portal de
            clientes de Stripe.
          </p>
          <Link
            href="/settings"
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'flex-start' }}
          >
            Configuración del negocio
          </Link>
        </aside>
      </div>

      <section className="card stack stack-4" style={{ marginTop: 'var(--space-6)' }}>
        <div className="row-between" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Consumo del mes</h2>
          {usage ? <UsageBadge usage={usage} /> : null}
        </div>

        {usage ? (
          <>
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              Periodo de referencia: {formatMonth(usage.metricMonth)}.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              <UsageMeter
                label="Conversaciones"
                used={usage.conversations.used}
                limit={usage.conversations.limit}
                percent={usage.conversations.percent}
              />
              <UsageMeter
                label="Audios transcritos"
                used={usage.voiceMessages.used}
                limit={usage.voiceMessages.limit}
                percent={usage.voiceMessages.percent}
              />
              <div>
                <p className="kpi-label">Mensajes intercambiados</p>
                <p className="kpi-value">{formatNumber(usage.messages.used)}</p>
                <p className="helper">Sin límite de plan en esta métrica.</p>
              </div>
            </div>
          </>
        ) : (
          <p className="muted">
            El consumo del mes no se puede leer en este momento. Reintentar más tarde.
          </p>
        )}
      </section>

      <section className="card stack stack-4" style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Facturas y recibos</h2>
        {status.hasStripeCustomer ? (
          <>
            <p className="muted">
              El historial completo de facturas, los recibos en PDF y el método de pago están en el
              portal de clientes de Stripe. Es la fuente oficial: no guardamos una copia aquí.
            </p>
            {status.canManageBilling ? (
              <form action={openBillingPortal}>
                <button type="submit" className="btn btn-secondary">
                  Ver facturas en Stripe
                </button>
              </form>
            ) : (
              <p className="helper">
                Pide a un perfil owner o admin del negocio que abra el portal de clientes.
              </p>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">Aún no hay facturas</p>
            <p className="empty-state-text">
              Las facturas aparecen después del primer pago. Activa un plan para usar Ambrogio más
              allá de la prueba.
            </p>
            <Link href="/pricing" className="btn btn-primary">
              Ver planes
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

function BillingHeader() {
  return (
    <div className="dashboard-header">
      <div className="stack stack-2">
        <span className="eyebrow">Facturación</span>
        <h1>Plan y suscripción</h1>
        <p className="muted">Estado de tu plan, consumo del mes y acceso al portal de Stripe.</p>
      </div>
    </div>
  );
}

function BillingFact({
  label,
  value,
  hint = null,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string | null;
}) {
  return (
    <div className="row-between" style={{ gap: 'var(--space-4)', alignItems: 'baseline' }}>
      <dt className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        {label}
      </dt>
      <dd style={{ margin: 0, textAlign: 'right' }}>
        <span style={{ fontWeight: 600 }}>{value}</span>
        {hint ? <p className="helper">{hint}</p> : null}
      </dd>
    </div>
  );
}

function UsageBadge({ usage }: { readonly usage: UsageSnapshot }) {
  if (usage.blockReason) {
    return <span className="badge badge-danger">Límite alcanzado</span>;
  }

  if (usage.softWarning) {
    return <span className="badge badge-warm">Sopra l&apos;80% del piano</span>;
  }

  return <span className="badge badge-success">Dentro de los límites del plan</span>;
}

function UsageMeter({
  label,
  used,
  limit,
  percent,
}: {
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly percent: number;
}) {
  return (
    <div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">
        {formatNumber(used)}
        {limit > 0 ? <span className="muted">{` / ${formatNumber(limit)}`}</span> : null}
      </p>
      <div
        role="meter"
        aria-label={`${label}: ${percent}% del limite di piano`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface-sunken)',
          overflow: 'hidden',
          marginTop: 'var(--space-2)',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            height: '100%',
            background: percent >= 100 ? 'var(--color-danger)' : 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}

async function loadBilling(session: AuthSession): Promise<BillingResult> {
  try {
    const status = await createStripeBillingService().getStatus({ session });
    const [usage, profile] = await Promise.all([loadUsage(session), loadProfile(session)]);

    return { ok: true, data: { status, usage, profile } };
  } catch (error) {
    const appError = toAppError(error);

    logger.error(
      { tenantId: session.tenantId, code: appError.code, cause: appError.cause },
      'Failed to load billing dashboard',
    );

    return { ok: false };
  }
}

async function loadUsage(session: AuthSession): Promise<UsageSnapshot | null> {
  try {
    return await createUsageLimitsService().getDashboardSnapshot({ session });
  } catch (error) {
    logger.warn(
      { tenantId: session.tenantId, code: toAppError(error).code },
      'Failed to read usage snapshot for billing page',
    );

    return null;
  }
}

async function loadProfile(session: AuthSession): Promise<BillingProfile | null> {
  try {
    const snapshot = await createTenantSettingsService().getSnapshot({ session });
    const address = [snapshot.config.address, snapshot.config.city]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(', ');

    return {
      name: snapshot.config.studioName.trim() || snapshot.tenant.name,
      email: snapshot.config.email?.trim() || null,
      address: address || null,
    };
  } catch (error) {
    logger.warn(
      { tenantId: session.tenantId, code: toAppError(error).code },
      'Failed to read tenant profile for billing page',
    );

    return null;
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No disponible';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No disponible';
  }

  return new Intl.DateTimeFormat('es-419', { dateStyle: 'long' }).format(date);
}

/** `metricMonth` arriva dal servizio usage nel formato `YYYY-MM-01`. */
function formatMonth(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-419', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-419').format(value);
}
