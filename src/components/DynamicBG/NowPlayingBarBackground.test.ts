import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  measure: vi.fn(),
  mutate: vi.fn(async (callback: () => void) => callback()),
}));

vi.mock('../../utils/fastdomAsync', () => ({
  measureAsync: mocks.measure,
  mutateAsync: mocks.mutate,
}));

import { NowPlayingBarBackground } from './NowPlayingBarBackground';
import { NESTED_BG_IMG_A_ID, NESTED_BG_IMG_B_ID } from './identity';
import { anySurface } from '../../constants/SpotifyDom';

let panel: HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mutate.mockImplementation(async (callback: () => void) => callback());
  document.body.innerHTML = '<aside class="NowPlayingView"></aside>';
  panel = document.querySelector<HTMLElement>(anySurface('nowPlayingPanel'))!;
});

describe('NowPlayingBarBackground lifetime', () => {
  it('does not mount a canvas when destroy happens during measurement', async () => {
    let finishMeasure: ((element: HTMLElement) => void) | undefined;
    mocks.measure.mockReturnValueOnce(
      new Promise<HTMLElement>((resolve) => {
        finishMeasure = resolve;
      }),
    );
    const background = new NowPlayingBarBackground();

    background.apply('https://i.scdn.co/image/aaa');
    background.destroy();
    finishMeasure?.(panel);
    await Promise.resolve();
    await Promise.resolve();

    expect(panel.querySelector('.sweet-dynamic-bg')).toBeNull();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('retries identical artwork after a failed image load', async () => {
    mocks.measure.mockResolvedValue(panel);
    const background = new NowPlayingBarBackground();
    const url = 'https://i.scdn.co/image/aaa';

    background.apply(url);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.measure).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    const image = panel.querySelector<HTMLImageElement>(`#${NESTED_BG_IMG_A_ID}`)!;
    const retryLayer = panel.querySelector<HTMLImageElement>(`#${NESTED_BG_IMG_B_ID}`)!;
    image.dispatchEvent(new Event('error'));

    background.apply(url);
    await vi.waitFor(() => expect(retryLayer.getAttribute('src')).toBe(url));
  });
});
