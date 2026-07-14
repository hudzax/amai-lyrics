import sleep from '../utils/sleep';
import { ButtonManager } from './ButtonManager';
import { NowPlayingBarBackground } from '../components/DynamicBG/NowPlayingBarBackground';
import { EnsureProcessingIndicatorHidden } from '../utils/Lyrics/ui';
import storage from '../utils/storage';

export class SongChangeManager {
  private buttonManager: ButtonManager;
  private backgroundManager: NowPlayingBarBackground;
  private latestUri: string | null = null;

  constructor(buttonManager: ButtonManager, backgroundManager: NowPlayingBarBackground) {
    this.buttonManager = buttonManager;
    this.backgroundManager = backgroundManager;
  }

  public async handleSongChange(event: { data?: { item?: { uri?: string } } }) {
    let attempts = 0;
    const maxAttempts = 5;
    let currentUri = event?.data?.item?.uri;

    while (!currentUri && attempts < maxAttempts) {
      await sleep(0.1);
      currentUri = Spicetify.Player.data?.item?.uri;
      attempts++;
    }

    if (!currentUri) return;

    // Track the most recently requested track so we only apply the lyrics that
    // belong to the track the user ultimately landed on.
    this.latestUri = currentUri;

    // Hide processing indicator when song changes to prevent stuck indicators
    EnsureProcessingIndicatorHidden();

    // Clear the global "currently fetching" flag so a rapid sequence of skips
    // doesn't leave the final track un-fetched. Each song change triggers a
    // real fetch for the current track; stale results are discarded by their
    // own track-id guard inside processAndEnhanceLyrics. Without this, the
    // inflight fetch for an earlier (skipped) track would block every
    // subsequent fetch until it resolved, leaving the playbar lyrics empty
    // until the lyrics page was opened.
    storage.set('currentlyFetching', 'false');

    // Fetch and apply lyrics on song change (already non-blocking)
    const { default: fetchLyrics } = await import('../utils/Lyrics/fetchLyrics');
    const { default: ApplyLyrics } = await import('../utils/Lyrics/Global/Applyer');
    fetchLyrics(currentUri).then((lyrics) => {
      // Only apply if this track is still the latest one the user landed on.
      if (this.latestUri === currentUri) {
        ApplyLyrics(lyrics);
      }
    });

    // Update button registration (synchronous but fast)
    this.buttonManager.updateRegistration();

    // Apply background immediately with current data
    this.backgroundManager.apply(Spicetify.Player.data?.item?.metadata?.image_url);

    // Update UI elements directly without waiting for track info
    if (Spicetify.Player.data.item?.type === 'track') {
      if (document.querySelector('#SpicyLyricsPage .ContentBox .NowBar')) {
        const { UpdateNowBar } = await import('../components/Utils/NowBar');
        UpdateNowBar();
      }
    }

    if (document.querySelector('#SpicyLyricsPage .LyricsContainer')) {
      // Update the page content (artwork, song name, artists)
      const { default: PageView } = await import('../components/Pages/PageView');
      PageView.UpdatePageContent();

      // Apply dynamic background
      const { default: ApplyDynamicBackground } = await import(
        '../components/DynamicBG/dynamicBackground'
      );
      ApplyDynamicBackground(document.querySelector('#SpicyLyricsPage .ContentBox'));
    }
  }
}
