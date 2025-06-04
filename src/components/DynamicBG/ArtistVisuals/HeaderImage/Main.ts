import SpicyFetch from '../../../../utils/API/SpicyFetch';
import ArtistVisuals from '../Main';
import GetHeaderUrl from './GetHeaderUrl';

// Track ongoing fetches
const isFetching = new Map();

export default async function ApplyContent(
  CurrentSongArtist: string,
  CurrentSongUri: string,
) {
  if (!CurrentSongArtist) throw new Error('Invalid Song Artist');
  if (!CurrentSongUri) throw new Error('Invalid Song URI');
  const TrackId = CurrentSongUri.split(':')[2];
  const ArtistId = CurrentSongArtist.split(':')[2];
  if (!TrackId || !ArtistId) throw new Error('Invalid URIs');
  interface CachedVisual {
    data?: unknown;
    metadata: {
      expiresIn: number;
    };
  }
  const Cached: CachedVisual | undefined = await ArtistVisuals.Cache.get(
    ArtistId,
  );

  if (Cached) {
    if (Cached.metadata.expiresIn <= Date.now()) {
      await ArtistVisuals.Cache.remove(ArtistId);
      return Continue();
    }
    if (Cached?.data) {
      return GetHeaderUrl(Cached?.data);
    }
    await ArtistVisuals.Cache.remove(ArtistId);
    return Continue();
  }

  return Continue();

  async function Continue() {
    // Check if we're already fetching this track
    if (isFetching.has(ArtistId)) {
      return isFetching.get(ArtistId);
    }

    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        const [res, status] = await SpicyFetch(
          `artist/visuals?artist=${CurrentSongArtist}&track=${CurrentSongUri}`,
        );
        if (status === 200) {
          await ArtistVisuals.Cache.set(ArtistId, {
            data: res ?? '',
            metadata: {
              expiresIn: Date.now() + 259200000, // 3 days
            },
          });
          return GetHeaderUrl(res ?? '');
        } else {
          throw new Error(`Failed to fetch visuals: ${status}`);
        }
      } finally {
        // Clean up the map entry when done
        isFetching.delete(ArtistId);
      }
    })();

    // Store the promise
    isFetching.set(ArtistId, fetchPromise);

    return fetchPromise;
  }
}
