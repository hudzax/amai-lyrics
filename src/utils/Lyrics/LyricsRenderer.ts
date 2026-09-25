/**
 * LyricsRenderer — the single place that paints lyrics onto the page.
 *
 * Render (`renderLyrics`) owns the container lookup, clear, spacers, row
 * building, info and credits, style application, registry population, and the
 * `AutoScroll.mount` call. Update (`updateLyricTranslations`) owns the in-place
 * enhancement (phonetics + translations) with element-identity preservation,
 * scroll re-anchoring, and scrollbar recalculation.
 *
 * Both take the document `processing` built, so nothing downstream of the
 * pipeline branches on the payload kind except the two row builders — which
 * differ for real reasons (timing, musical breaks, alignment on one side; the
 * font-size tag on the other).
 *
 * Registered rows are the render path's unit: `LyricsObject.Lines` pairs each
 * line view with the element the updater writes into, so the update path reads
 * the registry it owns instead of re-selecting rows from the DOM.
 */

import { BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from '../Addons';
import Defaults from '../../components/Global/Defaults';
import { applyStyles, removeAllStyles } from '../CSS/Styles';
import {
  ClearScrollSimplebar,
  RecalculateScrollSimplebar,
} from '../Scrolling/Simplebar/ScrollSimplebar';
import { AutoScroll } from '../Scrolling/AutoScroll';
import { ConvertTime } from './ConvertTime';
import { ClearLyricsContentArrays, lyricsBetweenShow, LyricsObject } from './lyrics';
import type { PaintedLine } from './lyrics';
import { ApplyLyricsCredits } from './Applyer/Credits/ApplyLyricsCredits';
import { ApplyInfo } from './Applyer/Info/ApplyInfo';
import { createMusicalLineMs } from './Applyer/Utils/createMusicalLine';
import { createRubyFragment } from '../sanitize';
import { decorateLineElement, processLinePhonetics } from './Applyer/Utils/decorateLine';
import storage from '../storage';
import { processPhoneticText } from './phoneticPatterns';
import type { LyricsDocument } from './conversion';

const LYRICS_CONTAINER_SELECTOR = '#AmaiLyricsPage .LyricsContainer .LyricsContent';
const STYLING_CONTAINER_SELECTOR =
  '#AmaiLyricsPage .LyricsContainer .LyricsContent .simplebar-content';

/** The painted lyric rows, musical-break rows excluded. */
export function getPaintedLines(): PaintedLine[] {
  return LyricsObject.Lines.filter((line) => !line.dots);
}

function resolveContainer(): HTMLElement | null {
  if (!Defaults.LyricsContainerExists) return null;

  const container = document.querySelector<HTMLElement>(LYRICS_CONTAINER_SELECTOR);
  if (!container) {
    console.error('Lyrics container not found');
    return null;
  }
  return container;
}

/**
 * Mounts a lyrics document onto the page. Owns container lookup, clear,
 * spacers, row building, info/credits, styling, registry population, and
 * scroll mount.
 */
export function renderLyrics(lyrics: LyricsDocument): void {
  const container = resolveContainer();
  if (!container) return;

  container.setAttribute('data-lyrics-type', lyrics.type);

  // Clear previous content
  ClearLyricsContentArrays();
  ClearScrollSimplebar();
  TOP_ApplyLyricsSpacer(container);

  if (lyrics.type === 'Line') {
    renderLineRows(container, lyrics);
  } else {
    renderStaticRows(container, lyrics);
  }

  finishRender(container, lyrics);
}

function renderLineRows(container: HTMLElement, lyrics: LyricsDocument): void {
  const fragment = document.createDocumentFragment();

  lyrics.lines.forEach((line, index, arr) => {
    const lineElem = document.createElement('div');

    processLinePhonetics(line, lyrics);

    // Create main text container — use sanitized ruby fragment to prevent XSS
    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');
    mainTextContainer.classList.add('line');
    mainTextContainer.appendChild(createRubyFragment(line.text));
    lineElem.appendChild(mainTextContainer);

    decorateLineElement(lineElem, mainTextContainer, line, line.raw);

    // Convert times to milliseconds
    const startMs = ConvertTime(line.start ?? 0);
    const endMs = ConvertTime(line.end ?? 0);

    // Register the row: the setter, the animator and the click-to-seek map
    // hold it by identity
    LyricsObject.Lines.push({
      view: line,
      element: mainTextContainer,
      rawText: line.raw,
      StartTime: startMs,
      EndTime: endMs,
    });

    // Handle alignment
    if (line.oppositeAligned) {
      lineElem.classList.add('OppositeAligned');
    }

    fragment.appendChild(lineElem);

    // Check for musical break between this line and the next one
    const nextLine = arr[index + 1];
    const hasMusicalBreak =
      nextLine && (nextLine.start ?? 0) - (line.end ?? 0) >= lyricsBetweenShow;

    if (hasMusicalBreak) {
      fragment.appendChild(
        createMusicalLineMs(endMs, ConvertTime(nextLine.start ?? 0), !!nextLine.oppositeAligned),
      );
    }
  });

  // Add the fragment to the container
  container.appendChild(fragment);
}

function renderStaticRows(container: HTMLElement, lyrics: LyricsDocument): void {
  const fragment = document.createDocumentFragment();

  lyrics.lines.forEach((line) => {
    const lineElem = document.createElement('div');

    processLinePhonetics(line, lyrics);

    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');

    if (line.text.includes('[DEF=font_size:small]')) {
      lineElem.style.fontSize = '35px';
      mainTextContainer.appendChild(
        createRubyFragment(line.text.replace('[DEF=font_size:small]', '')),
      );
    } else {
      mainTextContainer.appendChild(createRubyFragment(line.text));
    }

    lineElem.appendChild(mainTextContainer);

    decorateLineElement(lineElem, mainTextContainer, line, line.raw);

    lineElem.classList.add('line', 'static');

    // The span is the row, for both payload kinds: it is what the updater
    // writes into and what the click-to-seek hit test looks for.
    LyricsObject.Lines.push({
      view: line,
      element: mainTextContainer,
      rawText: line.raw,
    });

    fragment.appendChild(lineElem);
  });

  container.appendChild(fragment);
}

function finishRender(container: HTMLElement, lyrics: LyricsDocument): void {
  // Apply additional information and credits
  ApplyInfo(lyrics);
  ApplyLyricsCredits(lyrics);
  BOTTOM_ApplyLyricsSpacer(container);

  // One scroll seam owns mount-vs-recalculate behind a single call.
  AutoScroll.mount();

  // Apply custom styles if provided
  const stylingContainer = document.querySelector<HTMLElement>(STYLING_CONTAINER_SELECTOR);
  if (!stylingContainer) return;

  if (lyrics.offline) {
    stylingContainer.classList.add('offline');
  }

  // Reset existing styles
  removeAllStyles(stylingContainer);

  // Apply custom classes if provided
  if (lyrics.classes) {
    stylingContainer.className = lyrics.classes;
  }

  // Apply custom styles if provided
  if (lyrics.styles) {
    applyStyles(stylingContainer, lyrics.styles);
  }
}

// Tracks the last (processedText, translation) applied per line element so the
// update path can skip DOM rebuilds when nothing changed — rebuilding the
// active line's content mid-animation causes visible churn.
const appliedLineState = new WeakMap<HTMLElement, { text: string; translation: string }>();

/**
 * Re-anchors the scroll container after line heights changed (e.g. translation
 * nodes were inserted). Keeps the active line at the same viewport position it
 * had before the update; falls back to preserving the raw scrollTop when there
 * is no active-line anchor (Static lyrics, or playback between lines).
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
 * Updates the currently displayed lyrics with translations and phonetics.
 * Preserves element identity, scroll position and animation state.
 *
 * Reads the registered rows rather than being handed a payload: enhancement
 * mutates the same line views the renderer registered, so there is nothing for
 * a caller to pass across.
 */
export function updateLyricTranslations(): void {
  try {
    if (!Defaults.LyricsContainerExists) return;

    const lyricsContainer = document.querySelector<HTMLElement>(LYRICS_CONTAINER_SELECTOR);

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
      LyricsObject.Lines.find((line) => line.status === 'Active' && line.element.isConnected)
        ?.element ?? lyricsContainer.querySelector<HTMLElement>('.main-lyrics-text.line.Active');
    const activeLineTopBefore = activeLine ? activeLine.getBoundingClientRect().top : null;

    // Get romaji setting
    const enableRomaji = storage.get('enable_romaji') === 'true';

    for (const painted of LyricsObject.Lines) {
      // Musical-break rows carry no lyric text to translate.
      if (painted.dots) continue;
      updateLineElement(
        painted.element,
        painted.view.text,
        painted.view.translation,
        enableRomaji,
        painted.rawText,
      );
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
 * Updates a single lyrics line element with phonetics and translation.
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
