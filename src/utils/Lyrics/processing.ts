/**
 * Lyrics processing functions for Amai Lyrics
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { HideLoaderContainer, ClearLyricsPageContainer } from './ui';
import { cacheLyrics } from './cache';
import { getPhoneticLyrics, fetchTranslationsWithGemini } from './ai';
import { convertLyrics } from './conversion';

// Regular expressions for language detection
const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

// Timing offset for lyrics synchronization
const LYRICS_TIMING_OFFSET = 0.55;

/**
 * Processes and enhances lyrics with AI features
 *
 * @param trackId - Spotify track ID
 * @param lyricsJson - Raw lyrics data from API
 * @returns Enhanced lyrics data
 */
export async function processAndEnhanceLyrics(
  trackId: string,
  lyricsJson: any,
): Promise<any> {
  const { lyricsJson: preparedLyricsJson, lyricsOnly } =
    await prepareLyricsForGemini(lyricsJson);

  const { hasKanji, hasKorean } = detectLanguages(preparedLyricsJson);

  const phoneticLyricsJson = JSON.parse(JSON.stringify(preparedLyricsJson));

  const [processedLyricsJson, translations] = await Promise.all([
    getPhoneticLyrics(phoneticLyricsJson, hasKanji, hasKorean, lyricsOnly),
    fetchTranslationsWithGemini(preparedLyricsJson),
  ]);

  attachTranslations(processedLyricsJson, translations);

  await cacheLyrics(trackId, processedLyricsJson);

  storage.set('currentlyFetching', 'false');

  if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
    Spicetify.showNotification('Completed', false, 1000);
    Defaults.CurrentLyricsType = processedLyricsJson.Type;
    storage.set('currentLyricsData', JSON.stringify(processedLyricsJson));
    HideLoaderContainer();
    ClearLyricsPageContainer();
  }

  return { ...processedLyricsJson, fromCache: false };
}

/**
 * Detects Japanese and Korean characters in lyrics
 *
 * @param lyricsJson - Lyrics data
 * @returns Object with language detection flags
 */
export function detectLanguages(lyricsJson: any): {
  hasKanji: boolean;
  hasKorean: boolean;
} {
  const hasKanji =
    lyricsJson.Content?.some((item: any) =>
      item.Lead?.Syllables?.some((syl: any) => JAPANESE_REGEX.test(syl.Text)),
    ) ||
    lyricsJson.Content?.some((item: any) => JAPANESE_REGEX.test(item.Text)) ||
    lyricsJson.Lines?.some((item: any) => JAPANESE_REGEX.test(item.Text)) ||
    false;

  const hasKorean =
    lyricsJson.Content?.some((item: any) =>
      item.Lead?.Syllables?.some((syl: any) => KOREAN_REGEX.test(syl.Text)),
    ) ||
    lyricsJson.Content?.some((item: any) => KOREAN_REGEX.test(item.Text)) ||
    lyricsJson.Lines?.some((item: any) => KOREAN_REGEX.test(item.Text)) ||
    false;

  return { hasKanji, hasKorean };
}

/**
 * Attaches translations to lyrics lines
 *
 * @param lyricsJson - Lyrics data
 * @param translations - Array of translated lines
 */
export function attachTranslations(
  lyricsJson: any,
  translations: string[],
): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content.forEach((line: any, idx: number) => {
      line.Translation = translations[idx] || '';
    });
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines.forEach((line: any, idx: number) => {
      line.Translation = translations[idx] || '';
    });
  }
}

/**
 * Prepares lyrics for Gemini AI processing
 *
 * @param lyricsJson - Raw lyrics data
 * @returns Prepared lyrics and text-only array
 */
export async function prepareLyricsForGemini(
  lyricsJson: any,
): Promise<{ lyricsJson: any; lyricsOnly: string[] }> {
  if (lyricsJson.Type === 'Syllable') {
    lyricsJson.Type = 'Line';
    lyricsJson.Content = convertLyrics(lyricsJson.Content);
  }

  const lyricsOnly = await extractLyrics(lyricsJson);

  if (lyricsOnly.length > 0) {
    lyricsJson.Raw = lyricsOnly;
  }

  return { lyricsJson, lyricsOnly };
}

/**
 * Extracts plain text lyrics from structured data
 *
 * @param lyricsJson - Lyrics data
 * @returns Array of lyrics text only
 */
export async function extractLyrics(lyricsJson: any): Promise<string[]> {
  const removeEmptyLinesAndCharacters = (items: any[]): any[] => {
    items = items.filter((item) => item.Text?.trim() !== '');

    items = items.map((item) => {
      if (item.Text) {
        item.Text = item.Text.replace(/[「」",.!]/g, '');
        item.Text = item.Text.normalize('NFKC');
      }
      return item;
    });

    return items;
  };

  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content = lyricsJson.Content.map((item: any) => ({
      ...item,
      StartTime: Math.max(0, (item.StartTime || 0) - LYRICS_TIMING_OFFSET),
    }));

    lyricsJson.Content = removeEmptyLinesAndCharacters(lyricsJson.Content);
    return lyricsJson.Content.map((item: any) => item.Text);
  }

  if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines = removeEmptyLinesAndCharacters(lyricsJson.Lines);
    return lyricsJson.Lines.map((item: any) => item.Text);
  }

  return [];
}
