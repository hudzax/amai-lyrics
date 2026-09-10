/**
 * Gemini (Google GenAI) provider for Amai Lyrics.
 *
 * Owns the GenAI SDK loading, the generation config, and the two Gemini calls
 * (translation + phonetic generation). Nothing here is imported outside the ai
 * facade; the rest of the app speaks to ../ai instead.
 */

import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';
import type { GenerateContentConfig, Schema, Type } from '@google/genai';
import { LyricsData, updateLyricsWithText } from '../conversion';

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
 * Creates Gemini API configuration
 */
function buildGeminiConfig(systemInstruction: string, temperature: number): GeminiGenerationConfig {
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
