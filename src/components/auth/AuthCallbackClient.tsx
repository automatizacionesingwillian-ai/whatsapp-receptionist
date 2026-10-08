'use client';

import { useEffect, useState } from 'react';

import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Completa il login dal magic link.
 *
 * I link email di Supabase (soprattutto quando `signInWithOtp` è chiamato
 * server-side senza PKCE browser) atterrano con token nel **hash**:
 * `/auth/callback#access_token=...&refresh_token=...`
 *
 * Il fragment non arriva mai al Route Handler: solo il client può leggerlo.
 * Gestiamo anche `?code=` (PKCE) e `?token_hash=&type=` per completezza.
 */
export function AuthCallbackClient() {
  const [message, setMessage] = useState('Iniciando sesión…');

  useEffect(() => {
    let cancelled = false;

    async function completeAuth(): Promise<void> {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));

      const providerError =
        url.searchParams.get('error_description') ??
        url.searchParams.get('error') ??
        hashParams.get('error_description') ??
        hashParams.get('error');

      if (providerError) {
        window.location.replace(`/login?error=${encodeURIComponent('link_non_valido')}`);
        return;
      }

      const code = url.searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const tokenHash = url.searchParams.get('token_hash') ?? hashParams.get('token_hash');
      const type = url.searchParams.get('type') ?? hashParams.get('type');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          window.location.replace(`/login?error=${encodeURIComponent('link_non_valido')}`);
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          window.location.replace(`/login?error=${encodeURIComponent('link_non_valido')}`);
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'magiclink' | 'signup' | 'email' | 'recovery' | 'invite',
        });
        if (error) {
          window.location.replace(`/login?error=${encodeURIComponent('link_non_valido')}`);
          return;
        }
      } else {
        // detectSessionInUrl / sessione già presente
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          window.location.replace(`/login?error=${encodeURIComponent('link_incompleto')}`);
          return;
        }
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        window.location.replace(`/login?error=${encodeURIComponent('sessione_mancante')}`);
        return;
      }

      const destination = resolvePostAuthDestination({
        appMetadata: toPlainRecord(user.app_metadata),
        next: url.searchParams.get('next'),
      });

      // Pulisce hash/query sensibili dalla history prima del redirect.
      window.history.replaceState(null, '', url.pathname);
      window.location.replace(destination);
    }

    completeAuth().catch(() => {
      if (!cancelled) {
        setMessage('No se pudo iniciar sesión. Redirigiendo…');
        window.location.replace(`/login?error=${encodeURIComponent('link_non_valido')}`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stack stack-4" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
      <p className="muted">{message}</p>
    </div>
  );
}

function toPlainRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
