import type { Metadata } from 'next';

import { AuthCallbackClient } from '@/components/auth/AuthCallbackClient';

export const metadata: Metadata = {
  title: 'Iniciando sesión · Ambrogio.ai',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Page (non Route Handler): i magic link Supabase mettono spesso i token nel
 * fragment `#access_token=...`, invisibile al server. Solo il client può
 * completarli.
 */
export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
