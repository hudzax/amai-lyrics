import storage from '../../utils/storage';
import Defaults from '../Global/Defaults';
import { normalizeImageUrl, setRandomCSSVariables, createBackgroundImage } from './utils';

type GlAppBackgroundInstance = import('./GlAppBackground').GlAppBackground;

export const APP_BG_HOST_SELECTOR = '.Root';
export const APP_BG_HOST_FALLBACK_SELECTOR = '.Root__top-container';
/**
 * Marker on `<html>` while the app-frame background feature is enabled.
 * Contract: CSS selectors using it must LEAD with it
 * (`.amai-app-bg-on body ...`) — it is an ancestor of <body>, never a
 * descendant, so `body ... .amai-app-bg-on ...` can never match.
 */
export const APP_BG_ON_CLASS = 'amai-app-bg-on';
export const APP_BG_HOST_CLASS = 'amai-app-bg-host';
export const APP_BG_CLASS = 'amai-app-bg';
export const APP_BG_IMG_A_ID = 'amai-app-bg-img-a';
export const APP_BG_IMG_B_ID = 'amai-app-bg-img-b';
/** Toggled on `.Root__nav-bar` when the library shows cards (expanded grid).
 * Replaces the `:has([data-encore-id='card'])` selector, which forces the
 * style engine to re-evaluate on every descendant mutation. */
export const APP_BG_LIB_GRID_CLASS = 'amai-lib-grid';
const APP_BG_CONTAINER_CLASS = 'sweet-dynamic-bg';
const APP_BG_HOST_HELPER_CLASS = 'sweet-dynamic-bg-in-this';
/** Container class for the WebGL2 shader canvas. CSS layers/scrims/filters
 * must be neutralized while it is present — the shader paints everything. */
export const APP_BG_GPU_CLASS = 'amai-bg-gpu';

/** Build the shared background container node (DOM fallback or GPU canvas). */
export function createAppBgContainer(gpuMode = false): HTMLDivElement {
  const div = document.createElement('div');
  div.className = `${APP_BG_CONTAINER_CLASS} ${APP_BG_CLASS}${gpuMode ? ` ${APP_BG_GPU_CLASS}` : ''}`;
  return div;
}

/** Host/helper classes + nav grid sync — the positioning contract both backends share. */
export function ensureAppBgHostClasses(host: Element): void {
  host.classList.add(APP_BG_HOST_HELPER_CLASS, APP_BG_HOST_CLASS);
  syncLibraryGridState(host);
}

interface AppBackgroundCache {
  host: Element | null;
  dynamicBg: HTMLElement | null;
  lastImgUrl: string | null;
}

/** Remove a DOM-path background node; GPU-class containers are never touched. */
function detachDomCanvas(el: Element | null | undefined): void {
  if (
    el instanceof HTMLElement &&
    el.classList.contains(APP_BG_CLASS) &&
    !el.classList.contains(APP_BG_GPU_CLASS)
  ) {
    el.remove();
  }
}

/**
 * Drop the host positioning classes once no background node remains there.
 * Stale-boot cleanup: `GlAppBackground.create()` reattaches (re-tagging the
 * host via `ensureAppBgHostClasses`) BEFORE `bootGl` gets to check its
 * generation, so a boot that completes after `remove()` re-adds classes the
 * teardown already stripped — leaving `.amai-app-bg-host`'s transparent
 * backgrounds active with no canvas behind them. Kept conditional on
 * `findAppBg` so a DOM fallback rebuilt in the meantime keeps its classes.
 */
function releaseAppBgHostIfEmpty(host: Element | null | undefined): void {
  if (!host || findAppBg(host)) return;
  host.classList.remove(APP_BG_HOST_HELPER_CLASS, APP_BG_HOST_CLASS);
}

/**
 * Environment-level GPU rejections — the runtime can't produce a working
 * context (e.g. WebGL2 disabled/blocklisted, driver context-creation
 * failures). The CSS canvas is the designed fallback, so degrade with one
 * quiet line instead of a stack trace.
 *
 * Deliberately narrow: every error `GlAppBackground` throws starts with
 * "WebGL2" — including shader compile/link failures, whose info logs are the
 * only diagnostics for a driver-specific problem. Matching the module prefix
 * would misreport those as an unavailable runtime and discard the log, so
 * anything but a context failure must keep the full `console.error`.
 */
function isGpuEnvironmentFailure(error: unknown): boolean {
  const err = error as { name?: string; message?: string } | undefined;
  const text = `${err?.name ?? ''} ${err?.message ?? String(error)}`;
  return /context unavailable|context lost/i.test(text);
}

/** Whether the main-view artwork background is enabled (settings toggle, default on). */
export function isAppBackgroundEnabled(): boolean {
  const raw = storage.get('enable_app_background');
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return Defaults.enableAppBackground ?? false;
}

/**
 * Resolve the host the app background must live in.
 *
 * Normally the app frame (`.Root`, falling back to `.Root__top-container`).
 * While the lyrics page is fullscreen it resolves to `#AmaiLyricsPage.Fullscreen`
 * instead: `Fullscreen.Open()` transfers the page out of `.Root` to `<body>` and
 * into the UA top layer, so a `.Root`-child canvas would sit behind Spotify's
 * own opaque UI and never show. Class-based rather than `document.fullscreenElement`
 * because the `requestFullscreen()`-refused fallback keeps the same `.Fullscreen`
 * presentation.
 */
export function resolveAppBgHost(): Element | null {
  const fullscreenPage = document.querySelector('#AmaiLyricsPage.Fullscreen');
  if (fullscreenPage) return fullscreenPage;
  return (
    document.querySelector(APP_BG_HOST_SELECTOR) ??
    document.querySelector(APP_BG_HOST_FALLBACK_SELECTOR)
  );
}

/** Sync the `<html>` marker with the settings toggle (init / toggle changes).
 * Accepts a precomputed flag so hot paths (e.g. `apply()`) pay one storage
 * read instead of two. */
export function syncAppBgMarker(force?: boolean): void {
  document.documentElement.classList.toggle(APP_BG_ON_CLASS, force ?? isAppBackgroundEnabled());
}

/** Sync the opaque-library-grid class (see `APP_BG_LIB_GRID_CLASS`).
 * Exported so the toggle handler and observers can refresh it without a
 * full `apply()` — cheap single `querySelector` inside the nav column. */
export function syncLibraryGridState(scope?: ParentNode): void {
  const navBar = (scope ?? document).querySelector?.('.Root__nav-bar');
  if (!navBar) return;
  navBar.classList.toggle(APP_BG_LIB_GRID_CLASS, !!navBar.querySelector("[data-encore-id='card']"));
}

/** Find this feature's background node without touching the lyrics page's nested BG. */
function findAppBg(host: Element): HTMLElement | null {
  // NOTE: indexed loop over the live HTMLCollection — no Array.from alloc,
  // and this runs inside MutationObserver callbacks on a hot DOM.
  const kids = host.children;
  for (let i = 0; i < kids.length; i++) {
    const child = kids[i];
    if (
      child instanceof HTMLElement &&
      child.classList.contains(APP_BG_CONTAINER_CLASS) &&
      child.classList.contains(APP_BG_CLASS)
    ) {
      return child;
    }
  }
  return null;
}

/**
 * Always-on artwork background for Spotify's app frame.
 * Same dual-image crossfade approach as the lyrics/sidebar backgrounds, but
 * scoped to a direct child of `.Root` (fallback `.Root__top-container`) so one
 * continuous canvas sits behind the top bar, main view, and playbar, while
 * `remove()` never touches the nested `#AmaiLyricsPage` or sidebar backgrounds.
 * Synchronous DOM writes keep it trivially testable; callers debounce
 * song-change applies.
 */
export class AppBackground {
  private cached: AppBackgroundCache = {
    host: null,
    dynamicBg: null,
    lastImgUrl: null,
  };
  /** Live WebGL2 canvas, once boot succeeded (see `bootGl`). */
  private glBg: GlAppBackgroundInstance | null = null;
  private glState: 'idle' | 'booting' | 'failed' | 'ready' = 'idle';
  /** Bumped by `remove()` so an in-flight boot tears itself down instead of mounting behind it. */
  private bootGeneration = 0;
  private lastCoverUrl: string | null = null;
  /** Pending drop of the DOM placeholder after the GL canvas fades in. */
  private domDetachTimer: ReturnType<typeof setTimeout> | null = null;

  public apply(coverUrl: string | undefined): void {
    // Single storage read up front: every early-out below must precede DOM work
    // so the (default-off) disabled path costs ~one localStorage read, no queries.
    const enabled = isAppBackgroundEnabled();
    if (!enabled) return;
    syncAppBgMarker(true);
    const normalized = normalizeImageUrl(coverUrl);
    if (!normalized) return;
    coverUrl = normalized;

    try {
      const host = resolveAppBgHost();
      if (!host) {
        this.clearCache();
        return;
      }

      // Host switched: either Spotify recreated the frame (nav) or the lyrics
      // page went fullscreen/returned — `TransferElement` moves the page itself
      // and `resolveAppBgHost` follows it. Carry a still-connected node with us
      // instead of orphaning it and building a duplicate; the GL container
      // keeps its cache entry so its branch below can reattach it.
      let vacatedHost: Element | null = null;
      const releaseVacatedHost = (): void => {
        if (vacatedHost && vacatedHost !== host) releaseAppBgHostIfEmpty(vacatedHost);
      };
      if (this.cached.host !== host) {
        vacatedHost = this.cached.host;
        this.cached.host = host;
        const carried = this.cached.dynamicBg;
        this.cached.dynamicBg = findAppBg(host);
        if (
          !this.cached.dynamicBg &&
          carried?.isConnected &&
          !carried.classList.contains(APP_BG_GPU_CLASS)
        ) {
          ensureAppBgHostClasses(host);
          host.appendChild(carried);
          this.cached.dynamicBg = carried;
        }
      }
      // Cache may point at a node detached by nav/hot-reload — re-resolve.
      // isConnected is O(1); contains() walks — prefer the cheap check.
      const cachedBg = this.cached.dynamicBg;
      if (cachedBg && (!cachedBg.isConnected || cachedBg.parentElement !== host)) {
        this.cached.dynamicBg = findAppBg(host);
      }

      this.lastCoverUrl = coverUrl;

      // WebGL2 canvas took over: it owns all painting from here on.
      if (this.glBg) {
        if (!this.cached.dynamicBg || this.cached.dynamicBg.parentElement !== host) {
          this.glBg.reattach(host);
          this.cached.dynamicBg = this.glBg.getElement();
        }
        releaseVacatedHost();
        this.glBg.apply(coverUrl);
        this.cached.lastImgUrl = coverUrl;
        return;
      }

      // DOM path: the carry above already moved the node — release the old
      // host's classes before the dedup early-out below can return.
      releaseVacatedHost();

      // Kick the one-shot WebGL2 boot (lazy import — skipped entirely on
      // GPU-less shells and in jsdom). The DOM canvas paints until it lands;
      // on success the swap happens in `bootGl`'s completion.
      if (this.glState === 'idle') this.bootGl(host, coverUrl);

      if (coverUrl === this.cached.lastImgUrl && this.cached.dynamicBg) return;

      if (!this.cached.dynamicBg) {
        this.createNewBackground(host, coverUrl);
      } else {
        const imgA = this.cached.dynamicBg.querySelector(
          `#${APP_BG_IMG_A_ID}`,
        ) as HTMLImageElement | null;
        const imgB = this.cached.dynamicBg.querySelector(
          `#${APP_BG_IMG_B_ID}`,
        ) as HTMLImageElement | null;
        if (!imgA || !imgB) {
          this.createNewBackground(host, coverUrl);
        } else {
          this.updateExistingBackground({ imgA, imgB }, coverUrl);
        }
      }

      this.cached.lastImgUrl = coverUrl;
    } catch (error) {
      console.error('Error Applying the Dynamic BG to the App:', error);
    }
  }

  /** Remove the app-frame background node (toggle off / teardown). */
  public remove(): void {
    try {
      // Cancel any in-flight boot first: its completion sees the generation
      // change and tears itself down instead of mounting behind us.
      this.bootGeneration++;
      if (this.domDetachTimer) {
        clearTimeout(this.domDetachTimer);
        this.domDetachTimer = null;
      }
      if (this.glBg) {
        const dying = this.glBg;
        this.glBg = null;
        dying.remove();
      }
      if (this.glState === 'ready' || this.glState === 'booting') this.glState = 'idle';
      const host = this.cached.host ?? resolveAppBgHost();
      // Single scan: reuse the result for both removal and helper-class check.
      const bg = host ? findAppBg(host) : null;
      bg?.remove();
      if (host) {
        // Only drop the helper positioning class when no direct-child BG remains.
        if (!bg || !findAppBg(host)) {
          host.classList.remove(APP_BG_HOST_HELPER_CLASS);
        }
        host.classList.remove(APP_BG_HOST_CLASS);
        host.querySelector('.Root__nav-bar')?.classList.remove(APP_BG_LIB_GRID_CLASS);
      }
      // Toggling off while fullscreen: `host` is the lyrics page, while the
      // app-frame host behind it may still hold the reveal-window placeholder
      // or its classes (remove() cancelled its detach timer above) — clear
      // both, or the node and Spotify's transparent-UI state strand over the
      // real frame with no way back.
      const backHost = document.querySelector(
        `${APP_BG_HOST_SELECTOR}, ${APP_BG_HOST_FALLBACK_SELECTOR}`,
      );
      if (backHost && backHost !== host) {
        findAppBg(backHost)?.remove();
        releaseAppBgHostIfEmpty(backHost);
      }
      document.documentElement.classList.remove(APP_BG_ON_CLASS);
      this.clearCache();
    } catch (error) {
      console.error('Error Removing the Dynamic BG from the App:', error);
    }
  }

  public isApplied(): boolean {
    // Cache-first: avoids querySelector + child scan on every observer tick.
    const cachedBg = this.cached.dynamicBg;
    if (cachedBg?.isConnected && cachedBg.classList.contains(APP_BG_CLASS)) return true;
    const host = this.cached.host?.isConnected ? this.cached.host : resolveAppBgHost();
    return !!host && !!findAppBg(host);
  }

  /** Clear cached state and remove the DOM node (hot-reload safe). */
  public destroy(): void {
    this.remove();
  }

  private clearCache(): void {
    this.cached.lastImgUrl = null;
    this.cached.dynamicBg = null;
    this.cached.host = null;
  }

  /**
   * One-shot attempt to hand the app-frame canvas to the WebGL2 renderer.
   * The `WebGL2RenderingContext` probe runs before the import so GPU-less
   * shells (and jsdom tests) never load the renderer module. Any failure is
   * permanent for this instance — the DOM canvas already on screen just stays.
   */
  private bootGl(host: Element, coverUrl: string): void {
    this.glState = 'booting';
    const generation = ++this.bootGeneration;
    const abandon = (retryable: boolean) => {
      if (generation !== this.bootGeneration) return;
      this.glState = retryable ? 'idle' : 'failed';
    };
    void (async () => {
      if (typeof WebGL2RenderingContext === 'undefined') {
        abandon(false);
        return;
      }
      try {
        const mod = await import('./GlAppBackground');
        if (generation !== this.bootGeneration || !isAppBackgroundEnabled()) {
          abandon(true);
          return;
        }
        // Seed with the NEWEST cover, not the one that kicked the boot: a
        // song change during the import/fetch window lands on the DOM path
        // (`glState` is still 'booting') and only records `lastCoverUrl`.
        const seedUrl = this.lastCoverUrl ?? coverUrl;
        const gl = await mod.GlAppBackground.create(host, seedUrl, {
          onFail: () => this.handleGlFail(),
        });
        if (!gl) {
          abandon(false);
          return;
        }
        // Torn down or toggled off while booting: tear the fresh canvas down.
        if (generation !== this.bootGeneration || !isAppBackgroundEnabled()) {
          gl.remove();
          // create()'s reattach re-tagged every host it touched after our
          // teardown already stripped them — release them again, but only
          // where no background node (e.g. a rebuilt DOM fallback) remains.
          releaseAppBgHostIfEmpty(host);
          releaseAppBgHostIfEmpty(this.cached.host);
          releaseAppBgHostIfEmpty(resolveAppBgHost());
          abandon(true);
          return;
        }
        // Re-anchor onto the live host in case Spotify recreated the frame
        // during the async boot; reattach paints synchronously and fades the
        // canvas in. The GPU container shares findAppBg's classes, so the
        // DOM placeholder is captured BEFORE any GPU-class node exists and
        // removed only after the reveal fade completed.
        const domNode = this.cached.dynamicBg;
        const liveHost = resolveAppBgHost() ?? host;
        const staleHosts = new Set<Element>();
        if (this.cached.host && this.cached.host !== liveHost) staleHosts.add(this.cached.host);
        if (host !== liveHost) staleHosts.add(host);
        gl.reattach(liveHost);
        staleHosts.forEach((staleHost) => detachDomCanvas(findAppBg(staleHost)));
        this.scheduleDomDetach(domNode, mod.GL_REVEAL_MS);
        this.glBg = gl;
        this.glState = 'ready';
        this.cached.host = liveHost;
        this.cached.dynamicBg = gl.getElement();
        // Push when the cover moved on during seeding, or when the seed fetch
        // itself failed (hasArtwork() false → the canvas is on the dark seed):
        // either way `apply()` retries/fetches now, or the canvas keeps the
        // wrong colours until the next track — which may be minutes away. A
        // successful identical seed dedups inside `apply()` via currentUrl.
        const pushUrl = this.lastCoverUrl ?? seedUrl;
        if (pushUrl !== seedUrl || !gl.hasArtwork()) gl.apply(pushUrl);
      } catch (error) {
        abandon(false);
        if (isGpuEnvironmentFailure(error)) {
          console.warn(
            'amai-lyrics: WebGL2 is not available in this runtime — keeping the CSS dynamic background.',
          );
        } else {
          console.error('Error booting the WebGL2 app background:', error);
        }
      }
    })();
  }

  /**
   * Drop the DOM placeholder only once the GL canvas has faded in over it.
   * Removing it at mount time would expose the bare frame background while
   * the fade still blends toward it — the visible "snap" this avoids.
   */
  private scheduleDomDetach(el: HTMLElement | null, revealMs: number): void {
    if (!el || !el.isConnected) {
      detachDomCanvas(el);
      return;
    }
    if (this.domDetachTimer) clearTimeout(this.domDetachTimer);
    this.domDetachTimer = setTimeout(() => {
      this.domDetachTimer = null;
      detachDomCanvas(el);
    }, revealMs + 50);
  }

  /** Device lost after boot: drop to the DOM canvas and don't retry. */
  private handleGlFail(): void {
    if (this.glState === 'failed') return;
    // Invalidate a boot still in flight. The context-lost handler runs while
    // `create()` may still be seeding, and its completion would otherwise
    // commit that disposed canvas over the DOM fallback rebuilt below: it
    // would capture this fresh node as the "placeholder", schedule its
    // removal after the reveal window, and leave `glState` stuck on 'ready'
    // pointing at a dead instance — no background, no retry, until reload.
    this.bootGeneration++;
    this.glBg = null;
    this.glState = 'failed';
    this.cached.dynamicBg = null;
    this.cached.lastImgUrl = null;
    if (isAppBackgroundEnabled()) this.apply(this.lastCoverUrl ?? undefined);
  }

  private createNewBackground(host: Element, coverUrl: string): void {
    // Scoped to the canvas element: vars inherit to the <img> children without
    // invalidating every other var() consumer document-wide.
    const dynamicBackground = createAppBgContainer(false);
    dynamicBackground.setAttribute('current-img', coverUrl);
    setRandomCSSVariables(dynamicBackground);

    // A remount can leave a stale node behind while cache was cleared.
    findAppBg(host)?.remove();

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    dynamicBackground.appendChild(placeholder);

    const imgA = createBackgroundImage(
      APP_BG_IMG_A_ID,
      'bg-image primary active',
      coverUrl,
      'eager',
    );
    dynamicBackground.appendChild(imgA);

    const imgB = createBackgroundImage(APP_BG_IMG_B_ID, 'bg-image secondary', '', 'lazy');
    dynamicBackground.appendChild(imgB);

    ensureAppBgHostClasses(host);
    host.appendChild(dynamicBackground);

    imgA.onload = () => {
      requestAnimationFrame(() => {
        dynamicBackground.classList.add('sweet-dynamic-bg-loaded');
      });
      // Drop the blurred placeholder layer once real pixels exist — otherwise
      // it paints (radial-gradient + blur) behind every frame forever.
      placeholder.remove();
    };

    this.cached.dynamicBg = dynamicBackground;
  }

  private updateExistingBackground(
    images: { imgA: HTMLImageElement; imgB: HTMLImageElement },
    coverUrl: string,
  ): void {
    const { imgA, imgB } = images;
    // Already showing (or already loading) this URL on either layer — skip the
    // redundant fetch/decode. `src` is absolute; coverUrl is normalized absolute.
    if (imgA.src === coverUrl || imgB.src === coverUrl) {
      this.cached.dynamicBg?.setAttribute('current-img', coverUrl);
      return;
    }
    const activeImg = imgA.classList.contains('active') ? imgA : imgB;
    const inactiveImg = activeImg === imgA ? imgB : imgA;

    // Clear previous handlers so fast skips don't fire stale onloads.
    // Assign handlers BEFORE setting src — cached images may fire load synchronously.
    inactiveImg.onload = null;
    inactiveImg.onerror = null;
    inactiveImg.onload = () => {
      if (inactiveImg.src !== coverUrl) return;
      requestAnimationFrame(() => {
        activeImg.classList.remove('active');
        inactiveImg.classList.add('active');
        this.cached.dynamicBg?.setAttribute('current-img', coverUrl);
      });
    };
    inactiveImg.onerror = () => {
      console.error('Error loading new background image:', coverUrl);
    };
    inactiveImg.src = coverUrl;
  }
}

/**
 * Shared instance used by `app.tsx` and the settings toggle so the
 * `lastImgUrl` dedup cache survives across call sites. Throwaway instances
 * (`new AppBackground()` per toggle/song) always miss the cache and rebuild.
 * Tests keep constructing their own instances — this is purely a runtime share.
 */
export const appBackgroundSingleton = new AppBackground();

/**
 * Scoped observer for the library-grid opaque state. Watches ONLY the nav
 * column (small subtree, rare mutations) instead of the whole body, and only
 * toggles a class — no background rebuilds. Returns the observer so callers
 * can track it in `lifecycle`; returns null when the nav bar isn't mounted yet.
 */
export function watchLibraryGridState(): MutationObserver | null {
  const navBar = document.querySelector('.Root__nav-bar');
  if (!navBar) return null;
  syncLibraryGridState();
  const obs = new MutationObserver(() => syncLibraryGridState());
  obs.observe(navBar, { childList: true, subtree: true });
  return obs;
}
