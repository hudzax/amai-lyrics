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
