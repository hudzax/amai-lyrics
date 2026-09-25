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
  resolveIsPlaying: () => true,
  getPositionFor: () => 0,
  syncPlaybackPosition: vi.fn(),
}));

import Defaults from '../src/components/Global/Defaults';
import {
  LyricsObject,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';
import type { PaintedDot, PaintedLine } from '../src/utils/Lyrics/lyrics';
import {
  TimeSetter,
  getActiveLineIndex,
  resetLyricsSetterCache,
} from '../src/utils/Lyrics/Animator/Lyrics/LyricsSetter';

function makeLine(startMs: number, endMs: number): PaintedLine {
  return {
    view: { text: '', start: startMs / 1000, end: endMs / 1000 },
    element: document.createElement('span'),
    StartTime: startMs,
    EndTime: endMs,
  };
}

function seedLines(): void {
  LyricsObject.Lines.push(makeLine(0, 2000), makeLine(3000, 5000), makeLine(6000, 8000));
}

beforeEach(() => {
  ClearLyricsContentArrays();
  resetLyricsSetterCache();
  (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'Line';
});

afterAll(() => {
  destroyLyricsRenderLoop();
});

describe('TimeSetter', () => {
  it('marks Sung/Active/NotSung around the current position', () => {
    seedLines();
    TimeSetter(4000);
    const lines = LyricsObject.Lines;
    expect(lines[0].status).toBe('Sung');
    expect(lines[1].status).toBe('Active');
    expect(lines[2].status).toBe('NotSung');
    expect(getActiveLineIndex()).toBe(1);
  });

  it('marks all NotSung before the first line and all Sung after the last', () => {
    seedLines();
    TimeSetter(-500);
    expect(LyricsObject.Lines.map((l) => l.status)).toEqual(['NotSung', 'NotSung', 'NotSung']);
    expect(getActiveLineIndex()).toBe(-1);

    TimeSetter(9000);
    expect(LyricsObject.Lines.map((l) => l.status)).toEqual(['Sung', 'Sung', 'Sung']);
  });

  it('updates statuses when seeking backwards', () => {
    seedLines();
    TimeSetter(7000);
    expect(getActiveLineIndex()).toBe(2);
    TimeSetter(1000);
    const lines = LyricsObject.Lines;
    expect(lines[0].status).toBe('Active');
    expect(lines[1].status).toBe('NotSung');
    expect(lines[2].status).toBe('NotSung');
    expect(getActiveLineIndex()).toBe(0);
  });

  it('does nothing when lyrics type is None', () => {
    seedLines();
    (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'None';
    TimeSetter(4000);
    expect(LyricsObject.Lines[0]).not.toHaveProperty('status');
    expect(getActiveLineIndex()).toBe(-1);
  });

  it('updates musical-break dot statuses for the active line', () => {
    const dots: PaintedDot[] = [
      { element: document.createElement('span'), StartTime: 0, EndTime: 2000 },
      { element: document.createElement('span'), StartTime: 2000, EndTime: 5000 },
    ];
    LyricsObject.Lines.push({
      view: { text: '', start: 0, end: 5 },
      element: document.createElement('span'),
      StartTime: 0,
      EndTime: 5000,
      dots,
    });
    TimeSetter(3000);
    const registeredDots = LyricsObject.Lines[0].dots;
    expect(registeredDots?.[0].status).toBe('Sung');
    expect(registeredDots?.[1].status).toBe('Active');
  });

  it('resetLyricsSetterCache clears the active index', () => {
    seedLines();
    TimeSetter(4000);
    expect(getActiveLineIndex()).toBe(1);
    resetLyricsSetterCache();
    expect(getActiveLineIndex()).toBe(-1);
  });
});
