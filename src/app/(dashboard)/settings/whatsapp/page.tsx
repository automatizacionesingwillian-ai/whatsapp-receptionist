import type { Metadata } from 'next';
import Link from 'next/link';

import {
  WhatsAppConnectionForm,
  type WhatsAppConnectionView,
} from '@/components/settings/WhatsAppConnectionForm';
import { requireSession } from '@/lib/auth/session';
import { logger } from '@/lib/logging/logger';
import { createWhatsAppProvisioningService } from '@/server/whatsapp/provisioning';

export const metadata: Metadata = {
  title: 'WhatsApp Business · Configuración · Ambrogio.ai',
};

// El estado depende de la sesión: no debe cachearse de forma estática.
export const dynamic = 'force-dynamic';

type LoadResult =
  { readonly ok: true; readonly status: WhatsAppConnectionView } | { readonly ok: false };

async function loadStatus(tenantId: string): Promise<LoadResult> {
  try {
    const service = createWhatsAppProvisioningService();
    return { ok: true, status: await service.getStatus(tenantId) };
  } catch (error) {
    // Il layout ha già garantito la sessione: un errore qui è del datastore,
    // e vale la pena mostrare la pagina in stato degradato invece di un 500.
    logger.error({ err: error, tenantId }, 'Lettura stato integrazione WhatsApp fallita');
    return { ok: false };
  }
}

export default async function WhatsAppSettingsPage() {
  const session = await requireSession();
  const result = await loadStatus(session.tenantId);

  return (
    <>
      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">
            <Link href="/settings" className="btn-link">
              Configuración
            </Link>{' '}
            / Integraciones
          </span>
          <h1>WhatsApp Business</h1>
          <p className="muted">
            Conecta el Phone number ID y el access token de tu app de Meta. Una sola app puede
            servir varios negocios: cada tenant usa su propio número.
          </p>
        </div>
      </div>

      {result.ok ? (
        <WhatsAppConnectionForm
          status={result.status}
          canManage={session.role === 'owner' || session.role === 'admin'}
        />
      ) : (
        <section className="card stack stack-3">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Estado no legible</h2>
          <p className="muted">
            No pudimos recuperar la configuración del canal. No significa que el número se haya
            desconectado: solo falló la lectura. Recarga en un momento y, si el problema continúa,
            escríbenos desde la página de contacto.
          </p>
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <Link href="/settings/whatsapp" className="btn btn-secondary btn-sm">
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
