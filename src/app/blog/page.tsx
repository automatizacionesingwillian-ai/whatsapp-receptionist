import type { Metadata } from 'next';
import Link from 'next/link';

import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  JsonLd,
} from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Blog · Recepción AI que de verdad funciona',
  description:
    'Casos de estudio, guías técnicas y opiniones. Sin fluff de marketing: solo lo útil para quien gestiona un negocio en LATAM.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog · Ambrogio.ai',
    description: 'Casos de estudio, guías técnicas y opiniones. Solo lo útil.',
    url: '/blog',
    type: 'website',
    locale: 'es_419',
  },
};

const POSTS = [
  {
    slug: 'whatsapp-business-vs-360dialog-quando-conviene',
    title: 'WhatsApp Cloud API vs 360dialog: cuándo conviene cada uno',
    excerpt:
      'Comparativa técnica y económica entre la API oficial de Meta y los BSP más usados en LATAM.',
    date: '2 de mayo de 2026',
    readTime: '8 min',
    category: 'Guía',
  },
  {
    slug: 'gdpr-receptionist-ai-dpa-template',
    title: 'GDPR y recepción AI: el DPA que realmente necesitas',
    excerpt: 'Qué debe incluir un DPA para ser útil en una auditoría. Plantilla descargable.',
    date: '28 de abril de 2026',
    readTime: '12 min',
    category: 'GDPR',
  },
] as const;

export default async function BlogPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ])}
      />
      <JsonLd
        data={buildCollectionPageSchema({
          name: 'Blog Ambrogio.ai',
          description:
            'Casos de estudio, guías técnicas y opiniones del mundo de la recepción AI en LATAM.',
          url: '/blog',
          hasPart: POSTS.map((p) => ({ name: p.title, url: `/blog/${p.slug}` })),
        })}
      />
      <SiteHeader />
      <main id="main">
        <section className="section">
          <div className="container">
            <div
              className="stack stack-4"
              style={{ maxWidth: '720px', marginBottom: 'var(--space-12)' }}
            >
              <span className="badge">Blog</span>
              <h1 className="display text-balance">
                Historias de estudios que dejaron de perder llamadas.
              </h1>
              <p className="lead text-pretty">
                Casos de estudio, guías técnicas y opiniones. Sin fluff de marketing: solo lo útil
                para quien gestiona de verdad un negocio.
              </p>
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
            >
              {POSTS.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="card card-padded card-interactive stack stack-4"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="row" style={{ gap: 'var(--space-3)' }}>
                    <span className="badge badge-neutral">{post.category}</span>
                    <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {post.date} · {post.readTime}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 'var(--text-xl)' }}>{post.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{post.excerpt}</p>
                  <span
                    className="row"
                    style={{
                      gap: 'var(--space-2)',
                      color: 'var(--color-accent)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      marginTop: 'auto',
                    }}
                  >
                    Leer artículo <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
