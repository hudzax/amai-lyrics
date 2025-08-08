/**
 * AI integration functions for Amai Lyrics (Gemini API)
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { GoogleGenAI, GenerateContentConfig, Schema, Type } from '@google/genai';
import { LyricsData } from './processing'; // Import LyricsData
import { LineBasedLyricItem, LyricsLine } from './conversion'; // Import LineBasedLyricItem and LyricsLine

/**
 * AI Model Constants
 */
const AI_MODELS = {
  TRANSLATION: 'gemini-2.5-flash-lite',
  PHONETIC: 'gemini-2.5-flash',
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
 * Fetches translations by first trying the Amai Worker API and falling back to Gemini.
 *
 * @param lyricsOnly An array of strings representing the lyrics to be translated.
 * @returns A promise that resolves to an array of translated strings.
 */
export async function fetchLyricTranslations(lyricsOnly: string[]): Promise<string[]> {
  if (storage.get('disable_translation') === 'true') {
    console.log('Amai Lyrics: Translation disabled');
    return lyricsOnly.map(() => '');
  }

  const targetLang =
    storage.get('translation_language')?.toString() || Defaults.translationLanguage;
  const prompt = buildTranslationPrompt(targetLang);

  // Try fetching from Amai first
  const amaiTranslations = await fetchAmaiTranslations(lyricsOnly, prompt);
  if (amaiTranslations.length > 0 && amaiTranslations.some((line) => line.trim() !== '')) {
    console.log('Amai Lyrics: Translations fetched from Amai API');
    return amaiTranslations;
  }

  // Fallback to Gemini
  console.log('Amai Lyrics: Falling back to Gemini for translations');
  return await fetchGeminiTranslations(lyricsOnly, prompt);
}

/**
 * Fetches translations from the Amai Worker API.
 *
 * @param lyricsOnly An array of strings representing the lyrics to be translated.
 * @param prompt The translation prompt to use.
 * @returns A promise that resolves to an array of translated strings.
 */
export async function fetchAmaiTranslations(
  lyricsOnly: string[],
  prompt: string,
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    const response = await fetch(Defaults.lyrics.api.translationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lyrics: lyricsOnly,
        prompt: prompt,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translation || [];
  } catch (error) {
    console.error('Error fetching translations from Amai Worker:', error);
    return [];
  }
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
      type: Type.OBJECT,
      properties: {
        lines: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        } as Schema, // Cast to Schema
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
