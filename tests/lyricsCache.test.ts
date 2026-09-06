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
import { getLyricsFromLocalStorage } from '../src/utils/Lyrics/cache';

const mockedStorage = vi.mocked(storage);
const mockedNoLyrics = vi.mocked(noLyricsMessage);

beforeEach(() => {
  vi.clearAllMocks();
  (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'None';
});

describe('getLyricsFromLocalStorage', () => {
  it('returns null when nothing is stored', async () => {
    mockedStorage.get.mockReturnValue(null);
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });

  it('returns stored lyrics for the matching track id', async () => {
    const payload = JSON.stringify({ id: 'track1', Type: 'Line', Content: [] });
    mockedStorage.get.mockReturnValue(payload);
    const result = await getLyricsFromLocalStorage('track1');
    expect(result).toMatchObject({ id: 'track1', Type: 'Line' });
    expect(Defaults.CurrentLyricsType).toBe('Line');
    expect(HideLoaderContainer).toHaveBeenCalled();
    expect(ClearLyricsPageContainer).toHaveBeenCalled();
  });

  it('returns null for a different track id', async () => {
    mockedStorage.get.mockReturnValue(JSON.stringify({ id: 'other', Type: 'Line' }));
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
  });

  it('delegates to noLyricsMessage for a matching NO_LYRICS sentinel', async () => {
    mockedStorage.get.mockReturnValue(JSON.stringify({ status: 'NO_LYRICS', id: 'track1' }));
    await getLyricsFromLocalStorage('track1');
    expect(mockedNoLyrics).toHaveBeenCalledWith('track1');
  });

  it('ignores a NO_LYRICS sentinel for another track', async () => {
    mockedStorage.get.mockReturnValue(JSON.stringify({ status: 'NO_LYRICS', id: 'other' }));
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
    expect(mockedNoLyrics).not.toHaveBeenCalled();
  });

  it('supports the legacy NO_LYRICS:id string format', async () => {
    mockedStorage.get.mockReturnValue('NO_LYRICS:track1');
    await getLyricsFromLocalStorage('track1');
    expect(mockedNoLyrics).toHaveBeenCalled();
  });

  it('returns null for unparseable content and clears the container', async () => {
    mockedStorage.get.mockReturnValue('not-json{{{');
    await expect(getLyricsFromLocalStorage('track1')).resolves.toBeNull();
    expect(HideLoaderContainer).toHaveBeenCalled();
    expect(ClearLyricsPageContainer).toHaveBeenCalled();
  });
});
