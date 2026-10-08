'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { useApiForm } from '@/components/forms/useApiForm';

const KNOWLEDGE_BASE_ENDPOINT = '/api/knowledge-base';

/**
 * Form di inserimento di un documento in knowledge base.
 *
 * L'elenco è renderizzato da un Server Component: dopo un inserimento riuscito
 * serve `router.refresh()`, altrimenti la pagina resta ferma sui dati del
 * render precedente e el documento appena creato sembra non essere stato
 * salvato. `useApiForm` non espone una callback di successo, quindi la
 * transizione di stato viene osservata qui.
 */
export function KnowledgeDocumentForm() {
  const router = useRouter();
  const { state, onSubmit } = useApiForm({
    endpoint: KNOWLEDGE_BASE_ENDPOINT,
    successMessage:
      'Documento guardado e indexado. El asistente lo usará desde la próxima pregunta.',
    buildBody: (formData) => {
      const category = String(formData.get('category') ?? '').trim();

      return {
        title: String(formData.get('title') ?? ''),
        content: String(formData.get('content') ?? ''),
        category: category.length > 0 ? category : null,
      };
    },
  });

  const isSubmitting = state.status === 'submitting';

  useEffect(() => {
    if (state.status === 'success') {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form onSubmit={onSubmit} className="stack stack-4" noValidate>
      <FormFeedback state={state} id="knowledge-document-form-feedback" />

      <div className="field">
        <label htmlFor="knowledge-title" className="label">
          Título
        </label>
        <input
          id="knowledge-title"
          name="title"
          type="text"
          required
          minLength={1}
          maxLength={160}
          placeholder="Política de cancelación de citas"
          className="input"
          disabled={isSubmitting}
        />
      </div>

      <div className="field">
        <label htmlFor="knowledge-category" className="label">
          Categoría <span className="muted">(opcional)</span>
        </label>
        <input
          id="knowledge-category"
          name="category"
          type="text"
          maxLength={80}
          placeholder="Reglamento, Tarifario, Sede…"
          className="input"
          disabled={isSubmitting}
        />
        <p className="helper">Solo te ayuda a encontrar documentos en la lista.</p>
      </div>

      <div className="field">
        <label htmlFor="knowledge-content" className="label">
          Contenido
        </label>
        <textarea
          id="knowledge-content"
          name="content"
          required
          minLength={1}
          maxLength={30000}
          rows={8}
          placeholder={
            'Escríbelo como se lo explicarías a un colega nuevo.\n\nEjemplo: la cancelación es gratis hasta 24 horas antes. Con menos de 24 horas cobramos 30 €. Con certificado médico no cobramos nada.'
          }
          className="textarea"
          disabled={isSubmitting}
        />
        <p className="helper">
          Máximo 30.000 caracteres. Un documento por tema funciona mejor que un solo texto largo: la
          búsqueda semántica recupera el fragmento correcto en lugar de todo el bloque.
        </p>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Agregar documento'}
        </button>
      </div>
    </form>
  );
}

type ActionStatus = 'idle' | 'confirming' | 'pending' | 'error';

/**
 * Attivazione / disattivazione di un documento.
 *
 * L'API non cancella mai la riga: `DELETE /api/knowledge-base/[id]` imposta
 * `active = false`, e `PATCH` con `{ active: true }` la rimette in circolo. Il
 * copy dice quindi "archivia", non "elimina", perché è ciò che accade davvero.
 */
export function KnowledgeDocumentArchiveButton({
  documentId,
  title,
  active,
}: Readonly<{ documentId: string; title: string; active: boolean }>) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionStatus>('idle');

  async function submitChange(): Promise<void> {
    setStatus('pending');

    try {
      const response = active
        ? await fetch(`${KNOWLEDGE_BASE_ENDPOINT}/${documentId}`, { method: 'DELETE' })
        : await fetch(`${KNOWLEDGE_BASE_ENDPOINT}/${documentId}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ active: true }),
          });

      if (!response.ok) {
        setStatus('error');
        return;
      }
    } catch {
      setStatus('error');
      return;
    }

    setStatus('idle');
    router.refresh();
  }

  if (!active) {
    return (
      <div className="row" style={{ gap: 'var(--space-2)' }}>
        {status === 'error' ? (
          <span role="alert" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
            La operación falló. Reintentar.
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          disabled={status === 'pending'}
          onClick={() => void submitChange()}
        >
          {status === 'pending' ? 'Reactivando…' : 'Reactivar'}
          <span className="sr-only"> el documento {title}</span>
        </button>
      </div>
    );
  }

  if (status === 'confirming') {
    return (
      <div className="row" style={{ gap: 'var(--space-2)' }}>
        <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          El asistente dejará de usarlo. ¿Confirmas?
        </span>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => void submitChange()}
        >
          Sí, archivar
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setStatus('idle')}>
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="row" style={{ gap: 'var(--space-2)' }}>
      {status === 'error' ? (
        <span role="alert" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
          No se pudo archivar. Reintentar.
        </span>
      ) : null}
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={status === 'pending'}
        onClick={() => setStatus('confirming')}
      >
        {status === 'pending' ? 'Archivando…' : 'Archivar'}
        <span className="sr-only"> el documento {title}</span>
      </button>
    </div>
  );
}
