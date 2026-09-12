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

/** Apply random CSS variables for background rotation/scale/hue variety.
 * Scoped to the canvas element when given (limits style recalc to that
 * subtree — vars inherit to the animated <img> children); falls back to
 * `:root` for legacy callers. */
export function setRandomCSSVariables(target?: HTMLElement): void {
  const root = target ?? document.documentElement;
  const rotationPrimary = Math.floor(Math.random() * 360);
  const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360;
  root.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
  root.style.setProperty('--bg-rotation-secondary', `${rotationSecondary}deg`);

  const scalePrimary = 1.0 + Math.random() * 0.2; // 1.0–1.2
  const scaleSecondary = 1.1 + Math.random() * 0.2; // 1.1–1.3
  root.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
  root.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);

  const hueShift = Math.floor(Math.random() * 30);
  root.style.setProperty('--bg-hue-shift', `${hueShift}deg`);
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
