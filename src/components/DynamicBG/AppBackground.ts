import storage from '../../utils/storage';
import Defaults from '../Global/Defaults';
import { normalizeImageUrl, setRandomCSSVariables, createBackgroundImage } from './utils';

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

interface AppBackgroundCache {
  host: Element | null;
  dynamicBg: HTMLElement | null;
  lastImgUrl: string | null;
}

/** Whether the main-view artwork background is enabled (settings toggle, default on). */
export function isAppBackgroundEnabled(): boolean {
  const raw = storage.get('enable_app_background');
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return Defaults.enableAppBackground ?? false;
}

/** Resolve the app-frame host (`.Root`), falling back to `.Root__top-container`. */
export function resolveAppBgHost(): Element | null {
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
 * `remove()` never touches the nested `#SpicyLyricsPage` or sidebar backgrounds.
 * Synchronous DOM writes keep it trivially testable; callers debounce
 * song-change applies.
 */
export class AppBackground {
  private cached: AppBackgroundCache = {
    host: null,
    dynamicBg: null,
    lastImgUrl: null,
  };

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

      // Re-resolve after the app frame remounts (Spotify recreates it on nav).
      if (this.cached.host !== host) {
        this.cached.host = host;
        this.cached.dynamicBg = findAppBg(host);
      }
      // Cache may point at a node detached by nav/hot-reload — re-resolve.
      // isConnected is O(1); contains() walks — prefer the cheap check.
      const cachedBg = this.cached.dynamicBg;
      if (cachedBg && (!cachedBg.isConnected || cachedBg.parentElement !== host)) {
        this.cached.dynamicBg = findAppBg(host);
      }

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

  private createNewBackground(host: Element, coverUrl: string): void {
    // Scoped to the canvas element: vars inherit to the <img> children without
    // invalidating every other var() consumer document-wide.
    const dynamicBackground = document.createElement('div');
    dynamicBackground.className = `${APP_BG_CONTAINER_CLASS} ${APP_BG_CLASS}`;
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

    host.classList.add(APP_BG_HOST_HELPER_CLASS, APP_BG_HOST_CLASS);
    host.appendChild(dynamicBackground);
    syncLibraryGridState(host);

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
