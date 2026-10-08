'use client';

import { useCallback, useState, type FormEvent } from 'react';

import { FormFeedback } from '@/components/forms/FormFeedback';
import { type ApiFormState } from '@/components/forms/useApiForm';

import {
  EMPTY_SERVICE_DRAFT,
  archiveService,
  buildServicePatch,
  createService,
  formatDuration,
  formatPrice,
  toServiceDraft,
  updateService,
  validateServiceDraft,
  type NormalizedService,
  type ServiceDraft,
  type ServiceFieldErrors,
  type ServiceView,
} from './services-model';

interface ServicesManagerProps {
  readonly services: readonly ServiceView[];
  /** Solo owner e admin possono scrivere: l'API rifiuta gli altri con 403. */
  readonly canManage: boolean;
}

const IDLE: ApiFormState = { status: 'idle', message: null };

/** Stesso ordine della query server: prima gli attivi, poi per nome. */
function compareServices(left: ServiceView, right: ServiceView): number {
  if (left.active !== right.active) {
    return left.active ? -1 : 1;
  }

  return left.name.localeCompare(right.name, 'es');
}

export function ServicesManager({ services, canManage }: ServicesManagerProps) {
  const [list, setList] = useState<readonly ServiceView[]>(services);
  const [state, setState] = useState<ApiFormState>(IDLE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onCreate = useCallback(async (value: NormalizedService): Promise<void> => {
    setBusyId('new');
    setState({ status: 'submitting', message: null });
    const result = await createService({ service: value });
    setBusyId(null);

    if (!result.ok) {
      setState({ status: 'error', message: result.message });
      return;
    }

    const created = result.data;
    setList((current) => [...current, created].sort(compareServices));
    setIsCreating(false);
    setState({ status: 'success', message: `Servicio «${created.name}» creado.` });
  }, []);

  const onUpdate = useCallback(
    async (service: ServiceView, value: NormalizedService): Promise<void> => {
      const patch = buildServicePatch(service, value);

      if (Object.keys(patch).length === 0) {
        // L'API rifiuta un patch vuoto con 400: meglio non partire.
        setEditingId(null);
        setState({ status: 'success', message: 'No hay cambios que guardar.' });
        return;
      }

      setBusyId(service.id);
      setState({ status: 'submitting', message: null });
      const result = await updateService({ serviceId: service.id, patch });
      setBusyId(null);

      if (!result.ok) {
        setState({ status: 'error', message: result.message });
        return;
      }

      const updated = result.data;
      setList((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)).sort(compareServices),
      );
      setEditingId(null);
      setState({ status: 'success', message: `Servicio «${updated.name}» actualizado.` });
    },
    [],
  );

  const onArchive = useCallback(async (service: ServiceView): Promise<void> => {
    setBusyId(service.id);
    setState({ status: 'submitting', message: null });
    const result = await archiveService({ serviceId: service.id });
    setBusyId(null);

    if (!result.ok) {
      setState({ status: 'error', message: result.message });
      return;
    }

    const archived = result.data;
    setList((current) =>
      current.map((item) => (item.id === archived.id ? archived : item)).sort(compareServices),
    );
    setPendingArchiveId(null);
    setState({
      status: 'success',
      message: `Servicio «${archived.name}» archivado: Ambrogio ya no lo propone.`,
    });
  }, []);

  return (
    <div className="stack stack-6">
      <section className="card stack stack-4">
        <div className="row-between" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div className="stack stack-2">
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Tarifario</h2>
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              Ambrogio propone solo servicios activos y usa la duración para calcular cuánto espacio
              ocupar en la agenda.
            </p>
          </div>
          {canManage && !isCreating ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
              }}
            >
              Agregar servicio
            </button>
          ) : null}
        </div>

        <FormFeedback state={state} id="services-feedback" />

        {isCreating ? (
          <ServiceForm
            formId="service-new"
            initial={EMPTY_SERVICE_DRAFT}
            title="Nuevo servicio"
            submitLabel="Crear servicio"
            busy={busyId === 'new'}
            onCancel={() => setIsCreating(false)}
            onValid={onCreate}
          />
        ) : null}

        {list.length === 0 ? (
          <p className="helper">
            Ningún servicio configurado. Mientras el tarifario esté vacío, Ambrogio no puede proponer
            ni reservar nada.
          </p>
        ) : (
          <ul className="stack stack-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {list.map((service) => (
              <li key={service.id}>
                {editingId === service.id ? (
                  <ServiceForm
                    formId={`service-${service.id}`}
                    initial={toServiceDraft(service)}
                    title={`Editar «${service.name}»`}
                    submitLabel="Guardar cambios"
                    busy={busyId === service.id}
                    onCancel={() => setEditingId(null)}
                    onValid={(value) => onUpdate(service, value)}
                  />
                ) : (
                  <ServiceRow
                    service={service}
                    canManage={canManage}
                    busy={busyId === service.id}
                    isConfirmingArchive={pendingArchiveId === service.id}
                    onEdit={() => {
                      setEditingId(service.id);
                      setIsCreating(false);
                    }}
                    onAskArchive={() => setPendingArchiveId(service.id)}
                    onCancelArchive={() => setPendingArchiveId(null)}
                    onArchive={() => onArchive(service)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage ? null : (
        <p className="helper">
          Solo el titular de la cuenta y los administradores pueden modificar el tarifario.
        </p>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  canManage,
  busy,
  isConfirmingArchive,
  onEdit,
  onAskArchive,
  onCancelArchive,
  onArchive,
}: {
  service: ServiceView;
  canManage: boolean;
  busy: boolean;
  isConfirmingArchive: boolean;
  onEdit: () => void;
  onAskArchive: () => void;
  onCancelArchive: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className="stack stack-3"
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-sunken)',
      }}
    >
      <div className="row-between" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div className="stack stack-2">
          <strong>{service.name}</strong>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
          </span>
          {service.description === null ? null : (
            <span className="helper">{service.description}</span>
          )}
        </div>
        <span className={service.active ? 'badge badge-success' : 'badge badge-neutral'}>
          {service.active ? 'Activo' : 'Archivado'}
        </span>
      </div>

      {canManage ? (
        <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onEdit}
            disabled={busy}
          >
            Editar
          </button>
          {service.active ? (
            isConfirmingArchive ? (
              <>
                <span className="helper" style={{ alignSelf: 'center' }}>
                  ¿Confirmas? El servicio sigue en las citas ya reservadas, pero Ambrogio dejará de
                  ofrecerlo.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onArchive}
                  disabled={busy}
                >
                  {busy ? 'Archivando…' : 'Sí, archivar'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onCancelArchive}
                  disabled={busy}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onAskArchive}
                disabled={busy}
              >
                Archivar
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ServiceForm({
  formId,
  initial,
  title,
  submitLabel,
  busy,
  onCancel,
  onValid,
}: {
  formId: string;
  initial: ServiceDraft;
  title: string;
  submitLabel: string;
  busy: boolean;
  onCancel: () => void;
  onValid: (value: NormalizedService) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ServiceDraft>(initial);
  const [errors, setErrors] = useState<ServiceFieldErrors>({});

  const nameId = `${formId}-name`;
  const durationId = `${formId}-duration`;
  const priceId = `${formId}-price`;
  const descriptionId = `${formId}-description`;
  const activeId = `${formId}-active`;

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const validation = validateServiceDraft(draft);

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    void onValid(validation.value);
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="stack stack-4"
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-sunken)',
      }}
    >
      <h3 style={{ fontSize: 'var(--text-lg)' }}>{title}</h3>

      <div className="field">
        <label htmlFor={nameId} className="label">
          Nombre
        </label>
        <input
          id={nameId}
          type="text"
          className="input"
          maxLength={120}
          value={draft.name}
          disabled={busy}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name === undefined ? undefined : `${nameId}-error`}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        />
        {errors.name === undefined ? null : (
          <p id={`${nameId}-error`} className="helper" style={{ color: 'var(--color-danger)' }}>
            {errors.name}
          </p>
        )}
      </div>

      <div className="row" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div className="field" style={{ minWidth: '12rem', flex: 1 }}>
          <label htmlFor={durationId} className="label">
            Duración (minutos)
          </label>
          <input
            id={durationId}
            type="number"
            inputMode="numeric"
            className="input"
            min={5}
            max={480}
            step={5}
            value={draft.durationMinutes}
            disabled={busy}
            aria-invalid={errors.durationMinutes !== undefined}
            aria-describedby={
              errors.durationMinutes === undefined ? undefined : `${durationId}-error`
            }
            onChange={(event) =>
              setDraft((current) => ({ ...current, durationMinutes: event.target.value }))
            }
          />
          {errors.durationMinutes === undefined ? null : (
            <p
              id={`${durationId}-error`}
              className="helper"
              style={{ color: 'var(--color-danger)' }}
            >
              {errors.durationMinutes}
            </p>
          )}
        </div>

        <div className="field" style={{ minWidth: '12rem', flex: 1 }}>
          <label htmlFor={priceId} className="label">
            Precio (€)
          </label>
          <input
            id={priceId}
            type="text"
            inputMode="decimal"
            className="input"
            placeholder="ej. 45,00"
            value={draft.price}
            disabled={busy}
            aria-invalid={errors.price !== undefined}
            aria-describedby={errors.price === undefined ? `${priceId}-help` : `${priceId}-error`}
            onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
          />
          {errors.price === undefined ? (
            <p id={`${priceId}-help`} className="helper">
              Déjalo vacío si el precio se acuerda caso por caso.
            </p>
          ) : (
            <p id={`${priceId}-error`} className="helper" style={{ color: 'var(--color-danger)' }}>
              {errors.price}
            </p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor={descriptionId} className="label">
          Descripción
        </label>
        <textarea
          id={descriptionId}
          className="textarea"
          rows={3}
          maxLength={500}
          value={draft.description}
          disabled={busy}
          aria-invalid={errors.description !== undefined}
          aria-describedby={
            errors.description === undefined ? `${descriptionId}-help` : `${descriptionId}-error`
          }
          onChange={(event) =>
            setDraft((current) => ({ ...current, description: event.target.value }))
          }
        />
        {errors.description === undefined ? (
          <p id={`${descriptionId}-help`} className="helper">
            Opcional. Ambrogio la usa para explicar el servicio a quien pide información.
          </p>
        ) : (
          <p
            id={`${descriptionId}-error`}
            className="helper"
            style={{ color: 'var(--color-danger)' }}
          >
            {errors.description}
          </p>
        )}
      </div>

      <div className="row" style={{ gap: 'var(--space-3)' }}>
        <input
          id={activeId}
          type="checkbox"
          checked={draft.active}
          disabled={busy}
          onChange={(event) =>
            setDraft((current) => ({ ...current, active: event.target.checked }))
          }
        />
        <label htmlFor={activeId} className="label" style={{ margin: 0 }}>
          Activo: Ambrogio puede ofrecerlo y reservarlo
        </label>
      </div>

      <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Guardando…' : submitLabel}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
