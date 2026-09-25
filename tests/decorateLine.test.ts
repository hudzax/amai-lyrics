import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/utils/settingsValues', () => ({
  default: { get: vi.fn(() => false), set: vi.fn() },
}));

import settingsValues from '../src/utils/settingsValues';
import {
  processLinePhonetics,
  decorateLineElement,
} from '../src/utils/Lyrics/Applyer/Utils/decorateLine';
import type { LineView } from '../src/utils/Lyrics/conversion';

describe('processLinePhonetics', () => {
  beforeEach(() => {
    vi.mocked(settingsValues.get).mockClear().mockReturnValue(false);
  });

  it('sets the romaji toggle notification the first time Japanese text is seen', () => {
    const data: { info?: string } = {};
    const line: LineView = { text: '漢字{かんじ}' };
    processLinePhonetics(line, data);
    expect(data.info).toBeDefined();
    expect(data.info).toContain('Romaji');
    // enable_romaji unset/false -> furigana, not romaji
    expect(line.text).toContain('<rt>かんじ</rt>');
  });

  it('does not re-set info once already populated', () => {
    const data = { info: 'custom' };
    const line: LineView = { text: '漢字{かんじ}' };
    processLinePhonetics(line, data);
    expect(data.info).toBe('custom');
  });

  it('leaves non-Japanese text alone and never sets info', () => {
    const data: { info?: string } = {};
    const line: LineView = { text: 'hello world' };
    processLinePhonetics(line, data);
    expect(data.info).toBeUndefined();
    expect(line.text).toBe('hello world');
  });
});

describe('decorateLineElement', () => {
  it('appends a translation node for a distinct translation', () => {
    const lineElem = document.createElement('div');
    const main = document.createElement('span');
    decorateLineElement(lineElem, main, { text: 'hello', translation: 'hola' });
    expect(main.querySelector('.translation')?.textContent).toBe('hola');
  });

  it('skips translation when it matches the raw text', () => {
    const lineElem = document.createElement('div');
    const main = document.createElement('span');
    decorateLineElement(lineElem, main, { text: 'hello', translation: 'hello' }, 'hello');
    expect(main.querySelector('.translation')).toBeNull();
  });

  it('adds the rtl class for Hebrew text', () => {
    const lineElem = document.createElement('div');
    const main = document.createElement('span');
    decorateLineElement(lineElem, main, { text: 'שלום' });
    expect(lineElem.classList.contains('rtl')).toBe(true);
  });
});
