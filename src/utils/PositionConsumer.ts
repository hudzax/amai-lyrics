/**
 * PositionConsumer — the single owner of the position-driven render tick.
 *
 * The lyrics-page loop and the playbar overlay each used to own an
 * IntervalManager plus the same prologue: play-state self-heal, the lyrics-page
 * gate, the position-tracking refcount, and the finite-guarded position read.
 * The two copies were byte-identical, so every churn commit had to reason about
 * the same plumbing twice. This module owns that prologue once; a consumer
 * states its surface, its cadence, its own enable gate, and what to do with a
 * position.
 *
 * The position read crosses the PlaybackTime seam (getPositionFor, lead time
 * included); consumers never touch a Spicetify position API directly. One loop
 * per surface, persisted on window so a hot re-injection reuses rather than
 * duplicates.
 */

import { IntervalManager } from './IntervalManager';
import { SpotifyPlayer } from '../components/Global/SpotifyPlayer';
import {
  getPositionFor,
  requestPositionTracking,
  resolveIsPlaying,
  type PlaybackSurface,
} from './Gets/GetProgress';

export interface PositionTickContext {
  onLyricsPage: boolean;
  isPlaying: boolean;
}

export interface PositionConsumerOptions {
  /** Which surface's lead time to apply (PlaybackSurfaceOffset). */
  surface: PlaybackSurface;
  /** Tick cadence in seconds. IntervalManager auto-pauses while hidden. */
  intervalSeconds: number;
  /**
   * The consumer's own gate (settings flag, container existence, ...). False
   * skips the position read this tick and fires onIdle instead.
   */
  enabled: (ctx: PositionTickContext) => boolean;
  /**
   * Whether the shared position-tracking refcount is held. Owns the page/paused
   * policy; this module owns the acquire/release plumbing. Only consulted while
   * enabled, so a consumer that does no work never pays for tracking.
   */
  wantsTracking: (ctx: PositionTickContext) => boolean;
  /** Called with a finite, non-negative position, surface lead time applied. */
  onPosition: (position: number, ctx: PositionTickContext) => void;
  /** Called on ticks where enabled returned false, after tracking is released,
   * so the consumer can clear its own DOM state. */
  onIdle?: (ctx: PositionTickContext) => void;
}

interface ConsumerEntry {
  disposer: () => void;
}

// Window-persisted so re-injection (spicetify watch) reuses the existing loop
// per surface instead of spawning a second one.
// SAFETY: window augmentation for hot-reload persistence; __amaiPositionConsumers is our isolated namespace
const windowRef = window as unknown as { __amaiPositionConsumers?: Map<string, ConsumerEntry> };
const consumers = (windowRef.__amaiPositionConsumers ??= new Map<string, ConsumerEntry>());

function resolveOnLyricsPage(): boolean {
  try {
    return Spicetify.Platform.History.location.pathname === '/AmaiLyrics';
  } catch {
    return false;
  }
}

/**
 * Registers a position-driven render loop. Idempotent per surface: registering
 * an already-running surface swaps in fresh options and keeps exactly one loop.
 * Returns a disposer that stops the loop and releases tracking; calling it
 * twice is safe.
 */
export function registerPositionConsumer(options: PositionConsumerOptions): () => void {
  const key = options.surface;
  consumers.get(key)?.disposer();

  let releaseTracking: (() => void) | null = null;
  let destroyed = false;

  const tick = (): void => {
    if (destroyed) return;

    // Self-heal play state every tick: if the onplaypause payload shape changes
    // after a Spotify client update, SpotifyPlayer.IsPlaying would freeze even
    // while the position seam keeps advancing. resolveIsPlaying never throws.
    const livePlaying = resolveIsPlaying();
    if (SpotifyPlayer.IsPlaying !== livePlaying) SpotifyPlayer.IsPlaying = livePlaying;

    const ctx: PositionTickContext = {
      onLyricsPage: resolveOnLyricsPage(),
      isPlaying: livePlaying,
    };

    const active = options.enabled(ctx);
    const wantsTracking = active && options.wantsTracking(ctx);
    if (wantsTracking && !releaseTracking) {
      try {
        releaseTracking = requestPositionTracking();
      } catch {
        // tracking is best-effort; the position read below still works
      }
    } else if (!wantsTracking && releaseTracking) {
      releaseTracking();
      releaseTracking = null;
    }

    if (!active) {
      options.onIdle?.(ctx);
      return;
    }

    let position: number;
    try {
      position = getPositionFor(options.surface);
    } catch {
      return;
    }
    if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) return;

    options.onPosition(position, ctx);
  };

  const interval = new IntervalManager(options.intervalSeconds, tick);
  const disposer = (): void => {
    if (destroyed) return;
    destroyed = true;
    if (releaseTracking) {
      releaseTracking();
      releaseTracking = null;
    }
    interval.Destroy();
    consumers.delete(key);
  };

  consumers.set(key, { disposer });
  interval.Start();
  return disposer;
}
