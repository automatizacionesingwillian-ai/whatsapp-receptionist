import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión · Ambrogio.ai',
  description: 'Accede a tu cuenta de Ambrogio.ai',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  link_non_valido: 'El enlace de acceso no es válido o expiró. Solicita uno nuevo abajo.',
  link_incompleto:
    'El enlace de acceso está incompleto. Solicita uno nuevo con el formulario de abajo.',
  sessione_mancante: 'No pudimos crear la sesión. Solicita un nuevo enlace de acceso.',
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Readonly<LoginPageProps>) {
  const params = await searchParams;
  const errorKey = typeof params.error === 'string' ? params.error : null;
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? null) : null;

  return (
    <div className="stack stack-6">
      <div className="stack stack-2">
        <h1 style={{ fontSize: 'var(--text-3xl)' }}>Bienvenido de nuevo</h1>
        <p className="muted">
          Ingresa tu correo y te enviamos un enlace seguro para acceder. Sin contraseñas que
          recordar.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="card card-padded"
          style={{
            borderColor: 'var(--color-danger)',
            background: 'var(--color-danger-soft, #fef2f2)',
            color: 'var(--color-danger)',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      <LoginForm />

      <div
        className="stack stack-3"
        style={{
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          ¿Aún no tienes cuenta?{' '}
          <Link href="/register" className="btn-link">
            Crea tu negocio
          </Link>
        </p>
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Al hacer clic en &quot;Enviar enlace&quot; aceptas los{' '}
          <Link href="/legal/terms" className="btn-link">
            términos de servicio
          </Link>{' '}
          y la{' '}
          <Link href="/legal/privacy" className="btn-link">
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
