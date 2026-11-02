'use client';

import { useCallback, useState, type FormEvent } from 'react';

export type ApiFormStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ApiFormState {
  readonly status: ApiFormStatus;
  readonly message: string | null;
  /** Payload `data` della risposta API in caso di successo. */
  readonly data?: unknown;
}

interface ApiErrorEnvelope {
  ok: false;
  error: { code: string; message: string };
}

interface ApiSuccessEnvelope {
  ok: true;
  data: unknown;
}

export interface UseApiFormOptions {
  /** Route API che riceve il POST JSON. */
  readonly endpoint: string;
  /** Messaggio mostrato al successo, quando non si naviga altrove. */
  readonly successMessage: string;
  /** Se valorizzato, al successo naviga qui invece di mostrare il messaggio. */
  readonly redirectTo?: string;
  /**
   * Trasforma i campi del form nel body JSON.
   * Default: ogni campo diventa una stringa omonima.
   */
  readonly buildBody?: (formData: FormData) => unknown;
}

/**
 * Messaggi utente per i codici d'errore dell'API.
 *
 * `jsonHandler` restituisce messaggi pensati per gli sviluppatori e, per gli
 * errori non esposti, il generico "Internal server error": nessuno dei due è
 * adatto a un utente finale.
 */
const MESSAGE_BY_CODE: Record<string, string> = {
  rate_limited: 'Demasiados intentos seguidos. Vuelve a intentarlo en unos minutos.',
  bad_request: 'Algunos datos no son válidos. Revisa los campos e inténtalo de nuevo.',
  validation_error: 'Algunos datos no son válidos. Revisa los campos e inténtalo de nuevo.',
  unauthorized: 'Sesión no válida. Inicia sesión de nuevo.',
  forbidden: 'No tienes permiso para completar esta acción.',
  not_found: 'Recurso no encontrado.',
  conflict: 'Ya existe una cuenta con estos datos.',
};

const FALLBACK_MESSAGE =
  'Ocurrió un error inesperado. Inténtalo de nuevo y, si persiste, escríbenos desde /contact.';

function defaultBuildBody(formData: FormData): Record<string, string> {
  const body: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      body[key] = value;
    }
  }
  return body;
}

function messageFor(payload: unknown, httpStatus: number): string {
  const envelope = payload as Partial<ApiErrorEnvelope> | null;
  const code = envelope?.error?.code;

  if (code && MESSAGE_BY_CODE[code]) {
    return MESSAGE_BY_CODE[code];
  }

  // Un messaggio esposto dall'API è già stato giudicato mostrabile a monte:
  // `jsonHandler` sostituisce con un generico tutto ciò che non è `expose`.
  const exposed = envelope?.error?.message;
  if (exposed && exposed !== 'Internal server error') {
    return exposed;
  }

  if (httpStatus >= 500) {
    return 'El servicio no está disponible en este momento. Vuelve a intentarlo pronto.';
  }

  return FALLBACK_MESSAGE;
}

/**
 * Invio di un form verso un'API JSON, con stato osservabile.
 *
 * Le route API del progetto accettano esclusivamente JSON (`readJsonBody` fa
 * `JSON.parse` del raw body): un `<form method="POST">` nativo invia
 * `application/x-www-form-urlencoded` e fallisce sempre. Questo hook mantiene
 * il contratto JSON dell'API e restituisce un errore mostrabile all'utente,
 * invece di far navigare il browser sulla risposta grezza dell'API.
 */
export function useApiForm(options: UseApiFormOptions): {
  state: ApiFormState;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
} {
  const [state, setState] = useState<ApiFormState>({ status: 'idle', message: null });

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      const form = event.currentTarget;
      const formData = new FormData(form);
      const body = (options.buildBody ?? defaultBuildBody)(formData);

      setState({ status: 'submitting', message: null });

      let response: Response;
      try {
        response = await fetch(options.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {
        // Fallimento di rete: nessuna risposta, quindi nessun envelope da leggere.
        setState({
          status: 'error',
          message: 'No se pudo conectar. Revisa tu red e inténtalo de nuevo.',
        });
        return;
      }

      let payload: unknown = null;
      try {
        payload = (await response.json()) as ApiSuccessEnvelope | ApiErrorEnvelope;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setState({ status: 'error', message: messageFor(payload, response.status) });
        return;
      }

      form.reset();

      if (options.redirectTo !== undefined) {
        window.location.assign(options.redirectTo);
        return;
      }

      const successData =
        payload !== null && typeof payload === 'object' && 'data' in (payload as ApiSuccessEnvelope)
          ? (payload as ApiSuccessEnvelope).data
          : undefined;

      if (successData !== undefined) {
        setState({ status: 'success', message: options.successMessage, data: successData });
      } else {
        setState({ status: 'success', message: options.successMessage });
      }
    },
    [options],
  );

  return { state, onSubmit };
}
