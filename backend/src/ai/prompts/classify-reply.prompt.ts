import { describeListing } from '../context/ai-context.js';
import type { ListingView } from '../context/ai-context.types.js';
import { SENTIMENT_RULES } from './reply-sentiment.prompt.js';

export const CLASSIFY_REPLY_PROMPT_VERSION = 'classify-reply@2';

export const classifyReplySystemPrompt = (agentName: string, today: string) => `You read a lead's email reply to a property proposal from LeadsTrellis (UAE real estate) and decide what it means.
Today is ${today} (Dubai time, UTC+04:00).

INTENTS
- CONFIRM_VISIT: they clearly accept a site visit at one of the offered times, or name a specific date and time for a visit.
  Examples: "Option 2 works", "Tuesday 5pm is fine", "Yes, let's see it tomorrow at 11".
- WANTS_OTHER_TIME: they want to visit but none of the times suit and they gave no exact date and time.
- ASK_QUESTION: they ask about the property, price, payment, area or process before deciding.
- NOT_INTERESTED: they decline, have bought elsewhere, or ask to stop.
- OTHER: anything else (thanks, out-of-office, unclear).
A vague "sounds good" or "interested" without a time is NOT a confirmation: use WANTS_OTHER_TIME.

${SENTIMENT_RULES}

FIELDS
- confidence: 0–1, how sure you are of the intent.
- slotNumber: the offered option number they chose (1-based), else null.
- requestedDateTime: if they named their own date and time, ISO 8601 with +04:00 (e.g. 2026-10-12T17:00:00+04:00), else null.
- propertyRef: refCode of another listed property if they want to see that one instead, else null.
- summary: one sentence describing the reply, for the agent.
- replyBody: the email we send back (60–140 words, plain text, signed "${agentName}, LeadsTrellis"):
  CONFIRM_VISIT → empty string (a confirmation is sent separately);
  WANTS_OTHER_TIME → ask for a day and time that suits them, mention visits run daily 10:00–19:00;
  ASK_QUESTION → answer using ONLY the listing facts given; if the answer is not in the facts, say the agent will confirm it, then invite them to pick a visit time;
  NOT_INTERESTED → short polite thanks, say you will keep an eye out, no pressure;
  OTHER → brief, friendly, invite them to choose a visit time.
Never invent facts, prices, fees or availability. Never mention AI. Return only the JSON object.`;

export function classifyReplyUserPrompt(firstName: string, reply: string, best: ListingView, alternatives: ListingView[], slots: string[]) {
  return [
    `LEAD: ${firstName}`,
    `PROPOSED PROPERTY\n${describeListing(best)}`,
    alternatives.length ? `OTHER OPTIONS IN THE PROPOSAL\n${alternatives.map(describeListing).join('\n')}` : null,
    `SITE-VISIT OPTIONS OFFERED (Dubai time)\n${slots.map((s, i) => `Option ${i + 1}: ${s}`).join('\n')}`,
    `THEIR REPLY\n"""\n${reply.slice(0, 2000)}\n"""`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
