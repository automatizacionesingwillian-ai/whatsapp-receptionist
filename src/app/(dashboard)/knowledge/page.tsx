import type { Metadata } from 'next';

import {
  KnowledgeDocumentArchiveButton,
  KnowledgeDocumentForm,
} from '@/components/dashboard/KnowledgeDocumentForm';
import { requireSession } from '@/lib/auth/session';
import { AppError } from '@/lib/errors/app-error';
import {
  createKnowledgeBaseDocumentService,
  type KnowledgeBaseDocument,
} from '@/server/knowledge-base/documents';

export const metadata: Metadata = {
  title: 'Base de conocimiento · Ambrogio.ai',
};

const DOCUMENT_LIMIT = 100;
const EXCERPT_LENGTH = 240;

/** Solo owner e admin possono scrivere: il servizio rifiuta gli altri ruoli. */
const EDITOR_ROLES = new Set(['owner', 'admin']);

type LoadResult =
  | {
      readonly ok: true;
      readonly documents: readonly KnowledgeBaseDocument[];
      readonly canEdit: boolean;
    }
  | { readonly ok: false; readonly message: string };

async function loadKnowledgeBase(): Promise<LoadResult> {
  try {
    const session = await requireSession();
    const service = createKnowledgeBaseDocumentService();
    const documents = await service.listDocuments({
      session,
      filters: { limit: DOCUMENT_LIMIT },
    });

    return { ok: true, documents, canEdit: EDITOR_ROLES.has(session.role) };
  } catch (error: unknown) {
    // I messaggi non `expose` (503, errori Supabase) non sono mostrabili:
    // servirebbe solo a esporre dettagli interni senza aiutare chi legge.
    const message =
      error instanceof AppError && error.expose
        ? error.message
        : 'No fue posible cargar la base de conocimiento. Recarga la página; si el problema continúa, el servicio de datos no está disponible.';

    return { ok: false, message };
  }
}

export default async function KnowledgePage() {
  const result = await loadKnowledgeBase();

  return (
    <>
      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">Base de conocimiento</span>
          <h1>Lo que el asistente sabe de tu negocio</h1>
          <p className="muted" style={{ maxWidth: '60ch' }}>
            Cada documento se indexa y se recupera cuando un cliente hace una pregunta pertinente.
            Sin documentos, el asistente responde solo de forma genérica.
          </p>
        </div>
      </div>

      {result.ok ? (
        <KnowledgeBaseContent documents={result.documents} canEdit={result.canEdit} />
      ) : (
        <div className="card card-padded" role="alert">
          <div className="stack stack-2">
            <p style={{ fontWeight: 600 }}>Base de conocimiento no disponible</p>
            <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              {result.message}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function KnowledgeBaseContent({
  documents,
  canEdit,
}: Readonly<{ documents: readonly KnowledgeBaseDocument[]; canEdit: boolean }>) {
  const activeCount = documents.filter((doc) => doc.active).length;
  const notIndexedCount = documents.filter((doc) => doc.active && !doc.hasEmbedding).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-6)',
        alignItems: 'start',
      }}
    >
      <section className="stack stack-4" aria-labelledby="knowledge-list-heading">
        <div className="row row-between">
          <h2 id="knowledge-list-heading" style={{ fontSize: 'var(--text-lg)' }}>
            Documentos
          </h2>
          {documents.length > 0 ? (
            <span className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
              {activeCount} activos de {documents.length}
            </span>
          ) : null}
        </div>

        {notIndexedCount > 0 ? (
          <div className="card card-padded" role="status">
            <p style={{ fontSize: 'var(--text-sm)' }}>
              <strong>{notIndexedCount}</strong>{' '}
              {notIndexedCount === 1 ? 'documento activo no está' : 'documentos activos no están'}{' '}
              indexado para la búsqueda semántica. El asistente no{' '}
              {notIndexedCount === 1 ? 'lo' : 'los'} recupera hasta que la indexación se regenere.
            </p>
          </div>
        ) : null}

        {documents.length === 0 ? (
          <EmptyKnowledgeBase canEdit={canEdit} />
        ) : (
          <ul className="stack stack-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {documents.map((doc) => (
              <li key={doc.id}>
                <KnowledgeDocumentCard document={doc} canEdit={canEdit} />
              </li>
            ))}
          </ul>
        )}

        {documents.length >= DOCUMENT_LIMIT ? (
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Mostramos los {DOCUMENT_LIMIT} documentos actualizados más recientemente.
          </p>
        ) : null}
      </section>

      <section className="card card-padded stack stack-4" aria-labelledby="knowledge-form-heading">
        <div className="stack stack-2">
          <h2 id="knowledge-form-heading" style={{ fontSize: 'var(--text-lg)' }}>
            Agregar un documento
          </h2>
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Texto simple. Sin adjuntos: lo que escribes aquí es exactamente lo que el asistente
            puede citar.
          </p>
        </div>

        {canEdit ? (
          <KnowledgeDocumentForm />
        ) : (
          <p className="helper">
            Tu rol solo permite lectura. Pide a un administrador del negocio que agregue o modifique
            los documentos.
          </p>
        )}
      </section>
    </div>
  );
}

function KnowledgeDocumentCard({
  document: doc,
  canEdit,
}: Readonly<{ document: KnowledgeBaseDocument; canEdit: boolean }>) {
  return (
    <article className="card card-padded stack stack-3">
      <div className="row row-between" style={{ gap: 'var(--space-3)' }}>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{doc.title}</h3>
          {doc.category !== null ? (
            <span className="badge badge-neutral">{doc.category}</span>
          ) : null}
        </div>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          {!doc.active ? (
            <span className="badge badge-neutral">Archivado</span>
          ) : doc.hasEmbedding ? (
            <span className="badge badge-success">Indexado</span>
          ) : (
            <span className="badge badge-warm">No indexado</span>
          )}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>
        {toExcerpt(doc.content)}
      </p>

      <div className="row row-between" style={{ gap: 'var(--space-3)' }}>
        <span className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
          Actualizado el {formatDate(doc.updatedAt)}
        </span>
        {canEdit ? (
          <KnowledgeDocumentArchiveButton
            documentId={doc.id}
            title={doc.title}
            active={doc.active}
          />
        ) : null}
      </div>
    </article>
  );
}

function EmptyKnowledgeBase({ canEdit }: Readonly<{ canEdit: boolean }>) {
  return (
    <div className="card">
      <div className="empty-state">
        <p className="empty-state-title">Ningún documento, ninguna fuente de verdad</p>
        <p className="empty-state-text">
          Mientras esta lista esté vacía, el asistente solo puede responder de forma genérica: no
          conoce tus precios, tus horarios ni tus reglas.
        </p>
        <ul
          className="stack stack-2"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 'var(--space-4) 0 0',
            textAlign: 'left',
            maxWidth: '46ch',
            fontSize: 'var(--text-sm)',
          }}
        >
          <li>
            <strong>Tarifario</strong> — servicios y precios, con posibles rangos o paquetes.
          </li>
          <li>
            <strong>Política de cancelación</strong> — con cuántas horas de antelación, penalidad y
            excepciones.
          </li>
          <li>
            <strong>Cómo llegar al negocio</strong> — dirección, piso, estacionamiento, transporte.
          </li>
          <li>
            <strong>Preguntas frecuentes</strong> — las que te hacen cada semana por teléfono.
          </li>
        </ul>
        {canEdit ? (
          <p className="helper" style={{ marginTop: 'var(--space-4)' }}>
            Empieza con el panel de al lado: un documento basta para cambiar la calidad de las
            respuestas.
          </p>
        ) : (
          <p className="helper" style={{ marginTop: 'var(--space-4)' }}>
            Pide a un administrador del negocio que cargue el primer documento.
          </p>
        )}
      </div>
    </div>
  );
}

function toExcerpt(content: string): string {
  const normalized = content.trim();

  if (normalized.length <= EXCERPT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, EXCERPT_LENGTH).trimEnd()}…`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-419', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
});

function formatDate(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'fecha no disponible';
  }

  return DATE_FORMATTER.format(parsed);
}
