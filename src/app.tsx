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
  new IntervalManager(INTERVALS.DYNAMIC_BG_UPDATE, () => {
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    backgroundManager.apply(coverUrl);
  }).Start();

  // Set up song change listener
  Spicetify.Player.addEventListener('songchange', (event) => {
    songChangeManager.handleSongChange(event);
  });

  // Initialize with current song if available
  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    const { default: fetchLyrics } = await import('./utils/Lyrics/fetchLyrics');
    const { default: ApplyLyrics } = await import('./utils/Lyrics/Global/Applyer');
    fetchLyrics(currentUri).then(ApplyLyrics);
  }

  // Handle online/offline events
  window.addEventListener('online', async () => {
    storage.set('lastFetchedUri', null);
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      const { default: fetchLyrics } = await import('./utils/Lyrics/fetchLyrics');
      const { default: ApplyLyrics } = await import('./utils/Lyrics/Global/Applyer');
      fetchLyrics(currentUri).then(ApplyLyrics);
    }
  });

  // Set up scrolling
  new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine(ScrollSimplebar)).Start();

  // Initialize player state and events
  SpotifyPlayer.IsPlaying = IsPlaying();
  EventManager.initialize(buttonManager.getButton());
}

async function main() {
  await AppInitializer.initializeCore();

  const buttonManager = setupUI();
  await initializeAmaiLyrics(buttonManager);

  AppInitializer.setupPostLoadOptimizations();
}

export default main;
