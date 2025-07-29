/**
 * Amai Lyrics - Lyrics fetching and processing module (refactored)
 *
 * This module handles fetching, processing, and displaying lyrics for Spotify tracks.
 */

import storage from '../storage';
import { resetLyricsUI, ClearLyricsPageContainer, ShowLoaderContainer } from './ui';
import { getLyricsFromLocalStorage, getLyricsFromCache, lyricsCache } from './cache';
import { fetchLyricsFromAPI } from './api';
import { hideRefreshButton } from '../../components/Pages/pageButtons';

import { LyricsData } from './processing';

// ==============================
// Main Export Function
// ==============================

/**
 * Main function to fetch lyrics for a given Spotify track URI
 *
 * @param uri - Spotify track URI
 * @returns Processed lyrics data or error message
 */
export default async function fetchLyrics(uri: string): Promise<LyricsData | string> {
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

  const currFetching = storage.get('currentlyFetching');
  if (currFetching === 'true') {
    Spicetify.showNotification('Currently fetching, please wait..');
    return 'Currently fetching lyrics';
  }

  storage.set('currentlyFetching', 'true');

  ShowLoaderContainer();
  return await fetchLyricsFromAPI(trackId);
}

export { lyricsCache };
