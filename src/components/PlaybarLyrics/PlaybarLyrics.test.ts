import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import lifecycle from '../../utils/lifecycle';
import storage from '../../utils/storage';
import { StorageKeys } from '../../utils/storageKeys';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { InitializePlaybarLyrics } from './PlaybarLyrics';

/**
 * Regression guard for the ArtworkSurfaces deepening: the playbar's animated
 * gradient used to be driven by a private artwork pipeline inside this module
 * (own debounce, own spotify:image: rewrite, own palette application) that
 * shadowed the identical --amai-accent-* palette the seam already publishes on
 * <html>. After the change the palette is purely inherited, so the overlay must
 * never write --color-1..5 inline and must never fetch the cover art itself.
 */
describe('PlaybarLyrics — artwork palette comes from the ArtworkSurfaces seam', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <aside data-testid="now-playing-bar">
        <div class="player-controls-wrapper">
          <div data-testid="player-controls"></div>
        </div>
      </aside>
    `;
    // A real track with valid timed lyrics so the update loop actually resolves
    // and renders an active line — the exact path that used to imperatively
    // write --color-* onto the element once colours were extracted.
    Spicetify.Player.data.item.uri = 'spotify:track:abc123';
    storage.set(
      StorageKeys.CURRENT_LYRICS_DATA,
      JSON.stringify({
        v: 2,
        id: 'abc123',
        type: 'Line',
        lines: [
          { text: 'never gonna give you up', raw: 'never gonna give you up', start: 0, end: 60 },
        ],
      }),
    );
  });

  afterEach(() => {
    // Stops the interval manager, cancels the pending Whentil and detaches the
    // songchange/storage listeners so the next case starts from a clean slate.
    lifecycle.disposeAll();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const overlay = (): HTMLElement | null => document.querySelector('.amai-playbar-lyrics');

  const LONG_LINE_1 = 'the first long lyric line that overflows the playbar';
  const LONG_LINE_2 = 'the second long lyric line that overflows the playbar too';

  function publishLines(lines: Array<{ text: string; start: number; end: number }>): void {
    storage.set(
      StorageKeys.CURRENT_LYRICS_DATA,
      JSON.stringify({
        v: 2,
        id: 'abc123',
        type: 'Line',
        lines: lines.map((line) => ({ ...line, raw: line.text })),
      }),
    );
  }

  function mockPlaybackPosition(): (ms: number) => void {
    // GetProgress persists its anchor and 15ms position cache on window across
    // tests, while each vi.useFakeTimers() clock restarts near zero. Without a
    // reset a previous test's cache timestamp looks like the future and the
    // stale position sticks.
    // SAFETY: window-persisted hot-reload state owned by GetProgress; the test
    // clears only the fields that outlive a fake-timer clock reset.
    const progressState = (
      window as unknown as {
        __amaiGetProgressState?: {
          cachedPosition: number | null;
          cachedPositionTime: number;
          cachedIsPlaying: boolean | null;
          syncedPosition: { StartedSyncAt: number; Position: number };
        };
      }
    ).__amaiGetProgressState;
    if (progressState) {
      progressState.cachedPosition = null;
      progressState.cachedPositionTime = 0;
      progressState.cachedIsPlaying = null;
      progressState.syncedPosition.StartedSyncAt = 0;
      progressState.syncedPosition.Position = 0;
    }

    let positionMs = 0;
    vi.spyOn(Spicetify.Player, 'getProgress').mockImplementation(() => positionMs);
    return (ms) => {
      positionMs = ms;
    };
  }

  /** rAF queue the test flushes by hand, so marquee state is observable per frame. */
  function installManualRaf(): () => void {
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queue.push(cb);
      return queue.length;
    });
    return () => {
      for (const cb of queue.splice(0)) cb(performance.now());
    };
  }

  /**
   * Renders the first line and pins the overflow measurement (jsdom has no
   * layout). Returns the text layer and the manual rAF flush.
   */
  function renderOverflowingLine(position: (ms: number) => void): {
    textLayer: HTMLElement;
    flushRaf: () => void;
  } {
    const flushRaf = installManualRaf();
    position(0);

    InitializePlaybarLyrics();
    vi.advanceTimersByTime(10); // Whentil injects the overlay
    vi.advanceTimersByTime(300); // first tick renders line 1

    const el = overlay()!;
    const textLayer = el.querySelector<HTMLElement>('.amai-playbar-lyrics-text')!;
    Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => 100 });
    Object.defineProperty(textLayer, 'scrollWidth', { configurable: true, get: () => 500 });

    flushRaf();
    expect(textLayer.classList.contains('amai-marquee')).toBe(true);
    expect(textLayer.style.getPropertyValue('--scroll-dist')).toBe('-420px');

    return { textLayer, flushRaf };
  }

  it('never writes --color-1..5 inline — the gradient inherits --amai-accent-* from <html>', () => {
    InitializePlaybarLyrics();

    // Whentil.When polls (10ms backoff) and injects once the playbar exists.
    vi.advanceTimersByTime(10);
    expect(overlay()).not.toBeNull();

    // First IntervalManager tick (0.3s) resolves the active line and renders it.
    vi.advanceTimersByTime(300);

    const el = overlay();
    expect(el).not.toBeNull();
    expect(el!.textContent).toContain('never gonna give you up');

    // The palette is inherited through CSS (--color-N: var(--amai-accent-N)),
    // so no inline custom property may shadow the seam's published accents.
    for (let i = 1; i <= 5; i++) {
      expect(el!.style.getPropertyValue(`--color-${i}`)).toBe('');
      expect(el!.style.cssText).not.toContain(`--color-${i}`);
    }
  });

  it('keeps the lyric text in a separate animation layer', () => {
    InitializePlaybarLyrics();
    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(300);

    const overlay = document.querySelector<HTMLElement>('.amai-playbar-lyrics');
    const entranceLayer = overlay?.querySelector<HTMLElement>('.amai-playbar-lyrics-inner');
    const textLayer = entranceLayer?.querySelector<HTMLElement>('.amai-playbar-lyrics-text');

    expect(entranceLayer).not.toBeNull();
    expect(textLayer).not.toBeNull();
    expect(textLayer?.textContent).toContain('never gonna give you up');
    expect(entranceLayer?.textContent).toBe(textLayer?.textContent);
  });

  it('does not fetch artwork — the private extraction pipeline was removed', () => {
    const getSpy = vi.spyOn(SpotifyPlayer.Artwork, 'Get').mockResolvedValue('');

    InitializePlaybarLyrics();
    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(3000);

    expect(getSpy).not.toHaveBeenCalled();
    getSpy.mockRestore();
  });

  it('restarts the marquee from the start when a long line follows another long line', () => {
    publishLines([
      { text: LONG_LINE_1, start: 0, end: 1 },
      { text: LONG_LINE_2, start: 1, end: 60 },
    ]);
    const position = mockPlaybackPosition();
    const { textLayer, flushRaf } = renderOverflowingLine(position);

    // Move into the second long line. It must not inherit the finished
    // marquee's end transform — the class is dropped before the new line is
    // measured so re-adding it starts a fresh animation at translateX(0).
    position(1500);
    vi.advanceTimersByTime(300);

    expect(textLayer.textContent).toContain(LONG_LINE_2);
    expect(textLayer.classList.contains('amai-marquee')).toBe(false);
    expect(textLayer.style.getPropertyValue('--scroll-dist')).toBe('');

    flushRaf();
    expect(textLayer.classList.contains('amai-marquee')).toBe(true);
    expect(textLayer.style.getPropertyValue('--scroll-dist')).toBe('-420px');
  });

  it('restarts the marquee when the same long line repeats', () => {
    publishLines([
      { text: LONG_LINE_1, start: 0, end: 1 },
      { text: LONG_LINE_1, start: 1, end: 60 },
    ]);
    const position = mockPlaybackPosition();
    const { textLayer, flushRaf } = renderOverflowingLine(position);

    // Identical text is still a new line: deduping on text alone would leave
    // the marquee parked at the end for the whole repeated line.
    position(1500);
    vi.advanceTimersByTime(300);

    expect(textLayer.classList.contains('amai-marquee')).toBe(false);

    flushRaf();
    expect(textLayer.classList.contains('amai-marquee')).toBe(true);
  });
});
