import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { smoothScrollIntoView } from '../src/utils/ScrollIntoView';

const realRaf = globalThis.requestAnimationFrame;
const realCancel = globalThis.cancelAnimationFrame;

beforeAll(() => {
  // jsdom has no requestAnimationFrame — drive the scroll loop with timers.
  // (fastdom itself falls back to setTimeout internally, so its measure
  // phase needs no stubbing.)
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number =>
    setTimeout(
      () => cb(performance.now()),
      16,
    ) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number): void => {
    clearTimeout(id);
  }) as typeof cancelAnimationFrame;
});

afterAll(() => {
  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCancel;
  vi.restoreAllMocks();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function mockRects(containerTop: number, elementTop: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const top = this.dataset.role === 'element' ? elementTop : containerTop;
    return { top, left: 0, bottom: top, right: 0, width: 0, height: 0, x: 0, y: 0 } as DOMRect;
  });
}

function mountAttached(): { container: HTMLElement; element: HTMLElement } {
  const container = document.createElement('div');
  container.dataset.role = 'container';
  const element = document.createElement('div');
  element.dataset.role = 'element';
  container.appendChild(element);
  document.body.appendChild(container);
  return { container, element };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('smoothScrollIntoView', () => {
  it('returns an inert controller for detached nodes without throwing', () => {
    const container = document.createElement('div');
    const element = document.createElement('div');
    const controller = smoothScrollIntoView({ container, element, duration: 10 });
    expect(() => controller.cancel()).not.toThrow();
    expect(container.scrollTop).toBe(0);
  });

  it('scrolls an attached container toward the measured target', async () => {
    const { container, element } = mountAttached();
    // align top, offset 0: target = elementTop - containerTop + scrollTop
    mockRects(0, 100);
    const controller = smoothScrollIntoView({ container, element, duration: 30, align: 'top' });
    await sleep(250);
    expect(container.scrollTop).toBeCloseTo(100, 0);
    controller.cancel();
  });

  it('cancel() before the measure flush prevents any scrolling', async () => {
    const { container, element } = mountAttached();
    mockRects(0, 100);
    const controller = smoothScrollIntoView({ container, element, duration: 30, align: 'top' });
    controller.cancel();
    await sleep(120);
    expect(container.scrollTop).toBe(0);
  });

  it('skips the animation loop when already at the target', async () => {
    const { container, element } = mountAttached();
    // Zero distance: rects coincide, so no rAF loop is scheduled.
    mockRects(50, 50);
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    smoothScrollIntoView({ container, element, duration: 30, align: 'top' });
    await sleep(120);
    expect(container.scrollTop).toBe(0);
    expect(rafSpy).not.toHaveBeenCalled();
  });
});
