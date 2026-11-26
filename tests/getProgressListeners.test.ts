import { describe, expect, it, vi } from 'vitest';

describe('playback observer lifetime', () => {
  it('removes its player and document observers on teardown', async () => {
    const removePlayer = vi.spyOn(Spicetify.Player, 'removeEventListener');
    const removeDocument = vi.spyOn(document, 'removeEventListener');
    vi.resetModules();

    try {
      const { default: lifecycle } = await import('../src/utils/lifecycle');
      await import('../src/utils/Gets/GetProgress');

      lifecycle.disposeAll();

      expect(removePlayer).toHaveBeenCalledWith('onprogress', expect.any(Function));
      expect(removeDocument).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    } finally {
      vi.restoreAllMocks();
      vi.resetModules();
    }
  });
});
