/**
 * Lyrics processing functions for Amai Lyrics
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { HideLoaderContainer, ClearLyricsPageContainer } from './ui';
import { cacheLyrics } from './cache';
import { fetchPhoneticLyrics, fetchLyricTranslations } from './ai';
import { convertLyrics } from './conversion';
import { LyricsResult } from '../API/Lyrics';
import { Syllable, LineBasedLyricItem, SyllableBasedLyricItem, LyricsLine } from './conversion';

export interface LyricsDataSyllable {
  id?: string;
  Type: 'Syllable';
  Content?: SyllableBasedLyricItem[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

export interface LyricsDataLine {
  id?: string;
  Type: 'Line';
  Content?: LineBasedLyricItem[];
  Lines?: LyricsLine[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

export interface LyricsDataStatic {
  id?: string;
  Type: 'Static';
  Lines?: LyricsLine[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

export type LyricsData = LyricsDataSyllable | LyricsDataLine | LyricsDataStatic;

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
  lyricsJson: LyricsResult,
): Promise<LyricsData> {
  const id = lyricsJson.id || trackId;
  const type = (lyricsJson.Type || 'Static') as LyricsData['Type'];

  // Create a LyricsData object from LyricsResult, assuming validation has passed
  // We need to cast based on the initial type to satisfy the discriminated union
  let initialLyricsData: LyricsData;
  if (type === 'Syllable') {
    initialLyricsData = {
      id: id,
      Type: type,
      Content: (lyricsJson.Content || []) as SyllableBasedLyricItem[],
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
      Type: type,
      Lines: (lyricsJson.Lines || []) as LyricsLine[],
      Raw: (lyricsJson.Raw || []) as string[],
    };
  }

  const { lyricsJson: preparedLyricsJson, lyricsOnly } = await prepareLyricsForGemini(
    initialLyricsData,
  );

  const { hasKanji, hasKorean } = detectLanguages(preparedLyricsJson);

  // STEP 1: Display lyrics immediately (without translations)
  const lyricsToDisplay = JSON.parse(JSON.stringify(preparedLyricsJson));
  
  // Cache and display the initial lyrics
  await cacheLyrics(trackId, { ...lyricsToDisplay, id: id });
  
  storage.set('currentlyFetching', 'false');

  if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
    Spicetify.showNotification('Lyrics loaded', false, 1000);
    Defaults.CurrentLyricsType = lyricsToDisplay.Type;
    storage.set('currentLyricsData', JSON.stringify(lyricsToDisplay));
    HideLoaderContainer();
    ClearLyricsPageContainer();
  }

  // STEP 2: Process phonetic and translations asynchronously
  const phoneticLyricsJson: LyricsData = JSON.parse(JSON.stringify(preparedLyricsJson));

  // Start async processing without blocking the initial display
  processLyricsEnhancementsAsync(trackId, phoneticLyricsJson, hasKanji, hasKorean, lyricsOnly);

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
  trackId: string,
  lyricsJson: LyricsData,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<void> {
  try {
    // Process phonetic and translations in parallel
    const [processedLyricsJson, translations] = await Promise.all([
      fetchPhoneticLyrics(lyricsJson, hasKanji, hasKorean, lyricsOnly),
      fetchLyricTranslations(lyricsOnly),
    ]);

    attachTranslations(processedLyricsJson, translations);

    // Update cache with enhanced lyrics
    await cacheLyrics(trackId, { ...processedLyricsJson, id: trackId });

    // Only update UI if this is still the current track
    if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
      // Update the displayed lyrics with translations
      updateDisplayedLyricsWithTranslations(processedLyricsJson);
      
      Spicetify.showNotification('Translations updated', false, 1000);
      storage.set('currentLyricsData', JSON.stringify(processedLyricsJson));
    }
  } catch (error) {
    console.error('Amai Lyrics: Error processing enhancements', error);
    // Don't show error to user - keep original lyrics visible
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

  if (lyricsJson.Type === 'Syllable' && lyricsJson.Content) {
    hasKanji = lyricsJson.Content.some((item) =>
      item.Lead?.Syllables?.some((syl: Syllable) => JAPANESE_REGEX.test(syl.Text)),
    );
    hasKorean = lyricsJson.Content.some((item) =>
      item.Lead?.Syllables?.some((syl: Syllable) => KOREAN_REGEX.test(syl.Text)),
    );
  } else if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    hasKanji = lyricsJson.Content.some((item) => JAPANESE_REGEX.test(item.Text));
    hasKorean = lyricsJson.Content.some((item) => KOREAN_REGEX.test(item.Text));
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    hasKanji = lyricsJson.Lines.some((item) => JAPANESE_REGEX.test(item.Text));
    hasKorean = lyricsJson.Lines.some((item) => KOREAN_REGEX.test(item.Text));
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
export async function prepareLyricsForGemini(
  lyricsJson: LyricsData,
): Promise<{ lyricsJson: LyricsData; lyricsOnly: string[] }> {
  if (lyricsJson.Type === 'Syllable') {
    // Cast lyricsJson to LyricsDataSyllable to access Content with correct type
    const syllableData = lyricsJson as LyricsDataSyllable;
    const convertedContent = convertLyrics(syllableData.Content || []) as LineBasedLyricItem[];

    // Create a new object with the updated type and content
    lyricsJson = {
      ...lyricsJson,
      Type: 'Line',
      Content: convertedContent,
    } as LyricsDataLine; // Cast to LyricsDataLine
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
export async function extractLyrics(lyricsJson: LyricsData): Promise<string[]> {
  const removeEmptyLinesAndCharacters = (
    items: LyricsLine[] | LineBasedLyricItem[],
  ): (LyricsLine | LineBasedLyricItem)[] => {
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

/**
 * Updates the currently displayed lyrics with translations
 * This function preserves scroll position and animation state
 *
 * @param lyricsData - Enhanced lyrics data with translations
 */
export function updateDisplayedLyricsWithTranslations(lyricsData: LyricsData): void {
  try {
    if (!Defaults.LyricsContainerExists) return;

    const lyricsContainer = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .LyricsContainer .LyricsContent',
    );
    
    if (!lyricsContainer) return;

    // Preserve current scroll position
    const simplebarContent = lyricsContainer.querySelector('.simplebar-content-wrapper');
    const scrollTop = simplebarContent?.scrollTop || 0;

    // Update translations based on lyrics type
    if (lyricsData.Type === 'Line' && lyricsData.Content) {
      updateLineLyricsTranslations(lyricsData.Content);
    } else if (lyricsData.Type === 'Static' && lyricsData.Lines) {
      updateStaticLyricsTranslations(lyricsData.Lines);
    }

    // Restore scroll position
    if (simplebarContent) {
      simplebarContent.scrollTop = scrollTop;
    }
  } catch (error) {
    console.error('Amai Lyrics: Error updating translations', error);
  }
}

/**
 * Updates line-synced lyrics with translations
 *
 * @param content - Line-based lyrics content with translations
 */
function updateLineLyricsTranslations(content: LineBasedLyricItem[]): void {
  const lineElements = document.querySelectorAll('#SpicyLyricsPage .LyricsContainer .LyricsContent .main-lyrics-text.line');
  
  content.forEach((line, index) => {
    if (index >= lineElements.length) return;

    const lineElement = lineElements[index] as HTMLElement;
    const existingTranslation = lineElement.querySelector('.translation');
    
    // Only add translation if it exists, is not empty, and is different from original
    if (line.Translation && line.Translation.trim() !== '') {
      if (existingTranslation) {
        // Update existing translation
        existingTranslation.textContent = line.Translation;
      } else {
        // Create new translation element
        const translationElem = document.createElement('div');
        translationElem.classList.add('translation');
        translationElem.textContent = line.Translation;
        lineElement.appendChild(translationElem);
      }
    } else if (existingTranslation) {
      // Remove translation if it's empty
      existingTranslation.remove();
    }
  });
}

/**
 * Updates static lyrics with translations
 *
 * @param lines - Static lyrics lines with translations
 */
function updateStaticLyricsTranslations(lines: LyricsLine[]): void {
  const lineElements = document.querySelectorAll('#SpicyLyricsPage .LyricsContainer .LyricsContent .line.static .main-lyrics-text');
  
  lines.forEach((line, index) => {
    if (index >= lineElements.length) return;

    const lineElement = lineElements[index] as HTMLElement;
    const existingTranslation = lineElement.querySelector('.translation');
    
    // Only add translation if it exists, is not empty, and is different from original
    if (line.Translation && line.Translation.trim() !== '') {
      if (existingTranslation) {
        // Update existing translation
        existingTranslation.textContent = line.Translation;
      } else {
        // Create new translation element
        const translationElem = document.createElement('div');
        translationElem.classList.add('translation');
        translationElem.textContent = line.Translation;
        lineElement.appendChild(translationElem);
      }
    } else if (existingTranslation) {
      // Remove translation if it's empty
      existingTranslation.remove();
    }
  });
}
