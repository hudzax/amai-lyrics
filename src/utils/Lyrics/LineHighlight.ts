/**
 * LineHighlight — the single owner of which painted row is active and how it
 * looks: the row statuses, the blur window around the active row, the gradient
 * fill, the musical-break dots, and every class write that follows from them.
 *
 * The registry's tick crosses it with one call, handing over the position and
 * the play state it already settled, so nothing here re-reads the player.
 * Readers cross it through getActiveLine.
 *
 * Only rows that carry timing can be searched, so a Static document paints
 * nothing: the registry's timed view is empty and every entry returns.
 */

import { getAllRows, getTimedLines } from './registry';
import type { PaintedDot, PaintedLine, TimedPaintedLine } from './registry';
import { findActiveIndex } from './findActiveIndex';

/** The answers the tick already settled, so this module re-derives none of them. */
export interface LineHighlightContext {
  isPlaying: boolean;
}

type RowStatus = 'Active' | 'NotSung' | 'Sung';

// ── State ───────────────────────────────────────────────────────────────────

/** Index the status phase last settled on; -1 means no row is active. */
let lastActiveIndex = -1;
/** Length of the timed view the caches were built against. */
let lastCachedLength = -1;
/** Active index the blur was last painted for; null forces a full pass. */
let blurredActiveIndex: number | null = null;
/** Active index the blur window was last centred on, so a seek unions both. */
let lastBlurActiveIndex: number | null = null;
/** Play state the blur-skip decision was last made under. */
let lastIsPlaying: boolean | null = null;
/** Play state the blur values were last written under; a flip is a full pass. */
let lastBlurIsPlaying: boolean | null = null;

// Last value written per (element, property), so unchanged style writes are
// skipped without reading `element.style.getPropertyValue()` — reading inline
// style on the hot path forces style resolution and, interleaved with the
// per-frame writes, can trigger recalculation. Keyed by the lyric DOM nodes, so
// entries are collected when a song's rows are re-created; reset() deliberately
// leaves this alone. This module is the sole writer of the properties it tracks
// (gradients, transforms, scales, shadows, blur).
const styleWriteCache = new WeakMap<HTMLElement, Map<string, string>>();

const MAX_BLUR_DISTANCE = 6;
const MAX_BLUR_PX = 5;

function setStyleIfChanged(element: HTMLElement, property: string, value: string): void {
  let props = styleWriteCache.get(element);
  if (!props) {
    props = new Map();
    styleWriteCache.set(element, props);
  }
  if (props.get(property) !== value) {
    props.set(property, value);
    element.style.setProperty(property, value);
  }
}

// ── Statuses ────────────────────────────────────────────────────────────────

function statusAt(start: number, end: number, current: number): RowStatus {
  if (start <= current && current <= end) return 'Active';
  return start >= current ? 'NotSung' : 'Sung';
}

/** The instrumental pill is ambient-only (CSS-driven). */
function updateDotStatuses(dots: PaintedDot[], current: number): void {
  for (const dot of dots) {
    dot.status = statusAt(dot.StartTime, dot.EndTime, current);
  }
}

/**
 * No row contains the position, so every row's status follows from it directly.
 * A row can still come out Active here: the search is a binary one and assumes
 * sorted, non-overlapping spans, so this is the path that catches a document
 * which breaks that assumption.
 */
function applyNoActive(tLines: TimedPaintedLine[], position: number): void {
  for (const line of tLines) {
    const next = statusAt(line.StartTime, line.EndTime, position);
    if (line.status !== next) line.status = next;
  }
  lastActiveIndex = -1;
}

/** Move the active row from the last settled index to the new one. */
function applyDelta(tLines: TimedPaintedLine[], activeIndex: number, position: number): void {
  if (lastActiveIndex === -1) {
    for (let i = 0; i < tLines.length; i++) {
      const line = tLines[i]!;
      const next = i === activeIndex ? 'Active' : i < activeIndex ? 'Sung' : 'NotSung';
      if (line.status !== next) line.status = next;
    }
  } else if (activeIndex > lastActiveIndex) {
    const prev = tLines[lastActiveIndex]!;
    if (prev.status !== 'Sung') prev.status = 'Sung';
    for (let i = lastActiveIndex + 1; i < activeIndex; i++) {
      const line = tLines[i]!;
      if (line.status !== 'Sung') line.status = 'Sung';
    }
    const cur = tLines[activeIndex]!;
    if (cur.status !== 'Active') cur.status = 'Active';
  } else {
    const prev = tLines[lastActiveIndex]!;
    if (prev.status !== 'NotSung') prev.status = 'NotSung';
    for (let i = activeIndex + 1; i <= lastActiveIndex - 1; i++) {
      const line = tLines[i]!;
      const next = line.StartTime >= position ? 'NotSung' : 'Sung';
      if (line.status !== next) line.status = next;
    }
    const cur = tLines[activeIndex]!;
    if (cur.status !== 'Active') cur.status = 'Active';
  }
  const activeLine = tLines[activeIndex]!;
  if (activeLine.dots) updateDotStatuses(activeLine.dots, position);
  lastActiveIndex = activeIndex;
}

// ── Blur ────────────────────────────────────────────────────────────────────

/**
 * Only rows within the blur radius can change value; far rows clamp, so they
 * never change after the first active. On sequential ticks just the two windows
 * around the old and new active can change, but a seek may leave them
 * non-overlapping — hence the union.
 */
function applyBlur(arr: TimedPaintedLine[], activeIndex: number, isPlaying: boolean): void {
  const playStateChanged = isPlaying !== lastBlurIsPlaying;
  lastBlurIsPlaying = isPlaying;

  const windows: Array<{ lo: number; hi: number }> = [];
  const pushWindow = (center: number | null): void => {
    if (center == null || center < 0) return;
    windows.push({
      lo: Math.max(0, center - MAX_BLUR_DISTANCE),
      hi: Math.min(arr.length - 1, center + MAX_BLUR_DISTANCE),
    });
  };
  pushWindow(activeIndex);
  pushWindow(lastBlurActiveIndex);

  // A first pass, or a play-state flip, must visit every row: pausing unblurs
  // the whole list and resuming re-blurs it, and neither is a windowed change.
  // Afterwards windowed updates keep the far rows stable.
  const fullPass = lastBlurActiveIndex == null || playStateChanged;
  lastBlurActiveIndex = activeIndex;

  const blurFor = (distance: number): string =>
    isPlaying ? `${Math.min(distance, MAX_BLUR_PX)}px` : '0px';

  const paintRow = (i: number): void => {
    const row = arr[i]!;
    const value = row.status !== 'Active' ? blurFor(Math.abs(i - activeIndex)) : '0px';
    setStyleIfChanged(row.element, '--BlurAmount', value);
  };

  if (fullPass) {
    for (let i = 0; i < arr.length; i++) paintRow(i);
    return;
  }

  // A Set keeps the overlap between the two windows from being visited twice.
  const visited = new Set<number>();
  for (const { lo, hi } of windows) {
    for (let i = lo; i <= hi; i++) {
      if (visited.has(i)) continue;
      visited.add(i);
      paintRow(i);
    }
  }
}

// ── Paint ───────────────────────────────────────────────────────────────────

// Stale inline styles would override the pill's ambient keyframes, so the dots
// only ever get `.dot-active` plus a clean slate.
function clearDotInlineStyles(dot: PaintedDot): void {
  setStyleIfChanged(dot.element, 'transform', '');
  setStyleIfChanged(dot.element, 'scale', '');
  setStyleIfChanged(dot.element, 'opacity', '');
  setStyleIfChanged(dot.element, '--text-shadow-blur-radius', '');
  setStyleIfChanged(dot.element, '--text-shadow-opacity', '');
  setStyleIfChanged(dot.element, '--dot-duration', '');
}

function activateDot(dot: PaintedDot): void {
  if (!dot.element.classList.contains('dot-active')) {
    void dot.element.offsetWidth;
    dot.element.classList.add('dot-active');
  }
  clearDotInlineStyles(dot);
}

function deactivateDot(dot: PaintedDot): void {
  dot.element.classList.remove('dot-active');
  clearDotInlineStyles(dot);
}

/**
 * Writes the classes and gradients that follow from the statuses. Only rows
 * whose status flipped need work, except the active one, which is visited every
 * tick so a play-state flip repaints it.
 */
function paintStatuses(arr: TimedPaintedLine[]): void {
  for (let index = 0; index < arr.length; index++) {
    const line = arr[index]!;
    const prevStatus = line.lastStatus;
    if (prevStatus === line.status && line.status !== 'Active') continue;

    if (line.status === 'Active') {
      line.element.classList.add('Active');
      line.element.classList.remove('NotSung', 'OverridenByScroller', 'Sung');
      if (line.dots) {
        for (const dot of line.dots) {
          if (dot.status === 'Active') activateDot(dot);
          else if (dot.status === 'NotSung' || dot.status === 'Sung') deactivateDot(dot);
        }
      } else {
        setStyleIfChanged(line.element, '--gradient-position', '100%');
      }
    } else if (line.status === 'NotSung') {
      if (prevStatus !== 'NotSung') {
        line.element.classList.add('NotSung');
        line.element.classList.remove('Sung');
        // AutoScroll pre-highlights the row it is scrolling towards and marks it
        // so; that mark is the only thing allowed to keep Active on a row the
        // playback position has not reached yet.
        if (
          line.element.classList.contains('Active') &&
          !line.element.classList.contains('OverridenByScroller')
        ) {
          line.element.classList.remove('Active');
        }
        setStyleIfChanged(line.element, '--gradient-position', '0%');
      }
    } else if (line.status === 'Sung') {
      if (prevStatus !== 'Sung') {
        line.element.classList.add('Sung');
        line.element.classList.remove('Active', 'NotSung');
        setStyleIfChanged(line.element, '--gradient-position', '100%');
      }
    }
    line.lastStatus = line.status;
  }
}

// ── Interface ───────────────────────────────────────────────────────────────

/**
 * One highlight tick. The caller hands over the position and the play state it
 * already settled; nothing here asks the player for either.
 */
export function sync(position: number, ctx: LineHighlightContext): void {
  const tLines = getTimedLines();
  if (!tLines.length) return;
  if (tLines.length !== lastCachedLength) {
    lastActiveIndex = -1;
    lastCachedLength = tLines.length;
  }

  const searched = findActiveIndex(tLines, position);

  if (searched === -1) {
    applyNoActive(tLines, position);
  } else if (searched !== lastActiveIndex) {
    applyDelta(tLines, searched, position);
  } else {
    const active = tLines[searched]!;
    if (active.dots) updateDotStatuses(active.dots, position);
  }

  // The paint runs every tick, whatever the statuses did.
  const activeIndex = searched !== -1 ? searched : tLines.findIndex((l) => l.status === 'Active');
  if (activeIndex !== -1) {
    if (ctx.isPlaying !== lastIsPlaying) {
      blurredActiveIndex = null;
      lastIsPlaying = ctx.isPlaying;
    }
    if (blurredActiveIndex !== activeIndex) {
      applyBlur(tLines, activeIndex, ctx.isPlaying);
      blurredActiveIndex = activeIndex;
    }
  } else if (blurredActiveIndex !== null) {
    // An interlude: drop the blur state so the next active row re-initialises.
    lastBlurActiveIndex = null;
    blurredActiveIndex = null;
  }

  paintStatuses(tLines);
}

/** The row the highlight currently marks active, if it is still in the page. */
export function getActiveLine(): PaintedLine | undefined {
  return getAllRows().find((line) => line.status === 'Active' && line.element.isConnected);
}

/**
 * Drop every cached answer so the next tick starts from scratch. The registry's
 * full reset calls this; the style cache is keyed per element and dies with the
 * rows, so it is not cleared here.
 */
export function reset(): void {
  lastActiveIndex = -1;
  lastCachedLength = -1;
  blurredActiveIndex = null;
  lastBlurActiveIndex = null;
  lastIsPlaying = null;
  lastBlurIsPlaying = null;
}
