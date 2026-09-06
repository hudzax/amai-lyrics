import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Animator from '../src/utils/Animator';

const realRaf = globalThis.requestAnimationFrame;
const realCancel = globalThis.cancelAnimationFrame;

beforeAll(() => {
  // jsdom has no requestAnimationFrame — drive it with timers instead
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number =>
    setTimeout(
      () => cb(performance.now()),
      16,
    ) as unknown as number) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number): void => {
    clearTimeout(id);
  }) as typeof cancelAnimationFrame;
});

afterAll(() => {
  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCancel;
  vi.restoreAllMocks();
});

function waitForFinish(animator: Animator): Promise<void> {
  return new Promise((resolve) => animator.on('finish', () => resolve()));
}

describe('Animator', () => {
  it('emits progress and finish', async () => {
    const animator = new Animator(0, 100, 0.03);
    const progress: number[] = [];
    animator.on('progress', (p) => progress.push(p));
    const done = waitForFinish(animator);
    animator.Start();
    await done;
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBeCloseTo(100, 0);
    animator.Destroy();
  });

  it('Pause emits pause and Resume emits resume then finishes', async () => {
    const animator = new Animator(0, 10, 0.05);
    const events: string[] = [];
    animator.on('pause', () => events.push('pause'));
    animator.on('resume', () => events.push('resume'));
    const done = waitForFinish(animator);
    animator.Start();
    animator.Pause();
    expect(events).toEqual(['pause']);
    animator.Resume();
    expect(events).toEqual(['pause', 'resume']);
    await done;
    animator.Destroy();
  });

  it('Reverse toggles direction and emits reverse', () => {
    const animator = new Animator(0, 10, 1);
    const cb = vi.fn();
    animator.on('reverse', cb);
    expect(animator.reversed).toBe(false);
    animator.Reverse();
    expect(animator.reversed).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
    animator.Destroy();
  });

  it('Restart emits restart', () => {
    const animator = new Animator(0, 10, 1);
    const cb = vi.fn();
    animator.on('restart', cb);
    animator.Start();
    animator.Restart();
    expect(cb).toHaveBeenCalledTimes(1);
    animator.Destroy();
  });

  it('Destroy emits destroy and blocks further activity', async () => {
    const animator = new Animator(0, 10, 0.02);
    const destroyed = vi.fn();
    const progress = vi.fn();
    animator.on('destroy', destroyed);
    animator.on('progress', progress);
    const done = waitForFinish(animator);
    animator.Start();
    await done;
    animator.Destroy();
    expect(destroyed).toHaveBeenCalledTimes(1);
    const calls = progress.mock.calls.length;
    // Starting a destroyed animator is a no-op
    animator.Start();
    animator.Restart();
    animator.Reverse();
    await new Promise((r) => setTimeout(r, 40));
    expect(progress.mock.calls.length).toBe(calls);
  });
});
