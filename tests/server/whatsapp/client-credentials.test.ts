import { beforeEach, describe, expect, it } from 'vitest';

import { AppError } from '@/lib/errors/app-error';
import { encryptSecret } from '@/server/integrations/credential-encryption';
import {
  TenantWhatsAppCredentialsResolver,
  TenantWhatsAppMessageSenderResolver,
  type WhatsAppCredentialsStore,
} from '@/server/whatsapp/client';
import { WhatsAppOutboxWorker } from '@/server/whatsapp/outbox';
import type {
  ClaimedWhatsAppOutboxJob,
  WhatsAppOutboxRepository,
} from '@/server/whatsapp/outbox-repository';

const ENCRYPTION_KEY = 'test-secret-with-at-least-32-characters';
const API_URL = 'https://graph.facebook.com/v21.0';
const now = new Date('2026-04-25T08:00:00.000Z');

describe('credenziali WhatsApp per tenant', () => {
  beforeEach(() => {
    process.env.INTEGRATION_CREDENTIALS_ENCRYPTION_KEY = ENCRYPTION_KEY;
  });

  it('invia il job di ogni tenant con il token di quel tenant', async () => {
    const store = new FakeCredentialsStore({
      tenant_a: { accessToken: 'token_tenant_a', phoneNumberId: 'phone_a' },
      tenant_b: { accessToken: 'token_tenant_b', phoneNumberId: 'phone_b' },
    });
    const provider = new RecordingWhatsAppProvider();
    const repository = new FakeOutboxRepository([
      outboxJob({ id: 'job_a', tenantId: 'tenant_a', recipientIdentifier: '393330000001' }),
      outboxJob({ id: 'job_b', tenantId: 'tenant_b', recipientIdentifier: '393330000002' }),
    ]);
    const worker = new WhatsAppOutboxWorker(repository, senderResolver(store, provider));

    const result = await worker.processReadyJobs({ now });

    expect(result.sentJobs).toBe(2);
    expect(provider.requests).toEqual([
      {
        accessToken: 'token_tenant_a',
        to: '393330000001',
        url: `${API_URL}/phone_a/messages`,
      },
      {
        accessToken: 'token_tenant_b',
        to: '393330000002',
        url: `${API_URL}/phone_b/messages`,
      },
    ]);
    expect(store.tenantIds).toEqual(['tenant_a', 'tenant_b']);
  });

  it('non decifra di nuovo la credenziale per i job successivi dello stesso tenant', async () => {
    const store = new FakeCredentialsStore({
      tenant_a: { accessToken: 'token_tenant_a', phoneNumberId: 'phone_a' },
    });
    const provider = new RecordingWhatsAppProvider();
    const repository = new FakeOutboxRepository([
      outboxJob({ id: 'job_1', tenantId: 'tenant_a' }),
      outboxJob({ id: 'job_2', tenantId: 'tenant_a' }),
      outboxJob({ id: 'job_3', tenantId: 'tenant_a' }),
    ]);
    const worker = new WhatsAppOutboxWorker(repository, senderResolver(store, provider));

    const result = await worker.processReadyJobs({ now });

    expect(result.sentJobs).toBe(3);
    expect(provider.requests.map((request) => request.accessToken)).toEqual([
      'token_tenant_a',
      'token_tenant_a',
      'token_tenant_a',
    ]);
    expect(store.tenantIds).toEqual(['tenant_a']);
  });

  it('rilegge la credenziale quando la voce in cache è scaduta', async () => {
    const store = new FakeCredentialsStore({
      tenant_a: { accessToken: 'token_tenant_a', phoneNumberId: 'phone_a' },
    });
    let clock = 1_000;
    const resolver = new TenantWhatsAppCredentialsResolver(store, {
      ttlMs: 60_000,
      now: () => clock,
    });

    await resolver.resolve('tenant_a');
    clock += 59_000;
    await resolver.resolve('tenant_a');

    expect(store.tenantIds).toEqual(['tenant_a']);

    clock += 2_000;
    await resolver.resolve('tenant_a');

    expect(store.tenantIds).toEqual(['tenant_a', 'tenant_a']);
  });

  it('ricade sul token globale con un warning quando il tenant non ha integrazione', async () => {
    const store = new FakeCredentialsStore({});
    const warnings: Array<{ context: Record<string, unknown>; message: string }> = [];
    const resolver = new TenantWhatsAppCredentialsResolver(store, {
      globalAccessToken: 'legacy_global_token',
      globalPhoneNumberId: 'phone_global',
      globalWabaId: 'waba_global',
      logger: {
        warn: (context, message) => {
          warnings.push({ context, message });
        },
      },
    });

    const credentials = await resolver.resolve('tenant_senza_integrazione');

    expect(credentials).toEqual({
      accessToken: 'legacy_global_token',
      phoneNumberId: 'phone_global',
      wabaId: 'waba_global',
      source: 'global',
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.context).toMatchObject({
      tenantId: 'tenant_senza_integrazione',
      hasIntegration: false,
    });
  });

  it('non ricade sul token globale quando il tenant ha una propria credenziale', async () => {
    const store = new FakeCredentialsStore({
      tenant_a: {
        accessToken: 'token_tenant_a',
        phoneNumberId: 'phone_a',
        wabaId: 'waba_a',
      },
    });
    const warnings: string[] = [];
    const resolver = new TenantWhatsAppCredentialsResolver(store, {
      globalAccessToken: 'legacy_global_token',
      globalPhoneNumberId: 'phone_global',
      logger: {
        warn: (_context, message) => {
          warnings.push(message);
        },
      },
    });

    expect(await resolver.resolve('tenant_a')).toEqual({
      accessToken: 'token_tenant_a',
      phoneNumberId: 'phone_a',
      wabaId: 'waba_a',
      source: 'tenant',
    });
    expect(warnings).toEqual([]);
  });

  it('fallisce quando non esiste né la credenziale del tenant né quella globale', async () => {
    const resolver = new TenantWhatsAppCredentialsResolver(new FakeCredentialsStore({}), {
      globalAccessToken: '',
      globalPhoneNumberId: '',
    });

    await expect(resolver.resolve('tenant_a')).rejects.toBeInstanceOf(AppError);
  });

  it('scarta la credenziale in cache quando il provider la rifiuta', async () => {
    const store = new FakeCredentialsStore({
      tenant_a: { accessToken: 'token_tenant_a', phoneNumberId: 'phone_a' },
    });
    const resolver = new TenantWhatsAppCredentialsResolver(store);
    const senders = new TenantWhatsAppMessageSenderResolver(resolver, {
      apiUrl: API_URL,
      fetcher: async () => Response.json({ error: { message: 'Invalid token' } }, { status: 401 }),
    });

    const sender = await senders.resolveSender('tenant_a');

    await expect(sender.sendText({ to: '393330000001', body: 'Ciao' })).rejects.toBeInstanceOf(
      AppError,
    );

    await resolver.resolve('tenant_a');

    expect(store.tenantIds).toEqual(['tenant_a', 'tenant_a']);
  });
});

function senderResolver(
  store: WhatsAppCredentialsStore,
  provider: RecordingWhatsAppProvider,
): TenantWhatsAppMessageSenderResolver {
  return new TenantWhatsAppMessageSenderResolver(new TenantWhatsAppCredentialsResolver(store), {
    apiUrl: API_URL,
    fetcher: provider.fetcher,
  });
}

function outboxJob(overrides: Partial<ClaimedWhatsAppOutboxJob> = {}): ClaimedWhatsAppOutboxJob {
  return {
    id: 'job_1',
    tenantId: 'tenant_a',
    messageId: 'message_1',
    recipientIdentifier: '393331112233',
    customerServiceWindowExpiresAt: new Date('2026-04-25T08:30:00.000Z'),
    payload: {
      type: 'text',
      text: { body: 'Ciao, sono Ambrogio', previewUrl: false },
      metadata: {},
    },
    attemptCount: 1,
    maxAttempts: 5,
    ...overrides,
  };
}

type TenantIntegrationSeed = {
  accessToken: string;
  phoneNumberId: string;
  wabaId?: string;
};

/** Registra i tenantId richiesti: senza filtro per tenant il test fallisce. */
class FakeCredentialsStore implements WhatsAppCredentialsStore {
  readonly tenantIds: string[] = [];

  constructor(private readonly integrationsByTenant: Record<string, TenantIntegrationSeed>) {}

  async findActiveIntegration(tenantId: string): Promise<{
    credentials: Record<string, unknown>;
    phoneNumberId: string | null;
    wabaId: string | null;
  } | null> {
    this.tenantIds.push(tenantId);

    const integration = this.integrationsByTenant[tenantId];

    if (!integration) {
      return null;
    }

    return {
      credentials: {
        access_token_encrypted: encryptSecret(integration.accessToken),
      },
      phoneNumberId: integration.phoneNumberId,
      wabaId: integration.wabaId ?? null,
    };
  }
}

/** Registra il Bearer token inviato al provider per ogni richiesta HTTP. */
class RecordingWhatsAppProvider {
  readonly requests: Array<{ accessToken: string | null; to: unknown; url: string }> = [];

  readonly fetcher = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const body: unknown = JSON.parse(String(init?.body ?? '{}'));
    const authorization = new Headers(init?.headers).get('Authorization');

    this.requests.push({
      accessToken: authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : null,
      to: typeof body === 'object' && body !== null && 'to' in body ? body.to : null,
      url: url.toString(),
    });

    return Response.json({ messages: [{ id: `wamid.${this.requests.length}` }] }, { status: 201 });
  };
}

class FakeOutboxRepository implements WhatsAppOutboxRepository {
  readonly sentJobs: Array<{ jobId: string }> = [];
  readonly retriedJobs: Array<{ jobId: string; error: { code: string; message: string } }> = [];
  readonly deadLetters: Array<{ jobId: string; error: { code: string; message: string } }> = [];

  constructor(private readonly jobs: ClaimedWhatsAppOutboxJob[]) {}

  async claimReadyJobs(): Promise<ClaimedWhatsAppOutboxJob[]> {
    return this.jobs;
  }

  async markJobSent(input: { jobId: string }): Promise<void> {
    this.sentJobs.push({ jobId: input.jobId });
  }

  async scheduleJobRetry(input: {
    jobId: string;
    error: { code: string; message: string };
  }): Promise<void> {
    this.retriedJobs.push({ jobId: input.jobId, error: input.error });
  }

  async markJobDeadLetter(input: {
    jobId: string;
    error: { code: string; message: string };
  }): Promise<void> {
    this.deadLetters.push({ jobId: input.jobId, error: input.error });
  }
}
