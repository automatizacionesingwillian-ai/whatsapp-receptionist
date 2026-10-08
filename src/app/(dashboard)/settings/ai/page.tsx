import type { Metadata } from 'next';
import Link from 'next/link';

import { AiPromptForm, type AiPromptSettingsView } from '@/components/settings/AiPromptForm';
import { requireSession, type AuthSession } from '@/lib/auth/session';
import { logger } from '@/lib/logging/logger';
import { createAiPromptSettingsService } from '@/server/ai/prompt-settings';

export const metadata: Metadata = {
  title: 'Personalidad AI · Configuración · Ambrogio.ai',
};

// Lo stato dipende dalla sessione: non deve finire in cache statica.
export const dynamic = 'force-dynamic';

type LoadResult =
  | { readonly ok: true; readonly settings: AiPromptSettingsView }
  | { readonly ok: false };

async function loadSettings(session: AuthSession): Promise<LoadResult> {
  try {
    const settings = await createAiPromptSettingsService().getSettings({ session });
    return { ok: true, settings };
  } catch (error) {
    // Il layout ha gia' garantito la sessione: un errore qui viene dal datastore.
    // Meglio una pagina in stato degradato che un 500 sull'intera schermata.
    logger.error({ err: error, tenantId: session.tenantId }, 'Lettura prompt AI fallita');
    return { ok: false };
  }
}

export default async function AiSettingsPage() {
  const session = await requireSession();
  const result = await loadSettings(session);

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
        <AiPromptForm
          settings={result.settings}
          canManage={session.role === 'owner' || session.role === 'admin'}
        />
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
