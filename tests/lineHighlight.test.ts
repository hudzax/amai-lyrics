import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/utils/Lyrics/ui', () => ({
  HideLoaderContainer: vi.fn(),
  ClearLyricsPageContainer: vi.fn(),
  ShowProcessingIndicator: vi.fn(),
  EnsureProcessingIndicatorHidden: vi.fn(),
}));
vi.mock('../src/utils/Lyrics/cache', () => ({
  cacheLyrics: vi.fn(),
  lyricsCache: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), destroy: vi.fn() },
}));
vi.mock('../src/utils/EventManager', () => ({
  default: { listen: vi.fn(), unListen: vi.fn(), evoke: vi.fn() },
}));
vi.mock('../src/utils/Scrolling/Simplebar/ScrollSimplebar', () => ({
  ScrollSimplebar: null,
  MountScrollSimplebar: vi.fn(),
  ClearScrollSimplebar: vi.fn(),
  RecalculateScrollSimplebar: vi.fn(),
}));
vi.mock('../src/components/Global/SpotifyPlayer', () => ({
  SpotifyPlayer: {
    IsPlaying: true,
    GetTrackPosition: vi.fn(() => 0),
    GetSongId: vi.fn(() => 'track1'),
    Seek: vi.fn(),
  },
}));
vi.mock('../src/utils/Gets/GetProgress', () => ({
  default: vi.fn(() => 0),
  requestPositionTracking: vi.fn(() => () => {}),
  requestPositionSync: vi.fn(),
  resolveIsPlaying: vi.fn(() => true),
  getPositionFor: vi.fn(() => 0),
  syncPlaybackPosition: vi.fn(),
}));

import { getPositionFor } from '../src/utils/Gets/GetProgress';
import { clear, registerRow, startLoop, stopLoop } from '../src/utils/Lyrics/registry';
import type { PaintedDot, PaintedLine } from '../src/utils/Lyrics/registry';
import { getActiveLine, sync } from '../src/utils/Lyrics/LineHighlight';
import { setPageOpen } from '../src/utils/PagePresence';

const playing = { isPlaying: true };
const paused = { isPlaying: false };

/** A row whose element is in the page, so the active-row read can find it. */
function mountRow(startMs: number, endMs: number): PaintedLine {
  const element = document.createElement('span');
  element.className = 'line';
  document.body.appendChild(element);
  const row: PaintedLine = {
    view: { text: '', start: startMs / 1000, end: endMs / 1000 },
    element,
    StartTime: startMs,
    EndTime: endMs,
  };
  registerRow(row);
  return row;
}

function seedThreeRows(): PaintedLine[] {
  return [mountRow(0, 2000), mountRow(3000, 5000), mountRow(6000, 8000)];
}

const classesOf = (row: PaintedLine): string[] =>
  ['Active', 'Sung', 'NotSung'].filter((c) => row.element.classList.contains(c));

const blurOf = (row: PaintedLine): string | null =>
  row.element.style.getPropertyValue('--BlurAmount') || null;

const gradientOf = (row: PaintedLine): string | null =>
  row.element.style.getPropertyValue('--gradient-position') || null;

interface HistoryStub {
  Spicetify: { Platform: { History: { location: { pathname: string } } } };
}

const routePathname = (): { pathname: string } =>
  (globalThis as unknown as HistoryStub).Spicetify.Platform.History.location;

beforeEach(() => {
  clear();
  document.body.innerHTML = '';
  setPageOpen(true);
  routePathname().pathname = '/';
});

afterEach(() => {
  stopLoop();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('LineHighlight.sync', () => {
  it('paints the sung, active and unsung rows around the position', () => {
    const rows = seedThreeRows();

    sync(4000, playing);

    expect(classesOf(rows[0])).toEqual(['Sung']);
    expect(classesOf(rows[1])).toEqual(['Active']);
    expect(classesOf(rows[2])).toEqual(['NotSung']);
    expect(gradientOf(rows[0])).toBe('100%');
    expect(gradientOf(rows[1])).toBe('100%');
    expect(gradientOf(rows[2])).toBe('0%');
    expect(getActiveLine()).toBe(rows[1]);
  });

  it('leaves every row unsung before the first and sung after the last', () => {
    const rows = seedThreeRows();

    sync(-500, playing);
    expect(rows.map(classesOf)).toEqual([['NotSung'], ['NotSung'], ['NotSung']]);
    expect(getActiveLine()).toBeUndefined();

    sync(9000, playing);
    expect(rows.map(classesOf)).toEqual([['Sung'], ['Sung'], ['Sung']]);
    expect(getActiveLine()).toBeUndefined();
  });

  it('repaints the rows a backward seek leaves behind', () => {
    const rows = seedThreeRows();

    sync(7000, playing);
    expect(getActiveLine()).toBe(rows[2]);

    sync(1000, playing);
    expect(rows.map(classesOf)).toEqual([['Active'], ['NotSung'], ['NotSung']]);
    expect(getActiveLine()).toBe(rows[0]);
  });

  it('stops reporting an active row once its element leaves the page', () => {
    const rows = seedThreeRows();
    sync(4000, playing);
    expect(getActiveLine()).toBe(rows[1]);

    rows[1].element.remove();
    expect(getActiveLine()).toBeUndefined();
  });

  it('blurs the window around the active row while playing', () => {
    const rows = seedThreeRows();

    sync(4000, playing);

    expect(blurOf(rows[0])).toBe('1px');
    expect(blurOf(rows[1])).toBe('0px');
    expect(blurOf(rows[2])).toBe('1px');
  });

  it('unblurs the whole list on a pause and re-blurs it on resume', () => {
    const rows = seedThreeRows();
    sync(4000, playing);

    // Pausing must reach the far rows too, not just the window around the active.
    sync(4000, paused);
    expect(rows.map(blurOf)).toEqual(['0px', '0px', '0px']);

    sync(4000, playing);
    expect(rows.map(blurOf)).toEqual(['1px', '0px', '1px']);
  });

  it('clamps the blur of far rows', () => {
    const rows: PaintedLine[] = [];
    for (let i = 0; i < 12; i++) rows.push(mountRow(i * 1000, i * 1000 + 900));

    sync(500, playing);

    expect(getActiveLine()).toBe(rows[0]);
    expect(blurOf(rows[5])).toBe('5px');
    expect(blurOf(rows[11])).toBe('5px');
  });

  it('paints nothing for a document whose rows carry no timing', () => {
    const element = document.createElement('span');
    element.className = 'line';
    document.body.appendChild(element);
    registerRow({ view: { text: 'static' }, element });

    sync(4000, playing);

    expect(element.classList.contains('Active')).toBe(false);
    expect(element.classList.contains('NotSung')).toBe(false);
    expect(getActiveLine()).toBeUndefined();
  });

  it('activates the dot the position has reached inside an instrumental break', () => {
    const dots: PaintedDot[] = [
      { element: document.createElement('span'), StartTime: 0, EndTime: 2000 },
      { element: document.createElement('span'), StartTime: 2000, EndTime: 5000 },
    ];
    dots.forEach((dot) => document.body.appendChild(dot.element));
    const element = document.createElement('span');
    document.body.appendChild(element);
    registerRow({
      view: { text: '', start: 0, end: 5 },
      element,
      StartTime: 0,
      EndTime: 5000,
      dots,
    });

    sync(3000, playing);

    expect(dots[0].element.classList.contains('dot-active')).toBe(false);
    expect(dots[1].element.classList.contains('dot-active')).toBe(true);
  });

  it('paints a fresh song from its first tick', () => {
    const first = seedThreeRows();
    sync(4000, playing);
    expect(getActiveLine()).toBe(first[1]);

    // A new render resets the registry, which resets the highlight: the same
    // active index must not be mistaken for "already painted".
    first.forEach((row) => row.element.remove());
    clear();
    const second = seedThreeRows();

    sync(4000, playing);

    expect(second.map(classesOf)).toEqual([['Sung'], ['Active'], ['NotSung']]);
    expect(second.map(blurOf)).toEqual(['1px', '0px', '1px']);
    expect(getActiveLine()).toBe(second[1]);
  });
});

describe('the registry tick', () => {
  function onLyricsRoute(atPosition: number): void {
    // The tick is gated on the route answer and the mounted page, and reads the
    // position through the PlaybackTime seam.
    routePathname().pathname = '/AmaiLyrics';
    vi.mocked(getPositionFor).mockReturnValue(atPosition);
  }

  it('hands the settled position and play state to the highlight', () => {
    const rows = seedThreeRows();
    onLyricsRoute(4000);
    vi.useFakeTimers();

    startLoop();
    // The highlight surface ticks every 50 ms.
    vi.advanceTimersByTime(50);

    expect(rows.map(classesOf)).toEqual([['Sung'], ['Active'], ['NotSung']]);
    expect(rows.map(blurOf)).toEqual(['1px', '0px', '1px']);
    expect(getActiveLine()).toBe(rows[1]);

    stopLoop();
  });

  it('does not paint while the page is closed', () => {
    const rows = seedThreeRows();
    onLyricsRoute(4000);
    setPageOpen(false);
    vi.useFakeTimers();

    startLoop();
    vi.advanceTimersByTime(50);

    expect(rows.map(classesOf)).toEqual([[], [], []]);
    expect(getActiveLine()).toBeUndefined();

    stopLoop();
  });
});
