import { describe, it, expect } from 'vitest';
import fastdom from 'fastdom';
import { installFastdomErrorHandler, measureAsync, mutateAsync } from '../src/utils/fastdomAsync';

// Note: fastdom falls back to setTimeout(16) in jsdom (no window.rAF), so
// these promises resolve on real timers without any rAF stubbing.

describe('fastdomAsync', () => {
  it('installFastdomErrorHandler routes batch errors to console.error', () => {
    installFastdomErrorHandler();
    installFastdomErrorHandler(); // idempotent — second call is a no-op
    expect(typeof fastdom.catch).toBe('function');
  });

  it('measureAsync resolves with the callback return value', async () => {
    await expect(measureAsync(() => 42)).resolves.toBe(42);
  });

  it('mutateAsync resolves with the callback return value', async () => {
    await expect(mutateAsync(() => 'done')).resolves.toBe('done');
  });

  it('measureAsync rejects instead of hanging when the callback throws', async () => {
    await expect(
      measureAsync(() => {
        throw new Error('boom-measure');
      }),
    ).rejects.toThrow('boom-measure');
  });

  it('mutateAsync rejects instead of hanging when the callback throws', async () => {
    await expect(
      mutateAsync(() => {
        throw new Error('boom-mutate');
      }),
    ).rejects.toThrow('boom-mutate');
  });
});
