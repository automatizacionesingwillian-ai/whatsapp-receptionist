import { describe, expect, it } from 'vitest';

import fixtures from '@/../tests/fixtures/ai/booking-extraction-evals.json';
import {
  RuleBasedBookingRequestExtractor,
  filterSlotsByBookingRequest,
  type StructuredBookingRequest,
} from '@/server/ai/booking-extractor';
import type { BookingSlot } from '@/server/appointments/booking';

// Lunes 27 abril 2026. Todas las expectativas temporales se anclan a este instante.
const now = new Date('2026-04-27T07:00:00.000Z');

const extractor = new RuleBasedBookingRequestExtractor();

function extract(text: string, timezone = 'UTC') {
  return extractor.extract({ text, now, timezone });
}

describe('RuleBasedBookingRequestExtractor', () => {
  it('extracts service, relative date and afternoon preference', async () => {
    const result = await extract('Quiero reservar una higiene mañana por la tarde');

    expect(result).toMatchObject({
      serviceQuery: 'higiene',
      urgency: 'normal',
      timePreference: {
        dayPart: 'afternoon',
        startHour: 13,
        endHour: 18,
      },
    });
    expect(result.datePreference?.label).toBe('manana');
    expect(result.datePreference?.from.toISOString()).toBe('2026-04-28T13:00:00.000Z');
    expect(result.datePreference?.to.toISOString()).toBe('2026-04-28T18:00:00.000Z');
    expect(result.signals).toEqual(
      expect.arrayContaining(['service_keyword', 'date_tomorrow', 'time_afternoon']),
    );
  });

  it('extracts weekday and after-hour preference', async () => {
    const result = await extract('Tienen lugar el jueves despues de las 18 para primera visita?');

    expect(result.serviceQuery).toBe('primera visita');
    expect(result.datePreference?.label).toBe('jueves');
    expect(result.datePreference?.from.toISOString()).toBe('2026-04-30T18:00:00.000Z');
    expect(result.timePreference).toMatchObject({
      dayPart: 'after_hour',
      startHour: 18,
    });
  });

  it('extracts customer name and phone when present', async () => {
    const result = await extract('Soy Mario Rossi, quiero una visita. El numero es 333 111 2233');

    expect(result).toMatchObject({
      customerName: 'Mario Rossi',
      customerPhone: '3331112233',
      serviceQuery: 'visita',
    });
  });

  it('extracts appointment lookup hints from natural wording', async () => {
    const byHour = await extract('Quiero cancelar esa a las 15');
    const byName = await extract('Mueve la visita de Mario');
    const byDate = await extract('Mueve esa de mañana');
    const sourceAndTarget = await extract('Mueve la visita de Mario al viernes por la mañana');

    expect(byHour.timePreference).toMatchObject({
      dayPart: 'exact_hour',
      startHour: 15,
    });
    expect(byName.customerName).toBe('Mario');
    expect(byDate.customerName).toBeNull();
    expect(byDate.datePreference?.label).toBe('manana');
    expect(sourceAndTarget.customerName).toBe('Mario');
    expect(sourceAndTarget.datePreference?.label).toBe('viernes');
    expect(sourceAndTarget.timePreference).toMatchObject({
      dayPart: 'morning',
      startHour: 8,
      endHour: 13,
    });
  });
});

describe('spanish LATAM booking phrases', () => {
  it('extracts mañana + por la tarde without confusing mañana as morning', async () => {
    const result = await extract('Quiero reservar una higiene mañana por la tarde');

    expect(result.serviceQuery).toBe('higiene');
    expect(result.datePreference?.label).toBe('manana');
    expect(result.timePreference).toMatchObject({
      dayPart: 'afternoon',
      startHour: 13,
      endHour: 18,
    });
  });

  it('treats por la mañana as morning and pasado mañana as day-after-tomorrow', async () => {
    const morning = await extract('El viernes por la mañana');
    const afterTomorrow = await extract('Pasado mañana a las 4');

    expect(morning.datePreference?.label).toBe('viernes');
    expect(morning.timePreference).toMatchObject({ dayPart: 'morning', startHour: 8, endHour: 13 });
    expect(afterTomorrow.datePreference?.label).toBe('pasado manana');
    expect(afterTomorrow.timePreference.startHour).toBe(16);
  });

  it('reads a las 3 de la tarde as 15:00', async () => {
    const result = await extract('Quiero una consulta a las 3 de la tarde');

    expect(result.serviceQuery).toBe('consulta');
    expect(result.timePreference).toMatchObject({
      dayPart: 'exact_hour',
      startHour: 15,
      endHour: 16,
    });
  });

  it('extracts soy / me llamo names', async () => {
    await expect(extract('Soy Ana Lopez, quiero una visita')).resolves.toMatchObject({
      customerName: 'Ana Lopez',
      serviceQuery: 'visita',
    });
  });
});

describe('spanish 12-hour wording', () => {
  it('reads the day-part marker before the hour instead of taking it literally', async () => {
    const afternoon = await extract('Quiero un control a las 3 de la tarde');
    const evening = await extract('Mañana a las 11 de la noche');
    const morning = await extract('A las 8 de la manana');

    expect(afternoon.timePreference).toMatchObject({
      dayPart: 'exact_hour',
      startHour: 15,
      endHour: 16,
    });
    expect(afternoon.signals).toEqual(expect.arrayContaining(['time_daypart_afternoon']));
    expect(evening.timePreference).toMatchObject({ startHour: 23, endHour: 24 });
    expect(evening.datePreference?.to.toISOString()).toBe('2026-04-29T00:00:00.000Z');
    expect(morning.timePreference).toMatchObject({ startHour: 8, endHour: 9 });
  });

  it('reads a bare early hour as afternoon, because nobody books at 4am', async () => {
    const bare = await extract('Pasado mañana alrededor de las 4');
    const explicitMorning = await extract('Pasado mañana alrededor de las 4 de la manana');

    expect(bare.timePreference.startHour).toBe(16);
    expect(bare.datePreference?.from.toISOString()).toBe('2026-04-29T16:00:00.000Z');
    expect(explicitMorning.timePreference.startHour).toBe(4);
  });

  it('keeps hours from 7 onwards literal', async () => {
    await expect(extract('Viernes a las 9')).resolves.toMatchObject({
      timePreference: { startHour: 9, endHour: 10 },
    });
    await expect(extract('Viernes a las 19')).resolves.toMatchObject({
      timePreference: { startHour: 19, endHour: 20 },
    });
  });

  it('treats mediodia and medianoche as absolute hours', async () => {
    await expect(extract('Puedo pasar a mediodia?')).resolves.toMatchObject({
      timePreference: { dayPart: 'exact_hour', startHour: 12, endHour: 13 },
    });
    await expect(extract('Esta noche a medianoche')).resolves.toMatchObject({
      timePreference: { dayPart: 'exact_hour', startHour: 0, endHour: 1 },
    });
  });

  it('still falls back to the day-part range when no hour is given', async () => {
    await expect(extract('Mañana por la tarde')).resolves.toMatchObject({
      timePreference: { dayPart: 'afternoon', startHour: 13, endHour: 18 },
    });
    await expect(extract('Lunes proximo por la manana')).resolves.toMatchObject({
      timePreference: { dayPart: 'morning', startHour: 8, endHour: 13 },
    });
    await expect(extract('Viernes por la noche')).resolves.toMatchObject({
      timePreference: { dayPart: 'evening', startHour: 18, endHour: 21 },
    });
  });

  it('applies the marker to relative bounds too', async () => {
    await expect(extract('Viernes despues de las 5 de la tarde')).resolves.toMatchObject({
      timePreference: { dayPart: 'after_hour', startHour: 17, endHour: 21 },
    });
    await expect(extract('Quiero reservar un control antes de las 11')).resolves.toMatchObject({
      timePreference: { dayPart: 'before_hour', startHour: 8, endHour: 11 },
    });
  });
});

describe('minutes', () => {
  it('uses the captured minute group instead of dropping it', async () => {
    const colon = await extract('Me parece bien a las 15:30');
    const dot = await extract('Lunes a las 16.45');

    expect(colon.timePreference).toMatchObject({ startHour: 15.5, endHour: 16.5 });
    expect(dot.timePreference).toMatchObject({ startHour: 16.75, endHour: 17.75 });
    expect(dot.datePreference?.from.toISOString()).toBe('2026-05-04T16:45:00.000Z');
    expect(dot.datePreference?.to.toISOString()).toBe('2026-05-04T17:45:00.000Z');
  });

  it('understands spoken minutes', async () => {
    await expect(extract('El 3 a las 9 y media')).resolves.toMatchObject({
      timePreference: { startHour: 9.5, endHour: 10.5 },
    });
    await expect(extract('Viernes a las 10 y un cuarto')).resolves.toMatchObject({
      timePreference: { startHour: 10.25 },
    });
    await expect(extract('Viernes a las 10 y tres cuartos')).resolves.toMatchObject({
      timePreference: { startHour: 10.75 },
    });
  });

  it('subtracts the quarter in "menos un cuarto"', async () => {
    const result = await extract('Mañana a las 3 menos un cuarto');

    expect(result.timePreference.startHour).toBe(14.75);
    expect(result.datePreference?.from.toISOString()).toBe('2026-04-28T14:45:00.000Z');
  });
});

describe('explicit dates', () => {
  it('resolves dates written with the month in letters', async () => {
    const result = await extract('Buenos dias, tienen lugar el 15 de mayo?');

    expect(result.datePreference?.label).toBe('15 mayo');
    expect(result.datePreference?.from.toISOString()).toBe('2026-05-15T00:00:00.000Z');
    expect(result.datePreference?.to.toISOString()).toBe('2026-05-16T00:00:00.000Z');
    expect(result.signals).toEqual(expect.arrayContaining(['date_explicit_month']));
  });

  it('resolves numeric dates and honours an explicit year', async () => {
    const implicitYear = await extract('Reservamos para el 15/05');
    const explicitYear = await extract('Nos vemos el 15/05/2027');
    const shortYear = await extract('Nos vemos el 15/05/27');

    expect(implicitYear.datePreference?.from.toISOString()).toBe('2026-05-15T00:00:00.000Z');
    expect(explicitYear.datePreference?.from.toISOString()).toBe('2027-05-15T00:00:00.000Z');
    expect(shortYear.datePreference?.from.toISOString()).toBe('2027-05-15T00:00:00.000Z');
  });

  it('rolls an already passed date to next year', async () => {
    const passed = await extract('El 3 de marzo esta bien?');
    const stillAhead = await extract('El 3 de junio esta bien?');

    expect(passed.datePreference?.from.toISOString()).toBe('2027-03-03T00:00:00.000Z');
    expect(stillAhead.datePreference?.from.toISOString()).toBe('2026-06-03T00:00:00.000Z');
  });

  it('combines an explicit date with an explicit hour', async () => {
    const result = await extract('Me parece bien el 2 de junio a las 10:45');

    expect(result.datePreference?.from.toISOString()).toBe('2026-06-02T10:45:00.000Z');
    expect(result.datePreference?.to.toISOString()).toBe('2026-06-02T11:45:00.000Z');
  });

  it('resolves a bare day of the month to the next occurrence', async () => {
    const nextMonth = await extract('El 3 a las 9 y media');
    const thisMonth = await extract('El 30 a las 9');

    expect(nextMonth.datePreference?.label).toBe('3 mayo');
    expect(nextMonth.datePreference?.from.toISOString()).toBe('2026-05-03T09:30:00.000Z');
    expect(thisMonth.datePreference?.label).toBe('30 abril');
    expect(thisMonth.datePreference?.from.toISOString()).toBe('2026-04-30T09:00:00.000Z');
  });

  it('reads relative day counts', async () => {
    const days = await extract('En tres dias seria perfecto');
    const week = await extract('En una semana para el control');

    expect(days.datePreference?.from.toISOString()).toBe('2026-04-30T00:00:00.000Z');
    expect(week.datePreference?.from.toISOString()).toBe('2026-05-04T00:00:00.000Z');
  });

  it('prefers pasado mañana over mañana when both spellings appear', async () => {
    const joined = await extract('Pasado mañana por la manana');
    const spaced = await extract('Pasado manana por la manana');

    expect(joined.datePreference?.from.toISOString()).toBe('2026-04-29T08:00:00.000Z');
    expect(spaced.datePreference?.from.toISOString()).toBe('2026-04-29T08:00:00.000Z');
  });
});

describe('refuses to invent a date', () => {
  it('returns no date preference for messages that contain none', async () => {
    const texts = [
      'Buenos dias, estan abiertos?',
      'Cuanto cuesta una limpieza dental?',
      'Quiero saber los precios',
      'Muchas gracias!',
      'El tratamiento cuesta 15/20 euros?',
      'Tienen el numero 3331112233?',
      'Tengo 3 hijos, hacen descuentos?',
    ];

    for (const text of texts) {
      const result = await extract(text);

      expect(result.datePreference, text).toBeNull();
    }
  });

  it('does not guess a day when the written date does not exist', async () => {
    const noHour = await extract('Cita el 29 de febrero');
    const withHour = await extract('El 31 de febrero a las 10');

    expect(noHour.datePreference).toBeNull();
    expect(noHour.signals).toEqual(expect.arrayContaining(['date_invalid']));
    expect(withHour.datePreference).toBeNull();
    expect(withHour.timePreference).toMatchObject({ dayPart: 'exact_hour', startHour: 10 });
  });

  it('does not turn an article into a customer name', async () => {
    const result = await extract('Reservamos para el 15 de mayo');

    expect(result.customerName).toBeNull();
    expect(result.serviceQuery).toBeNull();
  });
});

describe('tenant timezone', () => {
  it('resolves the local day and hour in the tenant timezone, not the server one', async () => {
    const instant = new Date('2026-07-14T22:30:00.000Z');

    const rome = await extractor.extract({
      text: 'manana a las 10',
      now: instant,
      timezone: 'Europe/Rome',
    });
    const auckland = await extractor.extract({
      text: 'manana a las 10',
      now: instant,
      timezone: 'Pacific/Auckland',
    });

    // En Roma ya son las 00:30 del 15; en Auckland las 10:30 del 15:
    // "manana" es el 16 en Roma y el 16 en Auckland, pero en instantes UTC distintos.
    expect(rome.datePreference?.from.toISOString()).toBe('2026-07-16T08:00:00.000Z');
    expect(auckland.datePreference?.from.toISOString()).toBe('2026-07-15T22:00:00.000Z');
  });

  it('falls back to America/Mexico_City when the tenant timezone is missing', async () => {
    const result = await extractor.extract({
      text: 'manana a las 10',
      now: new Date('2026-07-14T22:30:00.000Z'),
    });

    expect(result.datePreference?.from.toISOString()).toBe('2026-07-15T16:00:00.000Z');
  });

  it('accounts for the tenant DST offset', async () => {
    const beforeSwitch = await extractor.extract({
      text: 'manana a las 10',
      now: new Date('2026-03-27T09:00:00.000Z'),
      timezone: 'Europe/Rome',
    });
    const afterSwitch = await extractor.extract({
      text: 'manana a las 10',
      now: new Date('2026-03-28T09:00:00.000Z'),
      timezone: 'Europe/Rome',
    });

    expect(beforeSwitch.datePreference?.from.toISOString()).toBe('2026-03-28T09:00:00.000Z');
    expect(afterSwitch.datePreference?.from.toISOString()).toBe('2026-03-29T08:00:00.000Z');
  });

  it('resolves "hoy" on the tenant calendar day across the year boundary', async () => {
    const result = await extractor.extract({
      text: 'hoy a las 18',
      now: new Date('2026-12-31T20:00:00.000Z'),
      timezone: 'Pacific/Auckland',
    });

    expect(result.datePreference?.from.toISOString()).toBe('2027-01-01T05:00:00.000Z');
  });
});

describe('booking extraction eval fixtures', () => {
  it('resolves the exact booking window for every fixture', async () => {
    for (const fixture of fixtures) {
      const result = await extract(fixture.text);

      expect(result.datePreference?.from.toISOString() ?? null, fixture.text).toBe(
        fixture.expected.from,
      );
      expect(result.datePreference?.to.toISOString() ?? null, fixture.text).toBe(
        fixture.expected.to,
      );
    }
  });

  it('keeps negative cases in the eval set', async () => {
    const withoutDate = fixtures.filter((fixture) => fixture.expected.dateLabel === null);

    expect(withoutDate.length).toBeGreaterThanOrEqual(6);
  });
});

describe('filterSlotsByBookingRequest', () => {
  it('keeps only slots matching extracted afternoon preference', () => {
    const request = requestWithTimePreference({
      dayPart: 'afternoon',
      startHour: 13,
      endHour: 18,
    });

    expect(
      filterSlotsByBookingRequest(
        [
          slot('2026-04-28T09:00:00.000Z'),
          slot('2026-04-28T14:00:00.000Z'),
          slot('2026-04-28T18:00:00.000Z'),
        ],
        request,
      ).map((item) => item.start),
    ).toEqual(['2026-04-28T14:00:00.000Z']);
  });

  it('respects fractional bounds coming from minutes', () => {
    const request = requestWithTimePreference({
      dayPart: 'exact_hour',
      startHour: 15.5,
      endHour: 16.5,
    });

    expect(
      filterSlotsByBookingRequest(
        [
          slot('2026-04-28T15:15:00.000Z'),
          slot('2026-04-28T15:30:00.000Z'),
          slot('2026-04-28T16:15:00.000Z'),
          slot('2026-04-28T16:30:00.000Z'),
        ],
        request,
      ).map((item) => item.start),
    ).toEqual(['2026-04-28T15:30:00.000Z', '2026-04-28T16:15:00.000Z']);
  });

  it('compares the slot local hour in the slot timezone', () => {
    const request = requestWithTimePreference({
      dayPart: 'exact_hour',
      startHour: 15.5,
      endHour: 16.5,
    });
    const instant = '2026-04-28T13:30:00.000Z';

    expect(
      filterSlotsByBookingRequest([slot(instant, 'Europe/Rome')], request).map(
        (item) => item.start,
      ),
    ).toEqual([instant]);
    expect(filterSlotsByBookingRequest([slot(instant, 'UTC')], request)).toEqual([]);
  });

  it('keeps every slot when no time preference was understood', () => {
    const request = requestWithTimePreference({
      dayPart: 'any',
      startHour: null,
      endHour: null,
    });
    const slots = [slot('2026-04-28T05:00:00.000Z'), slot('2026-04-28T22:00:00.000Z')];

    expect(filterSlotsByBookingRequest(slots, request)).toEqual(slots);
  });
});

function requestWithTimePreference(
  timePreference: StructuredBookingRequest['timePreference'],
): StructuredBookingRequest {
  return {
    serviceQuery: 'visita',
    datePreference: null,
    timePreference,
    urgency: 'normal',
    customerName: null,
    customerPhone: null,
    confidence: 0.8,
    signals: [],
  };
}

function slot(start: string, timezone = 'UTC'): BookingSlot {
  return {
    tenantId: 'tenant_1',
    serviceId: 'service_1',
    serviceName: 'Primera visita',
    start,
    end: new Date(new Date(start).getTime() + 30 * 60_000).toISOString(),
    durationMinutes: 30,
    timezone,
  };
}
