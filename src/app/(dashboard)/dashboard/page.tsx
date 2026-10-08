import type { Metadata } from 'next';
import Link from 'next/link';

import { requireSession } from '@/lib/auth/session';
import type { AuthSession } from '@/lib/auth/session';
import { createConversationInboxService } from '@/server/conversations/inbox';
import type { ConversationChannel, ConversationSummary } from '@/server/conversations/inbox';
import { createTenantSettingsService } from '@/server/settings/tenant-settings';
import type { TenantSettingsSnapshot } from '@/server/settings/tenant-settings';
import { createUsageLimitsService } from '@/server/usage/limits';
import type { UsageMetricSnapshot, UsagePlanKey } from '@/server/usage/limits';

export const metadata: Metadata = {
  title: 'Resumen · Ambrogio.ai',
};

const RECENT_CONVERSATIONS_LIMIT = 8;

const PLAN_LABELS: Record<UsagePlanKey, string> = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  agency: 'Agency',
};

const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  whatsapp: 'WhatsApp',
  instagram_dm: 'Instagram DM',
  web_chat: 'Chat web',
  sms: 'SMS',
};

const STATUS_PRESENTATION = {
  active: { label: 'Activa', badge: 'badge-success' },
  escalated: { label: 'Por atender', badge: 'badge-warm' },
  closed: { label: 'Cerrada', badge: 'badge-neutral' },
  spam: { label: 'Spam', badge: 'badge-danger' },
} as const;

export default async function DashboardPage() {
  const session = await requireSession();

  const [usage, inbox, settings] = await Promise.all([
    createUsageLimitsService().getDashboardSnapshot({ session }),
    createConversationInboxService().listConversations({
      session,
      filters: { limit: RECENT_CONVERSATIONS_LIMIT },
    }),
    loadTenantSettings(session),
  ]);

  const timezone = settings?.tenant.timezone ?? null;
  const displayName = settings ? settings.config.studioName || settings.tenant.name : null;
  const conversations = inbox.conversations;

  return (
    <>
      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">Resumen</span>
          <h1>{displayName ?? 'Tu negocio'}</h1>
          <p className="muted">
            Plan {PLAN_LABELS[usage.plan]} · periodo {formatMetricMonth(usage.metricMonth)}
          </p>
        </div>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Link href="/conversations" className="btn btn-secondary">
            Ver conversaciones
          </Link>
          <Link href="/calendar" className="btn btn-primary">
            Ir al calendario
          </Link>
        </div>
      </div>

      <div className="kpi-grid">
        <article className="kpi">
          <span className="kpi-label">Conversaciones del mes</span>
          <span className="kpi-value">{formatNumber(usage.conversations.used)}</span>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            de {formatNumber(usage.conversations.limit)} incluidas en el plan
          </span>
        </article>

        <article className="kpi">
          <span className="kpi-label">Mensajes intercambiados</span>
          <span className="kpi-value">{formatNumber(usage.messages.used)}</span>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Total del mes, entrantes y salientes
          </span>
        </article>

        <article className="kpi">
          <span className="kpi-label">Audios transcritos</span>
          <span className="kpi-value">{formatNumber(usage.voiceMessages.used)}</span>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            de {formatNumber(usage.voiceMessages.limit)} incluidos en el plan
          </span>
        </article>

        <article className="kpi">
          <span className="kpi-label">Respuestas automáticas</span>
          <span className="kpi-value">{usage.autoReplyAllowed ? 'Activas' : 'Suspendidas'}</span>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            {describeAutoReply(usage.autoReplyAllowed, usage.blockReason)}
          </span>
        </article>
      </div>

      <div className="dashboard-content-grid">
        <section className="card stack stack-4">
          <div className="row-between">
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Conversaciones recientes</h2>
            {conversations.length > 0 ? (
              <Link href="/conversations" className="btn-link">
                Todas →
              </Link>
            ) : null}
          </div>

          {conversations.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">Aún no hay conversaciones</p>
              <p className="empty-state-text">
                Ambrogio responde solo después de que conectes el número de WhatsApp de tu negocio.
                Mientras la conexión no esté activa, aquí no aparece nada.
              </p>
              <Link href="/settings/whatsapp" className="btn btn-primary">
                Conectar WhatsApp
              </Link>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }} className="stack stack-3">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <ConversationRow conversation={conversation} timezone={timezone} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="stack stack-4">
          <div className="card stack stack-3">
            <span className="eyebrow">Uso del plan</span>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {formatNumber(usage.conversations.used)}
              <span className="muted" style={{ fontSize: 'var(--text-base)' }}>
                /{formatNumber(usage.conversations.limit)}
              </span>
            </p>
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              Conversaciones del mes en el plan {PLAN_LABELS[usage.plan]}.
            </p>
            <UsageMeter label="Conversaciones del mes" metric={usage.conversations} />

            <div className="stack stack-2" style={{ marginTop: 'var(--space-2)' }}>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                Audios: {formatNumber(usage.voiceMessages.used)}/
                {formatNumber(usage.voiceMessages.limit)}
              </p>
              <UsageMeter label="Audios del mes" metric={usage.voiceMessages} />
            </div>
          </div>

          {usage.blockReason !== null ? (
            <div className="card stack stack-3">
              <span className="eyebrow">Límite alcanzado</span>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                {usage.blockReason === 'conversations_exceeded'
                  ? 'Agotaste las conversaciones incluidas en el plan: Ambrogio dejó de responder automáticamente hasta la renovación del mes.'
                  : 'Agotaste los audios incluidos en el plan: los mensajes de voz ya no se transcriben hasta la renovación del mes.'}
              </p>
              <Link href="/billing" className="btn btn-primary btn-sm">
                Cambiar plan
              </Link>
            </div>
          ) : usage.softWarning ? (
            <div className="card stack stack-3">
              <span className="eyebrow">Umbral cercano</span>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                Superaste el 80% de uno de los límites incluidos en el plan. Al 100% las respuestas
                automáticas se detienen hasta la renovación del mes.
              </p>
              <Link href="/billing" className="btn btn-secondary btn-sm">
                Ver el plan
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function ConversationRow({
  conversation,
  timezone,
}: Readonly<{ conversation: ConversationSummary; timezone: string | null }>) {
  const presentation = STATUS_PRESENTATION[conversation.status];
  const timestamp = formatTimestampParts(conversation.lastMessageAt, timezone);

  return (
    <Link
      href={`/conversations/${conversation.id}`}
      className="activity-row"
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      <span className="mono muted activity-row-time">
        <span style={{ display: 'block' }}>{timestamp.date}</span>
        <span style={{ display: 'block' }}>{timestamp.time}</span>
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="activity-row-title">
          {conversation.customerName ?? conversation.customerIdentifier}
        </p>
        <p className="muted activity-row-detail">
          {CHANNEL_LABELS[conversation.channel]} ·{' '}
          {conversation.aiEnabled ? 'atendida por Ambrogio' : 'atendida por un operador'}
        </p>
      </div>
      <span className={`badge ${presentation.badge}`}>{presentation.label}</span>
    </Link>
  );
}

function UsageMeter({ label, metric }: Readonly<{ label: string; metric: UsageMetricSnapshot }>) {
  const fill = metric.exceeded
    ? 'var(--color-danger)'
    : metric.warning
      ? 'var(--color-warning)'
      : 'var(--color-accent)';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={metric.percent}
      aria-valuetext={`${metric.percent}% del límite`}
      style={{
        height: 6,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-surface-sunken)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${metric.percent}%`,
          height: '100%',
          background: fill,
        }}
      />
    </div>
  );
}

/**
 * Il nome dell'attività è un dato di contorno: se il tenant non ha ancora
 * completato l'onboarding, la dashboard deve comunque mostrare i numeri reali
 * invece di andare in errore.
 */
async function loadTenantSettings(session: AuthSession): Promise<TenantSettingsSnapshot | null> {
  try {
    return await createTenantSettingsService().getSnapshot({ session });
  } catch {
    return null;
  }
}

function describeAutoReply(
  allowed: boolean,
  blockReason: 'conversations_exceeded' | 'voice_exceeded' | null,
): string {
  if (allowed) {
    return 'Ambrogio responde dentro de los límites del plan';
  }

  return blockReason === 'voice_exceeded'
    ? 'Límite de audios agotado hasta la renovación del mes'
    : 'Límite de conversaciones agotado hasta la renovación del mes';
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-419').format(value);
}

function formatMetricMonth(metricMonth: string): string {
  const date = new Date(`${metricMonth}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return 'no disponible';
  }

  return new Intl.DateTimeFormat('es-419', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatTimestampParts(
  isoDate: string,
  timezone: string | null,
): { date: string; time: string } {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return { date: '—', time: '—' };
  }

  const zone = timezone !== null ? { timeZone: timezone } : {};

  return {
    date: new Intl.DateTimeFormat('es-419', {
      day: '2-digit',
      month: '2-digit',
      ...zone,
    }).format(date),
    time: new Intl.DateTimeFormat('es-419', {
      hour: '2-digit',
      minute: '2-digit',
      ...zone,
    }).format(date),
  };
}
