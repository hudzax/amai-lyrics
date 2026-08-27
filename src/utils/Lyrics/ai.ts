/**
 * AI integration functions for Amai Lyrics (Gemini API)
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import type { GenerateContentConfig, Schema, Type } from '@google/genai';
import { LyricsData } from './processing';
import { LineBasedLyricItem, LyricsLine } from './conversion';

type GenAILoader = typeof import('@google/genai');
let genAIModulePromise: Promise<GenAILoader> | null = null;
function loadGenAI(): Promise<GenAILoader> {
  if (!genAIModulePromise) genAIModulePromise = import('@google/genai');
  return genAIModulePromise;
}

/**
 * AI Model Constants
 */
const AI_MODELS = {
  TRANSLATION: 'gemini-flash-lite-latest',
  PHONETIC: 'gemini-flash-lite-latest',
} as const;

interface GeminiGenerationConfig extends GenerateContentConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: 8192;
  responseModalities: string[]; // Assuming modalities are strings, or can be more specific if the API defines it.
  responseMimeType: 'application/json';
  responseSchema: {
    type: Type.OBJECT;
    properties: {
      lines: Schema;
    };
  };
  systemInstruction: string;
  thinkingConfig: {
    thinkingBudget: number;
  };
}

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
 * Shared helper for Amai Worker calls — single timeout/abort/error path.
 */
async function fetchFromAmai(
  url: string,
  body: Record<string, unknown>,
  resultKey: 'translation' | 'phonetic',
): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return (data[resultKey] as string[]) || [];
  } catch (error) {
    console.error(`Error fetching ${resultKey} from Amai Worker:`, error);
    return [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Fetches translations from the Amai Worker API.
 */
export async function fetchAmaiTranslations(
  lyricsOnly: string[],
  prompt: string,
): Promise<string[]> {
  return fetchFromAmai(
    Defaults.lyrics.api.translationUrl,
    { lyrics: lyricsOnly, prompt },
    'translation',
  );
}

/**
 * Fetches phonetic lyrics from the Amai Worker API.
 */
export async function fetchAmaiPhonetic(lyricsOnly: string[], prompt: string): Promise<string[]> {
  return fetchFromAmai(Defaults.lyrics.api.phoneticUrl, { lyrics: lyricsOnly, prompt }, 'phonetic');
}

/**
 * Fetches translations using Gemini AI
 */
export async function fetchGeminiTranslations(
  lyricsOnly: string[],
  prompt: string,
): Promise<string[]> {
  try {
    console.log('[Amai Lyrics] Translation fetch started');

    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
    if (!geminiApiKey || geminiApiKey === '') {
      console.error('Amai Lyrics: Gemini API Key missing for translation');
      return lyricsOnly.map(() => '');
    }

    const { GoogleGenAI } = await loadGenAI();
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const generationConfig = buildGeminiConfig(Defaults.systemInstruction, 0.85);
    const response = await ai.models.generateContent({
      config: generationConfig,
      model: AI_MODELS.TRANSLATION,
      contents: `${prompt}${JSON.stringify(lyricsOnly)}`,
    });

    try {
      const translations = JSON.parse(response.text.replace(/\\n/g, ''));
      return translations.lines || lyricsOnly.map(() => '');
    } catch (parseError) {
      console.error('Amai Lyrics: Error parsing translation response', parseError);
      return lyricsOnly.map(() => '');
    }
  } catch (error) {
    console.error('Amai Lyrics: Translation fetch error', error);
    return [];
  }
}

/**
 * Creates a translation prompt for Gemini
 */
export function buildTranslationPrompt(targetLang: string): string {
  // Escape special regex characters in the target language
  const escapedLang = targetLang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    Defaults.translationPrompt.replace(/{language}/g, escapedLang) +
    ` Translate the following lyrics into ${targetLang}:\n`
  );
}

/**
 * Creates Gemini API configuration
 */
export function buildGeminiConfig(
  systemInstruction: string,
  temperature: number,
): GeminiGenerationConfig {
  return {
    temperature,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: [],
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'OBJECT' as unknown as Type.OBJECT,
      properties: {
        lines: {
          type: 'ARRAY' as unknown as Type.ARRAY,
          items: {
            type: 'STRING' as unknown as Type.STRING,
          },
        } as Schema,
      },
    },
    systemInstruction,
    thinkingConfig: {
      thinkingBudget: 1024,
    },
  };
}

/**
 * Generates furigana for Japanese lyrics
 */
export async function generateFuriganaLyrics(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsUsingPrompt(lyricsJson, lyricsOnly, Defaults.furiganaPrompt);
}

/**
 * Generates romaja for Korean lyrics
 */
export async function generateRomajaLyrics(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsUsingPrompt(lyricsJson, lyricsOnly, Defaults.romajaPrompt);
}

/**
 * Generates romaji for Japanese lyrics
 */
export async function generateRomajiLyrics(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsUsingPrompt(lyricsJson, lyricsOnly, Defaults.romajiPrompt);
}

/**
 * Generic function to generate lyrics with a specific prompt
 */
export async function generateLyricsUsingPrompt(
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
export async function verifyGeminiAPIKey(lyricsJson: LyricsData): Promise<boolean> {
  const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
  if (!geminiApiKey || geminiApiKey === '') {
    console.error('Amai Lyrics: Gemini API Key missing');
    lyricsJson.Info = 'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';
    return false;
  }
  return true;
}

/**
 * Processes lyrics with Gemini AI
 */
export async function processLyricsUsingGemini(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
  systemInstruction: string,
  prompt: string,
): Promise<LyricsData> {
  try {
    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();

    const { GoogleGenAI } = await loadGenAI();
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const generationConfig = buildGeminiConfig(systemInstruction, 0.258);

    if (lyricsOnly.length === 0) return lyricsJson;

    const makeRequest = async () => {
      const response = await ai.models.generateContent({
        config: generationConfig,
        model: AI_MODELS.PHONETIC,
        contents: `${prompt} Here are the lyrics:\n${JSON.stringify(lyricsOnly)}`,
      });
      return response.text;
    };

    let retries = 2;
    let lines: string[] | undefined;

    while (retries >= 0) {
      try {
        const responseText = await makeRequest();
        const parsed = JSON.parse(responseText.replace(/\\n/g, ''));
        if (parsed && Array.isArray(parsed.lines)) {
          lines = parsed.lines;
          break;
        } else {
          if (retries === 0) {
            console.error('Amai Lyrics: Invalid response format', parsed);
          }
        }
      } catch (err) {
        if (retries === 0) {
          console.error('Amai Lyrics: Error parsing response', err);
        }
      }
      retries--;
    }

    if (lines) {
      updateLyricsWithText(lyricsJson, lines);
    }
  } catch (error) {
    console.error('Amai Lyrics:', error);
    lyricsJson.Info =
      'Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.';
  }
  return lyricsJson;
}

/**
 * Updates lyrics text with processed text
 */
export function updateLyricsWithText(lyricsJson: LyricsData, lines: string[]): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content = lyricsJson.Content.map((item: LineBasedLyricItem, index: number) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines = lyricsJson.Lines.map((item: LyricsLine, index: number) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  }
}
