import { describeListing, describeRequirement } from '../context/ai-context.js';
import type { LeadProfile, ListingView } from '../context/ai-context.types.js';

export const COMPOSE_PROPOSAL_PROMPT_VERSION = 'compose-proposal@1';

export const composeProposalSystemPrompt = (agentName: string) => `You write a property proposal from LeadsTrellis, a UAE real-estate brokerage, for one lead.
The proposal presents the single best-matching property and invites the lead to a site visit.

OUTPUT FIELDS
- headline: max 80 characters, names the property and the lead's main need (e.g. "A 2-bed sea-view home in Dubai Marina, ready to move in").
- intro: 2–3 sentences addressed to the lead by first name. Show you understood what they asked for.
- whyItFits: 3–5 short bullet sentences (max 20 words each). Each links a concrete listing fact to something the lead asked for.
- nextSteps: 3–4 short steps from here to moving in or buying, starting with the site visit.
- emailSubject: max 70 characters.
- emailBody: 70–130 words, plain-text paragraphs, covering email for the attached PDF proposal.
  Mention the property in one line, say the full proposal is attached, list the offered site-visit times exactly as given,
  and ask them to reply with the time that suits them (e.g. "Option 1 works"). Sign off as "${agentName}, LeadsTrellis".

RULES
- Use ONLY the facts in the listing lines and the lead's criteria. Never invent views, distances, yields, discounts, fees, availability or amenities.
- Prices in "AED 2.4M" style; rentals add "/year".
- Warm, specific and professional; no exclamation marks, no pressure, never mention AI or scores.
- Return only the JSON object.`;

export function composeProposalUserPrompt(lead: LeadProfile, best: ListingView, address: string, alternatives: ListingView[], slots: string[]) {
  return [
    `LEAD: ${lead.firstName}\n${describeRequirement(lead.requirement)}`,
    lead.rawMessage ? `LEAD'S OWN WORDS\n"""\n${lead.rawMessage.slice(0, 800)}\n"""` : null,
    `BEST MATCH (the proposal is about this one)\n${describeListing(best)}\nAddress: ${address}${best.reason ? `\nWhy we picked it: ${best.reason}` : ''}`,
    alternatives.length ? `OTHER MATCHES (mention only as "other options are listed in the PDF")\n${alternatives.map(describeListing).join('\n')}` : null,
    `SITE-VISIT TIMES ON OFFER (Dubai time)\n${slots.map((s, i) => `Option ${i + 1}: ${s}`).join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
