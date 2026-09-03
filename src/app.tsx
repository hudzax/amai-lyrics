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
import { NowPlayingBarBackground } from './components/DynamicBG/NowPlayingBarBackground';
import PageView from './components/Pages/PageView';
import { installBlankToastSuppressor } from './utils/suppressBlankToasts';
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

  // Set up managers
  const backgroundManager = new NowPlayingBarBackground();
  const songChangeManager = new SongChangeManager(buttonManager, backgroundManager);
  lifecycle.trackCallback(() => songChangeManager.dispose());
  lifecycle.trackCallback(() => backgroundManager.destroy());
  new PageManager(buttonManager); // Used for side effects (navigation setup)

  // Seed the artwork-derived accent colors (--amai-accent-*) for the initial
  // track. Subsequent updates happen via SongChangeManager's debounced publish.
  void import('./utils/ArtworkColors').then(({ publishArtworkAccents }) => {
    void publishArtworkAccents(Spicetify.Player.data?.item?.metadata?.image_url ?? null);
  });

  // Tear down the lyrics page (and its SimpleBar observers / tippy instances)
  // on plugin teardown so a hot-reload doesn't leave a stale #SpicyLyricsPage.
  lifecycle.trackCallback(() => PageView.Destroy());

  // Set up dynamic background updates — event-driven instead of 1 Hz polling.
  // Previous interval queried `.NowPlayingView` every second forever; now we
  // observe DOM mount + song changes and only apply when actually needed.
  const applyDynamicBg = () => {
    if (!document.querySelector('.Root__right-sidebar aside.NowPlayingView')) return;
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    backgroundManager.apply(coverUrl);
  };
  applyDynamicBg();
  lifecycle.trackPlayerEvent('songchange', () => applyDynamicBg());
  // Observe sidebar mount/unmount so opening the Now Playing View triggers apply immediately
  const sidebarObserver = new MutationObserver(() => {
    // Only act when the NowPlayingView appears; hidden removal is handled by apply's early return + cache clear
    if (document.querySelector('.Root__right-sidebar aside.NowPlayingView')) {
      applyDynamicBg();
    }
  });
  const observeRoot = document.querySelector('.Root__right-sidebar') ?? document.body;
  sidebarObserver.observe(observeRoot, { childList: true, subtree: true });
  lifecycle.trackObserver(sidebarObserver);
  // Also handle late-mounted right sidebar container itself
  if (!document.querySelector('.Root__right-sidebar')) {
    const bodyObserver = new MutationObserver((_muts, obs) => {
      const sb = document.querySelector('.Root__right-sidebar');
      if (sb) {
        obs.disconnect();
        sidebarObserver.disconnect();
        sidebarObserver.observe(sb, { childList: true, subtree: true });
        applyDynamicBg();
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: false });
    lifecycle.trackObserver(bodyObserver);
  }

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
    const { default: fetchLyrics } = await import('./utils/Lyrics/fetchLyrics');
    const { default: ApplyLyrics } = await import('./utils/Lyrics/Global/Applyer');
    fetchLyrics(currentUri)
      .then(ApplyLyrics)
      .catch((e) => console.error('[Amai Lyrics] Failed to fetch initial lyrics:', e));
  }

  // Handle online/offline events
  const onOnline = async () => {
    storage.set('lastFetchedUri', null);
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      const { default: fetchLyrics } = await import('./utils/Lyrics/fetchLyrics');
      const { default: ApplyLyrics } = await import('./utils/Lyrics/Global/Applyer');
      fetchLyrics(currentUri)
        .then(ApplyLyrics)
        .catch((e) => console.error('[Amai Lyrics] Failed to re-fetch on online:', e));
    }
  };
  lifecycle.trackWindow('online', onOnline as never);

  // Ensure lyric render loop is tracked for teardown (auto-started on import but now explicit)
  const { ensureLyricsRenderLoop, destroyLyricsRenderLoop } = await import('./utils/Lyrics/lyrics');
  ensureLyricsRenderLoop();
  lifecycle.trackCallback(() => destroyLyricsRenderLoop());

  // Initialize player state and events
  SpotifyPlayer.IsPlaying = IsPlaying();
  EventManager.initialize(buttonManager.getButton());

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
