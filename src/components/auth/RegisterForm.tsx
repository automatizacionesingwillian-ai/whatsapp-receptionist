'use client';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { useApiForm } from '@/components/forms/useApiForm';

const VERTICALS = [
  { value: 'dental', label: 'Clínica dental' },
  { value: 'beauty', label: 'Centro de estética / spa' },
  { value: 'fitness', label: 'Gimnasio / entrenador personal' },
  { value: 'professional', label: 'Servicios profesionales' },
  { value: 'other', label: 'Otro' },
] as const;

export function RegisterForm() {
  const { state, onSubmit } = useApiForm({
    endpoint: '/api/auth/sign-up',
    successMessage:
      'Cuenta creada. Te enviamos un enlace de acceso por correo: ábrelo para completar la configuración.',
  });

  const isSubmitting = state.status === 'submitting';

  return (
    <form onSubmit={onSubmit} className="stack stack-4" noValidate>
      <FormFeedback state={state} id="register-form-errors" />

      <div className="field">
        <label htmlFor="business_name" className="label">
          Nombre del negocio
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={120}
          placeholder="Clínica Dental Rossi"
          className="input"
          disabled={isSubmitting}
        />
      </div>

      <div className="field">
        <label htmlFor="email" className="label">
          Correo de trabajo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          placeholder="info@negocio.com"
          className="input"
          aria-describedby="register-email-helper"
          disabled={isSubmitting}
        />
        <p className="helper" id="register-email-helper">
          Usaremos este correo para la cuenta principal del tenant.
        </p>
      </div>

      <div className="field">
        <label htmlFor="vertical" className="label">
          Sector
        </label>
        <select
          id="vertical"
          name="vertical"
          required
          className="select"
          defaultValue=""
          disabled={isSubmitting}
        >
          <option value="" disabled>
            Selecciona el sector
          </option>
          {VERTICALS.map((vertical) => (
            <option key={vertical.value} value={vertical.value}>
              {vertical.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  );
}
