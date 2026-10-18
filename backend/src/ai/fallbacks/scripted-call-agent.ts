import { formatAed } from '../../utils/currency.js';
import type { CallAgentContext } from '../prompts/call-agent.prompt.js';
import type { CallAgentTurn } from '../schemas/call-agent.schema.js';

const QUESTIONS: Record<string, string> = {
  budget: 'What budget range are you working with?',
  location: 'Which areas are you most interested in?',
  bedrooms: 'How many bedrooms do you need?',
  timeline: 'When are you hoping to move or buy?',
};

/** Deterministic call script used offline or when the AI fails mid-call. */
export function scriptedAgentTurn(c: CallAgentContext, transcript: { speaker: 'AI' | 'LEAD'; text: string }[]): CallAgentTurn {
  const aiTurns = transcript.filter((t) => t.speaker === 'AI').length;
  const last = transcript.filter((t) => t.speaker === 'LEAD').at(-1)?.text.toLowerCase() ?? '';
  const name = c.lead.firstName;

  if (aiTurns === 0) {
    return { reply: `Hi ${name}, this is Layla, EstatePilot's AI assistant, calling about your property enquiry. Is now a good time for two minutes?`, stage: 'greeting', detectedOutcome: 'UNDECIDED', endCall: false };
  }
  if (/not interested|no thanks|stop calling|don't call|do not call|already bought/.test(last)) {
    return { reply: `No problem at all, ${name}. Thank you for your time, and have a lovely day.`, stage: 'closing', detectedOutcome: 'NOT_INTERESTED', endCall: true };
  }
  if (/busy|call (me )?(back|later)|not a good time|driving|in a meeting/.test(last)) {
    return { reply: `Of course, I will ask ${c.agentName} to call you back at a better time. Thank you, ${name}.`, stage: 'closing', detectedOutcome: 'NOT_READY', endCall: true };
  }

  const missing = (c.lead.requirement?.missingFields ?? []).filter((f) => QUESTIONS[f]);
  const step = aiTurns - 1;
  if (step < missing.length && step < 2) {
    return { reply: `Great. ${QUESTIONS[missing[step]]}`, stage: 'qualifying', detectedOutcome: 'UNDECIDED', endCall: false };
  }
  const presented = transcript.some((t) => t.speaker === 'AI' && /viewing/.test(t.text.toLowerCase()));
  const best = c.listings[0];
  if (!presented) {
    const pitch = best ? `I have ${best.title} in ${best.community}, ${best.bedrooms} bedrooms at ${formatAed(best.priceAed)}. ` : '';
    return { reply: `${pitch}Would you like a viewing on ${c.slots[0]} or ${c.slots[1]}?`, stage: 'booking', detectedOutcome: 'UNDECIDED', endCall: false };
  }
  if (/\b(yes|sure|ok|okay|first|second|morning|evening|afternoon|works|book)\b/.test(last)) {
    return { reply: `Perfect, it is booked. ${c.agentName} will send you a WhatsApp confirmation shortly. Thank you, ${name}!`, stage: 'closing', detectedOutcome: 'INTERESTED', endCall: true };
  }
  return { reply: `No problem. I will send the details on WhatsApp so you can decide later. Thank you, ${name}.`, stage: 'closing', detectedOutcome: 'NOT_READY', endCall: true };
}
