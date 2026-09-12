import sleep from '../utils/sleep';
import { ButtonManager } from './ButtonManager';
import { NowPlayingBarBackground } from '../components/DynamicBG/NowPlayingBarBackground';
import type { AppBackground } from '../components/DynamicBG/AppBackground';
import { EnsureProcessingIndicatorHidden } from '../utils/Lyrics/ui';
import { debounce } from '../utils/debounce';

export class SongChangeManager {
  private buttonManager: ButtonManager;
  private backgroundManager: NowPlayingBarBackground;
  private appBackgroundManager: AppBackground | null;

  private readonly debouncedBgApply: ((coverUrl: string | undefined) => void) & {
    cancel: () => void;
  };
  private readonly debouncedAppBgApply: ((coverUrl: string | undefined) => void) & {
    cancel: () => void;
  };
  private readonly debouncedPageBgApply: (() => void) & { cancel: () => void };
  private readonly debouncedAccentPublish: ((coverUrl: string | undefined) => void) & {
    cancel: () => void;
  };

  constructor(
    buttonManager: ButtonManager,
    backgroundManager: NowPlayingBarBackground,
    appBackgroundManager?: AppBackground,
  ) {
    this.buttonManager = buttonManager;
    this.backgroundManager = backgroundManager;
    this.appBackgroundManager = appBackgroundManager ?? null;

    // Coalesce rapid skip events — only the settled track triggers work.
    this.debouncedBgApply = debounce((coverUrl: string | undefined) => {
      this.backgroundManager.apply(coverUrl);
    }, 500);

    this.debouncedAppBgApply = debounce((coverUrl: string | undefined) => {
      this.appBackgroundManager?.apply(coverUrl);
    }, 500);

    this.debouncedPageBgApply = debounce(() => {
      void import('../components/DynamicBG/dynamicBackground').then(
        ({ default: ApplyDynamicBackground }) => {
          const el = document.querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox');
          if (el) ApplyDynamicBackground(el);
        },
      );
    }, 500);

    // Publish artwork-derived accent colors (--amai-accent-*) for the lyrics
    // page UI. Same 500ms coalescing as the background applies so rapid skips
    // only extract colors for the track the user settles on.
    this.debouncedAccentPublish = debounce((coverUrl: string | undefined) => {
      void import('../utils/ArtworkColors').then(({ publishArtworkAccents }) => {
        void publishArtworkAccents(coverUrl ?? null);
      });
    }, 500);
  }

  /** Cancel pending debounced work — call on teardown to avoid leaks. */
  public dispose(): void {
    this.debouncedBgApply.cancel();
    this.debouncedAppBgApply.cancel();
    this.debouncedPageBgApply.cancel();
    this.debouncedAccentPublish.cancel();
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

    // Hide processing indicator when song changes to prevent stuck indicators
    EnsureProcessingIndicatorHidden();

    // Single pipeline composition: fetch, then apply. Staleness (slow fetch
    // for a skipped song) is owned by the pipeline's request token — a
    // superseded request resolves its data but never publishes or applies.
    const { loadAndApplyLyrics } = await import('../utils/Lyrics/fetchLyrics');
    loadAndApplyLyrics(currentUri).catch((e) =>
      console.error('[Amai Lyrics] SongChange fetch failed:', e),
    );

    // Update button registration (synchronous but fast)
    this.buttonManager.updateRegistration();

    // Debounce background updates — when rapidly skipping tracks, they'll only
    // fire once the user settles on a song for 500ms, keeping the main thread
    // free for the critical song-change work. One metadata read shared by all
    // three paths (was three separate `Spicetify.Player.data` walks).
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    this.debouncedBgApply(coverUrl);
    this.debouncedAppBgApply(coverUrl);

    // Publish artwork accent colors for the lyrics page (same coalescing)
    this.debouncedAccentPublish(coverUrl);

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
