/**
 * Gemini (Google GenAI) provider for Amai Lyrics.
 *
 * Owns the GenAI SDK loading, the generation config, and the two Gemini calls
 * (translation + phonetic generation). Nothing here is imported outside the ai
 * facade; the rest of the app speaks to ../ai instead.
 *
 * Both providers are key-agnostic adapters behind the EnhancementPolicy seam:
 * the policy reads settings once and passes key + config in. SDK setup
 * failures throw so the policy can fall back to Amai (this replaces the
 * legacy `'Fetch Error'` substring sniffed out of `Info`, which likewise only
 * fired on setup failures — per-request errors were retried, then swallowed).
 * Malformed responses and per-request failures resolve to []: applied as a
 * no-op, with no fallback and no user-visible message, same as the legacy
 * behaviour. The policy owns the user-visible `Info` message; nothing here
 * touches `LyricsData`.
 */

import type { GenerateContentConfig, Schema, Type } from '@google/genai';

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
 * Fetches translations using Gemini AI. Resolves to [] when the key is
 * missing or the request fails — the policy treats empty as "try Amai".
 */
export async function fetchGeminiTranslations(
  lyricsOnly: string[],
  prompt: string,
  apiKey: string,
  systemInstruction: string,
): Promise<string[]> {
  try {
    console.log('[Amai Lyrics] Translation fetch started');

    if (!apiKey) {
      console.error('Amai Lyrics: Gemini API Key missing for translation');
      return [];
    }

    const { GoogleGenAI } = await loadGenAI();
    const ai = new GoogleGenAI({ apiKey });
    const generationConfig = buildGeminiConfig(systemInstruction, 0.85);
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
 * Fetches phonetic (furigana / romaji / romaja) lines using Gemini AI.
 *
 * Throws on SDK setup failure so the policy can fall back to Amai (this
 * replaces the legacy `'Fetch Error'` substring sniffed out of `Info`, which
 * likewise only fired on setup failures). Per-request errors are retried,
 * then resolve to [] — applied as a no-op, with no fallback and no
 * user-visible message, same as the legacy behaviour.
 */
export async function fetchGeminiPhonetic(
  lyricsOnly: string[],
  prompt: string,
  systemInstruction: string,
  apiKey: string,
): Promise<string[]> {
  if (!apiKey || lyricsOnly.length === 0) return [];

  const { GoogleGenAI } = await loadGenAI();
  const ai = new GoogleGenAI({ apiKey });

  const generationConfig = buildGeminiConfig(systemInstruction, 0.258);

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

  return lines ?? [];
}
