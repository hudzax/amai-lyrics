import sleep from '../utils/sleep';
import { ButtonManager } from './ButtonManager';
import { NowPlayingBarBackground } from '../components/DynamicBG/NowPlayingBarBackground';
import { EnsureProcessingIndicatorHidden } from '../utils/Lyrics/ui';

export class SongChangeManager {
  private buttonManager: ButtonManager;
  private backgroundManager: NowPlayingBarBackground;
  private latestUri: string | null = null;
  private bgDebounceTimer: number | null = null;
  private pageBgDebounceTimer: number | null = null;

  constructor(buttonManager: ButtonManager, backgroundManager: NowPlayingBarBackground) {
    this.buttonManager = buttonManager;
    this.backgroundManager = backgroundManager;
  }

  private debouncedBgApply(coverUrl: string | undefined): void {
    if (this.bgDebounceTimer !== null) clearTimeout(this.bgDebounceTimer);
    this.bgDebounceTimer = window.setTimeout(() => {
      this.backgroundManager.apply(coverUrl);
      this.bgDebounceTimer = null;
    }, 500);
  }

  private async debouncedPageBgApply(): Promise<void> {
    if (this.pageBgDebounceTimer !== null) clearTimeout(this.pageBgDebounceTimer);
    return new Promise((resolve) => {
      this.pageBgDebounceTimer = window.setTimeout(async () => {
        const { default: ApplyDynamicBackground } = await import(
          '../components/DynamicBG/dynamicBackground'
        );
        ApplyDynamicBackground(document.querySelector('#SpicyLyricsPage .ContentBox'));
        this.pageBgDebounceTimer = null;
        resolve();
      }, 500);
    });
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

    // Fetch and apply lyrics on song change. Fetches are now per-track and run
    // concurrently, so a slow fetch for a skipped song never blocks the lyrics
    // of the song the user lands on. Stale results are discarded by the
    // `latestUri` guard below and by the track-id checks inside processing.
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

    // Debounce background updates — when rapidly skipping tracks, they'll only
    // fire once the user settles on a song for 500ms, keeping the main thread
    // free for the critical song-change work.
    this.debouncedBgApply(Spicetify.Player.data?.item?.metadata?.image_url);

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

      // Debounce the dynamic background update on the lyrics page
      this.debouncedPageBgApply();
    }
  }
}
