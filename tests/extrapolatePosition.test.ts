import { describe, expect, it } from 'vitest';
import { extrapolatePosition } from '../src/utils/Gets/extrapolatePosition';

describe('extrapolatePosition', () => {
  it('adds the elapsed time to the anchor position', () => {
    expect(extrapolatePosition(1000, 10000, 10500)).toBe(1500);
  });

  it('returns the anchor unchanged when no time has elapsed', () => {
    expect(extrapolatePosition(1000, 10000, 10000)).toBe(1000);
  });

  it('subtracts elapsed time when the now is before the anchor', () => {
    expect(extrapolatePosition(1000, 10000, 9500)).toBe(500);
  });

  it('handles zero and negative anchors', () => {
    expect(extrapolatePosition(0, 0, 250)).toBe(250);
    expect(extrapolatePosition(-50, 0, 100)).toBe(50);
  });
});
