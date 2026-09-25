import storage from '../../utils/storage';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import Fullscreen from '../Utils/Fullscreen';
import Global from '../Global/Global';
import lifecycle from '../../utils/lifecycle';
import { getPositionFor } from '../../utils/Gets/GetProgress';
import { registerPositionConsumer } from '../../utils/PositionConsumer';
import { INTERVALS } from '../../constants/intervals';
import { setupDragAndDrop } from './DragAndDrop';
import { createPlaybackControls } from './PlaybackControls';
import { createProgressBar } from './ProgressBar';

/** NowBarOverlay owns the mounted lifetime; builders below this seam stay private. */
interface MountedNowBar {
  root: HTMLElement;
  refresh: () => Promise<void>;
  destroy: () => void;
}

let mounted: MountedNowBar | null = null;
let destroyed = false;

// Per-injection ownership: teardown invalidates pending work even before metadata resolves.
lifecycle.trackCallback(() => {
  destroyed = true;
  CloseNowBar();
});

/**
 * True while a page may still mount a NowBar. PageView flips this synchronously
 * in DestroyPage() so a pending fullscreen-entry continuation cannot re-open
 * (and re-create a position loop on) a page that is being torn down.
 */
let pageDestroyed = false;

/** Called by PageView when page teardown begins; also closes the active lifetime. */
function InvalidateNowBar(): void {
  pageDestroyed = true;
  CloseNowBar();
}

function mount(root: HTMLElement): MountedNowBar {
  let disposed = false;
  let metadataVersion = 0;
  let fullscreen: boolean | null = null;
  let controls: ReturnType<typeof createPlaybackControls> | null = null;
  let progress: ReturnType<typeof createProgressBar> | null = null;
  let stopPosition: (() => void) | null = null;
  let stopDrag: (() => void) | null = null;
  let artistData: HTMLElement | null = null;
  let albumData: HTMLElement | null = null;
  const listenerIds: number[] = [];
  const image = root.querySelector<HTMLImageElement>('.MediaImage');
  const mediaContent = root.querySelector<HTMLElement>('.MediaContent');

  const refreshPlayback = () => {
    if (disposed || !root.isConnected) return;
    image?.classList.toggle('Playing', SpotifyPlayer.IsPlaying);
    controls?.refresh();
  };

  const clearFullscreen = () => {
    stopPosition?.();
    stopPosition = null;
    controls?.destroy();
    controls = null;
    progress?.destroy();
    progress = null;
    artistData?.remove();
    artistData = null;
    albumData?.remove();
    albumData = null;
  };

  const syncMode = () => {
    if (disposed || !root.isConnected || fullscreen === Fullscreen.isPageFullscreen()) return;
    fullscreen = Fullscreen.isPageFullscreen();
    stopDrag?.();
    clearFullscreen();
    if (fullscreen && mediaContent) {
      artistData = document.createElement('div');
      artistData.className = 'ArtistData';
      artistData.appendChild(document.createElement('span'));
      albumData = document.createElement('div');
      albumData.className = 'AlbumData';
      albumData.appendChild(document.createElement('span'));
      controls = createPlaybackControls();
      progress = createProgressBar();
      // Append only owned nodes; view controls belong to the page, not this lifetime.
      mediaContent.append(artistData, albumData, controls.element, progress.element);
      progress.render(getPositionFor('nowbar'));
      stopPosition = registerPositionConsumer({
        surface: 'nowbar',
        intervalSeconds: INTERVALS.PROGRESS_BAR_UPDATE,
        enabled: () => !disposed && root.isConnected && Fullscreen.isPageFullscreen(),
        // Paused seeks still need a position, but not continuous remote tracking.
        wantsTracking: ({ isPlaying }) => isPlaying,
        onPosition: (position) => {
          progress?.render(position);
          image?.classList.toggle('Playing', SpotifyPlayer.IsPlaying);
        },
      });
    }
    stopDrag = setupDragAndDrop(root, fullscreen);
    refreshPlayback();
  };

  const refresh = async () => {
    if (disposed || !root.isConnected) return;
    syncMode();
    refreshPlayback();
    const version = ++metadataVersion;
    const uri = Spicetify.Player.data?.item?.uri;
    const album = SpotifyPlayer.GetAlbumName();
    const skeletons = root.querySelectorAll('.Artists, .SongName, .MediaBox');
    skeletons.forEach((node) => node.classList.add('Skeletoned'));
    const current = () =>
      !disposed &&
      root.isConnected &&
      version === metadataVersion &&
      uri === Spicetify.Player.data?.item?.uri;
    try {
      const [title, artists, artwork] = await Promise.allSettled([
        SpotifyPlayer.GetSongName(),
        SpotifyPlayer.GetArtists(),
        SpotifyPlayer.Artwork.Get('xl'),
      ]);
      if (!current()) return;
      const setText = (selector: string, text: string) => {
        const node = root.querySelector(selector);
        if (node && node.textContent !== text) node.textContent = text;
      };
      const artistNames =
        artists.status === 'fulfilled' ? SpotifyPlayer.JoinArtists(artists.value) : '';
      if (title.status === 'fulfilled') setText('.Metadata .SongName span', title.value);
      if (artists.status === 'fulfilled') {
        setText('.Metadata .Artists span', artistNames);
        setText('.ArtistData span', artistNames);
      }
      setText('.AlbumData span', album);
      if (artwork.status === 'fulfilled' && image) {
        if (artwork.value) {
          if (image.getAttribute('src') !== artwork.value) {
            image.classList.remove('loaded');
            // Keep the page's image loader from restoring the previous track's artwork.
            image.setAttribute('data-high-res', artwork.value);
            image.src = artwork.value;
          }
        } else {
          // This track has no cover: drop the previous track's image instead of keeping it.
          image.classList.remove('loaded');
          image.removeAttribute('src');
          image.removeAttribute('data-high-res');
        }
      }
    } catch (error) {
      if (current()) console.error('[Amai Lyrics] NowBar metadata failed:', error);
    } finally {
      if (current()) skeletons.forEach((node) => node.classList.remove('Skeletoned'));
    }
  };

  for (const event of ['playback:playpause', 'playback:loop', 'playback:shuffle']) {
    // EventManager has already normalized observation state; never parse raw payloads here.
    listenerIds.push(Global.Event.listen(event, refreshPlayback));
  }
  listenerIds.push(Global.Event.listen('playback:songchange', refreshPlayback));
  const unsubscribeFullscreen = Fullscreen.subscribe(() => void refresh());

  const instance: MountedNowBar = {
    root,
    refresh,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      ++metadataVersion;
      unsubscribeFullscreen();
      listenerIds.forEach((id) => Global.Event.unListen(id));
      stopDrag?.();
      stopDrag = null;
      clearFullscreen();
      image?.classList.remove('Playing');
      root.querySelectorAll('.Skeletoned').forEach((node) => node.classList.remove('Skeletoned'));
    },
  };
  return instance;
}

/** Repeated opens reuse the mounted lifetime; metadata never delays resource ownership. */
async function OpenNowBar(): Promise<void> {
  if (destroyed || pageDestroyed) return;
  const root = document.querySelector<HTMLElement>('#AmaiLyricsPage .ContentBox .NowBar');
  if (!root || !root.isConnected) {
    CloseNowBar();
    return;
  }
  if (mounted?.root !== root) {
    mounted?.destroy();
    mounted = mount(root);
  }
  root.classList.add('Active');
  storage.set('IsNowBarOpen', 'true');
  await mounted.refresh();
}

/** Cleanup is independent of DOM presence and invalidates all pending metadata writes. */
function CloseNowBar(): void {
  const previous = mounted;
  mounted = null;
  previous?.destroy();
  previous?.root.classList.remove('Active');
  storage.set('IsNowBarOpen', 'false');
}

async function UpdateNowBar(force = false): Promise<void> {
  if (!mounted || (!force && storage.get('IsNowBarOpen') === 'false')) return;
  await mounted.refresh();
}

function Session_OpenNowBar() {
  // A fresh page open clears the destroy latch; only the page's own open path may do this.
  pageDestroyed = false;
  void OpenNowBar();
}

function NowBar_SwapSides() {
  const root = mounted?.root;
  if (!root) return;
  storage.set('NowBarSide', storage.get('NowBarSide') === 'left' ? 'right' : 'left');
  Session_NowBar_SetSide();
}

function Session_NowBar_SetSide() {
  const root = document.querySelector('#AmaiLyricsPage .ContentBox .NowBar');
  if (!root) return;
  const side = storage.get('NowBarSide') === 'right' ? 'right' : 'left';
  storage.set('NowBarSide', side);
  root.classList.toggle('RightSide', side === 'right');
  root.classList.toggle('LeftSide', side === 'left');
}

function DeregisterNowBarBtn() {
  document.querySelector('#AmaiLyricsPage .ContentBox .ViewControls #NowBarToggle')?.remove();
}

export {
  OpenNowBar,
  CloseNowBar,
  InvalidateNowBar,
  UpdateNowBar,
  Session_OpenNowBar,
  NowBar_SwapSides,
  Session_NowBar_SetSide,
  DeregisterNowBarBtn,
};
