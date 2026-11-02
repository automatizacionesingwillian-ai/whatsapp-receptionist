import type { Metadata } from 'next';
import Link from 'next/link';

import { AiPromptForm, type AiPromptSettingsView } from '@/components/settings/AiPromptForm';
import { AutoReplyToggle } from '@/components/settings/AutoReplyToggle';
import { requireSession, type AuthSession } from '@/lib/auth/session';
import { logger } from '@/lib/logging/logger';
import { createAiPromptSettingsService } from '@/server/ai/prompt-settings';
import { createTenantSettingsService } from '@/server/settings/tenant-settings';

export const metadata: Metadata = {
  title: 'Personalidad AI · Configuración · Ambrogio.ai',
};

// El estado depende de la sesión: no debe cachearse de forma estática.
export const dynamic = 'force-dynamic';

type LoadResult =
  | {
      readonly ok: true;
      readonly settings: AiPromptSettingsView;
      readonly autoReplyEnabled: boolean;
    }
  | { readonly ok: false };

async function loadSettings(session: AuthSession): Promise<LoadResult> {
  try {
    const [settings, snapshot] = await Promise.all([
      createAiPromptSettingsService().getSettings({ session }),
      createTenantSettingsService().getSnapshot({ session }),
    ]);
    return {
      ok: true,
      settings,
      autoReplyEnabled: snapshot.config.autoReplyEnabled,
    };
  } catch (error) {
    // El layout ya garantizó la sesión: un error aquí viene del datastore.
    // Mejor una página degradada que un 500 en toda la pantalla.
    logger.error({ err: error, tenantId: session.tenantId }, 'Lectura de ajustes AI fallida');
    return { ok: false };
  }
}

export default async function AiSettingsPage() {
  const session = await requireSession();
  const result = await loadSettings(session);
  const canManage = session.role === 'owner' || session.role === 'admin';

  return (
    <>
      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">
            <Link href="/settings" className="btn-link">
              Configuración
            </Link>{' '}
            / AI
          </span>
          <h1>Personalidad del asistente</h1>
          <p className="muted">
            Decide cómo habla Ambrogio con tus clientes. Las reglas de seguridad y el formato de la
            respuesta siguen siendo nuestros: puedes leerlas abajo, pero no reemplazarlas.
          </p>
        </div>
      </div>

      {result.ok ? (
        <div className="stack stack-6">
          <AutoReplyToggle enabled={result.autoReplyEnabled} canManage={canManage} />
          <AiPromptForm settings={result.settings} canManage={canManage} />
        </div>
      ) : (
        <section className="card stack stack-3">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Configuración no legible</h2>
          <p className="muted">
            No pudimos recuperar la personalidad configurada. No significa que se haya
            perdido: solo falló la lectura y las respuestas siguen usando la
            última versión activa. Recarga en un momento y, si el problema continúa, escríbenos desde
            contacto.
          </p>
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <Link href="/settings/ai" className="btn btn-secondary btn-sm">
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
