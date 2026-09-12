/**
 * Amai Lyrics - Lyrics fetching and processing module (refactored)
 *
 * This module handles fetching, processing, and displaying lyrics for Spotify tracks.
 */

import {
  resetLyricsUI,
  ClearLyricsPageContainer,
  ShowLoaderContainer,
  noLyricsMessage,
} from './ui';
import { getLyricsFromLocalStorage, getLyricsFromCache, lyricsCache } from './cache';
import { fetchLyricsFromAPI } from './api';
import { hideRefreshButton } from '../../components/Pages/pageButtons';
import ApplyLyrics from './Global/Applyer';
import {
  beginLyricsRequest,
  publishInitialLyrics,
  liveLyricsUri,
  type LyricsRequestToken,
} from './publish';

import { LyricsData } from './conversion';
import { NoLyricsResult } from './ui';

export type LyricsFetchResult = LyricsData | NoLyricsResult;

export function isNoLyricsResult(v: LyricsFetchResult): v is NoLyricsResult {
  return typeof v === 'object' && v !== null && (v as NoLyricsResult).status === 'NO_LYRICS';
}

// Per-track in-flight fetches. Keyed by trackId so duplicate requests for the
// same track share a single promise (dedupe), while fetches for *different*
// tracks run fully concurrently. This replaces the old global `currentlyFetching`
// boolean lock, which serialized every fetch and let a slow fetch for one song
// block the lyrics of another when seeking.
const inFlight = new Map<string, Promise<LyricsFetchResult>>();

// ==============================
// Main Export Function
// ==============================

/**
 * Turns a freshly loaded lyrics payload (from cache, localStorage, or an
 * explicit NO_LYRICS sentinel) into the app's UI + state transitions, then
 * returns it. Centralizes what the cache reads used to do inline so the cache
 * layer stays a pure read.
 */
async function applyLoadedLyrics(
  result: LyricsFetchResult,
  token: LyricsRequestToken,
): Promise<LyricsFetchResult> {
  if (isNoLyricsResult(result)) {
    return await noLyricsMessage(result.id);
  }

  // Single publication seam: currency check, domain state, snapshot,
  // bus notification (the playbar overlay syncs off this), loader teardown.
  publishInitialLyrics(token, result);
  return result;
}

/**
 * Main function to fetch lyrics for a given Spotify track URI
 *
 * @param uri - Spotify track URI
 * @returns Processed lyrics data or typed NO_LYRICS sentinel
 */
export default async function fetchLyrics(uri: string, flush = false): Promise<LyricsFetchResult> {
  if (!uri || typeof uri !== 'string' || !uri.includes(':')) {
    return await noLyricsMessage();
  }
  // Stamp the request before the first await: any earlier request is stale
  // from here on, no matter where its continuations land.
  const token = beginLyricsRequest(uri);
  resetLyricsUI();
  ClearLyricsPageContainer();
  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
    ?.classList.remove('LyricsHidden');

  const trackId = uri.split(':')[2] ?? '';
  if (!trackId) {
    return await noLyricsMessage();
  }

  const localLyrics = await getLyricsFromLocalStorage(trackId);
  if (localLyrics) return applyLoadedLyrics(localLyrics, token);

  const cachedLyrics = await getLyricsFromCache(trackId);
  if (cachedLyrics) return applyLoadedLyrics(cachedLyrics, token);

  // Hide refresh button during fetch
  hideRefreshButton();

  // Dedupe: if a fetch for this exact track is already in flight (and we're not
  // forcing a fresh fetch via `flush`), reuse its promise instead of launching
  // a second identical request. Different tracks are never blocked by each other.
  if (!flush && inFlight.has(trackId)) {
    return inFlight.get(trackId)!;
  }

  ShowLoaderContainer();

  const promise = fetchLyricsFromAPI(trackId, flush, token).finally(() => {
    // Only clear our own entry; a newer request for the same track may have
    // replaced it in the map (e.g. a `flush` refresh overlapping a normal fetch).
    if (inFlight.get(trackId) === promise) inFlight.delete(trackId);
  });
  inFlight.set(trackId, promise);
  return promise;
}

/**
 * The pipeline's single composition: fetch, then apply to the page.
 * Replaces the six hand-rolled `fetchLyrics(uri).then(ApplyLyrics)` chains
 * (app init/online, PageView, pageButtons, settings, SongChangeManager) and
 * the applyer's self-refetch back-edge: when the track moved mid-flight and
 * the applyer declines, the pipeline retries once for the live track instead
 * of the applyer calling back into the fetch seam.
 */
export async function loadAndApplyLyrics(
  uri: string,
  opts: { flush?: boolean } = {},
): Promise<LyricsFetchResult> {
  let target = uri;
  let flush = opts.flush ?? false;
  let last: LyricsFetchResult = await noLyricsMessage();
  for (let attempt = 0; attempt < 2; attempt++) {
    last = await fetchLyrics(target, flush);
    flush = false; // only the explicit request is ever forced
    if (isNoLyricsResult(last)) return last;
    if (ApplyLyrics(last)) return last;
    const live = liveLyricsUri();
    if (!live || live === target) return last;
    target = live;
  }
  return last;
}

export { lyricsCache };
