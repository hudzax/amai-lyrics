import { setBlurringLastLine } from '../Animator/Lyrics/LyricsAnimator';
import { ApplyStaticLyrics } from '../Applyer/Static';
import { ApplyLineLyrics } from '../Applyer/Synced/Line';
import { ApplySyllableLyrics } from '../Applyer/Synced/Syllable';
import fetchLyrics from '../fetchLyrics';
import { showRefreshButton } from '../../../components/Pages/pageButtons';
import { addLinesEvListener } from '../lyrics';
import storage from '../../storage';
import Defaults from '../../../components/Global/Defaults';

/**
 * Applies lyrics to the UI based on the lyrics type
 * @param lyrics The lyrics data object containing type and content
 */
export default function ApplyLyrics(lyrics) {
  // Check if lyrics page exists
  if (!document.querySelector('#SpicyLyricsPage')) return;

  // Apply font sizes from settings
  const lyricsContent = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (lyricsContent) {
    const translationFontSize = storage.get('translation_font_size') || Defaults.translationFontSize;
    lyricsContent.style.setProperty('--TranslationFontSize', translationFontSize + 'rem');

    const defaultLyricsSize = storage.get('default_lyrics_size');
    if (defaultLyricsSize) {
      lyricsContent.style.setProperty('--DefaultLyricsSize', defaultLyricsSize + 'rem');
    }
  }

  // Reset blurring effect
  setBlurringLastLine(null);

  // Validate lyrics data
  if (!lyrics || !lyrics?.id) return;

  // Check if lyrics match current track
  const currentTrackId = Spicetify.Player.data.item?.uri?.split(':')[2];
  if (currentTrackId !== lyrics?.id) {
    fetchLyrics(Spicetify.Player.data.item?.uri).then(ApplyLyrics);
    return;
  }

  // Apply lyrics based on type
  const lyricsHandlers = {
    Syllable: ApplySyllableLyrics,
    Line: ApplyLineLyrics,
    Static: ApplyStaticLyrics,
  };

  const applyHandler = lyricsHandlers[lyrics.Type];
  if (applyHandler) {
    applyHandler(lyrics);
    // Show refresh button after lyrics are applied
    showRefreshButton();
    addLinesEvListener(); // Attach event listener after lyrics are rendered
  }
}
