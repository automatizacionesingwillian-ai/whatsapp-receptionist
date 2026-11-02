import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logging/logger';
import { encryptSecret, readCredentialSecret } from '@/server/integrations/credential-encryption';

import { invalidateWhatsAppCredentials } from './client';
import { WHATSAPP_PROVIDER, WHATSAPP_PROVIDERS } from './webhook-events';

/**
 * Collegamento del numero WhatsApp di un tenant.
 *
 * Prima di questo modulo `resolveTenantByPhoneNumberId` cercava una riga
 * `integrations` con provider `whatsapp_360dialog` che nessuna riga di codice
 * scriveva mai: sette occorrenze del provider nel repository, tutte in
 * lettura. Ogni messaggio in ingresso finiva quindi in `unresolved`, e l'unico
 * modo di attivare un cliente era una INSERT manuale in produzione.
 */

export interface WhatsAppConnectionInput {
  readonly tenantId: string;
  /** `phone_number_id` de Meta: clave con la que el webhook resuelve el tenant. */
  readonly phoneNumberId: string;
  /** Número legible, solo para la UI. */
  readonly displayPhoneNumber: string;
  /**
   * Access token de Meta para este número/WABA (System User o token del negocio).
   * Se guarda cifrado; el campo API sigue llamándose `apiKey` por compatibilidad.
   */
  readonly apiKey: string;
  /** WhatsApp Business Account ID — necesario para sync de plantillas. */
  readonly wabaId?: string;
}

export interface WhatsAppConnectionStatus {
  readonly connected: boolean;
  readonly phoneNumberId: string | null;
  readonly displayPhoneNumber: string | null;
  readonly wabaId: string | null;
  readonly status: string | null;
  readonly hasApiKey: boolean;
  readonly connectedAt: string | null;
}

interface IntegrationRow {
  id: string;
  tenant_id: string;
  external_account_id: string | null;
  external_display_id: string | null;
  status: string;
  credentials: Record<string, unknown>;
  config: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppProvisioningRepository {
  findByTenant(tenantId: string): Promise<IntegrationRow | null>;
  findByPhoneNumberId(phoneNumberId: string): Promise<IntegrationRow | null>;
  upsert(input: {
    tenantId: string;
    existingId: string | null;
    phoneNumberId: string;
    displayPhoneNumber: string;
    wabaId: string | null;
    credentials: Record<string, unknown>;
  }): Promise<IntegrationRow>;
  revoke(input: { tenantId: string; integrationId: string }): Promise<void>;
}

/**
 * Notifica che le credenziali di un tenant sono cambiate.
 *
 * Iniettabile perché i test non devono dipendere dalla cache di processo del
 * client WhatsApp, e perché il servizio non deve conoscere chi la usa.
 */
export type CredentialsChangedListener = (tenantId: string) => void;

export class WhatsAppProvisioningService {
  constructor(
    private readonly repository: WhatsAppProvisioningRepository,
    private readonly onCredentialsChanged: CredentialsChangedListener = () => {},
  ) {}

  async connect(input: WhatsAppConnectionInput): Promise<WhatsAppConnectionStatus> {
    const phoneNumberId = input.phoneNumberId.trim();
    const apiKey = input.apiKey.trim();

    if (!phoneNumberId) {
      throw new AppError('bad_request', 'phoneNumberId is required', { expose: true });
    }

    if (!apiKey) {
      throw new AppError('bad_request', 'apiKey is required', { expose: true });
    }

    // Il `phone_number_id` è la chiave con cui il webhook decide a quale tenant
    // appartiene un messaggio in arrivo. Se due tenant potessero registrare lo
    // stesso valore, il secondo intercetterebbe le conversazioni del primo:
    // è un dirottamento cross-tenant, non un conflitto di dati. Il controllo
    // sta qui perché lo schema non ha un vincolo unique su
    // (provider, external_account_id).
    const owner = await this.repository.findByPhoneNumberId(phoneNumberId);
    if (owner && owner.tenant_id !== input.tenantId && owner.status === 'active') {
      logger.warn(
        { tenantId: input.tenantId, conflictingTenantId: owner.tenant_id },
        'Intento de vincular un número WhatsApp ya asignado a otro tenant',
      );
      // Messaggio deliberatamente generico: confermare che il numero esiste
      // altrove rivelerebbe informazioni sugli altri tenant.
      throw new AppError('conflict', 'Este número ya está vinculado a otra cuenta.', {
        expose: true,
      });
    }

    const existing = await this.repository.findByTenant(input.tenantId);

    const wabaId = input.wabaId?.trim() || null;
    const row = await this.repository.upsert({
      tenantId: input.tenantId,
      existingId: existing?.id ?? null,
      phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber.trim(),
      wabaId,
      credentials: {
        // Compat: el resolver lee access_token o api_key.
        access_token_encrypted: encryptSecret(apiKey),
        api_key_encrypted: encryptSecret(apiKey),
      },
    });

    this.onCredentialsChanged(input.tenantId);

    logger.info({ tenantId: input.tenantId }, 'Número WhatsApp conectado (Meta Cloud API)');

    return toStatus(row);
  }

  async getStatus(tenantId: string): Promise<WhatsAppConnectionStatus> {
    const row = await this.repository.findByTenant(tenantId);
    return row ? toStatus(row) : DISCONNECTED;
  }

  async disconnect(tenantId: string): Promise<WhatsAppConnectionStatus> {
    const existing = await this.repository.findByTenant(tenantId);

    if (!existing) {
      return DISCONNECTED;
    }

    await this.repository.revoke({ tenantId, integrationId: existing.id });
    this.onCredentialsChanged(tenantId);
    logger.info({ tenantId }, 'Número WhatsApp desvinculado');

    return DISCONNECTED;
  }
}

const DISCONNECTED: WhatsAppConnectionStatus = {
  connected: false,
  phoneNumberId: null,
  displayPhoneNumber: null,
  wabaId: null,
  status: null,
  hasApiKey: false,
  connectedAt: null,
};

function toStatus(row: IntegrationRow): WhatsAppConnectionStatus {
  const wabaId =
    typeof row.config['waba_id'] === 'string' && row.config['waba_id'].trim()
      ? row.config['waba_id'].trim()
      : null;

  return {
    connected: row.status === 'active',
    phoneNumberId: row.external_account_id,
    displayPhoneNumber: row.external_display_id,
    wabaId,
    status: row.status,
    hasApiKey:
      readCredentialSecret(row.credentials, 'access_token') !== null ||
      readCredentialSecret(row.credentials, 'api_key') !== null,
    connectedAt: row.created_at,
  };
}

class SupabaseWhatsAppProvisioningRepository implements WhatsAppProvisioningRepository {
  private readonly supabase = createSupabaseAdminClient();

  private static readonly COLUMNS =
    'id, tenant_id, external_account_id, external_display_id, status, credentials, config, created_at';

  async findByTenant(tenantId: string): Promise<IntegrationRow | null> {
    const { data, error } = await this.supabase
      .from('integrations')
      .select(SupabaseWhatsAppProvisioningRepository.COLUMNS)
      .eq('tenant_id', tenantId)
      .in('provider', [...WHATSAPP_PROVIDERS])
      .maybeSingle();

    if (error) {
      throw new AppError('internal', 'Failed to read WhatsApp integration', { cause: error });
    }

    return (data as IntegrationRow | null) ?? null;
  }

  async findByPhoneNumberId(phoneNumberId: string): Promise<IntegrationRow | null> {
    // Query cross-tenant deliberada: detectar si el número ya pertenece a otro.
    const { data, error } = await this.supabase
      .from('integrations')
      .select(SupabaseWhatsAppProvisioningRepository.COLUMNS)
      .in('provider', [...WHATSAPP_PROVIDERS])
      .eq('external_account_id', phoneNumberId)
      .maybeSingle();

    if (error) {
      throw new AppError('internal', 'Failed to check WhatsApp number ownership', { cause: error });
    }

    return (data as IntegrationRow | null) ?? null;
  }

  async upsert(input: {
    tenantId: string;
    existingId: string | null;
    phoneNumberId: string;
    displayPhoneNumber: string;
    wabaId: string | null;
    credentials: Record<string, unknown>;
  }): Promise<IntegrationRow> {
    const mutation = {
      tenant_id: input.tenantId,
      provider: WHATSAPP_PROVIDER,
      external_account_id: input.phoneNumberId,
      external_display_id: input.displayPhoneNumber || null,
      status: 'active',
      credentials: input.credentials,
      config: {
        phone_number_id: input.phoneNumberId,
        ...(input.wabaId ? { waba_id: input.wabaId } : {}),
      },
      updated_at: new Date().toISOString(),
    };

    const query =
      input.existingId !== null
        ? this.supabase
            .from('integrations')
            .update(mutation)
            .eq('id', input.existingId)
            .eq('tenant_id', input.tenantId)
        : this.supabase.from('integrations').insert(mutation);

    const { data, error } = await query
      .select(SupabaseWhatsAppProvisioningRepository.COLUMNS)
      .single();

    if (error) {
      throw new AppError('internal', 'Failed to save WhatsApp integration', { cause: error });
    }

    return data as IntegrationRow;
  }

  async revoke(input: { tenantId: string; integrationId: string }): Promise<void> {
    const { error } = await this.supabase
      .from('integrations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', input.integrationId)
      .eq('tenant_id', input.tenantId);

    if (error) {
      throw new AppError('internal', 'Failed to revoke WhatsApp integration', { cause: error });
    }
  }
}

export function createWhatsAppProvisioningService(
  repository: WhatsAppProvisioningRepository = new SupabaseWhatsAppProvisioningRepository(),
  onCredentialsChanged: CredentialsChangedListener = invalidateWhatsAppCredentials,
): WhatsAppProvisioningService {
  return new WhatsAppProvisioningService(repository, onCredentialsChanged);
}
