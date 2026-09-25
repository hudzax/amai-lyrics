import { ConvertTime } from '../../ConvertTime';
import { LyricsObject } from '../../lyrics';
import type { PaintedDot, PaintedLine } from '../../lyrics';

const DOT_GLYPH = '•' as const;
const INSTRUMENTAL_LABEL = 'Instrumental' as const;

/**
 * Creates a .dotGroup with 3 ambient dots, registered on the row itself.
 *
 * The dots keep their Start/End timing (so the parent .musical-line stays
 * Active for the whole break) but visuals are ambient-only: CSS drives a
 * staggered bounce whenever the parent line is .Active, ignoring per-dot
 * progress. See Mixed.css `.instrumental-pill`.
 */
function createDotGroup(startTime: number, endTime: number, dots: PaintedDot[]): HTMLElement {
  const dotGroup = document.createElement('div');
  dotGroup.classList.add('dotGroup');
  dotGroup.setAttribute('aria-hidden', 'true');

  const totalTime = endTime - startTime;
  const dotTime = totalTime / 3;

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('word', 'dot');
    dot.textContent = DOT_GLYPH;

    dots.push({
      element: dot,
      StartTime: startTime + dotTime * i,
      EndTime: i === 2 ? endTime - 400 : startTime + dotTime * (i + 1),
    });

    dotGroup.appendChild(dot);
  }

  return dotGroup;
}

/**
 * Builds the ambient pill: dots only (no icon / text).
 * Dots are aria-hidden; the pill carries the accessible name.
 */
function createInstrumentalPill(startMs: number, endMs: number, dots: PaintedDot[]): HTMLElement {
  const pill = document.createElement('div');
  pill.classList.add('instrumental-pill');
  pill.setAttribute('role', 'img');
  pill.setAttribute('aria-label', INSTRUMENTAL_LABEL);

  pill.appendChild(createDotGroup(startMs, endMs, dots));
  return pill;
}

/**
 * Registers a musical-break row in the painted-line list. The row carries a
 * view with no text — it is a row on the page, but not a lyric line — and the
 * `dots` marker that tells readers to leave it alone.
 */
function registerMusicalLine(startMs: number, endMs: number): PaintedLine {
  const line = document.createElement('div');
  line.classList.add('line', 'musical-line');

  const painted: PaintedLine = {
    view: { text: '', start: startMs / 1000, end: endMs / 1000 },
    element: line,
    StartTime: startMs,
    EndTime: endMs,
    dots: [],
  };

  LyricsObject.Lines.push(painted);
  return painted;
}

function buildMusicalLine(startMs: number, endMs: number, oppositeAligned?: boolean): HTMLElement {
  const painted = registerMusicalLine(startMs, endMs);
  const line = painted.element;

  if (oppositeAligned) line.classList.add('OppositeAligned');
  line.appendChild(createInstrumentalPill(startMs, endMs, painted.dots!));

  return line;
}

/**
 * Creates a .musical-line container, registers it, and appends the shimmer pill
 * (ambient dots only). Returns the element for fragment insertion.
 */
export function createMusicalLine(opts: {
  startTimeSec: number; // in seconds as received from API
  endTimeSec: number;
  oppositeAligned?: boolean;
}): HTMLElement {
  const { startTimeSec, endTimeSec, oppositeAligned } = opts;
  return buildMusicalLine(ConvertTime(startTimeSec), ConvertTime(endTimeSec), oppositeAligned);
}

/**
 * Variant that takes already-converted ms times (for breaks computed from
 * ConvertTime values). Use when caller already has ms.
 */
export function createMusicalLineMs(
  startMs: number,
  endMs: number,
  oppositeAligned?: boolean,
): HTMLElement {
  return buildMusicalLine(startMs, endMs, oppositeAligned);
}
