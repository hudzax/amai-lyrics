import storage from './storage';
import { StorageKeys } from './storageKeys';
import {
  DEFAULT_BACKGROUND_INTENSITY,
  DEFAULT_BACKGROUND_MOTION,
  isBackgroundIntensity,
  isBackgroundMotion,
} from './themeOptions';
import type { BackgroundIntensity, BackgroundMotion } from './themeOptions';

/**
 * The settings-values seam: one owner per storage-backed setting, so a caller
 * names the setting and gets its decoded value. The storage key, the string
 * encoding and the unset default live here, not at the call sites.
 *
 * Readers used to re-derive the encoding (`storage.get('enable_romaji') === 'true'`)
 * and two readers of one key could disagree about what unset means. The values
 * are written by the settings UI (`settings.ts` mirrors the vendored field
 * store in), then read by the product through `get`.
 */
export interface SettingValues {
  geminiApiKey: string;
  enableRomaji: boolean;
  disableRomajiToggleNotification: boolean;
  disableTranslation: boolean;
  translationLanguage: string;
  translationFontSize: string;
  defaultLyricsSize: string;
  enablePlaybarLyrics: boolean;
  enableAppBackground: boolean;
  backgroundIntensity: BackgroundIntensity;
  backgroundMotion: BackgroundMotion;
  accentColorMode: string;
  customAccentColor: string;
}

interface Codec<T> {
  key: string;
  decode: (raw: string | null) => T;
  encode: (value: T) => string;
}

function booleanCodec(key: string, fallback: boolean): Codec<boolean> {
  return {
    key,
    decode: (raw) => (raw === 'true' ? true : raw === 'false' ? false : fallback),
    encode: (value) => (value ? 'true' : 'false'),
  };
}

function textCodec(key: string, fallback = ''): Codec<string> {
  return {
    key,
    decode: (raw) => raw ?? fallback,
    encode: (value) => value,
  };
}

function enumCodec<T extends string>(
  key: string,
  isValue: (value: unknown) => value is T,
  fallback: T,
): Codec<T> {
  return {
    key,
    decode: (raw) => (isValue(raw) ? raw : fallback),
    encode: (value) => value,
  };
}

const CODECS: { [K in keyof SettingValues]: Codec<SettingValues[K]> } = {
  geminiApiKey: textCodec(StorageKeys.GEMINI_API_KEY),
  enableRomaji: booleanCodec(StorageKeys.ENABLE_ROMAJI, false),
  disableRomajiToggleNotification: booleanCodec(
    StorageKeys.DISABLE_ROMAJI_TOGGLE_NOTIFICATION,
    false,
  ),
  disableTranslation: booleanCodec(StorageKeys.DISABLE_TRANSLATION, false),
  translationLanguage: textCodec(StorageKeys.TRANSLATION_LANGUAGE, 'English'),
  translationFontSize: textCodec(StorageKeys.TRANSLATION_FONT_SIZE, '0.575'),
  defaultLyricsSize: textCodec(StorageKeys.DEFAULT_LYRICS_SIZE),
  enablePlaybarLyrics: booleanCodec(StorageKeys.ENABLE_PLAYBAR_LYRICS, true),
  enableAppBackground: booleanCodec(StorageKeys.ENABLE_APP_BACKGROUND, false),
  backgroundIntensity: enumCodec(
    StorageKeys.BG_INTENSITY,
    isBackgroundIntensity,
    DEFAULT_BACKGROUND_INTENSITY,
  ),
  backgroundMotion: enumCodec(StorageKeys.BG_MOTION, isBackgroundMotion, DEFAULT_BACKGROUND_MOTION),
  accentColorMode: textCodec(StorageKeys.ACCENT_COLOR_MODE, 'auto'),
  customAccentColor: textCodec(StorageKeys.CUSTOM_ACCENT_COLOR, ''),
};

function get<K extends keyof SettingValues>(name: K): SettingValues[K] {
  const codec = CODECS[name];
  return codec.decode(storage.get(codec.key));
}

function set<K extends keyof SettingValues>(name: K, value: SettingValues[K]): void {
  const codec = CODECS[name];
  storage.set(codec.key, codec.encode(value));
}

export default { get, set };
