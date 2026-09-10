/**
 * Extrapolates a playback position from a timestamp-pinned anchor.
 *
 * `anchorPosition` is the position reported at `anchorTimestampMs`; the result
 * adds the elapsed wall-clock time since then. This is the single source of
 * truth for the core position math that GetProgress previously inlined in four
 * places (the sync loop, the resume re-anchor, the playing-path derivation and
 * the deprecated fallback).
 */
export function extrapolatePosition(
  anchorPosition: number,
  anchorTimestampMs: number,
  nowMs: number,
): number {
  return anchorPosition + (nowMs - anchorTimestampMs);
}
