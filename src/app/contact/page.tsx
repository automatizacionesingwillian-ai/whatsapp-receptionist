import type { Metadata } from 'next';

import { buildBreadcrumbSchema, JsonLd, organizationSchema } from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { ContactForm } from '@/components/forms/ContactForm';

export const metadata: Metadata = {
  title: 'Contacto · Habla con el equipo Ambrogio.ai',
  description:
    'Contacta al equipo Ambrogio.ai para soporte técnico, ventas, partnerships o prensa. Respuesta en 4 horas hábiles.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contacto · Ambrogio.ai',
    description:
      'Habla con el equipo. Ventas, soporte, partnerships o prensa. Respuesta en 4 horas hábiles.',
    url: '/contact',
    type: 'website',
    locale: 'es_419',
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Inicio', url: '/' },
          { name: 'Contacto', url: '/contact' },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container">
            <div
              style={{
                display: 'grid',
                gap: 'var(--space-12)',
                gridTemplateColumns: '1fr',
                maxWidth: '960px',
                margin: '0 auto',
              }}
            >
              <div className="stack stack-4 text-center">
                <span className="badge">Contacto</span>
                <h1 className="display text-balance">Hablemos.</h1>
                <p className="lead text-pretty" style={{ margin: '0 auto' }}>
                  Completa el formulario abajo. Para casos urgentes escribe directo:{' '}
                  <a href="mailto:hello@ambrogio.ai" className="btn-link">
                    hello@ambrogio.ai
                  </a>
                  .
                </p>
              </div>

              <ContactForm />

              <address
                className="card stack stack-3"
                style={{
                  fontStyle: 'normal',
                  background: 'var(--color-surface-sunken)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--color-text)' }}>Ambrogio.ai · Roma, Italia</strong>
                <p>
                  <strong>Ventas y partnerships:</strong>{' '}
                  <a href="mailto:hello@ambrogio.ai" className="btn-link">
                    hello@ambrogio.ai
                  </a>
                </p>
                <p>
                  <strong>Soporte técnico:</strong>{' '}
                  <a href="mailto:support@ambrogio.ai" className="btn-link">
                    support@ambrogio.ai
                  </a>
                </p>
                <p>
                  <strong>Data Protection Officer:</strong>{' '}
                  <a href="mailto:dpo@ambrogio.ai" className="btn-link">
                    dpo@ambrogio.ai
                  </a>
                </p>
              </address>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
