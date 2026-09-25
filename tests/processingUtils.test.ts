import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/components/Global/Defaults', () => ({
  default: {
    CurrentLyricsType: 'None',
    LyricsContainerExists: false,
    Version: '1.0.0',
    lyrics: { api: { url: '', translationUrl: '', phoneticUrl: '' } },
    systemInstruction: '',
    translationPrompt: 'Translate into {language}:',
  },
}));
vi.mock('../src/utils/Lyrics/cache', () => ({
  cacheLyrics: vi.fn(),
  lyricsCache: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), destroy: vi.fn() },
}));
vi.mock('../src/utils/Lyrics/ui', () => ({
  HideLoaderContainer: vi.fn(),
  ClearLyricsPageContainer: vi.fn(),
  ShowProcessingIndicator: vi.fn(),
  EnsureProcessingIndicatorHidden: vi.fn(),
}));
vi.mock('../src/utils/EventManager', () => ({
  default: { listen: vi.fn(), unListen: vi.fn(), evoke: vi.fn() },
}));

import {
  detectLanguages,
  prepareLyricsForGemini,
  extractLyrics,
} from '../src/utils/Lyrics/processing';
import type { LyricsDocument } from '../src/utils/Lyrics/conversion';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('detectLanguages', () => {
  it('detects Japanese kanji in line lyrics', () => {
    const result = detectLanguages({
      type: 'Line',
      lines: [
        { text: 'hello', start: 0, end: 1 },
        { text: '漢字テスト', start: 1, end: 2 },
      ],
    });
    expect(result).toEqual({ hasKanji: true, hasKorean: false });
  });

  it('detects Korean in static lyrics', () => {
    const result = detectLanguages({
      type: 'Static',
      lines: [{ text: '한글 가사' }],
    });
    expect(result).toEqual({ hasKanji: false, hasKorean: true });
  });

  it('detects both languages and returns false for plain English', () => {
    expect(
      detectLanguages({
        type: 'Line',
        lines: [{ text: '漢字 and 한글', start: 0, end: 1 }],
      }),
    ).toEqual({ hasKanji: true, hasKorean: true });
    expect(detectLanguages({ type: 'Static', lines: [{ text: 'plain english' }] })).toEqual({
      hasKanji: false,
      hasKorean: false,
    });
  });

  it('returns false flags for documents without lines', () => {
    expect(detectLanguages({ type: 'Line', lines: [] })).toEqual({
      hasKanji: false,
      hasKorean: false,
    });
    expect(detectLanguages({ type: 'Static', lines: [] })).toEqual({
      hasKanji: false,
      hasKorean: false,
    });
  });
});

describe('prepareLyricsForGemini', () => {
  it('extracts lyricsOnly and stores each line as its raw text', () => {
    const document: LyricsDocument = {
      type: 'Static',
      lines: [{ text: 'first' }, { text: 'second' }],
    };
    const prepared = prepareLyricsForGemini(document);
    expect(prepared.lyricsOnly).toEqual(['first', 'second']);
    expect(prepared.document.lines.map((line) => line.raw)).toEqual(['first', 'second']);
  });
});

describe('extractLyrics', () => {
  it('removes empty lines and offsets start times for line lyrics', () => {
    const document: LyricsDocument = {
      type: 'Line',
      lines: [
        { text: '   ', start: 5, end: 6 },
        { text: 'hello', start: 5, end: 6 },
      ],
    };
    const out = extractLyrics(document);
    expect(out).toEqual(['hello']);
    expect(document.lines).toHaveLength(1);
    expect(document.lines[0].start).toBeCloseTo(4.45, 10);
  });

  it('clamps the timing offset at zero', () => {
    const document: LyricsDocument = {
      type: 'Line',
      lines: [{ text: 'early', start: 0.2, end: 1 }],
    };
    extractLyrics(document);
    expect(document.lines[0].start).toBe(0);
  });

  it('strips decorative punctuation and normalizes static lines', () => {
    const document: LyricsDocument = {
      type: 'Static',
      lines: [{ text: '「hello」, world!' }, { text: '  ' }],
    };
    const out = extractLyrics(document);
    expect(out).toEqual(['hello world']);
  });

  it('returns an empty array for a document with no lines', () => {
    expect(extractLyrics({ type: 'Line', lines: [] })).toEqual([]);
    expect(extractLyrics({ type: 'Static', lines: [] })).toEqual([]);
  });
});
