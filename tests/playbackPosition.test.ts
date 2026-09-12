import { describe, it, expect, afterEach, vi } from 'vitest';
import GetProgress, {
  destroyGetProgressLoop,
  getPositionFor,
  PlaybackSurfaceOffset,
  resolveIsPlaying,
  syncPlaybackPosition,
} from '../src/utils/Gets/GetProgress';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

describe('playback-time seam', () => {
  const origPlayer = { ...spicetify.Spicetify.Player };
  const origData = { ...spicetify.Spicetify.Player.data };

  afterEach(() => {
    spicetify.Spicetify.Player.getProgress = origPlayer.getProgress;
    spicetify.Spicetify.Player.isPlaying = origPlayer.isPlaying;
    spicetify.Spicetify.Player.data = { ...origData };
    destroyGetProgressLoop();
    vi.restoreAllMocks();
  });

  it('resolves play state from the public API first', () => {
    spicetify.Spicetify.Player.isPlaying = () => true;
    expect(resolveIsPlaying()).toBe(true);
    spicetify.Spicetify.Player.isPlaying = () => false;
    expect(resolveIsPlaying()).toBe(false);
  });

  it('falls back to memory state when the public API is gone', () => {
    spicetify.Spicetify.Player.isPlaying = undefined;
    spicetify.Spicetify.Player.data = { ...origData, isPaused: false };
    expect(resolveIsPlaying()).toBe(true);
    spicetify.Spicetify.Player.data = { ...origData, isPaused: true };
    expect(resolveIsPlaying()).toBe(false);
  });

  it('never throws and reports paused when Spicetify is unreadable', () => {
    spicetify.Spicetify.Player.isPlaying = () => {
      throw new Error('client update broke it');
    };
    spicetify.Spicetify.Player.data = undefined;
    expect(() => resolveIsPlaying()).not.toThrow();
    expect(resolveIsPlaying()).toBe(false);
  });

  it('applies one offset policy per surface', async () => {
    spicetify.Spicetify.Player.getProgress = () => 5000;
    spicetify.Spicetify.Player.isPlaying = () => true;
    // Wait out the 15ms per-frame cache so the stubbed anchor is read.
    await new Promise((r) => setTimeout(r, 25));
    expect(GetProgress()).toBe(5000);
    expect(getPositionFor('highlight')).toBe(5000 + PlaybackSurfaceOffset.highlight);
    expect(getPositionFor('scroll')).toBe(5000 + PlaybackSurfaceOffset.scroll);
    expect(getPositionFor('playbar')).toBe(5000 + PlaybackSurfaceOffset.playbar);
    // The scroll/playbar lead times are what the old call-site constants were.
    expect(PlaybackSurfaceOffset.scroll).toBe(370);
    expect(PlaybackSurfaceOffset.playbar).toBe(600);
  });

  it('re-anchors instantly on discontinuity without throwing', async () => {
    spicetify.Spicetify.Player.getProgress = () => 8000;
    spicetify.Spicetify.Player.isPlaying = () => true;
    await new Promise((r) => setTimeout(r, 25));
    expect(() => syncPlaybackPosition()).not.toThrow();
    expect(GetProgress()).toBe(8000);
    // A seek to a new position is picked up on the very next frame.
    spicetify.Spicetify.Player.getProgress = () => 9000;
    syncPlaybackPosition();
    await new Promise((r) => setTimeout(r, 25));
    expect(GetProgress()).toBe(9000);
  });
});
