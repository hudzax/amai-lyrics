import { describe, it, expect, vi, beforeEach } from 'vitest';

// Controllable settings snapshot: key, romaji flag, translation flag, language.
// Unset names fall through to the real decoder, so the module's own defaults
// are what the enhancement sees unless a test overrides them.
const { settingsStore } = vi.hoisted(() => ({ settingsStore: {} as Record<string, unknown> }));

vi.mock('../src/utils/settingsValues', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/settingsValues')>();
  return {
    default: {
      get: vi.fn((name: string) =>
        name in settingsStore ? settingsStore[name] : actual.default.get(name as never),
      ),
      set: vi.fn(),
    },
  };
});

vi.mock('../src/components/Global/Defaults', () => ({
  default: {
    translationLanguage: 'English',
    translationPrompt: 'Translate into {language}:',
    systemInstruction: 'SYS',
    furiganaPrompt: 'FURIGANA-PROMPT',
    romajiPrompt: 'ROMAJI-PROMPT',
    romajaPrompt: 'ROMAJA-PROMPT',
  },
}));

// Currency is publish's job; here it is a controllable stub.
vi.mock('../src/utils/Lyrics/publish', () => ({
  isCurrentLyricsRequest: vi.fn(() => true),
}));

import settingsValues from '../src/utils/settingsValues';
import { isCurrentLyricsRequest } from '../src/utils/Lyrics/publish';
import { enhanceLyrics, type EnhancementProviders } from '../src/utils/Lyrics/ai';
import type { LyricsDocument } from '../src/utils/Lyrics/conversion';

const FETCH_ERROR_INFO =
  'Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.';
const MISSING_KEY_INFO = 'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';

function lineData(texts: string[]): LyricsDocument {
  return {
    type: 'Line',
    lines: texts.map((text, i) => ({ text, start: i, end: i + 1 })),
  };
}

function staticData(texts: string[]): LyricsDocument {
  return { type: 'Static', lines: texts.map((text) => ({ text })) };
}

/** Fake providers; every slot records calls and resolves per-test values. */
function fakes(): EnhancementProviders & {
  [K in keyof EnhancementProviders]: ReturnType<typeof vi.fn>;
} {
  return {
    fetchGeminiPhonetic: vi.fn(async () => []),
    fetchGeminiTranslations: vi.fn(async () => []),
    fetchAmaiPhonetic: vi.fn(async () => []),
    fetchAmaiTranslations: vi.fn(async () => []),
  } as unknown as EnhancementProviders & {
    [K in keyof EnhancementProviders]: ReturnType<typeof vi.fn>;
  };
}

function settings(map: Record<string, unknown>): void {
  for (const name of Object.keys(settingsStore)) delete settingsStore[name];
  Object.assign(settingsStore, map);
}

const KEY = { geminiApiKey: 'test-key' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isCurrentLyricsRequest).mockReturnValue(true);
  settings({});
});

describe('phonetic backend selection', () => {
  it('uses Gemini with the romaji prompt when the key is set and romaji is on', async () => {
    settings({ ...KEY, enableRomaji: true });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockResolvedValue(['r1', 'r2']);
    providers.fetchGeminiTranslations.mockResolvedValue(['t1', 't2']);

    const data = lineData(['l1', 'l2']);
    const result = await enhanceLyrics(
      data,
      ['l1', 'l2'],
      { hasKanji: true, hasKorean: false },
      1,
      providers,
    );

    expect(result).not.toBeNull();
    expect(providers.fetchGeminiPhonetic).toHaveBeenCalledWith(['l1', 'l2'], 'ROMAJI-PROMPT');
    expect(providers.fetchAmaiPhonetic).not.toHaveBeenCalled();
    expect(data.lines[0].text).toBe('r1');
    expect(data.info).toBeUndefined();
  });

  it('uses the furigana prompt when romaji is off', async () => {
    settings({ ...KEY, enableRomaji: false });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockResolvedValue(['f1']);

    await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: true, hasKorean: false },
      1,
      providers,
    );

    expect(providers.fetchGeminiPhonetic).toHaveBeenCalledWith(['l1'], 'FURIGANA-PROMPT');
  });

  it('uses the romaja prompt for Korean lyrics', async () => {
    settings({ ...KEY });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockResolvedValue(['rj1']);

    await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: false, hasKorean: true },
      1,
      providers,
    );

    expect(providers.fetchGeminiPhonetic).toHaveBeenCalledWith(['l1'], 'ROMAJA-PROMPT');
  });

  it('skips phonetics entirely when neither flag is set', async () => {
    settings({ ...KEY });
    const providers = fakes();
    providers.fetchGeminiTranslations.mockResolvedValue(['t1']);

    const result = await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: false, hasKorean: false },
      1,
      providers,
    );

    expect(providers.fetchGeminiPhonetic).not.toHaveBeenCalled();
    expect(providers.fetchAmaiPhonetic).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it('falls back to Amai when Gemini setup throws, with no Info set', async () => {
    settings({ ...KEY, enableRomaji: true });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockRejectedValue(new Error('sdk load failed'));
    providers.fetchAmaiPhonetic.mockResolvedValue(['a1']);
    providers.fetchGeminiTranslations.mockResolvedValue(['t1']);

    const data = lineData(['l1']);
    await enhanceLyrics(data, ['l1'], { hasKanji: true, hasKorean: false }, 1, providers);

    expect(providers.fetchAmaiPhonetic).toHaveBeenCalledWith(['l1'], 'ROMAJI-PROMPT');
    expect(data.lines[0].text).toBe('a1');
    expect(data.info).toBeUndefined();
  });

  it('sets the fetch-error Info when Gemini throws and Amai yields nothing', async () => {
    settings({ ...KEY, enableRomaji: true });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockRejectedValue(new Error('sdk load failed'));
    providers.fetchAmaiPhonetic.mockResolvedValue([]);
    providers.fetchGeminiTranslations.mockResolvedValue([]);

    const data = lineData(['l1']);
    await enhanceLyrics(data, ['l1'], { hasKanji: true, hasKorean: false }, 1, providers);

    expect(data.info).toBe(FETCH_ERROR_INFO);
  });

  it('applies malformed Gemini output as a no-op with no Amai fallback and no Info', async () => {
    settings({ ...KEY, enableRomaji: true });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockResolvedValue([]);
    providers.fetchGeminiTranslations.mockResolvedValue(['t1']);

    const data = lineData(['l1']);
    await enhanceLyrics(data, ['l1'], { hasKanji: true, hasKorean: false }, 1, providers);

    expect(data.lines[0].text).toBe('l1');
    expect(providers.fetchAmaiPhonetic).not.toHaveBeenCalled();
    expect(data.info).toBeUndefined();
  });

  it('tries Amai first without a key and never touches Gemini phonetics', async () => {
    settings({});
    const providers = fakes();
    providers.fetchAmaiPhonetic.mockResolvedValue(['a1']);
    providers.fetchGeminiTranslations.mockResolvedValue([]);

    const data = lineData(['l1']);
    await enhanceLyrics(data, ['l1'], { hasKanji: true, hasKorean: false }, 1, providers);

    expect(providers.fetchAmaiPhonetic).toHaveBeenCalled();
    expect(providers.fetchGeminiPhonetic).not.toHaveBeenCalled();
    expect(data.lines[0].text).toBe('a1');
    expect(data.info).toBeUndefined();
  });

  it('sets the missing-key Info when keyless Amai yields nothing', async () => {
    settings({});
    const providers = fakes();
    providers.fetchAmaiPhonetic.mockResolvedValue([]);
    providers.fetchAmaiTranslations.mockResolvedValue([]);

    const data = lineData(['l1']);
    await enhanceLyrics(data, ['l1'], { hasKanji: true, hasKorean: false }, 1, providers);

    expect(providers.fetchGeminiPhonetic).not.toHaveBeenCalled();
    expect(data.info).toBe(MISSING_KEY_INFO);
  });
});

describe('translation fallback chain', () => {
  it('returns blanks with no network when translations are disabled', async () => {
    settings({ ...KEY, disableTranslation: true });
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockResolvedValue(['r1']);

    const data = lineData(['l1']);
    const result = await enhanceLyrics(
      data,
      ['l1'],
      { hasKanji: true, hasKorean: false },
      1,
      providers,
    );

    expect(providers.fetchGeminiTranslations).not.toHaveBeenCalled();
    expect(providers.fetchAmaiTranslations).not.toHaveBeenCalled();
    expect(data.lines[0].translation).toBe('');
    expect(result).not.toBeNull();
  });

  it('prefers Gemini translations and skips Amai when usable', async () => {
    settings({ ...KEY });
    const providers = fakes();
    providers.fetchGeminiTranslations.mockResolvedValue(['g1', '']);

    const data = lineData(['l1', 'l2']);
    await enhanceLyrics(data, ['l1', 'l2'], { hasKanji: false, hasKorean: false }, 1, providers);

    expect(providers.fetchAmaiTranslations).not.toHaveBeenCalled();
    expect(data.lines[0].translation).toBe('g1');
    expect(data.lines[1].translation).toBe('');
  });

  it('falls back to Amai when Gemini translations are blank, then to Gemini last resort', async () => {
    settings({ ...KEY });
    const providers = fakes();
    providers.fetchGeminiTranslations
      .mockResolvedValueOnce(['', '']) // first attempt: unusable
      .mockResolvedValueOnce(['last', 'resort']); // last resort
    providers.fetchAmaiTranslations.mockResolvedValue(['', '']);

    const data = lineData(['l1', 'l2']);
    await enhanceLyrics(data, ['l1', 'l2'], { hasKanji: false, hasKorean: false }, 1, providers);

    expect(providers.fetchAmaiTranslations).toHaveBeenCalledTimes(1);
    expect(providers.fetchGeminiTranslations).toHaveBeenCalledTimes(2);
    expect(data.lines[0].translation).toBe('last');
  });

  it('builds the prompt from the configured language', async () => {
    settings({ ...KEY, translationLanguage: 'Spanish' });
    const providers = fakes();
    providers.fetchGeminiTranslations.mockResolvedValue(['s1']);

    await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: false, hasKorean: false },
      1,
      providers,
    );

    expect(providers.fetchGeminiTranslations).toHaveBeenCalledWith(
      ['l1'],
      expect.stringContaining('Spanish'),
    );
  });

  it('attaches short translation arrays with empty-string gaps', async () => {
    settings({ ...KEY });
    const providers = fakes();
    providers.fetchGeminiTranslations.mockResolvedValue(['only-first']);

    const data = lineData(['l1', 'l2']);
    await enhanceLyrics(data, ['l1', 'l2'], { hasKanji: false, hasKorean: false }, 1, providers);

    expect(data.lines[0].translation).toBe('only-first');
    expect(data.lines[1].translation).toBe('');
  });

  it('attaches translations to static payloads', async () => {
    settings({ ...KEY });
    const providers = fakes();
    providers.fetchGeminiTranslations.mockResolvedValue(['ta', 'tb']);

    const data = staticData(['a', 'b']);
    await enhanceLyrics(data, ['a', 'b'], { hasKanji: false, hasKorean: false }, 1, providers);

    expect(data.lines[0].translation).toBe('ta');
    expect(data.lines[1].translation).toBe('tb');
  });
});

describe('staleness', () => {
  it('returns null without touching providers when the token is already stale', async () => {
    settings({ ...KEY });
    vi.mocked(isCurrentLyricsRequest).mockReturnValue(false);
    const providers = fakes();

    const result = await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: true, hasKorean: false },
      99,
      providers,
    );

    expect(result).toBeNull();
    expect(providers.fetchGeminiPhonetic).not.toHaveBeenCalled();
    expect(providers.fetchGeminiTranslations).not.toHaveBeenCalled();
    expect(providers.fetchAmaiPhonetic).not.toHaveBeenCalled();
    expect(providers.fetchAmaiTranslations).not.toHaveBeenCalled();
  });

  it('returns null when the token goes stale mid-flight', async () => {
    settings({ ...KEY });
    vi.mocked(isCurrentLyricsRequest)
      .mockReturnValueOnce(true) // enhanceLyrics entry
      .mockReturnValue(false); // every check after
    const providers = fakes();
    providers.fetchGeminiPhonetic.mockResolvedValue(['r1']);
    providers.fetchGeminiTranslations.mockResolvedValue(['t1']);

    const result = await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: true, hasKorean: false },
      1,
      providers,
    );

    expect(result).toBeNull();
  });
});

describe('settings snapshot', () => {
  it('reads key, romaji, translation flag and language once per call', async () => {
    settings({ ...KEY, enableRomaji: true });
    const providers = fakes();

    await enhanceLyrics(
      lineData(['l1']),
      ['l1'],
      { hasKanji: false, hasKorean: false },
      1,
      providers,
    );

    for (const name of [
      'geminiApiKey',
      'enableRomaji',
      'disableTranslation',
      'translationLanguage',
    ]) {
      expect(vi.mocked(settingsValues.get)).toHaveBeenCalledWith(name);
    }
  });
});
