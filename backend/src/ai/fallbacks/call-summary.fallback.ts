import type { CallSummary } from '../schemas/summarize-call.schema.js';

/** Keyword-based call summary used offline or when the AI fails. */
export function summarizeWithRules(transcript: { speaker: 'AI' | 'LEAD'; text: string }[]): CallSummary {
  const leadText = transcript.filter((t) => t.speaker === 'LEAD').map((t) => t.text.toLowerCase()).join(' ');
  const lastAi = transcript.filter((t) => t.speaker === 'AI').at(-1)?.text.toLowerCase() ?? '';
  const optOut = /stop calling|don't call|do not call|remove my number/.test(leadText);
  const notInterested = optOut || /not interested|no thanks|already bought/.test(leadText);
  const booked = /booked/.test(lastAi);
  const later = /later|call (me )?back|next (month|year)|busy|not ready/.test(leadText);

  const outcome = !leadText.trim() ? 'NO_ANSWER' : notInterested ? 'NOT_INTERESTED' : booked ? 'INTERESTED' : later ? 'NOT_READY' : 'NOT_READY';
  const slotIndex = booked ? (/\b(second|evening|five|5)\b/.test(leadText) ? 1 : 0) : null;

  return {
    outcome,
    summary:
      outcome === 'INTERESTED'
        ? 'Lead confirmed interest and agreed to a viewing during the AI call.'
        : outcome === 'NOT_INTERESTED'
          ? 'Lead said they are not interested at the moment.'
          : outcome === 'NO_ANSWER'
            ? 'No meaningful conversation; the lead did not respond.'
            : 'Lead is interested but not ready to book yet; follow up later.',
    sentiment: outcome === 'INTERESTED' ? 'POSITIVE' : outcome === 'NOT_INTERESTED' ? 'NEGATIVE' : 'NEUTRAL',
    requirementUpdates: {
      budgetMin: null,
      budgetMax: null,
      bedroomsMin: null,
      bedroomsMax: null,
      propertyTypes: [],
      communities: [],
      timeline: null,
      financing: null,
      addMustHaves: [],
    },
    viewing: { agreed: booked, propertyRef: null, slotIndex, requestedTimeText: null },
    followUpInDays: outcome === 'NOT_READY' ? (/tomorrow/.test(leadText) ? 1 : 14) : null,
    optOut,
  };
}
