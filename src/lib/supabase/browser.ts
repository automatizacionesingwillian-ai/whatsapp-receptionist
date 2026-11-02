'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase per componenti Client (callback auth, form che leggono
 * la sessione nel browser). Scrive i cookie di sessione leggibili dal
 * server client in `src/lib/supabase/server.ts`.
 */
export function createSupabaseBrowserClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!url || !anonKey) {
    throw new Error('Supabase browser client: faltan URL o anon key');
  }

  return createBrowserClient(url, anonKey);
}
