/**
 * LyricsSnapshot — the single owner of the published-lyrics snapshot
 * (`currentLyricsData`): its serialized format, the legacy plain-string
 * `NO_LYRICS:<id>` form, the sentinel rule, the track gate, the seconds→ms
 * scaling, and the Syllable→Line shape.
 *
 * Before this module the snapshot was a wire blob written in four places and
 * hand-parsed in three readers (the pipeline's storage read, the playbar
 * overlay, and the fullscreen exit path), each re-deriving the sentinel rule,
 * the legacy fallback, and the units independently. Every read and write of
 * the key now crosses this module.
 *
 * Leaf module by design (storage, conversion, Event, and type-only imports):
 * the fetch pipeline, the publish seam, and UI consumers all import it
 * directly without a cycle.
 *
 * Notification contract: `lyrics:data-updated` is a pure "the snapshot
 * changed" event. Publishers evoke it themselves with the serialized payload
 * returned by `writeSnapshot` (currency and side effects stay in publish);
 * `clearSnapshot` notifies on its own because its callers — refresh and
 * invalidate — are not publishers. The playbar overlay listens for the
 * notification and invalidates this module's parse memo.
 */

import storage from '../storage';
import Event from '../EventManager';
import { convertLyrics } from './conversion';
import type { LyricsData } from './conversion';
import type { NoLyricsResult } from './ui';
import type { TimedLine } from './findActiveIndex';

const SNAPSHOT_KEY = 'currentLyricsData';

/** A timed lyric line in render-path units: ms, display text. */
export interface SnapshotTimedLine extends TimedLine {
  text: string;
}

/** Result of decoding the stored payload — the sentinel rule lives right here. */
type ParsedSnapshot =
  { kind: 'lyrics'; data: LyricsData } | { kind: 'noLyrics'; id?: string } | null;

interface RawSnapshotPayload {
  id?: string;
  status?: string;
  Type?: string;
  Content?: unknown;
}

interface RawTimedItem {
  StartTime?: number | null;
  EndTime?: number | null;
  Text?: string;
}

function isNoLyricsSentinel(value: LyricsData | NoLyricsResult): value is NoLyricsResult {
  return (value as NoLyricsResult).status === 'NO_LYRICS';
}

function parseSnapshotPayload(raw: string): ParsedSnapshot {
  try {
    const parsed = JSON.parse(raw) as RawSnapshotPayload;
    if (parsed?.status === 'NO_LYRICS') {
      return { kind: 'noLyrics', id: parsed.id || undefined };
    }
    if (parsed?.id) {
      return { kind: 'lyrics', data: parsed as unknown as LyricsData };
    }
    return null;
  } catch {
    // Fallback for legacy plain-string payloads (old `NO_LYRICS:<id>` format).
    if (raw.includes('NO_LYRICS')) {
      const legacyId = raw.split(':')[1]?.replace(/[^a-zA-Z0-9]/g, '') || undefined;
      return { kind: 'noLyrics', id: legacyId };
    }
    return null;
  }
}

// Parse memo keyed on the raw string's content: a hot-path tick is one
// storage.get plus a string comparison. The read is never skipped, so a
// change made outside this module (another window, a missed notification)
// is picked up on the next read — the memo can only lag by a tick at worst.
let memoRaw: string | null = null;
let memoParsed: ParsedSnapshot = null;
let memoValid = false;

function readRaw(): string | null {
  try {
    return storage.get(SNAPSHOT_KEY)?.toString() ?? null;
  } catch {
    return null;
  }
}

function readParsed(): ParsedSnapshot {
  const raw = readRaw();
  if (memoValid && raw === memoRaw) return memoParsed;
  memoRaw = raw;
  memoParsed = raw ? parseSnapshotPayload(raw) : null;
  memoValid = true;
  return memoParsed;
}

/** Drops the parse memo so the next read decodes storage again. */
export function invalidateSnapshotCache(): void {
  memoValid = false;
}

// ==============================
// Writers
// ==============================

/**
 * Serializes and persists the snapshot. Returns the serialized payload so the
 * publisher can carry it on the `lyrics:data-updated` notification — the
 * evoke itself stays with the publisher, whose currency check guards it.
 */
export function writeSnapshot(data: LyricsData | NoLyricsResult): string {
  const serialized = JSON.stringify(data);
  storage.set(SNAPSHOT_KEY, serialized);
  invalidateSnapshotCache();
  return serialized;
}

/**
 * Clears the persisted snapshot and notifies consumers. Used by the refresh
 * and invalidation paths: a cleared snapshot must not leave the playbar
 * freezing on the previous track's line, so this evokes the notification
 * itself (its callers are not publishers).
 */
export function clearSnapshot(): void {
  storage.set(SNAPSHOT_KEY, null);
  invalidateSnapshotCache();
  Event.evoke('lyrics:data-updated', null);
}

// ==============================
// Readers
// ==============================

/**
 * Reads the snapshot as the pipeline sees it: the typed payload when it is
 * for `trackId`, the sentinel when one is published for this track (or its
 * id was unrecoverable from a legacy payload), and null on any miss —
 * including stale payloads for another track and unparseable content.
 */
export function readSnapshot(trackId: string): LyricsData | NoLyricsResult | null {
  const parsed = readParsed();
  if (!parsed) return null;
  if (parsed.kind === 'noLyrics') {
    if (!parsed.id || parsed.id === trackId) {
      return { status: 'NO_LYRICS', id: parsed.id ?? trackId };
    }
    return null;
  }
  return parsed.data.id === trackId ? parsed.data : null;
}

/**
 * Ungated sentinel check for the fullscreen exit path, which only ever runs
 * against the live track: true when the snapshot is a NO_LYRICS payload
 * (typed or legacy), false otherwise.
 */
export function isPublishedNoLyrics(): boolean {
  return readParsed()?.kind === 'noLyrics';
}

/**
 * Timed lines for `trackId` in render-path units (ms), Syllable payloads
 * normalized to lines. Null for a missing/stale/sentinel snapshot, Static
 * lyrics (no timing information), and snapshots with no usable lines.
 */
export function publishedTimedLines(trackId: string): SnapshotTimedLine[] | null {
  const snapshot = readSnapshot(trackId);
  if (!snapshot || isNoLyricsSentinel(snapshot)) return null;

  // Dispatch on the raw payload view, not the typed union: legacy snapshots
  // can carry Type 'Syllable' even though the current model is Line | Static.
  const payload = snapshot as RawSnapshotPayload;
  if (!Array.isArray(payload.Content)) return null;

  let items: RawTimedItem[];
  if (payload.Type === 'Line') {
    items = payload.Content as RawTimedItem[];
  } else if (payload.Type === 'Syllable') {
    items = convertLyrics(payload.Content as unknown as Parameters<typeof convertLyrics>[0]);
  } else {
    // Static lyrics have no timing information
    return null;
  }

  const lines: SnapshotTimedLine[] = [];
  for (const item of items) {
    if (item.StartTime == null || item.EndTime == null) continue;
    const text = (item.Text || '').trim();
    if (!text) continue;
    lines.push({
      text,
      StartTime: item.StartTime * 1000,
      EndTime: item.EndTime * 1000,
    });
  }
  return lines.length ? lines : null;
}
