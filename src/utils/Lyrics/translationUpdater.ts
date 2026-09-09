/**
 * Updates already-displayed lyric lines in place with translations and
 * phonetics, preserving element identity, scroll position and animation state.
 *
 * This is deliberately separated from processing.ts (the fetch/enhance
 * pipeline): processing.ts turns a raw payload into a LyricsData object, while
 * this module mutates the live DOM after the fact. It imports nothing from
 * processing.ts, so the two halves no longer need to share an import cycle.
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { createRubyFragment } from '../sanitize';
import { processPhoneticText } from './phoneticPatterns';
import { LyricsObject } from './lyrics';
import { RecalculateScrollSimplebar } from '../Scrolling/Simplebar/ScrollSimplebar';
import { LyricsData, LineBasedLyricItem, LyricsLine } from './conversion';

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
