import type { Metadata } from 'next';
import Link from 'next/link';

import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildProductOffersSchema,
  buildSpeakableSchema,
  JsonLd,
} from '@/components/marketing/JsonLd';
import { PricingTeaser } from '@/components/marketing/PricingTeaser';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Precios Reception AI · Ambrogio.ai',
  description:
    'Tres planes transparentes para cada tamaño de negocio. Prueba de 14 días sin tarjeta. Facturación electrónica incluida.',
  openGraph: {
    title: 'Precios Reception AI · Ambrogio.ai',
    description: 'Starter €97, Professional €297, Agency €897. Prueba de 14 días sin tarjeta.',
    url: '/pricing',
    locale: 'es_419',
    type: 'website',
  },
  alternates: {
    canonical: '/pricing',
  },
};

const FAQ = [
  {
    q: '¿Puedo probar gratis?',
    a: 'Sí. 14 días de prueba completa sin tarjeta de crédito. Cancelas con un clic si no te convence.',
  },
  {
    q: '¿Qué pasa si supero el límite de conversaciones?',
    a: 'Te avisamos cuando llegues al 80 %. Puedes activar recarga automática o pasar al plan superior: el cambio es instantáneo, sin nuevo onboarding.',
  },
  {
    q: '¿Las facturas son electrónicas?',
    a: 'Sí, facturación electrónica B2B incluida en todos los planes. Solo ingresa tus datos fiscales durante el onboarding.',
  },
  {
    q: '¿Dónde se alojan los datos?',
    a: 'Todo en la UE (Supabase Frankfurt + Vercel EU). Sin transferencias fuera de la UE para datos de chat y clientes.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Cuando quieras. La mejora de plan es inmediata; la reducción aplica desde el siguiente ciclo.',
  },
  {
    q: '¿Qué significa Agency white-label?',
    a: 'Tu marca, tu dominio, tu logo. Tus clientes solo te ven a ti. Gestionas todo desde una consola multi-tenant.',
  },
  {
    q: '¿Y si Ambrogio se equivoca? ¿Estoy cubierto?',
    a: 'Todas las respuestas de IA quedan registradas y son revisables. Bajo el umbral de confianza, Ambrogio escala a un humano automáticamente. SLA con responsabilidad definida en los términos de servicio.',
  },
  {
    q: '¿Mis clientes entienden que es un bot?',
    a: 'Tú personalizas el tono. Puedes ser transparente ("Soy Ambrogio, el asistente de IA") o usar el nombre de tu negocio. La voz de ElevenLabs suena natural.',
  },
] as const;

const PLAN_OFFERS = [
  {
    name: 'Starter',
    price: '97',
    description: 'Un solo número de WhatsApp, 1 calendario, 500 conversaciones de IA al mes.',
    url: '/register?plan=starter',
  },
  {
    name: 'Professional',
    price: '297',
    description: 'Multi-operador, voz saliente, integraciones avanzadas, soporte prioritario.',
    url: '/register?plan=professional',
  },
  {
    name: 'Agency',
    price: '897',
    description: 'Para agencias y consultores que gestionan varios clientes finales. White-label.',
    url: '/contact?plan=agency',
  },
] as const;

const VERTICAL_LINKS = [
  { slug: 'dental', label: 'Reception AI para clínicas dentales' },
  { slug: 'beauty', label: 'Reception AI para centros de estética' },
  { slug: 'fitness', label: 'Reception AI para gimnasios y PT' },
  { slug: 'professional', label: 'Reception AI para negocios profesionales' },
] as const;

export default async function PricingPage() {
  return (
    <>
      <JsonLd data={buildFaqSchema(FAQ)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Planes y precios', url: '/pricing' },
        ])}
      />
      <JsonLd data={buildProductOffersSchema(PLAN_OFFERS)} />
      <JsonLd
        data={buildSpeakableSchema({
          url: '/pricing',
          cssSelector: ['#faq-heading', '[data-speakable="faq"]'],
        })}
      />
      <SiteHeader />
      <main id="main">
        <section
          className="section"
          style={{
            paddingTop: 'clamp(3rem, 4vw + 1rem, 5rem)',
            paddingBottom: 'clamp(2rem, 2vw, 3rem)',
          }}
        >
          <div
            className="container stack stack-6 text-center"
            style={{ maxWidth: '720px', margin: '0 auto' }}
          >
            <span className="badge">Transparencia total</span>
            <h1 className="display text-balance">
              Precios pensados para negocios reales, no para startups de VC.
            </h1>
            <p className="lead text-pretty" style={{ margin: '0 auto' }}>
              Sin multiplicadores por tokens. Sin upsell agresivo. Sabes exactamente qué pagas y
              cuánto ganas de más cada mes.
            </p>
          </div>
        </section>

        <PricingTeaser />

        <section className="section section-divider" aria-labelledby="faq-heading">
          <div className="container stack stack-12">
            <div className="stack stack-3" style={{ maxWidth: '52ch' }}>
              <span className="eyebrow">Preguntas frecuentes</span>
              <h2 id="faq-heading">Respuestas a las dudas más comunes</h2>
            </div>

            <div
              className="grid"
              data-speakable="faq"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
            >
              {FAQ.map((item) => (
                <article key={item.q} className="card stack stack-3">
                  <h3 style={{ fontSize: 'var(--text-lg)' }}>{item.q}</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{item.a}</p>
                </article>
              ))}
            </div>

            <div className="card stack stack-3" style={{ background: 'var(--color-surface)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)' }}>
                ¿Quieres ver cómo funciona en tu sector?
              </h3>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                Cada plan incluye el modelo preentrenado para tu vertical. Mira los casos de uso
                completos:
              </p>
              <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {VERTICAL_LINKS.map((v) => (
                  <Link key={v.slug} href={`/verticali/${v.slug}`} className="btn-link">
                    {v.label} →
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="card card-padded stack stack-4 text-center"
              style={{
                background: 'var(--color-surface-sunken)',
                borderColor: 'var(--color-border)',
                alignItems: 'center',
              }}
            >
              <h3>¿Necesitas un plan a medida?</h3>
              <p className="muted" style={{ maxWidth: '50ch' }}>
                Negoci grandes, cadenas, grupos de salud, agencias con más de 10 clientes.
                Armemos juntos una oferta dedicada.
              </p>
              <Link href="/contact?plan=enterprise" className="btn btn-primary">
                Habla con nosotros
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
