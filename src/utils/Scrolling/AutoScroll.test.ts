import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Defaults from '../../components/Global/Defaults';
import { AutoScroll, __getAutoScrollLastLineForTests, syncAutoScroll } from './AutoScroll';

function mountPage(): HTMLElement {
  document.body.innerHTML =
    '<div id="AmaiLyricsPage"><div class="ContentBox"><div class="LyricsContainer"><div class="LyricsContent"></div></div></div></div>';
  return document.querySelector('#AmaiLyricsPage .LyricsContainer') as HTMLElement;
}

function makeLine(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  Defaults.LyricsContainerExists = true;
  mountPage();
});

afterEach(() => {
  AutoScroll.reset();
  document.body.innerHTML = '';
  Defaults.LyricsContainerExists = false;
  vi.restoreAllMocks();
});

describe('AutoScroll seam', () => {
  it('syncs to the active line through one interface call', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const first = makeLine();
    const second = makeLine();
    const scroller = vi.fn<
      (container: HTMLElement, element: HTMLElement) => { cancel: () => void }
    >(() => ({
      cancel: vi.fn(),
    }));
    const lines = [
      { element: first, StartTime: 0, EndTime: 999 },
      { element: second, StartTime: 1000, EndTime: 2000 },
    ];

    syncAutoScroll({
      isPlaying: true,
      onLyricsPage: true,
      position: 1500,
      lines,
      container,
      scroller,
    });

    expect(scroller).toHaveBeenCalledTimes(1);
    expect(scroller.mock.calls[0][0]).toBe(container);
    expect(scroller.mock.calls[0][1]).toBe(second);
    expect(second.classList.contains('Active')).toBe(true);
    expect(__getAutoScrollLastLineForTests()).toBe(second);
  });

  it('skips motion when the same line stays active', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const first = makeLine();
    const scroller = vi.fn<
      (container: HTMLElement, element: HTMLElement) => { cancel: () => void }
    >(() => ({
      cancel: vi.fn(),
    }));
    const lines = [{ element: first, StartTime: 0, EndTime: 5000 }];

    syncAutoScroll({
      isPlaying: true,
      onLyricsPage: true,
      position: 100,
      lines,
      container,
      scroller,
    });
    syncAutoScroll({
      isPlaying: true,
      onLyricsPage: true,
      position: 200,
      lines,
      container,
      scroller,
    });

    expect(scroller).toHaveBeenCalledTimes(1);
  });

  it('cancels in-flight motion when the target line changes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const first = makeLine();
    const second = makeLine();
    const cancelFirst = vi.fn();
    const scroller = vi
      .fn()
      .mockReturnValueOnce({ cancel: cancelFirst })
      .mockReturnValue({ cancel: vi.fn() });
    const lines = [
      { element: first, StartTime: 0, EndTime: 999 },
      { element: second, StartTime: 1000, EndTime: 2000 },
    ];
    const base = { isPlaying: true, onLyricsPage: true, lines, container, scroller };

    syncAutoScroll({ ...base, position: 100 });
    syncAutoScroll({ ...base, position: 1500 });

    expect(cancelFirst).toHaveBeenCalledTimes(1);
    expect(scroller).toHaveBeenCalledTimes(2);
    expect(first.classList.contains('OverridenByScroller')).toBe(false);
  });

  it('reset forgets the target so the next sync re-scrolls', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const first = makeLine();
    const scroller = vi.fn<
      (container: HTMLElement, element: HTMLElement) => { cancel: () => void }
    >(() => ({
      cancel: vi.fn(),
    }));
    const lines = [{ element: first, StartTime: 0, EndTime: 5000 }];
    const base = { isPlaying: true, onLyricsPage: true, position: 100, lines, container, scroller };

    syncAutoScroll(base);
    AutoScroll.reset();
    expect(__getAutoScrollLastLineForTests()).toBeNull();
    syncAutoScroll(base);

    expect(scroller).toHaveBeenCalledTimes(2);
  });

  it('never throws when paused, off-page, or containerless', () => {
    const line = makeLine();
    const lines = [{ element: line, StartTime: 0, EndTime: 5000 }];
    const scroller = vi.fn<
      (container: HTMLElement, element: HTMLElement) => { cancel: () => void }
    >(() => ({
      cancel: vi.fn(),
    }));

    expect(() =>
      syncAutoScroll({
        isPlaying: false,
        onLyricsPage: true,
        position: 10,
        lines,
        container: null,
        scroller,
      }),
    ).not.toThrow();
    expect(() =>
      syncAutoScroll({
        isPlaying: true,
        onLyricsPage: false,
        position: 10,
        lines,
        container: null,
        scroller,
      }),
    ).not.toThrow();
    expect(() =>
      syncAutoScroll({
        isPlaying: true,
        onLyricsPage: true,
        position: 10,
        lines,
        container: null,
        scroller,
      }),
    ).not.toThrow();
    expect(scroller).not.toHaveBeenCalled();
  });

  it('mount and destroy never throw without a lyrics container', () => {
    document.body.innerHTML = '';
    expect(() => AutoScroll.mount()).not.toThrow();
    expect(() => AutoScroll.destroy()).not.toThrow();
  });
});
