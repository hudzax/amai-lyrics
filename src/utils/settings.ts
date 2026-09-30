import { SettingsSection } from '../edited_packages/spcr-settings/settingsSection';
import settingsValues from './settingsValues';
import { invalidateLyrics } from './Lyrics/fetchLyrics';
import Defaults from '../components/Global/Defaults';
import { openTrustedExternalUrl } from './externalNavigation';
import { applyThemeSettings } from './ThemeSettings';
import { refreshAccents, isHexColor } from './ArtworkColors';

export function setSettingsMenu() {
  amaiSettingsSections.length = 0;
  // The theme section leads: it hosts the "Enable Amai Theme" toggle plus the
  // look options, and render order follows registration order on both mount
  // points (preferences page append order, modal slot order).
  themeSettings();
  generalSettings();
  devSettings();
  infos();
}

/**
 * The live Amai settings sections. Shared by the `/preferences` page render
 * and the lyrics-page settings modal so both mount the same fields, values
 * and change handlers — only the mount point differs.
 */
const amaiSettingsSections: SettingsSection[] = [];

export function getAmaiSettingsSections(): SettingsSection[] {
  return amaiSettingsSections;
}

/** The option rows of "Amai - Theme" that only exist while the theme is on. */
const themeOptionFieldIds = [
  'theme-bg-intensity',
  'theme-bg-motion',
  'accent-color-mode',
  'custom-accent-color',
];

function devSettings() {
  const settings = new SettingsSection('Amai - Dev Settings', 'amai-dev-settings');

  settings.addButton(
    'remove-cached-lyrics',
    'Delete all locally cached lyrics',
    'Clear Cache',
    () => {
      // Dev action: wipe everything cached and let the user reload Spotify.
      void invalidateLyrics({ all: true });
      Spicetify.showNotification('Cache Destroyed Successfully!', false, 2000);
    },
  );

  settings.addButton('reload', 'Reload Spotify to apply changes', 'Reload Spotify', () => {
    window.location.reload();
  });

  settings.pushSettings();
  amaiSettingsSections.push(settings);
}

function generalSettings() {
  const settings = new SettingsSection('Amai - Settings', 'amai-settings');

  settings.addInput('gemini-api-key', 'Gemini API Key (required for translations)', '', () => {
    settingsValues.set('geminiApiKey', settings.getFieldValue('gemini-api-key') as string);

    // A new key changes every enhancement: invalidate everything and reload the
    // current track's lyrics through the pipeline seam.
    invalidateLyrics({ all: true }, { reload: true }).catch((e) =>
      console.error('[Amai Lyrics] Refetch after API key change failed:', e),
    );
  });

  settings.addButton(
    'get-gemini-api',
    'No key yet? Get a free Gemini API key',
    'Get Free API Key',
    () => {
      openTrustedExternalUrl('https://aistudio.google.com/app/apikey/', '_self');
    },
  );

  settings.addToggle(
    'enableRomaji',
    'Show Romaji readings for Japanese lyrics',
    settingsValues.get('enableRomaji'),
    () => {
      // Cached lyrics carry the old romaji setting: write the new value first,
      // then invalidate and reload so the current track re-fetches with
      // phonetics applied (or removed) under the new setting.
      settingsValues.set('enableRomaji', settings.getFieldValue('enableRomaji') as boolean);
      void invalidateLyrics({ all: true }, { reload: true });
    },
  );

  settings.addToggle(
    'disableRomajiToggleNotification',
    'Hide the popup shown when toggling Romaji/Furigana',
    settingsValues.get('disableRomajiToggleNotification'),
    () => {
      settingsValues.set(
        'disableRomajiToggleNotification',
        settings.getFieldValue('disableRomajiToggleNotification') as boolean,
      );
    },
  );

  settings.addToggle(
    'enablePlaybarLyrics',
    'Show the current lyric line in the playbar',
    settingsValues.get('enablePlaybarLyrics'),
    () => {
      settingsValues.set(
        'enablePlaybarLyrics',
        settings.getFieldValue('enablePlaybarLyrics') as boolean,
      );
    },
  );

  const translationLanguageOptions = [
    'English',
    'Spanish',
    'French',
    'German',
    'Portuguese',
    'Chinese (Simplified)',
    'Thai',
    'Indonesian',
    'Malay',
    'Japanese',
    'Korean',
  ];
  // Seeded from the stored value, not the option order: the section instance is
  // rebuilt on every injection, so a hardcoded index would show English while
  // the engine translated into whatever the user picked.
  const languageIndex = Math.max(
    0,
    translationLanguageOptions.indexOf(settingsValues.get('translationLanguage')),
  );

  settings.addDropDown(
    'translation-language',
    'Translate lyrics into',
    translationLanguageOptions,
    languageIndex,
    () => {
      settingsValues.set(
        'translationLanguage',
        settings.getFieldValue('translation-language') as string,
      );

      // Cached lyrics carry the old target language: invalidate and reload.
      void invalidateLyrics({ all: true }, { reload: true });
    },
  );

  settings.addToggle(
    'disableTranslation',
    'Turn off lyric translations',
    settingsValues.get('disableTranslation'),
    () => {
      // Cached lyrics carry the old translation state: write the new value
      // first, then invalidate and reload so the re-fetch sees it.
      settingsValues.set(
        'disableTranslation',
        settings.getFieldValue('disableTranslation') as boolean,
      );
      void invalidateLyrics({ all: true }, { reload: true });
    },
  );

  const translationFontSizeOptions = ['Extra Small', 'Small', 'Normal', 'Large', 'Extra Large'];
  // Values are multipliers of the main lyrics size so the translation scales with the screen
  const fontSizeValues = ['0.4', '0.475', '0.575', '0.7', '0.85'];
  const currentSize = settingsValues.get('translationFontSize');
  const defaultIndex =
    fontSizeValues.indexOf(currentSize) !== -1 ? fontSizeValues.indexOf(currentSize) : 2;

  settings.addDropDown(
    'translation-font-size',
    'Translation text size',
    translationFontSizeOptions,
    defaultIndex,
    () => {
      const selected = settings.getFieldValue('translation-font-size') as string;
      const index = translationFontSizeOptions.indexOf(selected);
      const value = fontSizeValues[index >= 0 ? index : 2];
      settingsValues.set('translationFontSize', value);

      const container = document.querySelector<HTMLElement>(
        '#AmaiLyricsPage .LyricsContainer .LyricsContent',
      );
      if (container) {
        container.style.setProperty('--TranslationFontSize', value);
      }
    },
  );

  const lyricsSizeOptions = ['Extra Small', 'Small', 'Normal', 'Large', 'Extra Large'];
  const lyricsSizeValues = ['1.2', '1.5', '', '2.5', '3'];
  const currentLyricsSize = settingsValues.get('defaultLyricsSize');
  const defaultLyricsSizeIndex = currentLyricsSize
    ? Math.max(0, lyricsSizeValues.indexOf(currentLyricsSize))
    : 2;

  settings.addDropDown(
    'default-lyrics-size',
    'Main lyrics text size',
    lyricsSizeOptions,
    defaultLyricsSizeIndex,
    () => {
      const selected = settings.getFieldValue('default-lyrics-size') as string;
      const index = lyricsSizeOptions.indexOf(selected);
      const value = lyricsSizeValues[index >= 0 ? index : 2];
      settingsValues.set('defaultLyricsSize', value);

      const container = document.querySelector<HTMLElement>(
        '#AmaiLyricsPage .LyricsContainer .LyricsContent',
      );
      if (container) {
        if (value) {
          container.style.setProperty('--DefaultLyricsSize', value + 'rem');
        } else {
          container.style.removeProperty('--DefaultLyricsSize');
        }
      }
    },
  );

  settings.pushSettings();
  amaiSettingsSections.push(settings);
}

function themeSettings() {
  const settings = new SettingsSection('Amai - Theme', 'amai-theme-settings');

  // Featured first: the section anchor and the gate for the option rows below
  // it (render order follows registration order). Toggling live shows/hides
  // those rows through setFieldsVisible — the section itself always renders.
  settings.addToggle(
    'enableAppBackground',
    'Enable Amai Theme (dynamic album-art background)',
    settingsValues.get('enableAppBackground'),
    () => {
      const enabled = settings.getFieldValue('enableAppBackground') as boolean;
      settingsValues.set('enableAppBackground', enabled);
      // The look options only exist while the theme is live.
      settings.setFieldsVisible(themeOptionFieldIds, enabled);
      // Shared singleton: preserves the lastImgUrl dedup cache (a throwaway
      // `new AppBackground()` per toggle always misses and rebuilds). The
      // change event lets app.tsx repaint hidden canvases (sidebar/page skip
      // their work while the app canvas is live) through the LIVE instances.
      if (enabled) {
        const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url as string | undefined;
        void Promise.all([
          import('../components/DynamicBG/AppBackground'),
          import('../components/DynamicBG/identity'),
        ]).then(([{ appBackgroundSingleton, syncAppBgMarker }, { syncLibraryGridState }]) => {
          syncAppBgMarker(true);
          appBackgroundSingleton.apply(coverUrl);
          syncLibraryGridState();
          window.dispatchEvent(new Event('amai:appbg-changed'));
        });
      } else {
        void import('../components/DynamicBG/AppBackground').then(({ appBackgroundSingleton }) => {
          appBackgroundSingleton.remove();
          window.dispatchEvent(new Event('amai:appbg-changed'));
        });
      }
    },
  );

  // ---- Amai Theme look options -------------------------------------------
  // All live-applied: the DOM presets land through applyThemeSettings (root
  // CSS vars + motion-off class), the WebGL canvas through its forwarders on
  // the shared AppBackground singleton, the accents through refreshAccents.
  // Nothing here touches cached lyrics, so no invalidateLyrics anywhere.

  const bgIntensityOptions = ['Subtle', 'Normal', 'Intense'];
  const bgIntensityValues = ['subtle', 'normal', 'intense'];
  const currentIntensity = settingsValues.get('backgroundIntensity');
  const bgIntensityIndex =
    bgIntensityValues.indexOf(currentIntensity) !== -1
      ? bgIntensityValues.indexOf(currentIntensity)
      : 1;

  settings.addDropDown(
    'theme-bg-intensity',
    'Amai Theme intensity (background blur, color and brightness)',
    bgIntensityOptions,
    bgIntensityIndex,
    () => {
      const selected = settings.getFieldValue('theme-bg-intensity') as string;
      const index = bgIntensityOptions.indexOf(selected);
      settingsValues.set('backgroundIntensity', bgIntensityValues[index >= 0 ? index : 1]);
      applyThemeSettings();
      // GL-only forward (the CSS layers follow the root vars immediately);
      // dynamic import keeps the AppBackground chunk out of settings.ts.
      void import('../components/DynamicBG/AppBackground').then(({ appBackgroundSingleton }) => {
        appBackgroundSingleton.applyIntensitySetting();
      });
    },
  );

  const bgMotionOptions = ['Off', 'Slow', 'Normal', 'Fast'];
  const bgMotionValues = ['off', 'slow', 'normal', 'fast'];
  const currentMotion = settingsValues.get('backgroundMotion');
  const bgMotionIndex =
    bgMotionValues.indexOf(currentMotion) !== -1 ? bgMotionValues.indexOf(currentMotion) : 2;

  settings.addDropDown(
    'theme-bg-motion',
    'Background motion (rotation, drift and pulse speed)',
    bgMotionOptions,
    bgMotionIndex,
    () => {
      const selected = settings.getFieldValue('theme-bg-motion') as string;
      const index = bgMotionOptions.indexOf(selected);
      settingsValues.set('backgroundMotion', bgMotionValues[index >= 0 ? index : 2]);
      applyThemeSettings();
      void import('../components/DynamicBG/AppBackground').then(({ appBackgroundSingleton }) => {
        appBackgroundSingleton.applyMotionSetting();
      });
    },
  );

  const accentModeOptions = ['From album art', 'Spotify green', 'Custom color'];
  const accentModeValues = ['auto', 'preset', 'custom'];
  const currentAccentMode = settingsValues.get('accentColorMode');
  const accentModeIndex =
    accentModeValues.indexOf(currentAccentMode) !== -1
      ? accentModeValues.indexOf(currentAccentMode)
      : 0;

  settings.addDropDown(
    'accent-color-mode',
    'Accent colors (highlights, gradients and glow)',
    accentModeOptions,
    accentModeIndex,
    () => {
      const selected = settings.getFieldValue('accent-color-mode') as string;
      const index = accentModeOptions.indexOf(selected);
      settingsValues.set('accentColorMode', accentModeValues[index >= 0 ? index : 0]);
      refreshAccents();
    },
  );

  // inputType 'color' renders Spotify's native colour picker (the vendored
  // field renderer passes inputType straight to the input element).
  settings.addInput(
    'custom-accent-color',
    'Custom accent color (used while Accent colors is Custom)',
    settingsValues.get('customAccentColor') || '#1db954',
    () => {
      const hex = (settings.getFieldValue('custom-accent-color') as string).trim().toLowerCase();
      if (!isHexColor(hex)) return;
      settingsValues.set('customAccentColor', hex);
      refreshAccents();
    },
    'color',
  );

  // The option rows start gated by the stored toggle value so a fresh render
  // — preferences navigation, modal open — already agrees with the engine;
  // the toggle handler keeps them in sync from there. (rerender is a no-op
  // before anything is mounted.)
  settings.setFieldsVisible(themeOptionFieldIds, settingsValues.get('enableAppBackground'));

  settings.pushSettings();
  amaiSettingsSections.push(settings);
}

function infos() {
  const settings = new SettingsSection('Amai - Info', 'amai-info');

  settings.addButton(
    'more-info',
    'Enhances your Spotify experience with Furigana for Japanese Kanji, Romaji for Japanese lyrics, Romanization for Korean lyrics, and line-by-line translations powered by Google Gemini AI.',
    `v${Defaults.Version}`,
    () => {
      openTrustedExternalUrl('https://github.com/hudzax/amai-lyrics', '_self');
    },
  );

  settings.addButton(
    'report-issue',
    'Found a bug or have a feature request?',
    'Report Issue',
    () => {
      openTrustedExternalUrl('https://github.com/hudzax/amai-lyrics/issues', '_self');
    },
  );

  settings.pushSettings();
  amaiSettingsSections.push(settings);
}
