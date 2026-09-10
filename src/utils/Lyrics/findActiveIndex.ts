/**
 * Binary search for the lyric line containing a playback position (inclusive on
 * both ends).
 *
 * This replaces three hand-rolled copies (LyricsSetter, ScrollToActiveLine and
 * PlaybarLyrics) that had drifted apart in field naming (StartTime/EndTime vs
 * startTime/endTime). The canonical field names follow the domain convention;
 * StartTime/EndTime are in the same unit as `position` (milliseconds everywhere
 * on the render path).
 */
export interface TimedLine {
  StartTime: number;
  EndTime: number;
}

export function findActiveIndex<T extends TimedLine>(
  lines: readonly T[],
  position: number,
): number {
  let lo = 0;
  let hi = lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const line = lines[mid];
    if (line.StartTime <= position && position <= line.EndTime) return mid;
    if (position < line.StartTime) hi = mid - 1;
    else lo = mid + 1;
  }
  return -1;
}
