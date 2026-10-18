import { describe, expect, it } from 'vitest';
import type { RequirementView } from '../../src/ai/context/ai-context.types.js';
import { computeScore } from '../../src/scoring/scoring.engine.js';

const requirement: RequirementView = {
  purpose: 'BUY',
  propertyTypes: ['APARTMENT'],
  bedroomsMin: 2,
  bedroomsMax: 2,
  budgetMin: null,
  budgetMax: 2_400_000,
  emirate: 'Dubai',
  communities: ['Dubai Marina'],
  timeline: 'IMMEDIATE',
  financing: 'CASH',
  completionPreference: null,
  mustHaves: [],
  niceToHaves: [],
  summary: null,
  missingFields: [],
};
const engagement = { inboundMessages: 0, callsAnswered: 0, viewingsBooked: 0 };

describe('computeScore', () => {
  it('scores a complete, urgent, realistic lead as high intent', () => {
    const r = computeScore({ requirement, source: 'WHATSAPP', marketMedianAed: 2_200_000, engagement, aiIntent: { score: 18, reasoning: 'cash, this week' } });
    expect(r.total).toBeGreaterThanOrEqual(70);
    expect(r.intentLevel).toBe('HIGH');
    expect(r.breakdown.map((b) => b.key)).toEqual(['budgetFit', 'timeline', 'completeness', 'sourceQuality', 'engagement', 'aiIntent']);
  });

  it('caps a far-below-market budget at low intent', () => {
    const r = computeScore({
      requirement: { ...requirement, budgetMax: 300_000 },
      source: 'EMAIL',
      marketMedianAed: 25_000_000,
      engagement,
      aiIntent: { score: 15, reasoning: 'specific' },
    });
    expect(r.intentLevel).toBe('LOW');
    expect(r.total).toBeLessThan(40);
  });

  it('never exceeds 100', () => {
    const r = computeScore({ requirement, source: 'PHONE', marketMedianAed: 1_000_000, engagement: { inboundMessages: 5, callsAnswered: 2, viewingsBooked: 1 }, aiIntent: { score: 20, reasoning: '' } });
    expect(r.total).toBeLessThanOrEqual(100);
  });
});
