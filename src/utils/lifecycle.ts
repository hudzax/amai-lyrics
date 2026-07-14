import { IntervalManager } from './IntervalManager';
import Whentil from './Whentil';

type Disposer = () => void;

/**
 * Global teardown registry.
 *
 * Spicetify re-injects the extension script on watch/reload, re-evaluating all
 * modules and re-running `main()`. Any subscription created without a matching
 * removal stacks on top of the previous instance. This registry collects
 * disposers so the whole plugin can be torn down before a re-init.
 *
 * Because re-init re-evaluates modules, an in-memory flag is not enough: we
 * persist a teardown handle on `window` so a fresh run can dispose the
 * *previous* module instance (whose disposer closures still capture the correct
 * `Spicetify.Player.removeEventListener(prevHandler)` references).
 */
class Lifecycle {
  private disposers: Disposer[] = [];

  /** Track a raw disposer. */
  track(disposer: Disposer): void {
    this.disposers.push(disposer);
  }

  /** Register a Spicetify player event and its removal. */
  trackPlayerEvent(type: string, handler: (...args: unknown[]) => void): void {
    Spicetify.Player.addEventListener(type, handler as never);
    this.track(() => Spicetify.Player.removeEventListener(type, handler as never));
  }

  /** Register a Global.Event bus listener id and its removal. */
  trackGlobalEvent(id: number): void {
    this.track(() => {
      // Lazy import avoids a circular dependency at module load.
      import('./EventManager').then(({ default: Event }) => Event.unListen(id)).catch(() => {});
    });
  }

  /** Register a History.listen unsubscribe function. */
  trackHistory(unsubscribe: (() => void) | void): void {
    if (typeof unsubscribe === 'function') this.track(unsubscribe);
  }

  /** Register a window event and its removal. */
  trackWindow(
    event: keyof WindowEventMap,
    handler: (...args: unknown[]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void {
    window.addEventListener(event, handler as EventListener, options);
    this.track(() => window.removeEventListener(event, handler as EventListener, options));
  }

  /** Register an IntervalManager so it is destroyed on teardown. */
  trackInterval(manager: IntervalManager): void {
    this.track(() => manager.Destroy());
  }

  /** Register a Whentil cancellable task. */
  trackWhentil(task: ReturnType<typeof Whentil.When>): void {
    this.track(() => task.Cancel());
  }

  /** Register a MutationObserver so it is disconnected on teardown. */
  trackObserver(observer: MutationObserver): void {
    this.track(() => observer.disconnect());
  }

  /** Register an arbitrary cleanup callback. */
  trackCallback(fn: Disposer): void {
    this.track(fn);
  }

  /** Run every disposer in reverse order and clear the registry. */
  disposeAll(): void {
    const disposers = this.disposers.slice().reverse();
    this.disposers = [];
    for (const dispose of disposers) {
      try {
        dispose();
      } catch (error) {
        console.error('[Amai Lyrics] Error during teardown:', error);
      }
    }
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__amaiLyricsTeardown;
    }
  }

  /**
   * Persist this instance's teardown on `window` so the next (re-evaluated)
   * module instance can dispose the previous one before wiring itself up.
   */
  registerGlobalTeardown(): void {
    if (typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__amaiLyricsTeardown = () => this.disposeAll();
  }
}

const lifecycle = new Lifecycle();
export default lifecycle;
