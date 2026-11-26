import lifecycle from '../../utils/lifecycle';
import Whentil from '../../utils/Whentil';
import { debounce } from '../../utils/debounce';
import {
  appBackgroundSingleton,
  isAppBackgroundEnabled,
  resolveAppBgHost,
  syncAppBgMarker,
  watchLibraryGridState,
} from './AppBackground';
import { APP_BG_LIB_GRID_CLASS, syncLibraryGridState } from './identity';
import { anySurface } from '../../constants/SpotifyDom';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import Fullscreen from '../Utils/Fullscreen';
import { NowPlayingBarBackground } from './NowPlayingBarBackground';

/** Coalescing window for song-change fan-out: only the settled track paints. */
const FAN_OUT_DELAY_MS = 500;

/**
 * The Now Playing View panel. `.Root__right-sidebar` is not usable as its
 * ancestor: Spotify 1.3.3 hashes every layout class and only Spicetify's
 * css-map can restore the semantic name, whereas `NowPlayingView` is emitted by
 * Spotify itself.
 */
const NOW_PLAYING_PANEL = anySurface('nowPlayingPanel');

/** The sidebar region that outlives the panel — the panel's parent once
 * mounted, or the always-present region on pre-1.3.3 builds. */
function sidebarRegion(): HTMLElement | null {
  const panel = document.querySelector<HTMLElement>(NOW_PLAYING_PANEL);
  return (
    panel?.parentElement ?? document.querySelector<HTMLElement>(anySurface('nowPlayingRegion'))
  );
}

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
  removeAppFrame(): void;
  applyLyricsPage(shouldPaint: () => boolean): Promise<void>;
  publishAccents(coverUrl: string | undefined, shouldPublish?: () => boolean): void;
  readCoverUrl(): string | undefined;
  isAppFrameApplied(): boolean;
  destroy(): void;
}

/** Production adapters: the three canvases plus the accent publisher. */
export function createDefaultAdapters(sidebarBg: NowPlayingBarBackground): ArtworkSurfaceAdapters {
  return {
    applySidebar: (coverUrl) => {
      if (!document.querySelector(NOW_PLAYING_PANEL)) return;
      sidebarBg.apply(coverUrl);
    },
    applyAppFrame: (coverUrl) => {
      if (!resolveAppBgHost()) return;
      appBackgroundSingleton.apply(coverUrl);
    },
    removeAppFrame: () => appBackgroundSingleton.remove(),
    applyLyricsPage: async (shouldPaint) => {
      if (!document.querySelector(PageViewSelectors.LyricsContainer) || !shouldPaint()) return;
      const { default: ApplyDynamicBackground } = await import('./dynamicBackground');
      if (!shouldPaint()) return;
      const el = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
      if (el) await ApplyDynamicBackground(el, shouldPaint);
    },
    publishAccents: (coverUrl, shouldPublish = () => true) => {
      void import('../../utils/ArtworkColors').then(({ publishArtworkAccents }) => {
        if (shouldPublish()) void publishArtworkAccents(coverUrl ?? null);
      });
    },
    readCoverUrl: readLiveCoverUrl,
    isAppFrameApplied: () => appBackgroundSingleton.isApplied(),
    destroy: () => {
      sidebarBg.destroy();
      appBackgroundSingleton.destroy();
    },
  };
}

/**
 * ArtworkSurfaces: one deep module behind every artwork-derived surface.
 *
 * Mode reconciliation, page-open painting, debounce ownership, remount
 * observers and accent seeding stay behind one interface. Tests inject surface
 * adapters and cross the same seam as settings, startup and PageView.
 */
export class ArtworkSurfaces {
  private readonly adapters: ArtworkSurfaceAdapters;
  private readonly debouncedFanOut: ((coverUrl: string | undefined) => void) & {
    cancel: () => void;
  };
  private sidebarObserver: MutationObserver | null = null;
  private sidebarLateObserver: MutationObserver | null = null;
  private appFrameObserver: MutationObserver | null = null;
  private gridObserver: MutationObserver | null = null;
  private gridObserverTracked = false;
  private appFrameRafQueued = false;
  private firstPaintWaiter: ReturnType<typeof Whentil.When> | null = null;
  private unsubscribeFullscreen: (() => void) | null = null;
  private lifetimeGeneration = 0;
  private pagePaintGeneration = 0;
  private destroyed = false;

  constructor(adapters?: ArtworkSurfaceAdapters) {
    const sidebarBg = new NowPlayingBarBackground();
    this.adapters = adapters ?? createDefaultAdapters(sidebarBg);
    // Coalesce rapid skip events: only the settled track triggers work.
    this.debouncedFanOut = debounce((coverUrl: string | undefined) => {
      // Re-read live at fire time: a payload snapshotted as undefined (no
      // artwork when the song changed) must not paint a blank over the launch
      // waiter's paint, nor cancel the waiter while there is still nothing.
      const effective = coverUrl ?? this.adapters.readCoverUrl();
      if (effective) this.clearFirstPaintWaiter();
      if (isAppBackgroundEnabled()) {
        this.adapters.applyAppFrame(effective);
      } else {
        this.adapters.applySidebar(effective);
        void this.paintLyricsPageIfVisible();
      }
      this.publishAccents(effective);
    }, FAN_OUT_DELAY_MS);
  }

  /** Debounced fan-out for song changes: rapid skips repaint once. */
  public applyArtwork(coverUrl?: string): void {
    if (this.destroyed) return;
    this.debouncedFanOut(coverUrl ?? this.adapters.readCoverUrl());
  }

  private publishAccents(coverUrl: string | undefined): void {
    const lifetime = this.lifetimeGeneration;
    this.adapters.publishAccents(
      coverUrl,
      () => !this.destroyed && lifetime === this.lifetimeGeneration,
    );
  }

  private refreshStaticSurfaces(): void {
    const coverUrl = this.adapters.readCoverUrl();
    if (isAppBackgroundEnabled()) {
      this.adapters.applyAppFrame(coverUrl);
    } else {
      this.adapters.applySidebar(coverUrl);
    }
  }

  private applySidebarIfVisible(): void {
    if (!isAppBackgroundEnabled()) this.adapters.applySidebar(this.adapters.readCoverUrl());
  }

  public async setThemeEnabled(enabled: boolean): Promise<void> {
    if (this.destroyed) return;
    syncAppBgMarker(enabled);
    const coverUrl = this.adapters.readCoverUrl();
    if (enabled) {
      this.adapters.applyAppFrame(coverUrl);
      syncLibraryGridState();
      this.ensureGridObserver();
      return;
    }

    this.adapters.removeAppFrame();
    this.stopGridObserver();
    this.clearGridMarker();
    this.adapters.applySidebar(coverUrl);
    await this.paintLyricsPageIfVisible();
  }

  public refreshLyricsPage(): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    return this.paintLyricsPageIfVisible();
  }

  private async paintLyricsPageIfVisible(): Promise<void> {
    const generation = ++this.pagePaintGeneration;
    const lifetime = this.lifetimeGeneration;
    const shouldPaint = () =>
      !this.destroyed &&
      lifetime === this.lifetimeGeneration &&
      generation === this.pagePaintGeneration &&
      !isAppBackgroundEnabled();
    if (!shouldPaint()) return;
    await this.adapters.applyLyricsPage(shouldPaint);
  }

  private ensureGridObserver(): void {
    if (this.gridObserver) return;
    const observer = watchLibraryGridState();
    if (!observer) return;
    this.gridObserver = observer;
    if (!this.gridObserverTracked) {
      this.gridObserverTracked = true;
      lifecycle.trackCallback(() => this.stopGridObserver());
    }
  }

  private stopGridObserver(): void {
    this.gridObserver?.disconnect();
    this.gridObserver = null;
  }

  private clearGridMarker(): void {
    document.querySelector(anySurface('sidebar'))?.classList.remove(APP_BG_LIB_GRID_CLASS);
  }

  /** Cancel pending debounced work: call on teardown to avoid leaks. */
  public cancelPending(): void {
    this.debouncedFanOut.cancel();
  }

  /** Reconcile stored mode, wire observers, then paint the initial surfaces. */
  public mount(): void {
    this.destroyed = false;
    this.lifetimeGeneration++;
    const enabled = isAppBackgroundEnabled();
    syncAppBgMarker(enabled);
    if (enabled) {
      syncLibraryGridState();
      this.ensureGridObserver();
    } else {
      this.clearGridMarker();
    }
    this.paintInitialSurfaces();
    this.waitForFirstArtwork();
    this.watchSidebar();
    this.watchAppFrameHost();
    // Fullscreen moves the lyrics page out of `.Root` (TransferElement) and
    // into the UA top layer, where a `.Root`-child canvas would be buried behind
    // Spotify's own UI — `resolveAppBgHost` follows the page, so re-applying the
    // app frame pulls the canvas in with it on entry and back out on exit. The
    // page backdrop is painted only when app-frame mode is off.
    this.unsubscribeFullscreen = Fullscreen.subscribe((fullscreen) => {
      if (isAppBackgroundEnabled()) {
        this.adapters.applyAppFrame(this.adapters.readCoverUrl());
      } else if (fullscreen) {
        void this.paintLyricsPageIfVisible();
      }
    });
    lifecycle.trackCallback(() => this.unsubscribeFullscreen?.());
  }

  /** Disconnect, cancel, and clear canvases (hot-reload safe). */
  public destroy(): void {
    this.destroyed = true;
    this.lifetimeGeneration++;
    this.pagePaintGeneration++;
    this.cancelPending();
    this.clearFirstPaintWaiter();
    this.sidebarObserver?.disconnect();
    this.sidebarLateObserver?.disconnect();
    this.appFrameObserver?.disconnect();
    this.stopGridObserver();
    this.unsubscribeFullscreen?.();
    this.unsubscribeFullscreen = null;
    this.sidebarObserver = null;
    this.sidebarLateObserver = null;
    this.appFrameObserver = null;
    this.adapters.destroy();
  }

  /** Initial paint shared by mount and the launch waiter below. */
  private paintInitialSurfaces(): void {
    this.refreshStaticSurfaces();
    this.publishAccents(this.adapters.readCoverUrl());
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

  /** Observe sidebar mount so opening the Now Playing View paints at once. */
  private watchSidebar(): void {
    const apply = () => {
      if (document.querySelector(NOW_PLAYING_PANEL)) this.applySidebarIfVisible();
    };
    const observer = new MutationObserver(apply);
    const root = sidebarRegion() ?? document.body;
    observer.observe(root, { childList: true, subtree: true });
    this.sidebarObserver = observer;
    lifecycle.trackObserver(observer);
    // Late-mounted right sidebar container itself.
    if (!sidebarRegion()) {
      const late = new MutationObserver((_muts, obs) => {
        const sb = sidebarRegion();
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
            node.matches?.(anySurface('appFrameHost')) ||
            node.querySelector?.(anySurface('appFrameHost'))
          ) {
            hostAdded = true;
            break;
          }
        }
        if (hostAdded) break;
      }
      if (!hostAdded || this.appFrameRafQueued) return;
      this.appFrameRafQueued = true;
      const lifetime = this.lifetimeGeneration;
      requestAnimationFrame(() => {
        this.appFrameRafQueued = false;
        if (this.destroyed || lifetime !== this.lifetimeGeneration) return;
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

export const artworkSurfacesSingleton = new ArtworkSurfaces();
