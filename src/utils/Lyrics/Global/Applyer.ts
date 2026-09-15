import { setBlurringLastLine } from '../Animator/Lyrics/LyricsAnimator';
import { renderLyrics } from '../LyricsRenderer';
import { isNoLyricsResult } from '../fetchLyrics';
import { showRefreshButton } from '../../../components/Pages/pageButtons';
import { addLinesEvListener } from '../lyrics';
import { liveTrackId } from '../trackId';
import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';
import { NoLyricsResult } from '../ui';
import { LyricsData } from '../conversion';

/**
 * Applies lyrics to the UI based on the lyrics type.
 * Returns true when the lyrics were mounted. Returns false (without fetching
 * anything) when the payload went stale — the pipeline owns the single retry
 * for the live track, so this module never calls back into the fetch seam.
 */
export default function ApplyLyrics(
  lyrics: LyricsData | NoLyricsResult | null | undefined,
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
  if (
    !lyrics ||
    isNoLyricsResult(lyrics as never) ||
    (lyrics as NoLyricsResult).status === 'NO_LYRICS'
  )
    return false;
  const typedLyrics = lyrics as LyricsData;
  if (!typedLyrics?.id) return false;

  // Stale payload (track moved mid-flight): decline and let the pipeline
  // retry once for the live track. No self-refetch here — the seam stays
  // one-directional (pipeline -> apply). Track-id parsing lives in the
  // trackId leaf so this gate never splits URIs itself.
  const currentTrackId = liveTrackId();
  if (currentTrackId !== typedLyrics?.id) return false;

  // Render behind the single LyricsRenderer seam. 'Syllable' lyrics are
  // normalized to 'Line' on ingest (processing.ts); the word-by-word karaoke
  // renderer has been removed.
  if (typedLyrics.Type !== 'Line' && typedLyrics.Type !== 'Static') return false;
  renderLyrics(typedLyrics);
  // Show refresh button after lyrics are applied
  showRefreshButton();
  addLinesEvListener(); // Attach event listener after lyrics are rendered
  return true;
}
