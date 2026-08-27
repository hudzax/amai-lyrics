const PREFIX = 'AmaiLyrics-';
const LEGACY_PREFIX = 'SpicyLyrics-';

export type StorageValue = string | null;

function set(key: string, value: StorageValue): void {
  const fullKey = `${PREFIX}${key}`;
  if (value === null) {
    Spicetify.LocalStorage.remove(fullKey);
    // Also clear legacy key so migration stays consistent
    Spicetify.LocalStorage.remove(`${LEGACY_PREFIX}${key}`);
    return;
  }
  Spicetify.LocalStorage.set(fullKey, value);
}

function get(key: string): StorageValue {
  const v = Spicetify.LocalStorage.get(`${PREFIX}${key}`);
  if (v !== null && v !== undefined) return v as string;
  // Fallback to legacy prefix for migrations from SpicyLyrics
  const legacy = Spicetify.LocalStorage.get(`${LEGACY_PREFIX}${key}`);
  return (legacy as string) ?? null;
}

/**
 * Migrate a single legacy key to the new prefix once, then delete the legacy entry.
 */
function migrateLegacyKey(key: string): void {
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
  migrateLegacyKey,
  PREFIX,
  LEGACY_PREFIX,
};
