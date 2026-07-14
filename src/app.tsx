// Core imports
import { ScrollingIntervalTime } from './utils/Lyrics/lyrics';
import { IntervalManager } from './utils/IntervalManager';
import { SpotifyPlayer } from './components/Global/SpotifyPlayer';
import { IsPlaying } from './utils/Addons';
import { ScrollSimplebar } from './utils/Scrolling/Simplebar/ScrollSimplebar';
import storage from './utils/storage';
import Whentil from './utils/Whentil';

// Managers
import { AppInitializer } from './managers/AppInitializer';
import { ButtonManager } from './managers/ButtonManager';
import { EventManager } from './managers/EventManager';
import { PageManager } from './managers/PageManager';
import { SongChangeManager } from './managers/SongChangeManager';
import { NowPlayingBarBackground } from './components/DynamicBG/NowPlayingBarBackground';
import { installBlankToastSuppressor } from './utils/suppressBlankToasts';
import lifecycle from './utils/lifecycle';

// Constants
import { INTERVALS } from './constants/intervals';

// CSS Imports
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
  const { ScrollToActiveLine } = await import('./utils/Scrolling/ScrollToActiveLine');

  // Initialize position sync
  Whentil.When(
    () => Spicetify.Platform.PlaybackAPI,
    () => {
      requestPositionSync();
    },
  );

  // Set up managers
  const backgroundManager = new NowPlayingBarBackground();
  const songChangeManager = new SongChangeManager(buttonManager, backgroundManager);
  new PageManager(buttonManager); // Used for side effects (navigation setup)

  // Set up dynamic background updates
  const dynamicBgInterval = new IntervalManager(INTERVALS.DYNAMIC_BG_UPDATE, () => {
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    backgroundManager.apply(coverUrl);
  });
  dynamicBgInterval.Start();
  lifecycle.trackInterval(dynamicBgInterval);

  // Set up song change listener
  lifecycle.trackPlayerEvent('songchange', (event) =>
    songChangeManager.handleSongChange(event as never),
  );

  // Initialize with current song if available
  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    const { default: fetchLyrics } = await import('./utils/Lyrics/fetchLyrics');
    const { default: ApplyLyrics } = await import('./utils/Lyrics/Global/Applyer');
    fetchLyrics(currentUri).then(ApplyLyrics);
  }

  // Handle online/offline events
  const onOnline = async () => {
    storage.set('lastFetchedUri', null);
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      const { default: fetchLyrics } = await import('./utils/Lyrics/fetchLyrics');
      const { default: ApplyLyrics } = await import('./utils/Lyrics/Global/Applyer');
      fetchLyrics(currentUri).then(ApplyLyrics);
    }
  };
  lifecycle.trackWindow('online', onOnline as never);

  // Set up scrolling
  const scrollingInterval = new IntervalManager(ScrollingIntervalTime, () =>
    ScrollToActiveLine(ScrollSimplebar),
  );
  scrollingInterval.Start();
  lifecycle.trackInterval(scrollingInterval);

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
  const previousTeardown = (
    window as unknown as { __amaiLyricsTeardown?: () => void }
  ).__amaiLyricsTeardown;
  if (typeof previousTeardown === 'function') {
    try {
      previousTeardown();
    } catch (error) {
      console.error('[Amai Lyrics] Error tearing down previous instance:', error);
    }
  }

  installBlankToastSuppressor();

  await AppInitializer.initializeCore();

  const buttonManager = setupUI();
  lifecycle.trackCallback(() => buttonManager.dispose());
  await initializeAmaiLyrics(buttonManager);

  AppInitializer.setupPostLoadOptimizations();

  lifecycle.registerGlobalTeardown();
}

export default main;
