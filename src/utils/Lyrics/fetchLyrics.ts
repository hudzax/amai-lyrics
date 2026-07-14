/**
 * Amai Lyrics - Lyrics fetching and processing module (refactored)
 *
 * This module handles fetching, processing, and displaying lyrics for Spotify tracks.
 */

import { resetLyricsUI, ClearLyricsPageContainer, ShowLoaderContainer } from './ui';
import { getLyricsFromLocalStorage, getLyricsFromCache, lyricsCache } from './cache';
import { fetchLyricsFromAPI } from './api';
import { hideRefreshButton } from '../../components/Pages/pageButtons';

import { LyricsData } from './processing';

// Per-track in-flight fetches. Keyed by trackId so duplicate requests for the
// same track share a single promise (dedupe), while fetches for *different*
// tracks run fully concurrently. This replaces the old global `currentlyFetching`
// boolean lock, which serialized every fetch and let a slow fetch for one song
// block the lyrics of another when seeking.
const inFlight = new Map<string, Promise<LyricsData | string>>();

// ==============================
// Main Export Function
// ==============================

/**
 * Main function to fetch lyrics for a given Spotify track URI
 *
 * @param uri - Spotify track URI
 * @returns Processed lyrics data or error message
 */
export default async function fetchLyrics(
  uri: string,
  flush = false,
): Promise<LyricsData | string> {
  resetLyricsUI();
  ClearLyricsPageContainer();
  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
    ?.classList.remove('LyricsHidden');

  const trackId = uri.split(':')[2];

  const localLyrics = await getLyricsFromLocalStorage(trackId);
  if (localLyrics) return localLyrics;

  const cachedLyrics = await getLyricsFromCache(trackId);
  if (cachedLyrics) return cachedLyrics;

  // Hide refresh button during fetch
  hideRefreshButton();

  // Dedupe: if a fetch for this exact track is already in flight (and we're not
  // forcing a fresh fetch via `flush`), reuse its promise instead of launching
  // a second identical request. Different tracks are never blocked by each other.
  if (!flush && inFlight.has(trackId)) {
    return inFlight.get(trackId)!;
  }

  ShowLoaderContainer();

  const promise = fetchLyricsFromAPI(trackId, flush).finally(() => {
    // Only clear our own entry; a newer request for the same track may have
    // replaced it in the map (e.g. a `flush` refresh overlapping a normal fetch).
    if (inFlight.get(trackId) === promise) inFlight.delete(trackId);
  });
  inFlight.set(trackId, promise);
  return promise;
}

export { lyricsCache };
