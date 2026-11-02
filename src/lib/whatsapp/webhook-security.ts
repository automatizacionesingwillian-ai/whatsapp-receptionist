import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { AppError } from '@/lib/errors/app-error';
import { env } from '@/lib/env';
import type { WhatsAppProvider } from '@/server/whatsapp/webhook-events';

/**
 * Verifica la firma de un webhook de Meta Cloud API (`X-Hub-Signature-256`).
 *
 * Si no hay App Secret configurado, acepta el header custom de desarrollo
 * (`WHATSAPP_WEBHOOK_HEADER_*`) para pruebas locales sin Meta.
 */
export function assertWhatsAppWebhookAuthenticity(input: {
  rawBody: string;
  headers: Headers;
}): void {
  const signatureHeader = input.headers.get('x-hub-signature-256');
  const appSecret = env.WHATSAPP_APP_SECRET.trim();

  if (appSecret) {
    if (!signatureHeader) {
      throw new AppError('webhook_rejected', 'Missing Meta webhook signature');
    }

    assertMetaSignature(input.rawBody, signatureHeader, appSecret);
    return;
  }

  // Fallback solo para entornos sin App Secret (tests / local sin Meta).
  if (env.WHATSAPP_WEBHOOK_HEADER_SECRET.trim()) {
    assertWhatsAppWebhookSecret(input.headers);
    return;
  }

  throw new AppError('internal', 'WhatsApp webhook authenticity is not configured', {
    expose: false,
  });
}

/** @deprecated Prefer `assertWhatsAppWebhookAuthenticity` with Meta signature. */
export function assertWhatsAppWebhookSecret(headers: Headers): void {
  const headerName = env.WHATSAPP_WEBHOOK_HEADER_NAME.toLowerCase();
  const expectedSecret = env.WHATSAPP_WEBHOOK_HEADER_SECRET;

  if (!expectedSecret) {
    throw new AppError('internal', 'WhatsApp webhook secret is not configured', {
      expose: false,
    });
  }

  const receivedSecret = headers.get(headerName);

  if (!receivedSecret || !safeEqual(receivedSecret, expectedSecret)) {
    throw new AppError('webhook_rejected', 'Webhook secret mismatch');
  }
}

export function createWebhookIdempotencyKey(input: {
  provider: WhatsAppProvider | 'stripe';
  externalId: string;
}): string {
  return createHash('sha256').update(`${input.provider}:${input.externalId}`).digest('hex');
}

function assertMetaSignature(rawBody: string, signatureHeader: string, appSecret: string): void {
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`;

  if (!safeEqual(expected, signatureHeader.trim())) {
    throw new AppError('webhook_rejected', 'Meta webhook signature mismatch');
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
