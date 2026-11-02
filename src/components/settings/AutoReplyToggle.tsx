'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { type ApiFormState } from '@/components/forms/useApiForm';

const ENDPOINT = '/api/settings/tenant';

interface AutoReplyToggleProps {
  readonly enabled: boolean;
  /** Solo owner y admin pueden escribir: la API responde 403 al resto. */
  readonly canManage: boolean;
}

const IDLE: ApiFormState = { status: 'idle', message: null };

export function AutoReplyToggle({ enabled, canManage }: AutoReplyToggleProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [state, setState] = useState<ApiFormState>(IDLE);

  useEffect(() => {
    setChecked(enabled);
  }, [enabled]);

  const onToggle = useCallback(
    async (next: boolean): Promise<void> => {
      if (!canManage || state.status === 'submitting') {
        return;
      }

      const previous = checked;
      setChecked(next);
      setState({ status: 'submitting', message: null });

      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ autoReplyEnabled: next }),
        });
      } catch {
        setChecked(previous);
        setState({
          status: 'error',
          message: 'No se pudo conectar. Revisa tu red e inténtalo de nuevo.',
        });
        return;
      }

      if (!response.ok) {
        setChecked(previous);
        setState({ status: 'error', message: await readErrorMessage(response) });
        return;
      }

      setState({
        status: 'success',
        message: next
          ? 'Respuestas automáticas activadas. Ambrogio responde por WhatsApp.'
          : 'Respuestas automáticas desactivadas. Los mensajes quedan en la bandeja.',
      });
      router.refresh();
    },
    [canManage, checked, router, state.status],
  );

  return (
    <section className="card stack stack-4">
      <div className="row-between" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div className="stack stack-2">
          <span className="eyebrow">WhatsApp</span>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Respuestas automáticas</h2>
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Cuando está activo, Ambrogio responde solo a los clientes que no hayan pedido dejar de
            recibir mensajes. Desactívalo si quieres atender la bandeja a mano.
          </p>
        </div>
        <span className={checked ? 'badge badge-success' : 'badge badge-neutral'}>
          {checked ? 'Activo' : 'Apagado'}
        </span>
      </div>

      <FormFeedback state={state} id="auto-reply-toggle-feedback" />

      <label
        htmlFor="autoReplyEnabled"
        className="row-between"
        style={{
          gap: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-sunken)',
          cursor: canManage ? 'pointer' : 'not-allowed',
          opacity: canManage ? 1 : 0.65,
        }}
      >
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          Responder automáticamente por WhatsApp
        </span>
        <input
          id="autoReplyEnabled"
          type="checkbox"
          checked={checked}
          disabled={!canManage || state.status === 'submitting'}
          onChange={(event) => {
            void onToggle(event.target.checked);
          }}
          style={{ width: '1.25rem', height: '1.25rem' }}
        />
      </label>

      {!canManage ? (
        <p className="helper">
          Solo el titular de la cuenta y los administradores pueden cambiar esta opción.
        </p>
      ) : null}
    </section>
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const code = readErrorField(payload, 'code');

  if (code === 'forbidden') {
    return 'No tienes permiso para modificar esta opción.';
  }

  if (code === 'rate_limited') {
    return 'Demasiados intentos seguidos. Vuelve a intentarlo en unos minutos.';
  }

  if (code === 'unauthorized') {
    return 'Sesión no válida. Inicia sesión de nuevo.';
  }

  const exposed = readErrorField(payload, 'message');
  if (exposed !== null && exposed !== 'Internal server error') {
    return exposed;
  }

  return 'No se pudo guardar el cambio. Inténtalo de nuevo.';
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
