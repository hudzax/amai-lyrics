/**
 * Lyrics processing functions for Amai Lyrics
 */

import { ShowProcessingIndicator, EnsureProcessingIndicatorHidden } from './ui';
import { cacheLyrics } from './cache';
import { fetchPhoneticLyrics, fetchLyricTranslations } from './ai';
import {
  convertLyrics,
  LyricsData,
  LyricsDataLine,
  LyricsDataStatic,
  LineBasedLyricItem,
  SyllableBasedLyricItem,
  LyricsLine,
} from './conversion';
import { LyricsResult } from '../API/Lyrics';
import {
  isCurrentLyricsRequest,
  publishInitialLyrics,
  publishEnhancedLyrics,
  type LyricsRequestToken,
} from './publish';

// Regular expressions for language detection
const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

// Timing offset for lyrics synchronization
const LYRICS_TIMING_OFFSET = 0.55;

/**
 * Processes and enhances lyrics with AI features.
 *
 * @param trackId - Spotify track ID
 * @param lyricsJson - Raw lyrics data from API
 * @param token - Pipeline request token: initial paint, enhancement work,
 *   and enhancement publication all check it, so a superseded request
 *   resolves its data but never touches UI, storage, or the event bus.
 * @returns Enhanced lyrics data
 */
export async function processAndEnhanceLyrics(
  trackId: string,
  lyricsJson: LyricsResult,
  token: LyricsRequestToken,
): Promise<LyricsData> {
  const id = lyricsJson.id || trackId;
  // Type is kept as a plain string: the API can still return 'Syllable', which
  // is normalized to 'Line' below (the syllable renderer has been removed).
  const type = (lyricsJson.Type || 'Static') as string;

  // Create a LyricsData object from LyricsResult, assuming validation has passed
  // We need to cast based on the initial type to satisfy the discriminated union
  let initialLyricsData: LyricsData;
  if (type === 'Syllable') {
    // Normalize syllable-based lyrics to line-synced on ingest; the syllable
    // renderer was removed. Users still get lyrics, just line-synced.
    initialLyricsData = {
      id: id,
      Type: 'Line',
      Content: convertLyrics((lyricsJson.Content || []) as SyllableBasedLyricItem[]),
      Raw: (lyricsJson.Raw || []) as string[],
    };
  } else if (type === 'Line') {
    initialLyricsData = {
      id: id,
      Type: type,
      Content: (lyricsJson.Content || []) as LineBasedLyricItem[],
      Lines: (lyricsJson.Lines || []) as LyricsLine[],
      Raw: (lyricsJson.Raw || []) as string[],
    };
  } else {
    // Static
    initialLyricsData = {
      id: id,
      Type: 'Static',
      Lines: (lyricsJson.Lines || []) as LyricsLine[],
      Raw: (lyricsJson.Raw || []) as string[],
    };
  }

  const { lyricsJson: preparedLyricsJson, lyricsOnly } =
    await prepareLyricsForGemini(initialLyricsData);

  const { hasKanji, hasKorean } = detectLanguages(preparedLyricsJson);

  // STEP 1: Display lyrics immediately (without translations)
  // Perf: avoid structuredClone on the critical display path — preparedLyricsJson
  // is freshly allocated by prepareLyricsForGemini and not shared, so we can
  // reuse it directly. Clone only for the async enhancement branch.
  const lyricsToDisplay = preparedLyricsJson as LyricsData;

  // Cache and display the initial lyrics. Publication is a no-op when the
  // request went stale while the network was in flight.
  await cacheLyrics(trackId, { ...lyricsToDisplay, id: id });
  publishInitialLyrics(token, { ...lyricsToDisplay, id: id });

  // STEP 2: Process phonetic and translations asynchronously. Skip the
  // (potentially slow, network-bound) enhancement when this request is no
  // longer current, so seeking past a song doesn't waste work. The basic
  // lyrics are still cached so a re-seek is fast.
  if (isCurrentLyricsRequest(token)) {
    const phoneticLyricsJson: LyricsData = structuredClone(preparedLyricsJson);

    // Start async processing without blocking the initial display
    void processLyricsEnhancementsAsync(
      token,
      trackId,
      phoneticLyricsJson,
      hasKanji,
      hasKorean,
      lyricsOnly,
    );
  }

  // Return immediately with the basic lyrics
  return {
    ...lyricsToDisplay,
    id: lyricsJson.id as string,
    fromCache: false,
  };
}

/**
 * Processes lyrics enhancements (phonetic and translations) asynchronously
 * and updates the UI when complete
 *
 * @param trackId - Spotify track ID
 * @param lyricsJson - Lyrics data to enhance
 * @param hasKanji - Whether lyrics contain Japanese characters
 * @param hasKorean - Whether lyrics contain Korean characters
 * @param lyricsOnly - Plain text lyrics array
 */
async function processLyricsEnhancementsAsync(
  token: LyricsRequestToken,
  trackId: string,
  lyricsJson: LyricsData,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<void> {
  try {
    // Show processing indicator
    ShowProcessingIndicator();

    // Process phonetic and translations in parallel
    const [processedLyricsJson, translations] = await Promise.all([
      fetchPhoneticLyrics(lyricsJson, hasKanji, hasKorean, lyricsOnly),
      fetchLyricTranslations(lyricsOnly),
    ]);

    attachTranslations(processedLyricsJson, translations);

    // Update cache with enhanced lyrics
    await cacheLyrics(trackId, { ...processedLyricsJson, id: trackId });

    // Publish in place (scroll/animation-safe). No-op when stale.
    publishEnhancedLyrics(token, trackId, { ...processedLyricsJson, id: trackId });
  } catch (error) {
    console.error('Amai Lyrics: Error processing enhancements', error);
    // Don't show error to user - keep original lyrics visible
  } finally {
    // Always hide processing indicator, whether success or failure
    EnsureProcessingIndicatorHidden();
  }
}

/**
 * Detects Japanese and Korean characters in lyrics
 *
 * @param lyricsJson - Lyrics data
 * @returns Object with language detection flags
 */
export function detectLanguages(lyricsJson: LyricsData): {
  hasKanji: boolean;
  hasKorean: boolean;
} {
  let hasKanji = false;
  let hasKorean = false;

  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    for (const item of lyricsJson.Content) {
      if (!hasKanji && JAPANESE_REGEX.test(item.Text)) hasKanji = true;
      if (!hasKorean && KOREAN_REGEX.test(item.Text)) hasKorean = true;
      if (hasKanji && hasKorean) break;
    }
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    for (const item of lyricsJson.Lines) {
      if (!hasKanji && JAPANESE_REGEX.test(item.Text)) hasKanji = true;
      if (!hasKorean && KOREAN_REGEX.test(item.Text)) hasKorean = true;
      if (hasKanji && hasKorean) break;
    }
  }

  return { hasKanji, hasKorean };
}

/**
 * Attaches translations to lyrics lines
 *
 * @param lyricsJson - Lyrics data
 * @param translations - Array of translated lines
 */
export function attachTranslations(lyricsJson: LyricsData, translations: string[]): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content.forEach((line, idx: number) => {
      line.Translation = translations[idx] || '';
    });
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines.forEach((line, idx: number) => {
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
export function prepareLyricsForGemini(lyricsJson: LyricsData): {
  lyricsJson: LyricsData;
  lyricsOnly: string[];
} {
  const lyricsOnly = extractLyrics(lyricsJson);

  if (lyricsOnly.length > 0) {
    lyricsJson.Raw = lyricsOnly;
  }

  return { lyricsJson, lyricsOnly };
}

/**
 * Helper function to remove empty lines and normalize text
 *
 * @param items - Array of lyrics lines or items
 * @returns Cleaned array
 */
function removeEmptyLinesAndCharacters(
  items: LyricsLine[] | LineBasedLyricItem[],
): (LyricsLine | LineBasedLyricItem)[] {
  items = items.filter((item) => item.Text?.trim() !== '');

  items = items.map((item) => {
    if (item.Text) {
      item.Text = item.Text.replace(/[「」",.!]/g, '');
      item.Text = item.Text.normalize('NFKC');
    }
    return item;
  });

  return items;
}

/**
 * Extracts plain text lyrics from structured data
 *
 * @param lyricsJson - Lyrics data
 * @returns Array of lyrics text only
 */
export function extractLyrics(lyricsJson: LyricsData): string[] {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    // Cast to LyricsDataLine to access Content with correct type
    const lineData = lyricsJson as LyricsDataLine;
    lineData.Content = removeEmptyLinesAndCharacters(
      lineData.Content || [],
    ) as LineBasedLyricItem[];
    lineData.Content = lineData.Content.map((item) => ({
      ...item,
      StartTime: Math.max(0, (item.StartTime || 0) - LYRICS_TIMING_OFFSET),
    }));

    return lineData.Content.map((item) => item.Text);
  }

  if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    // Cast to LyricsDataStatic to access Lines with correct type
    const staticData = lyricsJson as LyricsDataStatic;
    staticData.Lines = removeEmptyLinesAndCharacters(staticData.Lines || []) as LyricsLine[];
    return staticData.Lines.map((item) => item.Text);
  }

  return [];
}
