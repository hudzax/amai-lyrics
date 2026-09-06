import { describe, it, expect } from 'vitest';
import { ConvertTime } from '../src/utils/Lyrics/ConvertTime';

describe('ConvertTime', () => {
  it('converts seconds to milliseconds', () => {
    expect(ConvertTime(1)).toBe(1000);
    expect(ConvertTime(0)).toBe(0);
    expect(ConvertTime(3.5)).toBe(3500);
  });

  it('handles fractional and negative values linearly', () => {
    expect(ConvertTime(0.55)).toBeCloseTo(550, 10);
    expect(ConvertTime(-2)).toBe(-2000);
  });
});
