import type { Metadata } from 'next';

import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Política de privacidad de Ambrogio.ai alineada con el GDPR. Hosting en la UE, redacción automática de PII, retención 24 meses, derechos Arts. 15-22.',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de privacidad" lastUpdated="8 de mayo de 2026">
      <p>
        Esta Política de privacidad describe cómo Ambrogio.ai (en adelante{' '}
        <strong>&quot;Ambrogio&quot;</strong>, <strong>&quot;nosotros&quot;</strong>) recopila,
        utiliza y protege los datos personales de los usuarios de sus servicios B2B.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento es Ambrogio.ai, con domicilio en [por definir en fase de
        constitución], identificación fiscal [por insertar]. Para cualquier cuestión relativa al
        tratamiento de datos: <a href="mailto:privacy@ambrogio.ai">privacy@ambrogio.ai</a>.
      </p>

      <h2>2. Categorías de datos recopilados</h2>
      <ul>
        <li>
          <strong>Datos de cuenta business:</strong> nombre del estudio, email, teléfono, RFC/NIT,
          identificación fiscal y código de facturación electrónica.
        </li>
        <li>
          <strong>Datos de conversación:</strong> mensajes de WhatsApp intercambiados con los
          clientes finales del tenant, audios transcritos y metadatos.
        </li>
        <li>
          <strong>Datos operativos:</strong> logs técnicos, request id, tiempo de respuesta, estado
          de jobs.
        </li>
        <li>
          <strong>Datos de pago:</strong> procesados directamente por Stripe (UE). No conservamos
          números de tarjeta ni CVV.
        </li>
      </ul>

      <h2>3. Finalidades y bases jurídicas</h2>
      <ul>
        <li>
          <strong>Prestación del servicio</strong> (Art. 6.1.b GDPR — ejecución del contrato).
        </li>
        <li>
          <strong>Cumplimiento fiscal</strong> (Art. 6.1.c — obligación legal): facturación
          electrónica y conservación según la normativa aplicable.
        </li>
        <li>
          <strong>Seguridad y prevención de abusos</strong> (Art. 6.1.f — interés legítimo): rate
          limiting, audit log, detección de fraude.
        </li>
        <li>
          <strong>Comunicaciones de servicio</strong> (Art. 6.1.b): notificaciones operativas no
          comerciales.
        </li>
      </ul>

      <h2>4. Localización de los datos</h2>
      <p>
        Todos los datos se alojan en la <strong>Unión Europea</strong>:
      </p>
      <ul>
        <li>Base de datos: Supabase Frankfurt (UE)</li>
        <li>Hosting: región UE de Vercel</li>
        <li>Cache y rate limit: Upstash UE</li>
        <li>Inferencia AI: Anthropic API región UE</li>
        <li>Voz: ElevenLabs UE</li>
      </ul>
      <p>Ninguna transferencia a terceros países sin garantías adecuadas (SCC cuando aplique).</p>

      <h2>5. Conservación</h2>
      <ul>
        <li>Datos de cuenta: durante toda la relación + 12 meses.</li>
        <li>Conversaciones: 24 meses rolling, salvo requerimientos legales.</li>
        <li>Audios: 90 días desde la transcripción.</li>
        <li>Datos fiscales (facturas): el tiempo exigido por la normativa fiscal aplicable.</li>
        <li>Logs técnicos: 12 meses.</li>
      </ul>

      <h2>6. Tus derechos (Arts. 15-22 GDPR)</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>
          <strong>Acceder</strong> a tus datos y obtener una copia (Art. 15) — disponible desde el
          panel, sección &quot;Exportar datos&quot;.
        </li>
        <li>
          <strong>Rectificar</strong> datos inexactos (Art. 16) — cambios directos desde el panel.
        </li>
        <li>
          <strong>Suprimir</strong> tus datos (Art. 17) — disponible como &quot;Eliminar
          cuenta&quot;, con periodo de gracia de 30 días.
        </li>
        <li>
          <strong>Limitar</strong> u <strong>oponerte</strong> al tratamiento (Arts. 18, 21).
        </li>
        <li>
          <strong>Portabilidad</strong> en formato JSON estructurado (Art. 20).
        </li>
      </ul>
      <p>
        Para ejercer estos derechos sobre clientes finales de tu estudio (tus pacientes / clientes
        de WhatsApp), usa la sección &quot;Customers&quot; del panel.
      </p>

      <h2>7. Seguridad técnica</h2>
      <ul>
        <li>Cifrado en tránsito (TLS 1.3) y en reposo (AES-256).</li>
        <li>Multi-tenancy con Row-Level Security en cada tabla.</li>
        <li>PII redactada automáticamente en los logs de aplicación.</li>
        <li>Rate limiting para prevenir abusos.</li>
        <li>CSP basada en nonce para protección XSS.</li>
        <li>Verificación timing-safe de firmas de webhook.</li>
        <li>Audit log inmutable para acciones sensibles.</li>
      </ul>

      <h2>8. Subencargados</h2>
      <p>
        Lista pública y actualizada en <a href="/legal/sub-processors">/legal/sub-processors</a>.
        Notificación escrita con al menos 30 días de antelación antes de añadir nuevos
        subencargados.
      </p>

      <h2>9. Reclamaciones</h2>
      <p>
        Tienes derecho a presentar una reclamación ante la autoridad de protección de datos
        competente si consideras que el tratamiento vulnera el GDPR u otra normativa aplicable.
      </p>

      <h2>10. Modificaciones</h2>
      <p>
        Actualizamos esta política cuando cambian las tecnologías, los subencargados o la normativa.
        Los cambios sustanciales se notifican por email al menos 30 días antes.
      </p>

      <hr className="divider" />
      <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
        Para solicitudes GDPR específicas escribe a{' '}
        <a href="mailto:dpo@ambrogio.ai">dpo@ambrogio.ai</a>. Tiempo de respuesta: máximo 30 días.
      </p>
    </LegalPageLayout>
  );
}
