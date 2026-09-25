import { renderLyrics } from '../LyricsRenderer';
import type { LyricsDocument } from '../conversion';

/**
 * Applies static (unsynced) lyrics to the lyrics container.
 *
 * Thin adapter over the LyricsRenderer seam: the row building, registration,
 * and scroll mount live behind `renderLyrics`. Kept as a named entry so
 * existing callers keep crossing a stable interface.
 */
export function ApplyStaticLyrics(data: LyricsDocument): void {
  renderLyrics(data);
}
