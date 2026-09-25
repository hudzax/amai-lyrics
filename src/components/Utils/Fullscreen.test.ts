import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../Pages/PageView', () => ({
  default: { AppendViewControls: vi.fn() },
  PageRoot: null,
}));
vi.mock('../NowBar/NowBar', () => ({
  OpenNowBar: vi.fn(),
  UpdateNowBar: vi.fn(),
  DeregisterNowBarBtn: vi.fn(),
}));
vi.mock('../../utils/Scrolling/AutoScroll', () => ({ AutoScroll: { reset: vi.fn() } }));

import Fullscreen from './Fullscreen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const doc = document as any;

function mountPage(): HTMLElement {
  document.body.innerHTML =
    '<div class="Root__main-view"><div id="AmaiLyricsPage"><div class="ContentBox"></div></div></div>';
  return document.querySelector<HTMLElement>('#AmaiLyricsPage')!;
}

beforeEach(() => {
  doc.fullscreenElement = null;
  document.body.innerHTML = '';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('FullscreenMode', () => {
  it('answers from the page class alone, not from the browser element', () => {
    const page = mountPage();
    expect(Fullscreen.isPageFullscreen()).toBe(false);

    // A native fullscreen on some other element is not this mode.
    doc.fullscreenElement = document.body;
    expect(Fullscreen.isPageFullscreen()).toBe(false);

    page.classList.add('Fullscreen');
    expect(Fullscreen.isPageFullscreen()).toBe(true);
  });

  it('enter() tags the page, moves it out of the app frame and notifies', () => {
    const page = mountPage();
    const seen: boolean[] = [];
    const unsubscribe = Fullscreen.subscribe((fullscreen) => seen.push(fullscreen));

    Fullscreen.enter();

    expect(Fullscreen.isPageFullscreen()).toBe(true);
    expect(page.parentElement).toBe(document.body);
    expect(seen).toEqual([true]);
    unsubscribe();
  });

  it('leave() clears the mode and notifies once the exit settles', async () => {
    mountPage();
    Fullscreen.enter();
    const seen: boolean[] = [];
    const unsubscribe = Fullscreen.subscribe((fullscreen) => seen.push(fullscreen));

    Fullscreen.leave();
    await Promise.resolve();

    expect(Fullscreen.isPageFullscreen()).toBe(false);
    expect(seen).toEqual([false]);
    unsubscribe();
  });

  it('restores the page when the browser leaves fullscreen behind us', () => {
    mountPage();
    Fullscreen.enter();

    // Escape in the browser: the element clears and the UA fires the event.
    doc.fullscreenElement = null;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(Fullscreen.isPageFullscreen()).toBe(false);
  });

  it('clears the mode without resurrecting a page destroyed mid-exit', async () => {
    const page = mountPage();
    Fullscreen.enter();
    page.remove();

    Fullscreen.leave();
    await Promise.resolve();

    expect(Fullscreen.isPageFullscreen()).toBe(false);
    expect(document.querySelector('#AmaiLyricsPage')).toBeNull();
  });

  it('stops notifying a subscriber that unsubscribed', () => {
    mountPage();
    const seen: boolean[] = [];
    const unsubscribe = Fullscreen.subscribe((fullscreen) => seen.push(fullscreen));

    unsubscribe();
    Fullscreen.enter();

    expect(seen).toEqual([]);
  });
});
