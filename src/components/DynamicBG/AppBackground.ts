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

/** Sync the `<html>` marker with the settings toggle (init / toggle changes). */
export function syncAppBgMarker(): void {
  document.documentElement.classList.toggle(APP_BG_ON_CLASS, isAppBackgroundEnabled());
}

/** Find this feature's background node without touching the lyrics page's nested BG. */
function findAppBg(host: Element): HTMLElement | null {
  for (const child of Array.from(host.children)) {
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
    if (!isAppBackgroundEnabled()) return;
    syncAppBgMarker();
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
      if (this.cached.dynamicBg && !host.contains(this.cached.dynamicBg)) {
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
      const bg = host ? findAppBg(host) : null;
      bg?.remove();
      if (host) {
        // Only drop the helper positioning class when no direct-child BG remains.
        if (!findAppBg(host)) {
          host.classList.remove(APP_BG_HOST_HELPER_CLASS);
        }
        host.classList.remove(APP_BG_HOST_CLASS);
      }
      document.documentElement.classList.remove(APP_BG_ON_CLASS);
      this.clearCache();
    } catch (error) {
      console.error('Error Removing the Dynamic BG from the App:', error);
    }
  }

  public isApplied(): boolean {
    const host = resolveAppBgHost();
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
    setRandomCSSVariables();

    // A remount can leave a stale node behind while cache was cleared.
    findAppBg(host)?.remove();

    const dynamicBackground = document.createElement('div');
    dynamicBackground.className = `${APP_BG_CONTAINER_CLASS} ${APP_BG_CLASS}`;
    dynamicBackground.setAttribute('current-img', coverUrl);

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
    console.log('[Amai Lyrics] App background created:', coverUrl);

    imgA.onload = () => {
      requestAnimationFrame(() => {
        dynamicBackground.classList.add('sweet-dynamic-bg-loaded');
      });
    };

    this.cached.dynamicBg = dynamicBackground;
  }

  private updateExistingBackground(
    images: { imgA: HTMLImageElement; imgB: HTMLImageElement },
    coverUrl: string,
  ): void {
    const { imgA, imgB } = images;
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
