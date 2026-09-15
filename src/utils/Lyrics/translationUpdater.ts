/**
 * Updates already-displayed lyric lines in place with translations and
 * phonetics, preserving element identity, scroll position and animation state.
 *
 * Thin adapter over the LyricsRenderer seam: the update, re-anchor, and
 * recalculation live behind `updateLyricTranslations`. This module keeps the
 * historic names so existing callers and tests keep crossing a stable
 * interface.
 */

export { applyScrollReanchor } from './LyricsRenderer';
import { updateLyricTranslations } from './LyricsRenderer';
import type { LyricsData } from './conversion';

/**
 * Updates the currently displayed lyrics with translations and phonetics.
 * Preserves scroll position and animation state.
 *
 * @param lyricsData - Enhanced lyrics data with translations and phonetics
 */
export function updateDisplayedLyricsWithTranslations(lyricsData: LyricsData): void {
  updateLyricTranslations(lyricsData);
}
