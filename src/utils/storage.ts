const PREFIX = 'AmaiLyrics-';
const LEGACY_PREFIX = 'SpicyLyrics-';

export type StorageValue = string | null;

/** Central registry of known storage keys — add new keys here for autocomplete & typo safety. */
export const StorageKeys = {
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  ENABLE_ROMAJI: 'enable_romaji',
  DISABLE_ROMAJI_TOGGLE_NOTIFICATION: 'disable_romaji_toggle_notification',
  DISABLE_TRANSLATION: 'disable_translation',
  TRANSLATION_LANGUAGE: 'translation_language',
  TRANSLATION_FONT_SIZE: 'translation_font_size',
  DEFAULT_LYRICS_SIZE: 'default_lyrics_size',
  ENABLE_PLAYBAR_LYRICS: 'enable_playbar_lyrics',
  ENABLE_APP_BACKGROUND: 'enable_app_background',
  CURRENT_LYRICS_DATA: 'currentLyricsData',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys] | (string & {});

function set(key: StorageKey, value: StorageValue): void {
  const fullKey = `${PREFIX}${key}`;
  if (value === null) {
    Spicetify.LocalStorage.remove(fullKey);
    // Also clear legacy key so migration stays consistent
    Spicetify.LocalStorage.remove(`${LEGACY_PREFIX}${key}`);
    return;
  }
  Spicetify.LocalStorage.set(fullKey, value);
}

function get(key: StorageKey): StorageValue {
  const v = Spicetify.LocalStorage.get(`${PREFIX}${key}`);
  if (v !== null && v !== undefined) return v as string;
  // Fallback to legacy prefix for migrations from SpicyLyrics
  const legacy = Spicetify.LocalStorage.get(`${LEGACY_PREFIX}${key}`);
  return (legacy as string) ?? null;
}

export default {
  set,
  get,
  PREFIX,
  LEGACY_PREFIX,
  Keys: StorageKeys,
};
