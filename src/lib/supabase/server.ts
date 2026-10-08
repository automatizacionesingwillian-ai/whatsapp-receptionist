import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSecureCookieOptions } from '@/lib/auth/cookie-options';
import { env } from '@/lib/env';

/**
 * Crea il client Supabase lato server con i nostri default cookie sicuri.
 *
 * Nota di sicurezza: `@supabase/ssr` di default usa `httpOnly: false`
 * (vedi `node_modules/@supabase/ssr/.../utils/constants.js`). Per evitare
 * che JavaScript client-side possa leggere il refresh token, costruiamo
 * il merge come `{ ...supabaseOptions, ...secureDefaults }` cosi' che
 * `httpOnly: true`, `secure` (in prod) e `sameSite: 'lax'` vincano sempre.
 *
 * `setAll` può essere invocato da `getUser()` quando Supabase rinnova la
 * sessione. Nei Server Component Next non permette di scrivere cookie: in
 * quel caso ignoriamo (Route Handler / Server Action possono scrivere).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const supabaseOptions = (options ?? {}) as CookieOptions;
            // I default sicuri vincono sui valori passati da Supabase per
            // evitare downgrade di httpOnly/secure/sameSite.
            const merged: CookieOptions = {
              ...supabaseOptions,
              ...getSecureCookieOptions(),
            };
            cookieStore.set(name, value, merged);
          });
        } catch {
          // Called from a Server Component: cookie writes are not allowed.
          // Safe to ignore — the request still has the current session cookies.
        }
      },
    },
  });
}
