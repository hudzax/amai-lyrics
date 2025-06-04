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
} from './ui';

import { LyricsData } from './processing';

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
export async function cacheLyrics(
  trackId: string,
  lyricsJson: LyricsData,
): Promise<void> {
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
): Promise<(CachedLyricsData & { fromCache: boolean }) | string | null> {
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
    console.log('Error parsing saved lyrics data:', error);
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
): Promise<LyricsData | string | null> {
  const savedLyricsData = storage.get('currentLyricsData')?.toString();
  if (!savedLyricsData) return null;

  try {
    if (savedLyricsData.includes('NO_LYRICS')) {
      const split = savedLyricsData.split(':');
      const id = split[1];
      if (id === trackId) {
        return await noLyricsMessage();
      }
    } else {
      const lyricsData = JSON.parse(savedLyricsData);
      if (lyricsData?.id === trackId) {
        HideLoaderContainer();
        ClearLyricsPageContainer();
        Defaults.CurrentLyricsType = lyricsData.Type;
        return lyricsData;
      }
    }
  } catch (error) {
    console.error('Error parsing saved lyrics data:', error);
    HideLoaderContainer();
    ClearLyricsPageContainer();
  }

  return null;
}
