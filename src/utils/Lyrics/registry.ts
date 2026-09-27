/**
 * LyricsRegistry — the single place that owns the painted lyric rows and
 * everything derived from them: the row list, the click-to-seek time map, the
 * position-driven render loop, and the full reset.
 *
 * Callers cross it through registerRow, getAllRows, getPaintedLines,
 * getTimedLines, getActiveLine, clear, startLoop, stopLoop, attachClickToSeek,
 * and detachClickToSeek — never through the row array, the time map, or a
 * PositionConsumer registration of their own.
 */

import { Maid } from '@hudzax/web-modules/Maid';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { registerPositionConsumer } from '../PositionConsumer';
import { isPageOpen } from '../PagePresence';
import { Lyrics } from './Animator/Main';
import { AutoScroll } from '../Scrolling/AutoScroll';
import type { TimedLine } from './findActiveIndex';
import type { LineView } from './conversion';
import { resetLyricsSetterCache } from './Animator/Lyrics/LyricsSetter';
import { resetAnimatorCache } from './Animator/Lyrics/LyricsAnimator';

export const lyricsBetweenShow = 3;

/** One ambient dot inside a musical-break row. */
export interface PaintedDot extends TimedLine {
  element: HTMLElement;
  status?: 'Active' | 'NotSung' | 'Sung';
}

/**
 * One row painted on the page. Lyric rows pair the document's line view with
 * the element the translation updater writes into; musical-break rows carry
 * `dots` instead of text.
 *
 * `StartTime`/`EndTime` are the render path's millisecond mirror of the view's
 * seconds — the setter and AutoScroll search this list on every tick and must
 * not convert or allocate per line. They stay absent on rows that carry no
 * timing (Static lyrics), which is what tells the search to skip them.
 */
export interface PaintedLine {
  view: LineView;
  /** The `.main-lyrics-text` row element, for both payload kinds. */
  element: HTMLElement;
  /** Pre-enhancement text, compared against a translation to decide whether it adds information. */
  rawText?: string;
  StartTime?: number;
  EndTime?: number;
  /** Written by the setter each tick, read by the animator. */
  status?: 'Active' | 'NotSung' | 'Sung';
  /** Animator-only mirror of `status`, so a tick can skip unchanged rows. */
  lastStatus?: string;
  /** Present on musical-break rows: the ambient dots the setter statuses. */
  dots?: PaintedDot[];
}

/**
 * A row the render path can search: timing is guaranteed present. Produced by
 * the line-synced builder, which fills `StartTime`/`EndTime` for every row it
 * registers — including musical-break rows.
 */
export type TimedPaintedLine = PaintedLine & TimedLine;

// ── Internal state ──────────────────────────────────────────────────────────

const rows: PaintedLine[] = [];
const lineElementToStartTimeMap = new Map<HTMLElement, number>();
let timedLinesCache: TimedPaintedLine[] | null = null;

const THROTTLE_TIME = 0.05;
let lastRenderedPosition = -1;
let hasRenderedInitial = false;
let scrollTickCounter = 0;

let renderLoopDisposer: (() => void) | null = null;
let LinesEvListenerMaid: Maid | null = null;
let LinesEvListenerExists = false;

function invalidateTimedLinesCache(): void {
  timedLinesCache = null;
}

// ── Row registration ────────────────────────────────────────────────────────

export function registerRow(row: PaintedLine): void {
  rows.push(row);
  invalidateTimedLinesCache();
}

// ── Row reading ─────────────────────────────────────────────────────────────

export function getAllRows(): PaintedLine[] {
  return rows;
}

/** The painted lyric rows, musical-break rows excluded. */
export function getPaintedLines(): PaintedLine[] {
  return rows.filter((line) => !line.dots);
}

/**
 * A cached view of the rows that carry timing, invalidated on registerRow and
 * clear. The setter and AutoScroll binary-search this list on every tick.
 */
export function getTimedLines(): TimedPaintedLine[] {
  if (!timedLinesCache) {
    timedLinesCache = rows.filter(
      (line): line is TimedPaintedLine => typeof line.StartTime === 'number',
    );
  }
  return timedLinesCache;
}

/** The row whose status is 'Active' and whose element is connected. */
export function getActiveLine(): PaintedLine | undefined {
  return rows.find((line) => line.status === 'Active' && line.element.isConnected);
}

// ── Clear / reset ───────────────────────────────────────────────────────────

/**
 * Full reset: rows, map, loop state, setter cache, animator cache, and
 * AutoScroll.reset. Called before a new render and on page destroy.
 */
export function clear(): void {
  rows.length = 0;
  lineElementToStartTimeMap.clear();
  invalidateTimedLinesCache();
  lastRenderedPosition = -1;
  hasRenderedInitial = false;
  resetLyricsSetterCache();
  resetAnimatorCache();
  AutoScroll.reset();
}

// ── Render loop ─────────────────────────────────────────────────────────────

/**
 * Registers with PositionConsumer (surface 'highlight', 50 ms). The tick calls
 * the setter, the animator, and — at half cadence — AutoScroll.sync. The
 * cadence exists because scroll is expensive; the loop is the only place that
 * knows the tick rate.
 */
export function startLoop(): void {
  if (renderLoopDisposer) return;
  renderLoopDisposer = registerPositionConsumer({
    surface: 'highlight',
    intervalSeconds: THROTTLE_TIME,
    enabled: (ctx) => isPageOpen() && ctx.onLyricsPage,
    wantsTracking: (ctx) => ctx.onLyricsPage,
    onPosition: (progress, ctx) => {
      // Nothing moved since the last frame -> no re-render needed
      if (hasRenderedInitial && progress === lastRenderedPosition) return;

      lastRenderedPosition = progress;
      hasRenderedInitial = true;
      Lyrics.TimeSetter(progress);
      Lyrics.Animate();
      scrollTickCounter++;
      if (scrollTickCounter % 2 === 0) {
        // Hand the tick's settled answers over — AutoScroll must not re-derive them.
        AutoScroll.sync({ isPlaying: ctx.isPlaying, onLyricsPage: ctx.onLyricsPage });
      }
    },
  });
}

export function stopLoop(): void {
  if (renderLoopDisposer) {
    renderLoopDisposer();
    renderLoopDisposer = null;
  }
  lastRenderedPosition = -1;
  hasRenderedInitial = false;
}

// ── Click-to-seek ───────────────────────────────────────────────────────────

function LinesEvListener(e: Event) {
  let target = e.target as HTMLElement;
  let startTime: number | undefined;

  // If rt tag is clicked, use its parent
  if (target.tagName.toLowerCase() === 'rt') {
    if (target.parentElement) {
      target = target.parentElement;
    }
  }

  // If the target element is a ruby tag or has the translation class, target its parent if it exists
  if (target.tagName.toLowerCase() === 'ruby' || target.classList.contains('translation')) {
    if (target.parentElement) {
      target = target.parentElement;
    }
  }

  if (target.classList.contains('line')) {
    startTime = lineElementToStartTimeMap.get(target);
  }

  if (typeof startTime === 'number') {
    SpotifyPlayer.Seek(startTime);
  }
}

function populateElementTimeMaps(): void {
  lineElementToStartTimeMap.clear();

  rows.forEach((line) => {
    if (typeof line.StartTime === 'number') {
      lineElementToStartTimeMap.set(line.element, line.StartTime);
    }
  });
}

/**
 * Attaches the click-to-seek listener to the container the caller rendered
 * into. The registry owns the time map that feeds the lookup; the caller owns
 * the container selector.
 */
export function attachClickToSeek(container: HTMLElement): void {
  if (LinesEvListenerExists) {
    detachClickToSeek();
  }

  // Populate the maps before adding the listener
  populateElementTimeMaps();

  LinesEvListenerExists = true;
  LinesEvListenerMaid = new Maid();

  container.addEventListener('click', LinesEvListener);
  LinesEvListenerMaid.Give(() => {
    container.removeEventListener('click', LinesEvListener as EventListener);
  });
}

export function detachClickToSeek(): void {
  if (!LinesEvListenerExists) return;
  LinesEvListenerExists = false;

  // Maid will handle removing the event listener if it was successfully added
  if (LinesEvListenerMaid) {
    LinesEvListenerMaid.Destroy();
    LinesEvListenerMaid = null;
  }
}
