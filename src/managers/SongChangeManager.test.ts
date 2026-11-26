import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sleep: vi.fn(),
  loadAndApplyLyrics: vi.fn(async () => ({ status: 'NO_LYRICS' })),
  updateNowBar: vi.fn(async () => undefined),
}));

vi.mock('../utils/sleep', () => ({ default: mocks.sleep }));
vi.mock('../utils/Lyrics/fetchLyrics', () => ({ loadAndApplyLyrics: mocks.loadAndApplyLyrics }));
vi.mock('../components/NowBar/NowBar', () => ({ UpdateNowBar: mocks.updateNowBar }));

import { SongChangeManager } from './SongChangeManager';
import type { ButtonManager } from './ButtonManager';
import type { ArtworkSurfaces } from '../components/DynamicBG/ArtworkSurfaces';

describe('SongChangeManager lifetime', () => {
  it('drops a song-change continuation after dispose', async () => {
    const originalItem = Spicetify.Player.data.item;
    let finishSleep: (() => void) | undefined;
    mocks.sleep.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishSleep = resolve;
      }),
    );
    const buttonManager = { updateRegistration: vi.fn() };
    const surfaces = { cancelPending: vi.fn(), applyArtwork: vi.fn() };
    const manager = new SongChangeManager(
      buttonManager as unknown as ButtonManager,
      surfaces as unknown as ArtworkSurfaces,
    );

    const handling = manager.handleSongChange({});
    manager.dispose();
    Spicetify.Player.data.item = { ...originalItem, uri: 'spotify:track:late' };
    finishSleep?.();
    await handling;

    expect(mocks.loadAndApplyLyrics).not.toHaveBeenCalled();
    expect(buttonManager.updateRegistration).not.toHaveBeenCalled();
    expect(surfaces.applyArtwork).not.toHaveBeenCalled();
    Spicetify.Player.data.item = originalItem;
  });
});
