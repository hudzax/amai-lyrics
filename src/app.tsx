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
import {
  AppBackground,
  appBackgroundSingleton,
  isAppBackgroundEnabled,
  resolveAppBgHost,
  syncAppBgMarker,
  syncLibraryGridState,
  watchLibraryGridState,
} from './components/DynamicBG/AppBackground';
/** Re-dispatched by the settings toggle after the app-BG flag changes so live
 * managers (which own their instances/caches) can refresh stale hidden nodes. */
export const APP_BG_CHANGED_EVENT = 'amai:appbg-changed';
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
  // Shared singleton (also used by the settings toggle) so the lastImgUrl
  // dedup cache survives across call sites instead of rebuilding per call.
  const appBackgroundManager: AppBackground = appBackgroundSingleton;
  const songChangeManager = new SongChangeManager(
    buttonManager,
    backgroundManager,
    appBackgroundManager,
  );
  lifecycle.trackCallback(() => songChangeManager.dispose());
  lifecycle.trackCallback(() => backgroundManager.destroy());
  lifecycle.trackCallback(() => appBackgroundManager.destroy());
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
  // NOTE: no immediate `songchange` listeners here — SongChangeManager already
  // fans out debounced applies for both canvases on songchange; an extra
  // immediate apply per event would double the DOM scans + image loads.
  const applyDynamicBg = () => {
    if (!document.querySelector('.Root__right-sidebar aside.NowPlayingView')) return;
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    backgroundManager.apply(coverUrl);
  };
  applyDynamicBg();

  // Always-on artwork background behind Spotify's app frame (same artwork,
  // debounced via SongChangeManager). Re-applied when the top container remounts
  // on navigation; AppBackground.apply() itself respects the settings toggle.
  // Sync the marker first so single-canvas sidebar rules apply even before the
  // first artwork URL resolves.
  syncAppBgMarker();
  syncLibraryGridState();
  const applyAppBg = () => {
    // Enabled-check FIRST: the toggle defaults off, so this must cost one
    // localStorage read and zero DOM queries on the disabled path.
    if (!isAppBackgroundEnabled()) return;
    if (!resolveAppBgHost()) return;
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    appBackgroundManager.apply(coverUrl);
  };
  applyAppBg();
  // Remount observer: catches Spotify recreating `.Root` on navigation.
  // Deliberately NARROW — body childList WITHOUT subtree (`.Root` is a
  // top-level child), mutation-filtered to host adds, and rAF-throttled so a
  // burst of unrelated DOM churn (virtualized rows, tooltips) costs one cheap
  // flag check instead of 3 querySelectors + child scans per batch. The
  // previous version observed `subtree: true` with unfiltered callbacks and
  // ran on EVERY DOM mutation even with the feature toggled off.
  let appBgObserverQueued = false;
  const mainViewObserver = new MutationObserver((mutations) => {
    if (!isAppBackgroundEnabled()) return;
    let hostAdded = false;
    for (const mut of mutations) {
      for (const node of mut.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (
          node.matches?.('.Root, .Root__top-container') ||
          node.querySelector?.('.Root, .Root__top-container')
        ) {
          hostAdded = true;
          break;
        }
      }
      if (hostAdded) break;
    }
    if (!hostAdded || appBgObserverQueued) return;
    appBgObserverQueued = true;
    requestAnimationFrame(() => {
      appBgObserverQueued = false;
      if (!isAppBackgroundEnabled()) return;
      // Own appends echo back here; isApplied() is cache-first so the echo
      // is ~free and bails without rebuilding.
      if (!appBackgroundManager.isApplied()) applyAppBg();
    });
  });
  mainViewObserver.observe(document.body, { childList: true, subtree: false });
  lifecycle.trackObserver(mainViewObserver);
  // Library-grid opaque state has its own scoped observer (nav column only).
  // The late-mount case (nav bar absent at init) is retried on navigation
  // remounts via mainViewObserver batches — sync is idempotent and cheap.
  const gridObserver = watchLibraryGridState();
  if (gridObserver) lifecycle.trackObserver(gridObserver);
  // Toggle refresh: hidden canvases (sidebar/page) skip their work while the
  // app canvas is live, so toggling OFF must repaint them through the live
  // instances — a fresh instance would miss the dedup cache and duplicate nodes.
  const onAppBgChanged = () => {
    if (isAppBackgroundEnabled()) return;
    const lateGrid = watchLibraryGridState();
    if (lateGrid) lifecycle.trackObserver(lateGrid);
    applyDynamicBg();
    const pageBox = document.querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox');
    if (pageBox) {
      void import('./components/DynamicBG/dynamicBackground').then(
        ({ default: ApplyDynamicBackground }) => ApplyDynamicBackground(pageBox),
      );
    }
  };
  lifecycle.trackWindow(APP_BG_CHANGED_EVENT, onAppBgChanged as never);
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
