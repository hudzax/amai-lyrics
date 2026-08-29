import { setBlurringLastLine } from '../Animator/Lyrics/LyricsAnimator';
import { ApplyStaticLyrics } from '../Applyer/Static';
import { ApplyLineLyrics } from '../Applyer/Synced/Line';
import fetchLyrics, { isNoLyricsResult } from '../fetchLyrics';
import { showRefreshButton } from '../../../components/Pages/pageButtons';
import { addLinesEvListener } from '../lyrics';
import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';
import { NoLyricsResult } from '../ui';
import { LyricsData } from '../processing';

/**
 * Applies lyrics to the UI based on the lyrics type
 * @param lyrics The lyrics data object containing type and content, or NO_LYRICS sentinel
 */
export default function ApplyLyrics(lyrics: LyricsData | NoLyricsResult | null | undefined) {
  // Check if lyrics page exists
  if (!document.querySelector('#SpicyLyricsPage')) return;

  // Apply font sizes from settings
  const lyricsContent = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
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
    return;
  const typedLyrics = lyrics as LyricsData;
  if (!typedLyrics?.id) return;

  // Check if lyrics match current track
  const currentTrackId = Spicetify.Player.data?.item?.uri?.split(':')[2];
  if (currentTrackId !== typedLyrics?.id) {
    const uri = Spicetify.Player.data?.item?.uri;
    if (uri) {
      fetchLyrics(uri)
        .then(ApplyLyrics)
        .catch((e) => console.error('[Amai Lyrics] Failed to re-fetch mismatched lyrics:', e));
    }
    return;
  }

  // Apply lyrics based on type
  // NOTE: 'Syllable' lyrics are normalized to 'Line' on ingest (processing.ts);
  // the word-by-word karaoke renderer has been removed.
  const lyricsHandlers = {
    Line: ApplyLineLyrics,
    Static: ApplyStaticLyrics,
  };

  const applyHandler = lyricsHandlers[typedLyrics.Type as keyof typeof lyricsHandlers];
  if (applyHandler) {
    applyHandler(typedLyrics as never);
    // Show refresh button after lyrics are applied
    showRefreshButton();
    addLinesEvListener(); // Attach event listener after lyrics are rendered
  }
}
