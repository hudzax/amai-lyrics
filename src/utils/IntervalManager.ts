import { Maid, Giveable } from '@hudzax/web-modules/Maid';

const liveInstances = new Set<IntervalManager>();
let visibilityListenerAttached = false;

function globalVisibilityHandler(): void {
  const hidden = document.hidden;
  for (const inst of liveInstances) {
    if (inst.Destroyed) continue;
    if (hidden) {
      if (inst.Running) {
        (inst as unknown as { autoPaused: boolean }).autoPaused = true;
        (inst as unknown as { pauseTimer: () => void }).pauseTimer();
      }
    } else {
      const anyInst = inst as unknown as { autoPaused: boolean; scheduleTick: () => void };
      if (anyInst.autoPaused) {
        anyInst.autoPaused = false;
        if (!inst.Running) {
          inst.Running = true;
          anyInst.scheduleTick();
        }
      }
    }
  }
}

function ensureGlobalVisibilityListener(): void {
  if (visibilityListenerAttached) return;
  visibilityListenerAttached = true;
  document.addEventListener('visibilitychange', globalVisibilityHandler);
}

class IntervalManager implements Giveable {
  private maid: Maid;
  private readonly callback: () => void;
  private readonly duration: number; // Duration in milliseconds
  private timerId: number | null = null;
  public Running: boolean;
  public Destroyed: boolean;
  /** True only while WE auto-paused the timer because document.hidden turned true. */
  private autoPaused = false;

  constructor(duration: number, callback: () => void) {
    if (isNaN(duration)) {
      throw new Error('Duration cannot be NaN.');
    }

    this.maid = new Maid();
    this.callback = callback;
    this.duration = duration === Infinity ? 0 : duration * 1000; // Convert seconds to milliseconds or set to 0 for immediate execution
    this.Running = false;
    this.Destroyed = false;

    liveInstances.add(this);
    ensureGlobalVisibilityListener();
    this.maid.Give(() => liveInstances.delete(this));

    // Register cleanup ONCE here instead of inside Start(): Maid.Give() keys
    // each item uniquely, so per-start registration kept appending disposers
    // forever across start/pause/resume cycles.
    this.maid.Give(() => this.Stop());
  }

  // Starts the timer. Uses setTimeout (not requestAnimationFrame) because these
  // intervals don't need per-frame resolution: the old rAF implementation kept
  // many idle rAF chains running at 60Hz for the app's whole lifetime just to
  // decide that a 0.1–1s tick hadn't elapsed yet.
  public Start() {
    if (this.Destroyed) {
      console.warn('Cannot start; IntervalManager has been destroyed.');
      return;
    }

    if (this.Running) {
      console.warn('Interval is already running.');
      return;
    }

    this.Running = true;
    // Drop any stale auto-pause marker (e.g. an owner restart issued while
    // hidden) so the next visibilitychange cannot double-handle this instance.
    this.autoPaused = false;
    this.scheduleTick();
  }

  // Stops the timer without destroying the manager
  public Stop() {
    // An explicit owner stop wins over any pending visibility auto-resume
    // (e.g. an owner stop issued while hidden before the window shows again).
    this.autoPaused = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
      this.Running = false;
    }
  }

  // Restarts the timer loop
  public Restart() {
    if (this.Destroyed) {
      console.warn('Cannot restart; IntervalManager has been destroyed.');
      return;
    }

    this.Stop();
    this.Start();
  }

  // Fully cleans up the manager and makes it unusable
  public Destroy() {
    if (this.Destroyed) {
      console.warn('IntervalManager is already destroyed.');
      return;
    }

    this.Stop();
    this.maid.CleanUp();
    this.Destroyed = true;
    this.Running = false;
  }

  /**
   * Halts the pending tick WITHOUT touching auto-pause bookkeeping. Used only
   * by the visibility handler so an automatic hide never looks like an owner
   * stop (owner actions go through Stop(), which clears that marker).
   */
  private pauseTimer(): void {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
      this.Running = false;
    }
  }

  /** Schedules the recursive tick loop; the caller must have set Running = true. */
  private scheduleTick(): void {
    const tick = (): void => {
      // Bail if stopped/destroyed while a tick was already scheduled.
      if (!this.Running || this.Destroyed) return;
      this.callback();
      // Recursive setTimeout (rather than setInterval) so a slow callback can
      // never stack multiple pending ticks.
      this.timerId = window.setTimeout(tick, this.duration);
    };
    this.timerId = window.setTimeout(tick, this.duration);
  }
}

export { IntervalManager };
