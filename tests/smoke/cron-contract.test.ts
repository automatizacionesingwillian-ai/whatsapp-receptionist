/**
 * Contratto fra `vercel.json` e le route dei job interni.
 *
 * Regressione che questo test blocca: i cron erano dichiarati in
 * `vercel.json` mentre le route esportavano solo `POST`. Vercel Cron invoca in
 * `GET`, quindi ogni esecuzione riceveva 405 e nessun job girava mai in
 * produzione — con l'outbox WhatsApp che non veniva drenato e il prodotto
 * silenziosamente muto. Il typecheck non poteva accorgersene: la
 * corrispondenza fra path schedulato e handler esportato non è espressa nei
 * tipi.
 *
 * Si legge il sorgente invece di importare la route: importare `route.ts`
 * di Next.js in Vitest può appendersi al caricamento di moduli server/env.
 */

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

interface VercelConfig {
  crons?: Array<{ path: string; schedule: string }>;
}

let crons: Array<{ path: string; schedule: string }>;

beforeAll(async () => {
  const raw = await readFile(join(PROJECT_ROOT, 'vercel.json'), 'utf8');
  crons = (JSON.parse(raw) as VercelConfig).crons ?? [];
});

/** Traduce un path di cron nel file route corrispondente. */
function routeFileFor(cronPath: string): string {
  return join(PROJECT_ROOT, 'src/app', `${cronPath}/route.ts`);
}

const GET_EXPORT =
  /\bexport\s+(?:async\s+)?function\s+GET\b|\bexport\s+(?:const|let|var)\s+GET\b|\bexport\s*\{[^}]*\bGET\b/;

describe('contratto cron Vercel', () => {
  it('dichiara almeno un cron', () => {
    expect(crons.length).toBeGreaterThan(0);
  });

  it('ogni path schedulato corrisponde a una route esistente che esporta GET', async () => {
    const failures: string[] = [];

    for (const cron of crons) {
      const routeFile = routeFileFor(cron.path);

      try {
        await access(routeFile);
      } catch {
        failures.push(`${cron.path} → route mancante: ${routeFile}`);
        continue;
      }

      const source = await readFile(routeFile, 'utf8');

      // Vercel Cron invia esclusivamente GET: un handler solo-POST non viene
      // mai eseguito, e il fallimento è silenzioso.
      if (!GET_EXPORT.test(source)) {
        failures.push(`${cron.path} → nessun handler GET esportato (Vercel Cron invoca in GET)`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('ogni cron dichiara uno schedule non vuoto', () => {
    for (const cron of crons) {
      expect(cron.schedule.trim().length).toBeGreaterThan(0);
    }
  });
});
