import { SettingsSection } from '../edited_packages/spcr-settings/settingsSection';
import storage from './storage';
import { lyricsCache } from './Lyrics/fetchLyrics';
import Defaults from '../components/Global/Defaults';
import fetchLyrics from './Lyrics/fetchLyrics';
import ApplyLyrics from './Lyrics/Global/Applyer';

export function setSettingsMenu() {
  generalSettings();
  devSettings();
  infos();
}

function devSettings() {
  const settings = new SettingsSection(
    'Amai - Dev Settings',
    'amai-dev-settings',
  );

  /*     settings.addInput("custom-lyrics-api", "Custom Lyrics API", Defaults.lyrics.api.url, () => {
        storage.set("customLyricsApi", settings.getFieldValue("custom-lyrics-api") as string)
        Spicetify.showNotification("Custom Lyrics API Updated Successfully!", false, 1000);
    });

    settings.addInput("lyrics-api-access-token", "Lyrics API Access Token", Defaults.lyrics.api.accessToken, () => { 
        storage.set("lyricsApiAccessToken", settings.getFieldValue("lyrics-api-access-token") as string)
        Spicetify.showNotification("Lyrics API Access Token Updated Successfully!", false, 1000);
    });

    settings.addButton("reset-custom-apis", "Reset Custom APIs", "Reset to Default", () => {
        settings.setFieldValue("custom-lyrics-api", Defaults.lyrics.api.url);
        settings.setFieldValue("lyrics-api-access-token", Defaults.lyrics.api.accessToken);

        storage.set("customLyricsApi", Defaults.lyrics.api.url)
        storage.set("lyricsApiAccessToken", Defaults.lyrics.api.accessToken)

        settings.rerender();

        Spicetify.showNotification("Custom APIs Reset Successfully!", false, 3000);
    }); */

  settings.addButton(
    'remove-cached-lyrics',
    'Remove Cached Lyrics',
    'Remove Cached Lyrics',
    () => {
      lyricsCache.destroy();
      storage.set('currentLyricsData', null);
      Spicetify.showNotification('Cache Destroyed Successfully!', false, 2000);
    },
  );

  // settings.addButton(
  //   'remove-current-song-lyrics-from-localStorage',
  //   'Remove Current Song Lyrics from LocalStorage',
  //   'Remove Current Lyrics',
  //   () => {
  //     storage.set('currentLyricsData', null);
  //     Spicetify.showNotification(
  //       'Current Lyrics Removed Successfully!',
  //       false,
  //       2000,
  //     );
  //   },
  // );

  settings.addButton('reload', 'Reload UI', 'Reload', () => {
    window.location.reload();
  });

  settings.pushSettings();
}

function generalSettings() {
  const settings = new SettingsSection('Amai - Settings', 'amai-settings');

  //   settings.addToggle(
  //     'skip-spicy-font',
  //     'Skip Spicy Font**',
  //     Defaults.SkipSpicyFont,
  //     () => {
  //       storage.set(
  //         'skip-spicy-font',
  //         settings.getFieldValue('skip-spicy-font') as string,
  //       );
  //     },
  //   );

  //   settings.addToggle(
  //     'old-style-font',
  //     'Old Style Font (Gets Overriden by the previous option)',
  //     Defaults.OldStyleFont,
  //     () => {
  //       storage.set(
  //         'old-style-font',
  //         settings.getFieldValue('old-style-font') as string,
  //       );
  //     },
  //   );

  // settings.addDropDown(
  //   'lyrics_spacing',
  //   'Lyrics Spacing',
  //   ['None', 'Small', 'Medium', 'Large', 'Extra Large'],
  //   Defaults.lyrics_spacing,
  //   () => {
  //     storage.set(
  //       'lyrics_spacing',
  //       settings.getFieldValue('lyrics_spacing') as string,
  //     );
  //   },
  // );

  settings.addInput('gemini-api-key', 'Gemini API Key', '', () => {
    storage.set(
      'GEMINI_API_KEY',
      settings.getFieldValue('gemini-api-key') as string,
    );

    // clear cache and current lyrics data
    lyricsCache.destroy();
    storage.set('currentLyricsData', null);
    // Refetch lyrics for the current song
    const playerData = Spicetify.Player.data as Spicetify.PlayerState;
    if (!playerData?.item?.uri) return; // Exit if `uri` is not available
    const currentUri = playerData.item.uri;
    fetchLyrics(currentUri).then(ApplyLyrics);
  });

  settings.addButton(
    'get-gemini-api',
    'Get your own Gemini API here',
    'get API Key',
    () => {
      window.location.href = 'https://aistudio.google.com/app/apikey/';
    },
  );

  settings.addToggle(
    'enableRomaji',
    'Enable Romaji for Japanese Lyrics',
    Defaults.enableRomaji,
    () => {
      // clear cache and current lyrics data
      lyricsCache.destroy();
      storage.set('currentLyricsData', null);
      storage.set(
        'enable_romaji',
        settings.getFieldValue('enableRomaji') as string,
      );
    },
  );

  settings.addToggle(
    'disableRomajiToggleNotification',
    'Disable Romaji/Furigana Toggle Notification',
    Defaults.disableRomajiToggleNotification,
    () => {
      storage.set(
        'disable_romaji_toggle_notification',
        settings.getFieldValue('disableRomajiToggleNotification') as string,
      );
    },
  );

  settings.addDropDown(
    'translation-language',
    'Translation Language',
    ['English', 'Indonesian', 'Malay'],
    0,
    () => {
      const selected = settings.getFieldValue('translation-language') as string;
      storage.set('translation_language', selected);

      // clear cache and current lyrics data
      lyricsCache.destroy();
      storage.set('currentLyricsData', null);
    },
  );

  settings.addToggle(
    'disableTranslation',
    'Disable Translation',
    Defaults.disableTranslation,
    () => {
      // clear cache and current lyrics data
      lyricsCache.destroy();
      storage.set('currentLyricsData', null);
      storage.set(
        'disable_translation',
        settings.getFieldValue('disableTranslation') as string,
      );
    },
  );

  settings.pushSettings();
}

function infos() {
  const settings = new SettingsSection('Amai - Info', 'amai-info');

  settings.addButton(
    'more-info',
    'Enhances your Spotify experience with Furigana for Japanese Kanji, Romaji for Japanese lyrics, Romanization for Korean lyrics, and line-by-line translations powered by Google Gemini AI.',
    `v${Defaults.Version}`,
    () => {
      window.location.href = 'https://github.com/hudzax/amai-lyrics';
    },
  );

  settings.addButton(
    'report-issue',
    'Found a bug or have a feature request?',
    'Report Issue',
    () => {
      window.location.href = 'https://github.com/hudzax/amai-lyrics/issues';
    },
  );

  settings.pushSettings();
}
