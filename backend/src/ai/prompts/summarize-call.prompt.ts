import { describeRequirement } from '../context/ai-context.js';
import type { LeadProfile, ListingView } from '../context/ai-context.types.js';

export const SUMMARIZE_CALL_PROMPT_VERSION = 'summarize-call@1';

export const summarizeCallSystemPrompt = () => `You review a phone-call transcript between LeadsTrellis's AI assistant (Layla) and a property lead, and write the CRM update.

RULES
- Facts come from what the LEAD said or clearly agreed to. Layla's suggestions are not facts unless the lead confirmed them.
- outcome:
  INTERESTED = agreed to a viewing, or asked to proceed / see more options soon.
  NOT_READY = interested but later: gave a future timeline or asked for a call back.
  NOT_INTERESTED = declined, already bought, wrong person, or asked not to be contacted.
  NO_ANSWER = the lead said nothing meaningful (voicemail, silence, hung up immediately).
- summary: 2–3 sentences an agent can act on: what they want, what was agreed, any concern raised.
- requirementUpdates: only values the lead stated or corrected on the call; otherwise null or [].
  Money in AED whole numbers ("two point four million" = 2400000; rent per year).
- viewing.agreed = true only if the lead accepted a time. slotIndex = 0 or 1 if they chose one of the two offered slots, else null.
  propertyRef = the refCode of the listing they want to see if identifiable, else null. requestedTimeText = their own words if they proposed another time.
- followUpInDays: for NOT_READY, when to check in (their timeline; "call me tomorrow" = 1; unspecified = 14). Otherwise null.
- optOut = true if they asked not to be called or messaged again.

Return only the JSON object.`;

export interface SummarizeCallPromptInput {
  lead: LeadProfile;
  listings: ListingView[];
  slots: string[];
  transcript: { speaker: 'AI' | 'LEAD'; text: string }[];
}

export const summarizeCallUserPrompt = (i: SummarizeCallPromptInput) =>
  [
    `REQUIREMENTS BEFORE THE CALL\n${describeRequirement(i.lead.requirement)}`,
    `LISTINGS DISCUSSED (refCode: title)\n${i.listings.map((l) => `${l.refCode}: ${l.title}, ${l.community}`).join('\n') || 'none'}`,
    `OFFERED SLOTS: 0 = ${i.slots[0] ?? 'n/a'}; 1 = ${i.slots[1] ?? 'n/a'}`,
    `TRANSCRIPT\n${i.transcript.map((t) => `${t.speaker === 'AI' ? 'Layla' : 'Lead'}: ${t.text}`).join('\n')}`,
  ].join('\n\n');
