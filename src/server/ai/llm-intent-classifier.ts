import { z } from 'zod';

import {
  intentCategories,
  RuleBasedIntentClassifier,
  type IntentClassification,
  type IntentClassificationInput,
  type IntentClassifier,
} from '@/server/ai/intent-router';
import { extractJsonObject, type LlmClient } from '@/server/ai/llm';
import { usageFromLlmResult } from '@/server/ai/costs';

const llmIntentSchema = z.object({
  intent: z.enum(intentCategories),
  confidence: z.number().min(0).max(1),
  matchedSignals: z.array(z.string()).default([]),
});

export class LlmIntentClassifier implements IntentClassifier {
  constructor(private readonly llm: LlmClient) {}

  async classify(input: IntentClassificationInput): Promise<IntentClassification> {
    const result = await this.llm.complete({
      system: intentClassificationSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            text: input.text,
            locale: input.locale ?? 'es-419',
          }),
        },
      ],
      maxTokens: 220,
      temperature: 0,
      metadata: {
        feature: 'intent_classifier',
      },
    });
    const parsed = llmIntentSchema.parse(extractJsonObject(result.text));

    if (parsed.confidence < 0.6) {
      return {
        intent: 'other',
        confidence: parsed.confidence,
        matchedSignals: ['llm_low_confidence'],
        aiUsage: usageFromLlmResult(result, 'intent_classifier'),
      };
    }

    return {
      ...parsed,
      aiUsage: usageFromLlmResult(result, 'intent_classifier'),
    };
  }
}

export class FallbackIntentClassifier implements IntentClassifier {
  constructor(
    private readonly primary: IntentClassifier,
    private readonly fallback: IntentClassifier = new RuleBasedIntentClassifier(),
  ) {}

  async classify(input: IntentClassificationInput): Promise<IntentClassification> {
    try {
      return await this.primary.classify(input);
    } catch {
      const classification = await this.fallback.classify(input);

      return {
        ...classification,
        matchedSignals: [...classification.matchedSignals, 'llm_fallback_rule_based'],
      };
    }
  }
}

function intentClassificationSystemPrompt(): string {
  return [
    'Eres el clasificador de intent de Ambrogio.ai para negocios profesionales (español latinoamericano).',
    'Responde solo con JSON válido.',
    `Intents permitidos: ${intentCategories.join(', ')}.`,
    'booking_request: reservar/agendar una cita o visita.',
    'reschedule_request: mover/cambiar una cita.',
    'cancellation_request: cancelar/anular una cita.',
    'pricing_question: precios, costos, tarifas, listado.',
    'opening_hours_question: horarios, apertura, cierre, dirección operativa.',
    'human_handoff: petición explícita de una persona, emergencia, reclamo grave o caso delicado.',
    'other: saludos, mensajes ambiguos, spam o no clasificables.',
    'Schema: {"intent":"booking_request","confidence":0.88,"matchedSignals":["reservar"]}',
    'Si no estás seguro, usa confidence por debajo de 0.6.',
  ].join('\n');
}
