import SpicyFetch from '../../utils/API/SpicyFetch';
import GetProgress, {
  _DEPRECATED___GetProgress,
} from '../../utils/Gets/GetProgress';

type ArtworkSize = 's' | 'l' | 'xl' | 'd';

const TrackData_Map = new Map();

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
      const spotifyHexString = SpicyHasher.spotifyHex(
        SpotifyPlayer.GetSongId(),
      );
      if (TrackData_Map.has(spotifyHexString))
        return TrackData_Map.get(spotifyHexString);
      const URL = `https://spclient.wg.spotify.com/metadata/4/track/${spotifyHexString}?market=from_token`;
      const [data, status] = await SpicyFetch(URL, true, true, false);
      if (status !== 200) return null;
      TrackData_Map.set(spotifyHexString, data);
      return data;
    },
    SortImages: (images: any[]) => {
      // Define size thresholds
      const sizeMap = {
        s: 'SMALL',
        l: 'DEFAULT',
        xl: 'LARGE',
      };

      // Sort the images into categories based on their size
      const sortedImages = images.reduce(
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

      return sortedImages;
    },
  },
  Seek: (position: number) => {
    Spicetify.Player.origin.seekTo(position);
  },
  Artwork: {
    Get: async (size: ArtworkSize): Promise<string> => {
      const psize = size === 'd' ? null : size?.toLowerCase() ?? null;
      const Data = await SpotifyPlayer.Track.GetTrackInfo();
      const Images = SpotifyPlayer.Track.SortImages(
        Data.album.cover_group.image,
      );
      switch (psize) {
        case 's':
          return `spotify:image:${Images.s[0].file_id}`;
        case 'l':
          return `spotify:image:${Images.l[0].file_id}`;
        case 'xl':
          return `spotify:image:${Images.xl[0].file_id}`;
        default:
          return `spotify:image:${Images.l[0].file_id}`;
      }
    },
  },
  GetSongName: async (): Promise<string> => {
    const Data = await SpotifyPlayer.Track.GetTrackInfo();
    return Data.name;
  },
  GetAlbumName: (): string => {
    return Spicetify.Player.data.item.metadata.album_title;
  },
  GetSongId: (): string => {
    return Spicetify.Player.data.item.uri?.split(':')[2] ?? null;
  },
  GetArtists: async (): Promise<string[]> => {
    const data = await SpotifyPlayer.Track.GetTrackInfo(); //await SpicyFetch(`https://api.spotify.com/v1/tracks/${SpotifyPlayer.GetSongId()}`, true, true, true)//await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${SpotifyPlayer.GetSongId()}`);
    return data?.artist?.map((a) => a.name) ?? [];
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
