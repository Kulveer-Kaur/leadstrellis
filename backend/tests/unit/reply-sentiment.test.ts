import { describe, expect, it } from 'vitest';
import { classifyWithRules } from '../../src/ai/tasks/classify-reply.task.js';
import { sentimentWithRules } from '../../src/ai/tasks/reply-sentiment.task.js';
import { WON_MIN_CONFIDENCE } from '../../src/modules/pipeline/reply-outcome.service.js';

describe('sentimentWithRules (offline reply reading)', () => {
  it.each([
    ['Please unsubscribe me from these emails', 'STOP'],
    ["Don't contact me again", 'STOP'],
    ['Thanks but not interested', 'NEGATIVE'],
    ['We already bought a villa elsewhere', 'NEGATIVE'],
    ['Can you do 1.9M? That is my final price', 'NEGOTIATION'],
    ['Is there any discount for cash?', 'NEGOTIATION'],
    ["Great, let's go ahead. Send me the contract", 'POSITIVE'],
    ['Thanks, will check and get back', 'NEUTRAL'],
  ])('%s → %s', (reply, sentiment) => {
    expect(sentimentWithRules(reply).sentiment).toBe(sentiment);
  });

  it('never reaches the auto-win bar on keywords alone', () => {
    expect(sentimentWithRules("I'll take it, send the paperwork").confidence).toBeLessThan(WON_MIN_CONFIDENCE);
  });
});

describe('classifyWithRules sentiment', () => {
  const input = (reply: string) => ({
    firstName: 'Sara',
    reply,
    best: {} as never,
    alternatives: [],
    slots: ['Mon 12 Oct at 11:00', 'Tue 13 Oct at 17:00'],
    agentName: 'Omar',
  });

  it('a decline is negative even with go-ahead words in it', () => {
    const r = classifyWithRules(input('No thanks, we decided to proceed with another agency'));
    expect(r.intent).toBe('NOT_INTERESTED');
    expect(r.sentiment).toBe('NEGATIVE');
  });

  it('confirming a visit slot is not a win', () => {
    const r = classifyWithRules(input('Option 2 works for me'));
    expect(r.intent).toBe('CONFIRM_VISIT');
    expect(r.sentiment).toBe('NEUTRAL');
  });
});
