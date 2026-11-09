import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@hudzax/web-modules/SpikyCache', () => import('./helpers/fakeSpikyCache'));

import { createBoundedCache } from '../src/utils/BoundedCache';
import { FakeSpikyCache, storeFor, resetFakeSpikyCache } from './helpers/fakeSpikyCache';

const WINDOW_KEY = '__amaiTestBoundedCacheKeys';

function makeCache(maxEntries = 2, ttlMs = 60_000) {
  return createBoundedCache<{ n: number }>({
    name: 'TestCache',
    maxEntries,
    ttlMs,
    windowKey: WINDOW_KEY,
  });
}

beforeEach(() => {
  resetFakeSpikyCache();
  Reflect.deleteProperty(window, WINDOW_KEY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createBoundedCache', () => {
  it('returns null on a miss', async () => {
    const cache = makeCache();
    await expect(cache.get('absent')).resolves.toBeNull();
  });

  it('round-trips a value through set and get', async () => {
    const cache = makeCache();
    await cache.set('a', { n: 1 });
    await expect(cache.get('a')).resolves.toEqual({ n: 1 });
  });

  it('evicts the oldest key once past the cap', async () => {
    const cache = makeCache(2);
    await cache.set('a', { n: 1 });
    await cache.set('b', { n: 2 });
    await cache.set('c', { n: 3 });
    await expect(cache.get('a')).resolves.toBeNull();
    await expect(cache.get('b')).resolves.toEqual({ n: 2 });
    await expect(cache.get('c')).resolves.toEqual({ n: 3 });
  });

  it('re-setting a key refreshes its place in the order', async () => {
    const cache = makeCache(2);
    await cache.set('a', { n: 1 });
    await cache.set('b', { n: 2 });
    await cache.set('a', { n: 9 });
    await cache.set('c', { n: 3 });
    await expect(cache.get('a')).resolves.toEqual({ n: 9 });
    await expect(cache.get('b')).resolves.toBeNull();
    await expect(cache.get('c')).resolves.toEqual({ n: 3 });
  });

  it('reads an expired entry as a miss and evicts it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const cache = makeCache(2, 5_000);
    await cache.set('a', { n: 1 });
    vi.setSystemTime(1_006_000);
    await expect(cache.get('a')).resolves.toBeNull();
    expect(storeFor('TestCache').has('a')).toBe(false);
    await cache.set('a', { n: 2 });
    await expect(cache.get('a')).resolves.toEqual({ n: 2 });
  });

  it('reads a corrupt entry as a miss, not an error', async () => {
    const cache = makeCache();
    FakeSpikyCache.instances[0].get = async () => {
      throw new Error('corrupt');
    };
    await expect(cache.get('a')).resolves.toBeNull();
  });

  it('reads a pre-envelope entry as a miss and evicts it', async () => {
    const cache = makeCache();
    storeFor('TestCache').set('legacy', { Content: 'old', expiresIn: Date.now() + 100_000 });
    await expect(cache.get('legacy')).resolves.toBeNull();
    expect(storeFor('TestCache').has('legacy')).toBe(false);
  });

  it('reads an envelope with no value as a miss and evicts it', async () => {
    const cache = makeCache();
    storeFor('TestCache').set('broken', {
      __amaiBoundedCache: 1,
      expiresAt: Date.now() + 100_000,
    });
    await expect(cache.get('broken')).resolves.toBeNull();
    expect(storeFor('TestCache').has('broken')).toBe(false);
  });

  it('shares the key order across instances via the window namespace', async () => {
    const first = makeCache(2);
    await first.set('a', { n: 1 });
    await first.set('b', { n: 2 });
    const second = makeCache(2);
    await second.set('c', { n: 3 });
    await expect(second.get('a')).resolves.toBeNull();
    await expect(second.get('b')).resolves.toEqual({ n: 2 });
    await expect(second.get('c')).resolves.toEqual({ n: 3 });
  });

  it('trims a persisted key order longer than the cap on the next write', async () => {
    // SAFETY: test-only window namespace written by BoundedCache.
    const windowRef = window as unknown as Record<string, string[] | undefined>;
    windowRef[WINDOW_KEY] = ['a', 'b', 'c', 'd'];
    const cache = makeCache(2);
    await cache.set('e', { n: 5 });
    expect(windowRef[WINDOW_KEY]).toHaveLength(2);
  });

  it('remove frees the order slot for a later write', async () => {
    const cache = makeCache(2);
    await cache.set('a', { n: 1 });
    await cache.set('b', { n: 2 });
    await cache.remove('b');
    await cache.set('c', { n: 3 });
    await expect(cache.get('a')).resolves.toEqual({ n: 1 });
    await expect(cache.get('b')).resolves.toBeNull();
    await expect(cache.get('c')).resolves.toEqual({ n: 3 });
  });

  it('destroy clears the entries and accepts writes again', async () => {
    const cache = makeCache(2);
    await cache.set('a', { n: 1 });
    await cache.set('b', { n: 2 });
    await cache.destroy();
    await expect(cache.get('a')).resolves.toBeNull();
    await expect(cache.get('b')).resolves.toBeNull();
    await cache.set('c', { n: 3 });
    await expect(cache.get('c')).resolves.toEqual({ n: 3 });
  });
});
