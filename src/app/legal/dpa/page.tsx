import type { Metadata } from 'next';

import { LegalPageLayout } from '@/components/marketing/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description:
    'DPA de Ambrogio.ai conforme al Art. 28 GDPR. Hosting en la UE, subencargados declarados, audit log inmutable, notificación de brechas en 24 h.',
  alternates: { canonical: '/legal/dpa' },
};

export default function DpaPage() {
  return (
    <LegalPageLayout title="Data Processing Agreement (DPA)" lastUpdated="8 de mayo de 2026">
      <p>
        El presente acuerdo regula el tratamiento de datos personales conforme al Art. 28 GDPR entre
        Ambrogio.ai (encargado del tratamiento) y el Tenant (responsable).
      </p>

      <h2>1. Objeto del tratamiento</h2>
      <p>
        Ambrogio.ai trata los datos personales de los Usuarios finales del Tenant exclusivamente
        para la prestación del Servicio.
      </p>

      <h2>2. Categorías de datos</h2>
      <ul>
        <li>Datos de contacto: nombre, teléfono, email.</li>
        <li>Contenido de mensajes: texto y audios.</li>
        <li>Datos transaccionales: citas, reservas, pagos.</li>
      </ul>

      <h2>3. Medidas técnicas y organizativas</h2>
      <ul>
        <li>TLS 1.3 en tránsito, AES-256 en reposo.</li>
        <li>Multi-tenancy con RLS de Postgres.</li>
        <li>Audit log inmutable.</li>
        <li>Backups cifrados en la UE, retención 30 días.</li>
        <li>Disaster recovery RTO 4 h, RPO 1 h.</li>
      </ul>

      <h2>4. Subencargados</h2>
      <p>
        Lista actualizada en <a href="/legal/sub-processors">/legal/sub-processors</a>. Notificación
        escrita 30 días antes de altas.
      </p>

      <h2>5. Derechos de los interesados</h2>
      <p>
        Ambrogio.ai asiste al Responsable en el cumplimiento de las solicitudes de los Interesados
        (Arts. 15-22 GDPR) mediante los endpoints de exportación y eliminación disponibles en el
        panel.
      </p>

      <h2>6. Brecha de datos</h2>
      <p>
        Notificación al Responsable dentro de las 24 horas desde el descubrimiento. La notificación
        a la autoridad competente corresponde al Responsable dentro de las 72 horas cuando aplique.
      </p>

      <h2>7. Auditoría</h2>
      <p>
        El Responsable puede solicitar auditorías anuales con 30 días de preaviso. Los costos corren
        a cargo del Responsable salvo acuerdo distinto.
      </p>

      <h2>8. Vigencia</h2>
      <p>
        Al cesar la relación, devolución o eliminación de los datos en un máximo de 30 días
        (configurable por el Tenant).
      </p>

      <p
        style={{
          padding: 'var(--space-4)',
          background: 'var(--color-accent-soft)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <strong>DPA firmable:</strong> versión PDF disponible desde el panel, sección{' '}
        <em>Cuenta &gt; Seguridad &gt; DPA</em>. Contáctanos para formalizarlo.
      </p>
    </LegalPageLayout>
  );
}
