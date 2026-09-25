/**
 * EnhancementPolicy for Amai Lyrics (Gemini + Amai Worker).
 *
 * The single place that turns prepared lyrics into enhanced lyrics: backend
 * selection, fallback order, prompt construction, mutation, and the
 * user-visible error message. Callers cross it through `enhanceLyrics` —
 * never through the Gemini/Amai providers directly.
 *
 * Backend priority is Gemini-first with Amai fallback in both directions
 * (phonetics and translations), unchanged from the legacy orchestration.
 * Settings are read once per call so providers stay key-agnostic; the request
 * token is checked before each provider call so a superseded request stops
 * spending network work (publication still guards via `publishEnhancedLyrics`).
 */

import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';
import { LyricsDocument, updateLyricsWithText } from '../conversion';
import { isCurrentLyricsRequest, type LyricsRequestToken } from '../publish';
import { fetchAmaiPhonetic, fetchAmaiTranslations } from './amai';
import { fetchGeminiPhonetic, fetchGeminiTranslations } from './gemini';

/** One line-array provider: phonetic or translation lines for the given input. */
export type EnhancementLineProvider = (lines: string[], prompt: string) => Promise<string[]>;

/** The four provider slots the policy fans out to. All share one shape, so
 * Gemini and Amai are interchangeable adapters — and tests can inject fakes. */
export interface EnhancementProviders {
  fetchGeminiPhonetic: EnhancementLineProvider;
  fetchGeminiTranslations: EnhancementLineProvider;
  fetchAmaiPhonetic: EnhancementLineProvider;
  fetchAmaiTranslations: EnhancementLineProvider;
}

/** Language flags from `detectLanguages` — picks the phonetic prompt. */
export interface EnhancementFlags {
  hasKanji: boolean;
  hasKorean: boolean;
}

const FETCH_ERROR_INFO =
  'Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.';
const MISSING_KEY_INFO = 'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';

/** The legacy fallback convention: non-empty with at least one real line. */
function hasUsableLines(lines: string[]): boolean {
  return lines.length > 0 && lines.some((line) => line.trim() !== '');
}

/**
 * Attaches translations to lyrics lines by index, defaulting gaps to ''.
 */
function attachTranslations(document: LyricsDocument, translations: string[]): void {
  document.lines.forEach((line, idx: number) => {
    line.translation = translations[idx] || '';
  });
}

/**
 * Creates a translation prompt for the target language.
 */
function buildTranslationPrompt(targetLang: string): string {
  // Escape special regex characters in the target language
  const escapedLang = targetLang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    Defaults.translationPrompt.replace(/{language}/g, escapedLang) +
    ` Translate the following lyrics into ${targetLang}:\n`
  );
}

/**
 * Picks the phonetic prompt for the detected languages, or null when no
 * phonetics apply. Japanese honours the romaji toggle; Korean gets romaja.
 */
function selectPhoneticPrompt(flags: EnhancementFlags, enableRomaji: boolean): string | null {
  if (flags.hasKanji) {
    return enableRomaji ? Defaults.romajiPrompt : Defaults.furiganaPrompt;
  }
  if (flags.hasKorean) {
    return Defaults.romajaPrompt;
  }
  return null;
}

/**
 * Enhances prepared lyrics with phonetics and translations.
 *
 * Runs both phases in parallel (same as the legacy fan-out), mutates
 * `prepared` in place, and returns it — or null when the token went stale
 * mid-flight, in which case the caller must skip cache and publication.
 * Never throws for provider failures: they degrade to unenhanced lyrics
 * with a user-visible `Info` message where the legacy code set one.
 */
export async function enhanceLyrics(
  prepared: LyricsDocument,
  lyricsOnly: string[],
  flags: EnhancementFlags,
  token: LyricsRequestToken,
  providerOverrides: Partial<EnhancementProviders> = {},
): Promise<LyricsDocument | null> {
  // Read settings once so every branch below sees one consistent snapshot.
  const apiKey = (storage.get('GEMINI_API_KEY')?.toString() ?? '').trim();
  const hasKey = apiKey !== '';
  const enableRomaji = storage.get('enable_romaji') === 'true';
  const translationsDisabled = storage.get('disable_translation') === 'true';
  const targetLang =
    storage.get('translation_language')?.toString() || Defaults.translationLanguage;

  const providers: EnhancementProviders = {
    fetchGeminiPhonetic: (lines, prompt) =>
      fetchGeminiPhonetic(lines, prompt, Defaults.systemInstruction, apiKey),
    fetchGeminiTranslations: (lines, prompt) =>
      fetchGeminiTranslations(lines, prompt, apiKey, Defaults.systemInstruction),
    fetchAmaiPhonetic,
    fetchAmaiTranslations,
    ...providerOverrides,
  };

  const live = () => isCurrentLyricsRequest(token);
  if (!live()) return null;

  const phoneticPrompt = selectPhoneticPrompt(flags, enableRomaji);

  const [translations] = await Promise.all([
    enhanceTranslations(lyricsOnly, targetLang, translationsDisabled, hasKey, providers, live),
    enhancePhonetics(prepared, lyricsOnly, phoneticPrompt, hasKey, providers, live),
  ]);

  if (!live()) return null;

  attachTranslations(prepared, translations);
  return prepared;
}

/**
 * Phonetic phase: mutates `prepared.Text` via the key-first fallback chain.
 * With a key, Gemini setup failure falls back to Amai (replacing the legacy
 * `Info`-sniff); malformed Gemini output applies as a no-op with no fallback.
 * Without a key, Amai is tried first and a missing key message is set only
 * when Amai also yields nothing — same as the legacy behaviour.
 */
async function enhancePhonetics(
  prepared: LyricsDocument,
  lyricsOnly: string[],
  prompt: string | null,
  hasKey: boolean,
  providers: EnhancementProviders,
  live: () => boolean,
): Promise<void> {
  if (!prompt) return;

  if (hasKey) {
    console.log('[Amai Lyrics] Using Gemini for phonetic lyrics');
    if (!live()) return;
    try {
      const lines = await providers.fetchGeminiPhonetic(lyricsOnly, prompt);
      updateLyricsWithText(prepared, lines);
      return;
    } catch {
      console.log('[Amai Lyrics] Gemini failed, falling back to Amai API for phonetic lyrics');
    }
    if (!live()) return;
    const amaiLines = await providers.fetchAmaiPhonetic(lyricsOnly, prompt);
    if (hasUsableLines(amaiLines)) {
      updateLyricsWithText(prepared, amaiLines);
    } else {
      prepared.info = FETCH_ERROR_INFO;
    }
    return;
  }

  // No key: try Amai first, then Gemini (which reports the missing key).
  if (!live()) return;
  const amaiLines = await providers.fetchAmaiPhonetic(lyricsOnly, prompt);
  if (hasUsableLines(amaiLines)) {
    updateLyricsWithText(prepared, amaiLines);
    return;
  }

  console.log('[Amai Lyrics] Falling back to Gemini for phonetic lyrics');
  console.error('Amai Lyrics: Gemini API Key missing');
  prepared.info = MISSING_KEY_INFO;
}

/**
 * Translation phase: resolves the translation lines via the key-first
 * fallback chain (Gemini → Amai → Gemini last resort). Disabled translations
 * resolve to blanks with no network, same as the legacy behaviour.
 */
async function enhanceTranslations(
  lyricsOnly: string[],
  targetLang: string,
  disabled: boolean,
  hasKey: boolean,
  providers: EnhancementProviders,
  live: () => boolean,
): Promise<string[]> {
  if (disabled) {
    console.log('[Amai Lyrics] Translation disabled');
    return lyricsOnly.map(() => '');
  }

  const prompt = buildTranslationPrompt(targetLang);

  if (hasKey) {
    console.log('[Amai Lyrics] Using Gemini for translations');
    if (!live()) return [];
    const geminiTranslations = await providers.fetchGeminiTranslations(lyricsOnly, prompt);
    if (hasUsableLines(geminiTranslations)) {
      return geminiTranslations;
    }
    console.log('[Amai Lyrics] Gemini failed, falling back to Amai API for translations');
  }

  // Try fetching from Amai
  if (!live()) return [];
  const amaiTranslations = await providers.fetchAmaiTranslations(lyricsOnly, prompt);
  if (hasUsableLines(amaiTranslations)) {
    return amaiTranslations;
  }

  // Fallback to Gemini (this will trigger missing key or empty strings)
  if (!live()) return [];
  return await providers.fetchGeminiTranslations(lyricsOnly, prompt);
}
