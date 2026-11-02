import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { OperatorReplyForm } from '@/components/dashboard/OperatorReplyForm';
import { requireSession, type AuthSession } from '@/lib/auth/session';
import { AppError } from '@/lib/errors/app-error';
import {
  createConversationInboxService,
  type ConversationChannel,
  type ConversationDetail,
  type ConversationMessage,
  type ConversationStatus,
} from '@/server/conversations/inbox';
import { CUSTOMER_SERVICE_WINDOW_MS } from '@/server/conversations/operator-messages';
import { createWhatsAppOptOutService } from '@/server/whatsapp/opt-outs';

export const metadata: Metadata = {
  title: 'Conversación · Ambrogio.ai',
};

// `listMessages` accetta al massimo 200 messaggi per conversazione.
const MESSAGE_LIMIT = 200;

const STATUS_LABELS: Record<ConversationStatus, { label: string; badge: string }> = {
  active: { label: 'Activa', badge: 'badge' },
  escalated: { label: 'Escalada', badge: 'badge badge-danger' },
  closed: { label: 'Cerrada', badge: 'badge badge-neutral' },
  spam: { label: 'Spam', badge: 'badge badge-warm' },
};

const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  whatsapp: 'WhatsApp',
  instagram_dm: 'Instagram DM',
  web_chat: 'Chat web',
  sms: 'SMS',
};

const SENDER_STYLES: Record<
  ConversationMessage['senderType'],
  { label: string; align: 'flex-start' | 'flex-end' | 'center'; background: string; border: string }
> = {
  customer: {
    label: 'Cliente',
    align: 'flex-start',
    background: 'var(--color-surface-sunken)',
    border: '1px solid var(--color-border)',
  },
  ai: {
    label: 'Ambrogio AI',
    align: 'flex-end',
    background: 'var(--color-accent-soft)',
    border: '1px solid var(--color-accent-soft)',
  },
  human: {
    label: 'Operador',
    align: 'flex-end',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-accent)',
  },
  system: {
    label: 'Sistema',
    align: 'center',
    background: 'transparent',
    border: '1px dashed var(--color-border)',
  },
};

const DELIVERY_LABELS: Record<ConversationMessage['status'], string | null> = {
  received: null,
  pending: 'en cola',
  sent: 'enviado',
  delivered: 'entregado',
  read: 'leído',
  failed: 'envío fallido',
};

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  // Fuori dal try/catch: una sessione mancante deve propagare al guard.
  const session = await requireSession();
  const { conversationId } = await params;

  let detail: ConversationDetail | null = null;
  let failed = false;

  try {
    detail = await createConversationInboxService().getConversation({
      session,
      conversationId,
      messageLimit: MESSAGE_LIMIT,
    });
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === 'not_found') {
      notFound();
    }

    failed = true;
  }

  if (failed || detail === null) {
    return (
      <>
        <BackLink />
        <div className="card card-padded stack stack-3" role="alert">
          <h1 style={{ fontSize: 'var(--text-xl)' }}>No podemos abrir la conversación</h1>
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            El servicio no respondió. Recarga la página: si el problema continúa, revisa el estado
            del sistema.
          </p>
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <Link href={`/conversations/${conversationId}`} className="btn btn-secondary btn-sm">
              Reintentar
            </Link>
            <Link href="/status" className="btn btn-ghost btn-sm">
              Estado del servicio
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { conversation, messages } = detail;
  const statusConfig = STATUS_LABELS[conversation.status];
  const isAdmin = session.role === 'owner' || session.role === 'admin';

  // Stesso calcolo del servizio di invio: finestra 24h dall'ultimo messaggio.
  const windowExpiresAt = Date.parse(conversation.lastMessageAt) + CUSTOMER_SERVICE_WINDOW_MS;
  const isWindowKnown = Number.isFinite(windowExpiresAt);
  const isWindowOpen = isWindowKnown && windowExpiresAt > Date.now();

  const optedOut =
    isAdmin && conversation.channel === 'whatsapp'
      ? await readOptOut(session, conversation.customerIdentifier)
      : null;

  const disabledReason = resolveDisabledReason({
    isAdmin,
    channel: conversation.channel,
    optedOut,
    isWindowOpen,
  });

  return (
    <>
      <BackLink />

      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">Conversación</span>
          <h1>{conversation.customerName ?? conversation.customerIdentifier}</h1>
          <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span className="badge badge-neutral">{CHANNEL_LABELS[conversation.channel]}</span>
            <span className={statusConfig.badge}>{statusConfig.label}</span>
            {conversation.aiEnabled ? (
              <span className="badge">IA activa</span>
            ) : (
              <span className="badge badge-warm">Solo operador</span>
            )}
            {optedOut === true ? (
              <span className="badge badge-danger">Consenso revocato</span>
            ) : null}
          </div>
          <p className="muted mono" style={{ fontSize: 'var(--text-xs)' }}>
            {conversation.customerIdentifier}
          </p>
        </div>

        <div className="stack stack-2" style={{ textAlign: 'right' }}>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Último mensaje
          </span>
          <time dateTime={conversation.lastMessageAt} style={{ fontWeight: 600 }}>
            {formatDateTime(conversation.lastMessageAt)}
          </time>
        </div>
      </div>

      {conversation.channel === 'whatsapp' ? (
        <div
          className="card card-padded stack stack-2"
          style={{
            marginBottom: 'var(--space-6)',
            background: isWindowOpen ? 'var(--color-success-soft)' : 'var(--color-warning-soft)',
            borderColor: isWindowOpen ? 'var(--color-success)' : 'var(--color-warning)',
          }}
        >
          <span className="eyebrow">Ventana de servicio de WhatsApp</span>
          {isWindowKnown ? (
            <p style={{ fontSize: 'var(--text-sm)' }}>
              {isWindowOpen ? (
                <>
                  Abierta hasta el{' '}
                  <strong>{formatDateTime(new Date(windowExpiresAt).toISOString())}</strong>. Hasta
                  entonces puedes escribir un mensaje libre.
                </>
              ) : (
                <>
                  Cerrada desde el{' '}
                  <strong>{formatDateTime(new Date(windowExpiresAt).toISOString())}</strong>. Fuera
                  de las 24 horas WhatsApp solo permite plantillas aprobadas, aún no compatibles:
                  podrás responder cuando el cliente escriba de nuevo.
                </>
              )}
            </p>
          ) : (
            <p style={{ fontSize: 'var(--text-sm)' }}>Vencimiento de la ventana no disponible.</p>
          )}
          {optedOut === true ? (
            <p style={{ fontSize: 'var(--text-sm)' }}>
              El cliente revocó el consentimiento: no se le puede enviar ningún mensaje hasta que lo
              restablezca escribiendo de nuevo.
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="card card-padded stack stack-4" aria-label="Historial de mensajes">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Ningún mensaje en el archivo</p>
            <p className="empty-state-text">
              La conversación existe pero aún no tiene mensajes guardados. Si el cliente acaba de
              escribir, recarga en unos instantes.
            </p>
          </div>
        ) : (
          <ol className="stack stack-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ol>
        )}

        {messages.length === MESSAGE_LIMIT ? (
          <p className="helper">
            Mostramos los primeros {MESSAGE_LIMIT} mensajes de la conversación.
          </p>
        ) : null}
      </section>

      <section
        className="stack stack-3"
        style={{ marginTop: 'var(--space-6)' }}
        aria-label="Respuesta del operador"
      >
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Responder como operador</h2>
        <OperatorReplyForm conversationId={conversation.id} disabledReason={disabledReason} />
      </section>
    </>
  );
}

function BackLink() {
  return (
    <p style={{ marginBottom: 'var(--space-4)' }}>
      <Link href="/conversations" className="btn-link">
        ← Volver al inbox
      </Link>
    </p>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const sender = SENDER_STYLES[message.senderType];
  const deliveryLabel = message.direction === 'outbound' ? DELIVERY_LABELS[message.status] : null;
  const body = readBody(message);

  return (
    <li style={{ display: 'flex', flexDirection: 'column', alignItems: sender.align }}>
      <div
        className="stack stack-2"
        style={{
          maxWidth: '68ch',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: sender.background,
          border: sender.border,
        }}
      >
        <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
            }}
          >
            {sender.label}
          </span>
          <time
            dateTime={message.createdAt}
            className="muted"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {formatDateTime(message.createdAt)}
          </time>
          {deliveryLabel !== null ? (
            <span
              className="muted"
              style={{
                fontSize: 'var(--text-xs)',
                color: message.status === 'failed' ? 'var(--color-danger)' : undefined,
              }}
            >
              · {deliveryLabel}
            </span>
          ) : null}
          {message.intent !== null ? (
            <span className="badge badge-neutral mono">{message.intent}</span>
          ) : null}
        </div>

        {body.label !== null ? (
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {body.label}
          </span>
        ) : null}

        {body.text !== null ? (
          <p style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>{body.text}</p>
        ) : (
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Contenido de texto no disponible.
          </p>
        )}

        {message.mediaUrls.length > 0 ? (
          <ul
            className="row"
            style={{ gap: 'var(--space-3)', flexWrap: 'wrap', listStyle: 'none', padding: 0 }}
          >
            {message.mediaUrls.map((url, index) => (
              <li key={`${url}-${index}`}>
                <a
                  href={url}
                  className="btn-link"
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  Adjunto {index + 1}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function readBody(message: ConversationMessage): { text: string | null; label: string | null } {
  if (message.content !== null && message.content.trim().length > 0) {
    return { text: message.content, label: null };
  }

  if (message.transcriptText !== null && message.transcriptText.trim().length > 0) {
    return {
      text: message.transcriptText,
      label: formatVoiceLabel(message),
    };
  }

  if (message.messageType !== 'text') {
    return { text: null, label: `Mensaje de tipo ${message.messageType}` };
  }

  return { text: null, label: null };
}

function formatVoiceLabel(message: ConversationMessage): string {
  const duration =
    message.audioDurationSecs !== null && message.audioDurationSecs > 0
      ? ` · ${Math.round(message.audioDurationSecs)}s`
      : '';

  return `Transcripción de voz${duration}`;
}

function resolveDisabledReason(input: {
  isAdmin: boolean;
  channel: ConversationChannel;
  optedOut: boolean | null;
  isWindowOpen: boolean;
}): string | null {
  if (!input.isAdmin) {
    return 'Solo los perfiles owner y admin pueden enviar mensajes manuales.';
  }

  if (input.channel !== 'whatsapp') {
    return 'El envío manual solo está disponible en conversaciones de WhatsApp.';
  }

  if (input.optedOut === true) {
    return 'El cliente revocó el consentimiento: no es posible enviarle mensajes.';
  }

  if (!input.isWindowOpen) {
    return 'La ventana de servicio de 24 horas está cerrada. Podrás responder después de un nuevo mensaje del cliente.';
  }

  return null;
}

async function readOptOut(
  session: AuthSession,
  customerIdentifier: string,
): Promise<boolean | null> {
  // Lo stato opt-out è un contorno: se il servizio non risponde o l'identifier
  // non è un numero valido, la pagina resta leggibile e l'invio viene comunque
  // rivalidato lato server.
  try {
    const status = await createWhatsAppOptOutService().getStatus({ session, customerIdentifier });

    return status.optedOut;
  } catch {
    return null;
  }
}

function formatDateTime(iso: string): string {
  const timestamp = Date.parse(iso);

  if (Number.isNaN(timestamp)) {
    return 'fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-419', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  }).format(new Date(timestamp));
}
