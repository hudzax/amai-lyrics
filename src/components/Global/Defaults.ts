import * as packageJson from '../../../package.json';
import {
  SYSTEM_INSTRUCTION,
  TRANSLATION_PROMPT,
  ROMAJA_PROMPT,
  FURIGANA_PROMPT,
  ROMAJI_PROMPT,
} from '../../constants/prompts';

const Defaults = {
  Version: packageJson.version,
  lyrics: {
    api: {
      url: 'https://amai-worker-production.nandemo.workers.dev/lyrics',
      translationUrl: 'https://amai-worker-production.nandemo.workers.dev/translations',
      phoneticUrl: 'https://amai-worker-production.nandemo.workers.dev/phonetic',
    },
  },
  CurrentLyricsType: 'None',
  LyricsContainerExists: false,
  lyrics_spacing: 2,
  enableRomaji: false,
  disableRomajiToggleNotification: false,
  disableTranslation: false,
  translationFontSize: '0.575',
  defaultLyricsSize: '',
  translationLanguage: 'English',
  systemInstruction: SYSTEM_INSTRUCTION,
  translationPrompt: TRANSLATION_PROMPT,
  romajaPrompt: ROMAJA_PROMPT,
  furiganaPrompt: FURIGANA_PROMPT,
  romajiPrompt: ROMAJI_PROMPT,
};

export default Defaults;
