/**
 * Lyrics caching and storage functions for Amai Lyrics
 */

import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import {
  HideLoaderContainer,
  ClearLyricsPageContainer,
  noLyricsMessage,
  NoLyricsResult,
} from './ui';

import { LyricsData } from './processing';

export type LyricsFetchResult = LyricsData | NoLyricsResult;

type CachedLyricsData = LyricsData & {
  expiresAt: number;
};

// Cache expiration time: 7 days in milliseconds
const CACHE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7;

export const lyricsCache = new SpikyCache({
  name: 'Cache_Lyrics',
});

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
  } catch (error) {
    console.error('Error saving lyrics to cache:', error);
  }
}

/**
 * Gets lyrics from cache
 *
 * @param trackId - Spotify track ID
 * @returns Cached lyrics or null
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
      return await noLyricsMessage();
    }

    storage.set('currentLyricsData', JSON.stringify(lyricsFromCache));
    HideLoaderContainer();
    ClearLyricsPageContainer();
    Defaults.CurrentLyricsType = lyricsFromCache.Type;

    return { ...lyricsFromCache, fromCache: true };
  } catch (error) {
    ClearLyricsPageContainer();
    console.log('[Amai Lyrics] Error parsing saved lyrics data:', error);
    return await noLyricsMessage();
  }
}

/**
 * Gets lyrics from local storage
 *
 * @param trackId - Spotify track ID
 * @returns Stored lyrics or null
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
        return await noLyricsMessage(parsed.id ?? trackId);
      }
      return null;
    }
    if (parsed?.id === trackId) {
      HideLoaderContainer();
      ClearLyricsPageContainer();
      Defaults.CurrentLyricsType = parsed.Type as never;
      return parsed as LyricsData;
    }
  } catch (error) {
    // Fallback for legacy plain-string payloads (e.g. old NO_LYRICS:xxx format)
    if (savedLyricsData.includes('NO_LYRICS')) {
      try {
        const legacySplit = savedLyricsData.split(':');
        const legacyId = legacySplit[1]?.replace(/[^a-zA-Z0-9]/g, '');
        if (!legacyId || legacyId === trackId) {
          return await noLyricsMessage(legacyId ?? trackId);
        }
      } catch {
        /* ignore legacy parse failure */
      }
    }
    console.error('Error parsing saved lyrics data:', error);
    HideLoaderContainer();
    ClearLyricsPageContainer();
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
