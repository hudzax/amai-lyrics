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
 * NOTE on imports: this module deliberately does not import fetchLyrics,
 * api, or processing — it is a leaf they all share, so the pipeline keeps a
 * single direction (fetchLyrics -> api -> processing -> publish).
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import Event from '../EventManager';
import { HideLoaderContainer, ClearLyricsPageContainer } from './ui';
import { updateDisplayedLyricsWithTranslations } from './translationUpdater';
import type { LyricsData } from './conversion';

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
 * Publishes freshly loaded lyrics (cache, storage, or first API paint):
 * domain state, persisted snapshot, bus notification, and loader teardown.
 * Returns false without touching anything when the request went stale.
 */
export function publishInitialLyrics(token: LyricsRequestToken, data: LyricsData): boolean {
  if (!isCurrentLyricsRequest(token)) return false;
  Defaults.CurrentLyricsType = data.Type;
  const serialized = JSON.stringify(data);
  storage.set('currentLyricsData', serialized);
  Event.evoke('lyrics:data-updated', serialized);
  HideLoaderContainer();
  ClearLyricsPageContainer();
  return true;
}

/**
 * Publishes the async AI enhancement (phonetics + translations) in place,
 * preserving element identity, scroll, and animation state. Returns false
 * without touching anything when the request went stale.
 */
export function publishEnhancedLyrics(
  token: LyricsRequestToken,
  trackId: string,
  data: LyricsData,
): boolean {
  if (!isCurrentLyricsRequest(token)) return false;
  if (liveLyricsUri()?.split(':')[2] !== trackId) return false;
  updateDisplayedLyricsWithTranslations(data);
  const serialized = JSON.stringify(data);
  storage.set('currentLyricsData', serialized);
  Event.evoke('lyrics:data-updated', serialized);
  return true;
}
