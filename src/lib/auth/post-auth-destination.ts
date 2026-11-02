import { DEFAULT_AUTH_DESTINATION, safeDestination } from '@/lib/auth/safe-destination';

/**
 * Destinazione dopo un login riuscito (magic link / callback).
 *
 * Finché l'onboarding non ha scritto `tenant_id` + `role` in `app_metadata`,
 * la dashboard rifiuta la sessione e rimandava a `/login` — loop infinito.
 * Gli utenti autenticati senza claim tenant vanno all'onboarding.
 */
export function resolvePostAuthDestination(input: {
  appMetadata: Record<string, unknown>;
  next?: string | null;
}): string {
  const tenantId = input.appMetadata['tenant_id'];
  const role = input.appMetadata['role'];
  const hasTenantClaims =
    typeof tenantId === 'string' && (role === 'owner' || role === 'admin' || role === 'member');

  if (!hasTenantClaims) {
    return '/onboarding';
  }

  const next = safeDestination(input.next ?? null);
  if (next === '/onboarding') {
    return DEFAULT_AUTH_DESTINATION;
  }

  return next;
}
