import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setSettingsMenu: vi.fn(),
  invalidateLyrics: vi.fn((): Promise<void> => Promise.resolve()),
  applyThemeSettings: vi.fn(),
  ready: Promise.resolve(),
}));

vi.mock('../utils/settings', () => ({ setSettingsMenu: mocks.setSettingsMenu }));
vi.mock('../components/Global/Platform', () => ({
  default: {
    get OnSpotifyReady() {
      return mocks.ready;
    },
  },
}));
vi.mock('../utils/Lyrics/fetchLyrics', () => ({ invalidateLyrics: mocks.invalidateLyrics }));
vi.mock('../utils/ThemeSettings', () => ({ applyThemeSettings: mocks.applyThemeSettings }));
vi.mock('../components/DynamicBG/identity', () => ({
  APP_BG_CONTAINER_CLASS: 'amai-app-bg',
  APP_BG_LOADED_CLASS: 'sweet-dynamic-bg-loaded',
}));

import { AppInitializer } from './AppInitializer';
import lifecycle from '../utils/lifecycle';

const windowRef = window as unknown as { __amaiCoreInitialized?: boolean };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ready = Promise.resolve();
  mocks.invalidateLyrics.mockResolvedValue(undefined);
  delete windowRef.__amaiCoreInitialized;
  document.getElementById('amai-google-fonts')?.remove();
});

afterEach(() => {
  lifecycle.disposeAll();
  document.getElementById('amai-google-fonts')?.remove();
});

describe('AppInitializer lifetime ownership', () => {
  it('does not latch first-run initialization until cache invalidation settles', async () => {
    let finishInvalidation: (() => void) | undefined;
    mocks.invalidateLyrics.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishInvalidation = resolve;
        }),
    );

    const initializing = AppInitializer.initializeCore();
    await vi.waitFor(() => expect(mocks.invalidateLyrics).toHaveBeenCalledTimes(1));
    expect(windowRef.__amaiCoreInitialized).not.toBe(true);

    finishInvalidation?.();
    await initializing;

    expect(windowRef.__amaiCoreInitialized).toBe(true);
  });

  it('does not install settings after teardown while platform readiness is pending', async () => {
    let finishReadiness: (() => void) | undefined;
    mocks.ready = new Promise<void>((resolve) => {
      finishReadiness = resolve;
    });

    const initializing = AppInitializer.initializeCore();
    await vi.waitFor(() => expect(mocks.invalidateLyrics).toHaveBeenCalledTimes(1));
    lifecycle.disposeAll();
    finishReadiness?.();
    await initializing;

    expect(mocks.setSettingsMenu).not.toHaveBeenCalled();
    expect(mocks.applyThemeSettings).not.toHaveBeenCalled();
  });
});
