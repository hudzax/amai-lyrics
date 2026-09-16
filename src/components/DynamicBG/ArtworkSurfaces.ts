import lifecycle from '../../utils/lifecycle';
import Whentil from '../../utils/Whentil';
import Global from '../Global/Global';
import { debounce } from '../../utils/debounce';
import {
  appBackgroundSingleton,
  isAppBackgroundEnabled,
  resolveAppBgHost,
  syncAppBgMarker,
  syncLibraryGridState,
  watchLibraryGridState,
} from './AppBackground';
import { NowPlayingBarBackground } from './NowPlayingBarBackground';

/**
 * Re-dispatched by the settings toggle after the app-frame flag changes so the
 * live surfaces (which own their instances and caches) can repaint canvases
 * that skipped their work while hidden. settings.ts dispatches the literal
 * event name; this constant is the single seam for listeners.
 */
export const APP_BG_CHANGED_EVENT = 'amai:appbg-changed';

/** Coalescing window for song-change fan-out: only the settled track paints. */
const FAN_OUT_DELAY_MS = 500;

/** Cover art for the live track, if the player has one. */
function readLiveCoverUrl(): string | undefined {
  try {
    const url = Spicetify.Player.data?.item?.metadata?.image_url;
    return typeof url === 'string' ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Adapters behind the ArtworkSurfaces seam. Production uses the live DOM-backed
 * hosts; tests inject fakes. Two adapters justify the seam.
 */
export interface ArtworkSurfaceAdapters {
  applySidebar(coverUrl: string | undefined): void;
  applyAppFrame(coverUrl: string | undefined): void;
  applyLyricsPage(): void;
  publishAccents(coverUrl: string | undefined): void;
  readCoverUrl(): string | undefined;
  isAppFrameApplied(): boolean;
}

/** Production adapters: the three canvases plus the accent publisher. */
export function createDefaultAdapters(sidebarBg: NowPlayingBarBackground): ArtworkSurfaceAdapters {
  return {
    applySidebar: (coverUrl) => {
      if (!document.querySelector('.Root__right-sidebar aside.NowPlayingView')) return;
      sidebarBg.apply(coverUrl);
    },
    applyAppFrame: (coverUrl) => {
      // Enabled-check first: the toggle defaults off, so the disabled path
      // costs one storage read and zero DOM queries.
      if (!isAppBackgroundEnabled()) return;
      if (!resolveAppBgHost()) return;
      appBackgroundSingleton.apply(coverUrl);
    },
    applyLyricsPage: () => {
      if (!document.querySelector('#AmaiLyricsPage .LyricsContainer')) return;
      void import('./dynamicBackground').then(({ default: ApplyDynamicBackground }) => {
        const el = document.querySelector<HTMLElement>('#AmaiLyricsPage .ContentBox');
        if (el) ApplyDynamicBackground(el);
      });
    },
    publishAccents: (coverUrl) => {
      void import('../../utils/ArtworkColors').then(({ publishArtworkAccents }) => {
        void publishArtworkAccents(coverUrl ?? null);
      });
    },
    readCoverUrl: readLiveCoverUrl,
    isAppFrameApplied: () => appBackgroundSingleton.isApplied(),
  };
}

/**
 * ArtworkSurfaces: one deep module behind every artwork-derived surface.
 *
 * Interface: mount plus applyArtwork plus refreshStaticSurfaces plus
 * cancelPending plus destroy. Everything else (debounce ownership, host
 * resolution, remount observers, toggle refresh, accent seeding) sits behind
 * the seam, so client-update and toggle fixes land in one module and tests
 * cross the same small interface through injected adapters.
 */
export class ArtworkSurfaces {
  private readonly adapters: ArtworkSurfaceAdapters;
  private readonly sidebarBg: NowPlayingBarBackground;
  private readonly debouncedFanOut: ((coverUrl: string | undefined) => void) & {
    cancel: () => void;
  };
  private readonly toggleHandler: () => void;
  private sidebarObserver: MutationObserver | null = null;
  private sidebarLateObserver: MutationObserver | null = null;
  private appFrameObserver: MutationObserver | null = null;
  private gridObserver: MutationObserver | null = null;
  private appFrameRafQueued = false;
  private firstPaintWaiter: ReturnType<typeof Whentil.When> | null = null;
  private fullscreenOpenId: number | null = null;

  constructor(adapters?: ArtworkSurfaceAdapters) {
    this.sidebarBg = new NowPlayingBarBackground();
    this.adapters = adapters ?? createDefaultAdapters(this.sidebarBg);
    // Coalesce rapid skip events: only the settled track triggers work.
    this.debouncedFanOut = debounce((coverUrl: string | undefined) => {
      // Re-read live at fire time: a payload snapshotted as undefined (no
      // artwork when the song changed) must not paint a blank over the launch
      // waiter's paint, nor cancel the waiter while there is still nothing.
      const effective = coverUrl ?? this.adapters.readCoverUrl();
      if (effective) this.clearFirstPaintWaiter();
      this.adapters.applySidebar(effective);
      this.adapters.applyAppFrame(effective);
      this.adapters.applyLyricsPage();
      this.adapters.publishAccents(effective);
    }, FAN_OUT_DELAY_MS);
    this.toggleHandler = () => this.refreshAfterToggle();
  }

  /** Debounced fan-out for song changes: rapid skips repaint once. */
  public applyArtwork(coverUrl?: string): void {
    this.debouncedFanOut(coverUrl ?? this.adapters.readCoverUrl());
  }

  /** Immediate repaint of the static canvases (init, remount, toggle). */
  public refreshStaticSurfaces(): void {
    const coverUrl = this.adapters.readCoverUrl();
    this.adapters.applySidebar(coverUrl);
    this.adapters.applyAppFrame(coverUrl);
  }

  /** Cancel pending debounced work: call on teardown to avoid leaks. */
  public cancelPending(): void {
    this.debouncedFanOut.cancel();
  }

  /** Wire observers and the toggle refresh, then paint the initial surfaces. */
  public mount(): void {
    syncAppBgMarker();
    syncLibraryGridState();
    this.paintInitialSurfaces();
    this.waitForFirstArtwork();
    this.watchSidebar();
    this.watchAppFrameHost();
    this.gridObserver = watchLibraryGridState();
    if (this.gridObserver) lifecycle.trackObserver(this.gridObserver);
    window.addEventListener(APP_BG_CHANGED_EVENT, this.toggleHandler);
    lifecycle.trackCallback(() =>
      window.removeEventListener(APP_BG_CHANGED_EVENT, this.toggleHandler),
    );
    // Fullscreen entry is the one transition that un-hides the lyrics page's own
    // backdrop (the app canvas hides it otherwise). If ApplyDynamicBackground
    // skipped creation while the page was non-fullscreen, the node doesn't exist
    // yet — re-apply here so the backdrop is painted before it is shown.
    this.fullscreenOpenId = Global.Event.listen('fullscreen:open', () =>
      this.adapters.applyLyricsPage(),
    );
    lifecycle.trackGlobalEvent(this.fullscreenOpenId);
  }

  /** Disconnect, cancel, and clear canvases (hot-reload safe). */
  public destroy(): void {
    this.cancelPending();
    this.clearFirstPaintWaiter();
    window.removeEventListener(APP_BG_CHANGED_EVENT, this.toggleHandler);
    this.sidebarObserver?.disconnect();
    this.sidebarLateObserver?.disconnect();
    this.appFrameObserver?.disconnect();
    this.gridObserver?.disconnect();
    if (this.fullscreenOpenId !== null) {
      Global.Event.unListen(this.fullscreenOpenId);
      this.fullscreenOpenId = null;
    }
    this.sidebarObserver = null;
    this.sidebarLateObserver = null;
    this.appFrameObserver = null;
    this.gridObserver = null;
    this.sidebarBg.destroy();
    appBackgroundSingleton.destroy();
  }

  /** Initial paint shared by mount and the launch waiter below. */
  private paintInitialSurfaces(): void {
    this.refreshStaticSurfaces();
    this.adapters.publishAccents(this.adapters.readCoverUrl());
  }

  /**
   * Launch gap: the shell is ready before the player has artwork, so the
   * initial paint often has no URL. Park a one-shot waiter for the first
   * artwork instead of staying blank until the next song change.
   */
  private waitForFirstArtwork(): void {
    if (this.adapters.readCoverUrl()) return;
    if (this.firstPaintWaiter) return;
    const waiter = Whentil.When(
      () => this.adapters.readCoverUrl(),
      () => {
        this.firstPaintWaiter = null;
        this.paintInitialSurfaces();
      },
    );
    this.firstPaintWaiter = waiter;
    lifecycle.trackWhentil(waiter);
  }

  /** A song-driven paint supersedes the launch waiter (and vice versa). */
  private clearFirstPaintWaiter(): void {
    this.firstPaintWaiter?.Cancel();
    this.firstPaintWaiter = null;
  }

  /**
   * Toggle refresh: hidden canvases skip their work while the app canvas is
   * live, so toggling off must repaint them through the live adapters.
   */
  private refreshAfterToggle(): void {
    if (isAppBackgroundEnabled()) return;
    const lateGrid = watchLibraryGridState();
    if (lateGrid) lifecycle.trackObserver(lateGrid);
    this.adapters.applySidebar(this.adapters.readCoverUrl());
    this.adapters.applyLyricsPage();
  }

  /** Observe sidebar mount so opening the Now Playing View paints at once. */
  private watchSidebar(): void {
    const apply = () => {
      if (document.querySelector('.Root__right-sidebar aside.NowPlayingView')) {
        this.adapters.applySidebar(this.adapters.readCoverUrl());
      }
    };
    const observer = new MutationObserver(apply);
    const root = document.querySelector('.Root__right-sidebar') ?? document.body;
    observer.observe(root, { childList: true, subtree: true });
    this.sidebarObserver = observer;
    lifecycle.trackObserver(observer);
    // Late-mounted right sidebar container itself.
    if (!document.querySelector('.Root__right-sidebar')) {
      const late = new MutationObserver((_muts, obs) => {
        const sb = document.querySelector('.Root__right-sidebar');
        if (sb) {
          obs.disconnect();
          this.sidebarObserver?.disconnect();
          const remounted = new MutationObserver(apply);
          remounted.observe(sb, { childList: true, subtree: true });
          this.sidebarObserver = remounted;
          lifecycle.trackObserver(remounted);
          apply();
        }
      });
      late.observe(document.body, { childList: true, subtree: false });
      this.sidebarLateObserver = late;
      lifecycle.trackObserver(late);
    }
  }

  /**
   * Remount observer: catches Spotify recreating the app-frame host on
   * navigation. Deliberately narrow (body childList without subtree,
   * mutation-filtered to host adds, rAF-throttled) so unrelated DOM churn
   * costs one cheap flag check instead of scans per batch.
   */
  private watchAppFrameHost(): void {
    const observer = new MutationObserver((mutations) => {
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
      if (!hostAdded || this.appFrameRafQueued) return;
      this.appFrameRafQueued = true;
      requestAnimationFrame(() => {
        this.appFrameRafQueued = false;
        if (!isAppBackgroundEnabled()) return;
        // Own appends echo back here; isAppFrameApplied is cache-first so the
        // echo bails without rebuilding.
        if (!this.adapters.isAppFrameApplied()) {
          this.adapters.applyAppFrame(this.adapters.readCoverUrl());
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: false });
    this.appFrameObserver = observer;
    lifecycle.trackObserver(observer);
  }
}
