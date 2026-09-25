import { setBlurringLastLine } from '../Animator/Lyrics/LyricsAnimator';
import { renderLyrics } from '../LyricsRenderer';
import { isNoLyricsResult } from '../fetchLyrics';
import { showRefreshButton } from '../../../components/Pages/pageButtons';
import { addLinesEvListener } from '../lyrics';
import { liveTrackId } from '../trackId';
import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';
import { NoLyricsResult } from '../ui';
import { LyricsDocument } from '../conversion';

/**
 * Applies lyrics to the UI.
 * Returns true when the lyrics were mounted. Returns false (without fetching
 * anything) when the document went stale — the pipeline owns the single retry
 * for the live track, so this module never calls back into the fetch seam.
 */
export default function ApplyLyrics(
  lyrics: LyricsDocument | NoLyricsResult | null | undefined,
): boolean {
  // Check if lyrics page exists
  if (!document.querySelector('#AmaiLyricsPage')) return false;

  // Apply font sizes from settings
  const lyricsContent = document.querySelector<HTMLElement>(
    '#AmaiLyricsPage .LyricsContainer .LyricsContent',
  );
  if (lyricsContent) {
    const translationFontSize =
      storage.get('translation_font_size') || Defaults.translationFontSize;
    lyricsContent.style.setProperty('--TranslationFontSize', translationFontSize);

    const defaultLyricsSize = storage.get('default_lyrics_size');
    if (defaultLyricsSize) {
      lyricsContent.style.setProperty('--DefaultLyricsSize', defaultLyricsSize + 'rem');
    }
  }

  // Reset blurring effect
  setBlurringLastLine(null);

  // Typed sentinel check — don't attempt to render NO_LYRICS payload
  if (!lyrics || isNoLyricsResult(lyrics)) return false;
  const lyricsDocument = lyrics;
  if (!lyricsDocument.id) return false;

  // Stale payload (track moved mid-flight): decline and let the pipeline
  // retry once for the live track. No self-refetch here — the seam stays
  // one-directional (pipeline -> apply). Track-id parsing lives in the
  // trackId leaf so this gate never splits URIs itself.
  const currentTrackId = liveTrackId();
  if (currentTrackId !== lyricsDocument.id) return false;

  // The document's kind is validated where it is built, so there is nothing
  // left to check here.
  renderLyrics(lyricsDocument);
  // Show refresh button after lyrics are applied
  showRefreshButton();
  addLinesEvListener(); // Attach event listener after lyrics are rendered
  return true;
}
