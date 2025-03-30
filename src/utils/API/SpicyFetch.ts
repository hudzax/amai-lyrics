import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import Defaults from '../../components/Global/Defaults';
import Platform from '../../components/Global/Platform';
import Session from '../../components/Global/Session';
import { CheckForUpdates } from '../version/CheckForUpdates';

export let SpicyFetchCache = new SpikyCache({
  name: 'SpicyFetch__Cache',
});

export default async function SpicyFetch(
  path: string,
  IsExternal: boolean = false,
  cache: boolean = false,
  cosmos: boolean = false,
): Promise<Response | any> {
  return new Promise(async (resolve, reject) => {
    const lyricsApi = Defaults.lyrics.api.url;

    const CurrentVersion = Session.SpicyLyrics.GetCurrentVersion();

    const url = IsExternal
      ? path
      : `${lyricsApi}/${path}${path.includes('?') ? '&' : '?'}origin_version=${
          CurrentVersion.Text
        }`;

    const CachedContent = await GetCachedContent(url);
    if (CachedContent) {
      // Here for backwards compatibility
      if (Array.isArray(CachedContent)) {
        resolve(CachedContent);
        return;
      }
      resolve([CachedContent, 200]);
      return;
    }

    const SpotifyAccessToken = await Platform.GetSpotifyAccessToken();

    if (cosmos) {
      Spicetify.CosmosAsync.get(url)
        .then(async (res) => {
          const data = typeof res === 'object' ? JSON.stringify(res) : res;
          const sentData = [data, res.status];
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 604800000);
          }
        })
        .catch((err) => {
          console.log('CosmosAsync Error:', err);
          reject(err);
        });
    } else {
      const SpicyLyricsAPI_Headers = IsExternal ? null : {};

      const SpotifyAPI_Headers = IsExternal
        ? {
            'Spotify-App-Version': Spicetify.Platform.version,
            'App-Platform': Spicetify.Platform.PlatformData.app_platform,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }
        : null;

      const headers = {
        Authorization: `Bearer ${SpotifyAccessToken}`,
        ...SpotifyAPI_Headers,
        ...SpicyLyricsAPI_Headers,
      };

      fetch(url, {
        method: 'GET',
        headers: headers,
      })
        .then(CheckForErrors)
        .then(async (res) => {
          if (res === null) {
            resolve([null, 500]);
            return;
          }

          const data = await res.text();
          /*                 const isJson = ((data.startsWith(`{"`) || data.startsWith("{")) || (data.startsWith(`[`) || data.startsWith(`["`)));
                if (isJson) {
                    data = JSON.parse(data);
                } */
          const sentData = [data, res.status];
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 604800000);
          }
        })
        .catch((err) => {
          console.log('Fetch Error:', err);
          reject(err);
        });
    }
  });
}

async function CacheContent(
  key,
  data,
  expirationTtl: number = 604800000,
): Promise<void> {
  try {
    const expiresIn = Date.now() + expirationTtl;
    const processedKey = SpicyHasher.md5(key);

    const processedData =
      typeof data === 'object' ? JSON.stringify(data) : data;

    const compressedData = pako.deflate(processedData, {
      to: 'string',
      level: 1,
    }); // Max compression level
    const compressedString = String.fromCharCode(
      ...new Uint8Array(compressedData),
    ); // Encode to base64

    await SpicyFetchCache.set(processedKey, {
      Content: compressedString,
      expiresIn,
    });
  } catch (error) {
    console.error('ERR CC', error);
    await SpicyFetchCache.destroy();
  }
}

async function GetCachedContent(key): Promise<object | string | null> {
  try {
    const processedKey = SpicyHasher.md5(key);
    const content = await SpicyFetchCache.get(processedKey);
    if (content) {
      if (content.expiresIn > Date.now()) {
        // Here for backwards compatibility
        if (typeof content.Content !== 'string') {
          await SpicyFetchCache.remove(key);
          return content.Content;
        }

        const compressedData = Uint8Array.from(content.Content, (c: any) =>
          c.charCodeAt(0),
        );
        const decompressedData = pako.inflate(compressedData, { to: 'string' });

        const data: object | string =
          typeof decompressedData === 'string' &&
          (decompressedData.startsWith('{') ||
            decompressedData.startsWith(`{"`) ||
            decompressedData.startsWith('[') ||
            decompressedData.startsWith(`["`))
            ? JSON.parse(decompressedData)
            : decompressedData;

        return data;
      } else {
        await SpicyFetchCache.remove(key);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('ERR CC', error);
  }
}

export const _FETCH_CACHE = {
  GetCachedContent,
  CacheContent,
};

let ENDPOINT_DISABLEMENT_Shown = false;

async function CheckForErrors(res) {
  if (res.status === 500) {
    const TEXT = await res.text();
    if (TEXT.includes(`{"`)) {
      const data = JSON.parse(TEXT);
      if (data.type === 'ENDPOINT_DISABLEMENT') {
        if (ENDPOINT_DISABLEMENT_Shown) return;
        Spicetify.PopupModal.display({
          title: 'Endpoint Disabled',
          content: `
                        <div>
                            <p>The endpoint you're trying to access is disabled.</p><br>
                            <p>This could mean a few things:</p><br>
                            <ul>
                                <li>Maintenace on the API</li>
                                <li>A Critical Issue</li>
                                <li>A quick Disablement of the Endpoint</li>
                            </ul><br><br>
                            <p>Is this problem persists, contact us on Github: <a href="https://github.com/spikenew7774/spicy-lyrics/" target="_blank" style="text-decoration:underline;">https://github.com/spikenew7774/spicy-lyrics</a>
                            ,<br> Or at <b>spikerko@spikerko.org</b></p>
                            <h3>Thanks!</h3>
                        </div>
                    `,
        });
        ENDPOINT_DISABLEMENT_Shown = true;
        return res;
      }
      return res;
    }
    return res;
  } else if (res.status === 403) {
    const TEXT = await res.text();
    if (TEXT.includes(`{"`)) {
      const data = JSON.parse(TEXT);
      if (data?.message === 'Update Spicy Lyrics') {
        await CheckForUpdates(true);
        return null;
      }
    }
  }
  return res;
}
