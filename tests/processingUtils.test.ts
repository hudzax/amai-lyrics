import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));
vi.mock('../src/components/Global/Defaults', () => ({
  default: {
    CurrentLyricsType: 'None',
    LyricsContainerExists: false,
    translationFontSize: '0.575',
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
  attachTranslations,
  prepareLyricsForGemini,
  extractLyrics,
} from '../src/utils/Lyrics/processing';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('detectLanguages', () => {
  it('detects Japanese kanji in line lyrics', () => {
    const result = detectLanguages({
      Type: 'Line',
      Content: [
        { Text: 'hello', StartTime: 0, EndTime: 1 },
        { Text: '漢字テスト', StartTime: 1, EndTime: 2 },
      ],
    } as never);
    expect(result).toEqual({ hasKanji: true, hasKorean: false });
  });

  it('detects Korean in static lyrics', () => {
    const result = detectLanguages({
      Type: 'Static',
      Lines: [{ Text: '한글 가사' }],
    } as never);
    expect(result).toEqual({ hasKanji: false, hasKorean: true });
  });

  it('detects both languages and returns false for plain English', () => {
    expect(
      detectLanguages({
        Type: 'Line',
        Content: [{ Text: '漢字 and 한글', StartTime: 0, EndTime: 1 }],
      } as never),
    ).toEqual({ hasKanji: true, hasKorean: true });
    expect(
      detectLanguages({ Type: 'Static', Lines: [{ Text: 'plain english' }] } as never),
    ).toEqual({ hasKanji: false, hasKorean: false });
  });

  it('returns false flags for empty or unknown shapes', () => {
    expect(detectLanguages({ Type: 'Line', Content: [] } as never)).toEqual({
      hasKanji: false,
      hasKorean: false,
    });
    expect(detectLanguages({ Type: 'Static' } as never)).toEqual({
      hasKanji: false,
      hasKorean: false,
    });
  });
});

describe('attachTranslations', () => {
  it('attaches translations to line content by index', () => {
    const data = {
      Type: 'Line',
      Content: [
        { Text: 'one', StartTime: 0, EndTime: 1 },
        { Text: 'two', StartTime: 1, EndTime: 2 },
      ],
    } as never;
    attachTranslations(data, ['uno', 'dos']);
    expect(data.Content[0].Translation).toBe('uno');
    expect(data.Content[1].Translation).toBe('dos');
  });

  it('defaults missing translations to empty string', () => {
    const data = {
      Type: 'Line',
      Content: [{ Text: 'one', StartTime: 0, EndTime: 1 }],
    } as never;
    attachTranslations(data, []);
    expect(data.Content[0].Translation).toBe('');
  });

  it('attaches translations to static lines', () => {
    const data = { Type: 'Static', Lines: [{ Text: 'a' }, { Text: 'b' }] } as never;
    attachTranslations(data, ['ta', 'tb']);
    expect(data.Lines[0].Translation).toBe('ta');
    expect(data.Lines[1].Translation).toBe('tb');
  });
});

describe('prepareLyricsForGemini', () => {
  it('extracts lyricsOnly and stores them as Raw', () => {
    const data = {
      Type: 'Static',
      Lines: [{ Text: 'first' }, { Text: 'second' }],
    } as never;
    const { lyricsJson, lyricsOnly } = prepareLyricsForGemini(data);
    expect(lyricsOnly).toEqual(['first', 'second']);
    expect(lyricsJson.Raw).toEqual(['first', 'second']);
  });
});

describe('extractLyrics', () => {
  it('removes empty lines and offsets start times for line lyrics', () => {
    const data = {
      Type: 'Line',
      Content: [
        { Text: '   ', StartTime: 5, EndTime: 6 },
        { Text: 'hello', StartTime: 5, EndTime: 6 },
      ],
    } as never;
    const out = extractLyrics(data);
    expect(out).toEqual(['hello']);
    expect(data.Content).toHaveLength(1);
    expect(data.Content[0].StartTime).toBeCloseTo(4.45, 10);
  });

  it('clamps the timing offset at zero', () => {
    const data = {
      Type: 'Line',
      Content: [{ Text: 'early', StartTime: 0.2, EndTime: 1 }],
    } as never;
    extractLyrics(data);
    expect(data.Content[0].StartTime).toBe(0);
  });

  it('strips decorative punctuation and normalizes static lines', () => {
    const data = {
      Type: 'Static',
      Lines: [{ Text: '「hello」, world!' }, { Text: '  ' }],
    } as never;
    const out = extractLyrics(data);
    expect(out).toEqual(['hello world']);
  });

  it('returns empty array for unknown shapes', () => {
    expect(extractLyrics({ Type: 'Line' } as never)).toEqual([]);
    expect(extractLyrics({ Type: 'Static' } as never)).toEqual([]);
  });
});
