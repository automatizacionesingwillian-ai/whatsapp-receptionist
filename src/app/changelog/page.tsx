import type { Metadata } from 'next';

import {
  buildBreadcrumbSchema,
  buildEventSchema,
  buildWebPageSchema,
  JsonLd,
} from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Changelog · Actualizaciones Ambrogio.ai',
  description:
    'Sigue en tiempo real las actualizaciones de Ambrogio.ai: nuevas funciones, mejoras, fixes de seguridad y feed RSS.',
  alternates: {
    canonical: '/changelog',
    types: { 'application/rss+xml': '/changelog/feed.xml' },
  },
};

interface ChangelogEntry {
  date: string;
  version: string;
  category: 'feature' | 'improvement' | 'fix' | 'security';
  title: string;
  body: string;
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: '8 de mayo de 2026',
    version: 'v0.1.0',
    category: 'feature',
    title: 'Lanzamiento beta privada · v0.1.0',
    body: 'Ambrogio.ai entra en beta privada. Incluye: WhatsApp + voice + Google Calendar + Stripe billing + facturación electrónica.',
  },
  {
    date: '5 de mayo de 2026',
    version: '—',
    category: 'security',
    title: 'CSP con nonce + GDPR Arts. 15/17',
    body: 'Hardening completo: CSP con nonce por request, COEP/COOP/CORP, endpoints de exportación y eliminación GDPR, rate limiting Upstash en todos los endpoints sensibles.',
  },
  {
    date: '2 de mayo de 2026',
    version: '—',
    category: 'improvement',
    title: 'TypeScript strict + exactOptionalPropertyTypes',
    body: 'Tooling DX: ESLint 9 + Prettier + Husky pre-commit, webhook de Stripe con discriminant guards type-safe.',
  },
  {
    date: '27 de abril de 2026',
    version: '—',
    category: 'feature',
    title: 'AI booking extractor v1',
    body: 'Extracción estructurada de intent, servicio, fecha/hora y urgencia desde conversaciones de WhatsApp. Eval set determinístico.',
  },
  {
    date: '24 de abril de 2026',
    version: '—',
    category: 'feature',
    title: 'Backend MVP scaffolding',
    body: 'Setup inicial Next 15 + Supabase con RLS, auth multi-tenant, webhooks de Stripe y WhatsApp con verificación de firma.',
  },
];

const CATEGORY_BADGE = {
  feature: { label: 'Nuevo', class: 'badge' },
  improvement: { label: 'Mejora', class: 'badge-warm' },
  fix: { label: 'Fix', class: 'badge-success' },
  security: { label: 'Seguridad', class: 'badge-danger' },
} as const;

export default async function ChangelogPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Changelog', url: '/changelog' },
        ])}
      />
      <JsonLd
        data={buildWebPageSchema({
          type: 'CollectionPage',
          name: 'Changelog · Ambrogio.ai',
          description: 'Actualizaciones, nuevas funciones y fixes de Ambrogio.ai.',
          url: '/changelog',
        })}
      />
      <JsonLd
        data={buildEventSchema({
          name: 'Lanzamiento beta privada Ambrogio.ai',
          description:
            'Ambrogio.ai entra en beta privada con el primer cliente piloto. Incluye: WhatsApp + voice + Google Calendar + Stripe billing + facturación electrónica.',
          startDate: '2026-05-08',
          url: '/changelog',
          eventStatus: 'EventScheduled',
          eventAttendanceMode: 'OnlineEventAttendanceMode',
        })}
      />
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container-narrow">
            <div className="stack stack-4" style={{ marginBottom: 'var(--space-12)' }}>
              <span className="eyebrow">Changelog</span>
              <h1 className="display text-balance">Qué cambió</h1>
              <p className="lead text-pretty">
                Actualizaciones, mejoras y correcciones. Actualizado en tiempo real por el equipo
                técnico.
              </p>
            </div>

            <ol style={{ listStyle: 'none', padding: 0 }} className="stack stack-8">
              {ENTRIES.map((entry) => {
                const badge = CATEGORY_BADGE[entry.category];
                return (
                  <li
                    key={`${entry.date}-${entry.title}`}
                    style={{
                      borderLeft: '2px solid var(--color-border)',
                      paddingLeft: 'var(--space-6)',
                      position: 'relative',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '-8px',
                        top: '6px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'var(--color-accent)',
                        border: '3px solid var(--color-bg)',
                      }}
                    />
                    <div
                      className="row"
                      style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}
                    >
                      <span className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
                        {entry.date}
                      </span>
                      {entry.version !== '—' ? (
                        <span className="badge badge-neutral">{entry.version}</span>
                      ) : null}
                      <span className={`badge ${badge.class}`}>{badge.label}</span>
                    </div>
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
                      {entry.title}
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{entry.body}</p>
                  </li>
                );
              })}
            </ol>

            <div
              className="card text-center"
              style={{
                marginTop: 'var(--space-12)',
                background: 'var(--color-accent-soft)',
                borderColor: 'oklch(85% 0.05 175)',
              }}
            >
              <p style={{ fontSize: 'var(--text-sm)' }}>
                <strong>Suscríbete al feed RSS</strong> para recibir actualizaciones automáticas:{' '}
                <a href="/changelog/feed.xml" className="btn-link">
                  /changelog/feed.xml
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
