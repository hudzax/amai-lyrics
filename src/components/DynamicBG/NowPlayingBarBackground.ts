import fastdom from 'fastdom';
import { measureAsync, mutateAsync } from '../../utils/fastdomAsync';
import { normalizeImageUrl, setRandomCSSVariables, createBackgroundImage } from './utils';
import { APP_BG_ON_CLASS } from './AppBackground';

interface BackgroundCache {
  nowPlayingBar: Element | null;
  dynamicBg: HTMLElement | null;
  lastImgUrl: string | null;
}

export class NowPlayingBarBackground {
  private cached: BackgroundCache = {
    nowPlayingBar: null,
    dynamicBg: null,
    lastImgUrl: null,
  };
  // URL with an in-flight measure→mutate handoff. Recorded synchronously so
  // rapid repeat calls dedup against it instead of racing the async update
  // of lastImgUrl below.
  private pendingUrl: string | null = null;

  /**
   * Apply optimized dynamic background to the now playing bar
   * Uses dual-image crossfade approach for smooth transitions
   */
  public apply(coverUrl: string | undefined) {
    // Single-canvas mode: the sidebar node is display:none behind the app-frame
    // canvas — skip the fetch/decode entirely. Deliberately returns WITHOUT
    // recording lastImgUrl so the toggle-off refresh (see app.tsx
    // 'amai:appbg-changed' handler) actually repaints instead of dedup-hitting.
    if (document.documentElement.classList.contains(APP_BG_ON_CLASS)) return;
    const targetUrl = normalizeImageUrl(coverUrl);
    if (!targetUrl) return;

    // Quick check for cached values to avoid unnecessary work
    if (targetUrl === this.cached.lastImgUrl && this.cached.dynamicBg) return;
    if (targetUrl === this.pendingUrl) return;
    this.pendingUrl = targetUrl;

    void (async () => {
      try {
        const { nowPlayingBar, hasDynamicBg, images } = await measureAsync(() => {
          const bar = document.querySelector('.Root__right-sidebar aside.NowPlayingView');
          const hasBg = !!this.cached.dynamicBg;
          const imgs = this.cached.dynamicBg
            ? {
                imgA: this.cached.dynamicBg.querySelector('#bg-img-a') as HTMLImageElement,
                imgB: this.cached.dynamicBg.querySelector('#bg-img-b') as HTMLImageElement,
              }
            : null;
          return { nowPlayingBar: bar, hasDynamicBg: hasBg, images: imgs };
        });

        if (!nowPlayingBar || !nowPlayingBar.isConnected) {
          this.clearCache();
          return;
        }

        await mutateAsync(() => {
          // Sidebar remounted between measure and mutate: drop the stale
          // ref instead of appending into a detached tree.
          if (!nowPlayingBar.isConnected) {
            this.clearCache();
            return;
          }

          if (this.cached.nowPlayingBar !== nowPlayingBar) {
            this.cached.nowPlayingBar = nowPlayingBar;
          }

          if (!hasDynamicBg) {
            this.createNewBackground(nowPlayingBar, targetUrl);
          } else if (images) {
            this.updateExistingBackground(images, targetUrl);
          }

          this.cached.lastImgUrl = targetUrl;
        });
      } catch (error) {
        console.error('Error Applying the Dynamic BG to the NowPlayingBar:', error);
      } finally {
        if (this.pendingUrl === targetUrl) this.pendingUrl = null;
      }
    })();
  }

  private clearCache() {
    this.cached.lastImgUrl = null;
    this.cached.dynamicBg = null;
    this.cached.nowPlayingBar = null;
    this.pendingUrl = null;
  }

  private createNewBackground(nowPlayingBar: Element, coverUrl: string) {
    const dynamicBackground = document.createElement('div');
    dynamicBackground.className = 'sweet-dynamic-bg';
    dynamicBackground.setAttribute('current-img', coverUrl);
    // Scoped vars: inherit to the <img> children without a document-wide recalc.
    setRandomCSSVariables(dynamicBackground);

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    dynamicBackground.appendChild(placeholder);

    const imgA = createBackgroundImage('bg-img-a', 'bg-image primary active', coverUrl, 'eager');
    dynamicBackground.appendChild(imgA);

    const imgB = createBackgroundImage('bg-img-b', 'bg-image secondary', '', 'lazy');
    dynamicBackground.appendChild(imgB);

    // Add container to DOM
    nowPlayingBar.classList.add('sweet-dynamic-bg-in-this');
    nowPlayingBar.appendChild(dynamicBackground);

    // Mark as loaded after image loads
    imgA.onload = () => {
      if (!dynamicBackground.isConnected) return;
      fastdom.mutate(() => {
        if (!dynamicBackground.isConnected) return;
        dynamicBackground.classList.add('sweet-dynamic-bg-loaded');
        // Drop the blurred placeholder layer once real pixels exist.
        placeholder.remove();
      });
    };

    this.cached.dynamicBg = dynamicBackground;
  }

  private updateExistingBackground(
    images: { imgA: HTMLImageElement; imgB: HTMLImageElement },
    coverUrl: string,
  ) {
    const { imgA, imgB } = images;
    const activeImg = imgA.classList.contains('active') ? imgA : imgB;
    const inactiveImg = activeImg === imgA ? imgB : imgA;

    // Clear previous handlers so fast skips don't fire stale onloads.
    // Assign handlers BEFORE setting src — cached images may fire load synchronously.
    inactiveImg.onload = null;
    inactiveImg.onerror = null;
    inactiveImg.onload = () => {
      if (inactiveImg.src !== coverUrl) return;
      fastdom.mutate(() => {
        if (inactiveImg.src !== coverUrl) return;
        // Swap active classes
        activeImg.classList.remove('active');
        inactiveImg.classList.add('active');

        // Update container attribute
        this.cached.dynamicBg?.setAttribute('current-img', coverUrl);
      });
    };
    inactiveImg.onerror = () => {
      console.error('Error loading new background image:', coverUrl);
    };
    // Update the inactive image source after handlers are in place
    inactiveImg.src = coverUrl;
  }

  /** Clear cached state when the NowPlayingView is no longer mounted. */
  public destroy(): void {
    this.clearCache();
  }
}
