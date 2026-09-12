import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));
vi.mock('../src/components/Global/Defaults', () => ({
  default: {
    CurrentLyricsType: 'Line',
    LyricsContainerExists: true,
    translationFontSize: '0.575',
    Version: '1.0.0',
    lyrics: { api: { url: '', translationUrl: '', phoneticUrl: '' } },
    systemInstruction: '',
    translationPrompt: '',
  },
}));
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
  reanchorPosition: vi.fn(),
  resolveIsPlaying: () => true,
  getPositionFor: () => 0,
  syncPlaybackPosition: vi.fn(),
  _DEPRECATED___GetProgress: vi.fn(() => 0),
}));

import {
  createMusicalLine,
  createMusicalLineMs,
} from '../src/utils/Lyrics/Applyer/Utils/createMusicalLine';
import {
  LyricsObject,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';

beforeEach(() => {
  ClearLyricsContentArrays();
});

afterAll(() => {
  destroyLyricsRenderLoop();
});

describe('createMusicalLineMs', () => {
  it('registers a dot line with three note dots', () => {
    const el = createMusicalLineMs(1000, 4000);

    expect(el.classList.contains('line')).toBe(true);
    expect(el.classList.contains('musical-line')).toBe(true);
    const dots = el.querySelectorAll('.word.dot');
    expect(dots).toHaveLength(3);
    expect(dots[0].textContent).toBe('♪');
    expect(dots[1].textContent).toBe('♫');
    expect(dots[2].textContent).toBe('♩');

    const lines = LyricsObject.Types.Line.Lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].StartTime).toBe(1000);
    expect(lines[0].EndTime).toBe(4000);
    expect(lines[0].DotLine).toBe(true);
    expect(lines[0].Syllables.Lead).toHaveLength(3);
  });

  it('adds OppositeAligned when requested', () => {
    const el = createMusicalLineMs(0, 1000, true);
    expect(el.classList.contains('OppositeAligned')).toBe(true);
  });

  it('omits OppositeAligned by default', () => {
    const el = createMusicalLineMs(0, 1000);
    expect(el.classList.contains('OppositeAligned')).toBe(false);
  });
});

describe('createMusicalLine', () => {
  it('converts seconds to milliseconds', () => {
    const el = createMusicalLine({ startTimeSec: 1, endTimeSec: 4 });
    expect(el.classList.contains('musical-line')).toBe(true);
    const lines = LyricsObject.Types.Line.Lines;
    expect(lines[0].StartTime).toBe(1000);
    expect(lines[0].EndTime).toBe(4000);
  });

  it('forwards the oppositeAligned flag', () => {
    const el = createMusicalLine({ startTimeSec: 0, endTimeSec: 2, oppositeAligned: true });
    expect(el.classList.contains('OppositeAligned')).toBe(true);
  });
});
