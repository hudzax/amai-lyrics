import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));

import storage from '../src/utils/storage';
import {
  processLinePhonetics,
  decorateLineElement,
} from '../src/utils/Lyrics/Applyer/Utils/decorateLine';

describe('processLinePhonetics', () => {
  beforeEach(() => {
    vi.mocked(storage.get).mockClear().mockReturnValue(null);
  });

  it('sets the romaji toggle notification the first time Japanese text is seen', () => {
    const data: { Info?: string } = {};
    const line = { Text: '漢字{かんじ}' };
    processLinePhonetics(line, data);
    expect(data.Info).toBeDefined();
    expect(data.Info).toContain('Romaji');
    // enable_romaji is null (unset) -> furigana, not romaji
    expect(line.Text).toContain('<rt>かんじ</rt>');
  });

  it('does not re-set Info once already populated', () => {
    const data = { Info: 'custom' };
    const line = { Text: '漢字{かんじ}' };
    processLinePhonetics(line, data);
    expect(data.Info).toBe('custom');
  });

  it('leaves non-Japanese text alone and never sets Info', () => {
    const data: { Info?: string } = {};
    const line = { Text: 'hello world' };
    processLinePhonetics(line, data);
    expect(data.Info).toBeUndefined();
    expect(line.Text).toBe('hello world');
  });
});

describe('decorateLineElement', () => {
  it('appends a translation node for a distinct translation', () => {
    const lineElem = document.createElement('div');
    const main = document.createElement('span');
    decorateLineElement(lineElem, main, { Text: 'hello', Translation: 'hola' });
    expect(main.querySelector('.translation')?.textContent).toBe('hola');
  });

  it('skips translation when it matches the raw text', () => {
    const lineElem = document.createElement('div');
    const main = document.createElement('span');
    decorateLineElement(lineElem, main, { Text: 'hello', Translation: 'hello' }, 'hello');
    expect(main.querySelector('.translation')).toBeNull();
  });

  it('adds the rtl class for Hebrew text', () => {
    const lineElem = document.createElement('div');
    const main = document.createElement('span');
    decorateLineElement(lineElem, main, { Text: 'שלום' });
    expect(lineElem.classList.contains('rtl')).toBe(true);
  });
});
