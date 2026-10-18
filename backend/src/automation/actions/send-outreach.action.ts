import type { MessagePurpose } from '../../ai/prompts/compose-message.prompt.js';
import { prisma } from '../../lib/prisma.js';
import { sendMessage, type TextChannel } from '../../modules/communications/communications.service.js';
import { primaryChannel } from '../channel-selector.js';

/** Sends an AI-written message on the given (or best) channel. Returns a log line, or null if unreachable. */
export async function sendOutreach(leadId: string, purpose: MessagePurpose, channel?: TextChannel, extra?: string) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const target = channel ?? primaryChannel(lead);
  if (!target) return null;
  const message = await sendMessage({ leadId, channel: target, purpose, actorType: 'AI', extra });
  return `${purpose} sent on ${target} (message ${message.id})`;
}
