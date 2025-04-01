import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import Platform from '../../components/Global/Platform';

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
    const url = path;

    const CachedContent = await GetCachedContent(url);
    if (CachedContent) {
      // Here for backwards compatibility
      if (Array.isArray(CachedContent)) {
        // console.log('CachedContent array:', CachedContent);
        const content =
          typeof CachedContent[0] === 'string'
            ? JSON.parse(CachedContent[0])
            : CachedContent[0];
        resolve([content, CachedContent[1]]);
        return;
      }
      // console.log('CachedContent:', CachedContent);
      resolve([CachedContent, 200]);
      return;
    }

    const SpotifyAccessToken = await Platform.GetSpotifyAccessToken();

    if (cosmos) {
      Spicetify.CosmosAsync.get(url)
        .then(async (res) => {
          let data;
          try {
            data = await res.json();
          } catch (error) {
            data = {};
          }
          const sentData = [data, res.status];
          // console.log('CosmosAsync:', sentData);
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 604800000);
          }
        })
        .catch((err) => {
          console.error('CosmosAsync Error:', err);
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
        .then(async (res) => {
          if (res === null) {
            resolve([null, 500]);
            return;
          }

          let data;
          try {
            data = await res.json();
          } catch (error) {
            data = {};
          }
          const sentData = [data, res.status];
          // console.log('SpotifyAPI:', sentData);
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 604800000);
          }
        })
        .catch((err) => {
          console.error('Fetch Error:', err);
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

async function GetCachedContent(key): Promise<object | null> {
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

        const data = JSON.parse(decompressedData);

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
