import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@hudzax/web-modules/SpikyCache', () => ({
  SpikyCache: class {
    get = vi.fn(async () => null);
    set = vi.fn(async () => {});
    remove = vi.fn(async () => {});
    destroy = vi.fn(async () => {});
  },
}));
vi.mock('../src/components/Global/Defaults', () => ({
  default: { CurrentLyricsType: 'None' },
}));
vi.mock('../src/utils/Lyrics/ui', () => ({
  HideLoaderContainer: vi.fn(),
  ClearLyricsPageContainer: vi.fn(),
  noLyricsMessage: vi.fn(async (id?: string) => ({ status: 'NO_LYRICS', id })),
}));

import Defaults from '../src/components/Global/Defaults';
import { noLyricsMessage } from '../src/utils/Lyrics/ui';
import { getLyricsFromCache, lyricsCache } from '../src/utils/Lyrics/cache';

const mockedNoLyrics = vi.mocked(noLyricsMessage);

beforeEach(() => {
  vi.clearAllMocks();
  (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'None';
});

describe('getLyricsFromCache (pure read)', () => {
  it('returns null on a cache miss', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue(null);
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
  });

  it('returns the cached lyrics marked fromCache when not expired', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue({
      v: 2,
      id: 'track1',
      type: 'Line',
      lines: [],
      expiresAt: Date.now() + 100000,
    } as never);
    const result = await getLyricsFromCache('track1');
    expect(result).toMatchObject({ id: 'track1', type: 'Line', fromCache: true });
  });

  it('removes and returns null for an expired entry', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue({
      v: 2,
      id: 'track1',
      type: 'Line',
      lines: [],
      expiresAt: Date.now() - 1000,
    } as never);
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
    expect(lyricsCache.remove).toHaveBeenCalledWith('track1');
  });

  it('removes and returns null for an entry written by an older format version', async () => {
    // Pre-v2 entries carry the old `Type`/`Content` shape and no version
    // stamp; they must be evicted so the caller re-fetches instead of
    // receiving a document it cannot decode.
    vi.mocked(lyricsCache.get).mockResolvedValue({
      id: 'track1',
      Type: 'Line',
      Content: [],
      expiresAt: Date.now() + 100000,
    } as never);
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
    expect(lyricsCache.remove).toHaveBeenCalledWith('track1');
  });

  it('returns an explicit NO_LYRICS sentinel for a cached NO_LYRICS entry', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue({
      status: 'NO_LYRICS',
      id: 'track1',
      expiresAt: Date.now() + 100000,
    } as never);
    await expect(getLyricsFromCache('track1')).resolves.toEqual({
      status: 'NO_LYRICS',
      id: 'track1',
    });
  });

  it('returns null (miss) when the cached entry fails to parse', async () => {
    vi.mocked(lyricsCache.get).mockImplementation(async () => {
      throw new Error('corrupt');
    });
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });
});
