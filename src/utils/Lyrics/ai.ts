/**
 * AI integration functions for Amai Lyrics (Gemini API)
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { GoogleGenAI, GenerateContentConfig, Schema, Type } from '@google/genai';
import { LyricsData } from './processing'; // Import LyricsData
import { LineBasedLyricItem, LyricsLine } from './conversion'; // Import LineBasedLyricItem and LyricsLine

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
export async function getPhoneticLyrics(
  lyricsJson: LyricsData,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<LyricsData> {
  if (hasKanji) {
    if (storage.get('enable_romaji') === 'true') {
      return await generateRomaji(lyricsJson, lyricsOnly);
    } else {
      return await generateFurigana(lyricsJson, lyricsOnly);
    }
  } else if (hasKorean) {
    return await generateRomaja(lyricsJson, lyricsOnly);
  } else {
    return lyricsJson;
  }
}

/**
 * Fetches translations using Gemini AI
 */
export async function fetchTranslationsWithGemini(lyricsOnly: string[]): Promise<string[]> {
  if (storage.get('disable_translation') === 'true') {
    console.log('Amai Lyrics: Translation disabled');
    return lyricsOnly.map(() => '');
  }

  try {
    console.log('[Amai Lyrics] Translation fetch started');

    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
    if (!geminiApiKey || geminiApiKey === '') {
      console.error('Amai Lyrics: Gemini API Key missing for translation');
      return lyricsOnly.map(() => '');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const generationConfig = createGeminiConfig(Defaults.systemInstruction, 0.85);

    const targetLang =
      storage.get('translation_language')?.toString() || Defaults.translationLanguage;

    const prompt = createTranslationPrompt(targetLang);

    const response = await ai.models.generateContent({
      config: generationConfig,
      model: 'gemini-2.5-flash-preview-04-17',
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
export function createTranslationPrompt(targetLang: string): string {
  return (
    Defaults.translationPrompt.replace(/{language}/g, targetLang) +
    ` Translate the following lyrics into ${targetLang}:\n`
  );
}

/**
 * Creates Gemini API configuration
 */
export function createGeminiConfig(
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
export async function generateFurigana(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsWithPrompt(lyricsJson, lyricsOnly, Defaults.furiganaPrompt);
}

/**
 * Generates romaja for Korean lyrics
 */
export async function generateRomaja(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsWithPrompt(lyricsJson, lyricsOnly, Defaults.romajaPrompt);
}

/**
 * Generates romaji for Japanese lyrics
 */
export async function generateRomaji(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsWithPrompt(lyricsJson, lyricsOnly, Defaults.romajiPrompt);
}

/**
 * Generic function to generate lyrics with a specific prompt
 */
export async function generateLyricsWithPrompt(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
  prompt: string,
): Promise<LyricsData> {
  if (!(await checkGeminiAPIKey(lyricsJson))) {
    return lyricsJson;
  }

  return await processLyricsWithGemini(lyricsJson, lyricsOnly, Defaults.systemInstruction, prompt);
}

/**
 * Checks if Gemini API key is available
 */
export async function checkGeminiAPIKey(lyricsJson: LyricsData): Promise<boolean> {
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
export async function processLyricsWithGemini(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
  systemInstruction: string,
  prompt: string,
): Promise<LyricsData> {
  try {
    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const generationConfig = createGeminiConfig(systemInstruction, 0.258);

    if (lyricsOnly.length === 0) return lyricsJson;

    const makeRequest = async () => {
      const response = await ai.models.generateContent({
        config: generationConfig,
        model: 'gemini-2.5-flash-preview-05-20',
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
      updateLyricsText(lyricsJson, lines);
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
export function updateLyricsText(lyricsJson: LyricsData, lines: string[]): void {
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
