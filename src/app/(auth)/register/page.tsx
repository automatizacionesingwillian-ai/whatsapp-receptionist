import type { Metadata } from 'next';
import Link from 'next/link';

import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrarse · Ambrogio.ai',
  description: 'Crea tu cuenta en Ambrogio.ai y activa la recepción con IA en 24 horas.',
  robots: { index: false, follow: false },
};

const TRIAL_INCLUDES = [
  '14 días gratis, sin tarjeta',
  '500 conversaciones con IA de prueba',
  'Onboarding guiado contigo',
  'Cancela con un clic',
] as const;

export default function RegisterPage() {
  return (
    <div className="stack stack-6">
      <div className="stack stack-2">
        <span className="badge badge-success">Prueba 14 días · Sin tarjeta</span>
        <h1 style={{ fontSize: 'var(--text-3xl)' }}>Crea tu negocio</h1>
        <p className="muted">
          Solo toma 60 segundos crear la cuenta. Configurarás WhatsApp y el calendario en el
          siguiente paso.
        </p>
      </div>

      <RegisterForm />

      <ul
        className="card stack stack-2"
        style={{
          listStyle: 'none',
          padding: 'var(--space-5)',
          background: 'var(--color-accent-soft)',
          border: '1px solid oklch(85% 0.05 175)',
        }}
      >
        {TRIAL_INCLUDES.map((item) => (
          <li
            key={item}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <span aria-hidden="true" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="btn-link">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
