import Image from 'next/image';

interface Feature {
  title: string;
  description: string;
  icon: string;
  /** Bento sizing — 'wide' = full row, 'half' = 50%, 'third' = 33% */
  size: 'wide' | 'half' | 'third';
  isHighlight?: boolean;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    title: 'WhatsApp y voz, de punta a punta',
    description:
      'Recibe y gestiona mensajes de texto y voz. Transcribe, entiende y responde en español natural. ElevenLabs para voces humanas.',
    icon: '/assets/site-images/ambrogio/svg/02-whatsapp-voice-transcript.svg',
    size: 'wide',
    isHighlight: true,
  },
  {
    title: 'Agenda Google Calendar',
    description:
      'Toma citas reales, revisa disponibilidad y evita conflictos. Nunca más doble reserva.',
    icon: '/assets/site-images/ambrogio/svg/03-calendar-booking-flow.svg',
    size: 'half',
  },
  {
    title: 'Escalamiento humano fluido',
    description: 'Cuando hace falta, te pasa la conversación. Sin incomodidad, sin perder el hilo.',
    icon: '/assets/site-images/ambrogio/svg/04-human-escalation.svg',
    size: 'half',
  },
  {
    title: 'Bóveda de privacidad GDPR',
    description:
      'Servidores en la UE. RLS multi-tenant. PII redactada en logs. DPA listo. Artículos 15/17 a un clic.',
    icon: '/assets/site-images/ambrogio/svg/05-privacy-vault.svg',
    size: 'third',
  },
  {
    title: 'Todos los canales, una sola cola',
    description: 'WhatsApp, Instagram DM, chat web, teléfono. Una sola memoria.',
    icon: '/assets/site-images/ambrogio/svg/10-multi-channel-orbit.svg',
    size: 'third',
  },
  {
    title: 'Panel claro, datos honestos',
    description:
      'KPI en tiempo real. Conversaciones, reservas, voz, facturación — en una pantalla.',
    icon: '/assets/site-images/ambrogio/svg/11-dashboard-command-center.svg',
    size: 'third',
  },
] as const;

const sizeClass = {
  wide: 'feature-card-wide',
  half: 'feature-card-half',
  third: 'feature-card-third',
} as const;

export function FeaturesSection() {
  return (
    <section className="section" id="features" aria-labelledby="features-heading">
      <div className="container stack stack-12">
        <div className="stack stack-4" style={{ maxWidth: '52ch' }}>
          <span className="eyebrow">Qué hace Ambrogio</span>
          <h2 id="features-heading" className="text-balance">
            Seis capacidades que funcionan juntas, no features para marcar.
          </h2>
          <p className="lead">
            Hecho por quienes gestionaron recepciones reales en clínicas y gimnasios. Cada función
            resuelve un problema diario medible.
          </p>
        </div>

        <ul className="features-bento stagger-children" style={{ listStyle: 'none', padding: 0 }}>
          {FEATURES.map((feature, index) => (
            <li
              key={feature.title}
              className={`card card-interactive feature-card ${sizeClass[feature.size]} ${
                feature.isHighlight ? 'feature-card-highlight' : ''
              }`}
              style={{ '--i': index } as React.CSSProperties}
            >
              <div className="feature-icon-tile" aria-hidden="true">
                <Image src={feature.icon} alt="" width={40} height={40} />
              </div>
              <div className="stack stack-3">
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-body">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
