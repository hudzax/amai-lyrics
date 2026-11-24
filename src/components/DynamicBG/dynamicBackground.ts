import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { debounce } from '../../utils/debounce';
import { applyCrossfade, randomizeBackgroundVars, type CrossfadeSurface } from './CrossfadeCanvas';
import { APP_BG_CONTAINER_CLASS, NESTED_BG_IMG_A_ID, NESTED_BG_IMG_B_ID } from './identity';

/**
 * The lyrics page's slot on the crossfade seam: nested layer ids, a plain
 * container, no host class, frame scheduling and a re-randomization on every
 * swap (the page's artwork is intentionally more restless than the other two).
 */
const lyricsPageCrossfadeSurface: CrossfadeSurface = {
  layerIds: { a: NESTED_BG_IMG_A_ID, b: NESTED_BG_IMG_B_ID },
  findContainer: (host) => host.querySelector<HTMLDivElement>(`.${APP_BG_CONTAINER_CLASS}`),
  createContainer: () => {
    const container = document.createElement('div');
    container.className = APP_BG_CONTAINER_CLASS;
    return container;
  },
  prepareHost: () => {},
  schedule: (cb) => requestAnimationFrame(cb),
  onSwap: (container) => randomizeBackgroundVars(container),
};

type DebouncedApply = ((host: HTMLElement, url: string, shouldPaint: () => boolean) => void) & {
  cancel: () => void;
};

/**
 * Coalescing is per element, not module-wide: a module-level debounce let one
 * container's pending update cancel another's. WeakMap entries die with the
 * element, so there is no second lifetime to tear down.
 */
const pendingByElement = new WeakMap<HTMLElement, DebouncedApply>();

function debouncedApply(element: HTMLElement, url: string, shouldPaint: () => boolean): void {
  let apply = pendingByElement.get(element);
  if (!apply) {
    apply = debounce((host: HTMLElement, cover: string, canPaint: () => boolean) => {
      if (canPaint()) applyCrossfade(host, cover, lyricsPageCrossfadeSurface);
    }, 100);
    pendingByElement.set(element, apply);
  }
  apply(element, url, shouldPaint);
}

/**
 * Paint the live track's cover onto the lyrics page's backdrop. The first
 * paint is immediate; subsequent crossfades are coalesced per element.
 */
export default async function ApplyDynamicBackground(
  element: HTMLElement,
  shouldPaint: () => boolean = () => true,
) {
  if (!element) return;

  const rawCover = await SpotifyPlayer.Artwork.Get('d');
  if (!rawCover || !shouldPaint()) return;

  if (!lyricsPageCrossfadeSurface.findContainer(element)) {
    applyCrossfade(element, rawCover, lyricsPageCrossfadeSurface);
    return;
  }
  debouncedApply(element, rawCover, shouldPaint);
}
