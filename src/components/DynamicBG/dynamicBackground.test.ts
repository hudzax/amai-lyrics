import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const artworkGet = vi.hoisted(() => vi.fn());

vi.mock('../Global/SpotifyPlayer', () => ({
  SpotifyPlayer: { Artwork: { Get: artworkGet } },
}));

import ApplyDynamicBackground from './dynamicBackground';
import { APP_BG_CONTAINER_CLASS } from './identity';

let host: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  artworkGet.mockReset();
  host = document.createElement('div');
  document.body.appendChild(host);
});

afterEach(() => {
  host.remove();
  vi.useRealTimers();
});

describe('lyrics page background commit policy', () => {
  it('does not create a canvas when mode changes while artwork is loading', async () => {
    let resolveArtwork: ((url: string) => void) | undefined;
    artworkGet.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveArtwork = resolve;
        }),
    );
    let visible = true;

    const painting = ApplyDynamicBackground(host, () => visible);
    visible = false;
    resolveArtwork?.('https://i.scdn.co/image/aaa');
    await painting;

    expect(host.querySelector(`.${APP_BG_CONTAINER_CLASS}`)).toBeNull();
  });

  it('does not swap an existing canvas when mode changes during the debounce', async () => {
    const canvas = document.createElement('div');
    canvas.className = APP_BG_CONTAINER_CLASS;
    host.appendChild(canvas);
    artworkGet.mockResolvedValueOnce('https://i.scdn.co/image/aaa');
    let visible = true;

    await ApplyDynamicBackground(host, () => visible);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    visible = false;
    await vi.advanceTimersByTimeAsync(150);

    expect(host.querySelector('.sweet-dynamic-bg')?.getAttribute('current-img')).toBeNull();
    expect(host.querySelector('img')).toBeNull();
  });
});
