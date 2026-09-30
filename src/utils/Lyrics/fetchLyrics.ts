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
  EnsureProcessingIndicatorHidden,
  clearLyricsUiTimeouts,
} from './ui';
import { getLyricsFromCache, removeLyricsFromCache, lyricsCache } from './cache';
import { readSnapshot, clearSnapshot } from './snapshot';
import { fetchLyricsFromAPI } from './api';
import { enhancePreparedLyrics } from './processing';
import { hideRefreshButton } from '../../components/Pages/pageButtons';
import ApplyLyrics from './Global/Applyer';
import {
  beginLyricsRequest,
  isLatestLyricsRequest,
  publishInitialLyrics,
  publishNoLyrics,
  liveLyricsUri,
  type LyricsRequestToken,
} from './publish';
import { parseTrackId } from './trackId';

import { LyricsDocument, NoLyricsResult } from './conversion';

export type LyricsFetchResult = LyricsDocument | NoLyricsResult;

/**
 * Out-param reporting the request token `fetchLyrics` stamped. The pipeline
 * needs it to know, after the await, whether it still owns the render — a
 * request superseded by a newer one must not paint. `null` means the uri was
 * rejected before any request was opened.
 */
export interface LyricsRequestRef {
  token: LyricsRequestToken | null;
}

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
 * The pipeline's single outcome step: every result — snapshot hit, cache hit,
 * joined fetch, fresh fetch — crosses this once. Publishes the positive
 * document or the negative sentinel (an id-less sentinel is an ephemeral
 * failure and persists nothing), then runs the page-visible transitions, and
 * returns the result. Producers stay pure: api, cache, and snapshot return
 * typed outcomes and never touch the page.
 */
async function applyLoadedLyrics(
  result: LyricsFetchResult,
  token: LyricsRequestToken,
): Promise<LyricsFetchResult> {
  if (isNoLyricsResult(result)) {
    // The negative result crosses the same publication seam as the positive
    // one: sentinel + bus event first (the playbar overlay syncs off the bus
    // event, not the snapshot; publishNoLyrics gates on currency itself). The
    // page-visible transitions then run only for the request that still owns
    // the render — the same newer-request-wins rule the positive render guard
    // applies at the composition — so a joined fetch runs them once, not once
    // per waiter.
    if (result.id) publishNoLyrics(token, result.id);
    if (isLatestLyricsRequest(token)) await noLyricsMessage(result.id);
    return result;
  }

  // Single publication seam: currency check, domain state, snapshot,
  // bus notification (the playbar overlay syncs off this), loader teardown.
  publishInitialLyrics(token, result);
  return result;
}

/**
 * Main function to fetch lyrics for a given Spotify track URI
 *
 * LyricsPipeline seam: callers pass the full Spotify URI — track-id parsing,
 * currency stamping, loader handling, and the stuck-indicator guard all live
 * behind this interface, never in callers.
 *
 * @param uri - Spotify track URI
 * @param flush - Force a fresh fetch, bypassing the in-flight dedupe
 * @param requestRef - Optional out-param receiving the token stamped for this
 *   request, so the caller can check whether it still owns the render
 * @returns Processed lyrics data or typed NO_LYRICS sentinel
 */
export default async function fetchLyrics(
  uri: string,
  flush = false,
  requestRef: LyricsRequestRef = { token: null },
): Promise<LyricsFetchResult> {
  if (!uri || typeof uri !== 'string' || !uri.includes(':')) {
    // Pre-request defensive exit: no token exists yet, so the transitions run
    // ungated — nothing newer can have claimed the render.
    await noLyricsMessage();
    return { status: 'NO_LYRICS' };
  }
  // Stamp the request before the first await: any earlier request is stale
  // from here on, no matter where its continuations land.
  const token = beginLyricsRequest(uri);
  requestRef.token = token;
  resetLyricsUI();
  ClearLyricsPageContainer();
  // A stuck processing indicator from a previous track must never survive
  // into the new request — the pipeline owns this guard so song-change
  // callers don't cross the ui seam directly.
  EnsureProcessingIndicatorHidden();
  document
    .querySelector<HTMLElement>('#AmaiLyricsPage .ContentBox')
    ?.classList.remove('LyricsHidden');

  const trackId = parseTrackId(uri);
  if (!trackId) {
    await noLyricsMessage();
    return { status: 'NO_LYRICS' };
  }

  const localLyrics = readSnapshot(trackId);
  if (localLyrics) return applyLoadedLyrics(localLyrics, token);

  const cachedLyrics = await getLyricsFromCache(trackId);
  if (cachedLyrics) return applyLoadedLyrics(cachedLyrics, token);

  // Hide refresh button during fetch
  hideRefreshButton();

  // Dedupe: if a fetch for this exact track is already in flight (and we're not
  // forcing a fresh fetch via `flush`), reuse its promise instead of launching
  // a second identical request. Different tracks are never blocked by each other.
  if (!flush && inFlight.has(trackId)) {
    // Joining stamps a newer token, so every publish the originator attempts
    // under its own token no-ops as stale. Re-publish under this token once the
    // shared promise settles, or the loader is never hidden — the stuck loader
    // seen on startup when the startup fetch and the PageView open fetch race
    // for the same track.
    ShowLoaderContainer();
    const result = await inFlight.get(trackId)!;
    const applied = await applyLoadedLyrics(result, token);
    // The same supersession strands the originator's enhancement gate, so this
    // request owns the enhancement or the track never gets translations.
    if (!isNoLyricsResult(result)) {
      void enhancePreparedLyrics(token, result.id ?? trackId, result);
    }
    return applied;
  }

  ShowLoaderContainer();

  const promise = fetchLyricsFromAPI(trackId, flush, token).finally(() => {
    // Only clear our own entry; a newer request for the same track may have
    // replaced it in the map (e.g. a `flush` refresh overlapping a normal fetch).
    if (inFlight.get(trackId) === promise) inFlight.delete(trackId);
  });
  inFlight.set(trackId, promise);
  // The in-flight map holds the raw fetch so joiners can share it; this
  // request still applies its own outcome — the fresh path gets no exemption
  // from the one publication point.
  return applyLoadedLyrics(await promise, token);
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
  let last: LyricsFetchResult = { status: 'NO_LYRICS' };
  for (let attempt = 0; attempt < 2; attempt++) {
    const requestRef: LyricsRequestRef = { token: null };
    last = await fetchLyrics(target, flush, requestRef);
    flush = false; // only the explicit request is ever forced
    if (isNoLyricsResult(last)) return last;
    // A request that a newer one superseded must not paint. renderLyrics
    // appends into the container without clearing it, so two pipelines
    // rendering the same track duplicate every line and leave the registry
    // bound to the second copy — no visible highlight, and a scroll target
    // that no longer matches what is on screen. This is the startup race
    // between the player poll and PageView.Open, which both load the live track.
    if (!isLatestLyricsRequest(requestRef.token)) return last;
    if (ApplyLyrics(last)) return last;
    const live = liveLyricsUri();
    if (!live || live === target) return last;
    target = live;
  }
  return last;
}

/**
 * Refresh seam: evict cache + snapshot, then force a fresh fetch-and-apply.
 * Replaces the hand-rolled `removeLyricsFromCache + storage.set(null) +
 * loadAndApplyLyrics(flush:true)` triple (the refresh button) so callers never
 * cross the cache or snapshot seams directly.
 */
export async function refreshLyrics(uri: string): Promise<LyricsFetchResult> {
  const trackId = parseTrackId(uri);
  if (trackId) {
    await removeLyricsFromCache(trackId);
  }
  clearSnapshot();
  return loadAndApplyLyrics(uri, { flush: true });
}

/**
 * Invalidation seam: evicts cached lyrics and clears the persisted snapshot.
 *
 * Replaces the hand-rolled `lyricsCache.destroy() + storage.set(null)` pair
 * that settings handlers and startup used to inline — callers now state intent
 * ("config changed → invalidate, and reload with the new settings") instead of
 * crossing the cache and snapshot seams themselves. Reload re-fetches with
 * `flush`, because an invalidated entry must never be served from an in-flight
 * fetch that predates the invalidation.
 */
export async function invalidateLyrics(
  target: { all: true } | { trackId: string },
  opts: { reload?: boolean } = {},
): Promise<void> {
  if ('all' in target) {
    await lyricsCache.destroy();
  } else {
    await removeLyricsFromCache(target.trackId);
  }
  clearSnapshot();

  if (opts.reload) {
    const uri = liveLyricsUri();
    if (uri) await loadAndApplyLyrics(uri, { flush: true });
  }
}

export { clearLyricsUiTimeouts };
