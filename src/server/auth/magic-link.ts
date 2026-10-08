// Fatto da Claude Code l'8 maggio 2026.
//
// Magic-link login: l'utente inserisce l'email, riceviamo POST /api/auth/magic-link
// e chiamiamo `supabase.auth.signInWithOtp`.
//
// Design anti-enumeration: la response e' sempre `{ ok: true }` indipendentemente
// dall'esistenza dell'account. Eventuali errori upstream Supabase vengono loggati
// ma NON propagati al client (altrimenti un attaccante puo' enumerare gli utenti).
//
// In development, se Supabase rifiuta l'invio email (rate limit), facciamo fallback
// a `admin.generateLink` e restituiamo `recoveryLink` cosi' si puo' aprire il link
// senza aspettare il reset del quota.
//
// Pattern: factory + DI. Il sender e' iniettabile per i test.

import { logger } from '@/lib/logging/logger';
import { env } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type MagicLinkInput = {
  email: string;
  requestId: string;
};

export type MagicLinkResult = {
  ok: true;
  recoveryLink?: string;
};

export type MagicLinkSendResult = {
  error: Error | null;
  recoveryLink?: string;
};

export interface MagicLinkSender {
  send(input: { email: string; redirectTo: string }): Promise<MagicLinkSendResult>;
}

export class MagicLinkService {
  constructor(
    private readonly sender: MagicLinkSender,
    private readonly redirectTo: string,
  ) {}

  async request(input: MagicLinkInput): Promise<MagicLinkResult> {
    const email = normalizeEmail(input.email);

    if (!email) {
      // Anti-enumeration: anche se l'email e' invalida, rispondiamo OK lato HTTP.
      // Logghiamo per visibilita' interna.
      logger.info(
        { requestId: input.requestId },
        'Magic link request rejected: invalid email format',
      );
      return { ok: true };
    }

    const { error, recoveryLink } = await this.sender.send({
      email,
      redirectTo: this.redirectTo,
    });

    if (error) {
      logger.warn(
        {
          requestId: input.requestId,
          err: error,
        },
        'Magic link sender returned error (response masked for anti-enumeration)',
      );
    } else if (recoveryLink) {
      logger.info(
        {
          requestId: input.requestId,
        },
        'Magic link recovery link generated (email not sent)',
      );
    } else {
      logger.info(
        {
          requestId: input.requestId,
        },
        'Magic link dispatched',
      );
    }

    if (recoveryLink) {
      return { ok: true, recoveryLink };
    }
    return { ok: true };
  }
}

class SupabaseMagicLinkSender implements MagicLinkSender {
  private readonly supabase = createSupabaseAdminClient();

  async send(input: { email: string; redirectTo: string }): Promise<MagicLinkSendResult> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email: input.email,
      options: {
        emailRedirectTo: input.redirectTo,
      },
    });

    if (!error) {
      return { error: null };
    }

    if (!isEmailSendRateLimitError(error)) {
      return { error };
    }

    // Rate limit email: generateLink non invia mail e sblocca lo sviluppo locale.
    const { data, error: generateError } = await this.supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: input.email,
      options: {
        redirectTo: input.redirectTo,
      },
    });

    if (generateError) {
      return { error: generateError };
    }

    const actionLink = data.properties?.action_link;
    if (!actionLink) {
      return { error: new Error('generateLink returned no action_link') };
    }

    if (env.NODE_ENV === 'development') {
      logger.warn(
        { email: input.email, actionLink },
        'Supabase email rate limit: using generateLink recovery URL (dev only)',
      );
      return { error: null, recoveryLink: actionLink };
    }

    logger.warn(
      { email: input.email },
      'Supabase email rate limit exceeded; magic link not delivered',
    );
    return { error };
  }
}

export function createMagicLinkService(): MagicLinkService {
  // Il callback decide da solo dashboard vs onboarding in base agli app_metadata.
  // Non passare `?next=` qui: Supabase spesso sostituisce la query string con
  // `?code=` e il parametro andrebbe perso comunque.
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/auth/callback`;
  return new MagicLinkService(new SupabaseMagicLinkSender(), redirectTo);
}

export function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 254) {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function isEmailSendRateLimitError(error: Error): boolean {
  const withCode = error as Error & { code?: string; status?: number };
  if (withCode.code === 'over_email_send_rate_limit') {
    return true;
  }
  const message = error.message.toLowerCase();
  return message.includes('email rate limit') || message.includes('over_email_send_rate_limit');
}
