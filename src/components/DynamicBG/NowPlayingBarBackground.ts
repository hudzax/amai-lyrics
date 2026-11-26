import fastdom from 'fastdom';
import { measureAsync, mutateAsync } from '../../utils/fastdomAsync';
import { applyCrossfade, normalizeCoverUrl, type CrossfadeSurface } from './CrossfadeCanvas';
import {
  APP_BG_CONTAINER_CLASS,
  APP_BG_HOST_HELPER_CLASS,
  APP_BG_LOADED_CLASS,
  NESTED_BG_IMG_A_ID,
  NESTED_BG_IMG_B_ID,
} from './identity';
import { anySurface } from '../../constants/SpotifyDom';

interface BackgroundCache {
  nowPlayingBar: Element | null;
  dynamicBg: HTMLElement | null;
}

/** The sidebar's slot on the crossfade seam: nested layer ids, a plain
 * container, the helper host class and FastDOM mutation scheduling. */
const sidebarCrossfadeSurface: CrossfadeSurface = {
  layerIds: { a: NESTED_BG_IMG_A_ID, b: NESTED_BG_IMG_B_ID },
  findContainer: (host) => host.querySelector<HTMLDivElement>(`.${APP_BG_CONTAINER_CLASS}`),
  createContainer: () => {
    const container = document.createElement('div');
    container.className = APP_BG_CONTAINER_CLASS;
    return container;
  },
  prepareHost: (host) => host.classList.add(APP_BG_HOST_HELPER_CLASS),
  schedule: (cb) => fastdom.mutate(cb),
  onFirstPaint: (container) => {
    if (!container.isConnected) return;
    container.classList.add(APP_BG_LOADED_CLASS);
  },
};

export class NowPlayingBarBackground {
  private cached: BackgroundCache = {
    nowPlayingBar: null,
    dynamicBg: null,
  };
  // URL with an in-flight measure→mutate handoff. Recorded synchronously so
  // rapid repeat calls share the same async paint instead of racing.
  private pendingUrl: string | null = null;
  private generation = 0;

  /**
   * Apply optimized dynamic background to the now playing bar
   * Uses dual-image crossfade approach for smooth transitions
   */
  public apply(coverUrl: string | undefined) {
    const targetUrl = normalizeCoverUrl(coverUrl ?? '');
    if (!targetUrl) return;

    // CrossfadeCanvas owns loaded-URL dedup and failed-load retry.
    if (targetUrl === this.pendingUrl) return;
    this.pendingUrl = targetUrl;
    const generation = ++this.generation;

    void (async () => {
      try {
        const nowPlayingBar = await measureAsync(() =>
          document.querySelector(anySurface('nowPlayingPanel')),
        );
        if (generation !== this.generation) return;

        if (!nowPlayingBar || !nowPlayingBar.isConnected) {
          this.clearCache();
          return;
        }

        await mutateAsync(() => {
          if (generation !== this.generation) return;
          // Sidebar remounted between measure and mutate: drop the stale
          // ref instead of appending into a detached tree.
          if (!nowPlayingBar.isConnected) {
            this.clearCache();
            return;
          }

          this.cached.nowPlayingBar = nowPlayingBar;
          this.cached.dynamicBg = applyCrossfade(nowPlayingBar, targetUrl, sidebarCrossfadeSurface);
        });
      } catch (error) {
        console.error('Error Applying the Dynamic BG to the NowPlayingBar:', error);
      } finally {
        if (generation === this.generation) this.pendingUrl = null;
      }
    })();
  }

  private clearCache() {
    this.cached.dynamicBg = null;
    this.cached.nowPlayingBar = null;
    this.pendingUrl = null;
  }

  /** Clear cached state when the NowPlayingView is no longer mounted. */
  public destroy(): void {
    this.generation++;
    this.clearCache();
  }
}
