import Image from 'next/image';

const STEPS = [
  {
    n: '01',
    title: 'Conecta los canales',
    body: 'Número WhatsApp Business, Google Calendar y Stripe para pagos. Unos 15 minutos por integración.',
  },
  {
    n: '02',
    title: 'Enseña tu negocio',
    body: 'Carga el listado, horarios y FAQ. Ambrogio aprende cómo hablas y entiende las solicitudes reales.',
  },
  {
    n: '03',
    title: 'Apaga el teléfono',
    body: 'O déjalo sonar si quieres: Ambrogio responde, reserva y confirma. Tú haces tu trabajo.',
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      className="section section-divider"
      id="how-it-works"
      aria-labelledby="how-heading"
      style={{ background: 'var(--color-surface-sunken)' }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--space-16)',
            alignItems: 'center',
          }}
        >
          <div className="stack stack-4" style={{ maxWidth: '52ch' }}>
            <span className="eyebrow">Cómo funciona</span>
            <h2 id="how-heading" className="text-balance">
              Tres pasos. Un día. Recepción siempre activa.
            </h2>
            <p className="lead">
              Onboarding guiado: respondes unas preguntas, cargas tus servicios y autorizas Google
              Calendar. Ambrogio queda operativo el mismo día.
            </p>
          </div>

          <ol
            className="grid stagger-children"
            style={{
              listStyle: 'none',
              padding: 0,
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {STEPS.map((step, index) => (
              <li
                key={step.n}
                className="card card-padded stack stack-4 step-card"
                style={
                  {
                    background: 'var(--color-surface)',
                    '--i': index,
                  } as React.CSSProperties
                }
              >
                <span className="step-number" aria-hidden="true">
                  {step.n}
                </span>
                <h3 style={{ fontSize: 'var(--text-xl)' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>{step.body}</p>
              </li>
            ))}
          </ol>

          <div
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              padding: 'var(--space-8)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <Image
              src="/assets/site-images/ambrogio/svg/13-onboarding-three-steps.svg"
              alt="Onboarding en tres pasos: conectar, enseñar, activar"
              width={720}
              height={360}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
