'use client';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { useApiForm } from '@/components/forms/useApiForm';

type MagicLinkSuccessData = {
  sent?: boolean;
  recoveryLink?: string;
};

export function LoginForm() {
  const { state, onSubmit } = useApiForm({
    endpoint: '/api/auth/magic-link',
    successMessage:
      'Si el correo está asociado a una cuenta, recibirás un enlace de acceso en unos instantes. Revisa también la carpeta de spam.',
  });

  const recoveryLink = state.status === 'success' ? readRecoveryLink(state.data) : null;

  return (
    <form onSubmit={onSubmit} className="stack stack-4" noValidate>
      <FormFeedback state={state} id="login-form-errors" />

      {recoveryLink ? (
        <div
          role="status"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            background: 'var(--color-warning-soft, var(--color-success-soft))',
            color: 'var(--color-fg)',
            wordBreak: 'break-all',
          }}
        >
          <p style={{ margin: 0, marginBottom: 'var(--space-2)' }}>
            Límite de correo de Supabase alcanzado (dev). Abre este enlace para acceder:
          </p>
          <a href={recoveryLink} className="link">
            {recoveryLink}
          </a>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="email" className="label">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="tu@negocio.com"
          className="input"
          aria-describedby="login-email-helper"
          disabled={state.status === 'submitting'}
        />
        <p className="helper" id="login-email-helper">
          Te enviaremos un enlace seguro que expira en 10 minutos.
        </p>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={state.status === 'submitting'}
      >
        {state.status === 'submitting' ? 'Enviando…' : 'Enviar enlace de acceso'}
      </button>
    </form>
  );
}

function readRecoveryLink(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const link = (data as MagicLinkSuccessData).recoveryLink;
  return typeof link === 'string' && link.length > 0 ? link : null;
}
