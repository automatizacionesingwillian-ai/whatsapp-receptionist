import { createHmac } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '@/lib/errors/app-error';
import { env } from '@/lib/env';
import {
  assertWhatsAppWebhookAuthenticity,
  createWebhookIdempotencyKey,
} from '@/lib/whatsapp/webhook-security';

describe('createWebhookIdempotencyKey', () => {
  it('creates stable provider-scoped keys', () => {
    const first = createWebhookIdempotencyKey({
      provider: 'whatsapp_cloud',
      externalId: 'wamid.demo',
    });
    const second = createWebhookIdempotencyKey({
      provider: 'whatsapp_cloud',
      externalId: 'wamid.demo',
    });

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});

describe('assertWhatsAppWebhookAuthenticity', () => {
  const originalAppSecret = env.WHATSAPP_APP_SECRET;
  const originalHeaderSecret = env.WHATSAPP_WEBHOOK_HEADER_SECRET;
  const originalHeaderName = env.WHATSAPP_WEBHOOK_HEADER_NAME;

  afterEach(() => {
    env.WHATSAPP_APP_SECRET = originalAppSecret;
    env.WHATSAPP_WEBHOOK_HEADER_SECRET = originalHeaderSecret;
    env.WHATSAPP_WEBHOOK_HEADER_NAME = originalHeaderName;
  });

  it('accepts a valid Meta X-Hub-Signature-256 when App Secret is set', () => {
    env.WHATSAPP_APP_SECRET = 'meta_app_secret';
    const rawBody = '{"object":"whatsapp_business_account"}';
    const digest = createHmac('sha256', 'meta_app_secret').update(rawBody, 'utf8').digest('hex');

    expect(() =>
      assertWhatsAppWebhookAuthenticity({
        rawBody,
        headers: new Headers({ 'x-hub-signature-256': `sha256=${digest}` }),
      }),
    ).not.toThrow();
  });

  it('rejects a missing Meta signature when App Secret is set', () => {
    env.WHATSAPP_APP_SECRET = 'meta_app_secret';

    expect(() =>
      assertWhatsAppWebhookAuthenticity({
        rawBody: '{}',
        headers: new Headers(),
      }),
    ).toThrow(AppError);
  });

  it('rejects an invalid Meta signature', () => {
    env.WHATSAPP_APP_SECRET = 'meta_app_secret';

    try {
      assertWhatsAppWebhookAuthenticity({
        rawBody: '{"object":"whatsapp_business_account"}',
        headers: new Headers({ 'x-hub-signature-256': 'sha256=deadbeef' }),
      });
      expect.unreachable('expected signature mismatch');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        code: 'webhook_rejected',
        message: 'Meta webhook signature mismatch',
      });
    }
  });

  it('falls back to the legacy custom header when App Secret is unset', () => {
    env.WHATSAPP_APP_SECRET = '';
    env.WHATSAPP_WEBHOOK_HEADER_SECRET = 'dev_webhook_secret';
    env.WHATSAPP_WEBHOOK_HEADER_NAME = 'x-ambrogio-webhook-secret';

    expect(() =>
      assertWhatsAppWebhookAuthenticity({
        rawBody: '{}',
        headers: new Headers({ 'x-ambrogio-webhook-secret': 'dev_webhook_secret' }),
      }),
    ).not.toThrow();
  });

  it('rejects a mismatched legacy custom header', () => {
    env.WHATSAPP_APP_SECRET = '';
    env.WHATSAPP_WEBHOOK_HEADER_SECRET = 'dev_webhook_secret';
    env.WHATSAPP_WEBHOOK_HEADER_NAME = 'x-ambrogio-webhook-secret';

    try {
      assertWhatsAppWebhookAuthenticity({
        rawBody: '{}',
        headers: new Headers({ 'x-ambrogio-webhook-secret': 'wrong' }),
      });
      expect.unreachable('expected secret mismatch');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        code: 'webhook_rejected',
        message: 'Webhook secret mismatch',
      });
    }
  });
});
