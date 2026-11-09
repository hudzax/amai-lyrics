/**
 * Lyrics disk-cache functions for Amai Lyrics (BoundedCache adapter).
 *
 * Pure storage layer: these functions read and write the per-track disk cache
 * but never touch the DOM or app-wide UI state. The caller (fetchLyrics) owns
 * turning a cache hit/miss into loader and page-container transitions. Bounding,
 * TTL and reload persistence live in BoundedCache; this adapter owns only the
 * stored value's encoding: the document version stamp and the NO_LYRICS rule.
 * The persisted snapshot of the *current* track is not this module's business —
 * it lives behind the `snapshot` leaf (LyricsSnapshot).
 */

import { createBoundedCache } from '../BoundedCache';
import { stampDocument, toDocument } from './conversion';
import type { LyricsDocument, NoLyricsResult, StoredLyricsDocument } from './conversion';

export const LYRICS_CACHE_OPTIONS = {
  name: 'Cache_Lyrics',
  maxEntries: 200,
  ttlMs: 1000 * 60 * 60 * 24 * 7, // 7 days
  windowKey: '__amaiLyricsCacheKeys',
};

const cache = createBoundedCache<StoredLyricsDocument | NoLyricsResult>(LYRICS_CACHE_OPTIONS);

/**
 * Caches processed lyrics for future use
 *
 * @param trackId - Spotify track ID
 * @param document - Processed lyrics document
 */
export async function cacheLyrics(trackId: string, document: LyricsDocument): Promise<void> {
  try {
    await cache.set(trackId, stampDocument(document));
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
): Promise<LyricsDocument | NoLyricsResult | null> {
  try {
    const stored = await cache.get(trackId);
    if (!stored) return null;

    if ('status' in stored && stored.status === 'NO_LYRICS') {
      return { status: 'NO_LYRICS', id: trackId };
    }

    const document = toDocument(stored);
    if (!document) {
      // Written by an older format version: evict and re-fetch rather than
      // hand the pipeline a document its reader cannot decode.
      await cache.remove(trackId);
      return null;
    }

    return document;
  } catch (error) {
    // A corrupt entry is a miss, not "no lyrics": let the caller fall through
    // to the API instead of pinning the page to an empty state.
    console.log('[Amai Lyrics] Error parsing saved lyrics data:', error);
    return null;
  }
}

// Remove lyrics from cache
export async function removeLyricsFromCache(trackId: string): Promise<void> {
  try {
    await cache.remove(trackId);
  } catch (error) {
    console.error('Error removing lyrics from cache:', error);
  }
}

// Evict the whole lyrics cache (the invalidate-all entry).
export async function destroyLyricsCache(): Promise<void> {
  await cache.destroy();
}
