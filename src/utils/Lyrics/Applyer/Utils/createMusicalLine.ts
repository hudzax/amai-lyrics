import { ConvertTime } from '../../ConvertTime';
import { LyricsObject, SetWordArrayInCurentLine_LINE_SYNCED } from '../../lyrics';

const DOT_GLYPH = '•' as const;
const INSTRUMENTAL_LABEL = 'Instrumental' as const;

/**
 * Creates a .dotGroup with 3 ambient dots and registers them in the lyrics
 * object under the most-recent Line line. Caller must have pushed the line
 * and called SetWordArrayInCurentLine_LINE_SYNCED() first.
 *
 * The dots keep their Start/End timing (so the parent .musical-line stays
 * Active for the whole break) but visuals are ambient-only: CSS drives a
 * staggered bounce whenever the parent line is .Active, ignoring per-dot
 * progress. See Mixed.css `.instrumental-pill`.
 */
function createDotGroup(startTime: number, endTime: number): HTMLElement {
  const dotGroup = document.createElement('div');
  dotGroup.classList.add('dotGroup');
  dotGroup.setAttribute('aria-hidden', 'true');

  const totalTime = endTime - startTime;
  const dotTime = totalTime / 3;

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('word', 'dot');
    dot.textContent = DOT_GLYPH;

    const target = LyricsObject.Types.Line.Lines;
    // Use the last pushed line (caller must have pushed it and called SetWordArray)
    const idx = target.length - 1;
    // Fallback if caller hasn't pushed yet — push placeholder handled by caller
    if (idx >= 0 && target[idx]?.Syllables?.Lead) {
      target[idx].Syllables.Lead.push({
        HTMLElement: dot,
        StartTime: startTime + dotTime * i,
        EndTime: i === 2 ? endTime - 400 : startTime + dotTime * (i + 1),
        TotalTime: dotTime,
        Dot: true,
      } as never);
    }

    dotGroup.appendChild(dot);
  }

  return dotGroup;
}

/**
 * Builds the ambient pill: dots only (no icon / text).
 * Dots are aria-hidden; the pill carries the accessible name.
 */
function createInstrumentalPill(startMs: number, endMs: number): HTMLElement {
  const pill = document.createElement('div');
  pill.classList.add('instrumental-pill');
  pill.setAttribute('role', 'img');
  pill.setAttribute('aria-label', INSTRUMENTAL_LABEL);

  pill.appendChild(createDotGroup(startMs, endMs));
  return pill;
}

function registerMusicalLine(startMs: number, endMs: number): HTMLElement {
  const line = document.createElement('div');
  line.classList.add('line', 'musical-line');

  LyricsObject.Types.Line.Lines.push({
    HTMLElement: line,
    StartTime: startMs,
    EndTime: endMs,
    TotalTime: endMs - startMs,
    DotLine: true,
  } as never);
  SetWordArrayInCurentLine_LINE_SYNCED();

  return line;
}

/**
 * Creates a .musical-line container, registers it in LyricsObject, and
 * appends the shimmer pill (ambient dots only).
 * Returns the element for fragment insertion.
 */
export function createMusicalLine(opts: {
  startTimeSec: number; // in seconds as received from API
  endTimeSec: number;
  oppositeAligned?: boolean;
}): HTMLElement {
  const { startTimeSec, endTimeSec, oppositeAligned } = opts;
  const startMs = ConvertTime(startTimeSec);
  const endMs = ConvertTime(endTimeSec);

  const line = registerMusicalLine(startMs, endMs);
  if (oppositeAligned) line.classList.add('OppositeAligned');

  line.appendChild(createInstrumentalPill(startMs, endMs));
  return line;
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
  const line = registerMusicalLine(startMs, endMs);
  if (oppositeAligned) line.classList.add('OppositeAligned');

  line.appendChild(createInstrumentalPill(startMs, endMs));
  return line;
}
