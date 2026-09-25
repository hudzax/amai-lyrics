/**
 * Per-line decoration shared by the Line and Static row builders.
 *
 * The two builders previously duplicated the phonetics + romaji-notification
 * block, the translation-node append, the right-to-left class and the
 * Arabic/Persian font attribute byte-for-byte, so a fix had to be applied in
 * both files. Extracted so a change lands in one place.
 */

import { ArabicPersianRegex } from '../../../Addons';
import isRtl from '../../isRtl';
import settingsValues from '../../../settingsValues';
import { applyPhoneticPatterns, isJapaneseText } from '../../phoneticPatterns';
import type { LineView } from '../../conversion';

export interface InfoHolder {
  info?: string;
}

/**
 * Applies phonetic patterns to `line.text` in place and sets `data.info` the
 * first time Japanese text is seen (unless the notification is disabled). The
 * caller builds the sanitized ruby fragment from the mutated `line.text`.
 */
export function processLinePhonetics(line: LineView, data: InfoHolder): void {
  if (isJapaneseText(line.text)) {
    if (!data.info && !settingsValues.get('disableRomajiToggleNotification')) {
      data.info =
        'Toggle between Romaji or Furigana in settings. Disable this notification there as well.';
    }
    line.text = applyPhoneticPatterns(line.text, settingsValues.get('enableRomaji'));
  } else {
    line.text = applyPhoneticPatterns(line.text, false);
  }
}

/**
 * Applies the decorations shared by both row builders to an already-built line
 * element: an optional distinct translation node, a right-to-left class, and
 * the Arabic/Persian font attribute.
 */
export function decorateLineElement(
  lineElem: HTMLElement,
  mainTextContainer: HTMLElement,
  line: LineView,
  rawText?: string,
): void {
  const hasDistinctTranslation =
    !!line.translation &&
    line.translation.trim() !== '' &&
    (!rawText || line.translation.trim() !== rawText.trim());

  if (hasDistinctTranslation) {
    const translationElem = document.createElement('div');
    translationElem.classList.add('translation');
    translationElem.textContent = line.translation;
    mainTextContainer.appendChild(translationElem);
  }

  if (isRtl(line.text) && !lineElem.classList.contains('rtl')) {
    lineElem.classList.add('rtl');
  }

  if (ArabicPersianRegex.test(line.text)) {
    lineElem.setAttribute('font', 'Vazirmatn');
  }
}
