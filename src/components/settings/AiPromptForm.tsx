'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { useApiForm, type ApiFormState } from '@/components/forms/useApiForm';

const ENDPOINT = '/api/ai-prompts';

/**
 * Proiezioni client dei tipi di `@/server/ai/prompt-settings`.
 *
 * Sono ridichiarate qui e non importate perche' quel modulo istanzia il client
 * Supabase con la service role key: anche un import di solo tipo lo trascina
 * nel grafo del bundle client. I campi sono un sottoinsieme, quindi il Server
 * Component puo' passare il risultato del servizio senza adattarlo.
 */
export interface AiPromptSectionView {
  readonly key: string;
  readonly title: string;
  readonly lines: readonly string[];
}

export interface AiPromptVersionView {
  readonly id: string;
  readonly version: number;
  readonly promptText: string;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface AiPromptSettingsView {
  readonly assistantName: string;
  readonly defaultPersona: string;
  readonly activeVersion: AiPromptVersionView | null;
  readonly versions: readonly AiPromptVersionView[];
  readonly immutableSections: readonly AiPromptSectionView[];
  /** System prompt completo, con la personalita attiva gia composta nei blocchi. */
  readonly composedPreview: string;
  readonly limits: {
    readonly minLength: number;
    readonly maxLength: number;
  };
}

interface AiPromptFormProps {
  readonly settings: AiPromptSettingsView;
  /** Solo owner e admin possono scrivere: l'API rifiuta gli altri con 403. */
  readonly canManage: boolean;
}

const IDLE: ApiFormState = { status: 'idle', message: null };

export function AiPromptForm({ settings, canManage }: AiPromptFormProps) {
  const router = useRouter();
  const currentPersona = settings.activeVersion?.promptText ?? settings.defaultPersona;
  const [persona, setPersona] = useState(currentPersona);
  const [restoreState, setRestoreState] = useState<ApiFormState>(IDLE);
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);

  const { state, onSubmit } = useApiForm({
    endpoint: ENDPOINT,
    successMessage: 'Personalidad publicada. La versión anterior sigue disponible abajo.',
    buildBody: (formData) => ({
      action: 'publish',
      promptText: String(formData.get('promptText') ?? ''),
    }),
  });

  // Dopo una scrittura riuscita la cronologia e la versione attiva sono
  // cambiate lato server: senza refresh la pagina descrive lo stato di prima.
  const shouldRefresh = state.status === 'success' || restoreState.status === 'success';
  useEffect(() => {
    if (shouldRefresh) {
      router.refresh();
    }
  }, [shouldRefresh, router]);

  // `useApiForm` chiama `form.reset()` al successo: il textarea controllato
  // deve tornare in pari con quanto e' stato appena pubblicato.
  useEffect(() => {
    setPersona(currentPersona);
  }, [currentPersona]);

  const onRestore = useCallback(async (versionId: string): Promise<void> => {
    setPendingVersionId(versionId);
    setRestoreState({ status: 'submitting', message: null });

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'activate', versionId }),
      });
    } catch {
      setPendingVersionId(null);
      setRestoreState({
        status: 'error',
        message: 'No se pudo conectar. Revisa tu red e inténtalo de nuevo.',
      });
      return;
    }

    setPendingVersionId(null);

    if (!response.ok) {
      setRestoreState({ status: 'error', message: await readErrorMessage(response) });
      return;
    }

    setRestoreState({
      status: 'success',
      message: 'Versión restaurada. Ambrogio vuelve a responder con este texto.',
    });
  }, []);

  const isSubmitting = state.status === 'submitting';
  const isRestoring = restoreState.status === 'submitting';
  const personaLength = persona.trim().length;
  const isTooShort = personaLength < settings.limits.minLength;

  return (
    <div className="stack stack-6">
      <section className="card stack stack-4">
        <div className="row-between" style={{ gap: 'var(--space-4)' }}>
          <div className="stack stack-2">
            <span className="eyebrow">Estado</span>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>
              {settings.activeVersion
                ? `Personalidad personalizada, versión ${settings.activeVersion.version}`
                : 'Personalidad predeterminada'}
            </h2>
          </div>
          <span className={settings.activeVersion ? 'badge badge-success' : 'badge badge-neutral'}>
            {settings.activeVersion ? 'Personalizada' : 'Predeterminada'}
          </span>
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {settings.activeVersion
            ? `Publicada el ${formatDate(settings.activeVersion.createdAt)}.`
            : `Ninguna versión publicada: ${settings.assistantName} usa el texto predeterminado, que ya está compilado abajo.`}
        </p>
      </section>

      <section className="card stack stack-4">
        <div className="stack stack-2">
          <span className="eyebrow">Perímetro</span>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Lo que no puedes cambiar</h2>
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            El texto que escribes se inserta <em>entre</em> estos dos bloques, no en lugar de ellos.
            Siguen activos aunque tu texto pida ignorarlos.
          </p>
        </div>

        {settings.immutableSections.map((section) => (
          <div key={section.key} className="stack stack-2">
            <h3 className="mono" style={{ fontSize: 'var(--text-sm)' }}>
              {section.title}
            </h3>
            <ul
              className="stack stack-1"
              style={{
                listStyle: 'none',
                padding: 'var(--space-3) var(--space-4)',
                margin: 0,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-sunken)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {section.lines.map((line) => (
                <li key={line} className="muted">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <details className="stack stack-2">
          <summary style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Mostrar el prompt completo que recibe el modelo
          </summary>
          <pre
            className="mono"
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-sunken)',
              fontSize: 'var(--text-xs)',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
              margin: 0,
            }}
          >
            {settings.composedPreview}
          </pre>
        </details>
      </section>

      {canManage ? (
        <form onSubmit={onSubmit} className="card stack stack-6" noValidate>
          <div className="stack stack-2">
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Personalidad y tono</h2>
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              Cómo se presenta {settings.assistantName}, qué registro usa y qué destaca. Cada
              guardado crea una nueva versión y desactiva la anterior, que puedes restaurar.
            </p>
          </div>

          <FormFeedback state={state} id="ai-prompt-publish-feedback" />

          <div className="field">
            <label htmlFor="promptText" className="label">
              Texto de la personalidad
            </label>
            <textarea
              id="promptText"
              name="promptText"
              className="textarea"
              rows={12}
              required
              minLength={settings.limits.minLength}
              maxLength={settings.limits.maxLength}
              spellCheck
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
              aria-describedby="promptText-help"
              disabled={isSubmitting}
            />
            <p id="promptText-help" className="helper">
              {personaLength} / {settings.limits.maxLength} caracteres. Mínimo{' '}
              {settings.limits.minLength}. Escribe instrucciones, no ejemplos de respuesta: el modelo
              las aplica a cada mensaje.
            </p>
          </div>

          <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isTooShort || persona.trim() === currentPersona.trim()}
            >
              {isSubmitting ? 'Publicando…' : 'Publicar nueva versión'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPersona(settings.defaultPersona)}
              disabled={isSubmitting}
            >
              Volver al texto predeterminado
            </button>
          </div>
        </form>
      ) : (
        <p className="helper">
          Solo el titular de la cuenta y los administradores pueden modificar la personalidad del
          asistente.
        </p>
      )}

      <section className="card stack stack-4">
        <div className="stack stack-2">
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Versiones</h2>
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Si un cambio empeora las respuestas, reactiva la versión anterior: el texto no se
            reescribe, solo cambia cuál versión está activa.
          </p>
        </div>

        <FormFeedback state={restoreState} id="ai-prompt-restore-feedback" />

        {settings.versions.length === 0 ? (
          <p className="helper">
            Ninguna versión publicada. El historial empieza con el primer guardado.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack-3">
            {settings.versions.map((version) => (
              <li
                key={version.id}
                className="stack stack-2"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-sunken)',
                }}
              >
                <div className="row-between" style={{ gap: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                    Versión {version.version} · {formatDate(version.createdAt)}
                  </span>
                  {version.active ? (
                    <span className="badge badge-success">Activa</span>
                  ) : canManage ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => void onRestore(version.id)}
                      disabled={isRestoring}
                    >
                      {pendingVersionId === version.id ? 'Restaurando…' : 'Restaurar'}
                    </button>
                  ) : null}
                </div>
                <p
                  className="muted"
                  style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', margin: 0 }}
                >
                  {version.promptText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'fecha no disponible';
  }

  return parsed.toLocaleDateString('es-419', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** L'envelope d'errore di `jsonHandler` e' `{ ok: false, error: { code, message } }`. */
async function readErrorMessage(response: Response): Promise<string> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const code = readErrorField(payload, 'code');

  if (code === 'forbidden') {
    return 'No tienes permisos para modificar la personalidad del asistente.';
  }

  if (code === 'rate_limited') {
    return 'Demasiados intentos seguidos. Vuelve a intentarlo en unos minutos.';
  }

  if (code === 'unauthorized') {
    return 'Sesión no válida. Inicia sesión de nuevo.';
  }

  if (code === 'not_found') {
    return 'Esta versión ya no existe. Recarga la página.';
  }

  const exposed = readErrorField(payload, 'message');
  if (exposed !== null && exposed !== 'Internal server error') {
    return exposed;
  }

  return 'No pudimos restaurar la versión. Inténtalo de nuevo pronto.';
}

function readErrorField(payload: unknown, field: 'code' | 'message'): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const error = (payload as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const value = (error as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : null;
}
