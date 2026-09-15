// Core imports
import { SpotifyPlayer } from './components/Global/SpotifyPlayer';
import { IsPlaying } from './utils/Addons';
import storage from './utils/storage';
import Whentil from './utils/Whentil';

// Managers
import { AppInitializer } from './managers/AppInitializer';
import { ButtonManager } from './managers/ButtonManager';
import { EventManager } from './managers/EventManager';
import { PageManager } from './managers/PageManager';
import { SongChangeManager } from './managers/SongChangeManager';
import { ArtworkSurfaces } from './components/DynamicBG/ArtworkSurfaces';
export { APP_BG_CHANGED_EVENT } from './components/DynamicBG/ArtworkSurfaces';
import PageView from './components/Pages/PageView';
import { installBlankToastSuppressor } from './utils/suppressBlankToasts';
import { installFastdomErrorHandler } from './utils/fastdomAsync';
import lifecycle from './utils/lifecycle';

// CSS Imports
import './css/tokens.css'; // design tokens — must load before every other stylesheet
import './css/default.css';
import './css/Simplebar.css';
import './css/ContentBox.css';
import './css/DynamicBG/sweet-dynamic-bg.css';
import './css/Lyrics/main.css';
import './css/Lyrics/Mixed.css';
import './css/Loaders/LoaderContainer.css';
import './css/FullscreenTransition.css';
import './css/PlaybarLyrics.css';
import './css/Settings.css'; // Spotify preferences page (Amai settings sections)
import './css/SettingsModal.css'; // lyrics-page settings modal shell
import './css/Tooltips.css'; // global Tippy tooltip theme (must stay unscoped)

function setupUI(): ButtonManager {
  AppInitializer.setupSkeletonStyles();
  return new ButtonManager();
}

async function initializeAmaiLyrics(buttonManager: ButtonManager) {
  const [{ requestPositionSync }] = await Promise.all([import('./utils/Gets/GetProgress')]);

  // Initialize position sync
  const playbackWhen = Whentil.When(
    () => Spicetify.Platform.PlaybackAPI,
    () => {
      requestPositionSync();
    },
  );
  lifecycle.trackWhentil(playbackWhen);

  // Set up managers: one artwork seam owns every background canvas plus the
  // accent publish, so song changes and remounts fan out from a single module.
  const surfaces = new ArtworkSurfaces();
  surfaces.mount();
  lifecycle.trackCallback(() => surfaces.destroy());
  const songChangeManager = new SongChangeManager(buttonManager, surfaces);
  lifecycle.trackCallback(() => songChangeManager.dispose());
  new PageManager(buttonManager); // Used for side effects (navigation setup)

  // Tear down the lyrics page (and its SimpleBar observers / tippy instances)
  // on plugin teardown so a hot-reload doesn't leave a stale #AmaiLyricsPage.
  lifecycle.trackCallback(() => PageView.Destroy());

  // Mirror visibility onto <html> so pure-CSS animations (dynamic background
  // rotation etc.) can pause via .amai-hidden rules while the client is
  // minimized / in tray, instead of burning GPU frames nobody sees.
  const syncVisibilityClass = (): void => {
    document.documentElement.classList.toggle('amai-hidden', document.hidden);
  };
  lifecycle.trackWindow('visibilitychange', syncVisibilityClass);
  syncVisibilityClass();

  // Set up song change listener
  lifecycle.trackPlayerEvent('songchange', (event) =>
    songChangeManager.handleSongChange(event as never),
  );

  // Initialize with current song if available
  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    const { loadAndApplyLyrics } = await import('./utils/Lyrics/fetchLyrics');
    loadAndApplyLyrics(currentUri).catch((e) =>
      console.error('[Amai Lyrics] Failed to fetch initial lyrics:', e),
    );
  }

  // Handle online/offline events
  const onOnline = async () => {
    storage.set('lastFetchedUri', null);
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      const { loadAndApplyLyrics } = await import('./utils/Lyrics/fetchLyrics');
      loadAndApplyLyrics(currentUri).catch((e) =>
        console.error('[Amai Lyrics] Failed to re-fetch on online:', e),
      );
    }
  };
  lifecycle.trackWindow('online', onOnline as never);

  // Ensure lyric render loop is tracked for teardown (auto-started on import but now explicit)
  const { ensureLyricsRenderLoop, destroyLyricsRenderLoop } = await import('./utils/Lyrics/lyrics');
  ensureLyricsRenderLoop();
  lifecycle.trackCallback(() => destroyLyricsRenderLoop());

  // Initialize player state and events
  SpotifyPlayer.IsPlaying = IsPlaying();
  EventManager.initialize();

  // Show the active lyric line in the native bottom playbar
  const { InitializePlaybarLyrics } = await import('./components/PlaybarLyrics/PlaybarLyrics');
  InitializePlaybarLyrics();
}

async function main() {
  // Tear down any previous instance before re-initializing (spicetify-watch /
  // Reload UI re-injects the script and re-runs main from a fresh module).
  // SAFETY: window augmentation for hot-reload teardown; our __amaiLyricsTeardown key is namespaced
  const previousTeardown = (window as unknown as { __amaiLyricsTeardown?: () => void })
    .__amaiLyricsTeardown;
  if (typeof previousTeardown === 'function') {
    try {
      previousTeardown();
    } catch (error) {
      console.error('[Amai Lyrics] Error tearing down previous instance:', error);
    }
  }

  // Register this instance's teardown handle BEFORE any async work. Otherwise a
  // failure or hang during initialization (e.g. Platform.OnSpotifyReady polling
  // forever) leaves no handle for the next reload, which then silently
  // double-initializes (duplicate render loops, overlays, handlers, intervals).
  lifecycle.registerGlobalTeardown();

  installBlankToastSuppressor();
  // Route FastDOM batch errors to console.error instead of uncaught rAF throws.
  // (Also auto-installed on fastdomAsync import; called here so startup
  // ordering is explicit and the import is referenced.)
  installFastdomErrorHandler();

  try {
    await AppInitializer.initializeCore();

    const buttonManager = setupUI();
    lifecycle.trackCallback(() => buttonManager.dispose());
    await initializeAmaiLyrics(buttonManager);

    AppInitializer.setupPostLoadOptimizations();
  } catch (error) {
    // If init fails partway, tear everything down so the next reload starts clean.
    console.error('[Amai Lyrics] Initialization failed; tearing down:', error);
    lifecycle.disposeAll();
    throw error;
  }
}

export default main;
