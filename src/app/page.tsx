import type { Metadata } from 'next';

import { CtaSection } from '@/components/marketing/CtaSection';
import { FeaturesSection } from '@/components/marketing/FeaturesSection';
import { HeroSection } from '@/components/marketing/HeroSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import {
  JsonLd,
  organizationSchema,
  softwareApplicationSchema,
} from '@/components/marketing/JsonLd';
import { PricingTeaser } from '@/components/marketing/PricingTeaser';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { VerticalsSection } from '@/components/marketing/VerticalsSection';

export const metadata: Metadata = {
  title: 'Recepcionista AI para negocios y PyMEs',
  description:
    'Recepción AI siempre activa en WhatsApp y voz: agenda citas, filtra urgencias y libera a recepción. Configuración en 24 h, prueba 14 días.',
  openGraph: {
    title: 'Ambrogio.ai — Recepcionista AI siempre activo',
    description:
      'Recepcionista AI en WhatsApp y voz para clínicas dentales, centros de estética, gimnasios y servicios profesionales. Hosting EU, listo para GDPR.',
    locale: 'es_419',
    type: 'website',
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareApplicationSchema} />
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <FeaturesSection />
        <VerticalsSection />
        <HowItWorksSection />
        <PricingTeaser />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
