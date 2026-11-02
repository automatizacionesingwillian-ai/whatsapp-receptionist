import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { buildHowToEnrichedSchema, JsonLd } from '@/components/marketing/JsonLd';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { requireAuthenticatedOrRedirect } from '@/lib/auth/guards';
import { createTenantOnboardingService } from '@/server/onboarding/tenant-onboarding';

export const metadata: Metadata = {
  title: 'Onboarding · Ambrogio.ai',
  robots: { index: false, follow: false },
};

const ONBOARDING_HOWTO_SCHEMA = buildHowToEnrichedSchema({
  name: 'Cómo configurar Ambrogio.ai para tu negocio',
  description:
    'Cuatro pasos guiados para activar tu recepcionista con IA: perfil, horarios y servicios, canales (WhatsApp + Calendar), prueba de conversación.',
  url: '/onboarding',
  totalTime: 'PT24H',
  tool: ['Cuenta Meta Business Manager', 'Google Calendar', 'Número WhatsApp Business'],
  supply: ['Listado de servicios', 'Horario de apertura', 'Datos de facturación'],
  steps: [
    {
      name: 'Perfil del negocio',
      text: 'Ingresa nombre, sector (dental, beauty, fitness, professional), zona horaria e idioma. Tiempo: 30 segundos.',
    },
    {
      name: 'Horarios y servicios',
      text: 'Configura el horario de apertura de cada día y carga el listado de servicios (manual o importando CSV).',
    },
    {
      name: 'Conectar canales',
      text: 'Autoriza el número WhatsApp Business con Meta Business Manager y vincula Google Calendar para reservas automáticas.',
    },
    {
      name: 'Probar conversación',
      text: 'Envía un mensaje de prueba a tu número WhatsApp y verifica que Ambrogio responda bien. Configuración completa en 24 h.',
    },
  ],
});

const STEPS = [
  { n: 1, label: 'Perfil del negocio', current: true, done: false },
  { n: 2, label: 'Horarios y servicios', current: false, done: false },
  { n: 3, label: 'Conectar canales', current: false, done: false },
  { n: 4, label: 'Probar conversación', current: false, done: false },
] as const;

const VERTICALS = [
  { value: 'dental', label: 'Clínica dental' },
  { value: 'beauty', label: 'Centro de estética / spa' },
  { value: 'fitness', label: 'Gimnasio / entrenador personal' },
  { value: 'professional', label: 'Servicios profesionales' },
  { value: 'other', label: 'Otro' },
] as const;

const VALID_VERTICALS: readonly string[] = VERTICALS.map((v) => v.value);

const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'America/Mexico_City (Ciudad de México)' },
  { value: 'America/Bogota', label: 'America/Bogota (Colombia)' },
  { value: 'America/Lima', label: 'America/Lima (Perú)' },
  { value: 'America/Santiago', label: 'America/Santiago (Chile)' },
  { value: 'America/Buenos_Aires', label: 'America/Buenos_Aires (Argentina)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid' },
] as const;

interface OnboardingSearchParams {
  business_name?: string;
  vertical?: string;
}

interface OnboardingPageProps {
  searchParams: Promise<OnboardingSearchParams>;
}

const CURRENT_STEP = 1;
const TOTAL_STEPS = STEPS.length;

export default async function OnboardingPage({ searchParams }: Readonly<OnboardingPageProps>) {
  const user = await requireAuthenticatedOrRedirect();
  const status = await createTenantOnboardingService().getStatus({ user });
  if (status.onboarded) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  // Pre-popoliamo da register form per evitare redundant entry (WCAG 2.2 SC 3.3.7).
  const prefilledBusinessName =
    typeof params.business_name === 'string' ? params.business_name : '';
  const prefilledVertical =
    typeof params.vertical === 'string' && VALID_VERTICALS.includes(params.vertical)
      ? params.vertical
      : '';
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <JsonLd data={ONBOARDING_HOWTO_SCHEMA} />
      <header
        style={{
          padding: 'var(--space-4) clamp(1.25rem, 4vw, 2.5rem)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <div className="container row-between">
          <Link href="/" className="site-logo">
            Ambrogio<span style={{ color: 'var(--color-accent)' }}>.ai</span>
          </Link>
          <Link href="/help" className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            ¿Necesitas ayuda? Contáctanos →
          </Link>
        </div>
      </header>

      <main
        id="main"
        className="container"
        style={{ paddingBlock: 'var(--space-12)', maxWidth: '720px' }}
      >
        {/* Progress indicator: ol con role="progressbar" per screen reader,
            aria-current="step" sull'<li> corrente, span sr-only "corrente". */}
        <ol
          aria-label={`Onboarding paso ${CURRENT_STEP} de ${TOTAL_STEPS}`}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={CURRENT_STEP}
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-12)',
            position: 'relative',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              right: '14px',
              height: '2px',
              background: 'var(--color-border)',
              zIndex: 0,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              width: '0%',
              height: '2px',
              background: 'var(--color-accent)',
              zIndex: 1,
              transition: 'width var(--duration-slow) var(--ease-out)',
            }}
          />
          {STEPS.map((step) => (
            <li
              key={step.n}
              aria-current={step.current ? 'step' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: step.current
                    ? 'var(--color-accent)'
                    : step.done
                      ? 'var(--color-success)'
                      : 'var(--color-surface)',
                  color:
                    step.current || step.done
                      ? 'var(--color-accent-fg)'
                      : 'var(--color-text-muted)',
                  border: '2px solid',
                  borderColor: step.current
                    ? 'var(--color-accent)'
                    : step.done
                      ? 'var(--color-success)'
                      : 'var(--color-border-strong)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                }}
              >
                {step.done ? '✓' : step.n}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: step.current ? 600 : 500,
                  color: step.current ? 'var(--color-text)' : 'var(--color-text-muted)',
                  textAlign: 'center',
                  maxWidth: '110px',
                }}
              >
                {step.label}
              </span>
              {step.current ? <span className="sr-only">Paso actual.</span> : null}
            </li>
          ))}
        </ol>

        <div className="card card-padded stack stack-6">
          <div className="stack stack-2">
            <span className="eyebrow">Paso 1 de 4</span>
            <h1 style={{ fontSize: 'var(--text-3xl)' }}>Cuéntanos sobre tu negocio</h1>
            <p className="muted">
              Datos básicos para personalizar Ambrogio. Puedes cambiarlos cuando quieras.
            </p>
          </div>

          <OnboardingForm
            verticals={VERTICALS}
            timezones={TIMEZONES}
            prefilledBusinessName={prefilledBusinessName}
            prefilledVertical={prefilledVertical}
          />
        </div>

        <p
          className="muted text-center"
          style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}
        >
          Tus datos están cifrados y alojados en la UE. Consulta la{' '}
          <Link href="/legal/privacy" className="btn-link">
            política de privacidad
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
