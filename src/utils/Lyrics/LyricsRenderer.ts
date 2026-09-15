/**
 * LyricsRenderer — the single place that paints lyrics onto the page.
 *
 * Render (`renderLyrics`) owns the container lookup, clear, spacers, info and
 * credits, style application, `LyricsObject` registration, and the
 * `AutoScroll.mount` call. Update (`updateLyricTranslations`) owns the in-place
 * enhancement (phonetics + translations) with element-identity preservation,
 * scroll re-anchoring, and scrollbar recalculation.
 *
 * The Static and Line row builders used to duplicate the ~30-line preamble and
 * epilogue, and the translation updater wrote to the same live DOM through its
 * own state and its own scroll recalculation. They now live behind this seam:
 * callers cross `renderLyrics` / `updateLyricTranslations` (plus
 * `getLineRecords` for a uniform line view) — never the builders, the updater,
 * or the scroll container directly.
 */

import { BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from '../Addons';
import Defaults from '../../components/Global/Defaults';
import { applyStyles, removeAllStyles } from '../CSS/Styles';
import { ClearScrollSimplebar } from '../Scrolling/Simplebar/ScrollSimplebar';
import { AutoScroll } from '../Scrolling/AutoScroll';
import { ConvertTime } from './ConvertTime';
import { ClearLyricsContentArrays, lyricsBetweenShow, LyricsObject } from './lyrics';
import { ApplyLyricsCredits } from './Applyer/Credits/ApplyLyricsCredits';
import { ApplyInfo } from './Applyer/Info/ApplyInfo';
import { createMusicalLineMs } from './Applyer/Utils/createMusicalLine';
import { createRubyFragment } from '../sanitize';
import { decorateLineElement, processLinePhonetics } from './Applyer/Utils/decorateLine';
import storage from '../storage';
import { processPhoneticText } from './phoneticPatterns';
import { RecalculateScrollSimplebar } from '../Scrolling/Simplebar/ScrollSimplebar';
import type { LyricsData, LineBasedLyricItem, LyricsLine } from './conversion';

const LYRICS_CONTAINER_SELECTOR = '#AmaiLyricsPage .LyricsContainer .LyricsContent';
const STYLING_CONTAINER_SELECTOR =
  '#AmaiLyricsPage .LyricsContainer .LyricsContent .simplebar-content';

/** Payload shape the render path accepts: the conversion union plus legacy display fields. */
export interface RenderableLyricsData {
  Type?: 'Line' | 'Static';
  id?: string;
  Content?: LineBasedLyricItem[];
  Lines?: LyricsLine[];
  StartTime?: number;
  Raw?: string[];
  Info?: string;
  SongWriters?: string[];
  styles?: Record<string, string>;
  classes?: string;
  offline?: boolean;
}

/**
 * One line on the page, whatever its source type. Line-synced rows carry
 * timings; static rows carry the element only. This makes the Static-vs-Line
 * element difference explicit instead of selector folklore downstream.
 */
export interface LineRecord {
  element: HTMLElement;
  start?: number;
  end?: number;
}

interface StoredLine {
  HTMLElement?: HTMLElement;
  StartTime?: number;
  EndTime?: number;
}

/** Uniform view over the Line and Static registrations. */
export function getLineRecords(): LineRecord[] {
  const line = (LyricsObject.Types.Line.Lines as StoredLine[])
    .filter((line) => line.HTMLElement)
    .map((line) => ({
      element: line.HTMLElement as HTMLElement,
      start: line.StartTime,
      end: line.EndTime,
    }));
  const stat = (LyricsObject.Types.Static.Lines as StoredLine[])
    .filter((line) => line.HTMLElement)
    .map((line) => ({ element: line.HTMLElement as HTMLElement }));
  return [...line, ...stat];
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

function inferType(data: RenderableLyricsData): 'Line' | 'Static' {
  if (data.Type === 'Line' || data.Type === 'Static') return data.Type;
  // Legacy payloads without a discriminator: Content marks line-synced rows.
  return Array.isArray((data as { Content?: unknown }).Content) ? 'Line' : 'Static';
}

/**
 * Mounts lyrics data onto the page. Owns container lookup, clear, spacers,
 * row building, info/credits, styling, registration, and scroll mount.
 */
export function renderLyrics(data: RenderableLyricsData): void {
  const container = resolveContainer();
  if (!container) return;

  const type = inferType(data);
  container.setAttribute('data-lyrics-type', type);

  // Clear previous content
  ClearLyricsContentArrays();
  ClearScrollSimplebar();
  TOP_ApplyLyricsSpacer(container);

  if (type === 'Line') {
    renderLineRows(container, data);
  } else {
    renderStaticRows(container, data);
  }

  finishRender(container, data);
}

function renderLineRows(container: HTMLElement, data: RenderableLyricsData): void {
  const content = data.Content ?? [];
  const fragment = document.createDocumentFragment();
  const convertStartTime = ConvertTime(data.StartTime ?? 0);

  // Add initial dot group if there's a sufficient gap before the first line
  if ((data.StartTime ?? 0) >= lyricsBetweenShow) {
    const musicalLine = createMusicalLineMs(0, convertStartTime, !!content[0]?.OppositeAligned);
    fragment.appendChild(musicalLine);
  }

  content.forEach((line, index, arr) => {
    const lineElem = document.createElement('div');

    processLinePhonetics(line, data);

    // Create main text container — use sanitized ruby fragment to prevent XSS
    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');
    mainTextContainer.classList.add('line');
    mainTextContainer.appendChild(createRubyFragment(line.Text));
    lineElem.appendChild(mainTextContainer);

    decorateLineElement(lineElem, mainTextContainer, line, data.Raw?.[index]);

    // Convert times to milliseconds
    const startTime = ConvertTime(line.StartTime);
    const endTime = ConvertTime(line.EndTime);

    // Register the span: the animator and click-to-seek maps hold it by identity
    LyricsObject.Types.Line.Lines.push({
      HTMLElement: mainTextContainer,
      StartTime: startTime,
      EndTime: endTime,
      TotalTime: endTime - startTime,
    });

    // Handle alignment
    if (line.OppositeAligned) {
      lineElem.classList.add('OppositeAligned');
    }

    fragment.appendChild(lineElem);

    // Check for musical break between this line and the next one
    const nextLine = arr[index + 1];
    const hasMusicalBreak = nextLine && nextLine.StartTime - line.EndTime >= lyricsBetweenShow;

    if (hasMusicalBreak) {
      const nextStartTime = ConvertTime(nextLine.StartTime);
      const curEndTime = endTime;
      const musicalLine = createMusicalLineMs(
        curEndTime,
        nextStartTime,
        !!nextLine.OppositeAligned,
      );
      fragment.appendChild(musicalLine);
    }
  });

  // Add the fragment to the container
  container.appendChild(fragment);
}

function renderStaticRows(container: HTMLElement, data: RenderableLyricsData): void {
  const lines = data.Lines ?? [];
  const fragment = document.createDocumentFragment();

  lines.forEach((line, index) => {
    const lineElem = document.createElement('div');

    processLinePhonetics(line, data);

    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');

    if (line.Text?.includes('[DEF=font_size:small]')) {
      lineElem.style.fontSize = '35px';
      mainTextContainer.appendChild(
        createRubyFragment(line.Text.replace('[DEF=font_size:small]', '')),
      );
    } else {
      mainTextContainer.appendChild(createRubyFragment(line.Text));
    }

    lineElem.appendChild(mainTextContainer);

    decorateLineElement(lineElem, mainTextContainer, line, data.Raw?.[index]);

    lineElem.classList.add('line', 'static');

    LyricsObject.Types.Static.Lines.push({
      HTMLElement: lineElem,
    });

    fragment.appendChild(lineElem);
  });

  container.appendChild(fragment);
}

function finishRender(container: HTMLElement, data: RenderableLyricsData): void {
  // Apply additional information and credits
  ApplyInfo(data);
  ApplyLyricsCredits(data);
  BOTTOM_ApplyLyricsSpacer(container);

  // One scroll seam owns mount-vs-recalculate behind a single call.
  AutoScroll.mount();

  // Apply custom styles if provided
  const stylingContainer = document.querySelector<HTMLElement>(STYLING_CONTAINER_SELECTOR);
  if (!stylingContainer) return;

  if (data.offline) {
    stylingContainer.classList.add('offline');
  }

  // Reset existing styles
  removeAllStyles(stylingContainer);

  // Apply custom classes if provided
  if (data.classes) {
    stylingContainer.className = data.classes;
  }

  // Apply custom styles if provided
  if (data.styles) {
    applyStyles(stylingContainer, data.styles);
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
 */
export function updateLyricTranslations(lyricsData: LyricsData): void {
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

/**
 * Updates line-synced lyrics with phonetics and translations.
 */
function updateLineLyricsTranslations(
  content: LineBasedLyricItem[],
  enableRomaji: boolean,
  rawLyrics?: string[],
): void {
  const lineElements = document.querySelectorAll(
    '#AmaiLyricsPage .LyricsContainer .LyricsContent .main-lyrics-text.line',
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
 * Updates static lyrics with phonetics and translations.
 */
function updateStaticLyricsTranslations(
  lines: LyricsLine[],
  enableRomaji: boolean,
  rawLyrics?: string[],
): void {
  const lineElements = document.querySelectorAll(
    '#AmaiLyricsPage .LyricsContainer .LyricsContent .line.static .main-lyrics-text',
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
