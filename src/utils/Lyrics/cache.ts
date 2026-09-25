/**
 * Lyrics disk-cache functions for Amai Lyrics (SpikyCache layer).
 *
 * Pure storage layer: these functions read and write the per-track disk cache
 * but never touch the DOM or app-wide UI state. The caller (fetchLyrics) owns
 * turning a cache hit/miss into loader + page-container + CurrentLyricsType
 * transitions. The persisted snapshot of the *current* track is not this
 * module's business — it lives behind the `snapshot` leaf (LyricsSnapshot).
 */

import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import { stampDocument, toDocument } from './conversion';
import type { LyricsDocument } from './conversion';
import type { NoLyricsResult } from './ui';

type CachedLyricsData = LyricsDocument & {
  expiresAt: number;
};

// Cache expiration time: 7 days in milliseconds
const CACHE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7;

export const lyricsCache = new SpikyCache({
  name: 'Cache_Lyrics',
});

// Bounded LRU for Cache_API disk entries — prevents unbounded growth during long sessions
// (Cache_API is persistent disk, not RAM, but thousands of entries still bloat storage)
const MAX_LYRICS_CACHE_ENTRIES = 200;
// SAFETY: window augmentation for hot-reload persistence; __amaiLyricsCacheKeys is our isolated namespace
const windowCacheRef = window as unknown as { __amaiLyricsCacheKeys?: string[] };
const lyricsCacheKeyOrder: string[] = windowCacheRef.__amaiLyricsCacheKeys ?? [];
windowCacheRef.__amaiLyricsCacheKeys = lyricsCacheKeyOrder;

function trackLyricsCacheKey(trackId: string): void {
  const idx = lyricsCacheKeyOrder.indexOf(trackId);
  if (idx !== -1) lyricsCacheKeyOrder.splice(idx, 1);
  lyricsCacheKeyOrder.push(trackId);
  if (lyricsCacheKeyOrder.length > MAX_LYRICS_CACHE_ENTRIES) {
    const oldest = lyricsCacheKeyOrder.shift();
    if (oldest) {
      // Fire-and-forget eviction — don't block the critical cache-write path
      lyricsCache.remove(oldest).catch(() => {});
    }
  }
}

/**
 * Caches processed lyrics for future use
 *
 * @param trackId - Spotify track ID
 * @param document - Processed lyrics document
 */
export async function cacheLyrics(trackId: string, document: LyricsDocument): Promise<void> {
  if (!lyricsCache) return;

  const expiresAt = new Date().getTime() + CACHE_EXPIRATION_TIME;
  try {
    await lyricsCache.set(trackId, {
      ...stampDocument(document),
      expiresAt,
    });
    trackLyricsCacheKey(trackId);
  } catch (error) {
    console.error('Error saving lyrics to cache:', error);
  }
}

/**
 * Gets lyrics from cache (pure read — no DOM/UI side effects).
 *
 * @param trackId - Spotify track ID
 * @returns Cached lyrics, an explicit NO_LYRICS sentinel, or null (miss)
 */
export async function getLyricsFromCache(
  trackId: string,
): Promise<(CachedLyricsData & { fromCache: boolean }) | NoLyricsResult | null> {
  if (!lyricsCache) return null;

  try {
    const lyricsFromCache = await lyricsCache.get(trackId);
    if (!lyricsFromCache) return null;

    if (lyricsFromCache.expiresAt < new Date().getTime()) {
      await lyricsCache.remove(trackId);
      return null;
    }

    if (lyricsFromCache.status === 'NO_LYRICS') {
      return { status: 'NO_LYRICS', id: trackId };
    }

    const document = toDocument(lyricsFromCache);
    if (!document) {
      // Written by an older format version: evict and re-fetch rather than
      // hand the pipeline a document its reader cannot decode.
      await lyricsCache.remove(trackId);
      return null;
    }

    return { ...document, expiresAt: lyricsFromCache.expiresAt, fromCache: true };
  } catch (error) {
    // A corrupt entry is a miss, not "no lyrics": let the caller fall through
    // to the API instead of pinning the page to an empty state.
    console.log('[Amai Lyrics] Error parsing saved lyrics data:', error);
    return null;
  }
}

// Remove lyrics from cache
export async function removeLyricsFromCache(trackId: string): Promise<void> {
  if (!lyricsCache) return;

  try {
    await lyricsCache.remove(trackId);
  } catch (error) {
    console.error('Error removing lyrics from cache:', error);
  }
}
