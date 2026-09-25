/**
 * Single owner of lyrics-request currency and UI publication.
 *
 * The fetch pipeline used to guard staleness in three places (an `isCurrent`
 * flag threaded through api/processing, a `latestUri` field in
 * SongChangeManager, and track-id re-checks in the applyer) and performed the
 * same display epilogue twice (cache path vs enhancement path — the cache path
 * even forgot the `lyrics:data-updated` evoke, leaving the playbar overlay
 * stale after cache hits). Every publication now flows through this module
 * behind a request token: stale requests resolve their data but never touch
 * UI, storage, or the event bus.
 *
 * Currency state is window-persisted so a hot-reload orphan (a fetch started
 * by the previous injection) can never publish over the new instance.
 *
 * Track-id parsing lives in the leaf `trackId` module (zero imports, no
 * cycle): callers import `parseTrackId` / `liveTrackId` from there directly.
 *
 * NOTE on imports: this module deliberately does not import fetchLyrics,
 * api, or processing — it is a leaf they all share, so the pipeline keeps a
 * single direction (fetchLyrics -> api -> processing -> publish). The
 * snapshot's serialized format lives in the `snapshot` leaf (LyricsSnapshot);
 * this module owns currency, the bus notification, and the UI epilogue.
 */

import Defaults from '../../components/Global/Defaults';
import Event from '../EventManager';
import { HideLoaderContainer, ClearLyricsPageContainer } from './ui';
import { updateLyricTranslations } from './LyricsRenderer';
import { writeSnapshot } from './snapshot';
import { liveTrackId } from './trackId';
import type { LyricsDocument } from './conversion';
import type { NoLyricsResult } from './ui';

/** Opaque handle for one lyrics request (fetch or refresh). */
export type LyricsRequestToken = number;

// SAFETY: window augmentation for hot-reload persistence; __amaiLyricsRequest is our isolated namespace
const windowRef = window as unknown as {
  __amaiLyricsRequest?: { token: LyricsRequestToken; uri: string };
};
const sharedRequest = (windowRef.__amaiLyricsRequest ??= { token: 0, uri: '' });

/** Live track URI straight from the player — the ground truth for currency. */
export function liveLyricsUri(): string | null {
  try {
    const uri = Spicetify?.Player?.data?.item?.uri;
    return typeof uri === 'string' && uri.includes(':') ? uri : null;
  } catch {
    return null;
  }
}

/**
 * Opens a lyrics request for `uri` and marks every earlier request stale.
 * Call once per user-visible load (song change, page open, refresh, retry).
 */
export function beginLyricsRequest(uri: string): LyricsRequestToken {
  sharedRequest.token += 1;
  sharedRequest.uri = uri;
  return sharedRequest.token;
}

/**
 * True while `token` is still the latest request AND the player hasn't moved
 * to a different track without opening a new request (e.g. podcast with no
 * lyrics). Async continuations check this before publishing anything.
 */
export function isCurrentLyricsRequest(token: LyricsRequestToken): boolean {
  if (sharedRequest.token !== token) return false;
  return liveLyricsUri() === sharedRequest.uri;
}

/**
 * True while no newer request has been opened, ignoring player movement.
 *
 * Deliberately narrower than isCurrentLyricsRequest: the pipeline's render
 * guard must yield only to a *newer request*, which now owns the page. A
 * mid-flight track change is what the pipeline's single retry exists for, and
 * swallowing that case here would drop the retry.
 */
export function isLatestLyricsRequest(token: LyricsRequestToken | null): boolean {
  return token !== null && sharedRequest.token === token;
}

/**
 * Publishes the negative result: persists the typed NO_LYRICS sentinel and
 * fires the same bus notification as the positive path. Without this, the
 * playbar overlay kept rendering the previous track's line after a track with
 * no lyrics — it syncs off the bus event, not the snapshot. Returns false
 * without touching anything when the request went stale.
 */
export function publishNoLyrics(token: LyricsRequestToken, trackId: string): boolean {
  if (!isCurrentLyricsRequest(token)) return false;
  const sentinel: NoLyricsResult = { status: 'NO_LYRICS', id: trackId };
  const serialized = writeSnapshot(sentinel);
  Event.evoke('lyrics:data-updated', serialized);
  return true;
}

/**
 * Publishes freshly loaded lyrics (cache, storage, or first API paint):
 * domain state, persisted snapshot, bus notification, and loader teardown.
 * Returns false without touching anything when the request went stale.
 */
export function publishInitialLyrics(token: LyricsRequestToken, document: LyricsDocument): boolean {
  if (!isCurrentLyricsRequest(token)) return false;
  Defaults.CurrentLyricsType = document.type;
  const serialized = writeSnapshot(document);
  Event.evoke('lyrics:data-updated', serialized);
  HideLoaderContainer();
  ClearLyricsPageContainer();
  return true;
}

/**
 * Publishes the async AI enhancement (phonetics + translations) in place,
 * preserving element identity, scroll, and animation state. The renderer reads
 * the lines it already painted — enhancement mutated those same line objects —
 * so nothing needs to be handed across. Returns false without touching
 * anything when the request went stale.
 */
export function publishEnhancedLyrics(
  token: LyricsRequestToken,
  trackId: string,
  document: LyricsDocument,
): boolean {
  if (!isCurrentLyricsRequest(token)) return false;
  if (liveTrackId() !== trackId) return false;
  updateLyricTranslations();
  const serialized = writeSnapshot(document);
  Event.evoke('lyrics:data-updated', serialized);
  return true;
}
