import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/API/SpicyFetch', () => ({ default: vi.fn() }));
vi.mock('../../utils/Gets/GetProgress', () => ({
  default: vi.fn(() => 0),
  getPositionFor: vi.fn(() => 0),
  resolveIsPlaying: vi.fn(() => true),
  syncPlaybackPosition: vi.fn(),
  requestPositionTracking: vi.fn(() => vi.fn()),
}));

import { createProgressBar } from './ProgressBar';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';

const DURATION = 120000;

/**
 * Counts assignments to an element's `textContent`. The nowbar tick runs at
 * 10 Hz while the formatted position advances at most once a second, so an
 * unchanged label must not be re-assigned — assigning textContent invalidates
 * the node even when the string matches.
 *
 * The setter is a `function`, not an arrow: the real jsdom setter is brand-
 * checked against the node it is called on, so `this` has to propagate.
 */
function watchText(element: Element): { count: () => number; current: () => string } {
  const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')!;
  let writes = 0;
  Object.defineProperty(element, 'textContent', {
    configurable: true,
    get(this: Element) {
      return descriptor.get?.call(this) as string;
    },
    set(this: Element, next: string) {
      writes++;
      descriptor.set?.call(this, next);
    },
  });
  return {
    count: () => writes,
    current: () => descriptor.get?.call(element) as string,
  };
}

function setup() {
  const durationMs = vi.spyOn(SpotifyPlayer, 'GetTrackDuration').mockReturnValue(DURATION);
  const bar = createProgressBar();
  const slider = bar.element.querySelector<HTMLElement>('.SliderBar')!;
  return {
    bar,
    slider,
    durationMs,
    position: watchText(bar.element.querySelector('.Time.Position')!),
    duration: watchText(bar.element.querySelector('.Time.Duration')!),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProgressBar render writes', () => {
  it('writes the slider and both labels on the first render', () => {
    const { bar, slider, position, duration } = setup();
    const setProperty = vi.spyOn(slider.style, 'setProperty');

    bar.render(12000);

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith('--SliderProgress', String(12000 / DURATION));
    expect(position.current()).toBe('0:12');
    expect(duration.current()).toBe('2:00');
    bar.destroy();
  });

  it('skips all three writes when the position has not changed', () => {
    const { bar, slider, position, duration } = setup();
    bar.render(12000);

    const setProperty = vi.spyOn(slider.style, 'setProperty');
    const positionWrites = position.count();
    const durationWrites = duration.count();

    // Three more ticks at the same position — the 10 Hz cadence.
    bar.render(12000);
    bar.render(12000);
    bar.render(12000);

    expect(setProperty).not.toHaveBeenCalled();
    expect(position.count()).toBe(positionWrites);
    expect(duration.count()).toBe(durationWrites);
    bar.destroy();
  });

  it('updates the slider and position when the position advances, leaving duration alone', () => {
    const { bar, slider, position, duration } = setup();
    bar.render(12000);

    const setProperty = vi.spyOn(slider.style, 'setProperty');
    const durationWrites = duration.count();

    bar.render(13000);

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith('--SliderProgress', String(13000 / DURATION));
    expect(position.current()).toBe('0:13');
    expect(duration.count()).toBe(durationWrites);
    bar.destroy();
  });

  it('re-writes the duration when the track changes under it', () => {
    const { bar, duration, durationMs } = setup();
    bar.render(12000);
    expect(duration.current()).toBe('2:00');

    durationMs.mockReturnValue(240000);
    bar.render(12000);

    expect(duration.current()).toBe('4:00');
    expect(duration.count()).toBe(2);
    bar.destroy();
  });

  it('writes nothing after destroy', () => {
    const { bar, position } = setup();
    bar.render(12000);

    const writes = position.count();
    bar.destroy();
    bar.render(30000);

    expect(position.count()).toBe(writes);
  });
});
