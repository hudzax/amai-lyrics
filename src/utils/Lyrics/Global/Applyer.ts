import { setBlurringLastLine } from '../Animator/Lyrics/LyricsAnimator';
import { ApplyStaticLyrics } from '../Applyer/Static';
import { ApplyLineLyrics } from '../Applyer/Synced/Line';
import { ApplySyllableLyrics } from '../Applyer/Synced/Syllable';
import fetchLyrics from '../fetchLyrics';

/**
 * Applies lyrics to the UI based on the lyrics type
 * @param lyrics The lyrics data object containing type and content
 */
export default function ApplyLyrics(lyrics) {
  // Check if lyrics page exists
  if (!document.querySelector('#SpicyLyricsPage')) return;

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
  }
}
