import { describe, it, expect } from 'vitest';
import { SongProgressBar } from '../src/utils/Lyrics/SongProgressBar';

function sliderAt(left: number, width: number): HTMLElement {
  const slider = document.createElement('div');
  slider.getBoundingClientRect = () =>
    ({ left, width, top: 0, height: 10, right: left + width, bottom: 10 }) as DOMRect;
  return slider;
}

describe('SongProgressBar edge cases', () => {
  it('clamps clicks outside the bar bounds', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 100000, position: 0 });
    const slider = sliderAt(0, 100);
    expect(
      bar.CalculatePositionFromClick({ sliderBar: slider, event: { clientX: -50 } as MouseEvent }),
    ).toBe(0);
    expect(
      bar.CalculatePositionFromClick({ sliderBar: slider, event: { clientX: 500 } as MouseEvent }),
    ).toBe(100000);
  });

  it('returns 0 for clicks when duration is 0', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 0, position: 0 });
    expect(
      bar.CalculatePositionFromClick({
        sliderBar: sliderAt(0, 100),
        event: { clientX: 50 } as MouseEvent,
      }),
    ).toBe(0);
  });

  it('formats hour-long durations as total minutes', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 3600000, position: 0 });
    expect(bar.GetFormattedDuration()).toBe('60:00');
  });

  it('pads single-digit seconds', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 65000, position: 5000 });
    expect(bar.GetFormattedDuration()).toBe('1:05');
    expect(bar.GetFormattedPosition()).toBe('0:05');
  });

  it('double Destroy is safe and progress stays at last value', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: 60000, position: 30000 });
    bar.Destroy();
    bar.Destroy();
    expect(bar.GetProgressPercentage()).toBe(0.5);
    bar.Update({ duration: 60000, position: 60000 });
    expect(bar.GetProgressPercentage()).toBe(0.5);
  });

  it('handles negative duration as 0% with 0:00 labels', () => {
    const bar = new SongProgressBar();
    bar.Update({ duration: -1000, position: 500 });
    expect(bar.GetProgressPercentage()).toBe(0);
    expect(bar.GetFormattedDuration()).toBe('0:00');
  });
});
