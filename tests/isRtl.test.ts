import { describe, it, expect } from 'vitest';
import isRtl from '../src/utils/Lyrics/isRtl';

describe('isRtl', () => {
  it('returns false for empty', () => {
    expect(isRtl('')).toBe(false);
    expect(isRtl(null as unknown as string)).toBe(false);
  });
  it('detects Arabic', () => {
    expect(isRtl('مرحبا')).toBe(true);
  });
  it('detects Hebrew', () => {
    expect(isRtl('שלום')).toBe(true);
  });
  it('returns false for LTR english', () => {
    expect(isRtl('hello world')).toBe(false);
  });
  it('ignores leading digits and spaces', () => {
    expect(isRtl('  123  مرحبا')).toBe(true);
    expect(isRtl('  123 hello')).toBe(false);
  });
  it('returns false for Japanese', () => {
    // Japanese is not RTL range, should be false
    expect(isRtl('こんにちは')).toBe(false);
  });
});
