/**
 * Shared helpers for dynamic background cross-fade implementations.
 * Extracted to deduplicate `dynamicBackground.ts` vs `NowPlayingBarBackground.ts`.
 */

/** Normalize `spotify:image:` URI → https URL. */
export function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('spotify:image:')) {
    const imageId = url.replace('spotify:image:', '');
    return `https://i.scdn.co/image/${imageId}`;
  }
  return url;
}

/** Apply random CSS variables for background rotation/scale/hue variety. */
export function setRandomCSSVariables(): void {
  const rotationPrimary = Math.floor(Math.random() * 360);
  const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360;
  document.documentElement.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
  document.documentElement.style.setProperty('--bg-rotation-secondary', `${rotationSecondary}deg`);

  const scalePrimary = 1.0 + Math.random() * 0.2; // 1.0–1.2
  const scaleSecondary = 1.1 + Math.random() * 0.2; // 1.1–1.3
  document.documentElement.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
  document.documentElement.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);

  const hueShift = Math.floor(Math.random() * 30);
  document.documentElement.style.setProperty('--bg-hue-shift', `${hueShift}deg`);
}

/** Create an `<img>` element for the dual-image crossfade. */
export function createBackgroundImage(
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

/**
 * Perform crossfade swap once the inactive image has loaded.
 * Caller should set `inactiveImg.src` before invoking and handle `onerror` if needed.
 */
export function crossfadeSwap(
  activeImg: HTMLImageElement,
  inactiveImg: HTMLImageElement,
  container: HTMLElement,
  newUrl: string,
): void {
  inactiveImg.onload = () => {
    requestAnimationFrame(() => {
      activeImg.classList.remove('active');
      inactiveImg.classList.add('active');
      container.setAttribute('current-img', newUrl);
      setRandomCSSVariables();
    });
  };
  inactiveImg.onerror = () => {
    console.error('Error loading new background image:', newUrl);
  };
}
