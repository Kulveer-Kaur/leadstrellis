import { describe, expect, it } from 'vitest';
import { canTransition } from '../../src/modules/pipeline/status-transitions.js';

describe('pipeline state machine', () => {
  it('allows the main path', () => {
    expect(canTransition('NEW', 'QUALIFIED')).toBe(true);
    expect(canTransition('QUALIFIED', 'CONTACTED')).toBe(true);
    expect(canTransition('CONTACTED', 'VIEWING')).toBe(true);
    expect(canTransition('VIEWING', 'CLOSED_WON')).toBe(true);
  });

  it('allows nurture from open states and back to qualified', () => {
    expect(canTransition('CONTACTED', 'NURTURE')).toBe(true);
    expect(canTransition('NURTURE', 'QUALIFIED')).toBe(true);
  });

  it('blocks skipping to closed won and leaving closed won', () => {
    expect(canTransition('NEW', 'CLOSED_WON')).toBe(false);
    expect(canTransition('CLOSED_WON', 'NEW')).toBe(false);
  });
});
