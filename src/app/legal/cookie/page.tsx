import type { Metadata } from 'next';

import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description:
    'Política de cookies de Ambrogio.ai: solo cookies técnicas estrictamente necesarias. Sin Google Analytics ni Facebook Pixel.',
  alternates: { canonical: '/legal/cookie' },
};

export default function CookiePage() {
  return (
    <LegalPageLayout title="Política de cookies" lastUpdated="8 de mayo de 2026">
      <p>
        Ambrogio.ai usa solo cookies técnicas estrictamente necesarias para el funcionamiento del
        Servicio. Ningún tracker publicitario de terceros.
      </p>

      <h2>Cookies utilizadas</h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--text-sm)',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--space-3) 0' }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: 'var(--space-3) 0' }}>Finalidad</th>
            <th style={{ textAlign: 'left', padding: 'var(--space-3) 0' }}>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: 'var(--space-3) 0' }}>
              <code>sb-access-token</code>
            </td>
            <td style={{ padding: 'var(--space-3) 0' }}>Sesión autenticada de Supabase</td>
            <td style={{ padding: 'var(--space-3) 0' }}>1 hora</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: 'var(--space-3) 0' }}>
              <code>sb-refresh-token</code>
            </td>
            <td style={{ padding: 'var(--space-3) 0' }}>Refresh de sesión</td>
            <td style={{ padding: 'var(--space-3) 0' }}>30 días</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: 'var(--space-3) 0' }}>
              <code>__Host-csp-nonce</code>
            </td>
            <td style={{ padding: 'var(--space-3) 0' }}>Nonce CSP para protección XSS</td>
            <td style={{ padding: 'var(--space-3) 0' }}>Sesión</td>
          </tr>
        </tbody>
      </table>

      <h2>Sin cookies de marketing</h2>
      <p>
        No usamos Google Analytics, Facebook Pixel ni otros trackers de comportamiento. Las métricas
        de uso derivan exclusivamente de los datos operativos del Servicio.
      </p>

      <h2>Configuración del navegador</h2>
      <p>
        Puedes desactivar las cookies desde la configuración del navegador. Desactivar las cookies
        técnicas impedirá el funcionamiento del área autenticada.
      </p>
    </LegalPageLayout>
  );
}
