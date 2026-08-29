/**
 * Lyrics processing functions for Amai Lyrics
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import {
  HideLoaderContainer,
  ClearLyricsPageContainer,
  ShowProcessingIndicator,
  EnsureProcessingIndicatorHidden,
} from './ui';
import { cacheLyrics } from './cache';
import { fetchPhoneticLyrics, fetchLyricTranslations } from './ai';
import { convertLyrics } from './conversion';
import Event from '../EventManager';
import { RecalculateScrollSimplebar } from '../Scrolling/Simplebar/ScrollSimplebar';
import { LyricsObject } from './lyrics';
import { LyricsResult } from '../API/Lyrics';
import { createRubyFragment } from '../sanitize';
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

// Regular expressions for phonetic text processing
const JAPANESE_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]/;
const JAPANESE_ROMAJI_REGEX =
  /(([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)|[(\uFF08]([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)[)\uFF09])(?:{|\uFF5B)([^}\uFF5D]+)(?:}|\uFF5D)/g;
const JAPANESE_FURIGANA_REGEX = /([\u4E00-\u9FFF々]+[\u3040-\u30FF]*){([^}]+)}/g;
const KOREAN_ROMAJA_REGEX =
  /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)(?:[a-zA-Z]*)[?.!,"']?){([^}]+)}/g;

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
  isCurrent = true,
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

  const { lyricsJson: preparedLyricsJson, lyricsOnly } =
    await prepareLyricsForGemini(initialLyricsData);

  const { hasKanji, hasKorean } = detectLanguages(preparedLyricsJson);

  // STEP 1: Display lyrics immediately (without translations)
  // Perf: avoid structuredClone on the critical display path — preparedLyricsJson
  // is freshly allocated by prepareLyricsForGemini and not shared, so we can
  // reuse it directly. Clone only for the async enhancement branch.
  const lyricsToDisplay = preparedLyricsJson as LyricsData;

  // Cache and display the initial lyrics
  await cacheLyrics(trackId, { ...lyricsToDisplay, id: id });

  if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
    Defaults.CurrentLyricsType = lyricsToDisplay.Type;
    const serialized = JSON.stringify(lyricsToDisplay);
    storage.set('currentLyricsData', serialized);
    Event.evoke('lyrics:data-updated', serialized);
    HideLoaderContainer();
    ClearLyricsPageContainer();
  }

  // STEP 2: Process phonetic and translations asynchronously. Skip the
  // (potentially slow, network-bound) Gemini enhancement when this track is no
  // longer the one the user is on, so seeking past a song doesn't waste work.
  if (isCurrent) {
    const phoneticLyricsJson: LyricsData = structuredClone(preparedLyricsJson);

    // Start async processing without blocking the initial display
    processLyricsEnhancementsAsync(trackId, phoneticLyricsJson, hasKanji, hasKorean, lyricsOnly);
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

    // Only update UI if this is still the current track
    if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
      // Update the displayed lyrics with translations
      updateDisplayedLyricsWithTranslations(processedLyricsJson);

      const serialized = JSON.stringify(processedLyricsJson);
      storage.set('currentLyricsData', serialized);
      Event.evoke('lyrics:data-updated', serialized);
    }
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

  if (lyricsJson.Type === 'Syllable' && lyricsJson.Content) {
    for (const item of lyricsJson.Content) {
      if (
        !hasKanji &&
        item.Lead?.Syllables?.some((syl: Syllable) => JAPANESE_REGEX.test(syl.Text))
      ) {
        hasKanji = true;
      }
      if (
        !hasKorean &&
        item.Lead?.Syllables?.some((syl: Syllable) => KOREAN_REGEX.test(syl.Text))
      ) {
        hasKorean = true;
      }
      if (hasKanji && hasKorean) break;
    }
  } else if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
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

const phoneticTextCache = new Map<string, string>();
const PHONETIC_CACHE_MAX = 100;

function phoneticCacheKey(text: string, enableRomaji: boolean): string {
  return `${enableRomaji ? 'r' : 'f'}\0${text}`;
}

/**
 * Processes phonetic patterns in text and converts them to HTML ruby tags
 * This mirrors the logic from ApplyLineLyrics
 *
 * @param text - Text with phonetic patterns (e.g., {romaji} or {furigana})
 * @param enableRomaji - Whether romaji mode is enabled
 * @returns Processed HTML string with ruby tags
 */
export function processPhoneticText(text: string, enableRomaji: boolean): string {
  const key = phoneticCacheKey(text, enableRomaji);
  const cached = phoneticTextCache.get(key);
  if (cached !== undefined) return cached;

  let result: string;
  if (JAPANESE_CHAR_REGEX.test(text)) {
    if (enableRomaji) {
      result = text.replace(JAPANESE_ROMAJI_REGEX, (match, p1, p2, p3, p4) => {
        const textPart = p2 || p3;
        return `<ruby>${textPart}<rt>${p4}</rt></ruby>`;
      });
    } else {
      result = text.replace(JAPANESE_FURIGANA_REGEX, '<ruby>$1<rt>$2</rt></ruby>');
    }
  } else {
    // Korean phonetics
    result = text.replace(KOREAN_ROMAJA_REGEX, '<ruby class="romaja">$1<rt>$2</rt></ruby>');
  }

  if (phoneticTextCache.size >= PHONETIC_CACHE_MAX) {
    const firstKey = phoneticTextCache.keys().next().value;
    if (firstKey !== undefined) phoneticTextCache.delete(firstKey);
  }
  phoneticTextCache.set(key, result);
  return result;
}

// Tracks the last (processedText, translation) applied per line element so
// updateLineElement can skip DOM rebuilds when nothing changed — rebuilding the
// active line's content mid-animation causes visible churn.
const appliedLineState = new WeakMap<HTMLElement, { text: string; translation: string }>();

/**
 * Re-anchors the scroll container after line heights changed (e.g. translation
 * nodes were inserted). Keeps the active line at the same viewport position it
 * had before the update; falls back to preserving the raw scrollTop when there
 * is no active-line anchor (Static lyrics, or playback between lines).
 *
 * Without this, translations arriving mid-line change every line's height and
 * the raw scrollTop restore leaves the sung line drifted out of view — and
 * ScrollToActiveLine cannot correct it because the active *element* didn't
 * change, so it early-returns until the next line transition.
 */
export function applyScrollReanchor(
  scrollEl: HTMLElement | null | undefined,
  activeLine: HTMLElement | null | undefined,
  activeLineTopBefore: number | null,
  fallbackScrollTop: number,
): void {
  if (!scrollEl) return;
  if (activeLine && activeLine.isConnected && activeLineTopBefore !== null) {
    const delta = activeLine.getBoundingClientRect().top - activeLineTopBefore;
    if (delta !== 0) scrollEl.scrollTop += delta;
  } else {
    scrollEl.scrollTop = fallbackScrollTop;
  }
}

/**
 * Updates the currently displayed lyrics with translations and phonetics
 * This function preserves scroll position and animation state
 *
 * @param lyricsData - Enhanced lyrics data with translations and phonetics
 */
export function updateDisplayedLyricsWithTranslations(lyricsData: LyricsData): void {
  try {
    if (!Defaults.LyricsContainerExists) return;

    const lyricsContainer = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .LyricsContainer .LyricsContent',
    );

    if (!lyricsContainer) return;

    const simplebarContent = lyricsContainer.querySelector<HTMLElement>(
      '.simplebar-content-wrapper',
    );
    // Fallback anchor for Static lyrics / gaps between lines: preserve the raw
    // scroll position.
    const fallbackScrollTop = simplebarContent?.scrollTop || 0;

    // Capture the currently sung line so the scroll can be re-anchored on it
    // after the update (translation nodes change every line's height).
    const activeLine =
      (LyricsObject.Types.Line.Lines as { Status?: string; HTMLElement?: HTMLElement }[]).find(
        (line) => line.Status === 'Active' && line.HTMLElement?.isConnected,
      )?.HTMLElement ?? lyricsContainer.querySelector<HTMLElement>('.main-lyrics-text.line.Active');
    const activeLineTopBefore = activeLine ? activeLine.getBoundingClientRect().top : null;

    // Get romaji setting
    const enableRomaji = storage.get('enable_romaji') === 'true';

    // Update phonetics and translations based on lyrics type
    if (lyricsData.Type === 'Line' && lyricsData.Content) {
      updateLineLyricsTranslations(lyricsData.Content, enableRomaji, lyricsData.Raw);
    } else if (lyricsData.Type === 'Static' && lyricsData.Lines) {
      updateStaticLyricsTranslations(lyricsData.Lines, enableRomaji, lyricsData.Raw);
    }

    // Re-anchor scroll on the active line (or fall back to raw preservation)
    applyScrollReanchor(simplebarContent, activeLine, activeLineTopBefore, fallbackScrollTop);

    // Content height changed — refresh SimpleBar's scrollbar geometry
    RecalculateScrollSimplebar();
  } catch (error) {
    console.error('Amai Lyrics: Error updating translations', error);
  }
}

/**
 * Helper function to update a single lyrics line element with phonetics and translation
 *
 * @param lineElement - The DOM element to update
 * @param text - The lyrics text
 * @param translation - The translation text (if any)
 * @param enableRomaji - Whether romaji mode is enabled
 * @param rawText - Original raw text for comparison
 */
function updateLineElement(
  lineElement: HTMLElement,
  text: string,
  translation: string | undefined,
  enableRomaji: boolean,
  rawText?: string,
): void {
  // Strip out layout tags before processing phonetics so they don't get rendered
  text = text.replace('[DEF=font_size:small]', '');

  // Update phonetics by re-processing the text with the latest data
  const processedText = processPhoneticText(text, enableRomaji);

  // Only treat a translation as real when it's non-empty and differs from the
  // original line text
  const hasDistinctTranslation =
    !!translation &&
    translation.trim() !== '' &&
    (!rawText || translation.trim() !== rawText.trim());
  const appliedTranslation = hasDistinctTranslation ? (translation as string) : '';

  const previous = appliedLineState.get(lineElement);

  // Nothing changed for this line -> skip the DOM rebuild entirely. Important
  // for the currently active line, whose content the animator is mid-flight on.
  if (previous && previous.text === processedText && previous.translation === appliedTranslation) {
    return;
  }

  if (previous && previous.text === processedText) {
    // Text unchanged — sync only the translation node instead of rebuilding
    const updatedTranslation = lineElement.querySelector('.translation');
    if (appliedTranslation) {
      if (updatedTranslation) {
        updatedTranslation.textContent = appliedTranslation;
      } else {
        const translationElem = document.createElement('div');
        translationElem.classList.add('translation');
        translationElem.textContent = appliedTranslation;
        lineElement.appendChild(translationElem);
      }
    } else if (updatedTranslation) {
      // Remove translation if it's empty or same as original
      updatedTranslation.remove();
    }
    appliedLineState.set(lineElement, { text: processedText, translation: appliedTranslation });
    return;
  }

  // Text changed (or first update for this element) — rebuild the main text
  // content with the sanitized ruby fragment
  lineElement.textContent = '';
  lineElement.appendChild(createRubyFragment(processedText));

  if (appliedTranslation) {
    const translationElem = document.createElement('div');
    translationElem.classList.add('translation');
    translationElem.textContent = appliedTranslation;
    lineElement.appendChild(translationElem);
  }

  appliedLineState.set(lineElement, { text: processedText, translation: appliedTranslation });
}

/**
 * Updates line-synced lyrics with phonetics and translations
 *
 * @param content - Line-based lyrics content with translations
 * @param enableRomaji - Whether romaji mode is enabled
 * @param rawLyrics - Original raw lyrics for comparison
 */
function updateLineLyricsTranslations(
  content: LineBasedLyricItem[],
  enableRomaji: boolean,
  rawLyrics?: string[],
): void {
  const lineElements = document.querySelectorAll(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .main-lyrics-text.line',
  );

  content.forEach((line, index) => {
    if (index >= lineElements.length) return;
    updateLineElement(
      lineElements[index] as HTMLElement,
      line.Text,
      line.Translation,
      enableRomaji,
      rawLyrics?.[index],
    );
  });
}

/**
 * Updates static lyrics with phonetics and translations
 *
 * @param lines - Static lyrics lines with translations
 * @param enableRomaji - Whether romaji mode is enabled
 * @param rawLyrics - Original raw lyrics for comparison
 */
function updateStaticLyricsTranslations(
  lines: LyricsLine[],
  enableRomaji: boolean,
  rawLyrics?: string[],
): void {
  const lineElements = document.querySelectorAll(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .line.static .main-lyrics-text',
  );

  lines.forEach((line, index) => {
    if (index >= lineElements.length) return;
    updateLineElement(
      lineElements[index] as HTMLElement,
      line.Text,
      line.Translation,
      enableRomaji,
      rawLyrics?.[index],
    );
  });
}
