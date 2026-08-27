import { ConvertTime } from '../../ConvertTime';
import {
  LyricsObject,
  SetWordArrayInCurentLine,
  SetWordArrayInCurentLine_LINE_SYNCED,
} from '../../lyrics';

const NOTE_GLYPHS = ['♪', '♫', '♩'] as const;
const BULLET_GLYPH = '•' as const;

/**
 * Creates a .dotGroup with 3 note glyphs and registers them in the lyrics
 * object under the most-recent line. Shared between Syllable and Line paths
 * to avoid duplicated dot-timing math.
 */
function createDotGroup(
  lineType: 'Syllable' | 'Line',
  startTime: number,
  endTime: number,
): HTMLElement {
  const dotGroup = document.createElement('div');
  dotGroup.classList.add('dotGroup');

  const totalTime = endTime - startTime;
  const dotTime = totalTime / 3;

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('word', 'dot');
    // Preserve original glyph difference: Syllable uses bullet, Line uses notes
    dot.textContent = lineType === 'Syllable' ? BULLET_GLYPH : NOTE_GLYPHS[i % NOTE_GLYPHS.length];

    const target =
      lineType === 'Syllable' ? LyricsObject.Types.Syllable.Lines : LyricsObject.Types.Line.Lines;
    // Use the last pushed line (caller must have pushed it and called SetWordArray)
    const idx =
      lineType === 'Syllable'
        ? LyricsObject.Types.Syllable.Lines.length - 1
        : LyricsObject.Types.Line.Lines.length - 1;
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

export interface MusicalLineOptions {
  type: 'Syllable' | 'Line';
  startTimeSec: number; // in seconds as received from API
  endTimeSec: number;
  oppositeAligned?: boolean;
}

/**
 * Creates a .musical-line container, registers it in LyricsObject, and
 * appends a 3-dot group. Returns the element for fragment insertion.
 *
 * This consolidates the ~40 LOC duplicated between ApplySyllableLyrics
 * and ApplyLineLyrics.
 */
export function createMusicalLine(opts: MusicalLineOptions): HTMLElement {
  const { type, startTimeSec, endTimeSec, oppositeAligned } = opts;
  const startMs = ConvertTime(startTimeSec);
  const endMs = ConvertTime(endTimeSec);

  const line = document.createElement('div');
  line.classList.add('line', 'musical-line');
  if (oppositeAligned) line.classList.add('OppositeAligned');

  if (type === 'Syllable') {
    LyricsObject.Types.Syllable.Lines.push({
      HTMLElement: line,
      StartTime: startMs,
      EndTime: endMs,
      TotalTime: endMs - startMs,
      DotLine: true,
    } as never);
    SetWordArrayInCurentLine();
  } else {
    LyricsObject.Types.Line.Lines.push({
      HTMLElement: line,
      StartTime: startMs,
      EndTime: endMs,
      TotalTime: endMs - startMs,
      DotLine: true,
    } as never);
    SetWordArrayInCurentLine_LINE_SYNCED();
  }

  const dots = createDotGroup(type, startMs, endMs);
  line.appendChild(dots);
  return line;
}

/**
 * Variant that takes already-converted ms times (for breaks computed from
 * ConvertTime values). Use when caller already has ms.
 */
export function createMusicalLineMs(
  type: 'Syllable' | 'Line',
  startMs: number,
  endMs: number,
  oppositeAligned?: boolean,
): HTMLElement {
  const line = document.createElement('div');
  line.classList.add('line', 'musical-line');
  if (oppositeAligned) line.classList.add('OppositeAligned');

  if (type === 'Syllable') {
    LyricsObject.Types.Syllable.Lines.push({
      HTMLElement: line,
      StartTime: startMs,
      EndTime: endMs,
      TotalTime: endMs - startMs,
      DotLine: true,
    } as never);
    SetWordArrayInCurentLine();
  } else {
    LyricsObject.Types.Line.Lines.push({
      HTMLElement: line,
      StartTime: startMs,
      EndTime: endMs,
      TotalTime: endMs - startMs,
      DotLine: true,
    } as never);
    SetWordArrayInCurentLine_LINE_SYNCED();
  }

  const dots = createDotGroup(type, startMs, endMs);
  line.appendChild(dots);
  return line;
}
