import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Mock heavy dependencies that pull Spicetify / network at import time
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
  fetchPhoneticLyrics: vi.fn(),
  fetchLyricTranslations: vi.fn(),
  fetchGeminiTranslations: vi.fn(),
  fetchAmaiTranslations: vi.fn(),
  fetchAmaiPhonetic: vi.fn(),
  updateLyricsWithText: vi.fn(),
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
  _DEPRECATED___GetProgress: vi.fn(() => 0),
}));

vi.mock('../src/utils/API/Lyrics', () => ({
  getLyrics: vi.fn(),
}));

import { ApplyLineLyrics } from '../src/utils/Lyrics/Applyer/Synced/Line';
import {
  updateDisplayedLyricsWithTranslations,
  applyScrollReanchor,
} from '../src/utils/Lyrics/processing';
import { TimeSetter } from '../src/utils/Lyrics/Animator/Lyrics/LyricsSetter';
import {
  LyricsObject,
  lineElementToStartTimeMap,
  populateElementTimeMaps,
  ClearLyricsContentArrays,
  destroyLyricsRenderLoop,
} from '../src/utils/Lyrics/lyrics';
import { RecalculateScrollSimplebar } from '../src/utils/Scrolling/Simplebar/ScrollSimplebar';

const CONTENT = [
  { Text: 'first line', StartTime: 1.0, EndTime: 3.0 },
  { Text: 'second line', StartTime: 3.5, EndTime: 6.0 },
  { Text: 'third line', StartTime: 7.0, EndTime: 9.0 },
];
const RAWS = ['first line', 'second line', 'third line'];

/** Makes scrollTop a plain writable own property — jsdom has no layout. */
function stubScrollTop(el: HTMLElement, initial = 0): void {
  Object.defineProperty(el, 'scrollTop', { value: initial, writable: true, configurable: true });
}

function setupDom(): void {
  document.body.innerHTML = `
    <div id="SpicyLyricsPage">
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
    ApplyLineLyrics({ Content: CONTENT, StartTime: 0.5, Raw: RAWS } as never);
    populateElementTimeMaps();

    const lines = LyricsObject.Types.Line.Lines;
    expect(lines).toHaveLength(3);
    const before = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(before).toHaveLength(3);

    const enhanced = structuredClone({ Content: CONTENT, Raw: RAWS });
    enhanced.Content[0].Translation = 'translated first line';
    enhanced.Content[1].Text = 'second 漢字{かんじ} line'; // forces a text rebuild
    enhanced.Content[2].Translation = enhanced.Raw[2]; // non-distinct -> no node

    updateDisplayedLyricsWithTranslations({ Type: 'Line', Content: enhanced.Content, Raw: RAWS });

    const after = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    expect(after).toHaveLength(3);
    // Element identity must be preserved — the animator and click-to-seek maps
    // hold references to these spans.
    for (let i = 0; i < 3; i++) {
      expect(after[i]).toBe(before[i]);
      expect(after[i].isConnected).toBe(true);
    }
    lines.forEach((line) => {
      expect(lineElementToStartTimeMap.get(line.HTMLElement)).toBe(line.StartTime);
    });

    // Translations landed on the correct lines
    expect(after[0].querySelector('.translation')?.textContent).toBe('translated first line');
    expect(after[1].querySelector('rt')?.textContent).toBe('かんじ');
    expect(after[2].querySelector('.translation')).toBeNull();

    // Scrollbar geometry is recalculated after content height changed
    expect(RecalculateScrollSimplebar).toHaveBeenCalled();
  });

  it('skips the DOM rebuild for unchanged lines on subsequent updates', () => {
    ApplyLineLyrics({ Content: CONTENT, StartTime: 0.5, Raw: RAWS } as never);

    const enhanced = structuredClone({ Content: CONTENT, Raw: RAWS });
    enhanced.Content[0].Translation = 'translated first line';
    updateDisplayedLyricsWithTranslations({ Type: 'Line', Content: enhanced.Content, Raw: RAWS });

    const elems = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    // Mark the current first child of every line
    const markers = Array.from(elems).map((el) => {
      const node = el.firstChild as unknown as { __marker?: boolean };
      node.__marker = true;
      return node;
    });

    // Second identical update — every line is unchanged now
    updateDisplayedLyricsWithTranslations({ Type: 'Line', Content: enhanced.Content, Raw: RAWS });

    const elems2 = document.querySelectorAll<HTMLElement>('.main-lyrics-text.line');
    elems2.forEach((el, i) => {
      expect(el.firstChild).toBe(markers[i]);
    });
    // Translation is still present
    expect(elems2[0].querySelector('.translation')?.textContent).toBe('translated first line');
  });

  it('keeps TimeSetter line statuses (highlight sync) after translation update', () => {
    ApplyLineLyrics({ Content: CONTENT, StartTime: 0.5, Raw: RAWS } as never);

    const enhanced = structuredClone({ Content: CONTENT, Raw: RAWS });
    enhanced.Content.forEach((line: { Text: string; Translation: string }) => {
      line.Translation = 'T: ' + line.Text;
    });
    updateDisplayedLyricsWithTranslations({ Type: 'Line', Content: enhanced.Content, Raw: RAWS });

    TimeSetter(4000); // ms — inside line[1] (3500-6000)
    const lines = LyricsObject.Types.Line.Lines;
    expect(lines[0].Status).toBe('Sung');
    expect(lines[1].Status).toBe('Active');
    expect(lines[2].Status).toBe('NotSung');
  });

  it('falls back to raw scrollTop preservation for static lyrics', () => {
    const container = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .LyricsContainer .LyricsContent',
    );
    const lineElem = document.createElement('div');
    lineElem.classList.add('line', 'static');
    const span = document.createElement('span');
    span.classList.add('main-lyrics-text');
    span.textContent = 'static line';
    lineElem.appendChild(span);
    container!.appendChild(lineElem);

    const wrapper = document.querySelector<HTMLElement>('.simplebar-content-wrapper')!;
    stubScrollTop(wrapper, 42);

    updateDisplayedLyricsWithTranslations({
      Type: 'Static',
      Lines: [{ Text: 'static line', Translation: 'translated static line' }],
    } as never);

    expect(span.querySelector('.translation')?.textContent).toBe('translated static line');
    expect(wrapper.scrollTop).toBe(42);
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
