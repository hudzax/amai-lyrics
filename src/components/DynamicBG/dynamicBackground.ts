import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { debounce } from '../../utils/debounce';
import { applyCrossfade, randomizeBackgroundVars, type CrossfadeSurface } from './CrossfadeCanvas';
import {
  APP_BG_CONTAINER_CLASS,
  APP_BG_ON_CLASS,
  NESTED_BG_IMG_A_ID,
  NESTED_BG_IMG_B_ID,
} from './identity';
import { PageViewSelectors } from '../../constants/PageViewSelectors';

/**
 * True while `element`'s background is hidden behind the app-frame canvas and
 * would only waste a fetch/decode. The app canvas stays live behind the open
 * lyrics page in BOTH presentations now: windowed it sits behind the page in
 * `.Root`, and fullscreen the page transfers the canvas in with it
 * (`resolveAppBgHost` follows `#AmaiLyricsPage.Fullscreen`) — so the page's
 * own backdrop never shows while the app canvas is enabled.
 */
function isHiddenByAppCanvas(element: HTMLElement): boolean {
  if (!document.documentElement.classList.contains(APP_BG_ON_CLASS)) return false;
  return !!element.closest?.(PageViewSelectors.AmaiLyricsPage);
}

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

type DebouncedApply = ((host: HTMLElement, url: string) => void) & { cancel: () => void };

/**
 * Coalescing is per element, not module-wide: a module-level debounce let one
 * container's pending update cancel another's. WeakMap entries die with the
 * element, so there is no second lifetime to tear down.
 */
const pendingByElement = new WeakMap<HTMLElement, DebouncedApply>();

function debouncedApply(element: HTMLElement, url: string): void {
  let apply = pendingByElement.get(element);
  if (!apply) {
    apply = debounce((host: HTMLElement, cover: string) => {
      applyCrossfade(host, cover, lyricsPageCrossfadeSurface);
    }, 100);
    pendingByElement.set(element, apply);
  }
  apply(element, url);
}

/**
 * Paint the live track's cover onto the lyrics page's backdrop. The first
 * paint is immediate; subsequent crossfades are coalesced per element.
 */
export default async function ApplyDynamicBackground(element: HTMLElement) {
  if (!element) return;
  // Hidden behind the app-frame canvas — skip the artwork fetch + decode.
  // Deliberately returns before touching the container so the toggle-off
  // refresh repaints instead of dedup-hitting.
  if (isHiddenByAppCanvas(element)) return;

  const rawCover = await SpotifyPlayer.Artwork.Get('d');
  if (!rawCover) return;

  if (!lyricsPageCrossfadeSurface.findContainer(element)) {
    applyCrossfade(element, rawCover, lyricsPageCrossfadeSurface);
    return;
  }
  debouncedApply(element, rawCover);
}
