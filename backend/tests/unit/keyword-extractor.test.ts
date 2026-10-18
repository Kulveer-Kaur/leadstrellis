import { describe, expect, it } from 'vitest';
import { extractWithRules } from '../../src/ai/fallbacks/keyword-extractor.js';

describe('extractWithRules (offline lead understanding)', () => {
  it('reads a clear WhatsApp enquiry', () => {
    const r = extractWithRules('Hi, looking for a 2BR with sea view in Dubai Marina, budget up to 2.4M, cash buyer. Want to see options this week.');
    expect(r.bedroomsMin).toBe(2);
    expect(r.budgetMax).toBe(2_400_000);
    expect(r.communities).toEqual(['Dubai Marina']);
    expect(r.emirate).toBe('Dubai');
    expect(r.financing).toBe('CASH');
    expect(r.timeline).toBe('IMMEDIATE');
    expect(r.mustHaves).toContain('sea view');
    expect(r.intent.score).toBeGreaterThanOrEqual(14);
  });

  it('turns a monthly rent into a yearly budget', () => {
    const r = extractWithRules('Studio for rent near metro in Business Bay, 5k a month, furnished, asap');
    expect(r.purpose).toBe('RENT');
    expect(r.budgetMax).toBe(60_000);
    expect(r.bedroomsMin).toBe(0);
    expect(r.propertyTypes).toContain('STUDIO');
  });

  it('converts GBP and finds several communities', () => {
    const r = extractWithRules('3 bedroom apartment in Downtown or Business Bay, budget £900k, mortgage pre-approved');
    expect(r.budgetMax).toBe(4_185_000);
    expect(r.communities).toEqual(expect.arrayContaining(['Downtown Dubai', 'Business Bay']));
    expect(r.financing).toBe('MORTGAGE');
  });

  it('handles ranges, "around" and maid rooms', () => {
    const r = extractWithRules('villa 4 bed + maid in Arabian Ranches, around 6.5 mil');
    expect(r.budgetMin).toBe(5_850_000);
    expect(r.budgetMax).toBe(7_150_000);
    expect(r.mustHaves).toContain("maid's room");
    expect(extractWithRules('2 or 3 bedroom on Saadiyat').bedroomsMax).toBe(3);
  });

  it('marks vague messages as missing everything', () => {
    const r = extractWithRules('hi what do you have?');
    expect(r.missingFields).toHaveLength(6);
    expect(r.intent.score).toBeLessThan(10);
  });
});
