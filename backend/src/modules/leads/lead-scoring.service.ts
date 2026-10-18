import { toRequirementView } from '../../ai/context/ai-context.js';
import { marketMedianFor } from '../../scoring/market-median.js';
import { computeScore } from '../../scoring/scoring.engine.js';
import { emitSocket } from '../../lib/socket.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';

/**
 * Scores a lead and stores the breakdown. Pass `aiIntent` from a fresh AI read;
 * omit it to re-use the last AI intent (rules-only rescore after a reply, call or edit).
 */
export async function scoreLead(leadId: string, aiIntent?: { score: number; reasoning: string }) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      requirement: true,
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { viewings: true } },
    },
  });
  if (!lead) throw ApiError.notFound('Lead');

  const [inboundMessages, callsAnswered] = await Promise.all([
    prisma.message.count({ where: { leadId, direction: 'IN' } }),
    prisma.call.count({ where: { leadId, outcome: { in: ['INTERESTED', 'NOT_READY', 'NOT_INTERESTED'] } } }),
  ]);
  const requirement = lead.requirement ? toRequirementView(lead.requirement) : null;
  const intent = aiIntent ?? {
    score: lead.scores[0]?.aiIntentScore ?? 8,
    reasoning: lead.scores[0] ? (lead.scores[0].breakdown as { key: string; note: string }[]).find((b) => b.key === 'aiIntent')?.note ?? '' : 'Not assessed yet',
  };

  const result = computeScore({
    requirement,
    source: lead.source,
    marketMedianAed: await marketMedianFor(requirement),
    engagement: { inboundMessages, callsAnswered, viewingsBooked: lead._count.viewings },
    aiIntent: intent,
  });

  await prisma.$transaction([
    prisma.leadScore.create({
      data: {
        leadId,
        total: result.total,
        intentLevel: result.intentLevel,
        breakdown: result.breakdown as unknown as object,
        aiIntentScore: Math.round(intent.score),
        reasoning: intent.reasoning,
      },
    }),
    prisma.lead.update({ where: { id: leadId }, data: { score: result.total, intentLevel: result.intentLevel } }),
  ]);
  emitSocket('lead:updated', { leadId, score: result.total, intentLevel: result.intentLevel });
  return { ...result, previous: lead.score };
}
