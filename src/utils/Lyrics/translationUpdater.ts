/**
 * Updates already-displayed lyric lines in place with translations and
 * phonetics, preserving element identity, scroll position and animation state.
 *
 * Thin adapter over the LyricsRenderer seam: the update, re-anchor, and
 * recalculation live behind `updateLyricTranslations`, which reads the
 * registered rows directly. This module keeps the historic name so existing
 * callers and tests keep crossing a stable interface.
 */

export { applyScrollReanchor } from './LyricsRenderer';
import { updateLyricTranslations } from './LyricsRenderer';

/**
 * Updates the currently displayed lyrics with translations and phonetics.
 * Preserves scroll position and animation state.
 */
export function updateDisplayedLyricsWithTranslations(): void {
  updateLyricTranslations();
}
