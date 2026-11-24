import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyCrossfade, type CrossfadeSurface } from './CrossfadeCanvas';
import { APP_BG_CONTAINER_CLASS, NESTED_BG_IMG_A_ID, NESTED_BG_IMG_B_ID } from './identity';

const COVER_A = 'https://i.scdn.co/image/aaa';
const COVER_B = 'https://i.scdn.co/image/bbb';
const COVER_C = 'https://i.scdn.co/image/ccc';

function makeSurface(overrides: Partial<CrossfadeSurface> = {}): CrossfadeSurface {
  return {
    layerIds: { a: NESTED_BG_IMG_A_ID, b: NESTED_BG_IMG_B_ID },
    findContainer: (host) => host.querySelector<HTMLDivElement>(`.${APP_BG_CONTAINER_CLASS}`),
    createContainer: () => {
      const el = document.createElement('div');
      el.className = APP_BG_CONTAINER_CLASS;
      return el;
    },
    prepareHost: () => {},
    schedule: (cb) => cb(),
    ...overrides,
  };
}

function hostWithContainer(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

function layers(container: HTMLElement) {
  const a = container.querySelector<HTMLImageElement>(`#${NESTED_BG_IMG_A_ID}`);
  const b = container.querySelector<HTMLImageElement>(`#${NESTED_BG_IMG_B_ID}`);
  if (!a || !b) throw new Error('crossfade container is missing its two layers');
  return { a, b };
}

function fireLoad(img: HTMLImageElement): void {
  // SAFETY: jsdom exposes onload as a mutable property; this test invokes the
  // handler the production module assigned, which is callable here.
  (img.onload as () => void)();
}

function fireError(img: HTMLImageElement): void {
  // SAFETY: same jsdom handler contract as fireLoad.
  (img.onerror as () => void)();
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyCrossfade', () => {
  it('mounts the frozen DOM contract and normalizes a spotify image URI', () => {
    const host = hostWithContainer();
    const prepareHost = vi.fn();
    const container = applyCrossfade(host, 'spotify:image:abc123', makeSurface({ prepareHost }));

    expect(container.parentElement).toBe(host);
    expect(host.firstElementChild).toBe(container);
    expect(prepareHost).toHaveBeenCalledWith(host, container);
    expect(container.getAttribute('current-img')).toBe(COVER_A.replace('/aaa', '/abc123'));
    expect(container.querySelector('.placeholder')).not.toBeNull();

    const { a, b } = layers(container);
    expect(a.className).toBe('bg-image primary active');
    expect(a.src).toBe('https://i.scdn.co/image/abc123');
    expect(b.className).toBe('bg-image secondary');
    expect(b.src).toBe('');
  });

  it('swaps layers, records current-img and drops the placeholder on load', () => {
    const host = hostWithContainer();
    const container = applyCrossfade(host, COVER_A, makeSurface());
    const { a, b } = layers(container);
    fireLoad(a);
    applyCrossfade(host, COVER_B, makeSurface());

    fireLoad(b);
    expect(a.classList.contains('active')).toBe(false);
    expect(b.classList.contains('active')).toBe(true);
    expect(container.getAttribute('current-img')).toBe(COVER_B);
    expect(container.querySelector('.placeholder')).toBeNull();
  });

  it('ignores a stale onload after a fast skip', () => {
    const host = hostWithContainer();
    const container = applyCrossfade(host, COVER_A, makeSurface());
    applyCrossfade(host, COVER_B, makeSurface());
    const staleOnload = layers(container).b.onload;

    applyCrossfade(host, COVER_C, makeSurface());
    // SAFETY: the captured handler is callable in jsdom.
    (staleOnload as () => void)();

    const { a, b } = layers(container);
    expect(a.classList.contains('active')).toBe(true);
    expect(b.classList.contains('active')).toBe(false);
    expect(container.getAttribute('current-img')).toBe(COVER_A);
    expect(b.src).toBe(COVER_C);
  });

  it('drops a queued commit superseded by a newer cover', () => {
    const host = hostWithContainer();
    const queued: Array<() => void> = [];
    const surface = makeSurface({ schedule: (cb) => queued.push(cb) });
    const container = applyCrossfade(host, COVER_A, surface);

    applyCrossfade(host, COVER_B, surface);
    fireLoad(layers(container).b);
    expect(queued).toHaveLength(1);

    applyCrossfade(host, COVER_C, surface);
    queued[0]();

    const { a, b } = layers(container);
    expect(a.classList.contains('active')).toBe(true);
    expect(b.classList.contains('active')).toBe(false);
    expect(container.getAttribute('current-img')).toBe(COVER_A);
    expect(b.src).toBe(COVER_C);
  });

  it('reloads a failed cover instead of committing its failed src', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const host = hostWithContainer();
    const container = applyCrossfade(host, COVER_A, makeSurface());

    applyCrossfade(host, COVER_B, makeSurface());
    const { a, b } = layers(container);
    fireError(b);
    expect(error).toHaveBeenCalled();

    applyCrossfade(host, COVER_B, makeSurface());
    expect(a.classList.contains('active')).toBe(true);
    expect(b.classList.contains('active')).toBe(false);
    expect(container.getAttribute('current-img')).toBe(COVER_A);
    expect(b.getAttribute('src')).toBe(COVER_B);

    fireLoad(b);
    expect(b.classList.contains('active')).toBe(true);
    expect(container.getAttribute('current-img')).toBe(COVER_B);
  });

  it('swaps back when the requested cover sits on the inactive layer', () => {
    const host = hostWithContainer();
    const container = applyCrossfade(host, COVER_A, makeSurface());
    // The fast-back-skip shortcut requires real load evidence for A.
    fireLoad(layers(container).a);
    applyCrossfade(host, COVER_B, makeSurface());
    fireLoad(layers(container).b);

    // Back-skip: the inactive layer still holds A. Reassigning src would not
    // necessarily fire a load event, so the swap must commit directly.
    applyCrossfade(host, COVER_A, makeSurface());

    const { a, b } = layers(container);
    expect(a.classList.contains('active')).toBe(true);
    expect(b.classList.contains('active')).toBe(false);
    expect(container.getAttribute('current-img')).toBe(COVER_A);
  });

  it('does not repaint the already-active cover', () => {
    const host = hostWithContainer();
    const container = applyCrossfade(host, COVER_A, makeSurface());
    applyCrossfade(host, COVER_A, makeSurface());

    expect(layers(container).b.src).toBe('');
    expect(container.getAttribute('current-img')).toBe(COVER_A);
  });

  it('defers the swap to the injected scheduler', () => {
    const host = hostWithContainer();
    const queued: Array<() => void> = [];
    const surface = makeSurface({ schedule: (cb) => queued.push(cb) });
    const container = applyCrossfade(host, COVER_A, surface);
    applyCrossfade(host, COVER_B, surface);
    fireLoad(layers(container).b);

    expect(layers(container).a.classList.contains('active')).toBe(true);
    expect(queued).toHaveLength(1);
    queued[0]();
    expect(layers(container).b.classList.contains('active')).toBe(true);
  });

  it('drives the paint hooks at first paint and on swap', () => {
    const host = hostWithContainer();
    const onFirstPaint = vi.fn();
    const onSwap = vi.fn();
    const surface = makeSurface({ onFirstPaint, onSwap });
    const container = applyCrossfade(host, COVER_A, surface);
    fireLoad(layers(container).a);
    expect(onFirstPaint).toHaveBeenCalledWith(container);
    expect(onSwap).not.toHaveBeenCalled();

    applyCrossfade(host, COVER_B, surface);
    fireLoad(layers(container).b);
    expect(onSwap).toHaveBeenCalledWith(container);
  });

  it('binds the first-paint handler before assigning src', () => {
    const createElement = document.createElement.bind(document) as (
      tagName: string,
      options?: ElementCreationOptions,
    ) => HTMLElement;
    vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      const element = createElement(tagName, options);
      if (tagName === 'img') {
        let src = '';
        Object.defineProperty(element, 'src', {
          configurable: true,
          get: () => src,
          set: (value: string) => {
            src = String(value);
            if (src) element.dispatchEvent(new Event('load'));
          },
        });
      }
      return element;
    }) as typeof document.createElement);

    const onFirstPaint = vi.fn();
    const host = hostWithContainer();
    const container = applyCrossfade(host, COVER_A, makeSurface({ onFirstPaint }));

    expect(container.querySelector('.placeholder')).toBeNull();
    expect(onFirstPaint).toHaveBeenCalledTimes(1);
    expect(layers(container).a.src).toBe(COVER_A);
  });

  it('rebuilds a container whose layers are missing', () => {
    const host = hostWithContainer();
    const stale = document.createElement('div');
    stale.className = APP_BG_CONTAINER_CLASS;
    host.appendChild(stale);

    const container = applyCrossfade(host, COVER_A, makeSurface());

    expect(container).not.toBe(stale);
    expect(stale.isConnected).toBe(false);
    expect(layers(container).a.src).toBe(COVER_A);
  });
});
