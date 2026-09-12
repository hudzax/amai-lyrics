import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/components/Global/Platform', () => ({
  default: { GetSpotifyAccessToken: vi.fn(async () => 'token'), OnSpotifyReady: Promise.resolve() },
}));
vi.mock('../src/utils/API/Lyrics', () => ({
  getLyrics: vi.fn(),
}));
vi.mock('../src/utils/Lyrics/ui', () => ({
  ClearLyricsPageContainer: vi.fn(),
  noLyricsMessage: vi.fn(async (id?: string) => ({ status: 'NO_LYRICS', id })),
}));
vi.mock('../src/utils/Lyrics/processing', () => ({
  processAndEnhanceLyrics: vi.fn(async (_trackId: string, json: unknown) => ({
    ...(json as object),
    fromCache: false,
  })),
}));

import Platform from '../src/components/Global/Platform';
import { getLyrics } from '../src/utils/API/Lyrics';
import { ClearLyricsPageContainer, noLyricsMessage } from '../src/utils/Lyrics/ui';
import { processAndEnhanceLyrics } from '../src/utils/Lyrics/processing';
import { fetchLyricsFromAPI, handleErrorStatus } from '../src/utils/Lyrics/api';

// The pipeline token is opaque to the api module: it only forwards it to
// processing, where currency is decided. A literal stands in for a token
// issued by beginLyricsRequest; token-currency semantics are covered by
// the pipeline tests, not here.
const TOKEN = 7;
const STALE_TOKEN = 3;

const mockedGetLyrics = vi.mocked(getLyrics);
const mockedEnhance = vi.mocked(processAndEnhanceLyrics);
const mockedNoLyrics = vi.mocked(noLyricsMessage);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleErrorStatus', () => {
  it('clears the container and returns the NO_LYRICS sentinel', async () => {
    const result = await handleErrorStatus(500);
    expect(result).toEqual({ status: 'NO_LYRICS', id: undefined });
    expect(ClearLyricsPageContainer).toHaveBeenCalled();
    expect(mockedNoLyrics).toHaveBeenCalled();
  });
});

describe('fetchLyricsFromAPI', () => {
  it('processes line lyrics on a 200 response and forwards the pipeline token', async () => {
    const response = { id: 'track1', Type: 'Line', Content: [{ Text: 'hi' }] };
    mockedGetLyrics.mockResolvedValue({ response: response as never, status: 200 });

    const result = await fetchLyricsFromAPI('track1', false, TOKEN);

    expect(Platform.GetSpotifyAccessToken).toHaveBeenCalled();
    expect(mockedGetLyrics).toHaveBeenCalledWith(
      'track1',
      { Authorization: 'Bearer token' },
      false,
    );
    expect(mockedEnhance).toHaveBeenCalledWith('track1', response, TOKEN);
    expect(result).toMatchObject({ id: 'track1', fromCache: false });
  });

  it('forwards stale tokens untouched (currency is decided downstream)', async () => {
    const response = { id: 'track1', Type: 'Line', Content: [{ Text: 'hi' }] };
    mockedGetLyrics.mockResolvedValue({ response: response as never, status: 200 });

    await fetchLyricsFromAPI('track1', false, STALE_TOKEN);
    expect(mockedEnhance).toHaveBeenCalledWith('track1', response, STALE_TOKEN);
  });

  it('accepts Syllable payloads for ingest normalization', async () => {
    const response = { id: 'track1', Type: 'Syllable', Content: [{ Lead: {} }] };
    mockedGetLyrics.mockResolvedValue({ response: response as never, status: 200 });
    await fetchLyricsFromAPI('track1', false, TOKEN);
    expect(mockedEnhance).toHaveBeenCalled();
  });

  it('returns no-lyrics for non-200 statuses', async () => {
    mockedGetLyrics.mockResolvedValue({ response: {} as never, status: 404 });
    const result = await fetchLyricsFromAPI('track1', false, TOKEN);
    expect(result).toEqual({ status: 'NO_LYRICS', id: undefined });
    expect(mockedEnhance).not.toHaveBeenCalled();
  });

  it('returns no-lyrics when the response has no track id', async () => {
    mockedGetLyrics.mockResolvedValue({
      response: { Type: 'Line', Content: [] } as never,
      status: 200,
    });
    await fetchLyricsFromAPI('track1', false, TOKEN);
    expect(mockedEnhance).not.toHaveBeenCalled();
    expect(mockedNoLyrics).toHaveBeenCalledWith('track1');
  });

  it('returns no-lyrics for empty line content and empty static lines', async () => {
    mockedGetLyrics.mockResolvedValue({
      response: { id: 'track1', Type: 'Line', Content: [] } as never,
      status: 200,
    });
    await expect(fetchLyricsFromAPI('track1', false, TOKEN)).resolves.toMatchObject({
      status: 'NO_LYRICS',
    });

    mockedGetLyrics.mockResolvedValue({
      response: { id: 'track1', Type: 'Static', Lines: [] } as never,
      status: 200,
    });
    await expect(fetchLyricsFromAPI('track1', false, TOKEN)).resolves.toMatchObject({
      status: 'NO_LYRICS',
    });
    expect(mockedEnhance).not.toHaveBeenCalled();
  });

  it('returns no-lyrics and clears the container when the request throws', async () => {
    mockedGetLyrics.mockRejectedValue(new Error('network down'));
    const result = await fetchLyricsFromAPI('track1', false, TOKEN);
    expect(result).toMatchObject({ status: 'NO_LYRICS' });
    expect(ClearLyricsPageContainer).toHaveBeenCalled();
  });
});
