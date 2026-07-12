/**
 * API functions for fetching lyrics from Spotify
 */

import storage from '../storage';
import Platform from '../../components/Global/Platform';
import { getLyrics, LyricsResult } from '../API/Lyrics';
import { ClearLyricsPageContainer, noLyricsMessage } from './ui';
import { processAndEnhanceLyrics, LyricsData } from './processing';

/**
 * Fetches lyrics from Spotify API and processes them
 *
 * @param trackId - Spotify track ID
 * @returns Processed lyrics data or error message
 */
export async function fetchLyricsFromAPI(
  trackId: string,
  flush = false,
): Promise<LyricsData | string> {
  try {
    const spotifyAccessToken = await Platform.GetSpotifyAccessToken();

    // Fetch lyrics from API
    const { response: lyricsJson, status } = await getLyrics(
      trackId,
      {
        Authorization: `Bearer ${spotifyAccessToken}`,
      },
      flush,
    );

    // Handle non-200 status codes
    if (status !== 200) {
      return await handleErrorStatus(status);
    }

    // Validate lyrics content
    if (!isValidLyricsResponse(lyricsJson)) {
      return await noLyricsMessage(trackId);
    }

    // Process and enhance lyrics
    return await processAndEnhanceLyrics(trackId, lyricsJson);
  } catch (error) {
    // Log error with detailed information
    console.error(
      'Error fetching lyrics:',
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error,
    );

    storage.set('currentlyFetching', 'false');
    ClearLyricsPageContainer();
    return await noLyricsMessage();
  }
}

/**
 * Handles API error status codes with improved status code handling
 *
 * @param status - HTTP status code
 * @returns Error message
 */
export async function handleErrorStatus(status: number): Promise<string> {
  // Clear any loading state
  storage.set('currentlyFetching', 'false');
  ClearLyricsPageContainer();

  // Log the error for diagnostics
  console.warn(`Lyrics API error: HTTP status ${status}`);

  return await noLyricsMessage();
}

/**
 * Validates if the lyrics response contains usable data
 *
 * @param lyricsJson - Response from lyrics API
 * @returns boolean indicating if response contains valid lyrics
 */
function isValidLyricsResponse(lyricsJson: LyricsResult): boolean {
  // Check for null or undefined response
  if (lyricsJson === null || lyricsJson === undefined) {
    return false;
  }

  // Check for valid object structure
  if (typeof lyricsJson === 'object') {
    // Must have an ID property for Spotify track identification
    if (!('id' in lyricsJson)) {
      return false;
    }

    // Check for content based on lyrics type
    const type = lyricsJson.Type as string;

    if (type === 'Syllable' || type === 'Line') {
      const content = lyricsJson.Content;
      if (!Array.isArray(content) || content.length === 0) {
        return false;
      }
    } else if (type === 'Static') {
      const lines = lyricsJson.Lines;
      if (!Array.isArray(lines) || lines.length === 0) {
        return false;
      }
    }
    // If type is not Syllable, Line, or Static, or if content/lines are valid, return true
    return true;
  }

  return false;
}
