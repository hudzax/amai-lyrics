import fastdom from '../../utils/fastdom';

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
    if (!coverUrl) return;

    // Convert Spotify URI to proper URL if needed
    if (coverUrl.startsWith('spotify:image:')) {
      const imageId = coverUrl.replace('spotify:image:', '');
      coverUrl = `https://i.scdn.co/image/${imageId}`;
    }

    try {
      // Quick check for cached values to avoid unnecessary work
      if (coverUrl === this.cached.lastImgUrl && this.cached.dynamicBg) return;

      fastdom.readThenWrite(
        // Read phase
        () => {
          const nowPlayingBar = document.querySelector('.Root__right-sidebar aside.NowPlayingView');

          return {
            nowPlayingBar: nowPlayingBar,
            hasDynamicBg: !!this.cached.dynamicBg,
            images: this.cached.dynamicBg
              ? {
                  imgA: this.cached.dynamicBg.querySelector('#bg-img-a') as HTMLImageElement,
                  imgB: this.cached.dynamicBg.querySelector('#bg-img-b') as HTMLImageElement,
                }
              : null,
          };
        },
        // Write phase
        ({ nowPlayingBar, hasDynamicBg, images }) => {
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
        },
      );
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
    // Set random CSS variables for variety
    this.setRandomCSSVariables();

    // Create new dynamic background container
    const dynamicBackground = document.createElement('div');
    dynamicBackground.className = 'sweet-dynamic-bg';
    dynamicBackground.setAttribute('current-img', coverUrl);

    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    dynamicBackground.appendChild(placeholder);

    // Create image A (active)
    const imgA = this.createBackgroundImage(
      'bg-img-a',
      'bg-image primary active',
      coverUrl,
      'eager',
    );
    dynamicBackground.appendChild(imgA);

    // Create image B (inactive)
    const imgB = this.createBackgroundImage('bg-img-b', 'bg-image secondary', '', 'lazy');
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

  private createBackgroundImage(
    id: string,
    className: string,
    src: string,
    loading: 'eager' | 'lazy',
  ): HTMLImageElement {
    const img = document.createElement('img');
    img.id = id;
    img.className = className;
    img.decoding = 'async';
    img.loading = loading;
    if (src) img.src = src;
    return img;
  }

  private setRandomCSSVariables() {
    const rotationPrimary = Math.floor(Math.random() * 360);
    const rotationSecondary = Math.floor(Math.random() * 360);
    document.documentElement.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
    document.documentElement.style.setProperty(
      '--bg-rotation-secondary',
      `${rotationSecondary}deg`,
    );

    const scalePrimary = 0.9 + Math.random() * 0.3;
    const scaleSecondary = 0.9 + Math.random() * 0.3;
    document.documentElement.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
    document.documentElement.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);

    const hueShift = Math.floor(Math.random() * 30);
    document.documentElement.style.setProperty('--bg-hue-shift', `${hueShift}deg`);
  }
}
