import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Same mock set as translation-sync.test.ts: the render path pulls storage,
// Defaults, the scroll container, the player, and the PlaybackTime seam.
vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));

vi.mock('../src/components/Global/Defaults', () => ({
  default: {
    CurrentLyricsType: 'Line',
    LyricsContainerExists: true,
    translationFontSize: '0.575',
    translationLanguage: 'English',
    Version: '1.0.0',
    lyrics: { api: { url: '', translationUrl: '', phoneticUrl: '' } },
    systemInstruction: '',
    translationPrompt: '',
    romajiPrompt: '',
    furiganaPrompt: '',
    romajaPrompt: '',
  },
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

import {
  renderLyrics,
  updateLyricTranslations,
  getLineRecords,
} from '../src/utils/Lyrics/LyricsRenderer';
import { ApplyStaticLyrics } from '../src/utils/Lyrics/Applyer/Static';
import {
  LyricsObject,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';

const CONTENT = [
  { Text: 'first line', StartTime: 1.0, EndTime: 3.0 },
  { Text: 'second line', StartTime: 3.5, EndTime: 6.0 },
];
const RAWS = ['first line', 'second line'];

function setupDom(): void {
  document.body.innerHTML = `
    <div id="AmaiLyricsPage">
      <div class="LyricsContainer">
        <div class="LyricsContent">
          <div class="simplebar-content-wrapper"></div>
        </div>
      </div>
    </div>`;
}

beforeEach(() => {
  setupDom();
  ClearLyricsContentArrays();
});

afterAll(() => {
  destroyLyricsRenderLoop();
});

describe('LyricsRenderer seam', () => {
  it('renders Line payloads with uniform timed records', () => {
    renderLyrics({ Type: 'Line', Content: CONTENT, StartTime: 0.5, Raw: RAWS } as never);

    const records = getLineRecords();
    expect(records).toHaveLength(2);
    expect(records[0].start).toBe(1000);
    expect(records[0].end).toBe(3000);
    expect(records[0].element.classList.contains('line')).toBe(true);
    expect(LyricsObject.Types.Line.Lines).toHaveLength(2);
    expect(document.querySelectorAll('.main-lyrics-text.line')).toHaveLength(2);
  });

  it('renders Static payloads with untimed records through the same call', () => {
    renderLyrics({ Type: 'Static', Lines: [{ Text: 'static one' }] } as never);

    const records = getLineRecords();
    expect(records).toHaveLength(1);
    expect(records[0].start).toBeUndefined();
    expect(records[0].element.classList.contains('static')).toBe(true);
    expect(LyricsObject.Types.Static.Lines).toHaveLength(1);
  });

  it('infers Line for legacy payloads without a Type discriminator', () => {
    renderLyrics({ Content: CONTENT, StartTime: 0.5, Raw: RAWS } as never);

    expect(LyricsObject.Types.Line.Lines).toHaveLength(2);
    expect(document.querySelector<HTMLElement>('.LyricsContent')?.dataset.lyricsType).toBe('Line');
  });

  it('updates translations in place without replacing elements', () => {
    renderLyrics({ Type: 'Line', Content: CONTENT, StartTime: 0.5, Raw: RAWS } as never);
    const before = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');

    updateLyricTranslations({
      Type: 'Line',
      Content: [{ ...CONTENT[0], Translation: 'translated first' }, { ...CONTENT[1] }],
      Raw: RAWS,
    } as never);

    const after = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    expect(after[0].querySelector('.translation')?.textContent).toBe('translated first');
  });

  it('keeps the Static adapter rendering through the seam', () => {
    ApplyStaticLyrics({ Type: 'Static', Lines: [{ Text: 'adapter line' }] } as never);

    expect(LyricsObject.Types.Static.Lines).toHaveLength(1);
    expect(getLineRecords()).toHaveLength(1);
  });
});
