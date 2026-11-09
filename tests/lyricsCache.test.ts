import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@hudzax/web-modules/SpikyCache', () => import('./helpers/fakeSpikyCache'));

import {
  cacheLyrics,
  getLyricsFromCache,
  removeLyricsFromCache,
  destroyLyricsCache,
  LYRICS_CACHE_OPTIONS,
} from '../src/utils/Lyrics/cache';
import { createBoundedCache } from '../src/utils/BoundedCache';
import { storeFor, resetFakeSpikyCache } from './helpers/fakeSpikyCache';
import type {
  LyricsDocument,
  NoLyricsResult,
  StoredLyricsDocument,
} from '../src/utils/Lyrics/conversion';

const WINDOW_KEY = LYRICS_CACHE_OPTIONS.windowKey;

beforeEach(() => {
  resetFakeSpikyCache();
  Reflect.deleteProperty(window, WINDOW_KEY);
});

const document: LyricsDocument = {
  type: 'Static',
  id: 'track1',
  lines: [{ text: 'hello' }],
};

// A second adapter instance writing through the real module, so fixtures
// never hand-spell the module's private envelope.
function cacheWriter<T>() {
  return createBoundedCache<T>(LYRICS_CACHE_OPTIONS);
}

describe('getLyricsFromCache (pure read)', () => {
  it('returns null on a cache miss', async () => {
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
  });

  it('returns the cached document without storage metadata', async () => {
    await cacheLyrics('track1', document);
    const result = await getLyricsFromCache('track1');
    expect(result).toEqual(document);
  });

  it('removes and returns null for an entry written by an older format version', async () => {
    // Pre-v2 entries carry the old `Type`/`Content` shape and no version
    // stamp; they must be evicted so the caller re-fetches instead of
    // receiving a document it cannot decode.
    storeFor(LYRICS_CACHE_OPTIONS.name).set('track1', {
      id: 'track1',
      Type: 'Line',
      Content: [],
      expiresAt: Date.now() + 100000,
    });
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
    expect(storeFor(LYRICS_CACHE_OPTIONS.name).has('track1')).toBe(false);
  });

  it('evicts an enveloped entry whose document version cannot decode', async () => {
    await cacheWriter<StoredLyricsDocument>().set('track1', { v: 1, type: 'Line', lines: [] });
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
    expect(storeFor(LYRICS_CACHE_OPTIONS.name).has('track1')).toBe(false);
  });

  it('returns an explicit NO_LYRICS sentinel for a cached NO_LYRICS entry', async () => {
    await cacheWriter<NoLyricsResult>().set('track1', { status: 'NO_LYRICS', id: 'track1' });
    await expect(getLyricsFromCache('track1')).resolves.toEqual({
      status: 'NO_LYRICS',
      id: 'track1',
    });
  });
});

describe('cache lifecycle', () => {
  it('removeLyricsFromCache evicts a single track', async () => {
    await cacheLyrics('track1', document);
    await removeLyricsFromCache('track1');
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
  });

  it('destroyLyricsCache empties the whole cache', async () => {
    await cacheLyrics('track1', document);
    await cacheLyrics('track2', { ...document, id: 'track2' });
    await destroyLyricsCache();
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
    await expect(getLyricsFromCache('track2')).resolves.toBeNull();
  });
});
