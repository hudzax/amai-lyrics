import SpicyFetch from '../../utils/API/SpicyFetch';
import { spotifyHex } from '../../utils/Hasher';
import GetProgress, {
  _DEPRECATED___GetProgress,
} from '../../utils/Gets/GetProgress';

type ArtworkSize = 's' | 'l' | 'xl' | 'd';

const TrackData_Map = new Map();

async function getOrFetchTrackData(trackId: string): Promise<unknown> {
  if (TrackData_Map.has(trackId)) {
    const cached = TrackData_Map.get(trackId);
    if (cached instanceof Promise || (cached && typeof cached === 'object')) {
      return cached;
    }
  }
  const fetchPromise = (async () => {
    const URL = `https://spclient.wg.spotify.com/metadata/4/track/${trackId}?market=from_token`;
    const [data, status] = await SpicyFetch(URL, true, true, false);
    if (status !== 200) return null;
    TrackData_Map.set(trackId, data);
    return data;
  })();
  TrackData_Map.set(trackId, fetchPromise);
  return fetchPromise;
}

if (typeof Spicetify !== 'undefined' && Spicetify?.Player) {
  // TrackData_Map.clear(); // Do not clear cache on every song change; keep recently played tracks cached
}

export const SpotifyPlayer = {
  IsPlaying: false,
  GetTrackPosition: GetProgress,
  GetTrackDuration: (): number => {
    if (Spicetify.Player.data.item.duration?.milliseconds) {
      return Spicetify.Player.data.item.duration.milliseconds;
    }
    return 0;
  },
  Track: {
    GetTrackInfo: async () => {
      const spotifyHexString = spotifyHex(SpotifyPlayer.GetSongId());
      return getOrFetchTrackData(spotifyHexString);
    },
    SortImages: (images: { size: string; file_id: string }[]) => {
      // Define size thresholds
      const sizeMap = {
        s: 'SMALL',
        l: 'DEFAULT',
        xl: 'LARGE',
      };

      // Sort the images into categories based on their size
      return images.reduce(
        (acc, image) => {
          const { size } = image;

          if (size === sizeMap.s) {
            acc.s.push(image);
          } else if (size === sizeMap.l) {
            acc.l.push(image);
          } else if (size === sizeMap.xl) {
            acc.xl.push(image);
          }

          return acc;
        },
        { s: [], l: [], xl: [] },
      );
    },
  },
  Seek: (position: number) => {
    Spicetify.Player.origin.seekTo(position);
  },
  Artwork: {
    Get: async (size: ArtworkSize): Promise<string> => {
      // Use metadata image_url directly if available
      if (Spicetify.Player.data?.item?.metadata?.image_url) {
        return Spicetify.Player.data.item.metadata.image_url;
      }

      // Fall back to API call if metadata is not available
      const psize = size === 'd' ? null : size?.toLowerCase() ?? null;
      const Data = await SpotifyPlayer.Track.GetTrackInfo();
      const trackData = Data as {
        album?: {
          cover_group?: { image?: { size: string; file_id: string }[] };
        };
      };
      if (!trackData || !trackData.album?.cover_group?.image) return '';
      const Images = SpotifyPlayer.Track.SortImages(
        trackData.album.cover_group.image,
      );
      switch (psize) {
        case 's':
          return Images.s[0] ? `spotify:image:${Images.s[0].file_id}` : '';
        case 'l':
          return Images.l[0] ? `spotify:image:${Images.l[0].file_id}` : '';
        case 'xl':
          return Images.xl[0] ? `spotify:image:${Images.xl[0].file_id}` : '';
        default:
          return Images.l[0] ? `spotify:image:${Images.l[0].file_id}` : '';
      }
    },
  },
  GetSongName: async (): Promise<string> => {
    // Use metadata directly if available, avoiding the API call
    if (Spicetify.Player.data?.item?.metadata?.title) {
      return Spicetify.Player.data.item.metadata.title;
    }
    // Fall back to API call if metadata is not available
    const Data = await SpotifyPlayer.Track.GetTrackInfo();
    const trackData = Data as { name?: string };
    return trackData?.name || '';
  },
  GetAlbumName: (): string => {
    return Spicetify.Player.data.item.metadata.album_title;
  },
  GetSongId: (): string => {
    return Spicetify.Player.data.item.uri?.split(':')[2] ?? null;
  },
  GetArtists: async (): Promise<string[]> => {
    // Use metadata directly if available, avoiding the API call
    if (Spicetify.Player.data?.item?.metadata?.artist_name) {
      // Split the artist string by commas and trim whitespace
      return Spicetify.Player.data.item.metadata.artist_name
        .split(',')
        .map((artist) => artist.trim());
    }
    // Fall back to API call if metadata is not available
    const data = await SpotifyPlayer.Track.GetTrackInfo();
    const trackData = data as { artist?: { name: string }[] };
    return trackData?.artist?.map((a) => a.name) ?? [];
  },
  JoinArtists: (artists: string[]): string => {
    return artists?.join(', ') ?? null;
  },
  IsPodcast: false,
  _DEPRECATED_: {
    GetTrackPosition: _DEPRECATED___GetProgress,
  },
  Pause: Spicetify.Player.pause,
  Play: Spicetify.Player.play,
  Skip: {
    Next: Spicetify.Player.next,
    Prev: Spicetify.Player.back,
  },
  LoopType: 'none',
  ShuffleType: 'none',
};
