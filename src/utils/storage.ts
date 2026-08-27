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
  CURRENT_LYRICS_DATA: 'currentLyricsData',
  LAST_FETCHED_URI: 'lastFetchedUri',
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

/** Typed helpers for boolean-backed settings stored as "true"/"false" strings. */
function getBoolean(key: StorageKey, fallback = false): boolean {
  const v = get(key);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}
function setBoolean(key: StorageKey, value: boolean): void {
  set(key, value ? 'true' : 'false');
}

/**
 * Migrate a single legacy key to the new prefix once, then delete the legacy entry.
 */
function migrateLegacyKey(key: StorageKey): void {
  const legacyVal = Spicetify.LocalStorage.get(`${LEGACY_PREFIX}${key}`);
  const newVal = Spicetify.LocalStorage.get(`${PREFIX}${key}`);
  if (legacyVal != null && newVal == null) {
    Spicetify.LocalStorage.set(`${PREFIX}${key}`, legacyVal as string);
  }
  if (legacyVal != null) {
    Spicetify.LocalStorage.remove(`${LEGACY_PREFIX}${key}`);
  }
}

export default {
  set,
  get,
  getBoolean,
  setBoolean,
  migrateLegacyKey,
  PREFIX,
  LEGACY_PREFIX,
  Keys: StorageKeys,
};
