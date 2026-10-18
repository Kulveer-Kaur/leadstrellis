import type { Channel } from '../../generated/prisma/enums.js';
import { formatAed } from '../../utils/currency.js';
import { describeRequirement } from '../context/ai-context.js';
import type { LeadProfile, ListingView } from '../context/ai-context.types.js';

export const COMPOSE_MESSAGE_PROMPT_VERSION = 'compose-message@1';

export type MessagePurpose = 'INTRO' | 'FOLLOW_UP' | 'NO_REPLY_RETRY' | 'VIEWING_CONFIRMATION' | 'NURTURE' | 'POST_CALL';

const PURPOSE_BRIEF: Record<MessagePurpose, string> = {
  INTRO: 'First reply to a new enquiry. Thank them, show you understood what they want, share the matched listings, and ask one question that moves to a viewing or a quick call.',
  FOLLOW_UP: 'Planned follow-up after they said they were not ready. Light touch: ask whether their plans have moved on and offer one fresh option if provided. No pressure.',
  NO_REPLY_RETRY: 'They have not replied to our earlier message. Short, friendly nudge on a different channel; restate the single best match and make replying easy (a yes/no question).',
  VIEWING_CONFIRMATION: 'Confirm the booked viewing: property, community, date and time (Dubai time) and the agent who will meet them. Ask them to reply if they need to change the time.',
  NURTURE: 'Monthly check-in for someone not buying soon. One useful, general market note about their area of interest (no made-up statistics), and an open invitation to reach out.',
  POST_CALL: 'Thank them for the call, recap what was agreed in one sentence, and include the listings discussed.',
};

const CHANNEL_RULES: Record<Channel, string> = {
  WHATSAPP: 'WhatsApp: max 700 characters, short lines, numbered list for listings, *bold* allowed for listing titles, at most 2 emoji, no headings. subject = null.',
  INSTAGRAM: 'Instagram DM: max 450 characters, casual and warm, at most 1 emoji, each listing on one short line. subject = null.',
  SMS: 'SMS: max 320 characters, plain text, only the single best listing, no emoji, no links. subject = null.',
  EMAIL: 'Email: subject max 70 characters; body 90–180 words in plain-text paragraphs, listings as a short dash list, polite sign-off.',
  CALL: 'Not used for calls.',
};

export const composeSystemPrompt = (channel: Channel, purpose: MessagePurpose, agentName: string) => `You write messages from LeadsTrellis, a UAE real-estate brokerage, to a property lead.
Sound like a helpful human consultant: warm, concise and specific, never pushy or salesy.

TASK: ${PURPOSE_BRIEF[purpose]}

RULES
- Address the lead by first name. Mention what they asked for in a few words, so they know we read it.
- Use ONLY the listing facts provided (title, community, bedrooms, price, and the "why it fits" note).
  Never invent facts, discounts, availability, yields or deadlines.
- Prices: "AED 2.4M" style; rentals add "/year".
- Language: if the lead's language is "ar", write in Arabic; if "mixed", write in English with one short Arabic greeting; otherwise English.
- Exactly one clear call to action at the end (for example offer the two viewing slots, or ask for a good time to call).
- Sign off as "${agentName}, LeadsTrellis".
- Never mention AI, scores, internal notes or other clients.
- ${CHANNEL_RULES[channel]}

Return only the JSON object.`;

export interface ComposePromptInput {
  lead: LeadProfile;
  listings: ListingView[];
  slots: string[];
  extra?: string;
}

export const composeUserPrompt = ({ lead, listings, slots, extra }: ComposePromptInput) =>
  [
    `LEAD: ${lead.firstName} (language: ${lead.language}, came via ${lead.source})`,
    `WHAT THEY WANT\n${describeRequirement(lead.requirement)}`,
    listings.length
      ? `LISTINGS TO SHARE\n${listings
          .map((l, i) => `${i + 1}. ${l.title} — ${l.community}, ${l.bedrooms === 0 ? 'studio' : `${l.bedrooms}BR`}, ${formatAed(l.priceAed)}${l.listingType === 'RENT' ? '/year' : ''}. Why it fits: ${l.reason ?? 'matches their criteria'}`)
          .join('\n')}`
      : 'LISTINGS TO SHARE: none',
    slots.length ? `VIEWING SLOTS YOU MAY OFFER (Dubai time): ${slots.join(' or ')}` : null,
    extra ? `CONTEXT: ${extra}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
