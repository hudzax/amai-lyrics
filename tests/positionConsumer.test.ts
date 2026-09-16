import { describe, it, expect, vi, beforeEach } from 'vitest';

// Drives ticks manually instead of waiting on real timers.
const mockTickHolder: { current: (() => void) | null } = { current: null };
vi.mock('../src/utils/IntervalManager', () => ({
  IntervalManager: class {
    constructor(_duration: number, cb: () => void) {
      mockTickHolder.current = cb;
    }
    Start() {}
    Destroy() {
      mockTickHolder.current = null;
    }
  },
}));

const mockGetPositionFor = vi.fn((surface: string) => (surface === 'playbar' ? 1000 : 500));
const mockRequestTracking = vi.fn(() => vi.fn());
const mockResolveIsPlaying = vi.fn(() => true);

vi.mock('../src/utils/Gets/GetProgress', () => ({
  default: () => 0,
  getPositionFor: (...args: unknown[]) => mockGetPositionFor(...(args as [string])),
  requestPositionTracking: () => mockRequestTracking(),
  resolveIsPlaying: () => mockResolveIsPlaying(),
  PlaybackSurfaceOffset: { highlight: 0, scroll: 370, playbar: 600 },
}));

import { SpotifyPlayer } from '../src/components/Global/SpotifyPlayer';
import { registerPositionConsumer } from '../src/utils/PositionConsumer';

const onPosition = vi.fn();
const onIdle = vi.fn();

const setLyricsPage = (on: boolean): void => {
  const sp = globalThis as unknown as {
    Spicetify: { Platform: { History: { location: { pathname: string } } } };
  };
  sp.Spicetify.Platform.History.location.pathname = on ? '/AmaiLyrics' : '/';
};

const tick = (): void => {
  const fn = mockTickHolder.current;
  if (!fn) throw new Error('no consumer registered');
  fn();
};

beforeEach(() => {
  vi.clearAllMocks();
  mockTickHolder.current = null;
  mockResolveIsPlaying.mockReturnValue(true);
  mockGetPositionFor.mockImplementation((surface: string) => (surface === 'playbar' ? 1000 : 500));
  mockRequestTracking.mockReturnValue(vi.fn());
  setLyricsPage(false);
  SpotifyPlayer.IsPlaying = false;
});

describe('registerPositionConsumer', () => {
  it('delivers the seam position with tick context while enabled', () => {
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => true,
      onPosition,
      onIdle,
    });

    tick();

    expect(onPosition).toHaveBeenCalledTimes(1);
    expect(onPosition).toHaveBeenCalledWith(
      500,
      expect.objectContaining({ onLyricsPage: false, isPlaying: true }),
    );
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('fires onIdle and skips the position read when disabled', () => {
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => false,
      wantsTracking: () => true,
      onPosition,
      onIdle,
    });

    tick();

    expect(onPosition).not.toHaveBeenCalled();
    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(mockGetPositionFor).not.toHaveBeenCalled();
  });

  it('self-heals SpotifyPlayer.IsPlaying from the play-state seam', () => {
    SpotifyPlayer.IsPlaying = false;
    mockResolveIsPlaying.mockReturnValue(true);
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => false,
      onPosition,
    });

    tick();

    expect(SpotifyPlayer.IsPlaying).toBe(true);
  });

  it('resolves the lyrics-page gate into the tick context', () => {
    setLyricsPage(true);
    let seen: { onLyricsPage: boolean } | null = null;
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => false,
      onPosition: (_position, ctx) => {
        seen = ctx;
      },
    });

    tick();

    expect(seen).not.toBeNull();
    expect((seen as { onLyricsPage: boolean }).onLyricsPage).toBe(true);
  });

  it('acquires tracking only while enabled and wanted, and releases otherwise', () => {
    const release = vi.fn();
    mockRequestTracking.mockReturnValue(release);
    let want = true;
    registerPositionConsumer({
      surface: 'playbar',
      intervalSeconds: 0.3,
      enabled: () => true,
      wantsTracking: () => want,
      onPosition,
    });

    tick();
    expect(mockRequestTracking).toHaveBeenCalledTimes(1);
    tick();
    expect(mockRequestTracking).toHaveBeenCalledTimes(1); // held, not re-acquired

    want = false;
    tick();
    expect(release).toHaveBeenCalledTimes(1);
    expect(mockRequestTracking).toHaveBeenCalledTimes(1);

    want = true;
    tick();
    expect(mockRequestTracking).toHaveBeenCalledTimes(2);
  });

  it('never acquires tracking while the consumer is idle', () => {
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => false,
      wantsTracking: () => true,
      onPosition,
    });

    tick();

    expect(mockRequestTracking).not.toHaveBeenCalled();
  });

  it('never delivers a non-finite position', () => {
    mockGetPositionFor.mockReturnValue(NaN);
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => false,
      onPosition,
    });

    tick();

    expect(onPosition).not.toHaveBeenCalled();
  });

  it('survives a throwing position read', () => {
    mockGetPositionFor.mockImplementation(() => {
      throw new Error('boom');
    });
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => false,
      onPosition,
    });

    expect(() => tick()).not.toThrow();
    expect(onPosition).not.toHaveBeenCalled();
  });

  it('re-registering a surface swaps in fresh options and keeps one loop', () => {
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => false,
      onPosition,
    });
    const other = vi.fn();
    registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => false,
      onPosition: other,
    });

    tick();

    expect(other).toHaveBeenCalledTimes(1);
    expect(onPosition).not.toHaveBeenCalled();
  });

  it('the disposer stops ticks and releases tracking', () => {
    const release = vi.fn();
    mockRequestTracking.mockReturnValue(release);
    const dispose = registerPositionConsumer({
      surface: 'highlight',
      intervalSeconds: 0.05,
      enabled: () => true,
      wantsTracking: () => true,
      onPosition,
    });

    tick();
    expect(onPosition).toHaveBeenCalledTimes(1);

    dispose();
    expect(release).toHaveBeenCalledTimes(1);

    // A stale tick after disposal must be a no-op.
    expect(() => {
      const fn = mockTickHolder.current;
      fn?.();
    }).not.toThrow();
    expect(onPosition).toHaveBeenCalledTimes(1);
  });
});
