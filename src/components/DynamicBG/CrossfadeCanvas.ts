/**
 * CrossfadeCanvas — the single owner of the two-layer artwork canvas.
 *
 * Every artwork surface paints the same DOM shape: a `.sweet-dynamic-bg`
 * container holding a blurred placeholder and two `<img>` layers that trade
 * `.active` when a new cover loads. The host, the container factory, the frame
 * scheduler and two optional paint hooks are the only things that differ
 * between the three surfaces; they cross this seam as a `CrossfadeSurface`
 * adapter. Everything else — URL normalization, dedup, stale-callback
 * cancellation, the load guard, the swap, `current-img` and the placeholder's
 * lifetime — sits behind one stateless `applyCrossfade` interface.
 *
 * Per-canvas load state lives in a WeakMap keyed by the container: a paint
 * generation plus the URL each layer last loaded or failed to load. It dies
 * with the container and needs no teardown. Caller caches stay outside.
 */

export interface CrossfadeSurface {
  readonly layerIds: { readonly a: string; readonly b: string };
  /** Find this surface's container. The app frame supplies its GL-aware rule. */
  findContainer(host: Element): HTMLElement | null;
  /** Build a fresh container; the host is passed for surface-specific cleanup. */
  createContainer(host: Element): HTMLElement;
  /** Tag the host and attach whatever positioning classes the surface needs. */
  prepareHost(host: Element, container: HTMLElement): void;
  /** Where the class swap runs: a frame callback or a FastDOM mutation. */
  schedule(cb: () => void): void;
  /** First layer painted — the two surfaces that mark "loaded" hook here. */
  onFirstPaint?(container: HTMLElement): void;
  /** A swap completed — the lyrics page re-randomizes its CSS vars here. */
  onSwap?(container: HTMLElement): void;
}

const PLACEHOLDER_CLASS = 'placeholder';
const LAYER_A_CLASS = 'bg-image primary active';
const LAYER_B_CLASS = 'bg-image secondary';
const CURRENT_IMG_ATTR = 'current-img';

interface LayerLoadState {
  generation: number;
  loadedUrl: WeakMap<HTMLImageElement, string>;
  failedUrl: WeakMap<HTMLImageElement, string>;
}

const loadStateByContainer = new WeakMap<HTMLElement, LayerLoadState>();

function loadStateOf(container: HTMLElement): LayerLoadState {
  let state = loadStateByContainer.get(container);
  if (!state) {
    state = {
      generation: 0,
      loadedUrl: new WeakMap<HTMLImageElement, string>(),
      failedUrl: new WeakMap<HTMLImageElement, string>(),
    };
    loadStateByContainer.set(container, state);
  }
  return state;
}

/** Normalize a `spotify:image:` URI to the https form the layers can load. */
export function normalizeCoverUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('spotify:image:')) {
    return `https://i.scdn.co/image/${raw.replace('spotify:image:', '')}`;
  }
  return raw;
}

/** Rotation/scale/hue variety, scoped to the canvas so the vars inherit to
 * its layers without invalidating every other `var()` consumer document-wide. */
export function randomizeBackgroundVars(target: HTMLElement): void {
  const rotationPrimary = Math.floor(Math.random() * 360);
  const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360;
  target.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
  target.style.setProperty('--bg-rotation-secondary', `${rotationSecondary}deg`);
  const scalePrimary = 1.0 + Math.random() * 0.2;
  const scaleSecondary = 1.1 + Math.random() * 0.2;
  target.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
  target.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);
  const hueShift = Math.floor(Math.random() * 30);
  target.style.setProperty('--bg-hue-shift', `${hueShift}deg`);
}

/** Callers bind onload/onerror before calling this with the initial src. */
function createLayer(id: string, className: string, loading: 'eager' | 'lazy'): HTMLImageElement {
  const img = document.createElement('img');
  img.id = id;
  img.className = className;
  img.decoding = 'async';
  img.loading = loading;
  return img;
}

function layersOf(container: HTMLElement, ids: CrossfadeSurface['layerIds']) {
  const a = container.querySelector<HTMLImageElement>(`#${ids.a}`);
  const b = container.querySelector<HTMLImageElement>(`#${ids.b}`);
  return a && b ? { a, b } : null;
}

/**
 * Paint `rawUrl` into `host` behind `surface`. Returns the container the
 * caller can cache: it is either found (and swapped) or freshly mounted.
 */
export function applyCrossfade(
  host: Element,
  rawUrl: string,
  surface: CrossfadeSurface,
): HTMLElement {
  const url = normalizeCoverUrl(rawUrl) ?? rawUrl;

  let container = surface.findContainer(host);
  let layers = container ? layersOf(container, surface.layerIds) : null;
  if (container && !layers) {
    // A remount left a container with no (or foreign) layers — rebuild it.
    container.remove();
    container = null;
    layers = null;
  }

  if (!container || !layers) {
    const mounted = surface.createContainer(host);
    mounted.setAttribute(CURRENT_IMG_ATTR, url);
    randomizeBackgroundVars(mounted);

    const state = loadStateOf(mounted);
    const placeholder = document.createElement('div');
    placeholder.className = PLACEHOLDER_CLASS;

    const imgA = createLayer(surface.layerIds.a, LAYER_A_CLASS, 'eager');
    const imgB = createLayer(surface.layerIds.b, LAYER_B_CLASS, 'lazy');

    // Bind handlers BEFORE assigning src: a cached image can fire load
    // synchronously inside the src setter.
    imgA.onload = () => {
      state.loadedUrl.set(imgA, url);
      state.failedUrl.delete(imgA);
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      surface.onFirstPaint?.(mounted);
    };
    imgA.onerror = () => {
      state.failedUrl.set(imgA, url);
      console.error('Error loading new background image:', url);
    };

    mounted.appendChild(placeholder);
    mounted.appendChild(imgA);
    mounted.appendChild(imgB);

    surface.prepareHost(host, mounted);
    host.appendChild(mounted);
    imgA.src = url;
    return mounted;
  }

  const state = loadStateOf(container);
  // Invalidate every queued commit belonging to an earlier paint request.
  const generation = ++state.generation;
  const active = layers.a.classList.contains('active') ? layers.a : layers.b;
  const inactive = active === layers.a ? layers.b : layers.a;

  // Already showing this cover: record it and stop. Only the *active* layer
  // counts — a URL parked on the inactive layer from an earlier crossfade
  // must still be swapped back, or a fast back-skip leaves the wrong cover up.
  // A layer that failed this URL is not "showing" it and must retry.
  if (active.src === url && state.failedUrl.get(active) !== url) {
    container.setAttribute(CURRENT_IMG_ATTR, url);
    return container;
  }

  const commit = () => {
    if (state.generation !== generation) return;
    active.classList.remove('active');
    inactive.classList.add('active');
    container.setAttribute(CURRENT_IMG_ATTR, url);
    state.loadedUrl.set(inactive, url);
    state.failedUrl.delete(inactive);
    surface.onSwap?.(container);
  };

  if (inactive.src === url && state.loadedUrl.get(inactive) === url) {
    // The layer already holds and successfully loaded this URL (fast
    // back-skip): assigning src again may not fire a load event, so commit
    // directly. A failed src is never committed this way.
    surface.schedule(commit);
    return container;
  }

  // Assign handlers BEFORE src — a cached image can fire load synchronously.
  inactive.onload = null;
  inactive.onerror = null;
  state.failedUrl.delete(inactive);
  if (inactive.src === url) {
    // Same URL, but the earlier attempt failed (or never loaded): clear the
    // attribute so assigning it again really starts a fresh load.
    inactive.removeAttribute('src');
  }
  inactive.onload = () => {
    if (state.generation !== generation || inactive.src !== url) return;
    state.loadedUrl.set(inactive, url);
    state.failedUrl.delete(inactive);
    surface.schedule(commit);
  };
  inactive.onerror = () => {
    state.failedUrl.set(inactive, url);
    state.loadedUrl.delete(inactive);
    if (state.generation === generation) {
      console.error('Error loading new background image:', url);
    }
  };
  inactive.src = url;
  return container;
}
