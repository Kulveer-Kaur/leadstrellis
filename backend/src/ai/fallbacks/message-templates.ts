import type { Channel } from '../../generated/prisma/enums.js';
import { formatAed } from '../../utils/currency.js';
import type { LeadProfile, ListingView } from '../context/ai-context.types.js';
import type { MessagePurpose } from '../prompts/compose-message.prompt.js';
import type { ComposeMessageOutput } from '../schemas/compose-message.schema.js';

const line = (l: ListingView, i: number) =>
  `${i + 1}. ${l.title}, ${l.community}: ${l.bedrooms === 0 ? 'studio' : `${l.bedrooms}BR`}, ${formatAed(l.priceAed)}${l.listingType === 'RENT' ? '/year' : ''}`;

/** Plain template messages used when the AI is unavailable. */
export function composeWithTemplate(
  channel: Channel,
  purpose: MessagePurpose,
  lead: LeadProfile,
  listings: ListingView[],
  slots: string[],
  agentName: string,
  extra?: string,
): ComposeMessageOutput {
  const hi = `Hi ${lead.firstName},`;
  const sign = `${agentName}, LeadsTrellis`;
  const summary = lead.requirement?.summary?.replace(/\.$/, '');
  const want = summary ? summary.charAt(0).toLowerCase() + summary.slice(1) : 'your property search';
  const list = (channel === 'SMS' ? listings.slice(0, 1) : listings).map(line).join('\n');
  const slotAsk = slots.length ? `Would ${slots[0]} or ${slots[1] ?? 'another time'} suit you for a viewing?` : 'When is a good time for a quick call?';

  const bodies: Record<MessagePurpose, string> = {
    INTRO: `${hi} thanks for reaching out. Based on what you shared (${want}), here are options that fit:\n${list}\n${slotAsk}\n${sign}`,
    FOLLOW_UP: `${hi} just checking in on your property plans. ${list ? `A new option you may like:\n${list}\n` : ''}Happy to help whenever you are ready.\n${sign}`,
    NO_REPLY_RETRY: `${hi} following up on the homes I shared. ${listings[0] ? `${line(listings[0], 0).slice(3)} is still available.` : ''} Shall I book a viewing for you?\n${sign}`,
    VIEWING_CONFIRMATION: `${hi} your viewing is confirmed${extra ? `: ${extra}` : ''}. Reply here if you need to change the time.\n${sign}`,
    NURTURE: `${hi} a quick market check-in from EstatePilot. If your plans change, I can share fresh options in your preferred area anytime.\n${sign}`,
    POST_CALL: `${hi} thank you for the call today. ${extra ?? ''}\n${list}\n${sign}`,
  };

  const body = bodies[purpose].replace(/\n{2,}/g, '\n').trim();
  return {
    subject: channel === 'EMAIL' ? (purpose === 'VIEWING_CONFIRMATION' ? 'Your viewing is confirmed' : 'Homes that match your search') : null,
    body: channel === 'SMS' ? body.slice(0, 320) : body,
  };
}
