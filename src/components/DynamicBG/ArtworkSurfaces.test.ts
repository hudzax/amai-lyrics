import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const publishArtworkAccents = vi.hoisted(() => vi.fn());
// The real mode module drags the page/settings graph (and its React dep) in;
// these two are all it needs from it here.
vi.mock('../Pages/PageView', () => ({
  default: { AppendViewControls: vi.fn() },
  PageRoot: null,
}));
vi.mock('../NowBar/NowBar', () => ({
  OpenNowBar: vi.fn(),
  UpdateNowBar: vi.fn(),
  DeregisterNowBarBtn: vi.fn(),
}));
vi.mock('../../utils/Scrolling/AutoScroll', () => ({ AutoScroll: { reset: vi.fn() } }));
vi.mock('../../utils/ArtworkColors', () => ({ publishArtworkAccents }));

import Fullscreen from '../Utils/Fullscreen';
import storage from '../../utils/storage';
import { StorageKeys } from '../../utils/storageKeys';
import lifecycle from '../../utils/lifecycle';
import { APP_BG_LIB_GRID_CLASS, APP_BG_ON_CLASS } from './identity';
import { ArtworkSurfaces } from './ArtworkSurfaces';

interface SurfaceCalls {
  sidebar: (string | undefined)[];
  appFrame: (string | undefined)[];
  appFrameRemoved: number;
  page: number;
  accents: (string | undefined)[];
  destroyed: number;
}

function setupFakes(firstUrl: string | undefined = 'live-cover') {
  const calls: SurfaceCalls = {
    sidebar: [],
    appFrame: [],
    appFrameRemoved: 0,
    page: 0,
    accents: [],
    destroyed: 0,
  };
  let currentUrl: string | undefined = firstUrl;
  const adapters = {
    applySidebar: vi.fn((coverUrl: string | undefined) => {
      calls.sidebar.push(coverUrl);
    }),
    applyAppFrame: vi.fn((coverUrl: string | undefined) => {
      calls.appFrame.push(coverUrl);
    }),
    removeAppFrame: vi.fn(() => {
      calls.appFrameRemoved += 1;
    }),
    applyLyricsPage: vi.fn(async () => {
      calls.page += 1;
    }),
    publishAccents: vi.fn((coverUrl: string | undefined) => {
      calls.accents.push(coverUrl);
    }),
    readCoverUrl: () => currentUrl,
    isAppFrameApplied: () => true,
    destroy: vi.fn(() => {
      calls.destroyed += 1;
    }),
  };
  const setCoverUrl = (url: string | undefined) => {
    currentUrl = url;
  };
  return { calls, adapters, setCoverUrl };
}

let surfaces: ArtworkSurfaces | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  publishArtworkAccents.mockClear();
  storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'false');
  document.documentElement.classList.remove(APP_BG_ON_CLASS);
  document.body.innerHTML =
    '<div id="Desktop_LeftSidebar_Id"><div data-encore-id="card"></div></div><div><div id="AmaiLyricsPage"></div></div>';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  surfaces?.destroy();
  surfaces = null;
  document.body.innerHTML = '';
  document.documentElement.classList.remove(APP_BG_ON_CLASS, APP_BG_LIB_GRID_CLASS);
  storage.set(StorageKeys.ENABLE_APP_BACKGROUND, null);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ArtworkSurfaces seam', () => {
  it('owns the enable transition without painting hidden nested surfaces', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);

    surfaces.setThemeEnabled(true);

    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(true);
    expect(document.getElementById('Desktop_LeftSidebar_Id')?.classList).toContain(
      APP_BG_LIB_GRID_CLASS,
    );
    expect(calls.appFrame).toEqual(['live-cover']);
    expect(calls.sidebar).toEqual([]);
    expect(calls.page).toBe(0);
  });

  it('owns the disable transition and restores nested surfaces', async () => {
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.setThemeEnabled(true);

    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'false');
    await surfaces.setThemeEnabled(false);

    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(false);
    expect(calls.appFrameRemoved).toBe(1);
    expect(calls.sidebar).toEqual(['live-cover']);
    expect(calls.page).toBe(1);
  });

  it('gates direct page-open paints through the same mode policy', async () => {
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);

    await surfaces.refreshLyricsPage();
    expect(calls.page).toBe(0);

    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'false');
    await surfaces.refreshLyricsPage();
    expect(calls.page).toBe(1);
  });

  it('drops a page paint when the theme is enabled before its commit', async () => {
    const { calls, adapters: baseAdapters } = setupFakes();
    let finishPaint: (() => void) | undefined;
    const adapters = {
      ...baseAdapters,
      applyLyricsPage: vi.fn(async (shouldPaint?: () => boolean) => {
        await new Promise<void>((resolve) => {
          finishPaint = resolve;
        });
        if (shouldPaint?.() !== false) calls.page += 1;
      }),
    };
    surfaces = new ArtworkSurfaces(adapters);

    const painting = surfaces.refreshLyricsPage();
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    finishPaint?.();
    await painting;

    expect(calls.page).toBe(0);
  });

  it('drops a page paint that settles after the coordinator is destroyed', async () => {
    const { calls, adapters: baseAdapters } = setupFakes();
    let finishPaint: (() => void) | undefined;
    const adapters = {
      ...baseAdapters,
      applyLyricsPage: vi.fn(async (shouldPaint?: () => boolean) => {
        await new Promise<void>((resolve) => {
          finishPaint = resolve;
        });
        if (shouldPaint?.() !== false) calls.page += 1;
      }),
    };
    surfaces = new ArtworkSurfaces(adapters);

    const painting = surfaces.refreshLyricsPage();
    await vi.waitFor(() => expect(adapters.applyLyricsPage).toHaveBeenCalledTimes(1));
    surfaces.destroy();
    surfaces = null;
    finishPaint?.();
    await painting;

    expect(calls.page).toBe(0);
  });

  it('does not publish accents after destroy while the lazy import settles', async () => {
    surfaces = new ArtworkSurfaces();
    surfaces.mount();
    surfaces.destroy();
    surfaces = null;
    await import('../../utils/ArtworkColors');
    await Promise.resolve();

    expect(publishArtworkAccents).not.toHaveBeenCalled();
  });

  it('delegates renderer teardown through the adapter seam', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);

    surfaces.destroy();
    surfaces = null;

    expect(calls.destroyed).toBe(1);
  });

  it('re-applies the page backdrop on fullscreen entry after a skipped paint', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();
    expect(calls.page).toBe(0);
    Fullscreen.enter();
    // The page backdrop skipped its paint while non-fullscreen; fullscreen
    // entry is the transition that un-hides it, so it must re-apply.
    expect(calls.page).toBe(1);
    surfaces.destroy();
    surfaces = null;
    // Destroy must release the subscription: a later transition reaches nothing.
    Fullscreen.leave();
    expect(calls.page).toBe(1);
  });

  it('pulls the app canvas with the page on fullscreen open and back on exit', async () => {
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();
    const atMount = calls.appFrame.length;

    // Fullscreen transfers the page out of `.Root` into the UA top layer;
    // re-applying the app frame re-homes the canvas inside it
    // (resolveAppBgHost follows the page).
    Fullscreen.enter();
    expect(calls.appFrame.length).toBe(atMount + 1);
    expect(calls.appFrame[calls.appFrame.length - 1]).toBe('live-cover');

    // ...and pulls it back out when the page returns.
    Fullscreen.leave();
    await Promise.resolve();
    expect(calls.appFrame.length).toBe(atMount + 2);

    surfaces.destroy();
    surfaces = null;
    document.body.innerHTML = '<div><div id="AmaiLyricsPage"></div></div>';
    Fullscreen.enter();
    expect(calls.appFrame.length).toBe(atMount + 2);
  });

  it('fans out once to visible surfaces for the settled track', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.applyArtwork('track-a');
    surfaces.applyArtwork('track-b');
    surfaces.applyArtwork('track-c');
    expect(calls.sidebar).toEqual([]);
    vi.advanceTimersByTime(500);
    expect(calls.sidebar).toEqual(['track-c']);
    expect(calls.appFrame).toEqual([]);
    expect(calls.page).toBe(1);
    expect(calls.accents).toEqual(['track-c']);
  });

  it('fans out only to the app frame and accents while its mode is active', () => {
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.applyArtwork('track-a');
    vi.advanceTimersByTime(500);
    expect(calls.appFrame).toEqual(['track-a']);
    expect(calls.sidebar).toEqual([]);
    expect(calls.page).toBe(0);
    expect(calls.accents).toEqual(['track-a']);
  });
  it('drops settled work once cancelled', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.applyArtwork('track-a');
    surfaces.cancelPending();
    vi.advanceTimersByTime(1000);
    expect(calls.sidebar).toEqual([]);
    expect(calls.appFrame).toEqual([]);
    expect(calls.page).toBe(0);
    expect(calls.accents).toEqual([]);
  });

  it('mount paints only visible static surfaces and seeds accents', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();
    expect(calls.sidebar).toEqual(['live-cover']);
    expect(calls.appFrame).toEqual([]);
    expect(calls.accents).toEqual(['live-cover']);
    expect(calls.page).toBe(0);
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(false);
  });

  it('mount applies the app frame without painting hidden nested surfaces', () => {
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();
    expect(calls.appFrame).toEqual(['live-cover']);
    expect(calls.sidebar).toEqual([]);
    expect(calls.accents).toEqual(['live-cover']);
    expect(calls.page).toBe(0);
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(true);
  });

  it('does not paint a sidebar remount while app-frame mode is active', async () => {
    storage.set(StorageKeys.ENABLE_APP_BACKGROUND, 'true');
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();

    const panel = document.createElement('aside');
    panel.className = 'NowPlayingView';
    document.body.appendChild(panel);
    await Promise.resolve();
    panel.appendChild(document.createElement('div'));
    await vi.advanceTimersByTimeAsync(0);

    expect(calls.sidebar).toEqual([]);
  });

  it('paints once artwork resolves after launch', async () => {
    const { calls, adapters, setCoverUrl } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    setCoverUrl(undefined);
    surfaces.mount();
    expect(calls.sidebar).toEqual([undefined]);
    expect(calls.appFrame).toEqual([]);
    expect(calls.accents).toEqual([undefined]);
    setCoverUrl('late-cover');
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls.sidebar).toEqual([undefined, 'late-cover']);
    expect(calls.appFrame).toEqual([]);
    expect(calls.accents).toEqual([undefined, 'late-cover']);
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls.sidebar).toEqual([undefined, 'late-cover']);
  });

  it('drops the launch waiter once a song paints first', async () => {
    const { calls, adapters, setCoverUrl } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    setCoverUrl(undefined);
    surfaces.mount();
    surfaces.applyArtwork('track-a');
    await vi.advanceTimersByTimeAsync(500);
    expect(calls.sidebar).toEqual([undefined, 'track-a']);
    setCoverUrl('late-cover');
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls.sidebar).toEqual([undefined, 'track-a']);
    expect(calls.accents).toEqual([undefined, 'track-a']);
  });

  it('does not paint a stale blank over the launch paint', async () => {
    const { calls, adapters, setCoverUrl } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    setCoverUrl(undefined);
    surfaces.mount();
    // Song changes while the player still has no artwork: snapshots undefined.
    surfaces.applyArtwork();
    setCoverUrl('live-cover');
    await vi.advanceTimersByTimeAsync(1000);
    // Initial blank, then the launch paint, then the settled fan-out which
    // must re-read live instead of replaying the snapshotted undefined.
    expect(calls.sidebar[0]).toBeUndefined();
    expect(calls.sidebar).toContain('live-cover');
    expect(calls.sidebar[calls.sidebar.length - 1]).toBe('live-cover');
  });

  it('keeps the launch waiter when the settled paint still has no artwork', async () => {
    const { calls, adapters, setCoverUrl } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    setCoverUrl(undefined);
    surfaces.mount();
    surfaces.applyArtwork();
    await vi.advanceTimersByTimeAsync(500);
    // Settled with no artwork: the waiter must survive so the late URL paints.
    setCoverUrl('late-cover');
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls.sidebar[calls.sidebar.length - 1]).toBe('late-cover');
    expect(calls.accents[calls.accents.length - 1]).toBe('late-cover');
  });

  it('registers one grid-observer disposer across repeated mode changes', () => {
    const trackCallback = vi.spyOn(lifecycle, 'trackCallback');
    const trackObserver = vi.spyOn(lifecycle, 'trackObserver');
    const { adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);

    surfaces.setThemeEnabled(true);
    surfaces.setThemeEnabled(false);
    surfaces.setThemeEnabled(true);

    expect(trackObserver).not.toHaveBeenCalled();
    expect(trackCallback).toHaveBeenCalledTimes(1);
  });

  it('does not accumulate grid observers across repeated mode changes', async () => {
    const { adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.setThemeEnabled(true);
    await surfaces.setThemeEnabled(false);
    surfaces.setThemeEnabled(true);
    await surfaces.setThemeEnabled(false);

    const nav = document.getElementById('Desktop_LeftSidebar_Id')!;
    nav.appendChild(document.createElement('div'));
    await vi.advanceTimersByTimeAsync(0);

    expect(nav.classList.contains(APP_BG_LIB_GRID_CLASS)).toBe(false);
  });
});
