import type { Channel } from '../../generated/prisma/enums.js';
import type { LeadProfile, ListingView } from '../context/ai-context.types.js';
import { composeWithTemplate } from '../fallbacks/message-templates.js';
import { runJsonTask } from '../guards/run-json-task.js';
import {
  COMPOSE_MESSAGE_PROMPT_VERSION,
  composeSystemPrompt,
  composeUserPrompt,
  type MessagePurpose,
} from '../prompts/compose-message.prompt.js';
import { composeMessageSchema } from '../schemas/compose-message.schema.js';

const MAX_CHARS: Partial<Record<Channel, number>> = { WHATSAPP: 900, INSTAGRAM: 600, SMS: 320 };

export interface ComposeInput {
  channel: Exclude<Channel, 'CALL'>;
  purpose: MessagePurpose;
  lead: LeadProfile;
  listings: ListingView[];
  slots: string[];
  agentName: string;
  extra?: string;
}

/** Step 6: a short personalised message for one channel. */
export async function composeMessage(i: ComposeInput) {
  const result = await runJsonTask({
    task: 'compose-message',
    promptVersion: COMPOSE_MESSAGE_PROMPT_VERSION,
    system: composeSystemPrompt(i.channel, i.purpose, i.agentName),
    user: composeUserPrompt(i),
    schema: composeMessageSchema,
    fallback: () => composeWithTemplate(i.channel, i.purpose, i.lead, i.listings, i.slots, i.agentName, i.extra),
  });

  const max = MAX_CHARS[i.channel];
  const body = max && result.data.body.length > max ? `${result.data.body.slice(0, max - 1).trimEnd()}…` : result.data.body;
  return {
    subject: i.channel === 'EMAIL' ? result.data.subject ?? 'Homes that match your search' : null,
    body,
    aiGenerated: result.source === 'ai',
  };
}
