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

    // Fetch lyrics from API
    const { response: lyricsJson, status } = await getLyrics(trackId, {
      Authorization: `Bearer ${spotifyAccessToken}`,
    });

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
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );

    storage.set('currentlyFetching', 'false');
    ClearLyricsPageContainer();
    Spicetify.showNotification('Error loading lyrics', false, 2000);
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

  // Handle specific error codes
  switch (status) {
    case 401:
      Spicetify.showNotification('Authentication error', false, 2000);
      break;
    case 404:
      Spicetify.showNotification('Lyrics not found', false, 2000);
      break;
    case 429:
      Spicetify.showNotification('Rate limited, please try again later', false, 2000);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      Spicetify.showNotification('Lyrics service unavailable', false, 2000);
      break;
    default:
      // Generic error for other status codes
      Spicetify.showNotification(`Error fetching lyrics (${status})`, false, 2000);
  }

  return await noLyricsMessage();
}

/**
 * Validates if the lyrics response contains usable data
 * 
 * @param lyricsJson - Response from lyrics API
 * @returns boolean indicating if response contains valid lyrics
 */
function isValidLyricsResponse(lyricsJson: any): boolean {
  // Check for null or empty response
  if (lyricsJson === null || lyricsJson === '') {
    return false;
  }

  // Check for valid object structure
  if (typeof lyricsJson === 'object') {
    // Must have an ID property for Spotify track identification
    if (!('id' in lyricsJson)) {
      return false;
    }

    // Check for content based on lyrics type
    return !((lyricsJson.Type === 'Syllable' && (!lyricsJson.Content || lyricsJson.Content.length === 0)) ||
      (lyricsJson.Type === 'Line' && (!lyricsJson.Content || lyricsJson.Content.length === 0)) ||
      (lyricsJson.Type === 'Static' && (!lyricsJson.Lines || lyricsJson.Lines.length === 0)));


  }

  return false;
}
