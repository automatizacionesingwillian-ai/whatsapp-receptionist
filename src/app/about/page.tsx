import type { Metadata } from 'next';
import Link from 'next/link';

import {
  buildBreadcrumbSchema,
  buildPersonSchema,
  buildWebPageSchema,
  JsonLd,
  organizationSchema,
} from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://ambrogio.ai';

export const metadata: Metadata = {
  title: 'Quiénes somos · Historia, misión y equipo',
  description:
    'Ambrogio.ai está construido por operadores de estudios reales. Misión, valores, equipo y por qué existimos: devolver el teléfono a la vida.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Quiénes somos · Ambrogio.ai',
    description:
      'Ambrogio.ai está construido por operadores de estudios reales. Misión, valores, equipo latinoamericano.',
    url: '/about',
    type: 'profile',
    locale: 'es_419',
  },
};

const FOUNDERS = [
  {
    name: 'Christian Calabrò',
    jobTitle: 'Founder & CEO',
    description:
      'Performance marketer y developer. 12 años de experiencia entre clínicas, gimnasios y estudios profesionales. Gestionó recepciones reales antes de escribir una sola línea de código.',
    sameAs: ['https://twitter.com/ambrogio_ai', 'https://linkedin.com/in/christian-calabro'],
  },
] as const;

const VALUES = [
  {
    title: 'Privacidad no negociable',
    body: 'Servidores en la UE, redacción automática de PII, DPA listo. La conformidad no es un add-on: es el primer commit.',
  },
  {
    title: 'IA útil, no espectacular',
    body: 'Sin prompts mágicos, sin chatbots de fachada. Modelos que entienden tu sector y piden ayuda cuando hace falta.',
  },
  {
    title: 'Precios transparentes',
    body: 'Sin multiplicadores sobre tokens, sin upsells. Sabes qué pagas y cuánto ganas de más cada mes.',
  },
  {
    title: 'Construido en el campo',
    body: 'Cada función nace de un cliente que la pidió. Sin roadmaps de escritorio.',
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Quiénes somos', url: '/about' },
        ])}
      />
      {FOUNDERS.map((person) => (
        <JsonLd
          key={person.name}
          data={buildPersonSchema({
            name: person.name,
            jobTitle: person.jobTitle,
            description: person.description,
            sameAs: person.sameAs,
            url: `${SITE_URL}/about`,
          })}
        />
      ))}
      <JsonLd
        data={buildWebPageSchema({
          type: 'AboutPage',
          name: 'Quiénes somos · Ambrogio.ai',
          description:
            'Ambrogio.ai está construido por operadores de estudios reales. Misión, valores, equipo latinoamericano.',
          url: '/about',
          speakableSelectors: ['h1', '.lead', '#story-heading + p'],
        })}
      />
      {/*
        Ningún schema `Review` publicado: las reseñas solo se exponen como datos
        estructurados cuando son reales, firmadas por el cliente y verificables.
      */}
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container-narrow stack stack-12">
            <header className="stack stack-4">
              <span className="badge">Quiénes somos</span>
              <h1 className="display text-balance">
                Construido por quien gestionó recepciones reales, no por quien las estudió.
              </h1>
              <p className="lead text-pretty">
                Ambrogio.ai nace en 2026 con una misión simple: devolver el teléfono a la vida.
                Las clínicas, los gimnasios y los estudios profesionales de Latinoamérica no
                necesitan otro chatbot. Necesitan un asistente que entiende, agenda citas de verdad
                y libera tiempo humano para lo que importa.
              </p>
            </header>

            <section className="stack stack-6" aria-labelledby="story-heading">
              <h2 id="story-heading">Nuestra historia</h2>
              <p>
                El punto de partida es un problema que cualquiera que haya gestionado un estudio
                conoce: las llamadas que llegan cuando no hay nadie para contestar. Fuera de
                horario, en la hora de comida, mientras estás con un cliente. Quien llama rara vez
                vuelve a intentar: busca en otro lado. El contestador tradicional no resuelve,
                porque deja un mensaje en lugar de agendar una cita.
              </p>
              <p>
                Ambrogio nace para cerrar esa brecha: un asistente que conversa por WhatsApp en el
                español en que escriben tus clientes, consulta la disponibilidad real en la agenda
                y fija la cita. Lo desarrollamos en open source con licencia MIT porque las PyMEs
                latinoamericanas merecen IA de calidad, en español y alineada con buenas prácticas
                de privacidad, sin depender de una caja cerrada cuyo funcionamiento no pueden
                verificar.
              </p>
              <p>
                Hoy Ambrogio.ai está en beta privada con los primeros 50 estudios piloto
                seleccionados. Queremos crecer despacio para seguir siendo honestos.
              </p>
            </section>

            <section className="stack stack-6" aria-labelledby="values-heading">
              <h2 id="values-heading">Nuestros valores</h2>
              <div
                className="grid"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
              >
                {VALUES.map((value) => (
                  <article key={value.title} className="card stack stack-3">
                    <h3 style={{ fontSize: 'var(--text-lg)' }}>{value.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{value.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="stack stack-6" aria-labelledby="team-heading">
              <h2 id="team-heading">El equipo</h2>
              <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
                {FOUNDERS.map((person) => (
                  <article key={person.name} className="card card-padded stack stack-3">
                    <span className="eyebrow">{person.jobTitle}</span>
                    <h3 style={{ fontSize: 'var(--text-2xl)' }}>{person.name}</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{person.description}</p>
                    <div className="row" style={{ gap: 'var(--space-3)' }}>
                      {person.sameAs.map((url) => (
                        <a
                          key={url}
                          href={url}
                          rel="noopener noreferrer me"
                          target="_blank"
                          className="btn-link"
                          style={{ fontSize: 'var(--text-sm)' }}
                        >
                          {url.includes('linkedin') ? 'LinkedIn' : 'Twitter / X'}
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="stack stack-4" aria-labelledby="contact-heading">
              <h2 id="contact-heading">¿Quieres hablar con nosotros?</h2>
              <address
                className="card stack stack-2"
                style={{
                  fontStyle: 'normal',
                  background: 'var(--color-surface-sunken)',
                }}
              >
                <p>
                  <strong>Ambrogio.ai</strong>
                  <br />
                  Ciudad de México, México
                  <br />
                  <a href="mailto:hello@ambrogio.ai" className="btn-link">
                    hello@ambrogio.ai
                  </a>{' '}
                  · Sales &amp; partnership
                </p>
                <p>
                  <a href="mailto:support@ambrogio.ai" className="btn-link">
                    support@ambrogio.ai
                  </a>{' '}
                  · Soporte técnico
                </p>
                <p>
                  <a href="mailto:dpo@ambrogio.ai" className="btn-link">
                    dpo@ambrogio.ai
                  </a>{' '}
                  · Data Protection Officer
                </p>
              </address>
              <div className="row" style={{ gap: 'var(--space-3)' }}>
                <Link href="/contact" className="btn btn-primary">
                  Contáctanos
                </Link>
                <Link href="/legal/privacy" className="btn btn-secondary">
                  Política de privacidad
                </Link>
              </div>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
