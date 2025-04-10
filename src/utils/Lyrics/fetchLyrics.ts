/**
 * Amai Lyrics - Lyrics fetching and processing module (refactored)
 *
 * This module handles fetching, processing, and displaying lyrics for Spotify tracks.
 */

import storage from '../storage';
import {
  resetLyricsUI,
  ClearLyricsPageContainer,
  ShowLoaderContainer,
} from './ui';
import {
  getLyricsFromLocalStorage,
  getLyricsFromCache,
  lyricsCache,
} from './cache';
import { fetchLyricsFromAPI } from './api';

// ==============================
// Types
// ==============================

export interface Syllable {
  Text: string;
  StartTime?: number;
  EndTime?: number;
}

export interface LyricsLine {
  Type?: string;
  OppositeAligned?: boolean;
  Text: string;
  StartTime?: number;
  EndTime?: number;
  Translation?: string;
  Lead?: {
    StartTime: number;
    EndTime: number;
    Syllables: Syllable[];
  };
}

export interface LyricsData {
  id?: string;
  Type: string;
  Content?: LyricsLine[];
  Lines?: LyricsLine[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

export interface GeminiConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseModalities: any[];
  responseMimeType: string;
  responseSchema: any;
  systemInstruction: string;
}

export interface LyricsResponse {
  response: any;
  status: number;
}

// ==============================
// Constants
// ==============================

// Regular expressions for language detection
export const JAPANESE_REGEX =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
export const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

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
