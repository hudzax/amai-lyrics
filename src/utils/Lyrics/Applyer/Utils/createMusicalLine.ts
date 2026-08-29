import { ConvertTime } from '../../ConvertTime';
import { LyricsObject, SetWordArrayInCurentLine_LINE_SYNCED } from '../../lyrics';

const NOTE_GLYPHS = ['♪', '♫', '♩'] as const;

/**
 * Creates a .dotGroup with 3 note glyphs and registers them in the lyrics
 * object under the most-recent Line line. Caller must have pushed the line
 * and called SetWordArrayInCurentLine_LINE_SYNCED() first.
 */
function createDotGroup(startTime: number, endTime: number): HTMLElement {
  const dotGroup = document.createElement('div');
  dotGroup.classList.add('dotGroup');

  const totalTime = endTime - startTime;
  const dotTime = totalTime / 3;

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('word', 'dot');
    dot.textContent = NOTE_GLYPHS[i % NOTE_GLYPHS.length];

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
 * appends a 3-dot group. Returns the element for fragment insertion.
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

  const dots = createDotGroup(startMs, endMs);
  line.appendChild(dots);
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

  const dots = createDotGroup(startMs, endMs);
  line.appendChild(dots);
  return line;
}
