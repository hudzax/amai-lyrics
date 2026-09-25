import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Mock heavy dependencies that pull Spicetify / network at import time

vi.mock('../src/components/Global/Defaults', () => ({
  default: {
    CurrentLyricsType: 'Line',
    LyricsContainerExists: true,
    Version: '1.0.0',
    lyrics: { api: { url: '', translationUrl: '', phoneticUrl: '' } },
    systemInstruction: '',
    translationPrompt: '',
    romajiPrompt: '',
    furiganaPrompt: '',
    romajaPrompt: '',
  },
}));

vi.mock('../src/utils/Lyrics/ui', () => ({
  HideLoaderContainer: vi.fn(),
  ClearLyricsPageContainer: vi.fn(),
  ShowProcessingIndicator: vi.fn(),
  EnsureProcessingIndicatorHidden: vi.fn(),
  ShowLoaderContainer: vi.fn(),
  resetLyricsUI: vi.fn(),
  noLyricsMessage: vi.fn(),
}));

vi.mock('../src/utils/Lyrics/cache', () => ({
  cacheLyrics: vi.fn(),
  lyricsCache: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), destroy: vi.fn() },
}));

vi.mock('../src/utils/EventManager', () => ({
  default: { listen: vi.fn(() => 1), unListen: vi.fn(), evoke: vi.fn() },
}));

vi.mock('../src/utils/Lyrics/ai', () => ({
  enhanceLyrics: vi.fn(),
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

vi.mock('../src/utils/API/Lyrics', () => ({
  getLyrics: vi.fn(),
}));

import { TimeSetter } from '../src/utils/Lyrics/Animator/Lyrics/LyricsSetter';
import {
  LyricsObject,
  lineElementToStartTimeMap,
  populateElementTimeMaps,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';
import { RecalculateScrollSimplebar } from '../src/utils/Scrolling/Simplebar/ScrollSimplebar';
import { processAndEnhanceLyrics } from '../src/utils/Lyrics/processing';
import {
  renderLyrics,
  updateLyricTranslations,
  applyScrollReanchor,
} from '../src/utils/Lyrics/LyricsRenderer';
import { enhanceLyrics } from '../src/utils/Lyrics/ai';
import { beginLyricsRequest } from '../src/utils/Lyrics/publish';
import type { LyricsDocument } from '../src/utils/Lyrics/conversion';

/**
 * A line-synced document in the shape `extractLyrics` leaves behind: seconds
 * timings and `raw` holding the pre-enhancement text.
 */
function lineLyrics(): LyricsDocument {
  return {
    type: 'Line',
    lines: [
      { text: 'first line', raw: 'first line', start: 1.0, end: 3.0 },
      { text: 'second line', raw: 'second line', start: 3.5, end: 6.0 },
      { text: 'third line', raw: 'third line', start: 7.0, end: 9.0 },
    ],
  };
}

/** Makes scrollTop a plain writable own property — jsdom has no layout. */
function stubScrollTop(el: HTMLElement, initial = 0): void {
  Object.defineProperty(el, 'scrollTop', { value: initial, writable: true, configurable: true });
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
  vi.mocked(RecalculateScrollSimplebar).mockClear();
});

afterAll(() => {
  destroyLyricsRenderLoop();
});

describe('translation update keeps lyrics sync intact', () => {
  it('preserves line element identity, time maps and DOM structure after update', () => {
    const lyrics = lineLyrics();
    renderLyrics(lyrics);
    populateElementTimeMaps();

    const lines = LyricsObject.Lines;
    expect(lines).toHaveLength(3);
    const before = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(before).toHaveLength(3);

    // Enhancement mutates the very line views the renderer registered.
    lyrics.lines[0].translation = 'translated first line';
    lyrics.lines[1].text = 'second 漢字{かんじ} line'; // forces a text rebuild
    lyrics.lines[2].translation = 'third line'; // non-distinct -> no node

    updateLyricTranslations();

    const after = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(after).toHaveLength(3);
    // Element identity must be preserved — the animator and click-to-seek maps
    // hold references to these spans.
    for (let i = 0; i < 3; i++) {
      expect(after[i]).toBe(before[i]);
      expect(after[i].isConnected).toBe(true);
    }
    lines.forEach((line) => {
      expect(lineElementToStartTimeMap.get(line.element)).toBe(line.StartTime);
    });

    // Translations landed on the correct lines
    expect(after[0].querySelector('.translation')?.textContent).toBe('translated first line');
    expect(after[1].querySelector('rt')?.textContent).toBe('かんじ');
    expect(after[2].querySelector('.translation')).toBeNull();

    // Scrollbar geometry is recalculated after content height changed
    expect(RecalculateScrollSimplebar).toHaveBeenCalled();
  });

  it('skips the DOM rebuild for unchanged lines on subsequent updates', () => {
    const lyrics = lineLyrics();
    renderLyrics(lyrics);

    lyrics.lines[0].translation = 'translated first line';
    updateLyricTranslations();

    const elems = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    // Mark the current first child of every line
    const markers = Array.from(elems).map((el) => {
      const node = el.firstChild as unknown as { __marker?: boolean };
      node.__marker = true;
      return node;
    });

    // Second identical update — every line is unchanged now
    updateLyricTranslations();

    const elems2 = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    elems2.forEach((el, i) => {
      expect(el.firstChild).toBe(markers[i]);
    });
    // Translation is still present
    expect(elems2[0].querySelector('.translation')?.textContent).toBe('translated first line');
  });

  it('keeps TimeSetter line statuses (highlight sync) after translation update', () => {
    const lyrics = lineLyrics();
    renderLyrics(lyrics);

    lyrics.lines.forEach((line) => {
      line.translation = 'T: ' + line.text;
    });
    updateLyricTranslations();

    TimeSetter(4000); // ms — inside line[1] (3500-6000)
    const lines = LyricsObject.Lines;
    expect(lines[0].status).toBe('Sung');
    expect(lines[1].status).toBe('Active');
    expect(lines[2].status).toBe('NotSung');
  });

  it('falls back to raw scrollTop preservation for static lyrics', () => {
    const wrapper = document.querySelector<HTMLElement>('.simplebar-content-wrapper')!;
    stubScrollTop(wrapper, 42);

    const lyrics: LyricsDocument = {
      type: 'Static',
      lines: [{ text: 'static line', raw: 'static line' }],
    };
    renderLyrics(lyrics);

    const span = document.querySelector<HTMLElement>('.line.static .main-lyrics-text');
    expect(span).not.toBeNull();

    lyrics.lines[0].translation = 'translated static line';
    updateLyricTranslations();

    expect(span!.querySelector('.translation')?.textContent).toBe('translated static line');
    expect(wrapper.scrollTop).toBe(42);
  });
});

describe('AI enhancement reaches the painted page', () => {
  it('repaints the line objects the renderer registered, not a copy of them', async () => {
    const uri = 'spotify:track:track1';
    (
      globalThis as unknown as { Spicetify: { Player: { data: { item: { uri: string } } } } }
    ).Spicetify.Player.data.item.uri = uri;
    const token = beginLyricsRequest(uri);

    // The policy's contract: mutate `prepared` in place and return it.
    vi.mocked(enhanceLyrics).mockImplementation(async (prepared) => {
      prepared.lines[0]!.translation = 'translated first line';
      prepared.lines[1]!.translation = 'translated second line';
      return prepared;
    });

    const lyrics = await processAndEnhanceLyrics(
      'track1',
      {
        id: 'track1',
        Type: 'Line',
        Content: [
          {
            Type: 'Line',
            OppositeAligned: false,
            Text: 'first line',
            StartTime: 1.0,
            EndTime: 3.0,
          },
          {
            Type: 'Line',
            OppositeAligned: false,
            Text: 'second line',
            StartTime: 3.5,
            EndTime: 6.0,
          },
        ],
      },
      token,
    );

    renderLyrics(lyrics);
    // The registry must hold the document's own line objects — if the pipeline
    // hands enhancement a clone, the repaint below paints nothing.
    expect(LyricsObject.Lines[0]!.view).toBe(lyrics.lines[0]);

    // The enhancement is fire-and-forget; publication repaints on completion.
    await vi.waitFor(() => {
      const rows = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
      expect(rows[0]?.querySelector('.translation')?.textContent).toBe('translated first line');
    });
    const rows = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(rows[1]?.querySelector('.translation')?.textContent).toBe('translated second line');
  });
});

describe('applyScrollReanchor', () => {
  it('shifts scrollTop by the active line drift so it stays in place', () => {
    const scrollEl = document.createElement('div');
    stubScrollTop(scrollEl, 10);
    let top = 100;
    const line = document.createElement('div');
    line.getBoundingClientRect = () => ({ top }) as DOMRect;
    document.body.appendChild(line);

    // No drift yet -> scroll untouched
    applyScrollReanchor(scrollEl, line, 100, 0);
    expect(scrollEl.scrollTop).toBe(10);

    // Content above the line grew by 60px -> compensate
    top = 160;
    applyScrollReanchor(scrollEl, line, 100, 0);
    expect(scrollEl.scrollTop).toBe(70);
  });

  it('falls back to the raw scrollTop when there is no active line', () => {
    const scrollEl = document.createElement('div');
    stubScrollTop(scrollEl, 0);

    applyScrollReanchor(scrollEl, null, null, 250);
    expect(scrollEl.scrollTop).toBe(250);

    applyScrollReanchor(scrollEl, undefined, null, 80);
    expect(scrollEl.scrollTop).toBe(80);
  });

  it('falls back when the active line was detached from the DOM', () => {
    const scrollEl = document.createElement('div');
    stubScrollTop(scrollEl, 5);
    const detached = document.createElement('div'); // never appended
    detached.getBoundingClientRect = () => ({ top: 999 }) as DOMRect;

    applyScrollReanchor(scrollEl, detached, 100, 30);
    expect(scrollEl.scrollTop).toBe(30);
  });
});
