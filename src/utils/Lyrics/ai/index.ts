/**
 * AI integration facade for Amai Lyrics (Gemini + Amai Worker).
 *
 * Owns the orchestration policy — which backend serves a request and how it
 * falls back — while the provider implementations live in ./gemini and ./amai.
 * This is the only AI module the rest of the app imports.
 */

import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';
import { LyricsData, updateLyricsWithText } from '../conversion';
import { fetchAmaiPhonetic, fetchAmaiTranslations } from './amai';
import { fetchGeminiTranslations, processLyricsUsingGemini } from './gemini';

/**
 * Gets phonetic lyrics based on detected language
 */
export async function fetchPhoneticLyrics(
  lyricsJson: LyricsData,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<LyricsData> {
  if (hasKanji) {
    if (storage.get('enable_romaji') === 'true') {
      return await generateRomajiLyrics(lyricsJson, lyricsOnly);
    } else {
      return await generateFuriganaLyrics(lyricsJson, lyricsOnly);
    }
  } else if (hasKorean) {
    return await generateRomajaLyrics(lyricsJson, lyricsOnly);
  } else {
    return lyricsJson;
  }
}

/**
 * Fetches translations, prioritizing Gemini if an API key is set, and falling back to Amai.
 *
 * @param lyricsOnly An array of strings representing the lyrics to be translated.
 * @returns A promise that resolves to an array of translated strings.
 */
export async function fetchLyricTranslations(lyricsOnly: string[]): Promise<string[]> {
  if (storage.get('disable_translation') === 'true') {
    console.log('[Amai Lyrics] Translation disabled');
    return lyricsOnly.map(() => '');
  }

  const targetLang =
    storage.get('translation_language')?.toString() || Defaults.translationLanguage;
  const prompt = buildTranslationPrompt(targetLang);

  const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
  if (geminiApiKey && geminiApiKey.trim() !== '') {
    console.log('[Amai Lyrics] Using Gemini for translations');
    const geminiTranslations = await fetchGeminiTranslations(lyricsOnly, prompt);
    if (geminiTranslations.length > 0 && geminiTranslations.some((line) => line.trim() !== '')) {
      return geminiTranslations;
    }
    console.log('[Amai Lyrics] Gemini failed, falling back to Amai API for translations');
  }

  // Try fetching from Amai
  const amaiTranslations = await fetchAmaiTranslations(lyricsOnly, prompt);
  if (amaiTranslations.length > 0 && amaiTranslations.some((line) => line.trim() !== '')) {
    return amaiTranslations;
  }

  // Fallback to Gemini (this will trigger missing key or empty strings)
  return await fetchGeminiTranslations(lyricsOnly, prompt);
}

/**
 * Creates a translation prompt for Gemini
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
 * Generates furigana for Japanese lyrics
 */
async function generateFuriganaLyrics(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsUsingPrompt(lyricsJson, lyricsOnly, Defaults.furiganaPrompt);
}

/**
 * Generates romaja for Korean lyrics
 */
async function generateRomajaLyrics(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsUsingPrompt(lyricsJson, lyricsOnly, Defaults.romajaPrompt);
}

/**
 * Generates romaji for Japanese lyrics
 */
async function generateRomajiLyrics(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsUsingPrompt(lyricsJson, lyricsOnly, Defaults.romajiPrompt);
}

/**
 * Generic function to generate lyrics with a specific prompt
 */
async function generateLyricsUsingPrompt(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
  prompt: string,
): Promise<LyricsData> {
  const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();

  if (geminiApiKey && geminiApiKey.trim() !== '') {
    console.log('[Amai Lyrics] Using Gemini for phonetic lyrics');
    const resultJson = await processLyricsUsingGemini(
      lyricsJson,
      lyricsOnly,
      Defaults.systemInstruction,
      prompt,
    );

    // Fall back to Amai if Gemini encountered a fetch error
    if (resultJson.Info && resultJson.Info.includes('Fetch Error')) {
      console.log('[Amai Lyrics] Gemini failed, falling back to Amai API for phonetic lyrics');
      const errorMsg = resultJson.Info;
      resultJson.Info = undefined;

      const amaiLines = await fetchAmaiPhonetic(lyricsOnly, prompt);
      if (amaiLines.length > 0 && amaiLines.some((line) => line.trim() !== '')) {
        updateLyricsWithText(resultJson, amaiLines);
      } else {
        resultJson.Info = errorMsg; // Restore error if Amai also fails
      }
    }
    return resultJson;
  }

  // Try fetching from Amai first if no Gemini key is set
  const amaiLines = await fetchAmaiPhonetic(lyricsOnly, prompt);
  if (amaiLines.length > 0 && amaiLines.some((line) => line.trim() !== '')) {
    updateLyricsWithText(lyricsJson, amaiLines);
    return lyricsJson;
  }

  // Fallback to Gemini
  console.log('[Amai Lyrics] Falling back to Gemini for phonetic lyrics');
  if (!(await verifyGeminiAPIKey(lyricsJson))) {
    return lyricsJson;
  }

  return await processLyricsUsingGemini(lyricsJson, lyricsOnly, Defaults.systemInstruction, prompt);
}

/**
 * Checks if Gemini API key is available
 */
async function verifyGeminiAPIKey(lyricsJson: LyricsData): Promise<boolean> {
  const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
  if (!geminiApiKey || geminiApiKey === '') {
    console.error('Amai Lyrics: Gemini API Key missing');
    lyricsJson.Info = 'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';
    return false;
  }
  return true;
}
