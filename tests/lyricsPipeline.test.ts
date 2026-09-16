import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/utils/storage', () => ({
  default: { get: vi.fn(() => null), set: vi.fn() },
}));
vi.mock('../src/components/Global/Defaults', () => ({
  default: { CurrentLyricsType: 'None', LyricsContainerExists: false },
}));
vi.mock('../src/utils/EventManager', () => ({
  default: { listen: vi.fn(), unListen: vi.fn(), evoke: vi.fn() },
}));
vi.mock('../src/utils/Lyrics/ui', () => ({
  HideLoaderContainer: vi.fn(),
  ClearLyricsPageContainer: vi.fn(),
  resetLyricsUI: vi.fn(),
  ShowLoaderContainer: vi.fn(),
  ShowProcessingIndicator: vi.fn(),
  EnsureProcessingIndicatorHidden: vi.fn(),
  noLyricsMessage: vi.fn(async (id?: string) => ({ status: 'NO_LYRICS', id })),
}));
vi.mock('../src/utils/Lyrics/LyricsRenderer', () => ({
  renderLyrics: vi.fn(),
  updateLyricTranslations: vi.fn(),
}));
vi.mock('../src/utils/Lyrics/cache', () => ({
  getLyricsFromLocalStorage: vi.fn(async () => null),
  getLyricsFromCache: vi.fn(async () => null),
  removeLyricsFromCache: vi.fn(async () => undefined),
  lyricsCache: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), destroy: vi.fn() },
}));
vi.mock('../src/utils/Lyrics/api', () => ({
  fetchLyricsFromAPI: vi.fn(),
}));
vi.mock('../src/utils/Lyrics/Global/Applyer', () => ({
  default: vi.fn(),
}));
vi.mock('../src/components/Pages/pageButtons', () => ({
  hideRefreshButton: vi.fn(),
  showRefreshButton: vi.fn(),
}));

import storage from '../src/utils/storage';
import Defaults from '../src/components/Global/Defaults';
import Event from '../src/utils/EventManager';
import {
  HideLoaderContainer,
  ClearLyricsPageContainer,
  noLyricsMessage,
} from '../src/utils/Lyrics/ui';
import { updateLyricTranslations } from '../src/utils/Lyrics/LyricsRenderer';
import { fetchLyricsFromAPI } from '../src/utils/Lyrics/api';
import ApplyLyrics from '../src/utils/Lyrics/Global/Applyer';
import fetchLyrics, { loadAndApplyLyrics, invalidateLyrics } from '../src/utils/Lyrics/fetchLyrics';
import {
  beginLyricsRequest,
  isCurrentLyricsRequest,
  publishInitialLyrics,
  publishEnhancedLyrics,
  publishNoLyrics,
} from '../src/utils/Lyrics/publish';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;
const liveItem = () => spicetify.Spicetify.Player.data.item;

const mockedStorage = vi.mocked(storage);
const mockedEvent = vi.mocked(Event);
const mockedApi = vi.mocked(fetchLyricsFromAPI);
const mockedApply = vi.mocked(ApplyLyrics);

const URI_A = 'spotify:track:trackA';
const URI_B = 'spotify:track:trackB';

function staticPayload(id: string) {
  return { id, Type: 'Static', Lines: [{ Text: 'hi' }], Raw: ['hi'] };
}

beforeEach(() => {
  vi.clearAllMocks();
  (Defaults as { CurrentLyricsType: string }).CurrentLyricsType = 'None';
  liveItem().uri = '';
});

afterEach(() => {
  liveItem().uri = '';
});

describe('request currency', () => {
  it('marks superseded requests stale', () => {
    liveItem().uri = URI_A;
    const first = beginLyricsRequest(URI_A);
    expect(isCurrentLyricsRequest(first)).toBe(true);

    liveItem().uri = URI_B;
    const second = beginLyricsRequest(URI_B);
    expect(isCurrentLyricsRequest(first)).toBe(false);
    expect(isCurrentLyricsRequest(second)).toBe(true);
  });

  it('treats a request as stale when the player moved without a new request', () => {
    liveItem().uri = URI_A;
    const token = beginLyricsRequest(URI_A);
    expect(isCurrentLyricsRequest(token)).toBe(true);

    liveItem().uri = URI_B;
    expect(isCurrentLyricsRequest(token)).toBe(false);
  });
});

describe('publishInitialLyrics', () => {
  it('publishes nothing for a stale token', () => {
    liveItem().uri = URI_A;
    const stale = beginLyricsRequest(URI_A);
    liveItem().uri = URI_B;
    beginLyricsRequest(URI_B);

    expect(publishInitialLyrics(stale, staticPayload('trackA') as never)).toBe(false);
    expect(Defaults.CurrentLyricsType).toBe('None');
    expect(mockedStorage.set).not.toHaveBeenCalled();
    expect(mockedEvent.evoke).not.toHaveBeenCalled();
    expect(HideLoaderContainer).not.toHaveBeenCalled();
    expect(ClearLyricsPageContainer).not.toHaveBeenCalled();
  });

  it('publishes domain state, snapshot, bus event, and loader teardown once', () => {
    liveItem().uri = URI_A;
    const token = beginLyricsRequest(URI_A);

    expect(publishInitialLyrics(token, staticPayload('trackA') as never)).toBe(true);
    expect(Defaults.CurrentLyricsType).toBe('Static');
    expect(mockedStorage.set).toHaveBeenCalledWith(
      'currentLyricsData',
      expect.stringContaining('trackA'),
    );
    expect(mockedEvent.evoke).toHaveBeenCalledWith(
      'lyrics:data-updated',
      expect.stringContaining('trackA'),
    );
    expect(HideLoaderContainer).toHaveBeenCalledTimes(1);
    expect(ClearLyricsPageContainer).toHaveBeenCalledTimes(1);
  });
});

describe('publishEnhancedLyrics', () => {
  it('updates in place only for the current request and track', () => {
    liveItem().uri = URI_A;
    const token = beginLyricsRequest(URI_A);

    expect(publishEnhancedLyrics(token, 'trackA', staticPayload('trackA') as never)).toBe(true);
    expect(updateLyricTranslations).toHaveBeenCalledTimes(1);
    expect(mockedEvent.evoke).toHaveBeenCalledWith(
      'lyrics:data-updated',
      expect.stringContaining('trackA'),
    );
  });

  it('drops enhancements for superseded requests', () => {
    liveItem().uri = URI_A;
    const stale = beginLyricsRequest(URI_A);
    liveItem().uri = URI_B;
    beginLyricsRequest(URI_B);

    expect(publishEnhancedLyrics(stale, 'trackA', staticPayload('trackA') as never)).toBe(false);
    expect(updateLyricTranslations).not.toHaveBeenCalled();
    expect(mockedEvent.evoke).not.toHaveBeenCalled();
  });
});

describe('publishNoLyrics', () => {
  it('publishes the sentinel snapshot and the same bus event as the positive path', () => {
    liveItem().uri = URI_A;
    const token = beginLyricsRequest(URI_A);
    const sentinel = JSON.stringify({ status: 'NO_LYRICS', id: 'trackA' });

    expect(publishNoLyrics(token, 'trackA')).toBe(true);
    expect(mockedStorage.set).toHaveBeenCalledWith('currentLyricsData', sentinel);
    // Regression: without the bus event the playbar overlay kept rendering the
    // previous track's line after a track with no lyrics.
    expect(mockedEvent.evoke).toHaveBeenCalledWith('lyrics:data-updated', sentinel);
  });

  it('publishes nothing for a stale token', () => {
    liveItem().uri = URI_A;
    const stale = beginLyricsRequest(URI_A);
    liveItem().uri = URI_B;
    beginLyricsRequest(URI_B);

    expect(publishNoLyrics(stale, 'trackA')).toBe(false);
    expect(mockedStorage.set).not.toHaveBeenCalled();
    expect(mockedEvent.evoke).not.toHaveBeenCalled();
  });
});

describe('invalidateLyrics', () => {
  it('destroys the whole cache and clears the snapshot without reloading', async () => {
    const { lyricsCache } = await import('../src/utils/Lyrics/cache');

    await invalidateLyrics({ all: true });

    expect(lyricsCache.destroy).toHaveBeenCalledTimes(1);
    expect(mockedStorage.set).toHaveBeenCalledWith('currentLyricsData', null);
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('evicts a single track instead of destroying the cache', async () => {
    const { lyricsCache, removeLyricsFromCache } = await import('../src/utils/Lyrics/cache');

    await invalidateLyrics({ trackId: 'trackA' });

    expect(removeLyricsFromCache).toHaveBeenCalledWith('trackA');
    expect(lyricsCache.destroy).not.toHaveBeenCalled();
  });

  it('reloads the live track when asked', async () => {
    liveItem().uri = URI_A;
    mockedApi.mockResolvedValue(staticPayload('trackA') as never);
    mockedApply.mockImplementation(() => true);

    await invalidateLyrics({ all: true }, { reload: true });

    expect(mockedApi).toHaveBeenCalledTimes(1);
  });

  it('skips the reload when nothing is playing', async () => {
    liveItem().uri = '';

    await invalidateLyrics({ all: true }, { reload: true });

    expect(mockedApi).not.toHaveBeenCalled();
  });
});

describe('loadAndApplyLyrics', () => {
  it('returns NO_LYRICS without applying', async () => {
    liveItem().uri = URI_A;
    mockedApi.mockResolvedValue({ status: 'NO_LYRICS', id: 'trackA' } as never);

    const result = await loadAndApplyLyrics(URI_A);

    expect(result).toMatchObject({ status: 'NO_LYRICS' });
    expect(mockedApply).not.toHaveBeenCalled();
  });

  it('retries once for the live track when the applyer declines a stale payload', async () => {
    liveItem().uri = URI_B;
    mockedApi.mockImplementation(async (trackId: string) => staticPayload(trackId) as never);
    mockedApply.mockImplementation((lyrics) => (lyrics as { id: string }).id === 'trackB');

    const result = await loadAndApplyLyrics(URI_A);

    expect(result).toMatchObject({ id: 'trackB' });
    expect(mockedApi).toHaveBeenCalledTimes(2);
    expect(mockedApply).toHaveBeenCalledTimes(2);
  });

  it('applies cache hits through the default fetch entry', async () => {
    liveItem().uri = URI_A;
    const { getLyricsFromCache } = await import('../src/utils/Lyrics/cache');
    vi.mocked(getLyricsFromCache).mockResolvedValue({
      ...staticPayload('trackA'),
      fromCache: true,
    } as never);

    const result = await fetchLyrics(URI_A);

    expect(result).toMatchObject({ id: 'trackA' });
    expect(mockedApi).not.toHaveBeenCalled();
    expect(Defaults.CurrentLyricsType).toBe('Static');
    expect(mockedEvent.evoke).toHaveBeenCalledWith(
      'lyrics:data-updated',
      expect.stringContaining('trackA'),
    );
  });

  it('uses the mocked NO_LYRICS sentinel for invalid uris', async () => {
    await expect(loadAndApplyLyrics('not-a-uri')).resolves.toMatchObject({
      status: 'NO_LYRICS',
    });
    expect(mockedApi).not.toHaveBeenCalled();
    expect(mockedApply).not.toHaveBeenCalled();
    expect(noLyricsMessage).toHaveBeenCalled();
  });
});
