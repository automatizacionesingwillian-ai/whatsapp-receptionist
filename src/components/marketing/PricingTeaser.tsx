import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: '€97',
    period: '/mes',
    badge: 'Para un solo negocio',
    description: 'Un número WhatsApp, 1 calendario, 500 conversaciones AI/mes.',
    features: [
      '1 número WhatsApp Business',
      '1 calendario Google',
      '500 conversaciones AI / mes',
      'Transcripción de audios',
      'Panel básico',
    ],
    cta: 'Empezar con Starter',
    href: '/register?plan=starter',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '€297',
    period: '/mes',
    badge: 'Más popular',
    description: 'Multi-operador, voz saliente, integraciones avanzadas, soporte prioritario.',
    features: [
      'Hasta 3 números WhatsApp',
      'Multi-calendario por operador',
      '2.500 conversaciones AI / mes',
      'Voz ElevenLabs saliente',
      'Recordatorios automáticos',
      'Base de conocimiento personalizada',
      'Soporte prioritario',
    ],
    cta: 'Empezar con Professional',
    href: '/register?plan=professional',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '€897',
    period: '/mes',
    badge: 'White-label',
    description: 'Para agencias y consultores que gestionan varios clientes finales.',
    features: [
      '5 clientes incluidos',
      'Panel white-label',
      'API y webhooks',
      'Conversaciones ilimitadas*',
      'Account manager dedicado',
      'Onboarding co-gestionado',
    ],
    cta: 'Hablemos',
    href: '/contact?plan=agency',
    highlight: false,
  },
] as const;

export function PricingTeaser() {
  return (
    <section className="section" aria-labelledby="pricing-heading">
      <div className="container stack stack-12">
        <div className="stack stack-4" style={{ maxWidth: '52ch' }}>
          <span className="eyebrow">Planes transparentes</span>
          <h2 id="pricing-heading" className="text-balance">
            Pagas solo cuando Ambrogio hace su trabajo.
          </h2>
          <p className="lead">
            Sin costos ocultos ni multiplicadores por tokens. Sabes exactamente cuánto gastas al mes
            y cuánto ganas de más.
          </p>
        </div>

        <div
          className="grid stagger-children"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {PLANS.map((plan, index) => (
            <article
              key={plan.name}
              className={`card card-padded stack stack-6 plan-card ${plan.highlight ? 'plan-card-featured' : ''}`}
              style={{ '--i': index } as React.CSSProperties}
            >
              {plan.highlight ? (
                <span
                  className="badge"
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    right: 'var(--space-6)',
                    background: 'var(--color-accent)',
                    color: 'var(--color-accent-fg)',
                  }}
                >
                  {plan.badge}
                </span>
              ) : (
                <span className="badge badge-neutral">{plan.badge}</span>
              )}
              <div className="stack stack-2">
                <h3 style={{ fontSize: 'var(--text-2xl)' }}>{plan.name}</h3>
                <div className="row" style={{ alignItems: 'baseline', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-4xl)',
                      fontWeight: 700,
                      letterSpacing: 'var(--tracking-tight)',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span className="muted">{plan.period}</span>
                </div>
                <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                  {plan.description}
                </p>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        color: 'var(--color-accent)',
                        marginTop: '2px',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} btn-lg plan-card-actions`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <p
          className="muted text-center"
          style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-4)' }}
        >
          Todos los precios excluyen impuestos. Pago mensual o anual (-20%). Facturación electrónica
          incluida donde aplique.
        </p>
      </div>
    </section>
  );
}
