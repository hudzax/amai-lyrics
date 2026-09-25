import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import lifecycle from '../../utils/lifecycle';
import storage from '../../utils/storage';
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
      <div class="Root__now-playing-bar">
        <div class="player-controls-wrapper">
          <div class="player-controls"></div>
        </div>
      </div>
    `;
    // A real track with valid timed lyrics so the update loop actually resolves
    // and renders an active line — the exact path that used to imperatively
    // write --color-* onto the element once colours were extracted.
    Spicetify.Player.data.item.uri = 'spotify:track:abc123';
    storage.set(
      'currentLyricsData',
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
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const overlay = (): HTMLElement | null => document.querySelector('.amai-playbar-lyrics');

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

  it('does not fetch artwork — the private extraction pipeline was removed', () => {
    const getSpy = vi.spyOn(SpotifyPlayer.Artwork, 'Get').mockResolvedValue('');

    InitializePlaybarLyrics();
    vi.advanceTimersByTime(10);
    // Drive several render cycles; none may reach for the cover art.
    vi.advanceTimersByTime(3000);

    expect(getSpy).not.toHaveBeenCalled();
    getSpy.mockRestore();
  });
});
