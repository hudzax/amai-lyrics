import { describe, it, expect, vi, afterEach } from 'vitest';
import Whentil from '../src/utils/Whentil';

afterEach(() => {
  vi.useRealTimers();
});

describe('Whentil.When', () => {
  it('fires once when the condition is already true', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.When(true, cb);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(true);
    task.Cancel();
  });

  it('polls until a function condition becomes true', () => {
    vi.useFakeTimers();
    let ready = false;
    const cb = vi.fn();
    const task = Whentil.When(() => ready, cb);

    vi.advanceTimersByTime(100);
    expect(cb).not.toHaveBeenCalled();

    ready = true;
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    task.Cancel();
  });

  it('repeats the callback for repeater > 1', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.When(true, cb, 3);
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(3);
    task.Cancel();
  });

  it('Cancel stops further executions', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.When(true, cb, 5);
    vi.advanceTimersByTime(15);
    expect(cb).toHaveBeenCalledTimes(1);
    task.Cancel();
    vi.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('Reset restarts a finished task', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.When(true, cb, 1);
    vi.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(1);
    task.Reset();
    // Reset re-runs synchronously
    expect(cb).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(2);
    task.Cancel();
  });
});

describe('Whentil.Until', () => {
  it('invokes the callback while the condition is falsy', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.Until(false, cb, 3);
    vi.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(3);
    task.Cancel();
  });

  it('stops invoking once the condition becomes truthy', () => {
    vi.useFakeTimers();
    let done = false;
    const cb = vi.fn(() => {
      done = true;
    });
    const task = Whentil.Until(() => done, cb);
    vi.advanceTimersByTime(50);
    expect(cb).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    // done is now true, so no further callbacks
    expect(cb).toHaveBeenCalledTimes(1);
    task.Cancel();
  });

  it('supports a plain truthy statement with no callbacks', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.Until('ready' as unknown as boolean, cb, 5);
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
    task.Cancel();
  });

  it('Cancel halts a pending Until', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const task = Whentil.Until(false, cb);
    task.Cancel();
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });
});
