import { describe, it, expect, beforeEach } from 'vitest';
import settingsValues from '../src/utils/settingsValues';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

beforeEach(() => {
  spicetify.Spicetify.LocalStorage._store.clear();
});

describe('settingsValues', () => {
  it('gives every key its own unset default', () => {
    expect(settingsValues.get('enableRomaji')).toBe(false);
    expect(settingsValues.get('disableRomajiToggleNotification')).toBe(false);
    expect(settingsValues.get('disableTranslation')).toBe(false);
    expect(settingsValues.get('enableAppBackground')).toBe(false);
    expect(settingsValues.get('enablePlaybarLyrics')).toBe(true);
    expect(settingsValues.get('geminiApiKey')).toBe('');
    expect(settingsValues.get('translationLanguage')).toBe('English');
    expect(settingsValues.get('translationFontSize')).toBe('0.575');
    expect(settingsValues.get('defaultLyricsSize')).toBe('');
  });

  it('writes booleans as the strings the settings UI writes', () => {
    settingsValues.set('enableRomaji', true);
    expect(spicetify.Spicetify.LocalStorage._store.get('AmaiLyrics-enable_romaji')).toBe('true');
    settingsValues.set('enableRomaji', false);
    expect(spicetify.Spicetify.LocalStorage._store.get('AmaiLyrics-enable_romaji')).toBe('false');
    expect(settingsValues.get('enableRomaji')).toBe(false);
  });

  it('decodes "false" as false rather than as truthy text', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-enable_playbar_lyrics', 'false');
    expect(settingsValues.get('enablePlaybarLyrics')).toBe(false);
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-enable_playbar_lyrics', 'true');
    expect(settingsValues.get('enablePlaybarLyrics')).toBe(true);
  });

  it('falls back to the key default for an unrecognised value', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-enable_romaji', 'maybe');
    expect(settingsValues.get('enableRomaji')).toBe(false);
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-enable_playbar_lyrics', 'maybe');
    expect(settingsValues.get('enablePlaybarLyrics')).toBe(true);
  });

  it('round-trips the text settings, empty string included', () => {
    settingsValues.set('translationLanguage', 'Japanese');
    expect(settingsValues.get('translationLanguage')).toBe('Japanese');

    settingsValues.set('defaultLyricsSize', '');
    expect(settingsValues.get('defaultLyricsSize')).toBe('');
    expect(spicetify.Spicetify.LocalStorage._store.has('AmaiLyrics-default_lyrics_size')).toBe(
      true,
    );
  });

  it('reads the legacy SpicyLyrics prefix through the storage leaf', () => {
    spicetify.Spicetify.LocalStorage.set('SpicyLyrics-translation_language', 'Korean');
    expect(settingsValues.get('translationLanguage')).toBe('Korean');
  });
});
