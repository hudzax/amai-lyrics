/**
 * API functions for fetching lyrics from Spotify
 */

import storage from '../storage';
import Platform from '../../components/Global/Platform';
import { getLyrics } from '../API/Lyrics';
import { ClearLyricsPageContainer, noLyricsMessage } from './ui';
import { processAndEnhanceLyrics } from './processing';

/**
 * Fetches lyrics from Spotify API and processes them
 *
 * @param trackId - Spotify track ID
 * @returns Processed lyrics data or error message
 */
export async function fetchLyricsFromAPI(
  trackId: string,
): Promise<any | string> {
  try {
    Spicetify.showNotification('Fetching lyrics..', false, 1000);

    const spotifyAccessToken = await Platform.GetSpotifyAccessToken();

    const getLyricsResult = await getLyrics(trackId, {
      Authorization: `Bearer ${spotifyAccessToken}`,
    });

    let lyricsJson = getLyricsResult.response;
    const status = getLyricsResult.status;

    if (
      !lyricsJson ||
      (typeof lyricsJson === 'object' && !('id' in lyricsJson))
    ) {
      lyricsJson = '';
    }

    if (status !== 200) {
      return await handleErrorStatus(status);
    }

    if (lyricsJson === null) return await noLyricsMessage(trackId);
    if (lyricsJson === '') return await noLyricsMessage(trackId);

    return await processAndEnhanceLyrics(trackId, lyricsJson);
  } catch (error) {
    console.error('Error fetching lyrics:', error?.message, error?.stack);
    storage.set('currentlyFetching', 'false');
    ClearLyricsPageContainer();
    return await noLyricsMessage();
  }
}

/**
 * Handles API error status codes
 *
 * @param status - HTTP status code
 * @returns Error message
 */
export async function handleErrorStatus(status: number): Promise<string> {
  if (status === 401) {
    storage.set('currentlyFetching', 'false');
    return await noLyricsMessage();
  }

  ClearLyricsPageContainer();
  return await noLyricsMessage();
}
