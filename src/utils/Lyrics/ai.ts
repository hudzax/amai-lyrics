/**
 * AI integration functions for Amai Lyrics (Gemini API)
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { GoogleGenAI } from '@google/genai';

/**
 * Gets phonetic lyrics based on detected language
 */
export async function getPhoneticLyrics(
  lyricsJson: any,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<any> {
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
export async function fetchTranslationsWithGemini(
  lyricsOnly: string[],
): Promise<string[]> {
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

    const generationConfig = createGeminiConfig(
      Defaults.systemInstruction,
      0.85,
    );

    const targetLang =
      storage.get('translation_language')?.toString() ||
      Defaults.translationLanguage;

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
      console.error(
        'Amai Lyrics: Error parsing translation response',
        parseError,
      );
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
): any {
  return {
    temperature,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: [],
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    } as any,
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
  lyricsJson: any,
  lyricsOnly: string[],
): Promise<any> {
  return await generateLyricsWithPrompt(
    lyricsJson,
    lyricsOnly,
    Defaults.furiganaPrompt,
  );
}

/**
 * Generates romaja for Korean lyrics
 */
export async function generateRomaja(
  lyricsJson: any,
  lyricsOnly: string[],
): Promise<any> {
  return await generateLyricsWithPrompt(
    lyricsJson,
    lyricsOnly,
    Defaults.romajaPrompt,
  );
}

/**
 * Generates romaji for Japanese lyrics
 */
export async function generateRomaji(
  lyricsJson: any,
  lyricsOnly: string[],
): Promise<any> {
  return await generateLyricsWithPrompt(
    lyricsJson,
    lyricsOnly,
    Defaults.romajiPrompt,
  );
}

/**
 * Generic function to generate lyrics with a specific prompt
 */
export async function generateLyricsWithPrompt(
  lyricsJson: any,
  lyricsOnly: string[],
  prompt: string,
): Promise<any> {
  if (!(await checkGeminiAPIKey(lyricsJson))) {
    return lyricsJson;
  }

  return await processLyricsWithGemini(
    lyricsJson,
    lyricsOnly,
    Defaults.systemInstruction,
    prompt,
  );
}

/**
 * Checks if Gemini API key is available
 */
export async function checkGeminiAPIKey(lyricsJson: any): Promise<boolean> {
  const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
  if (!geminiApiKey || geminiApiKey === '') {
    console.error('Amai Lyrics: Gemini API Key missing');
    lyricsJson.Info =
      'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';
    return false;
  }
  return true;
}

/**
 * Processes lyrics with Gemini AI
 */
export async function processLyricsWithGemini(
  lyricsJson: any,
  lyricsOnly: string[],
  systemInstruction: string,
  prompt: string,
): Promise<any> {
  try {
    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const generationConfig = createGeminiConfig(systemInstruction, 0.258);

    if (lyricsOnly.length > 0) {
      const response = await ai.models.generateContent({
        config: generationConfig,
        model: 'gemini-2.5-flash-preview-05-20',
        contents: `${prompt} Here are the lyrics:\n${JSON.stringify(
          lyricsOnly,
        )}`,
      });

      try {
        const lyrics = JSON.parse(response.text.replace(/\\n/g, ''));

        if (lyrics && lyrics.lines && Array.isArray(lyrics.lines)) {
          updateLyricsText(lyricsJson, lyrics.lines);
        } else {
          console.error('Amai Lyrics: Invalid response format', lyrics);
        }
      } catch (parseError) {
        console.error('Amai Lyrics: Error parsing response', parseError);
      }
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
export function updateLyricsText(lyricsJson: any, lines: string[]): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content = lyricsJson.Content.map((item: any, index: number) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines = lyricsJson.Lines.map((item: any, index: number) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  }
}
