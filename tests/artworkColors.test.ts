import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isHexColor,
  deriveAccentPalette,
  hexLuminance,
  publishArtworkAccents,
  refreshAccents,
} from '../src/utils/ArtworkColors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

beforeEach(() => {
  spicetify.Spicetify.LocalStorage._store.clear();
  document.documentElement.style.cssText = '';
});

describe('isHexColor', () => {
  it('accepts six-digit hex colours, trimmed and case-insensitive', () => {
    expect(isHexColor('#ff8800')).toBe(true);
    expect(isHexColor('  #FF8800  ')).toBe(true);
    expect(isHexColor('#1db954')).toBe(true);
  });

  it('rejects malformed colours', () => {
    expect(isHexColor('')).toBe(false);
    expect(isHexColor('ff8800')).toBe(false);
    expect(isHexColor('#fff')).toBe(false);
    expect(isHexColor('#ff88000')).toBe(false);
    expect(isHexColor('#gg8800')).toBe(false);
  });
});

describe('deriveAccentPalette', () => {
  it('returns exactly five hex colours led by the picked one', () => {
    const palette = deriveAccentPalette('#3366cc');
    expect(palette).toHaveLength(5);
    expect(palette[0]).toBe('#3366cc');
    for (const hex of palette) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('produces lighter and darker variants around the base', () => {
    const palette = deriveAccentPalette('#3366cc');
    expect(hexLuminance(palette[1])).toBeGreaterThan(hexLuminance('#3366cc'));
    expect(hexLuminance(palette[2])).toBeLessThan(hexLuminance('#3366cc'));
  });
});

describe('publishArtworkAccents accent override', () => {
  it('applies the custom palette without fetching when the mode is custom', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network'));
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-accent_color_mode', 'custom');
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-custom_accent_color', '#ff8800');

    await publishArtworkAccents('https://example.com/cover.jpg');

    // #ff8800 is already above the readability floor, so it publishes as-is.
    const root = document.documentElement.style;
    expect(root.getPropertyValue('--amai-accent-1')).toBe('#ff8800');
    expect(root.getPropertyValue('--amai-accent-rgb')).toBe('255, 136, 0');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('clears the inline accents when the mode is preset so the CSS defaults show', async () => {
    document.documentElement.style.setProperty('--amai-accent-1', '#123456');
    document.documentElement.style.setProperty('--amai-accent-rgb', '18, 52, 86');
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-accent_color_mode', 'preset');

    await publishArtworkAccents('https://example.com/cover.jpg');

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--amai-accent-1')).toBe('');
    expect(root.getPropertyValue('--amai-accent-rgb')).toBe('');
  });

  it('ignores an invalid custom colour and falls back to extraction', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network'));
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-accent_color_mode', 'custom');
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-custom_accent_color', 'not-a-color');

    await publishArtworkAccents('https://example.com/cover.jpg');

    // The fetch attempt is the fallback proof: extraction ran, and with no
    // decodable artwork the vars end up removed.
    expect(fetchSpy).toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue('--amai-accent-1')).toBe('');
    fetchSpy.mockRestore();
  });
});

describe('refreshAccents', () => {
  it('republishes the override for an explicit cover URL', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network'));
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-accent_color_mode', 'custom');
    // Above the readability floor so it publishes unlifted.
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-custom_accent_color', '#22cc77');

    // The override branch of publishArtworkAccents runs synchronously: the
    // vars are set by the time refreshAccents returns.
    refreshAccents('https://example.com/cover.jpg');

    expect(document.documentElement.style.getPropertyValue('--amai-accent-rgb')).toBe(
      '34, 204, 119',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
