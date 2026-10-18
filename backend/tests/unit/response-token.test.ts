import { describe, expect, it } from 'vitest';
import { parseResponseToken, responseLinksFor, responseToken, verifyResponseToken } from '../../src/modules/responses/response-token.js';

const lead = { id: 'cm_lead_a', number: 1047 };

describe('email response links', () => {
  it('round-trips a token for the same lead', () => {
    const parsed = parseResponseToken(responseToken(lead));
    expect(parsed?.number).toBe(1047);
    expect(verifyResponseToken(lead.id, parsed!.sig)).toBe(true);
  });

  it('rejects a token moved to another lead number', () => {
    const sig = parseResponseToken(responseToken(lead))!.sig;
    expect(verifyResponseToken('cm_lead_b', sig)).toBe(false);
  });

  it('rejects malformed tokens', () => {
    expect(parseResponseToken('1047')).toBeNull();
    expect(parseResponseToken('abc-def')).toBeNull();
  });

  it('builds one link per choice', () => {
    const links = responseLinksFor(lead);
    expect(links.interested).toMatch(/\/respond\/1047-[\w-]{22}\?choice=interested$/);
    expect(links.unsubscribe).toContain('choice=unsubscribe');
  });
});
