//import Global from "../../components/Global/Global";
import Global from '../../components/Global/Global';
import SpicyFetch from '../API/SpicyFetch';
import { socket as ws } from './ws/main';

export const UserData = Spicetify.Platform.initialUser;

window._spicy_lyrics.UserData = UserData;

interface SpotifyImage {
  url?: string;
  height?: number;
  width?: number;
}

interface Followers {
  href?: string | null;
  total?: number;
}

interface SpotifyProfile {
  display_name?: string;
  followers?: Followers;
  href?: string;
  id?: string;
  images?: SpotifyImage[];
  product?: 'free' | 'premium' | 'open' | string;
  type?: 'user' | string;
  uri?: string;
}

export async function getUserData() {
  const [req, status] = await SpicyFetch(
    'https://api.spotify.com/v1/me',
    true,
    false,
    false,
  );
  if (status !== 200) {
    return;
  }

  const fullData: any =
    typeof req === 'string' &&
    (req.startsWith('{') ||
      req.startsWith(`{"`) ||
      req.startsWith('[') ||
      req.startsWith(`["`))
      ? JSON.parse(req)
      : req;

  // Only keep the fields we want
  const filteredData: SpotifyProfile = {
    display_name: fullData.display_name,
    followers: fullData.followers,
    href: fullData.href,
    id: fullData.id,
    images: fullData.images,
    product: fullData.product,
    type: fullData.type,
    uri: fullData.uri,
  };

  return filteredData;
}

const Sockets = {
  sockets: {
    ws,
  },
  all: {
    ConnectSockets,
  },
};

async function ConnectSockets() {
  const APIUserData = await getUserData();
  for (const key of Object.keys(Sockets?.sockets)) {
    // console.log(`Connecting: ${key}`);
    Sockets.sockets[key].auth = {
      userData: {
        ID: UserData.username,
        me: APIUserData,
      },
    };
    await Sockets?.sockets[key]?.connect();
    // console.log(`${key} connected`);
  }
}

// Global.SetScope("_spicy_lyrics_websockets", Sockets)

export default Sockets;
