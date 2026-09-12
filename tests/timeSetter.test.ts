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

import Defaults from '../src/components/Global/Defaults';
import {
  LyricsObject,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';
import {
  TimeSetter,
  getActiveLineIndex,
  resetLyricsSetterCache,
} from '../src/utils/Lyrics/Animator/Lyrics/LyricsSetter';

function seedLines(): void {
  LyricsObject.Types.Line.Lines.push(
    { StartTime: 0, EndTime: 2000 } as never,
    { StartTime: 3000, EndTime: 5000 } as never,
    { StartTime: 6000, EndTime: 8000 } as never,
  );
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
    const lines = LyricsObject.Types.Line.Lines as { Status: string }[];
    expect(lines[0].Status).toBe('Sung');
    expect(lines[1].Status).toBe('Active');
    expect(lines[2].Status).toBe('NotSung');
    expect(getActiveLineIndex()).toBe(1);
  });

  it('marks all NotSung before the first line and all Sung after the last', () => {
    seedLines();
    TimeSetter(-500);
    expect(LyricsObject.Types.Line.Lines.map((l) => (l as { Status: string }).Status)).toEqual([
      'NotSung',
      'NotSung',
      'NotSung',
    ]);
    expect(getActiveLineIndex()).toBe(-1);

    TimeSetter(9000);
    expect(LyricsObject.Types.Line.Lines.map((l) => (l as { Status: string }).Status)).toEqual([
      'Sung',
      'Sung',
      'Sung',
    ]);
  });

  it('updates statuses when seeking backwards', () => {
    seedLines();
    TimeSetter(7000);
    expect(getActiveLineIndex()).toBe(2);
    TimeSetter(1000);
    const lines = LyricsObject.Types.Line.Lines as { Status: string }[];
    expect(lines[0].Status).toBe('Active');
    expect(lines[1].Status).toBe('NotSung');
    expect(lines[2].Status).toBe('NotSung');
    expect(getActiveLineIndex()).toBe(0);
  });

  it('does nothing when lyrics type is None', () => {
    seedLines();
    (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'None';
    TimeSetter(4000);
    expect(LyricsObject.Types.Line.Lines[0]).not.toHaveProperty('Status');
    expect(getActiveLineIndex()).toBe(-1);
  });

  it('updates dot-line syllable statuses for the active line', () => {
    LyricsObject.Types.Line.Lines.push({
      StartTime: 0,
      EndTime: 5000,
      DotLine: true,
      Syllables: {
        Lead: [
          { StartTime: 0, EndTime: 2000 },
          { StartTime: 2000, EndTime: 5000 },
        ],
      },
    } as never);
    TimeSetter(3000);
    const lead = (
      LyricsObject.Types.Line.Lines[0] as unknown as {
        Syllables: { Lead: { Status: string }[] };
      }
    ).Syllables.Lead;
    expect(lead[0].Status).toBe('Sung');
    expect(lead[1].Status).toBe('Active');
  });

  it('resetLyricsSetterCache clears the active index', () => {
    seedLines();
    TimeSetter(4000);
    expect(getActiveLineIndex()).toBe(1);
    resetLyricsSetterCache();
    expect(getActiveLineIndex()).toBe(-1);
  });
});
