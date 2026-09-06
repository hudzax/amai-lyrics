import { describe, it, expect, vi, afterEach } from 'vitest';
import { IntervalManager } from '../src/utils/IntervalManager';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('IntervalManager', () => {
  it('throws on NaN duration', () => {
    expect(() => new IntervalManager(NaN, () => {})).toThrow();
  });

  it('treats Infinity as immediate (0ms)', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const manager = new IntervalManager(Infinity, cb);
    manager.Start();
    vi.advanceTimersByTime(0);
    expect(cb).toHaveBeenCalled();
    manager.Destroy();
  });

  it('ticks repeatedly at the given seconds interval', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const manager = new IntervalManager(0.1, cb);
    manager.Start();
    expect(manager.Running).toBe(true);
    vi.advanceTimersByTime(350);
    expect(cb).toHaveBeenCalledTimes(3);
    manager.Destroy();
  });

  it('warns and keeps a single chain on double Start', () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cb = vi.fn();
    const manager = new IntervalManager(0.1, cb);
    manager.Start();
    manager.Start();
    expect(warn).toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(cb).toHaveBeenCalledTimes(1);
    manager.Destroy();
  });

  it('Stop halts further ticks', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const manager = new IntervalManager(0.1, cb);
    manager.Start();
    vi.advanceTimersByTime(150);
    expect(cb).toHaveBeenCalledTimes(1);
    manager.Stop();
    expect(manager.Running).toBe(false);
    vi.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(1);
    manager.Destroy();
  });

  it('Restart resumes ticking', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const manager = new IntervalManager(0.1, cb);
    manager.Start();
    vi.advanceTimersByTime(150);
    manager.Restart();
    vi.advanceTimersByTime(150);
    expect(cb).toHaveBeenCalledTimes(2);
    manager.Destroy();
  });

  it('Destroy marks destroyed and blocks Start', () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cb = vi.fn();
    const manager = new IntervalManager(0.1, cb);
    manager.Start();
    manager.Destroy();
    expect(manager.Destroyed).toBe(true);
    expect(manager.Running).toBe(false);
    manager.Start();
    expect(warn).toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(cb).not.toHaveBeenCalled();
  });

  it('double Destroy warns instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const manager = new IntervalManager(1, () => {});
    manager.Destroy();
    manager.Destroy();
    expect(warn).toHaveBeenCalled();
  });
});
