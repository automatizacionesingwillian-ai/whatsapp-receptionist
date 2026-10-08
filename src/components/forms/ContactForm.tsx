'use client';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { useApiForm } from '@/components/forms/useApiForm';

const TOPICS = [
  { value: 'sales', label: 'Quiero probar Ambrogio' },
  { value: 'support', label: 'Necesito soporte' },
  { value: 'agency', label: 'Soy agencia / partner' },
  { value: 'press', label: 'Prensa / medios' },
  { value: 'other', label: 'Otro' },
] as const;

export function ContactForm() {
  const { state, onSubmit } = useApiForm({
    endpoint: '/api/contact',
    successMessage: 'Mensaje enviado. Te respondemos en un día hábil.',
    buildBody: (formData) => ({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      // Lo schema accetta `null`, non la stringa vuota che il form invierebbe.
      company: formData.get('company') ? String(formData.get('company')) : null,
      topic: String(formData.get('topic') ?? ''),
      message: String(formData.get('message') ?? ''),
      // Una checkbox invia la stringa "on"; lo schema pretende `z.literal(true)`.
      consent: formData.get('consent') === 'on',
    }),
  });

  const isSubmitting = state.status === 'submitting';

  return (
    <form onSubmit={onSubmit} className="card card-padded stack stack-5" noValidate>
      <FormFeedback state={state} id="contact-form-errors" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-4)',
        }}
      >
        <div className="field">
          <label htmlFor="name" className="label">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            className="input"
            placeholder="María García"
            disabled={isSubmitting}
          />
        </div>
        <div className="field">
          <label htmlFor="email" className="label">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="input"
            placeholder="maria@negocio.com"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="company" className="label">
          Negocio
        </label>
        <input
          id="company"
          name="company"
          type="text"
          maxLength={160}
          autoComplete="organization"
          className="input"
          disabled={isSubmitting}
        />
      </div>

      <div className="field">
        <label htmlFor="topic" className="label">
          ¿De qué quieres hablar?
        </label>
        <select
          id="topic"
          name="topic"
          required
          className="select"
          defaultValue=""
          disabled={isSubmitting}
        >
          <option value="" disabled>
            Selecciona
          </option>
          {TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="message" className="label">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          className="textarea"
          placeholder="Cuéntanos."
          disabled={isSubmitting}
        />
      </div>

      <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'flex-start' }}>
        <input id="consent" name="consent" type="checkbox" required disabled={isSubmitting} />
        <label
          htmlFor="consent"
          className="muted"
          style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}
        >
          Acepto el tratamiento de datos para contacto según la{' '}
          <a href="/legal/privacy" className="btn-link">
            política de privacidad
          </a>
          .
        </label>
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
