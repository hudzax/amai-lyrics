import { describe, it, expect } from 'vitest';
import { SongProgressBar } from '../src/utils/Lyrics/SongProgressBar';

describe('SongProgressBar', () => {
  it('formats duration and position', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 61000, position: 61000 });
    expect(bar.GetFormattedDuration()).toBe('1:01');
    expect(bar.GetFormattedPosition()).toBe('1:01');
    expect(bar.GetProgressPercentage()).toBe(1);
  });

  it('clamps position to duration', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 1000, position: 5000 });
    expect(bar.GetProgressPercentage()).toBe(1);
  });

  it('returns 0% when duration 0', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 0, position: 500 });
    expect(bar.GetProgressPercentage()).toBe(0);
  });

  it('calculates position from click', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 100000, position: 0 });
    const slider = document.createElement('div');
    // mock getBoundingClientRect
    slider.getBoundingClientRect = () =>
      ({ left: 0, width: 100, top: 0, height: 10, right: 100, bottom: 10 }) as DOMRect;
    const event = { clientX: 50 } as MouseEvent;
    const pos = bar.CalculatePositionFromClick({ sliderBar: slider, event });
    expect(pos).toBe(50000);
  });

  it('ignores updates after destroy', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 1000, position: 500 });
    bar.Destroy();
    bar.Update({ duration: 2000, position: 1000 });
    // should remain at old values
    expect(bar.GetFormattedDuration()).toBe('0:01');
  });

  it('handles NaN and negative time', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: NaN as unknown as number, position: -100 });
    expect(bar.GetFormattedDuration()).toBe('0:00');
    expect(bar.GetFormattedPosition()).toBe('0:00');
  });
});
