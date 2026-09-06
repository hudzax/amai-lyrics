import { describe, it, expect, vi, afterEach } from 'vitest';
import { debounce, debounceAsync } from '../src/utils/debounce';

afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('invokes once with the last args after the delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    debounced('c');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('restarts the delay on each call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(80);
    debounced();
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel prevents the pending invocation', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('debounceAsync', () => {
  it('coalesces rapid calls and resolves all callers with the last result', async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async (v: string) => `done:${v}`);
    const debounced = debounceAsync(fn, 100);

    const p1 = debounced('a');
    const p2 = debounced('b');
    expect(fn).not.toHaveBeenCalled();

    const flush = (async () => {
      vi.advanceTimersByTime(100);
      // let the async fn settle
      await Promise.resolve();
      await Promise.resolve();
    })();
    await flush;
    await expect(p1).resolves.toBe('done:b');
    await expect(p2).resolves.toBe('done:b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('rejects all pending callers when the invocation fails', async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => {
      throw new Error('boom');
    });
    const debounced = debounceAsync(fn, 50);

    const p1 = debounced();
    const p2 = debounced();
    // Attach handlers before the rejection settles to avoid unhandled rejections
    const assertion = Promise.all([p1, p2].map((p) => expect(p).rejects.toThrow('boom')));

    vi.advanceTimersByTime(50);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel resolves pending callers with undefined and drops the invocation', async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => 'never');
    const debounced = debounceAsync(fn, 100);

    const p = debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);
    await expect(p).resolves.toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });
});
