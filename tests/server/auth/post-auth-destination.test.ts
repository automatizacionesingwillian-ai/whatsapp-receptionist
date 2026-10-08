import { describe, expect, it } from 'vitest';

import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination';

describe('resolvePostAuthDestination', () => {
  it('manda all’onboarding se mancano i claim tenant', () => {
    expect(resolvePostAuthDestination({ appMetadata: {} })).toBe('/onboarding');
    expect(
      resolvePostAuthDestination({
        appMetadata: { tenant_id: 't1' },
      }),
    ).toBe('/onboarding');
  });

  it('rispetta next quando i claim tenant ci sono', () => {
    expect(
      resolvePostAuthDestination({
        appMetadata: { tenant_id: 't1', role: 'owner' },
        next: '/settings/whatsapp',
      }),
    ).toBe('/settings/whatsapp');
  });

  it('usa la dashboard di default con claim validi e senza next', () => {
    expect(
      resolvePostAuthDestination({
        appMetadata: { tenant_id: 't1', role: 'owner' },
      }),
    ).toBe('/dashboard');
  });

  it('non lascia su onboarding un utente già onboardato anche se next lo richiede', () => {
    expect(
      resolvePostAuthDestination({
        appMetadata: { tenant_id: 't1', role: 'owner' },
        next: '/onboarding',
      }),
    ).toBe('/dashboard');
  });
});
