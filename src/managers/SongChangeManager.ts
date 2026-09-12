import sleep from '../utils/sleep';
import { ButtonManager } from './ButtonManager';
import type { ArtworkSurfaces } from '../components/DynamicBG/ArtworkSurfaces';
import { EnsureProcessingIndicatorHidden } from '../utils/Lyrics/ui';

export class SongChangeManager {
  private buttonManager: ButtonManager;
  private surfaces: ArtworkSurfaces;

  constructor(buttonManager: ButtonManager, surfaces: ArtworkSurfaces) {
    this.buttonManager = buttonManager;
    this.surfaces = surfaces;
  }

  /** Cancel pending debounced work on teardown. */
  public dispose(): void {
    this.surfaces.cancelPending();
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

    // One artwork read fans out to every surface behind the seam: rapid skips
    // repaint once for the settled track (500ms coalescing lives inside).
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    this.surfaces.applyArtwork(coverUrl);

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
    }
  }
}
