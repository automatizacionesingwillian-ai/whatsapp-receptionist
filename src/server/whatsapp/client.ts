import { AppError } from '@/lib/errors/app-error';
import { env } from '@/lib/env';
import { fetchWithTimeout } from '@/lib/http/fetch-with-timeout';
import { logger } from '@/lib/logging/logger';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { readCredentialSecret } from '@/server/integrations/credential-encryption';
import { WHATSAPP_PROVIDERS, WHATSAPP_PROVIDER } from '@/server/whatsapp/webhook-events';

export type SendWhatsAppTextInput = {
  to: string;
  body: string;
  previewUrl?: boolean;
};

export type SendWhatsAppTextResult = {
  providerMessageId: string;
  rawResponse: unknown;
};

export type WhatsAppTemplateTextParameter = {
  type: 'text';
  text: string;
};

export type WhatsAppTemplateParameter = WhatsAppTemplateTextParameter;

export type WhatsAppTemplateComponent = {
  type: 'header' | 'body' | 'button';
  subType?: 'quick_reply' | 'url';
  index?: string | number;
  parameters?: WhatsAppTemplateParameter[];
};

export type SendWhatsAppTemplateInput = {
  to: string;
  name: string;
  languageCode: string;
  components?: WhatsAppTemplateComponent[];
};

export type SendWhatsAppTemplateResult = SendWhatsAppTextResult;

export interface WhatsAppMessageSender {
  sendText(input: SendWhatsAppTextInput): Promise<SendWhatsAppTextResult>;
  sendTemplate(input: SendWhatsAppTemplateInput): Promise<SendWhatsAppTemplateResult>;
}

type FetchLike = typeof fetch;

/**
 * Cliente Meta WhatsApp Cloud API.
 *
 * POST `/{phone-number-id}/messages` con `Authorization: Bearer <token>`.
 * Una sola Meta App puede servir N negocios: cada tenant aporta su
 * `phoneNumberId` (+ token si no se usa un System User compartido).
 */
export class MetaCloudWhatsAppClient implements WhatsAppMessageSender {
  constructor(
    private readonly config: {
      apiUrl?: string;
      accessToken?: string;
      phoneNumberId?: string;
      fetcher?: FetchLike;
      onAuthFailure?: () => void;
    } = {},
  ) {}

  async sendText(input: SendWhatsAppTextInput): Promise<SendWhatsAppTextResult> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'text',
      text: {
        body: input.body,
        preview_url: input.previewUrl ?? false,
      },
    });
  }

  async sendTemplate(input: SendWhatsAppTemplateInput): Promise<SendWhatsAppTemplateResult> {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: input.to,
      type: 'template',
      template: {
        name: input.name,
        language: {
          code: input.languageCode,
        },
        ...(input.components && input.components.length > 0
          ? { components: toProviderTemplateComponents(input.components) }
          : {}),
      },
    });
  }

  private async sendMessage(body: Record<string, unknown>): Promise<SendWhatsAppTextResult> {
    const accessToken = this.config.accessToken ?? env.WHATSAPP_API_KEY;
    const phoneNumberId = this.config.phoneNumberId ?? env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      throw new AppError('internal', 'WhatsApp access token is not configured', {
        expose: false,
      });
    }

    if (!phoneNumberId) {
      throw new AppError('internal', 'WhatsApp phone number ID is not configured', {
        expose: false,
      });
    }

    const baseUrl = (this.config.apiUrl ?? env.WHATSAPP_API_URL).replace(/\/$/, '');
    const url = `${baseUrl}/${encodeURIComponent(phoneNumberId)}/messages`;

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
      {
        label: 'WhatsApp send',
        ...(this.config.fetcher !== undefined ? { fetchImpl: this.config.fetcher } : {}),
      },
    );

    const rawResponse = await readJsonResponse(response);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.config.onAuthFailure?.();
      }

      throw new AppError('upstream_error', 'WhatsApp send failed', {
        cause: {
          status: response.status,
          body: rawResponse,
        },
        expose: false,
      });
    }

    const providerMessageId = extractProviderMessageId(rawResponse);

    if (!providerMessageId) {
      throw new AppError('upstream_error', 'WhatsApp send response did not include a message id', {
        cause: rawResponse,
        expose: false,
      });
    }

    return {
      providerMessageId,
      rawResponse,
    };
  }
}

/** @deprecated Alias temporal; usar `MetaCloudWhatsAppClient`. */
export const Dialog360WhatsAppClient = MetaCloudWhatsAppClient;

export type WhatsAppCredentials = {
  readonly accessToken: string;
  readonly phoneNumberId: string;
  readonly wabaId: string | null;
  /** `global` = fallback de env; migrar a credenciales por tenant. */
  readonly source: 'tenant' | 'global';
};

export interface WhatsAppCredentialsResolver {
  resolve(tenantId: string): Promise<WhatsAppCredentials>;
  invalidate(tenantId: string): void;
}

export interface WhatsAppCredentialsStore {
  findActiveIntegration(tenantId: string): Promise<{
    credentials: Record<string, unknown>;
    phoneNumberId: string | null;
    wabaId: string | null;
  } | null>;
}

type CredentialsLogger = {
  warn(context: Record<string, unknown>, message: string): void;
};

const CREDENTIALS_CACHE_TTL_MS = 5 * 60 * 1000;

type CredentialsCacheEntry = {
  readonly credentials: WhatsAppCredentials;
  readonly expiresAt: number;
};

export class TenantWhatsAppCredentialsResolver implements WhatsAppCredentialsResolver {
  private readonly cache = new Map<string, CredentialsCacheEntry>();
  private readonly log: CredentialsLogger;

  constructor(
    private readonly store: WhatsAppCredentialsStore,
    private readonly options: {
      ttlMs?: number;
      globalAccessToken?: string;
      globalPhoneNumberId?: string;
      globalWabaId?: string;
      now?: () => number;
      logger?: CredentialsLogger;
    } = {},
  ) {
    this.log = options.logger ?? logger;
  }

  async resolve(tenantId: string): Promise<WhatsAppCredentials> {
    const now = (this.options.now ?? Date.now)();
    const cached = this.cache.get(tenantId);

    if (cached && cached.expiresAt > now) {
      return cached.credentials;
    }

    const credentials = await this.load(tenantId);

    this.cache.set(tenantId, {
      credentials,
      expiresAt: now + (this.options.ttlMs ?? CREDENTIALS_CACHE_TTL_MS),
    });

    return credentials;
  }

  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  private async load(tenantId: string): Promise<WhatsAppCredentials> {
    const integration = await this.store.findActiveIntegration(tenantId);
    const tenantToken = integration
      ? (readCredentialSecret(integration.credentials, 'access_token') ??
        readCredentialSecret(integration.credentials, 'api_key'))
      : null;

    if (tenantToken && integration?.phoneNumberId) {
      return {
        accessToken: tenantToken,
        phoneNumberId: integration.phoneNumberId,
        wabaId: integration.wabaId,
        source: 'tenant',
      };
    }

    const globalAccessToken = (this.options.globalAccessToken ?? env.WHATSAPP_API_KEY).trim();
    const globalPhoneNumberId = (
      this.options.globalPhoneNumberId ?? env.WHATSAPP_PHONE_NUMBER_ID
    ).trim();
    const globalWabaId = (this.options.globalWabaId ?? env.WHATSAPP_WABA_ID).trim() || null;

    if (!globalAccessToken || !globalPhoneNumberId) {
      throw new AppError('internal', 'No WhatsApp Cloud API credentials for this tenant', {
        expose: false,
      });
    }

    this.log.warn(
      { tenantId, hasIntegration: integration !== null },
      'No WhatsApp credentials on tenant: falling back to global Meta token',
    );

    return {
      accessToken: globalAccessToken,
      phoneNumberId: globalPhoneNumberId,
      wabaId: globalWabaId,
      source: 'global',
    };
  }
}

export class SupabaseWhatsAppCredentialsStore implements WhatsAppCredentialsStore {
  private client: ReturnType<typeof createSupabaseAdminClient> | null = null;

  async findActiveIntegration(tenantId: string): Promise<{
    credentials: Record<string, unknown>;
    phoneNumberId: string | null;
    wabaId: string | null;
  } | null> {
    const { data, error } = await this.supabase()
      .from('integrations')
      .select('credentials, external_account_id, config')
      .eq('tenant_id', tenantId)
      .in('provider', [...WHATSAPP_PROVIDERS])
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      throw new AppError('upstream_error', 'Failed to read WhatsApp integration credentials', {
        cause: error,
        expose: false,
      });
    }

    if (!data) {
      return null;
    }

    const row = data as {
      credentials: Record<string, unknown> | null;
      external_account_id: string | null;
      config: Record<string, unknown> | null;
    };

    const config = row.config ?? {};
    const wabaId =
      typeof config['waba_id'] === 'string' && config['waba_id'].trim()
        ? config['waba_id'].trim()
        : null;

    return {
      credentials: row.credentials ?? {},
      phoneNumberId: row.external_account_id,
      wabaId,
    };
  }

  private supabase(): ReturnType<typeof createSupabaseAdminClient> {
    this.client ??= createSupabaseAdminClient();
    return this.client;
  }
}

export interface WhatsAppMessageSenderResolver {
  resolveSender(tenantId: string): Promise<WhatsAppMessageSender>;
}

export class TenantWhatsAppMessageSenderResolver implements WhatsAppMessageSenderResolver {
  constructor(
    private readonly credentials: WhatsAppCredentialsResolver,
    private readonly config: {
      apiUrl?: string;
      fetcher?: FetchLike;
    } = {},
  ) {}

  async resolveSender(tenantId: string): Promise<WhatsAppMessageSender> {
    const resolved = await this.credentials.resolve(tenantId);

    return new MetaCloudWhatsAppClient({
      accessToken: resolved.accessToken,
      phoneNumberId: resolved.phoneNumberId,
      ...(this.config.apiUrl !== undefined ? { apiUrl: this.config.apiUrl } : {}),
      ...(this.config.fetcher !== undefined ? { fetcher: this.config.fetcher } : {}),
      onAuthFailure: () => this.credentials.invalidate(tenantId),
    });
  }
}

let sharedCredentialsResolver: WhatsAppCredentialsResolver | null = null;

export function whatsAppCredentialsResolver(): WhatsAppCredentialsResolver {
  sharedCredentialsResolver ??= new TenantWhatsAppCredentialsResolver(
    new SupabaseWhatsAppCredentialsStore(),
  );

  return sharedCredentialsResolver;
}

export function invalidateWhatsAppCredentials(tenantId: string): void {
  sharedCredentialsResolver?.invalidate(tenantId);
}

export function createWhatsAppMessageSenderResolver(
  credentials: WhatsAppCredentialsResolver = whatsAppCredentialsResolver(),
): WhatsAppMessageSenderResolver {
  return new TenantWhatsAppMessageSenderResolver(credentials);
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractProviderMessageId(rawResponse: unknown): string | null {
  if (
    typeof rawResponse !== 'object' ||
    rawResponse === null ||
    !('messages' in rawResponse) ||
    !Array.isArray(rawResponse.messages)
  ) {
    return null;
  }

  const firstMessage = rawResponse.messages[0];

  if (
    typeof firstMessage !== 'object' ||
    firstMessage === null ||
    !('id' in firstMessage) ||
    typeof firstMessage.id !== 'string'
  ) {
    return null;
  }

  return firstMessage.id;
}

function toProviderTemplateComponents(
  components: WhatsAppTemplateComponent[],
): Array<Record<string, unknown>> {
  return components.map((component) => ({
    type: component.type,
    ...(component.subType ? { sub_type: component.subType } : {}),
    ...(component.index !== undefined ? { index: component.index } : {}),
    ...(component.parameters && component.parameters.length > 0
      ? { parameters: component.parameters }
      : {}),
  }));
}

export { WHATSAPP_PROVIDER };
