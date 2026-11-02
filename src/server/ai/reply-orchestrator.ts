import {
  RuleBasedIntentClassifier,
  type IntentClassification,
  type IntentClassifier,
} from '@/server/ai/intent-router';
import { env } from '@/lib/env';
import { createAnthropicClientForModel } from '@/server/ai/anthropic-adapter';
import {
  createAiContextProvider,
  emptyAiRuntimeContext,
  type AiContextProvider,
  type AiRuntimeContext,
} from '@/server/ai/context';
import { LlmDomainReplyGenerator, type DomainReplyGenerator } from '@/server/ai/domain-reply';
import { FallbackIntentClassifier, LlmIntentClassifier } from '@/server/ai/llm-intent-classifier';

export type ReplyOrchestratorInput = {
  tenantId?: string;
  conversationId?: string;
  text: string;
  assistantName: string;
  aiDisclosureEnabled: boolean;
  locale?: string;
};

export type ReplyPlan = {
  shouldReply: boolean;
  replyText: string | null;
  classification: IntentClassification;
  metadata?: Record<string, unknown>;
};

export class ReplyOrchestrator {
  constructor(
    private readonly classifier: IntentClassifier = new RuleBasedIntentClassifier(),
    private readonly domainReplyGenerator: DomainReplyGenerator | null = null,
    private readonly contextProvider: AiContextProvider | null = null,
  ) {}

  async createReply(input: ReplyOrchestratorInput): Promise<ReplyPlan> {
    const classification = await this.classifier.classify({
      text: input.text,
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
    });
    const context = await this.loadContextSafely(input);
    const generatedReply = await this.generateDomainReplySafely(input, classification, context);

    if (generatedReply) {
      return {
        ...generatedReply,
        replyText: generatedReply.replyText
          ? withDisclosure(generatedReply.replyText, {
              assistantName: input.assistantName,
              aiDisclosureEnabled: input.aiDisclosureEnabled,
            })
          : null,
        classification,
      };
    }

    const body = createReplyBody(classification.intent);

    return {
      shouldReply: body !== null,
      replyText:
        body === null
          ? null
          : withDisclosure(body, {
              assistantName: input.assistantName,
              aiDisclosureEnabled: input.aiDisclosureEnabled,
            }),
      classification,
      metadata: {
        aiEngine: {
          provider: 'rule_based',
        },
        aiContext: context?.metadata ?? null,
      },
    };
  }

  private async generateDomainReplySafely(
    input: ReplyOrchestratorInput,
    classification: IntentClassification,
    context: AiRuntimeContext | null,
  ): Promise<Omit<ReplyPlan, 'classification'> | null> {
    if (!this.domainReplyGenerator) {
      return null;
    }

    try {
      return await this.domainReplyGenerator.generate({
        text: input.text,
        assistantName: input.assistantName,
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
        classification,
        ...(context !== null ? { context } : {}),
      });
    } catch {
      return {
        shouldReply: createReplyBody(classification.intent) !== null,
        replyText: createReplyBody(classification.intent),
        metadata: {
          aiEngine: {
            provider: 'rule_based',
            fallbackReason: 'domain_reply_failed',
          },
          aiContext: context?.metadata ?? null,
        },
      };
    }
  }

  private async loadContextSafely(input: ReplyOrchestratorInput): Promise<AiRuntimeContext | null> {
    if (!this.contextProvider || !input.tenantId || !input.conversationId) {
      return null;
    }

    try {
      return await this.contextProvider.load({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        query: input.text,
      });
    } catch {
      return emptyAiRuntimeContext({
        fallbackReason: 'context_load_failed',
      });
    }
  }
}

export function createReplyOrchestrator(): ReplyOrchestrator {
  const fastClient = createAnthropicClientForModel(env.ANTHROPIC_MODEL_FAST);
  const primaryClient = createAnthropicClientForModel(env.ANTHROPIC_MODEL_PRIMARY);
  const classifier = fastClient
    ? new FallbackIntentClassifier(new LlmIntentClassifier(fastClient))
    : new RuleBasedIntentClassifier();
  const domainReplyGenerator = primaryClient ? new LlmDomainReplyGenerator(primaryClient) : null;

  return new ReplyOrchestrator(
    classifier,
    domainReplyGenerator,
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createAiContextProvider()
      : null,
  );
}

function createReplyBody(intent: IntentClassification['intent']): string | null {
  switch (intent) {
    case 'booking_request':
      return 'Claro, te ayudo a reservar. Dime el servicio, el día y la franja horaria que prefieres, así reviso la disponibilidad.';
    case 'reschedule_request':
      return 'Claro, puedo ayudarte a mover la cita. Envíame el día y la hora actuales, y luego la nueva franja que prefieres.';
    case 'cancellation_request':
      return 'De acuerdo, puedo ayudarte a cancelar. Envíame el nombre, el día y la hora de la cita a cancelar.';
    case 'pricing_question':
      return 'Con gusto te ayudo. Dime qué servicio te interesa y te respondo con precio, duración y disponibilidad.';
    case 'opening_hours_question':
      return 'Te ayudo de inmediato. Dime para qué día quieres revisar los horarios o si prefieres reservar directamente.';
    case 'human_handoff':
      return 'Entendido. Dejo la solicitud para una persona del equipo y preparo el contexto de la conversación.';
    case 'other':
      return 'Gracias por tu mensaje. Dime si quieres reservar, modificar una cita o hablar con el equipo.';
  }
}

function withDisclosure(
  body: string,
  input: {
    assistantName: string;
    aiDisclosureEnabled: boolean;
  },
): string {
  if (!input.aiDisclosureEnabled) {
    return body;
  }

  return `Hola, soy ${input.assistantName}, el asistente de IA del negocio. ${body}`;
}
