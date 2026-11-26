import { Cancel, Defer, Timeout, type Scheduled } from '@hudzax/web-modules/Scheduler';
import lifecycle from '../../utils/lifecycle';

// Spotify Types
type TokenProviderResponse = {
  accessToken: string;
  expiresAtTime: number;
  tokenType: 'Bearer';
};

// Store all our Spotify Services
const Spotify: typeof Spicetify = (globalThis as unknown as { Spicetify: typeof Spicetify })
  .Spicetify;
let SpotifyPlatform: typeof Spicetify.Platform;
let SpotifyInternalFetch: typeof Spicetify.CosmosAsync;

// Spotify Ready Promise. The polling task belongs to this injection's lifecycle;
// cancelling it rejects the wait so an old initializer can finish instead of
// hanging forever while a newer injection takes over.
let readinessTask: Scheduled | null = null;
const OnSpotifyReady = new Promise<void>((resolve, reject) => {
  let settled = false;
  const settle = (callback: () => void): void => {
    if (settled) return;
    settled = true;
    if (readinessTask) {
      Cancel(readinessTask);
      readinessTask = null;
    }
    callback();
  };
  const CheckForServices = () => {
    if (settled) return;
    SpotifyPlatform = Spotify.Platform;
    SpotifyInternalFetch = Spotify.CosmosAsync;

    if (!SpotifyPlatform || !SpotifyInternalFetch) {
      readinessTask = Defer(CheckForServices);
      return;
    }

    settle(resolve);
  };

  CheckForServices();
  lifecycle.trackCallback(() =>
    settle(() => reject(new Error('Spotify readiness cancelled during teardown'))),
  );
});
// A module can be imported by a non-initialization caller that never awaits the
// promise. Keep cancellation from becoming an unhandled rejection in that case.
void OnSpotifyReady.catch(() => {});

// Get Spotify Access Token Function
let tokenProviderResponse: TokenProviderResponse | undefined;
let accessTokenPromise: Promise<string> | undefined;

/** Returns a cached token if still valid (>2s ttl), otherwise fetches a fresh one. */
const GetSpotifyAccessToken = (): Promise<string> => {
  // Fast path: cached token still valid
  if (tokenProviderResponse) {
    const ttlSec = (tokenProviderResponse.expiresAtTime - Date.now()) / 1000;
    if (ttlSec > 2) {
      return Promise.resolve(tokenProviderResponse.accessToken);
    }
    // Expiring imminently: drop it and fall through to fetch
    if (ttlSec <= 2) {
      tokenProviderResponse = undefined;
      // If token is already expired (ttl <= 0) fetch immediately; otherwise wait until expiry
      // but never block negative durations.
      const waitSec = Math.max(0, ttlSec);
      if (waitSec > 0) {
        accessTokenPromise = new Promise<void>((resolve) => Timeout(waitSec, resolve)).then(() => {
          accessTokenPromise = undefined;
          return GetSpotifyAccessToken();
        }) as unknown as Promise<string>;
        return accessTokenPromise;
      }
    }
  }

  if (accessTokenPromise) {
    return accessTokenPromise;
  }

  accessTokenPromise = SpotifyInternalFetch.get('sp://oauth/v2/token')
    .then((result: TokenProviderResponse) => {
      if (result?.accessToken && typeof result.expiresAtTime === 'number') {
        tokenProviderResponse = result;
        return result.accessToken;
      }
      throw new Error('Invalid token response');
    })
    .catch((error: Error) => {
      // Cosmos resolver not yet registered — fallback to Session token
      if (error?.message?.includes('Resolver not found')) {
        if (!SpotifyPlatform.Session) {
          console.warn('Failed to find SpotifyPlatform.Session for fetching token');
          throw error;
        }
        tokenProviderResponse = {
          accessToken: SpotifyPlatform.Session.accessToken,
          expiresAtTime: SpotifyPlatform.Session.accessTokenExpirationTimestampMs,
          tokenType: 'Bearer',
        };
        return tokenProviderResponse.accessToken;
      }
      throw error;
    });

  // Clear the in-flight guard after settlement while still returning the same promise to all concurrent callers
  const inflight = accessTokenPromise;
  inflight
    .catch(() => undefined)
    .finally(() => {
      if (accessTokenPromise === inflight) accessTokenPromise = undefined;
    });

  return inflight;
};

const Platform = {
  OnSpotifyReady,
  GetSpotifyAccessToken,
};

export default Platform;
