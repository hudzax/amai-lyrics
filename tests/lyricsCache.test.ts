import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@hudzax/web-modules/SpikyCache', () => ({
  SpikyCache: class {
    get = vi.fn(async () => null);
    set = vi.fn(async () => {});
    remove = vi.fn(async () => {});
    destroy = vi.fn(async () => {});
  },
}));
vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));
vi.mock('../src/components/Global/Defaults', () => ({
  default: { CurrentLyricsType: 'None' },
}));
vi.mock('../src/utils/Lyrics/ui', () => ({
  HideLoaderContainer: vi.fn(),
  ClearLyricsPageContainer: vi.fn(),
  noLyricsMessage: vi.fn(async (id?: string) => ({ status: 'NO_LYRICS', id })),
}));

import storage from '../src/utils/storage';
import Defaults from '../src/components/Global/Defaults';
import {
  HideLoaderContainer,
  ClearLyricsPageContainer,
  noLyricsMessage,
} from '../src/utils/Lyrics/ui';
import {
  getLyricsFromLocalStorage,
  getLyricsFromCache,
  lyricsCache,
} from '../src/utils/Lyrics/cache';

const mockedStorage = vi.mocked(storage);
const mockedNoLyrics = vi.mocked(noLyricsMessage);

beforeEach(() => {
  vi.clearAllMocks();
  (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'None';
});

describe('getLyricsFromLocalStorage (pure read — no UI side effects)', () => {
  it('returns null when nothing is stored', async () => {
    mockedStorage.get.mockReturnValue(null);
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });

  it('returns stored lyrics for the matching track id without touching the UI', async () => {
    const payload = JSON.stringify({ id: 'track1', Type: 'Line', Content: [] });
    mockedStorage.get.mockReturnValue(payload);
    const result = await getLyricsFromLocalStorage('track1');
    expect(result).toMatchObject({ id: 'track1', Type: 'Line' });
    expect(Defaults.CurrentLyricsType).toBe('None');
    expect(HideLoaderContainer).not.toHaveBeenCalled();
    expect(ClearLyricsPageContainer).not.toHaveBeenCalled();
  });

  it('returns null for a different track id', async () => {
    mockedStorage.get.mockReturnValue(JSON.stringify({ id: 'other', Type: 'Line' }));
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
  });

  it('returns an explicit NO_LYRICS sentinel for a matching NO_LYRICS payload', async () => {
    mockedStorage.get.mockReturnValue(JSON.stringify({ status: 'NO_LYRICS', id: 'track1' }));
    const result = await getLyricsFromLocalStorage('track1');
    expect(result).toEqual({ status: 'NO_LYRICS', id: 'track1' });
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });

  it('ignores a NO_LYRICS sentinel for another track', async () => {
    mockedStorage.get.mockReturnValue(JSON.stringify({ status: 'NO_LYRICS', id: 'other' }));
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });

  it('supports the legacy NO_LYRICS:id string format as a sentinel', async () => {
    mockedStorage.get.mockReturnValue('NO_LYRICS:track1');
    const result = await getLyricsFromLocalStorage('track1');
    expect(result).toEqual({ status: 'NO_LYRICS', id: 'track1' });
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });

  it('returns null for unparseable content without touching the UI', async () => {
    mockedStorage.get.mockReturnValue('not-json{{{');
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
    expect(HideLoaderContainer).not.toHaveBeenCalled();
    expect(ClearLyricsPageContainer).not.toHaveBeenCalled();
  });
});

describe('getLyricsFromCache (pure read)', () => {
  it('returns null on a cache miss', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue(null);
    await expect(getLyricsFromCache('track1')).resolves.toBeNull();
  });

  it('returns the cached lyrics marked fromCache when not expired', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue({
      id: 'track1',
      Type: 'Line',
      Content: [],
      expiresAt: Date.now() + 100000,
    } as never);
    const result = await getLyricsFromCache('track1');
    expect(result).toMatchObject({ id: 'track1', fromCache: true });
  });

  it('removes and returns null for an expired entry', async () => {
    vi.mocked(lyricsCache.get).mockResolvedValue({
      id: 'track1',
      Type: 'Line',
      Content: [],
      expiresAt: Date.now() - 1000,
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
