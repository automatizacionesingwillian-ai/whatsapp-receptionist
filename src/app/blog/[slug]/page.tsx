import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buildArticleSchema, buildBreadcrumbSchema, JsonLd } from '@/components/marketing/JsonLd';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

interface Post {
  slug: string;
  title: string;
  /** SEO meta title — puede ser más conciso que el H1 para caber en <60 char tras el template. */
  seoTitle?: string;
  excerpt: string;
  body: string;
  date: string;
  isoDate: string;
  readTime: string;
  category: string;
  relatedVerticalSlug: string | null;
  relatedVerticalLabel: string | null;
  relatedPostSlugs: ReadonlyArray<string>;
}

const POSTS: Record<string, Post> = {
  'whatsapp-business-vs-360dialog-quando-conviene': {
    slug: 'whatsapp-business-vs-360dialog-quando-conviene',
    title: 'WhatsApp Cloud API vs 360dialog: cuándo conviene cada uno',
    seoTitle: 'WhatsApp Cloud API vs 360dialog · Comparativa',
    excerpt:
      'Comparativa técnica y económica entre la API oficial de Meta y los BSP más usados en LATAM.',
    body: `Cuando integras WhatsApp Business para un SaaS B2B en Latinoamérica, las opciones son dos: Meta WhatsApp Cloud API de forma directa, o pasar por un BSP (Business Solution Provider) como 360dialog.\n\nMeta Cloud API: económico, control total, soporte solo vía documentación. Ideal si tienes un equipo técnico.\n\n360dialog: precio más alto, onboarding asistido, soporte operativo y facturación vía BSP. Ideal para agencias que gestionan muchos clientes.\n\nEl punto de equilibrio económico está alrededor de 50.000 mensajes/mes. Por debajo, suele convenir 360dialog. Por encima, conviene Cloud API directo.`,
    date: '2 de mayo de 2026',
    isoDate: '2026-05-02',
    readTime: '8 min',
    category: 'Guía',
    relatedVerticalSlug: null,
    relatedVerticalLabel: null,
    relatedPostSlugs: ['gdpr-receptionist-ai-dpa-template'],
  },
  'gdpr-receptionist-ai-dpa-template': {
    slug: 'gdpr-receptionist-ai-dpa-template',
    title: 'GDPR y recepción AI: el DPA que realmente necesitas',
    seoTitle: 'GDPR y DPA para AI Receptionist',
    excerpt: 'Qué debe incluir un DPA para ser útil en una auditoría. Plantilla descargable.',
    body: `El Data Processing Agreement (DPA) es obligatorio cuando un proveedor de servicios trata datos personales por cuenta del responsable. Para una recepción AI es especialmente sensible porque se procesan conversaciones completas, notas de voz y, potencialmente, datos de salud.\n\nUn DPA sólido debe especificar: categorías de datos, finalidades, duración, subencargados, medidas técnicas, procedimiento ante brechas y derechos de los interesados.\n\nAmbrogio.ai ofrece un DPA precompilado con: hosting en la UE (Supabase Frankfurt), retención 24 meses, audit log inmutable, endpoints Art. 15/17 self-service y subencargados declarados públicamente.`,
    date: '28 de abril de 2026',
    isoDate: '2026-04-28',
    readTime: '12 min',
    category: 'GDPR',
    relatedVerticalSlug: 'professional',
    relatedVerticalLabel: 'Ambrogio para estudios profesionales',
    relatedPostSlugs: ['whatsapp-business-vs-360dialog-quando-conviene'],
  },
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) {
    return {
      title: 'Artículo no encontrado',
      robots: { index: false, follow: false },
    };
  }
  return {
    title: post.seoTitle ?? post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.isoDate,
      url: `/blog/${post.slug}`,
      locale: 'es_419',
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) {
    notFound();
  }

  const articleSchema = buildArticleSchema({
    headline: post.title,
    description: post.excerpt,
    datePublished: post.isoDate,
    url: `/blog/${post.slug}`,
    category: post.category,
  });

  const relatedPosts = post.relatedPostSlugs
    .map((relSlug) => POSTS[relSlug])
    .filter((p): p is Post => p !== undefined);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <article className="section">
          <div className="container-narrow stack stack-6">
            <div className="stack stack-3">
              <Link href="/blog" className="btn-link" style={{ fontSize: 'var(--text-sm)' }}>
                ← Todos los artículos
              </Link>
              <span className="badge badge-neutral">{post.category}</span>
              <h1 className="text-balance">{post.title}</h1>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                {post.date} · {post.readTime} de lectura
              </p>
            </div>
            <hr className="divider" />
            <div
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {post.body}
            </div>
            <hr className="divider" />

            {post.relatedVerticalSlug !== null && post.relatedVerticalLabel !== null && (
              <div
                className="card stack stack-3"
                style={{ background: 'var(--color-surface-sunken)' }}
              >
                <span className="eyebrow">Vertical relacionado</span>
                <Link
                  href={`/verticali/${post.relatedVerticalSlug}`}
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {post.relatedVerticalLabel} →
                </Link>
              </div>
            )}

            {relatedPosts.length > 0 && (
              <section className="stack stack-4" aria-labelledby="related-posts-heading">
                <h2 id="related-posts-heading" style={{ fontSize: 'var(--text-xl)' }}>
                  Sigue leyendo
                </h2>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
                >
                  {relatedPosts.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/blog/${rel.slug}`}
                      className="card card-interactive stack stack-3"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <span className="badge badge-neutral">{rel.category}</span>
                      <h3 style={{ fontSize: 'var(--text-base)' }}>{rel.title}</h3>
                      <span
                        style={{
                          color: 'var(--color-accent)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          marginTop: 'auto',
                        }}
                      >
                        Leer →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="card stack stack-3" style={{ background: 'var(--color-accent-soft)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)' }}>
                ¿Quieres los resultados de{' '}
                {post.category.toLowerCase() === 'case study' ? 'este estudio' : 'esta guía'}?
              </h3>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                Empieza la prueba de 14 días gratis. Setup en 24 h.
              </p>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                Empieza gratis →
              </Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
