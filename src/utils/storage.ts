import type { StorageKey } from './storageKeys';

const PREFIX = 'AmaiLyrics-';
const LEGACY_PREFIX = 'SpicyLyrics-';

export type StorageValue = string | null;

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
};
