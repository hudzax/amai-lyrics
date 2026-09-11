import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { IntervalManager } from '../src/utils/IntervalManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

describe('IntervalManager exception safety (lyrics freeze regression)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps ticking after a throwing callback', () => {
    vi.useFakeTimers();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    let calls = 0;
    const manager = new IntervalManager(0.1, () => {
      calls++;
      if (calls === 1) throw new Error('simulated Spicetify API break');
    });
    manager.Start();
    vi.advanceTimersByTime(150);
    expect(calls).toBe(1);
    vi.advanceTimersByTime(250);
    // Loop survived the throw — this is what keeps lyrics moving after a client update.
    expect(calls).toBeGreaterThan(2);
    expect(manager.Running).toBe(true);
    expect(err).toHaveBeenCalled();
    manager.Destroy();
  });
});

describe('GetProgress resilience (active-line freeze regression)', () => {
  const origPlayer = { ...spicetify.Spicetify.Player };
  const origPlatform = spicetify.Spicetify.Platform;
  const origData = { ...spicetify.Spicetify.Player.data };

  beforeEach(() => {
    // Bust the 15ms per-frame cache by alternating play state per test run.
    spicetify.Spicetify.Player.isPlaying = () => true;
    spicetify.Spicetify.Player.data.isPaused = false;
  });

  afterEach(() => {
    spicetify.Spicetify.Player.getProgress = origPlayer.getProgress;
    spicetify.Spicetify.Player.isPlaying = origPlayer.isPlaying;
    spicetify.Spicetify.Player.data = { ...origData };
    spicetify.Spicetify.Platform = origPlatform;
    vi.restoreAllMocks();
  });

  it('prefers the public getProgress API when available', async () => {
    const { default: GetProgress } = await import('../src/utils/Gets/GetProgress');
    spicetify.Spicetify.Player.getProgress = () => 7777;
    spicetify.Spicetify.Player.isPlaying = () => true;
    // Wait out the 15ms frame cache so the new anchor is read.
    await new Promise((r) => setTimeout(r, 25));
    expect(GetProgress()).toBe(7777);
  });

  it('falls back to memory state when getProgress is missing', async () => {
    const { default: GetProgress } = await import('../src/utils/Gets/GetProgress');
    // Simulate a client update that removed the public helper.
    spicetify.Spicetify.Player.getProgress = undefined;
    spicetify.Spicetify.Player.isPlaying = () => true;
    spicetify.Spicetify.Player.data = {
      ...origData,
      positionAsOfTimestamp: 5000,
      timestamp: Date.now(),
      isPaused: false,
    };
    await new Promise((r) => setTimeout(r, 25));
    const pos = GetProgress();
    expect(typeof pos).toBe('number');
    expect(Number.isFinite(pos)).toBe(true);
    expect(pos).toBeGreaterThanOrEqual(5000);
  });

  it('never throws when Platform internals disappear', async () => {
    const { default: GetProgress } = await import('../src/utils/Gets/GetProgress');
    spicetify.Spicetify.Player.getProgress = undefined;
    spicetify.Spicetify.Player.isPlaying = () => {
      throw new Error('isPlaying broken');
    };
    spicetify.Spicetify.Player.data = {
      ...origData,
      positionAsOfTimestamp: 1234,
      timestamp: Date.now(),
      isPaused: true,
    };
    // SAFETY: test-only simulation of a client update that renames Platform internals
    spicetify.Spicetify.Platform = undefined;
    await new Promise((r) => setTimeout(r, 25));
    expect(() => GetProgress()).not.toThrow();
    expect(typeof GetProgress()).toBe('number');
  });
});
