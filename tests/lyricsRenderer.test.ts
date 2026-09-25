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
  getPaintedLines,
} from '../src/utils/Lyrics/LyricsRenderer';
import { ApplyStaticLyrics } from '../src/utils/Lyrics/Applyer/Static';
import {
  LyricsObject,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';
import type { LyricsDocument } from '../src/utils/Lyrics/conversion';

/** A fresh line-synced document per test — the render path mutates line views. */
function lineDocument(): LyricsDocument {
  return {
    type: 'Line',
    lines: [
      { text: 'first line', raw: 'first line', start: 1.0, end: 3.0 },
      { text: 'second line', raw: 'second line', start: 3.5, end: 6.0 },
    ],
  };
}

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
  it('renders Line documents with uniform timed records', () => {
    renderLyrics(lineDocument());

    const records = getPaintedLines();
    expect(records).toHaveLength(2);
    expect(records[0].StartTime).toBe(1000);
    expect(records[0].EndTime).toBe(3000);
    expect(records[0].element.classList.contains('line')).toBe(true);
    expect(LyricsObject.Lines).toHaveLength(2);
    expect(document.querySelectorAll('.main-lyrics-text.line')).toHaveLength(2);
    // The container is stamped from the document's declared type.
    expect(document.querySelector<HTMLElement>('.LyricsContent')?.dataset.lyricsType).toBe('Line');
  });

  it('renders Static documents with untimed records through the same call', () => {
    renderLyrics({ type: 'Static', lines: [{ text: 'static one' }] });

    const records = getPaintedLines();
    expect(records).toHaveLength(1);
    expect(records[0].StartTime).toBeUndefined();
    // The registered row is the `.main-lyrics-text` span for both payload
    // kinds; the `.static` marker lives on the wrapper div it was built into.
    expect(records[0].element.classList.contains('main-lyrics-text')).toBe(true);
    expect(records[0].element.parentElement?.classList.contains('static')).toBe(true);
    expect(LyricsObject.Lines).toHaveLength(1);
  });

  it('updates translations in place without replacing elements', () => {
    const doc = lineDocument();
    renderLyrics(doc);
    const before = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');

    // Enhancement mutates the registered line views in place; the updater
    // reads them back from the registry instead of being handed a payload.
    doc.lines[0].translation = 'translated first';
    updateLyricTranslations();

    const after = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    expect(after[0].querySelector('.translation')?.textContent).toBe('translated first');
    expect(after[1].querySelector('.translation')).toBeNull();
  });

  it('keeps the Static adapter rendering through the seam', () => {
    ApplyStaticLyrics({ type: 'Static', lines: [{ text: 'adapter line' }] });

    expect(LyricsObject.Lines).toHaveLength(1);
    expect(getPaintedLines()).toHaveLength(1);
  });
});
