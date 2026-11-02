import type { Metadata } from 'next';

import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Seguridad y cumplimiento',
  description:
    'Arquitectura de seguridad de Ambrogio.ai: CSP con nonce, RLS en Postgres, redacción de PII, pen test anual, bug bounty, GDPR Arts. 15/17.',
  alternates: { canonical: '/legal/security' },
};

export default function SecurityPage() {
  return (
    <LegalPageLayout title="Seguridad y cumplimiento" lastUpdated="8 de mayo de 2026">
      <p>
        La seguridad no es un add-on. Forma parte de la arquitectura desde el primer commit. Esta
        página resume las medidas técnicas y organizativas en producción.
      </p>

      <h2>Arquitectura</h2>
      <ul>
        <li>
          <strong>Next.js 15</strong> App Router con CSP basada en nonce para protección XSS.
        </li>
        <li>
          <strong>Supabase UE</strong> Postgres con Row-Level Security en las 21 tablas.
        </li>
        <li>
          <strong>Multi-tenancy</strong> con aislamiento garantizado a nivel de base de datos.
        </li>
        <li>
          <strong>Edge runtime</strong> para webhooks y middleware.
        </li>
      </ul>

      <h2>Cifrado</h2>
      <ul>
        <li>TLS 1.3 en tránsito.</li>
        <li>AES-256 en reposo (Supabase managed).</li>
        <li>Cookies httpOnly, secure (en prod), sameSite=Lax.</li>
        <li>Verificación timing-safe de firmas de webhook (Stripe, WhatsApp).</li>
      </ul>

      <h2>Headers de seguridad</h2>
      <ul>
        <li>Content-Security-Policy con nonce por request</li>
        <li>Strict-Transport-Security (1 año, includeSubDomains)</li>
        <li>X-Content-Type-Options: nosniff</li>
        <li>X-Frame-Options: DENY</li>
        <li>Referrer-Policy: strict-origin-when-cross-origin</li>
        <li>Permissions-Policy: camera/mic/geo disabled</li>
        <li>Cross-Origin-Embedder-Policy: credentialless</li>
        <li>Cross-Origin-Opener-Policy: same-origin</li>
      </ul>

      <h2>Rate limiting</h2>
      <p>
        Upstash Redis con sliding window. Políticas nominadas por escenario: login, magic link,
        onboarding, escritura de configuración, exportación GDPR. Protección de ráfagas en todos los
        webhooks.
      </p>

      <h2>Logging y PII</h2>
      <ul>
        <li>Logger Pino estructurado.</li>
        <li>
          Redacción automática de: password, token, apiKey, email, phone, whatsapp_number,
          fiscal_code, vat_number, iban, customer_name, address, cuerpo del mensaje.
        </li>
        <li>
          Ningún <code>console.log</code> en producción.
        </li>
      </ul>

      <h2>GDPR</h2>
      <ul>
        <li>Endpoint Art. 15 (exportación) para Tenant y Customers.</li>
        <li>Endpoint Art. 17 (eliminación) con periodo de gracia de 30 días.</li>
        <li>Audit log inmutable para cada acción sensible.</li>
        <li>DPA firmable y lista pública de subencargados.</li>
      </ul>

      <h2>Respuesta a incidentes</h2>
      <p>
        Notificación al Responsable dentro de las 24 horas desde el descubrimiento de una brecha de
        datos. Runbook público disponible para clientes Enterprise.
      </p>

      <h2>Penetration testing</h2>
      <p>
        Pen test anual con proveedor tercero. Informe disponible bajo NDA para planes Professional y
        Agency.
      </p>

      <h2>Bug bounty</h2>
      <p>
        Programa de responsible disclosure activo. Para reportar vulnerabilidades:{' '}
        <a href="mailto:security@ambrogio.ai">security@ambrogio.ai</a>. Tiempos de respuesta:
        critical 24 h, high 3 días.
      </p>
    </LegalPageLayout>
  );
}
