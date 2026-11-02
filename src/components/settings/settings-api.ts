import { isApiError } from '@/lib/api-client';

/**
 * Adattatore fra `apiFetch` e le schermate di configurazione.
 *
 * `apiFetch` lancia `ApiError` con messaggi in inglese pensati per chi sviluppa
 * («Business hours cannot overlap»): qui diventano un esito esplicito con un
 * testo mostrabile. `useApiForm` fa la stessa traduzione ma solo per i form in
 * POST, mentre queste route usano PUT, PATCH e DELETE.
 */
export type ApiResult<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly message: string };

/**
 * Messaggi utente per i codici d'errore dell'API.
 *
 * I testi coincidono con quelli di `useApiForm` (lì non sono esportati): la
 * stessa condizione deve leggersi allo stesso modo in tutta l'app.
 */
const MESSAGE_BY_CODE: Readonly<Record<string, string>> = {
  rate_limited: 'Demasiados intentos seguidos. Vuelve a intentarlo en unos minutos.',
  bad_request: 'Algunos datos no son válidos. Revisa los campos e inténtalo de nuevo.',
  unauthorized: 'Sesión no válida. Inicia sesión de nuevo.',
  forbidden: 'No tienes permisos para completar esta operación.',
  not_found: 'Recurso no encontrado: quizá fue modificado desde otra sesión.',
  conflict: 'Ya existe un elemento con estos datos.',
  network_error: 'No se pudo conectar. Revisa tu red e inténtalo de nuevo.',
  invalid_response: 'El servidor respondió en un formato que no reconocemos. Recarga la página.',
  upstream_error: 'El servicio no está disponible en este momento. Inténtalo de nuevo pronto.',
};

/** Esegue una chiamata di `api-client` restituendo l'esito invece di lanciarlo. */
export async function runRequest<T>(
  action: () => Promise<T>,
  fallbackMessage: string,
): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    return { ok: false, message: toUserMessage(error, fallbackMessage) };
  }
}

export function toUserMessage(error: unknown, fallbackMessage: string): string {
  if (!isApiError(error)) {
    return fallbackMessage;
  }

  return MESSAGE_BY_CODE[error.code] ?? fallbackMessage;
}
