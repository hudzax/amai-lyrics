import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getLyrics } from '../src/utils/API/Lyrics';
import Defaults from '../src/components/Global/Defaults';

// getLyrics is the module under test here: what matters is the exact payload
// it POSTs. SpotifyPlayer is stubbed rather than mocked so GetSongId() stays
// null (the test player URI is empty) and no track metadata rides along —
// that keeps the asserted body to the identity fields.
vi.mock('../src/components/Global/SpotifyPlayer', () => ({
  SpotifyPlayer: {
    GetSongId: () => null,
    GetSongName: async () => '',
    GetArtists: async () => [],
    JoinArtists: () => '',
    GetAlbumName: () => '',
    GetTrackDuration: () => 0,
  },
}));

const fetchMock = vi.fn();

function stubUser(user: { username: string; displayName: string } | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Spicetify.Platform as any).UserAPI = { getUser: async () => user };
}

function sentBody() {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
}

function sentHeaders() {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return init.headers as Record<string, string>;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => '{"id":"track1","Type":"Line","Content":[]}',
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  stubUser(null);
});

describe('getLyrics request headers', () => {
  it('sends the Amai version header', async () => {
    await getLyrics('track1');

    expect(sentHeaders()['X-Amai-Version']).toBe(Defaults.Version);
  });
});

describe('getLyrics request body', () => {
  it('appends the Amai version to display_name', async () => {
    stubUser({ username: 'hammam', displayName: 'Hammam' });

    await getLyrics('track1');

    expect(sentBody().display_name).toBe(`Hammam (v${Defaults.Version})`);
  });

  it('leaves user_id untouched', async () => {
    stubUser({ username: 'hammam', displayName: 'Hammam' });

    await getLyrics('track1');

    expect(sentBody().user_id).toBe('hammam');
  });

  it('sends the versioned display_name when Spotify returns no user', async () => {
    stubUser(null);

    await getLyrics('track1');

    expect(sentBody().display_name).toBe(`(v${Defaults.Version})`);
  });
});

describe('getLyrics request deadline', () => {
  // The cached and flush paths have different latency profiles: a flush
  // bypasses the worker's cache, so the reload/invalidation paths must not be
  // aborted on the cache-hit budget.
  const CACHED_DEADLINE_MS = 10_000;
  const FLUSH_DEADLINE_MS = 30_000;

  beforeEach(() => {
    vi.useFakeTimers();
    stubUser(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function hangingFetch(): void {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );
  }

  function startRequest(flush = false) {
    let settled = false;
    const outcome = getLyrics('track1', {}, flush).then(
      (value) => {
        settled = true;
        return { status: 'fulfilled' as const, value };
      },
      (error: unknown) => {
        settled = true;
        return { status: 'rejected' as const, error };
      },
    );
    return { outcome, isSettled: () => settled };
  }

  async function flushMicrotasks(): Promise<void> {
    // Let getLyrics await the user lookup and reach the fetch call.
    await vi.advanceTimersByTimeAsync(0);
  }

  it('aborts a cache-backed request at the 10s guard', async () => {
    hangingFetch();
    const request = startRequest(false);
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${Defaults.lyrics.api.url}/track1`);

    await vi.advanceTimersByTimeAsync(CACHED_DEADLINE_MS - 1);
    expect(request.isSettled()).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const outcome = await request.outcome;
    expect(outcome.status).toBe('rejected');
  });

  it('keeps a flush request alive past 10s and aborts it at 30s', async () => {
    hangingFetch();
    const request = startRequest(true);
    await flushMicrotasks();

    expect(fetchMock.mock.calls[0][0]).toBe(`${Defaults.lyrics.api.url}/track1?flush=true`);

    await vi.advanceTimersByTimeAsync(CACHED_DEADLINE_MS);
    expect(request.isSettled()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(FLUSH_DEADLINE_MS - CACHED_DEADLINE_MS - 1);
    expect(request.isSettled()).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const outcome = await request.outcome;
    expect(outcome.status).toBe('rejected');
  });

  it('reports the actual budget when a flush request times out', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    hangingFetch();
    const request = startRequest(true);
    await flushMicrotasks();

    await vi.advanceTimersByTimeAsync(FLUSH_DEADLINE_MS);
    await request.outcome;

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('after 30s'), 'track1');
  });
});
