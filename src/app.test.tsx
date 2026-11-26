import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initializeCore: vi.fn(),
  setupSkeletonStyles: vi.fn(),
  setupPostLoadOptimizations: vi.fn(),
  buttonManagerCreated: vi.fn(),
  pageManagerCreated: vi.fn(),
  songChangeManagerCreated: vi.fn(),
  mountSurfaces: vi.fn(),
  destroySurfaces: vi.fn(),
  startLoop: vi.fn(),
  stopLoop: vi.fn(),
  initializePlaybar: vi.fn(),
  initializeEvents: vi.fn(),
  when: vi.fn(() => ({ Cancel: vi.fn(), Reset: vi.fn() })),
}));

vi.mock('./managers/AppInitializer', () => ({
  AppInitializer: {
    initializeCore: mocks.initializeCore,
    setupSkeletonStyles: mocks.setupSkeletonStyles,
    setupPostLoadOptimizations: mocks.setupPostLoadOptimizations,
  },
}));
vi.mock('./managers/ButtonManager', () => ({
  ButtonManager: class {
    constructor() {
      mocks.buttonManagerCreated();
    }
    dispose = vi.fn();
    updateRegistration = vi.fn();
    setActive = vi.fn();
  },
}));
vi.mock('./managers/PageManager', () => ({
  PageManager: class {
    constructor() {
      mocks.pageManagerCreated();
    }
  },
}));
vi.mock('./managers/SongChangeManager', () => ({
  SongChangeManager: class {
    constructor() {
      mocks.songChangeManagerCreated();
    }
    dispose = vi.fn();
    handleSongChange = vi.fn();
  },
}));
vi.mock('./managers/EventManager', () => ({
  EventManager: { initialize: mocks.initializeEvents },
}));
vi.mock('./components/DynamicBG/ArtworkSurfaces', () => ({
  artworkSurfacesSingleton: {
    mount: mocks.mountSurfaces,
    destroy: mocks.destroySurfaces,
    cancelPending: vi.fn(),
    applyArtwork: vi.fn(),
    refreshLyricsPage: vi.fn(async () => undefined),
  },
}));
vi.mock('./components/Pages/PageView', () => ({ default: { Destroy: vi.fn() } }));
vi.mock('./components/Global/SpotifyPlayer', () => ({ SpotifyPlayer: { IsPlaying: false } }));
vi.mock('./utils/Addons', () => ({ IsPlaying: () => false }));
vi.mock('./utils/Whentil', () => ({ default: { When: mocks.when } }));
vi.mock('./utils/suppressBlankToasts', () => ({ installBlankToastSuppressor: vi.fn() }));
vi.mock('./utils/hoverTooltip', () => ({ installHoverTooltips: vi.fn() }));
vi.mock('./utils/fastdomAsync', () => ({ installFastdomErrorHandler: vi.fn() }));
vi.mock('./utils/Gets/GetProgress', () => ({ requestPositionSync: vi.fn() }));
vi.mock('./utils/Lyrics/fetchLyrics', () => ({
  loadAndApplyLyrics: vi.fn(async () => ({ status: 'NO_LYRICS' })),
}));
vi.mock('./utils/Lyrics/registry', () => ({
  startLoop: mocks.startLoop,
  stopLoop: mocks.stopLoop,
}));
vi.mock('./components/PlaybarLyrics/PlaybarLyrics', () => ({
  InitializePlaybarLyrics: mocks.initializePlaybar,
}));

import main from './app';
import lifecycle from './utils/lifecycle';

const windowRef = window as unknown as { __amaiLyricsTeardown?: () => void };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.initializeCore.mockResolvedValue(true);
  delete windowRef.__amaiLyricsTeardown;
  document.body.innerHTML = '';
});

afterEach(() => {
  lifecycle.disposeAll();
  document.body.innerHTML = '';
});

describe('application initialization lifetime', () => {
  it('does not mount UI after teardown invalidates core initialization', async () => {
    let finishCore: ((ready: boolean) => void) | undefined;
    mocks.initializeCore.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          finishCore = resolve;
        }),
    );

    const initializing = main();
    await vi.waitFor(() => expect(mocks.initializeCore).toHaveBeenCalledTimes(1));
    windowRef.__amaiLyricsTeardown?.();
    finishCore?.(true);
    await initializing;

    expect(mocks.buttonManagerCreated).not.toHaveBeenCalled();
    expect(mocks.mountSurfaces).not.toHaveBeenCalled();
  });

  it('does not start the render loop after teardown during initialization', async () => {
    mocks.pageManagerCreated.mockImplementationOnce(() => windowRef.__amaiLyricsTeardown?.());

    await main();

    expect(mocks.pageManagerCreated).toHaveBeenCalledTimes(1);
    expect(mocks.startLoop).not.toHaveBeenCalled();
    expect(mocks.initializePlaybar).not.toHaveBeenCalled();
  });
});
