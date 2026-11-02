import { describe, expect, it } from 'vitest';

import { AppError } from '@/lib/errors/app-error';
import {
  MetaCloudWhatsAppTemplateClient,
  WhatsAppTemplateSyncService,
  extractTemplateItems,
  normalizeTemplate,
  type SyncedWhatsAppTemplate,
  type WhatsAppTemplateListClient,
  type WhatsAppTemplateSyncRepository,
} from '@/server/whatsapp/template-sync';

const now = new Date('2026-04-25T10:00:00.000Z');
const API_URL = 'https://graph.facebook.com/v21.0';
const WABA_ID = 'waba_123';

describe('MetaCloudWhatsAppTemplateClient', () => {
  it('fetches templates from the Meta Cloud message_templates endpoint', async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const client = new MetaCloudWhatsAppTemplateClient({
      apiUrl: API_URL,
      accessToken: 'test_access_token',
      wabaId: WABA_ID,
      fetcher: async (url, init) => {
        requests.push({ url: url.toString(), init: init ?? {} });

        return Response.json({ data: [] });
      },
    });

    await expect(client.listTemplates()).resolves.toEqual({ data: [] });
    expect(requests[0]?.url).toBe(`${API_URL}/${WABA_ID}/message_templates?limit=1000`);
    expect(requests[0]?.init.headers).toMatchObject({
      Authorization: 'Bearer test_access_token',
    });
  });

  it('raises upstream errors when template fetch fails', async () => {
    const client = new MetaCloudWhatsAppTemplateClient({
      apiUrl: API_URL,
      accessToken: 'test_access_token',
      wabaId: WABA_ID,
      fetcher: async () => Response.json({ error: { message: 'Down' } }, { status: 503 }),
    });

    await expect(client.listTemplates()).rejects.toBeInstanceOf(AppError);
  });
});

describe('WhatsAppTemplateSyncService', () => {
  it('normalizes and upserts provider templates for a tenant', async () => {
    const client = new FakeTemplateListClient({
      data: [
        {
          id: '123',
          name: 'appointment_reminder_24h',
          language: 'es',
          category: 'UTILITY',
          status: 'APPROVED',
          quality_rating: 'GREEN',
          components: [{ type: 'BODY', text: 'Hola {{1}}' }],
        },
        {
          id: '124',
          name: 'promo',
          language_code: 'es',
          category: 'MARKETING',
          status: 'PAUSED',
        },
        {
          id: '125',
          name: 'invalid_category',
          language: 'es',
          category: 'UNKNOWN',
          status: 'APPROVED',
        },
      ],
    });
    const repository = new FakeTemplateSyncRepository();
    const service = new WhatsAppTemplateSyncService(client, repository);

    const result = await service.syncTenantTemplates({
      tenantId: 'tenant_1',
      now,
    });

    expect(result).toEqual({
      fetchedTemplates: 3,
      syncedTemplates: 2,
      skippedTemplates: 1,
    });
    expect(repository.upserts[0]).toMatchObject({
      tenantId: 'tenant_1',
      syncedAt: now,
      templates: [
        {
          externalId: '123',
          name: 'appointment_reminder_24h',
          languageCode: 'es',
          category: 'utility',
          status: 'approved',
          qualityRating: 'GREEN',
          components: [{ type: 'BODY', text: 'Hola {{1}}' }],
        },
        {
          externalId: '124',
          name: 'promo',
          languageCode: 'es',
          category: 'marketing',
          status: 'paused',
        },
      ],
    });
  });
});

describe('template normalization helpers', () => {
  it('extracts arrays from common provider response shapes', () => {
    expect(extractTemplateItems([{ name: 'direct' }])).toEqual([{ name: 'direct' }]);
    expect(extractTemplateItems({ business_templates: [{ name: 'nested' }] })).toEqual([
      { name: 'nested' },
    ]);
    expect(extractTemplateItems({ data: 'not-array' })).toEqual([]);
  });

  it('maps active provider statuses to approved registry status', () => {
    expect(
      normalizeTemplate({
        name: 'appointment_confirmation',
        language: 'es',
        category: 'UTILITY',
        status: 'Active - High Quality',
      }),
    ).toMatchObject({
      status: 'approved',
      category: 'utility',
    });
  });
});

class FakeTemplateListClient implements WhatsAppTemplateListClient {
  constructor(private readonly response: unknown) {}

  async listTemplates(): Promise<unknown> {
    return this.response;
  }
}

class FakeTemplateSyncRepository implements WhatsAppTemplateSyncRepository {
  readonly upserts: Array<{
    tenantId: string;
    templates: SyncedWhatsAppTemplate[];
    syncedAt: Date;
  }> = [];

  async upsertTemplates(input: {
    tenantId: string;
    templates: SyncedWhatsAppTemplate[];
    syncedAt: Date;
  }): Promise<void> {
    this.upserts.push(input);
  }
}
