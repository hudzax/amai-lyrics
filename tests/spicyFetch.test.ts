import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@hudzax/web-modules/SpikyCache', () => import('./helpers/fakeSpikyCache'));
vi.mock('../src/components/Global/Platform', () => ({
  default: { GetSpotifyAccessToken: vi.fn(async () => 'token') },
}));

import SpicyFetch, { SPICY_FETCH_CACHE_OPTIONS } from '../src/utils/API/SpicyFetch';
import { createBoundedCache } from '../src/utils/BoundedCache';
import { storeFor, resetFakeSpikyCache } from './helpers/fakeSpikyCache';

const URL = 'https://api.example.com/lyrics?track=1';
const WINDOW_KEY = SPICY_FETCH_CACHE_OPTIONS.windowKey;
const PAYLOAD = { hello: 'world' };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetFakeSpikyCache();
  Reflect.deleteProperty(window, WINDOW_KEY);
  fetchMock = vi.fn(async () => ({ status: 200, json: async () => PAYLOAD }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Whatever key the adapter wrote, so fixtures never mirror its md5 derivation.
function onlyStoredKey(): string {
  const keys = Array.from(storeFor(SPICY_FETCH_CACHE_OPTIONS.name).keys());
  expect(keys).toHaveLength(1);
  return keys[0];
}

describe('SpicyFetch disk cache', () => {
  it('serves a repeated request from the disk cache without refetching', async () => {
    const first = await SpicyFetch(URL, false, true);
    expect(first).toEqual([PAYLOAD, 200]);
    const second = await SpicyFetch(URL, false, true);
    expect(second).toEqual([PAYLOAD, 200]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reads a legacy uncompressed entry as a miss and refetches', async () => {
    await SpicyFetch(URL, false, true);
    storeFor(SPICY_FETCH_CACHE_OPTIONS.name).set(onlyStoredKey(), {
      Content: [{ legacy: true }, 200],
      expiresIn: Date.now() + 100_000,
    });
    fetchMock.mockClear();

    const result = await SpicyFetch(URL, false, true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([PAYLOAD, 200]);
  });

  it('reads an oversized stored entry as a miss and refetches', async () => {
    await SpicyFetch(URL, false, true);
    const writer = createBoundedCache<string>(SPICY_FETCH_CACHE_OPTIONS);
    await writer.set(onlyStoredKey(), 'x'.repeat(2 * 1024 * 1024 + 1));
    fetchMock.mockClear();

    const result = await SpicyFetch(URL, false, true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([PAYLOAD, 200]);
  });
});
