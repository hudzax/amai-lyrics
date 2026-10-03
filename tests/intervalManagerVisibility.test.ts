import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * IntervalManager persists its visibility listener and its live-instance set on
 * `window`, so a Spicetify hot re-injection reuses both instead of stacking a
 * second `visibilitychange` handler on `document` per reload.
 *
 * Every import here is dynamic and preceded by `vi.resetModules()`: re-evaluating
 * the module is exactly what a hot reload does, and `window` survives it the same
 * way it survives here. A static import would evaluate the module before a test
 * could observe the attach.
 */

const windowRef = window as unknown as { __amaiIntervalState?: unknown };

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
}

function visibilityAttachCount(spy: { mock: { calls: unknown[][] } }): number {
  return spy.mock.calls.filter(([type]) => type === 'visibilitychange').length;
}

beforeEach(() => {
  vi.useFakeTimers();
  // A fresh page load: no persisted state. jsdom keeps one document for the whole
  // file, so a listener attached by an earlier test survives and keeps iterating
  // its own orphaned set — harmless here, and the spy is installed afterwards so
  // it only ever counts this test's attaches.
  delete windowRef.__amaiIntervalState;
  vi.resetModules();
  setHidden(false);
});

afterEach(() => {
  setHidden(false);
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('IntervalManager visibility listener across hot reloads', () => {
  it('attaches exactly one listener no matter how many times the module is re-evaluated', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    // Structural, not nominal: each re-evaluated module has its own class identity.
    const instances: Array<{ Destroy(): void }> = [];

    for (let injection = 0; injection < 3; injection++) {
      const { IntervalManager } = await import('../src/utils/IntervalManager');
      const manager = new IntervalManager(1, () => {});
      instances.push(manager);
      // Every injection after the first re-evaluates the module from scratch.
      vi.resetModules();
    }

    expect(visibilityAttachCount(addSpy)).toBe(1);

    for (const manager of instances) manager.Destroy();
  });

  it('pauses and resumes instances created after a re-injection', async () => {
    const first = await import('../src/utils/IntervalManager');
    const before = new first.IntervalManager(0.1, () => {});
    before.Start();

    // Spicetify re-injects: the module is re-evaluated, `window` is not.
    vi.resetModules();
    const second = await import('../src/utils/IntervalManager');
    const after = new second.IntervalManager(0.1, () => {});
    after.Start();

    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(before.Running).toBe(false);
    // Guards the other half of the fix: persisting only the listener flag would
    // pass the attach-count test above while leaving the surviving handler
    // closing over the previous injection's set, so an instance it never saw
    // constructed would never auto-pause.
    expect(after.Running).toBe(false);

    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(before.Running).toBe(true);
    expect(after.Running).toBe(true);

    before.Destroy();
    after.Destroy();
  });

  it('drops destroyed instances from the persisted set', async () => {
    const { IntervalManager } = await import('../src/utils/IntervalManager');
    const manager = new IntervalManager(1, () => {});

    const state = windowRef.__amaiIntervalState as { instances: Set<unknown> };
    expect(state.instances.size).toBe(1);

    manager.Destroy();
    expect(state.instances.size).toBe(0);
  });

  it('still auto-pauses on hide and resumes ticking on show', async () => {
    const { IntervalManager } = await import('../src/utils/IntervalManager');
    const cb = vi.fn();
    const manager = new IntervalManager(0.1, cb);
    manager.Start();
    vi.advanceTimersByTime(150);
    expect(cb).toHaveBeenCalledTimes(1);

    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);

    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(150);
    expect(cb).toHaveBeenCalledTimes(2);

    // An explicit owner Stop while hidden stays sticky across the next show.
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    manager.Stop();
    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(2);

    manager.Destroy();
  });
});
