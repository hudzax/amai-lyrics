import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock heavy dependencies that pull Spicetify at import time
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
// Mock Spicetify global before importing processing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Spicetify = {
  Player: {
    data: { item: { uri: 'spotify:track:123', metadata: {} } },
    origin: { _state: {} },
    isPlaying: () => false,
  },
  Platform: { History: { location: { pathname: '/' } } },
  LocalStorage: { get: () => null, set: () => {}, remove: () => {} },
  showNotification: () => {},
};

describe('processPhoneticText', () => {
  let processPhoneticText: (text: string, enableRomaji: boolean) => string;

  beforeAll(async () => {
    const mod = await import('../src/utils/Lyrics/processing');
    processPhoneticText = mod.processPhoneticText;
  });

  it('converts furigana {hira} to ruby', async () => {
    const input = '漢字{かんじ}';
    const out = processPhoneticText(input, false);
    expect(out).toBe('<ruby>漢字<rt>かんじ</rt></ruby>');
  });

  it('converts romaji {romaji} to ruby when enableRomaji true', async () => {
    const input = '東京{tokyo}';
    const out = processPhoneticText(input, true);
    expect(out).toContain('<ruby>');
    expect(out).toContain('<rt>');
    expect(out).toContain('tokyo');
  });

  it('handles Korean romaja', async () => {
    const input = '한글{hangeul}';
    const out = processPhoneticText(input, false);
    expect(out).toContain('class="romaja"');
    expect(out).toContain('hangeul');
  });

  it('returns plain text unchanged when no patterns', async () => {
    const input = 'hello world';
    expect(processPhoneticText(input, false)).toBe('hello world');
    expect(processPhoneticText(input, true)).toBe('hello world');
  });

  it('caches results', async () => {
    const input = 'テスト{てすと}';
    const a = processPhoneticText(input, false);
    const b = processPhoneticText(input, false);
    expect(a).toBe(b);
  });
});
