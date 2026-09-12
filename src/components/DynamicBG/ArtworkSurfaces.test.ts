import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  APP_BG_CHANGED_EVENT,
  ArtworkSurfaces,
  type ArtworkSurfaceAdapters,
} from './ArtworkSurfaces';

interface SurfaceCalls {
  sidebar: (string | undefined)[];
  appFrame: (string | undefined)[];
  page: number;
  accents: (string | undefined)[];
}

function setupFakes(firstUrl: string | undefined = 'live-cover') {
  const calls: SurfaceCalls = { sidebar: [], appFrame: [], page: 0, accents: [] };
  let currentUrl = firstUrl;
  const adapters: ArtworkSurfaceAdapters = {
    applySidebar: vi.fn((coverUrl: string | undefined) => {
      calls.sidebar.push(coverUrl);
    }),
    applyAppFrame: vi.fn((coverUrl: string | undefined) => {
      calls.appFrame.push(coverUrl);
    }),
    applyLyricsPage: vi.fn(() => {
      calls.page += 1;
    }),
    publishAccents: vi.fn((coverUrl: string | undefined) => {
      calls.accents.push(coverUrl);
    }),
    readCoverUrl: () => currentUrl,
    isAppFrameApplied: () => true,
  };
  const setCoverUrl = (url: string | undefined) => {
    currentUrl = url;
  };
  return { calls, adapters, setCoverUrl };
}

let surfaces: ArtworkSurfaces | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
});

afterEach(() => {
  surfaces?.destroy();
  surfaces = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ArtworkSurfaces seam', () => {
  it('shares the toggle event name with the settings dispatcher', () => {
    expect(APP_BG_CHANGED_EVENT).toBe('amai:appbg-changed');
  });

  it('fans out once to every surface for the settled track', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.applyArtwork('track-a');
    surfaces.applyArtwork('track-b');
    surfaces.applyArtwork('track-c');
    expect(calls.sidebar).toEqual([]);
    vi.advanceTimersByTime(500);
    expect(calls.sidebar).toEqual(['track-c']);
    expect(calls.appFrame).toEqual(['track-c']);
    expect(calls.page).toBe(1);
    expect(calls.accents).toEqual(['track-c']);
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

  it('mount paints the static surfaces and seeds accents at once', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();
    expect(calls.sidebar).toEqual(['live-cover']);
    expect(calls.appFrame).toEqual(['live-cover']);
    expect(calls.accents).toEqual(['live-cover']);
    expect(calls.page).toBe(0);
  });

  it('paints once artwork resolves after launch', async () => {
    const { calls, adapters, setCoverUrl } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    setCoverUrl(undefined);
    surfaces.mount();
    expect(calls.sidebar).toEqual([undefined]);
    expect(calls.appFrame).toEqual([undefined]);
    expect(calls.accents).toEqual([undefined]);
    setCoverUrl('late-cover');
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls.sidebar).toEqual([undefined, 'late-cover']);
    expect(calls.appFrame).toEqual([undefined, 'late-cover']);
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

  it('repaints hidden canvases when the toggle flips off', () => {
    const { calls, adapters } = setupFakes();
    surfaces = new ArtworkSurfaces(adapters);
    surfaces.mount();
    const painted = { sidebar: calls.sidebar.length, page: calls.page };
    window.dispatchEvent(new Event(APP_BG_CHANGED_EVENT));
    // Toggle defaults off in tests, so the handler repaints sidebar + page.
    expect(calls.sidebar.length).toBe(painted.sidebar + 1);
    expect(calls.sidebar[calls.sidebar.length - 1]).toBe('live-cover');
    expect(calls.page).toBe(painted.page + 1);
  });
});
