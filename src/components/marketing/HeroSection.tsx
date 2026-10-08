import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container hero-grid">
        <div className="stack stack-6 animate-fade-up">
          <span className="hero-eyebrow">
            <span aria-hidden="true">●</span> Beta LATAM · Cupos limitados
          </span>
          <h1 id="hero-heading" className="display text-balance">
            Tu recepción AI responde también de noche. Y agenda de verdad.
          </h1>
          <p className="lead text-pretty">
            Ambrogio.ai es el recepcionista AI siempre activo que responde en WhatsApp, gestiona
            audios y textos, agenda citas en tu calendario y cada mañana te entrega la lista de lo
            hecho mientras dormías.
          </p>
          <div className="row" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Empezar la prueba
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/#how-it-works" className="btn btn-secondary btn-lg">
              Ver cómo funciona
            </Link>
          </div>
          <div
            className="row"
            style={{
              gap: 'var(--space-8)',
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div className="stat">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Siempre escuchando</span>
            </div>
            <div className="stat">
              <span className="stat-value">EU</span>
              <span className="stat-label">Datos en Europa</span>
            </div>
            <div className="stat">
              <span className="stat-value">MIT</span>
              <span className="stat-label">Código open source</span>
            </div>
          </div>
        </div>
        <div
          className="animate-fade-up"
          style={{ position: 'relative', minHeight: '420px', animationDelay: '120ms' }}
        >
          <Image
            src="/assets/site-images/ambrogio/svg/01-hero-always-on-reception.svg"
            alt="Ilustración de una recepción AI siempre activa"
            width={640}
            height={520}
            priority
            style={{ width: '100%', height: 'auto', maxWidth: '640px', marginInline: 'auto' }}
          />
        </div>
      </div>
    </section>
  );
}
