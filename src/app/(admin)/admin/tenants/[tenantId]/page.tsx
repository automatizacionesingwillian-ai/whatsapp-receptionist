import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { requireSuperAdmin } from '@/lib/auth/super-admin';

export const metadata: Metadata = {
  title: 'Detalle del tenant · Admin',
  robots: { index: false, follow: false },
};

const TenantIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/u);

interface TenantUser {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'member';
  lastLogin: string;
}

interface AuditEntry {
  ts: string;
  action: string;
  target: string;
  user: string;
}

interface TenantDetail {
  id: string;
  name: string;
  vertical: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  account: {
    legalName: string;
    pIva: string;
    sdiCode: string;
    address: string;
    contactEmail: string;
    ownerName: string;
    ownerEmail: string;
  };
  plan: {
    name: string;
    mrr: string;
    nextInvoiceDate: string;
    nextInvoiceAmount: string;
    paymentMethod: string;
    stripeCustomerId: string;
  };
  usage: {
    aiConversations: { value: string; limit: string };
    voiceMinutes: { value: string; limit: string };
    bookings: { value: string; limit: string };
  };
  integrations: {
    whatsapp: { connected: boolean; phone: string | null };
    googleCalendar: { connected: boolean; account: string | null };
    elevenlabs: { connected: boolean; voice: string | null };
    fattureInCloud: { connected: boolean; companyName: string | null };
  };
  team: TenantUser[];
  audit: AuditEntry[];
  created: string;
}

const TENANTS_DETAILS: Record<string, TenantDetail> = {
  t1: {
    id: 't1',
    name: 'Clínica Dental Ruiz',
    vertical: 'dental',
    status: 'active',
    account: {
      legalName: 'Clínica Dental Ruiz S.A. de C.V.',
      pIva: 'CDR850214AB3',
      sdiCode: 'M5UXCR1',
      address: 'Av. Insurgentes Sur 1458, 03920 Ciudad de México, CDMX',
      contactEmail: 'administracion@clinicaruiz.mx',
      ownerName: 'Dr. Marco Ruiz',
      ownerEmail: 'm.ruiz@clinicaruiz.mx',
    },
    plan: {
      name: 'Professional',
      mrr: 'MXN $5,970',
      nextInvoiceDate: '12/06/2026',
      nextInvoiceAmount: 'MXN $6,925.20 (IVA incluido)',
      paymentMethod: 'Visa •••• 4242',
      stripeCustomerId: 'cus_PqZxK2eR8nFkQp',
    },
    usage: {
      aiConversations: { value: '847', limit: '2.000' },
      voiceMinutes: { value: '124 min', limit: '300 min' },
      bookings: { value: '92', limit: 'ilimitado' },
    },
    integrations: {
      whatsapp: { connected: true, phone: '+52 55 8765 4321' },
      googleCalendar: { connected: true, account: 'agenda@clinicaruiz.mx' },
      elevenlabs: { connected: true, voice: 'Sofía (es-419, cálida)' },
      fattureInCloud: { connected: true, companyName: 'Clínica Ruiz S.A. de C.V.' },
    },
    team: [
      {
        id: 'u_001',
        email: 'm.ruiz@clinicaruiz.mx',
        fullName: 'Marco Ruiz',
        role: 'owner',
        lastLogin: '08/05/2026 09:14',
      },
      {
        id: 'u_002',
        email: 'recepcion@clinicaruiz.mx',
        fullName: 'Ana Blanco',
        role: 'admin',
        lastLogin: '08/05/2026 08:32',
      },
      {
        id: 'u_003',
        email: 'dra.verde@clinicaruiz.mx',
        fullName: 'Laura Verde',
        role: 'member',
        lastLogin: '07/05/2026 19:48',
      },
      {
        id: 'u_004',
        email: 'higiene@clinicaruiz.mx',
        fullName: 'Sara Ferrer',
        role: 'member',
        lastLogin: '06/05/2026 14:22',
      },
    ],
    audit: [
      {
        ts: '08/05/2026 09:14',
        action: 'login',
        target: 'sesión web',
        user: 'm.ruiz@clinicaruiz.mx',
      },
      {
        ts: '08/05/2026 08:42',
        action: 'settings_change',
        target: 'horarios de apertura · viernes',
        user: 'recepcion@clinicaruiz.mx',
      },
      {
        ts: '07/05/2026 19:48',
        action: 'booking_created',
        target: 'cita · limpieza · 14/05',
        user: 'AI agent',
      },
      {
        ts: '07/05/2026 16:10',
        action: 'integration_refresh',
        target: 'Google Calendar token',
        user: 'sistema',
      },
      {
        ts: '06/05/2026 11:03',
        action: 'kb_update',
        target: 'FAQ · precios limpieza',
        user: 'm.ruiz@clinicaruiz.mx',
      },
      {
        ts: '05/05/2026 22:18',
        action: 'voice_reply_sent',
        target: 'conversación #4128',
        user: 'AI agent',
      },
      {
        ts: '05/05/2026 14:30',
        action: 'billing_event',
        target: 'factura #2026-042 emitida',
        user: 'sistema',
      },
      {
        ts: '04/05/2026 17:55',
        action: 'team_invite',
        target: 'higiene@clinicaruiz.mx · role=member',
        user: 'm.ruiz@clinicaruiz.mx',
      },
      {
        ts: '03/05/2026 10:22',
        action: 'gdpr_export',
        target: 'exportación datos paciente · ID MRZL85...',
        user: 'recepcion@clinicaruiz.mx',
      },
      {
        ts: '02/05/2026 09:01',
        action: 'login',
        target: 'sesión web',
        user: 'm.ruiz@clinicaruiz.mx',
      },
    ],
    created: '12/04/2026',
  },
  t2: {
    id: 't2',
    name: 'Beauty Center CDMX',
    vertical: 'beauty',
    status: 'active',
    account: {
      legalName: 'Beauty Center CDMX S.A. de C.V.',
      pIva: 'BCC910315XY9',
      sdiCode: 'KRRH6B9',
      address: 'Av. Reforma 222, 06600 Ciudad de México, CDMX',
      contactEmail: 'info@beautycdmx.mx',
      ownerName: 'Julia Espinosa',
      ownerEmail: 'j.espinosa@beautycdmx.mx',
    },
    plan: {
      name: 'Starter',
      mrr: 'MXN $1,970',
      nextInvoiceDate: '01/06/2026',
      nextInvoiceAmount: 'MXN $2,285.20 (IVA incluido)',
      paymentMethod: 'Visa •••• 8821',
      stripeCustomerId: 'cus_OnL7qR2vN8eKpX',
    },
    usage: {
      aiConversations: { value: '312', limit: '500' },
      voiceMinutes: { value: '38 min', limit: '60 min' },
      bookings: { value: '47', limit: '100' },
    },
    integrations: {
      whatsapp: { connected: true, phone: '+52 55 4567 8910' },
      googleCalendar: { connected: true, account: 'reservas@beautycdmx.mx' },
      elevenlabs: { connected: false, voice: null },
      fattureInCloud: { connected: false, companyName: null },
    },
    team: [
      {
        id: 'u_011',
        email: 'j.espinosa@beautycdmx.mx',
        fullName: 'Julia Espinosa',
        role: 'owner',
        lastLogin: '08/05/2026 11:02',
      },
      {
        id: 'u_012',
        email: 'recepcion@beautycdmx.mx',
        fullName: 'Martina Luna',
        role: 'admin',
        lastLogin: '08/05/2026 10:15',
      },
    ],
    audit: [
      {
        ts: '08/05/2026 11:02',
        action: 'login',
        target: 'sesión web',
        user: 'j.espinosa@beautycdmx.mx',
      },
      {
        ts: '08/05/2026 10:15',
        action: 'settings_change',
        target: 'respuesta automática · fin de semana',
        user: 'recepcion@beautycdmx.mx',
      },
      {
        ts: '07/05/2026 18:33',
        action: 'booking_created',
        target: 'manicure · 12/05 · 16:00',
        user: 'AI agent',
      },
      {
        ts: '06/05/2026 09:48',
        action: 'kb_update',
        target: 'tarifario tratamientos faciales',
        user: 'j.espinosa@beautycdmx.mx',
      },
      {
        ts: '05/05/2026 12:00',
        action: 'plan_change_requested',
        target: 'upgrade Starter → Professional',
        user: 'j.espinosa@beautycdmx.mx',
      },
      {
        ts: '04/05/2026 19:22',
        action: 'login',
        target: 'sesión móvil',
        user: 'j.espinosa@beautycdmx.mx',
      },
      {
        ts: '03/05/2026 14:11',
        action: 'voice_reply_sent',
        target: 'conversación #882',
        user: 'AI agent',
      },
      {
        ts: '02/05/2026 08:55',
        action: 'integration_connected',
        target: 'Google Calendar',
        user: 'j.espinosa@beautycdmx.mx',
      },
    ],
    created: '01/04/2026',
  },
};

const STATUS_BADGE = {
  active: { label: 'Activo', class: 'badge-success' },
  trial: { label: 'Trial', class: 'badge-warm' },
  suspended: { label: 'Suspendido', class: 'badge-danger' },
  cancelled: { label: 'Cancelado', class: 'badge-neutral' },
} as const;

const ROLE_BADGE = {
  owner: { label: 'Owner', class: 'badge' },
  admin: { label: 'Admin', class: 'badge-warm' },
  member: { label: 'Member', class: 'badge-neutral' },
} as const;

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  settings_change: 'Cambio de configuración',
  booking_created: 'Cita creada',
  integration_refresh: 'Refresh de integración',
  integration_connected: 'Integración conectada',
  kb_update: 'Actualización KB',
  voice_reply_sent: 'Respuesta de voz enviada',
  billing_event: 'Evento de facturación',
  team_invite: 'Invitación al equipo',
  gdpr_export: 'Exportación GDPR',
  plan_change_requested: 'Cambio de plan solicitado',
};

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function AdminTenantDetailPage({ params }: PageProps) {
  await requireSuperAdmin();

  const { tenantId } = await params;
  const parsed = TenantIdSchema.safeParse(tenantId);
  if (!parsed.success) {
    notFound();
  }

  const tenant = TENANTS_DETAILS[parsed.data];
  if (!tenant) {
    notFound();
  }

  const status = STATUS_BADGE[tenant.status];

  return (
    <div className="stack stack-8">
      <div className="stack stack-3">
        <Link href="/admin/tenants" className="btn-link" style={{ fontSize: 'var(--text-sm)' }}>
          ← Todos los tenants
        </Link>
        <div className="row-between">
          <div className="stack stack-2">
            <div className="row" style={{ gap: 'var(--space-3)' }}>
              <span className="badge badge-warm">Cross-tenant</span>
              <span className={`badge ${status.class}`}>{status.label}</span>
              <span className="badge badge-neutral">{tenant.vertical}</span>
            </div>
            <h1>{tenant.name}</h1>
            <span className="mono muted" style={{ fontSize: 'var(--text-sm)' }}>
              {tenant.id} · inscrito el {tenant.created}
            </span>
          </div>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <button type="button" className="btn btn-secondary">
              Ver logs completos
            </button>
            <button type="button" className="btn btn-secondary">
              Gestionar facturación
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: 'var(--color-danger-soft)',
                color: 'var(--color-danger)',
                borderColor: 'oklch(85% 0.06 27)',
              }}
            >
              Suspender tenant
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        <section className="card stack stack-4">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Cuenta</h2>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: 'var(--space-5)',
              rowGap: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              margin: 0,
            }}
          >
            <DtRow label="Razón social" value={tenant.account.legalName} />
            <DtRow label="RFC" value={tenant.account.pIva} mono />
            <DtRow label="Código fiscal" value={tenant.account.sdiCode} mono />
            <DtRow label="Dirección" value={tenant.account.address} />
            <DtRow label="Email principal" value={tenant.account.contactEmail} />
            <DtRow
              label="Owner"
              value={`${tenant.account.ownerName} · ${tenant.account.ownerEmail}`}
            />
          </dl>
        </section>

        <section className="card stack stack-4">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Plan & MRR</h2>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: 'var(--space-5)',
              rowGap: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              margin: 0,
            }}
          >
            <DtRow label="Plan actual" value={tenant.plan.name} />
            <DtRow label="MRR" value={tenant.plan.mrr} bold />
            <DtRow label="Próxima factura" value={tenant.plan.nextInvoiceDate} />
            <DtRow label="Importe" value={tenant.plan.nextInvoiceAmount} />
            <DtRow label="Pago" value={tenant.plan.paymentMethod} mono />
            <DtRow label="Customer Stripe" value={tenant.plan.stripeCustomerId} mono />
          </dl>
        </section>
      </div>

      <section className="card stack stack-4">
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Uso · Mayo 2026</h2>
        <div className="kpi-grid" style={{ marginBottom: 0 }}>
          <UsageCard
            label="Conversaciones AI"
            value={tenant.usage.aiConversations.value}
            limit={tenant.usage.aiConversations.limit}
          />
          <UsageCard
            label="Audios transcritos"
            value={tenant.usage.voiceMinutes.value}
            limit={tenant.usage.voiceMinutes.limit}
          />
          <UsageCard
            label="Citas creadas"
            value={tenant.usage.bookings.value}
            limit={tenant.usage.bookings.limit}
          />
        </div>
      </section>

      <section className="card stack stack-4">
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Integraciones</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack-2">
          <IntegrationRow
            name="WhatsApp Cloud API"
            connected={tenant.integrations.whatsapp.connected}
            detail={tenant.integrations.whatsapp.phone}
          />
          <IntegrationRow
            name="Google Calendar"
            connected={tenant.integrations.googleCalendar.connected}
            detail={tenant.integrations.googleCalendar.account}
          />
          <IntegrationRow
            name="ElevenLabs voice"
            connected={tenant.integrations.elevenlabs.connected}
            detail={tenant.integrations.elevenlabs.voice}
          />
          <IntegrationRow
            name="Facturación electrónica"
            connected={tenant.integrations.fattureInCloud.connected}
            detail={tenant.integrations.fattureInCloud.companyName}
          />
        </ul>
      </section>

      <section className="card stack stack-4">
        <div className="row-between">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Equipo ({tenant.team.length})</h2>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Muestra máx. 5 usuarios más recientes
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-sm)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--color-border)',
                }}
              >
                <Th>Usuario</Th>
                <Th>Email</Th>
                <Th>Rol</Th>
                <Th>Último acceso</Th>
              </tr>
            </thead>
            <tbody>
              {tenant.team.slice(0, 5).map((member) => {
                const role = ROLE_BADGE[member.role];
                return (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Td>
                      <span style={{ fontWeight: 600 }}>{member.fullName}</span>
                    </Td>
                    <Td>
                      <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                        {member.email}
                      </span>
                    </Td>
                    <Td>
                      <span className={`badge ${role.class}`}>{role.label}</span>
                    </Td>
                    <Td muted>{member.lastLogin}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack stack-4">
        <div className="row-between">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Audit reciente</h2>
          <Link
            href={`/admin/audit?tenant=${tenant.id}`}
            className="btn-link"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            Ver audit completo →
          </Link>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack-2">
          {tenant.audit.map((entry, idx) => (
            <li
              key={`${entry.ts}-${idx}`}
              className="surface-flat"
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 200px 1fr 200px',
                gap: 'var(--space-4)',
                alignItems: 'center',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <span className="mono muted" style={{ fontSize: 'var(--text-xs)' }}>
                {entry.ts}
              </span>
              <span style={{ fontWeight: 600 }}>{ACTION_LABELS[entry.action] ?? entry.action}</span>
              <span className="muted">{entry.target}</span>
              <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                {entry.user}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function DtRow({
  label,
  value,
  mono,
  bold,
}: Readonly<{ label: string; value: string; mono?: boolean; bold?: boolean }>) {
  return (
    <>
      <dt
        className="muted"
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          paddingTop: '2px',
        }}
      >
        {label}
      </dt>
      <dd
        className={mono ? 'mono' : undefined}
        style={{
          margin: 0,
          fontWeight: bold ? 600 : 400,
        }}
      >
        {value}
      </dd>
    </>
  );
}

function UsageCard({
  label,
  value,
  limit,
}: Readonly<{ label: string; value: string; limit: string }>) {
  return (
    <article className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
        de {limit} incluidos
      </span>
    </article>
  );
}

function IntegrationRow({
  name,
  connected,
  detail,
}: Readonly<{ name: string; connected: boolean; detail: string | null }>) {
  return (
    <li
      className="surface-flat"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 120px',
        gap: 'var(--space-4)',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <span style={{ fontWeight: 600 }}>{name}</span>
      <span className="mono muted" style={{ fontSize: 'var(--text-xs)' }}>
        {detail ?? '—'}
      </span>
      <span
        className={`badge ${connected ? 'badge-success' : 'badge-neutral'}`}
        style={{ justifySelf: 'end' }}
      >
        {connected ? 'Conectado' : 'No conectado'}
      </span>
    </li>
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

function Td({ children, muted }: Readonly<{ children: React.ReactNode; muted?: boolean }>) {
  return (
    <td
      className={muted ? 'muted' : undefined}
      style={{
        padding: 'var(--space-3) var(--space-4)',
        fontSize: muted ? 'var(--text-xs)' : 'var(--text-sm)',
      }}
    >
      {children}
    </td>
  );
}
