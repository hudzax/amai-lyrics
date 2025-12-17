import sleep from '../utils/sleep';
import { ButtonManager } from './ButtonManager';
import { NowPlayingBarBackground } from '../components/DynamicBG/NowPlayingBarBackground';
import { EnsureProcessingIndicatorHidden } from '../utils/Lyrics/ui';

export class SongChangeManager {
  private buttonManager: ButtonManager;
  private backgroundManager: NowPlayingBarBackground;

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
  
    // Hide processing indicator when song changes to prevent stuck indicators
    EnsureProcessingIndicatorHidden();
  
    // Fetch and apply lyrics on song change (already non-blocking)
    const { default: fetchLyrics } = await import('../utils/Lyrics/fetchLyrics');
    const { default: ApplyLyrics } = await import('../utils/Lyrics/Global/Applyer');
    fetchLyrics(currentUri).then(ApplyLyrics);

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
