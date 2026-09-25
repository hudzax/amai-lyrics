import { renderLyrics } from '../../LyricsRenderer';
import type { LyricsDocument } from '../../conversion';

/**
 * Applies line-synced lyrics to the lyrics container.
 *
 * Thin adapter over the LyricsRenderer seam: the row building, registration,
 * and scroll mount live behind `renderLyrics`. Kept as a named entry so
 * existing callers and tests keep crossing a stable interface.
 *
 * @param data Lyrics document to render
 */
export function ApplyLineLyrics(data: LyricsDocument): void {
  renderLyrics(data);
}
