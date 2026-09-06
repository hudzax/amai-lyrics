import { describe, it, expect } from 'vitest';
import sleep from '../src/utils/sleep';

describe('sleep', () => {
  it('resolves after the given seconds', async () => {
    await expect(sleep(0.001)).resolves.toBeUndefined();
  });

  it('waits at least the requested duration', async () => {
    const start = Date.now();
    await sleep(0.05);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});
