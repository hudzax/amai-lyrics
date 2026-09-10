import { describe, expect, it } from 'vitest';
import { deriveLoopType, deriveShuffleType } from '../src/utils/playerState';

describe('deriveLoopType', () => {
  it('maps 0 to none', () => {
    expect(deriveLoopType(0)).toBe('none');
  });

  it('maps 1 to context', () => {
    expect(deriveLoopType(1)).toBe('context');
  });

  it('maps 2 to track', () => {
    expect(deriveLoopType(2)).toBe('track');
  });

  it('maps anything else to none', () => {
    expect(deriveLoopType(3)).toBe('none');
    expect(deriveLoopType(-1)).toBe('none');
  });
});

describe('deriveShuffleType', () => {
  it('prefers smart shuffle', () => {
    expect(deriveShuffleType(true, true)).toBe('smart');
    expect(deriveShuffleType(false, true)).toBe('smart');
  });

  it('falls back to normal shuffle', () => {
    expect(deriveShuffleType(true, false)).toBe('normal');
  });

  it('returns none when both flags are off', () => {
    expect(deriveShuffleType(false, false)).toBe('none');
  });
});
