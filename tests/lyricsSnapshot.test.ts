import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));
vi.mock('../src/utils/EventManager', () => ({
  default: { listen: vi.fn(), unListen: vi.fn(), evoke: vi.fn() },
}));

import storage from '../src/utils/storage';
import Event from '../src/utils/EventManager';
import {
  readSnapshot,
  isPublishedNoLyrics,
  publishedTimedLines,
  writeSnapshot,
  clearSnapshot,
  invalidateSnapshotCache,
} from '../src/utils/Lyrics/snapshot';

const mockedStorage = vi.mocked(storage);
const mockedEvent = vi.mocked(Event);

/** Point the storage stub at `raw` and reset the parse memo. */
function setStored(raw: string | null): void {
  mockedStorage.get.mockReturnValue(raw);
  invalidateSnapshotCache();
}

/** Back the storage stub with a variable so writes are readable again. */
function faithfulStorage(): void {
  let raw: string | null = null;
  mockedStorage.get.mockImplementation(() => raw);
  mockedStorage.set.mockImplementation((_key, value) => {
    raw = value;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedStorage.get.mockReturnValue(null);
  invalidateSnapshotCache();
});

describe('writeSnapshot / clearSnapshot (sole writers of the key)', () => {
  it('serializes, persists, and returns the payload for the publisher to evoke', () => {
    const serialized = writeSnapshot({ status: 'NO_LYRICS', id: 'track1' });
    expect(serialized).toBe(JSON.stringify({ status: 'NO_LYRICS', id: 'track1' }));
    expect(mockedStorage.set).toHaveBeenCalledWith('currentLyricsData', serialized);
  });

  it('readSnapshot sees a written snapshot without an explicit invalidation', () => {
    faithfulStorage();

    writeSnapshot({ id: 'track1', Type: 'Line', Content: [] } as never);
    expect(readSnapshot('track1')).toMatchObject({ id: 'track1', Type: 'Line' });
  });

  it('clearSnapshot persists null and notifies consumers', () => {
    faithfulStorage();
    writeSnapshot({ id: 'track1', Type: 'Line', Content: [] } as never);
    expect(readSnapshot('track1')).toMatchObject({ id: 'track1' });

    clearSnapshot();

    expect(mockedStorage.set).toHaveBeenCalledWith('currentLyricsData', null);
    expect(mockedEvent.evoke).toHaveBeenCalledWith('lyrics:data-updated', null);
    expect(readSnapshot('track1')).toBeNull();
  });
});

describe('readSnapshot (track-gated pipeline view)', () => {
  it('returns null when nothing is stored', () => {
    setStored(null);
    expect(readSnapshot('track1')).toBeNull();
  });

  it('returns stored lyrics for the matching track id', () => {
    setStored(JSON.stringify({ id: 'track1', Type: 'Line', Content: [] }));
    expect(readSnapshot('track1')).toMatchObject({ id: 'track1', Type: 'Line' });
  });

  it('returns null for a different track id', () => {
    setStored(JSON.stringify({ id: 'other', Type: 'Line' }));
    expect(readSnapshot('track1')).toBeNull();
  });

  it('returns the sentinel for a matching NO_LYRICS payload', () => {
    setStored(JSON.stringify({ status: 'NO_LYRICS', id: 'track1' }));
    expect(readSnapshot('track1')).toEqual({ status: 'NO_LYRICS', id: 'track1' });
  });

  it('ignores a NO_LYRICS sentinel for another track', () => {
    setStored(JSON.stringify({ status: 'NO_LYRICS', id: 'other' }));
    expect(readSnapshot('track1')).toBeNull();
  });

  it('matches any track when the sentinel carries no id', () => {
    setStored(JSON.stringify({ status: 'NO_LYRICS' }));
    expect(readSnapshot('track1')).toEqual({ status: 'NO_LYRICS', id: 'track1' });
  });

  it('supports the legacy NO_LYRICS:<id> string format as a sentinel', () => {
    setStored('NO_LYRICS:track1');
    expect(readSnapshot('track1')).toEqual({ status: 'NO_LYRICS', id: 'track1' });
  });

  it('returns null for unparseable content', () => {
    setStored('not-json{{{');
    expect(readSnapshot('track1')).toBeNull();
  });
});

describe('isPublishedNoLyrics (ungated fullscreen check)', () => {
  it('is false when nothing is stored or the snapshot is positive', () => {
    setStored(null);
    expect(isPublishedNoLyrics()).toBe(false);
    setStored(JSON.stringify({ id: 'track1', Type: 'Line', Content: [] }));
    expect(isPublishedNoLyrics()).toBe(false);
  });

  it('is true for a sentinel snapshot regardless of track', () => {
    setStored(JSON.stringify({ status: 'NO_LYRICS', id: 'other' }));
    expect(isPublishedNoLyrics()).toBe(true);
  });

  it('is true for the legacy plain-string sentinel', () => {
    setStored('NO_LYRICS:track1');
    expect(isPublishedNoLyrics()).toBe(true);
  });
});

describe('publishedTimedLines (playbar view)', () => {
  it('scales seconds to ms, trims text, and skips untimed/blank lines', () => {
    setStored(
      JSON.stringify({
        id: 'track1',
        Type: 'Line',
        Content: [
          { StartTime: 1, EndTime: 2, Text: '  hello  ' },
          { StartTime: 3, EndTime: 4, Text: '   ' },
          { StartTime: null, EndTime: 5, Text: 'untimed' },
          { StartTime: 6, EndTime: 7, Text: 'world' },
        ],
      }),
    );

    expect(publishedTimedLines('track1')).toEqual([
      { text: 'hello', StartTime: 1000, EndTime: 2000 },
      { text: 'world', StartTime: 6000, EndTime: 7000 },
    ]);
  });

  it('normalizes a Syllable payload through the converter', () => {
    setStored(
      JSON.stringify({
        id: 'track1',
        Type: 'Syllable',
        Content: [
          {
            OppositeAligned: false,
            Lead: { Syllables: [{ Text: 'hello' }], StartTime: 1, EndTime: 2 },
          },
        ],
      }),
    );

    const lines = publishedTimedLines('track1');
    expect(lines).toHaveLength(1);
    expect(lines![0].text).toContain('hello');
    expect(lines![0].StartTime).toBe(1000);
    expect(lines![0].EndTime).toBe(2000);
  });

  it('is null for stale, sentinel, and static snapshots', () => {
    setStored(JSON.stringify({ id: 'other', Type: 'Line', Content: [] }));
    expect(publishedTimedLines('track1')).toBeNull();

    setStored(JSON.stringify({ status: 'NO_LYRICS', id: 'track1' }));
    expect(publishedTimedLines('track1')).toBeNull();

    setStored(JSON.stringify({ id: 'track1', Type: 'Static', Lines: [{ Text: 'hi' }] }));
    expect(publishedTimedLines('track1')).toBeNull();
  });

  it('is null when no line survives filtering', () => {
    setStored(JSON.stringify({ id: 'track1', Type: 'Line', Content: [{ Text: '  ' }] }));
    expect(publishedTimedLines('track1')).toBeNull();
  });
});

describe('parse memo', () => {
  it('parses once per stored string across repeated reads', () => {
    const raw = JSON.stringify({ id: 'track1', Type: 'Line', Content: [] });
    setStored(raw);
    const parseSpy = vi.spyOn(JSON, 'parse');

    readSnapshot('track1');
    readSnapshot('track1');
    publishedTimedLines('track1');

    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it('reparses after explicit invalidation', () => {
    const raw = JSON.stringify({ id: 'track1', Type: 'Line', Content: [] });
    setStored(raw);
    readSnapshot('track1');
    const parseSpy = vi.spyOn(JSON, 'parse');

    invalidateSnapshotCache();
    readSnapshot('track1');

    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it('picks up a store change without any notification (content compare)', () => {
    // Deliberately no invalidateSnapshotCache here: the memo keys on the
    // stored string's content, so an external write is picked up on the
    // next read.
    mockedStorage.get.mockReturnValue(JSON.stringify({ id: 'track1', Type: 'Line' }));
    invalidateSnapshotCache();
    expect(readSnapshot('other')).toBeNull();

    mockedStorage.get.mockReturnValue(JSON.stringify({ id: 'other', Type: 'Line' }));
    expect(readSnapshot('other')).toMatchObject({ id: 'other' });
  });
});
