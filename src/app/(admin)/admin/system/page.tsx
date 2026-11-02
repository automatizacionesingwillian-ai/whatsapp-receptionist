import type { Metadata } from 'next';

import { requireSuperAdmin } from '@/lib/auth/super-admin';
import { type AppEnv, env } from '@/lib/env';
import {
  type HealthCheck,
  type HealthStatus,
  overallStatus,
  runHealthChecks,
} from '@/lib/health/checks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import vercelConfig from '../../../../../vercel.json';

export const metadata: Metadata = {
  title: 'Sistema · Admin',
  robots: { index: false, follow: false },
};

/**
 * Nessuna cache: un pannello di monitoraggio che serve una misurazione vecchia
 * afferma qualcosa di falso sul presente.
 */
export const dynamic = 'force-dynamic';

// --------------------------------------------------------------------------
// Configurazione runtime
// --------------------------------------------------------------------------

interface RuntimeVar {
  readonly key: keyof AppEnv;
  readonly area: string;
  readonly required: boolean;
}

/**
 * Variabili di configurazione mostrate nel pannello.
 *
 * Ogni chiave esiste nello schema Zod di `src/lib/env.ts`: il pannello riporta
 * solo se il valore è valorizzato, mai il valore stesso. Le date di rotazione
 * non compaiono perché il sistema non le registra da nessuna parte.
 */
const RUNTIME_VARS: readonly RuntimeVar[] = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', area: 'Database', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', area: 'Database', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', area: 'Database', required: true },
  { key: 'SUPABASE_DB_URL', area: 'Database', required: false },
  { key: 'INTERNAL_JOB_SECRET', area: 'Jobs internos', required: true },
  { key: 'CRON_SECRET', area: 'Jobs internos', required: false },
  { key: 'ANTHROPIC_API_KEY', area: 'Motor AI', required: true },
  { key: 'ANTHROPIC_MODEL_PRIMARY', area: 'Motor AI', required: true },
  { key: 'ANTHROPIC_MODEL_FAST', area: 'Motor AI', required: true },
  { key: 'OPENAI_API_KEY', area: 'Motor AI', required: false },
  { key: 'UPSTASH_REDIS_REST_URL', area: 'Rate limiting', required: true },
  { key: 'UPSTASH_REDIS_REST_TOKEN', area: 'Rate limiting', required: true },
  { key: 'WHATSAPP_API_KEY', area: 'WhatsApp', required: false },
  { key: 'WHATSAPP_APP_SECRET', area: 'WhatsApp', required: true },
  { key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', area: 'WhatsApp', required: true },
  { key: 'WHATSAPP_PHONE_NUMBER_ID', area: 'WhatsApp', required: false },
  { key: 'WHATSAPP_WABA_ID', area: 'WhatsApp', required: false },
  { key: 'ELEVENLABS_API_KEY', area: 'Voz', required: false },
  { key: 'STRIPE_SECRET_KEY', area: 'Facturación', required: true },
  { key: 'STRIPE_WEBHOOK_SECRET', area: 'Facturación', required: true },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', area: 'Facturación', required: false },
  { key: 'STRIPE_PRICE_STARTER', area: 'Facturación', required: false },
  { key: 'STRIPE_PRICE_PROFESSIONAL', area: 'Facturación', required: false },
  { key: 'FATTUREINCLOUD_API_TOKEN', area: 'Facturación', required: false },
  { key: 'FATTUREINCLOUD_COMPANY_ID', area: 'Facturación', required: false },
  { key: 'GOOGLE_OAUTH_CLIENT_ID', area: 'Calendario', required: false },
  { key: 'GOOGLE_OAUTH_CLIENT_SECRET', area: 'Calendario', required: false },
  { key: 'GOOGLE_OAUTH_STATE_SECRET', area: 'Calendario', required: false },
  { key: 'GOOGLE_CALENDAR_REDIRECT_URI', area: 'Calendario', required: false },
  { key: 'INTEGRATION_CREDENTIALS_ENCRYPTION_KEY', area: 'Calendario', required: false },
];

/**
 * Interruttori di comportamento realmente letti a runtime. Sono variabili di
 * ambiente, non flag persistiti: cambiano solo con un nuovo deploy, quindi qui
 * sono in sola lettura. Un toggle cliccabile suggerirebbe un controllo che il
 * sistema non ha.
 */
const RUNTIME_SWITCHES: readonly { key: keyof AppEnv; label: string; description: string }[] = [
  {
    key: 'AMBROGIO_AI_AUTOREPLY_ENABLED',
    label: 'Respuesta automática AI',
    description:
      'Interruptor global. Si está desactivado, ningún tenant recibe respuestas automáticas, aunque tenga la respuesta automática habilitada en su configuración.',
  },
  {
    key: 'ELEVENLABS_ENABLE_LOGGING',
    label: 'Logging ElevenLabs',
    description: 'Permite al proveedor conservar los audios enviados. Relevante para GDPR.',
  },
];

function isConfigured(key: keyof AppEnv): boolean {
  const value = env[key];
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined;
}

// --------------------------------------------------------------------------
// Cron dichiarati
// --------------------------------------------------------------------------

interface DeclaredCron {
  readonly path: string;
  readonly schedule: string;
}

/**
 * Fonte autorevole della pianificazione: `vercel.json`. Importato invece di
 * essere ricopiato, così una modifica alla schedulazione non può divergere da
 * quanto mostrato qui.
 */
const DECLARED_CRONS: readonly DeclaredCron[] = vercelConfig.crons;

const CRON_PURPOSE: Record<string, string> = {
  '/api/internal/jobs/whatsapp-outbox':
    'Entrega los mensajes salientes encolados en whatsapp_outbox_jobs.',
  '/api/internal/jobs/whatsapp-voice':
    'Transcribe los mensajes de voz entrantes encolados en whatsapp_voice_jobs.',
  '/api/internal/jobs/whatsapp-template-sync':
    'Sincroniza las plantillas WhatsApp aprobadas del proveedor para un tenant.',
  '/api/internal/jobs/appointment-reminders': 'Envía los recordatorios de citas próximas.',
  '/api/internal/jobs/gdpr-hard-delete':
    'Ejecuta la eliminación definitiva de tenants fuera del periodo de retención (GDPR art. 17).',
};

/** Traduce las expresiones cron usadas; si no hay coincidencia, muestra el original. */
function describeSchedule(expression: string): string {
  if (expression === '* * * * *') return 'cada minuto';

  const everyNMinutes = /^\*\/(\d+) \* \* \* \*$/u.exec(expression);
  const minutesStep = everyNMinutes?.[1];
  if (minutesStep !== undefined) return `cada ${minutesStep} minutos`;

  const dailyAt = /^(\d{1,2}) (\d{1,2}) \* \* \*$/u.exec(expression);
  const minute = dailyAt?.[1];
  const hour = dailyAt?.[2];
  if (minute !== undefined && hour !== undefined) {
    return `cada día a las ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }

  return expression;
}

// --------------------------------------------------------------------------
// Code di lavoro (unica traccia reale di attività dei worker)
// --------------------------------------------------------------------------

type QueueTable = 'whatsapp_outbox_jobs' | 'whatsapp_voice_jobs';

interface QueueSnapshot {
  readonly table: QueueTable;
  readonly label: string;
  readonly description: string;
  readonly pending: number;
  readonly blocked: number;
  readonly lastAttemptAt: string | null;
}

const QUEUES: readonly { table: QueueTable; label: string; description: string }[] = [
  {
    table: 'whatsapp_outbox_jobs',
    label: 'Mensajes salientes',
    description: 'Procesada por el cron whatsapp-outbox.',
  },
  {
    table: 'whatsapp_voice_jobs',
    label: 'Transcripción de voz',
    description: 'Procesada por el cron whatsapp-voice.',
  },
];

function readTimestampField(row: unknown, field: string): string | null {
  if (typeof row !== 'object' || row === null) return null;
  const value = (row as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : null;
}

/**
 * Legge lo stato reale di una coda.
 *
 * `last_attempt_at` è l'unico dato che il sistema registra sull'esecuzione dei
 * worker: non esiste una tabella di run dei cron, quindi questo è il sostituto
 * onesto di uno storico delle esecuzioni.
 *
 * @returns `null` se il database non risponde: l'assenza del dato va mostrata,
 * non sostituita con uno zero che sembrerebbe una coda vuota.
 */
async function loadQueueSnapshot(queue: (typeof QUEUES)[number]): Promise<QueueSnapshot | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const [pending, blocked, lastAttempt] = await Promise.all([
      supabase
        .from(queue.table)
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'processing', 'retry']),
      supabase
        .from(queue.table)
        .select('id', { count: 'exact', head: true })
        .in('status', ['failed', 'dead_letter']),
      supabase
        .from(queue.table)
        .select('last_attempt_at')
        .not('last_attempt_at', 'is', null)
        .order('last_attempt_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (pending.error || blocked.error || lastAttempt.error) return null;

    return {
      table: queue.table,
      label: queue.label,
      description: queue.description,
      pending: pending.count ?? 0,
      blocked: blocked.count ?? 0,
      lastAttemptAt: readTimestampField(lastAttempt.data, 'last_attempt_at'),
    };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// Presentazione
// --------------------------------------------------------------------------

const HEALTH_PRESENTATION: Record<HealthStatus, { label: string; badgeClass: string }> = {
  ok: { label: 'Operativo', badgeClass: 'badge-success' },
  degraded: { label: 'Degradado', badgeClass: 'badge-warm' },
  down: { label: 'No alcanzable', badgeClass: 'badge-danger' },
};

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'no disponible';
  return parsed.toLocaleString('es-419', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Mexico_City',
  });
}

function formatAge(iso: string, now: Date): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const minutes = Math.floor((now.getTime() - parsed.getTime()) / 60_000);
  if (minutes < 1) return 'hace menos de un minuto';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export default async function AdminSystemPage() {
  await requireSuperAdmin();

  const [checks, queues] = await Promise.all([
    runHealthChecks(),
    Promise.all(QUEUES.map((queue) => loadQueueSnapshot(queue))),
  ]);

  const now = new Date();
  const overall = HEALTH_PRESENTATION[overallStatus(checks)];
  const missingRequired = RUNTIME_VARS.filter((item) => item.required && !isConfigured(item.key));
  const configuredCount = RUNTIME_VARS.filter((item) => isConfigured(item.key)).length;

  return (
    <div className="stack stack-8">
      <div className="stack stack-2">
        <span className="badge badge-warm">Cross-tenant</span>
        <h1>Sistema</h1>
        <p className="muted">
          Estado medido de las dependencias, configuración runtime y colas de trabajo. Cada valor
          de esta página se detecta al cargar: nada se declara a mano.
        </p>
      </div>

      <section className="card stack stack-4">
        <div className="row-between">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Dependencias externas</h2>
          <span className={`badge ${overall.badgeClass}`}>{overall.label}</span>
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Sondas ejecutadas a las {formatDateTime(now.toISOString())} (zona America/Mexico_City).
          El mismo dato en formato máquina está en <span className="mono">/api/health/deep</span>.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack-2">
          {checks.map((check) => (
            <HealthRow key={check.name} check={check} />
          ))}
        </ul>
      </section>

      <section className="card stack stack-4">
        <div className="row-between">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Configuración runtime</h2>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {configuredCount} de {RUNTIME_VARS.length} configuradas
            {missingRequired.length > 0 ? ` · ${missingRequired.length} requeridas faltantes` : ''}
          </span>
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          El panel solo muestra si una variable está configurada, nunca su contenido. La fecha de
          la última rotación no aparece porque el sistema no la registra.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <caption className="sr-only">
              Variables de configuración runtime con área funcional y estado de configuración.
            </caption>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <Th>Variable</Th>
                <Th>Área</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {RUNTIME_VARS.map((item) => {
                const configured = isConfigured(item.key);
                const badgeClass = configured
                  ? 'badge-success'
                  : item.required
                    ? 'badge-danger'
                    : 'badge-neutral';
                const label = configured
                  ? 'Configurada'
                  : item.required
                    ? 'Faltante'
                    : 'No configurada';
                return (
                  <tr key={item.key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Td>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {item.key}
                      </span>
                    </Td>
                    <Td muted>{item.area}</Td>
                    <Td>
                      <span className={`badge ${badgeClass}`}>{label}</span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack stack-4">
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Interruptores de comportamiento</h2>
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Definidos por variables de entorno y leídos en cada solicitud. Son de solo lectura: se
          cambian con un nuevo deploy, no desde esta página.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack-2">
          {RUNTIME_SWITCHES.map((item) => {
            const enabled = env[item.key] === true;
            return (
              <li
                key={item.key}
                className="surface-flat"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 'var(--space-4)',
                  alignItems: 'center',
                  padding: 'var(--space-4) var(--space-5)',
                }}
              >
                <div className="stack stack-2">
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span className="mono muted" style={{ fontSize: 'var(--text-xs)' }}>
                    {item.key}
                  </span>
                  <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                    {item.description}
                  </span>
                </div>
                <span className={`badge ${enabled ? 'badge-success' : 'badge-neutral'}`}>
                  {enabled ? 'Activo' : 'Inactivo'}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card stack stack-4">
        <div className="row-between">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Jobs programados</h2>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {DECLARED_CRONS.length} jobs declarados
          </span>
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Esta tabla muestra la <strong>planificación declarada</strong> en{' '}
          <span className="mono">vercel.json</span>, no el resultado de la última ejecución: el
          sistema no registra un historial de runs. La única traza real de actividad de los workers
          está en la sección Colas de trabajo abajo.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <caption className="sr-only">
              Jobs cron declarados en la configuración de deploy con su planificación.
            </caption>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <Th>Endpoint</Th>
                <Th>Planificación</Th>
                <Th>Frecuencia</Th>
              </tr>
            </thead>
            <tbody>
              {DECLARED_CRONS.map((cron) => (
                <tr key={cron.path} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <Td>
                    <div className="stack stack-2">
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {cron.path}
                      </span>
                      {CRON_PURPOSE[cron.path] ? (
                        <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                          {CRON_PURPOSE[cron.path]}
                        </span>
                      ) : null}
                    </div>
                  </Td>
                  <Td mono>{cron.schedule}</Td>
                  <Td muted>{describeSchedule(cron.schedule)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack stack-4">
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Colas de trabajo</h2>
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Conteos leídos de las tablas de cola. Si el último intento es mucho más antiguo que la
          frecuencia del cron correspondiente, el worker no está corriendo.
        </p>

        <div className="stack stack-3">
          {queues.map((snapshot, index) => {
            const queue = QUEUES[index];
            if (queue === undefined) return null;
            return <QueueCard key={queue.table} queue={queue} snapshot={snapshot} now={now} />;
          })}
        </div>
      </section>
    </div>
  );
}

function HealthRow({ check }: Readonly<{ check: HealthCheck }>) {
  const presentation = HEALTH_PRESENTATION[check.status];
  return (
    <li
      className="surface-flat"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 'var(--space-4)',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-5)',
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
      <span className={`badge ${presentation.badgeClass}`}>{presentation.label}</span>
    </li>
  );
}

function QueueCard({
  queue,
  snapshot,
  now,
}: Readonly<{
  queue: (typeof QUEUES)[number];
  snapshot: QueueSnapshot | null;
  now: Date;
}>) {
  if (snapshot === null) {
    return (
      <div className="surface-flat" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="stack stack-2">
          <span style={{ fontWeight: 600 }}>{queue.label}</span>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Conteos no disponibles: la tabla <span className="mono">{queue.table}</span> no
            respondió. Revisa el estado de la base de datos en Dependencias externas.
          </span>
        </div>
      </div>
    );
  }

  const isIdle = snapshot.pending === 0 && snapshot.blocked === 0;

  return (
    <div className="surface-flat" style={{ padding: 'var(--space-4) var(--space-5)' }}>
      <div className="stack stack-3">
        <div className="row-between">
          <div className="stack stack-2">
            <span style={{ fontWeight: 600 }}>{queue.label}</span>
            <span className="mono muted" style={{ fontSize: 'var(--text-xs)' }}>
              {queue.table} · {queue.description}
            </span>
          </div>
          {snapshot.blocked > 0 ? (
            <span className="badge badge-danger">{snapshot.blocked} bloqueados</span>
          ) : null}
        </div>

        <div className="row" style={{ gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <QueueStat label="En cola" value={String(snapshot.pending)} />
          <QueueStat label="Fallidos o dead letter" value={String(snapshot.blocked)} />
          <QueueStat
            label="Último intento registrado"
            value={
              snapshot.lastAttemptAt === null
                ? 'nunca'
                : `${formatDateTime(snapshot.lastAttemptAt)} · ${formatAge(snapshot.lastAttemptAt, now)}`
            }
          />
        </div>

        {isIdle && snapshot.lastAttemptAt === null ? (
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Ningún trabajo ha transitado aún por esta cola. Es el estado esperado hasta que llegue
            el primer mensaje de WhatsApp en un tenant configurado.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function QueueStat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="stack stack-2">
      <span
        className="muted"
        style={{
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{value}</span>
    </div>
  );
}

function Th({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: 'var(--space-3) var(--space-4)',
        fontWeight: 600,
        fontSize: 'var(--text-xs)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
  muted,
}: Readonly<{
  children: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}>) {
  const className = [mono ? 'mono' : null, muted ? 'muted' : null].filter(Boolean).join(' ');
  return (
    <td
      className={className || undefined}
      style={{
        padding: 'var(--space-3) var(--space-4)',
        fontSize: mono || muted ? 'var(--text-xs)' : 'var(--text-sm)',
        textAlign: 'left',
      }}
    >
      {children}
    </td>
  );
}
