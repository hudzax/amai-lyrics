import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import Platform from '../../components/Global/Platform';
import pako from 'pako';
import { md5 } from '../Hasher';

export const SpicyFetchCache = new SpikyCache({
  name: 'SpicyFetch__Cache',
});

export default async function SpicyFetch(
  path: string,
  IsExternal: boolean = false,
  cache: boolean = false,
  cosmos: boolean = false,
): Promise<[object | null, number]> {
  const url = path;

  try {
    const CachedContent = await GetCachedContent(url);
    if (CachedContent) {
      // Here for backwards compatibility
      if (Array.isArray(CachedContent)) {
        // console.log('CachedContent array:', CachedContent);
        const content =
          typeof CachedContent[0] === 'string'
            ? JSON.parse(CachedContent[0])
            : CachedContent[0];
        return [content, CachedContent[1]];
      }
      // console.log('CachedContent:', CachedContent);
      return [CachedContent, 200];
    }

    const SpotifyAccessToken = await Platform.GetSpotifyAccessToken();

    if (cosmos) {
      const res = await Spicetify.CosmosAsync.get(url);
      let data: object;
      try {
        data = (await res.json()) as object;
      } catch {
        data = {} as object;
      }
      const sentData: [object, number] = [data, res.status];
      // console.log('CosmosAsync:', sentData);
      if (cache) {
        await CacheContent(url, sentData, 604800000);
      }
      return sentData;
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

      const res = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (res === null) {
        return [null, 500];
      }

      let data: object;
      try {
        data = (await res.json()) as object;
      } catch {
        data = {} as object;
      }
      const sentData: [object, number] = [data, res.status];
      // console.log('SpotifyAPI:', sentData);
      if (cache) {
        await CacheContent(url, sentData, 604800000);
      }
      return sentData;
    }
  } catch (err) {
    console.error('SpicyFetch Error:', err);
    throw err; // Re-throw the error so the caller can handle it
  }
}

async function CacheContent(
  key: string,
  data: [object, number],
  expirationTtl: number = 604800000,
): Promise<void> {
  try {
    const expiresIn = Date.now() + expirationTtl;
    const processedKey = md5(key);

    const processedData =
      typeof data === 'object' ? JSON.stringify(data) : data;

    const compressedData = pako.deflate(processedData, {
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

async function GetCachedContent(key: string): Promise<[object, number] | null> {
  try {
    const processedKey = md5(key);
    const content = await SpicyFetchCache.get(processedKey);
    if (content) {
      if (content.expiresIn > Date.now()) {
        // Here for backwards compatibility
        if (typeof content.Content !== 'string') {
          await SpicyFetchCache.remove(key);
          return content.Content as [object, number];
        }

        const compressedData = Uint8Array.from(content.Content, (c: string) =>
          c.charCodeAt(0),
        );
        const decompressedData = pako.inflate(compressedData, { to: 'string' });

        return JSON.parse(decompressedData) as [object, number];
      } else {
        await SpicyFetchCache.remove(key);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('ERR CC', error);
    return null;
  }
}
