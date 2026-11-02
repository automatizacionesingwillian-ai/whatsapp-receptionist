import { z } from 'zod';

import { apiFetch } from '@/lib/api-client';

import { runRequest, type ApiResult } from './settings-api';

export const BUSINESS_HOURS_ENDPOINT = '/api/settings/business-hours';

/**
 * Proiezione client di `BusinessHourSettings`.
 *
 * Non è importata da `@/server/settings/tenant-settings` perché quel modulo
 * istanzia il client Supabase con la service role key: anche un import di solo
 * tipo lo trascinerebbe nel grafo del bundle client.
 */
export const BusinessHourSchema = z.object({
  id: z.string(),
  weekday: z.number().int().min(0).max(6),
  opensAt: z.string(),
  closesAt: z.string(),
  active: z.boolean(),
});

export type BusinessHourView = z.output<typeof BusinessHourSchema>;

export interface DayDraft {
  readonly weekday: number;
  readonly open: boolean;
  /** `HH:mm`, stringa vuota quando non è mai stato impostato. */
  readonly opensAt: string;
  readonly closesAt: string;
}

export interface DayIssue {
  readonly weekday: number;
  readonly message: string;
}

/** `0` è domenica: stessa convenzione di `Date#getUTCDay`, usata dal booking. */
const WEEKDAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/** Orden de lectura LATAM: la semana empieza el lunes. */
export const WEEKDAY_DISPLAY_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? `Día ${weekday}`;
}

/**
 * Construye las siete filas editables a partir de los horarios guardados.
 *
 * Se un giorno ha solo fasce disattivate, le sue ore restano visibili con il
 * giorno marcato chiuso: sono dati reali, non un default inventato, e servono
 * a chi vuole riaprire il giorno senza riscriverli.
 */
export function toDayDrafts(hours: readonly BusinessHourView[]): readonly DayDraft[] {
  return WEEKDAY_DISPLAY_ORDER.map((weekday) => {
    const dayHours = [...hours]
      .filter((hour) => hour.weekday === weekday)
      .sort((left, right) => compareTime(left.opensAt, right.opensAt));
    const source = dayHours.find((hour) => hour.active) ?? dayHours[0];

    if (source === undefined) {
      return { weekday, open: false, opensAt: '', closesAt: '' };
    }

    return {
      weekday,
      open: source.active,
      opensAt: source.opensAt,
      closesAt: source.closesAt,
    };
  });
}

/**
 * Rangos que el editor no muestra.
 *
 * El modelo de datos admite varios rangos por día (p. ej. pausa de comida); esta
 * pantalla gestiona solo uno. Guardar borraría los demás sin que el usuario lo
 * sepa: el conteo sirve para avisarlo antes.
 */
export function countHiddenRanges(hours: readonly BusinessHourView[]): number {
  const seen = new Set<number>();
  let hidden = 0;

  for (const hour of hours) {
    if (seen.has(hour.weekday)) {
      hidden += 1;
      continue;
    }

    seen.add(hour.weekday);
  }

  return hidden;
}

export function validateDayDrafts(drafts: readonly DayDraft[]): readonly DayIssue[] {
  return drafts.filter((draft) => draft.open).flatMap(issuesForDraft);
}

/**
 * Body del PUT.
 *
 * Los días cerrados se omiten en lugar de enviarse con `active: false`:
 * la API igual valida `opensAt < closesAt` en cada fila, así que incluirlos
 * inventaría un horario para un día en que el estudio está cerrado.
 * Ausencia de franjas y franja desactivada producen la misma disponibilidad.
 */
export function buildBusinessHoursPayload(drafts: readonly DayDraft[]): {
  readonly hours: readonly {
    readonly weekday: number;
    readonly opensAt: string;
    readonly closesAt: string;
    readonly active: true;
  }[];
} {
  const hours = drafts
    .filter((draft) => draft.open)
    .map((draft) => ({
      weekday: draft.weekday,
      opensAt: draft.opensAt,
      closesAt: draft.closesAt,
      active: true as const,
    }))
    .sort((left, right) => left.weekday - right.weekday);

  return { hours };
}

export async function saveBusinessHours(input: {
  readonly drafts: readonly DayDraft[];
}): Promise<ApiResult<BusinessHourView[]>> {
  return runRequest(
    () =>
      apiFetch(BUSINESS_HOURS_ENDPOINT, {
        schema: z.array(BusinessHourSchema),
        method: 'PUT',
        body: buildBusinessHoursPayload(input.drafts),
      }),
    'No pudimos guardar los horarios. Inténtalo de nuevo pronto.',
  );
}

function issuesForDraft(draft: DayDraft): readonly DayIssue[] {
  if (!TIME_PATTERN.test(draft.opensAt) || !TIME_PATTERN.test(draft.closesAt)) {
    return [
      {
        weekday: draft.weekday,
        message: `${weekdayLabel(draft.weekday)}: indica horario de apertura y de cierre, o marca el día como cerrado.`,
      },
    ];
  }

  if (compareTime(draft.opensAt, draft.closesAt) >= 0) {
    return [
      {
        weekday: draft.weekday,
        message: `${weekdayLabel(draft.weekday)}: la apertura debe ser anterior al cierre.`,
      },
    ];
  }

  return [];
}

function compareTime(left: string, right: string): number {
  return timeToMinutes(left) - timeToMinutes(right);
}

function timeToMinutes(value: string): number {
  const match = TIME_PATTERN.exec(value);

  if (match === null) {
    return Number.NaN;
  }

  const [hours, minutes] = value.split(':');

  return Number(hours) * 60 + Number(minutes);
}
