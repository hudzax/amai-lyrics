/**
 * Lyrics caching and storage functions for Amai Lyrics
 *
 * Pure storage layer: these functions read and write lyrics data but never
 * touch the DOM or app-wide UI state. The caller (fetchLyrics) owns turning a
 * cache hit/miss into loader + page-container + CurrentLyricsType transitions.
 */

import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import storage from '../storage';
import type { LyricsData } from './conversion';
import type { NoLyricsResult } from './ui';

type CachedLyricsData = LyricsData & {
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
 * @param lyricsJson - Processed lyrics data
 */
export async function cacheLyrics(trackId: string, lyricsJson: LyricsData): Promise<void> {
  if (!lyricsCache) return;

  const expiresAt = new Date().getTime() + CACHE_EXPIRATION_TIME;
  try {
    await lyricsCache.set(trackId, {
      ...lyricsJson,
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

    return { ...lyricsFromCache, fromCache: true };
  } catch (error) {
    // A corrupt entry is a miss, not "no lyrics": let the caller fall through
    // to the API instead of pinning the page to an empty state.
    console.log('[Amai Lyrics] Error parsing saved lyrics data:', error);
    return null;
  }
}

/**
 * Gets lyrics from local storage (pure read — no DOM/UI side effects).
 *
 * @param trackId - Spotify track ID
 * @returns Stored lyrics, an explicit NO_LYRICS sentinel, or null (miss)
 */
export async function getLyricsFromLocalStorage(
  trackId: string,
): Promise<LyricsData | NoLyricsResult | null> {
  const savedLyricsData = storage.get('currentLyricsData')?.toString();
  if (!savedLyricsData) return null;

  try {
    const parsed = JSON.parse(savedLyricsData) as {
      status?: string;
      id?: string;
      Type?: string;
    };
    if (parsed?.status === 'NO_LYRICS') {
      if (!parsed.id || parsed.id === trackId) {
        return { status: 'NO_LYRICS', id: parsed.id ?? trackId };
      }
      return null;
    }
    if (parsed?.id === trackId) {
      return parsed as LyricsData;
    }
  } catch (error) {
    // Fallback for legacy plain-string payloads (e.g. old NO_LYRICS:xxx format)
    if (savedLyricsData.includes('NO_LYRICS')) {
      try {
        const legacySplit = savedLyricsData.split(':');
        const legacyId = legacySplit[1]?.replace(/[^a-zA-Z0-9]/g, '');
        if (!legacyId || legacyId === trackId) {
          return { status: 'NO_LYRICS', id: legacyId ?? trackId };
        }
      } catch {
        /* ignore legacy parse failure */
      }
    }
    console.error('Error parsing saved lyrics data:', error);
  }

  return null;
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
