import { describe, it, expect, vi, afterEach } from 'vitest';
import lifecycle from '../src/utils/lifecycle';
import EventBus from '../src/utils/EventManager';
import { IntervalManager } from '../src/utils/IntervalManager';
import Whentil from '../src/utils/Whentil';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

afterEach(() => {
  lifecycle.disposeAll();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('lifecycle', () => {
  it('runs tracked disposers in reverse order', () => {
    const order: number[] = [];
    lifecycle.track(() => order.push(1));
    lifecycle.track(() => order.push(2));
    lifecycle.track(() => order.push(3));
    lifecycle.disposeAll();
    expect(order).toEqual([3, 2, 1]);
  });

  it('continues disposing when a disposer throws', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    let second = false;
    lifecycle.track(() => {
      second = true;
    });
    lifecycle.track(() => {
      throw new Error('teardown boom');
    });
    lifecycle.disposeAll();
    expect(second).toBe(true);
    expect(err).toHaveBeenCalled();
  });

  it('trackWindow removes the listener on dispose', () => {
    const handler = vi.fn();
    lifecycle.trackWindow('test:lifecycle-event', handler);
    window.dispatchEvent(new window.Event('test:lifecycle-event'));
    expect(handler).toHaveBeenCalledTimes(1);
    lifecycle.disposeAll();
    window.dispatchEvent(new window.Event('test:lifecycle-event'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('trackGlobalEvent unlistens on dispose', () => {
    const handler = vi.fn();
    const id = EventBus.listen('test:lifecycle-bus', handler);
    lifecycle.trackGlobalEvent(id);
    EventBus.evoke('test:lifecycle-bus');
    expect(handler).toHaveBeenCalledTimes(1);
    lifecycle.disposeAll();
    EventBus.evoke('test:lifecycle-bus');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('trackHistory invokes the unsubscribe function on dispose', () => {
    const unsubscribe = vi.fn();
    lifecycle.trackHistory(unsubscribe);
    lifecycle.disposeAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('trackHistory ignores non-function values', () => {
    expect(() => lifecycle.trackHistory(undefined)).not.toThrow();
    lifecycle.disposeAll();
  });

  it('trackPlayerEvent wires add/removeEventListener', () => {
    const add = vi.spyOn(spicetify.Spicetify.Player, 'addEventListener');
    const remove = vi.spyOn(spicetify.Spicetify.Player, 'removeEventListener');
    const handler = vi.fn();
    lifecycle.trackPlayerEvent('test:player-event', handler);
    expect(add).toHaveBeenCalledWith('test:player-event', handler);
    lifecycle.disposeAll();
    expect(remove).toHaveBeenCalledWith('test:player-event', handler);
  });

  it('trackInterval destroys the manager on dispose', () => {
    const manager = new IntervalManager(60, () => {});
    manager.Start();
    lifecycle.trackInterval(manager);
    lifecycle.disposeAll();
    expect(manager.Destroyed).toBe(true);
  });

  it('trackWhentil cancels the task on dispose', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.When(true, cb, 10);
    lifecycle.trackWhentil(task);
    vi.advanceTimersByTime(15);
    expect(cb).toHaveBeenCalledTimes(1);
    lifecycle.disposeAll();
    vi.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('trackObserver disconnects on dispose', () => {
    const observer = new MutationObserver(() => {});
    const disconnect = vi.spyOn(observer, 'disconnect');
    lifecycle.trackObserver(observer);
    lifecycle.disposeAll();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('registerGlobalTeardown persists teardown on window and disposeAll clears it', () => {
    lifecycle.registerGlobalTeardown();
    const teardown = (window as unknown as Record<string, unknown>).__amaiLyricsTeardown;
    expect(typeof teardown).toBe('function');
    lifecycle.disposeAll();
    expect((window as unknown as Record<string, unknown>).__amaiLyricsTeardown).toBeUndefined();
  });
});
