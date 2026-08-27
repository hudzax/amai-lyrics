import fastdom from 'fastdom';
import { normalizeImageUrl, setRandomCSSVariables, createBackgroundImage } from './utils';

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

  /**
   * Apply optimized dynamic background to the now playing bar
   * Uses dual-image crossfade approach for smooth transitions
   */
  public apply(coverUrl: string | undefined) {
    const normalized = normalizeImageUrl(coverUrl);
    if (!normalized) return;
    coverUrl = normalized;

    try {
      // Quick check for cached values to avoid unnecessary work
      if (coverUrl === this.cached.lastImgUrl && this.cached.dynamicBg) return;

      // Use closure variables to pass data from measure to mutate
      new Promise<{
        nowPlayingBar: Element | null;
        hasDynamicBg: boolean;
        images: { imgA: HTMLImageElement; imgB: HTMLImageElement } | null;
      }>((resolve) => {
        fastdom.measure(() => {
          const nowPlayingBar = document.querySelector('.Root__right-sidebar aside.NowPlayingView');
          const hasDynamicBg = !!this.cached.dynamicBg;
          const images = this.cached.dynamicBg
            ? {
                imgA: this.cached.dynamicBg.querySelector('#bg-img-a') as HTMLImageElement,
                imgB: this.cached.dynamicBg.querySelector('#bg-img-b') as HTMLImageElement,
              }
            : null;
          resolve({ nowPlayingBar, hasDynamicBg, images });
        });
      }).then(({ nowPlayingBar, hasDynamicBg, images }) => {
        fastdom.mutate(() => {
          if (!nowPlayingBar) {
            this.clearCache();
            return;
          }

          if (this.cached.nowPlayingBar !== nowPlayingBar) {
            this.cached.nowPlayingBar = nowPlayingBar;
          }

          if (!hasDynamicBg) {
            this.createNewBackground(nowPlayingBar, coverUrl);
          } else if (images) {
            this.updateExistingBackground(images, coverUrl);
          }

          this.cached.lastImgUrl = coverUrl;
        });
      });
    } catch (error) {
      console.error('Error Applying the Dynamic BG to the NowPlayingBar:', error);
    }
  }

  private clearCache() {
    this.cached.lastImgUrl = null;
    this.cached.dynamicBg = null;
    this.cached.nowPlayingBar = null;
  }

  private createNewBackground(nowPlayingBar: Element, coverUrl: string) {
    setRandomCSSVariables();

    const dynamicBackground = document.createElement('div');
    dynamicBackground.className = 'sweet-dynamic-bg';
    dynamicBackground.setAttribute('current-img', coverUrl);

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
      requestAnimationFrame(() => {
        dynamicBackground.classList.add('sweet-dynamic-bg-loaded');
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

    // Update the inactive image source
    inactiveImg.src = coverUrl;

    // Once inactive image loads, start crossfade
    inactiveImg.onload = () => {
      requestAnimationFrame(() => {
        // Swap active classes
        activeImg.classList.remove('active');
        inactiveImg.classList.add('active');

        // Update container attribute
        this.cached.dynamicBg?.setAttribute('current-img', coverUrl);
      });
    };
  }

  /** Clear cached state when the NowPlayingView is no longer mounted. */
  public destroy(): void {
    this.clearCache();
  }
}
