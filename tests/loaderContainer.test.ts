import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ui.ts is mocked wholesale by every other suite, so the loader's delayed-show
// timer — the mechanism behind the stuck-overlay regressions — is exercised
// against the real DOM only here.
vi.mock('../src/components/Global/Defaults', () => ({
  default: { CurrentLyricsType: 'None' },
}));
vi.mock('../src/components/Utils/NowBar', () => ({
  OpenNowBar: vi.fn(),
  DeregisterNowBarBtn: vi.fn(),
}));
vi.mock('../src/components/Pages/PageView', () => ({
  default: { IsOpened: false, AppendViewControls: vi.fn() },
}));
vi.mock('../src/components/Utils/Fullscreen', () => ({
  default: { IsOpen: false },
}));
vi.mock('../src/components/Pages/pageButtons', () => ({
  showRefreshButton: vi.fn(),
}));
vi.mock('../src/utils/Lyrics/trackId', () => ({
  liveTrackId: vi.fn(() => 'trackA'),
}));

import {
  ShowLoaderContainer,
  HideLoaderContainer,
  clearLyricsUiTimeouts,
} from '../src/utils/Lyrics/ui';

const PAGE_HTML =
  '<div id="AmaiLyricsPage"><div class="LyricsContainer">' +
  '<div class="loaderContainer"></div></div></div>';

/** Mounts a fresh page generation, replacing any previous one. */
function mountPage(): HTMLElement {
  document.body.innerHTML = PAGE_HTML;
  return document.querySelector<HTMLElement>('#AmaiLyricsPage .loaderContainer')!;
}

const isActive = (loader: HTMLElement): boolean => loader.classList.contains('active');

beforeEach(() => {
  vi.useFakeTimers();
  clearLyricsUiTimeouts();
  document.body.innerHTML = '';
});

afterEach(() => {
  clearLyricsUiTimeouts();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('ShowLoaderContainer', () => {
  it('delays the overlay so a fast fetch never flashes it', () => {
    const loader = mountPage();

    ShowLoaderContainer();
    vi.advanceTimersByTime(999);
    expect(isActive(loader)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(isActive(loader)).toBe(true);
  });

  it('arms nothing while the page is not mounted yet', () => {
    ShowLoaderContainer();

    const loader = mountPage();
    vi.advanceTimersByTime(5000);
    expect(isActive(loader)).toBe(false);
  });

  it('replaces a pending delayed show instead of stacking a second one', () => {
    const loader = mountPage();

    ShowLoaderContainer();
    vi.advanceTimersByTime(600);
    ShowLoaderContainer();
    // The first timer would have fired at 1000ms; only the replacement is live.
    vi.advanceTimersByTime(600);
    expect(isActive(loader)).toBe(false);
    vi.advanceTimersByTime(400);
    expect(isActive(loader)).toBe(true);
  });

  it('does not arm a timer when the overlay is already visible', () => {
    const loader = mountPage();
    ShowLoaderContainer();
    vi.advanceTimersByTime(1000);
    expect(isActive(loader)).toBe(true);

    ShowLoaderContainer();
    HideLoaderContainer();
    expect(isActive(loader)).toBe(false);
    // Regression: an orphan armed by the second Show would re-activate the
    // overlay on top of lyrics that already landed.
    vi.advanceTimersByTime(5000);
    expect(isActive(loader)).toBe(false);
  });

  it('paints the current page when the node was replaced while pending', () => {
    mountPage();
    ShowLoaderContainer();

    const recreated = mountPage();
    vi.advanceTimersByTime(1000);
    expect(isActive(recreated)).toBe(true);
  });
});

describe('HideLoaderContainer', () => {
  it('cancels a pending delayed show', () => {
    const loader = mountPage();
    ShowLoaderContainer();
    vi.advanceTimersByTime(500);

    HideLoaderContainer();
    vi.advanceTimersByTime(5000);
    expect(isActive(loader)).toBe(false);
  });

  it('cancels a show armed before the page was recreated', () => {
    mountPage();
    ShowLoaderContainer();

    const recreated = mountPage();
    HideLoaderContainer();
    vi.advanceTimersByTime(5000);
    expect(isActive(recreated)).toBe(false);
  });

  it('cancels a pending show even when the page is unmounted at hide time', () => {
    mountPage();
    ShowLoaderContainer();
    document.body.innerHTML = '';

    HideLoaderContainer();

    // Regression: guarding the clear behind "is the page mounted" let the timer
    // survive an unmount and paint the overlay onto whatever page came next.
    const recreated = mountPage();
    vi.advanceTimersByTime(5000);
    expect(isActive(recreated)).toBe(false);
  });

  it('removes an already-visible overlay', () => {
    const loader = mountPage();
    ShowLoaderContainer();
    vi.advanceTimersByTime(1000);

    HideLoaderContainer();
    expect(isActive(loader)).toBe(false);
  });
});

describe('clearLyricsUiTimeouts', () => {
  it('drops a pending delayed show', () => {
    const loader = mountPage();
    ShowLoaderContainer();

    clearLyricsUiTimeouts();
    vi.advanceTimersByTime(5000);
    expect(isActive(loader)).toBe(false);
  });
});
