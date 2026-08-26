import { Maid, Giveable } from '@hudzax/web-modules/Maid';

class IntervalManager implements Giveable {
  private maid: Maid;
  private readonly callback: () => void;
  private readonly duration: number; // Duration in milliseconds
  private timerId: number | null = null;
  public Running: boolean;
  public Destroyed: boolean;
  /** True while paused for document.hidden. Stop()/Start() by the owner still works independently. */
  private hiddenPaused = false;

  constructor(duration: number, callback: () => void) {
    if (isNaN(duration)) {
      throw new Error('Duration cannot be NaN.');
    }

    this.maid = new Maid();
    this.callback = callback;
    this.duration = duration === Infinity ? 0 : duration * 1000; // Convert seconds to milliseconds or set to 0 for immediate execution
    this.Running = false;
    this.Destroyed = false;

    // All intervals this extension runs are UI-side work (lyrics highlight,
    // progress bars, background checks). None of them have any effect while the
    // Spotify window is hidden/minimized-to-tray, so pause the whole fleet then
    // and let the renderer actually idle between song changes.
    const onVisibilityChange = (): void => {
      if (this.Destroyed) return;
      if (document.hidden) {
        this.hiddenPaused = this.Running;
        this.Stop();
      } else {
        const wasHiddenPaused = this.hiddenPaused;
        this.hiddenPaused = false;
        // Only resume if we were the ones who stopped it; an explicit
        // owner-called Stop() while hidden stays stopped.
        if (wasHiddenPaused && !this.Running) this.Start();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.maid.Give(() => document.removeEventListener('visibilitychange', onVisibilityChange));
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
    // If the owner explicitly starts us while hidden, let it tick but remember
    // so the next visibilitychange doesn't try to double-start it.
    this.hiddenPaused = document.hidden;

    const tick = () => {
      // Bail if stopped/destroyed while a tick was already scheduled.
      if (!this.Running || this.Destroyed) return;
      this.callback();
      // Recursive setTimeout (rather than setInterval) so a slow callback can
      // never stack multiple pending ticks.
      this.timerId = window.setTimeout(tick, this.duration);
    };

    this.timerId = window.setTimeout(tick, this.duration);

    // Register cleanup with the Maid
    this.maid.Give(() => this.Stop());
  }

  // Stops the timer without destroying the manager
  public Stop() {
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
}

export { IntervalManager };
