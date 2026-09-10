import { describe, expect, it } from 'vitest';
import { findActiveIndex } from '../src/utils/Lyrics/findActiveIndex';

const lines = [
  { StartTime: 0, EndTime: 3000 },
  { StartTime: 3500, EndTime: 6000 },
  { StartTime: 7000, EndTime: 9000 },
];

describe('findActiveIndex', () => {
  it('finds the line containing the position (inclusive on both ends)', () => {
    expect(findActiveIndex(lines, 0)).toBe(0);
    expect(findActiveIndex(lines, 1500)).toBe(0);
    expect(findActiveIndex(lines, 3000)).toBe(0);
    expect(findActiveIndex(lines, 3500)).toBe(1);
    expect(findActiveIndex(lines, 6000)).toBe(1);
    expect(findActiveIndex(lines, 9000)).toBe(2);
  });

  it('returns -1 in the gaps between lines', () => {
    expect(findActiveIndex(lines, 3001)).toBe(-1);
    expect(findActiveIndex(lines, 3499)).toBe(-1);
    expect(findActiveIndex(lines, 6001)).toBe(-1);
  });

  it('returns -1 before the first and after the last line', () => {
    expect(findActiveIndex(lines, -10)).toBe(-1);
    expect(findActiveIndex(lines, 10000)).toBe(-1);
  });

  it('handles the empty array', () => {
    expect(findActiveIndex([], 100)).toBe(-1);
  });

  it('handles a single line', () => {
    const single = [{ StartTime: 0, EndTime: 5000 }];
    expect(findActiveIndex(single, 0)).toBe(0);
    expect(findActiveIndex(single, 2500)).toBe(0);
    expect(findActiveIndex(single, 5000)).toBe(0);
    expect(findActiveIndex(single, 5001)).toBe(-1);
  });
});
