/** Central registry of known storage keys — add new keys here for typo safety. */
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
  BG_INTENSITY: 'background_intensity',
  BG_MOTION: 'background_motion',
  ACCENT_COLOR_MODE: 'accent_color_mode',
  CUSTOM_ACCENT_COLOR: 'custom_accent_color',
  CURRENT_LYRICS_DATA: 'currentLyricsData',
  // These keep their original casing so existing user state survives.
  IS_NOW_BAR_OPEN: 'IsNowBarOpen',
  NOW_BAR_SIDE: 'NowBarSide',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys] | (string & {});
