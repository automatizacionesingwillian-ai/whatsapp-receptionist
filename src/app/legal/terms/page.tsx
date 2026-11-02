import type { Metadata } from 'next';

import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Términos de servicio',
  description:
    'Términos de servicio de Ambrogio.ai: licencia, obligaciones, SLA, cancelación, facturación y fuero competente. Actualizado el 8 de mayo de 2026.',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Términos de servicio" lastUpdated="8 de mayo de 2026">
      <p>
        Estos términos regulan el uso del servicio Ambrogio.ai. Al registrarte declaras aceptarlos
        íntegramente.
      </p>

      <h2>1. Definiciones</h2>
      <ul>
        <li>
          <strong>Servicio:</strong> plataforma SaaS Ambrogio.ai para la gestión automatizada de la
          recepción vía WhatsApp y voz.
        </li>
        <li>
          <strong>Tenant:</strong> empresa cliente que usa el Servicio.
        </li>
        <li>
          <strong>Usuario final:</strong> cliente del Tenant que interactúa por WhatsApp.
        </li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Ambrogio.ai concede al Tenant una licencia no exclusiva, no transferible y revocable para
        acceder a las funcionalidades descritas en el plan contratado.
      </p>

      <h2>3. Obligaciones del Tenant</h2>
      <ul>
        <li>Proporcionar datos veraces durante el onboarding.</li>
        <li>Disponer de todos los consentimientos requeridos de sus Usuarios finales.</li>
        <li>No utilizar el Servicio para fines ilícitos, spam o abusos.</li>
        <li>Respetar las políticas de Meta WhatsApp Business.</li>
      </ul>

      <h2>4. Limitación de responsabilidad</h2>
      <p>
        Ambrogio.ai presta el servicio &quot;tal cual&quot;. Nuestra responsabilidad máxima se
        limita al importe pagado por el Tenant en los 12 meses anteriores al evento.
      </p>

      <h2>5. SLA</h2>
      <p>
        Uptime objetivo: 99.5% mensual según medición externa. Compensaciones según el{' '}
        <a href="/legal/sla">SLA público</a>.
      </p>

      <h2>6. Pagos y facturación</h2>
      <ul>
        <li>Pago mensual o anual vía Stripe.</li>
        <li>Facturación electrónica incluida según el plan y la jurisdicción.</li>
        <li>Falta de pago → suspensión del servicio tras 14 días de recordatorios.</li>
      </ul>

      <h2>7. Cancelación</h2>
      <p>
        Puedes cancelar en cualquier momento desde el panel. No hay reembolso prorrateado salvo
        defectos graves y demostrados del Servicio.
      </p>

      <h2>8. Fuero competente</h2>
      <p>
        Fuero exclusivo de Ciudad de México, México. Ley aplicable: mexicana, sin perjuicio de
        derechos imperativos del consumidor o del GDPR cuando aplique.
      </p>
    </LegalPageLayout>
  );
}
