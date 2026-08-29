/**
 * API functions for fetching lyrics from Spotify
 */

import Platform from '../../components/Global/Platform';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { getLyrics, LyricsResult } from '../API/Lyrics';
import { ClearLyricsPageContainer, noLyricsMessage, NoLyricsResult } from './ui';
import { processAndEnhanceLyrics, LyricsData } from './processing';

/**
 * Fetches lyrics from Spotify API and processes them
 *
 * @param trackId - Spotify track ID
 * @returns Processed lyrics data or typed NO_LYRICS sentinel
 */
export async function fetchLyricsFromAPI(
  trackId: string,
  flush = false,
): Promise<LyricsData | NoLyricsResult> {
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

    // Cheaper short-circuit for skipped tracks: if the user has already moved
    // off this track, skip the expensive Gemini enhancement (phonetics +
    // translations). The basic lyrics are still cached so a re-seek is fast.
    const isCurrent = SpotifyPlayer.GetSongId() === trackId;

    // Process and enhance lyrics
    return await processAndEnhanceLyrics(trackId, lyricsJson, isCurrent);
  } catch (error) {
    // Log error with detailed information
    console.error(
      'Error fetching lyrics:',
      error instanceof Error ? { message: error.message, stack: error.stack } : error,
    );

    ClearLyricsPageContainer();
    return await noLyricsMessage();
  }
}

/**
 * Handles API error status codes with improved status code handling
 *
 * @param status - HTTP status code
 * @returns Typed NO_LYRICS sentinel
 */
export async function handleErrorStatus(status: number): Promise<NoLyricsResult> {
  // Clear any loading state
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
    // NOTE: 'Syllable' responses are accepted here and converted to 'Line' on
    // ingest in processing.ts — the syllable renderer has been removed.
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
    return true;
  }

  return false;
}
