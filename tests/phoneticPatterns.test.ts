import { describe, expect, it } from 'vitest';
import { applyPhoneticPatterns, isJapaneseText } from '../src/utils/Lyrics/phoneticPatterns';

// These mirror the expectations already proven for processPhoneticText in
// tests/processing.test.ts, so the shared helper is held to the same contract.
describe('applyPhoneticPatterns', () => {
  it('converts furigana {hira} to ruby', () => {
    expect(applyPhoneticPatterns('漢字{かんじ}', false)).toBe('<ruby>漢字<rt>かんじ</rt></ruby>');
  });

  it('converts romaji {romaji} to ruby when enableRomaji is true', () => {
    const out = applyPhoneticPatterns('東京{tokyo}', true) as string;
    expect(out).toContain('<ruby>');
    expect(out).toContain('<rt>');
    expect(out).toContain('tokyo');
  });

  it('handles Korean romaja', () => {
    const out = applyPhoneticPatterns('한글{hangeul}', false) as string;
    expect(out).toContain('class="romaja"');
    expect(out).toContain('hangeul');
  });

  it('returns plain text unchanged when no patterns present', () => {
    expect(applyPhoneticPatterns('hello world', false)).toBe('hello world');
    expect(applyPhoneticPatterns('hello world', true)).toBe('hello world');
  });

  it('passes undefined through', () => {
    expect(applyPhoneticPatterns(undefined, true)).toBeUndefined();
    expect(applyPhoneticPatterns(undefined, false)).toBeUndefined();
  });

  it('accepts fullwidth braces in romaji mode only', () => {
    // Pre-existing asymmetry, preserved verbatim from the original inline regexes:
    // JAPANESE_ROMAJI_REGEX accepts both {…} and ｛…｝, but JAPANESE_FURIGANA_REGEX
    // matches literal ASCII braces only. Do not "fix" this here without a fixture
    // showing real providers emit fullwidth-brace furigana.
    expect(applyPhoneticPatterns('漢字｛かんじ｝', true)).toContain('<rt>かんじ</rt>');
    expect(applyPhoneticPatterns('漢字｛かんじ｝', false)).toBe('漢字｛かんじ｝');
    expect(applyPhoneticPatterns('（漢字）{かんじ}', true)).toContain('<rt>かんじ</rt>');
    expect(applyPhoneticPatterns('漢字{かんじ}', false)).toContain('<rt>かんじ</rt>');
  });

  // The /g patterns are module-level singletons shared across calls. replace() is
  // safe, but this pins the behaviour so a future .test() on them is caught here.
  it('is stable across repeated and interleaved calls (shared /g lastIndex)', () => {
    const a1 = applyPhoneticPatterns('漢字{かんじ}', false);
    const b = applyPhoneticPatterns('한글{hangeul}', true);
    const a2 = applyPhoneticPatterns('漢字{かんじ}', false);
    expect(a2).toBe(a1);
    expect(applyPhoneticPatterns('漢字{かんじ}', false)).toBe(a1);
    expect(b).toContain('hangeul');
  });
});

describe('isJapaneseText', () => {
  it('detects kana and kanji', () => {
    expect(isJapaneseText('漢字')).toBe(true);
    expect(isJapaneseText('かな')).toBe(true);
    expect(isJapaneseText('カタカナ')).toBe(true);
  });

  it('is false for Korean, Latin and empty input', () => {
    expect(isJapaneseText('한글')).toBe(false);
    expect(isJapaneseText('hello world')).toBe(false);
    expect(isJapaneseText('')).toBe(false);
    expect(isJapaneseText(undefined)).toBe(false);
  });
});
