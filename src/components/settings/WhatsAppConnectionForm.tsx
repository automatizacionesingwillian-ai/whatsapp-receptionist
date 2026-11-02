'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { useApiForm, type ApiFormState } from '@/components/forms/useApiForm';

const ENDPOINT = '/api/settings/integrations/whatsapp';

/**
 * Proiezione client dello stato di connessione.
 *
 * È dichiarata qui e non importata da `@/server/whatsapp/provisioning` perché
 * quel modulo istanzia il client Supabase con la service role key: anche un
 * import di solo tipo lo espone al grafo del bundle client. I campi sono gli
 * stessi di `WhatsAppConnectionStatus`, quindi il Server Component può passare
 * il risultato del servizio senza adattarlo.
 */
export interface WhatsAppConnectionView {
  readonly connected: boolean;
  readonly phoneNumberId: string | null;
  readonly displayPhoneNumber: string | null;
  readonly wabaId?: string | null;
  readonly status: string | null;
  readonly hasApiKey: boolean;
  readonly connectedAt: string | null;
}

interface WhatsAppConnectionFormProps {
  readonly status: WhatsAppConnectionView;
  /** Solo owner e admin possono scrivere: l'API rifiuta gli altri con 403. */
  readonly canManage: boolean;
}

const IDLE: ApiFormState = { status: 'idle', message: null };

export function WhatsAppConnectionForm({ status, canManage }: WhatsAppConnectionFormProps) {
  const router = useRouter();
  const isConnected = status.connected;

  const { state, onSubmit } = useApiForm({
    endpoint: ENDPOINT,
    successMessage: isConnected
      ? 'Número actualizado. Ambrogio responde en este canal.'
      : 'Número conectado. Ambrogio responde en este canal.',
    buildBody: (formData) => ({
      phoneNumberId: String(formData.get('phoneNumberId') ?? ''),
      displayPhoneNumber: String(formData.get('displayPhoneNumber') ?? ''),
      wabaId: String(formData.get('wabaId') ?? ''),
      apiKey: String(formData.get('apiKey') ?? ''),
    }),
  });

  const [disconnectState, setDisconnectState] = useState<ApiFormState>(IDLE);
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);

  // Lo stato mostrato qui è letto lato server: dopo una scrittura riuscita va
  // riletto, altrimenti la scheda continua a descrivere la situazione di prima.
  const shouldRefresh = state.status === 'success' || disconnectState.status === 'success';
  useEffect(() => {
    if (shouldRefresh) {
      router.refresh();
    }
  }, [shouldRefresh, router]);

  const onDisconnect = useCallback(async (): Promise<void> => {
    setDisconnectState({ status: 'submitting', message: null });

    let response: Response;
    try {
      response = await fetch(ENDPOINT, { method: 'DELETE' });
    } catch {
      setDisconnectState({
        status: 'error',
        message: 'No se pudo conectar. Revisa tu red e inténtalo de nuevo.',
      });
      return;
    }

    if (!response.ok) {
      setDisconnectState({ status: 'error', message: await readErrorMessage(response) });
      return;
    }

    setIsConfirmingDisconnect(false);
    setDisconnectState({
      status: 'success',
      message: 'Número desvinculado. Los mensajes entrantes ya no se gestionarán.',
    });
  }, []);

  const isSubmitting = state.status === 'submitting';
  const isDisconnecting = disconnectState.status === 'submitting';

  return (
    <div className="stack stack-6">
      <section className="card stack stack-4">
        <div className="row-between" style={{ gap: 'var(--space-4)' }}>
          <div className="stack stack-2">
            <span className="eyebrow">Estado del canal</span>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>
              {isConnected ? 'Número conectado' : 'Ningún número conectado'}
            </h2>
          </div>
          <span className={isConnected ? 'badge badge-success' : 'badge badge-neutral'}>
            {statusLabel(status)}
          </span>
        </div>

        {isConnected ? (
          <dl className="stack stack-3" style={{ margin: 0 }}>
            <DetailRow
              label="Número mostrado"
              value={status.displayPhoneNumber ?? 'No configurado'}
              isMono={status.displayPhoneNumber !== null}
            />
            <DetailRow label="Phone number ID" value={status.phoneNumberId ?? '—'} isMono />
            <DetailRow label="WABA ID" value={status.wabaId ?? '—'} isMono />
            <DetailRow
              label="Access token"
              value={status.hasApiKey ? 'Guardado y cifrado' : 'Faltante: el canal no puede enviar'}
            />
            <DetailRow label="Integración creada el" value={formatDate(status.connectedAt)} />
          </dl>
        ) : (
          <div className="stack stack-3">
            <p className="muted">
              Mientras el número no esté conectado, los mensajes de WhatsApp no se asocian a tu
              negocio y Ambrogio no responde. Completa el formulario con los datos de tu app de Meta
              (WhatsApp → API Setup).
            </p>
            {status.status !== null && status.status !== 'active' ? (
              <p className="helper">
                Existe una configuración anterior en estado «{status.status}». Al guardar los nuevos
                datos se reactivará.
              </p>
            ) : null}
          </div>
        )}

        <FormFeedback state={disconnectState} id="whatsapp-disconnect-feedback" />

        {isConnected && canManage ? (
          <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {isConfirmingDisconnect ? (
              <>
                <span className="helper" style={{ alignSelf: 'center' }}>
                  ¿Confirmas? Ambrogio dejará de responder en este número.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? 'Desvinculando…' : 'Sí, desvincular'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsConfirmingDisconnect(false)}
                  disabled={isDisconnecting}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsConfirmingDisconnect(true)}
              >
                Desvincular número
              </button>
            )}
          </div>
        ) : null}
      </section>

      {canManage ? (
        <form onSubmit={onSubmit} className="card stack stack-6" noValidate>
          <div className="stack stack-2">
            <h2 style={{ fontSize: 'var(--text-xl)' }}>
              {isConnected ? 'Actualizar la conexión' : 'Conectar el número'}
            </h2>
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              Datos de{' '}
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noreferrer"
                className="btn-link"
              >
                Meta for Developers
              </a>
              : WhatsApp → API Setup (Phone number ID, WhatsApp Business Account ID y token).
            </p>
          </div>

          <FormFeedback state={state} id="whatsapp-connect-feedback" />

          <div className="field">
            <label htmlFor="phoneNumberId" className="label">
              Phone number ID
            </label>
            <input
              id="phoneNumberId"
              name="phoneNumberId"
              type="text"
              required
              maxLength={120}
              autoComplete="off"
              className="input"
              defaultValue={status.phoneNumberId ?? ''}
              placeholder="ej. 109876543210987"
              aria-describedby="phoneNumberId-help"
              disabled={isSubmitting}
            />
            <p id="phoneNumberId-help" className="helper">
              En la app Meta → WhatsApp → API Setup. Es el ID con el que asociamos cada mensaje
              entrante a este negocio.
            </p>
          </div>

          <div className="field">
            <label htmlFor="wabaId" className="label">
              WhatsApp Business Account ID (WABA)
            </label>
            <input
              id="wabaId"
              name="wabaId"
              type="text"
              maxLength={120}
              autoComplete="off"
              className="input"
              defaultValue={status.wabaId ?? ''}
              placeholder="ej. 102938475610293"
              aria-describedby="wabaId-help"
              disabled={isSubmitting}
            />
            <p id="wabaId-help" className="helper">
              Opcional para enviar, recomendado para sincronizar plantillas aprobadas.
            </p>
          </div>

          <div className="field">
            <label htmlFor="displayPhoneNumber" className="label">
              Número en formato legible
            </label>
            <input
              id="displayPhoneNumber"
              name="displayPhoneNumber"
              type="tel"
              maxLength={40}
              autoComplete="off"
              className="input"
              defaultValue={status.displayPhoneNumber ?? ''}
              placeholder="+52 55 1234 5678"
              aria-describedby="displayPhoneNumber-help"
              disabled={isSubmitting}
            />
            <p id="displayPhoneNumber-help" className="helper">
              Opcional. Solo te ayuda a reconocer el número en las pantallas.
            </p>
          </div>

          <div className="field">
            <label htmlFor="apiKey" className="label">
              Access token de Meta
            </label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              required
              minLength={8}
              maxLength={512}
              autoComplete="off"
              spellCheck={false}
              className="input"
              placeholder={
                isConnected ? 'Vuelve a pegar el token para guardar' : 'Pega el access token'
              }
              aria-describedby="apiKey-help"
              disabled={isSubmitting}
            />
            <p id="apiKey-help" className="helper">
              Token permanente de System User (o el temporal de prueba). Lo guardamos cifrado y no
              lo volvemos a mostrar: para rotarlo, pégalo de nuevo.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : isConnected ? 'Guardar cambios' : 'Conectar número'}
          </button>
        </form>
      ) : (
        <p className="helper">
          Solo el titular de la cuenta y los administradores pueden modificar esta integración. Pide
          a quien gestione el negocio que conecte el número.
        </p>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isMono = false,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  return (
    <div className="row-between" style={{ gap: 'var(--space-4)', alignItems: 'baseline' }}>
      <dt className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        {label}
      </dt>
      <dd
        className={isMono ? 'mono' : undefined}
        style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right' }}
      >
        {value}
      </dd>
    </div>
  );
}

function statusLabel(status: WhatsAppConnectionView): string {
  if (status.connected) {
    return 'Activo';
  }

  if (status.status === 'revoked') {
    return 'Desvinculado';
  }

  return status.status === null ? 'No configurado' : status.status;
}

function formatDate(value: string | null): string {
  if (value === null) {
    return 'No disponible';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'No disponible';
  }

  return parsed.toLocaleDateString('es-419', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** L'envelope d'errore di `jsonHandler` è `{ ok: false, error: { code, message } }`. */
async function readErrorMessage(response: Response): Promise<string> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const code = readErrorField(payload, 'code');

  if (code === 'forbidden') {
    return 'No tienes permiso para modificar esta integración.';
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

  return 'No pudimos desconectar el número. Inténtalo de nuevo pronto.';
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
