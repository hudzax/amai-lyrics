import { describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

describe('Spotify readiness lifetime', () => {
  it('rejects a pending readiness wait when its lifecycle is disposed', async () => {
    const originalPlatform = spicetify.Spicetify.Platform;
    const originalCosmos = spicetify.Spicetify.CosmosAsync;
    spicetify.Spicetify.Platform = undefined;
    spicetify.Spicetify.CosmosAsync = undefined;
    vi.resetModules();

    try {
      const { default: lifecycle } = await import('../src/utils/lifecycle');
      const { default: Platform } = await import('../src/components/Global/Platform');
      const readiness = Platform.OnSpotifyReady;

      lifecycle.disposeAll();
      const outcome = await Promise.race([
        readiness.then(
          () => 'resolved',
          () => 'rejected',
        ),
        new Promise<string>((resolve) => setTimeout(() => resolve('pending'), 25)),
      ]);

      expect(outcome).toBe('rejected');
    } finally {
      spicetify.Spicetify.Platform = originalPlatform;
      spicetify.Spicetify.CosmosAsync = originalCosmos;
      vi.resetModules();
    }
  });
});
