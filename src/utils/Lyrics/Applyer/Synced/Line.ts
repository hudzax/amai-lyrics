import { renderLyrics } from '../../LyricsRenderer';
import type { RenderableLyricsData } from '../../LyricsRenderer';

/**
 * Applies line-synced lyrics to the lyrics container.
 *
 * Thin adapter over the LyricsRenderer seam: the row building, registration,
 * and scroll mount live behind `renderLyrics`. Kept as a named entry so
 * existing callers and tests keep crossing a stable interface.
 *
 * @param data Lyrics data with content, timing and styling information
 */
export function ApplyLineLyrics(data: RenderableLyricsData): void {
  renderLyrics(data);
}
