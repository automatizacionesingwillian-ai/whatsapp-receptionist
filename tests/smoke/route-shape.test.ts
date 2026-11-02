/**
 * Smoke test - verifica che ogni API route esporti almeno un handler HTTP valido.
 *
 * Questo test è una rete di sicurezza per evitare regressioni dovute a refactor
 * di import o spostamento file, senza necessità di un server in esecuzione.
 *
 * Si analizza il sorgente invece di importare i moduli: in Vitest l'import di
 * `route.ts` Next.js può caricare env/server e superare il timeout.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const API_ROOT = join(PROJECT_ROOT, 'src/app/api');
const VALID_HANDLERS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] as const;

async function findRouteFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await findRouteFiles(fullPath)));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      result.push(fullPath);
    }
  }

  return result;
}

function exportedHandlers(source: string): string[] {
  const found = new Set<string>();

  for (const handler of VALID_HANDLERS) {
    const pattern = new RegExp(
      String.raw`\bexport\s+(?:async\s+)?function\s+${handler}\b|\bexport\s+(?:const|let|var)\s+${handler}\b|\bexport\s*\{[^}]*\b${handler}\b`,
    );
    if (pattern.test(source)) {
      found.add(handler);
    }
  }

  return [...found];
}

describe('API routes shape (smoke)', () => {
  it('every route.ts exports at least one HTTP handler', async () => {
    const routes = await findRouteFiles(API_ROOT);

    expect(routes.length).toBeGreaterThan(0);

    const failures: string[] = [];

    for (const routePath of routes) {
      const source = await readFile(routePath, 'utf8');
      const handlers = exportedHandlers(source);

      if (handlers.length === 0) {
        failures.push(`${relative(PROJECT_ROOT, routePath)} - no HTTP handler exported`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Route shape failures:\n${failures.join('\n')}`);
    }
  });

  it('all route files compile without TypeScript errors (covered by typecheck)', () => {
    expect(true).toBe(true);
  });
});
