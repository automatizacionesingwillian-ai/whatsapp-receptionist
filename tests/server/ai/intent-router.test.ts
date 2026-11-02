import { describe, expect, it } from 'vitest';

import { ReplyOrchestrator } from '@/server/ai/reply-orchestrator';
import { RuleBasedIntentClassifier } from '@/server/ai/intent-router';
import type { DomainReplyGenerator, DomainReplyInput } from '@/server/ai/domain-reply';

describe('RuleBasedIntentClassifier', () => {
  it('classifies common Spanish LATAM receptionist intents', async () => {
    const classifier = new RuleBasedIntentClassifier();

    await expect(
      classifier.classify({ text: 'Quiero reservar una visita mañana' }),
    ).resolves.toMatchObject({
      intent: 'booking_request',
    });

    await expect(
      classifier.classify({ text: 'Puedo mover la cita?' }),
    ).resolves.toMatchObject({
      intent: 'reschedule_request',
    });

    await expect(classifier.classify({ text: 'Cancela cita' })).resolves.toMatchObject({
      intent: 'cancellation_request',
    });

    await expect(
      classifier.classify({ text: 'Cuanto cuesta la primera consulta?' }),
    ).resolves.toMatchObject({
      intent: 'pricing_question',
    });
  });
});

describe('ReplyOrchestrator', () => {
  it('adds AI disclosure when enabled by tenant policy', async () => {
    const orchestrator = new ReplyOrchestrator();

    const reply = await orchestrator.createReply({
      text: 'Quiero agendar una cita',
      assistantName: 'Ambrogio',
      aiDisclosureEnabled: true,
      locale: 'es-419',
    });

    expect(reply.shouldReply).toBe(true);
    expect(reply.classification.intent).toBe('booking_request');
    expect(reply.replyText).toContain('soy Ambrogio');
  });

  it('uses a configured domain reply generator before falling back', async () => {
    const generator = new FakeDomainReplyGenerator(
      'Claro, puedo ayudarte con información y citas.',
    );
    const orchestrator = new ReplyOrchestrator(new RuleBasedIntentClassifier(), generator);

    const reply = await orchestrator.createReply({
      text: 'Hola, quiero algo de información',
      assistantName: 'Ambrogio',
      aiDisclosureEnabled: true,
      locale: 'es-419',
    });

    expect(generator.calls[0]).toMatchObject({
      text: 'Hola, quiero algo de información',
    });
    expect(reply.replyText).toContain('soy Ambrogio');
    expect(reply.replyText).toContain('puedo ayudarte');
    expect(reply.metadata).toMatchObject({
      aiEngine: {
        provider: 'fake',
      },
    });
  });
});

class FakeDomainReplyGenerator implements DomainReplyGenerator {
  readonly calls: DomainReplyInput[] = [];

  constructor(private readonly replyText: string) {}

  async generate(input: DomainReplyInput) {
    this.calls.push(input);

    return {
      shouldReply: true,
      replyText: this.replyText,
      metadata: {
        aiEngine: {
          provider: 'fake',
        },
      },
    };
  }
}
