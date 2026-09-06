import { describe, it, expect, beforeEach } from 'vitest';
import storage from '../src/utils/storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

function clearStore(): void {
  spicetify.Spicetify.LocalStorage._store.clear();
}

beforeEach(() => {
  clearStore();
});

describe('storage', () => {
  it('sets and gets with the AmaiLyrics prefix', () => {
    storage.set('my-key', 'value');
    expect(storage.get('my-key')).toBe('value');
    expect(spicetify.Spicetify.LocalStorage._store.has('AmaiLyrics-my-key')).toBe(true);
  });

  it('removes both new and legacy keys when set to null', () => {
    storage.set('k', 'v');
    spicetify.Spicetify.LocalStorage.set('SpicyLyrics-k', 'legacy');
    storage.set('k', null);
    expect(storage.get('k')).toBeNull();
    expect(spicetify.Spicetify.LocalStorage._store.has('SpicyLyrics-k')).toBe(false);
  });

  it('falls back to the legacy SpicyLyrics prefix', () => {
    spicetify.Spicetify.LocalStorage.set('SpicyLyrics-legacy-key', 'old-value');
    expect(storage.get('legacy-key')).toBe('old-value');
  });

  it('prefers the new prefix over legacy', () => {
    spicetify.Spicetify.LocalStorage.set('SpicyLyrics-both', 'old');
    storage.set('both', 'new');
    expect(storage.get('both')).toBe('new');
  });

  it('getBoolean/setBoolean round-trip with fallback', () => {
    expect(storage.getBoolean('flag', true)).toBe(true);
    expect(storage.getBoolean('flag')).toBe(false);
    storage.setBoolean('flag', true);
    expect(storage.getBoolean('flag')).toBe(true);
    storage.setBoolean('flag', false);
    expect(storage.getBoolean('flag')).toBe(false);
  });

  it('migrateLegacyKey moves the value and deletes the legacy entry', () => {
    spicetify.Spicetify.LocalStorage.set('SpicyLyrics-mig', 'data');
    storage.migrateLegacyKey('mig');
    expect(storage.get('mig')).toBe('data');
    expect(spicetify.Spicetify.LocalStorage._store.has('SpicyLyrics-mig')).toBe(false);
  });

  it('migrateLegacyKey keeps an existing new-prefix value', () => {
    storage.set('keep', 'new');
    spicetify.Spicetify.LocalStorage.set('SpicyLyrics-keep', 'old');
    storage.migrateLegacyKey('keep');
    expect(storage.get('keep')).toBe('new');
    expect(spicetify.Spicetify.LocalStorage._store.has('SpicyLyrics-keep')).toBe(false);
  });
});
