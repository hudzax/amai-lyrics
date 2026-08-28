import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import Platform from '../../components/Global/Platform';
import { md5 } from '../Hasher';

type PakoModule = typeof import('pako');
let pakoPromise: Promise<PakoModule> | null = null;
function loadPako(): Promise<PakoModule> {
  if (!pakoPromise) pakoPromise = import('pako') as Promise<PakoModule>;
  return pakoPromise;
}
function resolvePako(mod: PakoModule): PakoModule {
  return (mod as unknown as { default?: PakoModule }).default ?? mod;
}

export const SpicyFetchCache = new SpikyCache({
  name: 'SpicyFetch__Cache',
});

// Bounded LRU for Cache API disk entries — prevents unbounded growth during long sessions
const MAX_SPICY_FETCH_ENTRIES = 150;
const spicyWindowRef = window as unknown as { __amaiSpicyFetchKeys?: string[] };
const spicyFetchKeyOrder: string[] = spicyWindowRef.__amaiSpicyFetchKeys ?? [];
spicyWindowRef.__amaiSpicyFetchKeys = spicyFetchKeyOrder;

function trackSpicyFetchKey(processedKey: string): void {
  const idx = spicyFetchKeyOrder.indexOf(processedKey);
  if (idx !== -1) spicyFetchKeyOrder.splice(idx, 1);
  spicyFetchKeyOrder.push(processedKey);
  if (spicyFetchKeyOrder.length > MAX_SPICY_FETCH_ENTRIES) {
    const oldest = spicyFetchKeyOrder.shift();
    if (oldest) SpicyFetchCache.remove(oldest).catch(() => {});
  }
}

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
          typeof CachedContent[0] === 'string' ? JSON.parse(CachedContent[0]) : CachedContent[0];
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

const MAX_DECOMPRESSED_BYTES = 2 * 1024 * 1024; // 2 MB guard against cache-bomb inflate

/** Chunked Uint8Array → string to avoid spread stack overflow on large payloads. */
function uint8ToString(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let out = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

function stringToUint8(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

async function CacheContent(
  key: string,
  data: [object, number],
  expirationTtl: number = 604800000,
): Promise<void> {
  try {
    const expiresIn = Date.now() + expirationTtl;
    const processedKey = md5(key);

    const processedData = typeof data === 'object' ? JSON.stringify(data) : data;

    const pakoMod = resolvePako(await loadPako());
    const compressedData = pakoMod.deflate(processedData, {
      level: 1,
    });
    const compressedString = uint8ToString(compressedData);

    await SpicyFetchCache.set(processedKey, {
      Content: compressedString,
      expiresIn,
    });
    trackSpicyFetchKey(processedKey);
  } catch (error) {
    console.error('ERR CC', error);
    // Remove only the failing entry instead of wiping the entire cache
    try {
      await SpicyFetchCache.remove(md5(key));
    } catch {
      // ignore secondary failure
    }
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
          await SpicyFetchCache.remove(processedKey);
          return content.Content as [object, number];
        }

        // Guard: reject absurdly large entries before inflating
        if (content.Content.length > MAX_DECOMPRESSED_BYTES) {
          await SpicyFetchCache.remove(processedKey);
          return null;
        }

        const compressedData = stringToUint8(content.Content);
        const pakoMod = resolvePako(await loadPako());
        const decompressedData = pakoMod.inflate(compressedData, { to: 'string' });

        if (decompressedData.length > MAX_DECOMPRESSED_BYTES) {
          await SpicyFetchCache.remove(processedKey);
          return null;
        }

        return JSON.parse(decompressedData) as [object, number];
      } else {
        await SpicyFetchCache.remove(processedKey);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('ERR CC', error);
    return null;
  }
}
