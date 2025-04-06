import { setBlurringLastLine } from '../Animator/Lyrics/LyricsAnimator';
import { ApplyStaticLyrics } from '../Applyer/Static';
import { ApplyLineLyrics } from '../Applyer/Synced/Line';
import { ApplySyllableLyrics } from '../Applyer/Synced/Syllable';
import fetchLyrics from '../fetchLyrics';

export default function ApplyLyrics(lyrics) {
  if (!document.querySelector('#SpicyLyricsPage')) return;
  setBlurringLastLine(null);
  if (!lyrics) return;
  if (Spicetify.Player.data.item?.uri?.split(':')[2] !== lyrics?.id) {
    fetchLyrics(Spicetify.Player.data.item?.uri).then(ApplyLyrics);
    return;
  }
  if (lyrics?.Type === 'Syllable') {
    ApplySyllableLyrics(lyrics);
  } else if (lyrics?.Type === 'Line') {
    ApplyLineLyrics(lyrics);
  } else if (lyrics?.Type === 'Static') {
    ApplyStaticLyrics(lyrics);
  }
}
