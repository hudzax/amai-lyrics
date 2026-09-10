/**
 * Per-line decoration shared by the Line and Static Applyers.
 *
 * The two Applyers previously duplicated the phonetics + romaji-notification
 * block, the translation-node append, the right-to-left class and the
 * Arabic/Persian font attribute byte-for-byte, so a fix had to be applied in
 * both files. Extracted so a change lands in one place.
 */

import { ArabicPersianRegex } from '../../../Addons';
import isRtl from '../../isRtl';
import storage from '../../../storage';
import { applyPhoneticPatterns, isJapaneseText } from '../../phoneticPatterns';

export interface LineWithText {
  Text: string;
  Translation?: string;
}

export interface InfoHolder {
  Info?: string;
}

/**
 * Applies phonetic patterns to `line.Text` in place and sets `data.Info` the
 * first time Japanese text is seen (unless the notification is disabled). The
 * caller builds the sanitized ruby fragment from the mutated `line.Text`.
 */
export function processLinePhonetics(line: LineWithText, data: InfoHolder): void {
  if (isJapaneseText(line.Text)) {
    if (
      !data.Info &&
      (!storage.get('disable_romaji_toggle_notification') ||
        storage.get('disable_romaji_toggle_notification') === 'false')
    ) {
      data.Info =
        'Toggle between Romaji or Furigana in settings. Disable this notification there as well.';
    }
    line.Text = applyPhoneticPatterns(line.Text, storage.get('enable_romaji') === 'true');
  } else {
    line.Text = applyPhoneticPatterns(line.Text, false);
  }
}

/**
 * Applies the decorations shared by both Applyers to an already-built line
 * element: an optional distinct translation node, a right-to-left class, and
 * the Arabic/Persian font attribute.
 */
export function decorateLineElement(
  lineElem: HTMLElement,
  mainTextContainer: HTMLElement,
  line: LineWithText,
  rawText?: string,
): void {
  const hasDistinctTranslation =
    !!line.Translation &&
    line.Translation.trim() !== '' &&
    (!rawText || line.Translation.trim() !== rawText.trim());

  if (hasDistinctTranslation) {
    const translationElem = document.createElement('div');
    translationElem.classList.add('translation');
    translationElem.textContent = line.Translation;
    mainTextContainer.appendChild(translationElem);
  }

  if (isRtl(line.Text) && !lineElem.classList.contains('rtl')) {
    lineElem.classList.add('rtl');
  }

  if (ArabicPersianRegex.test(line.Text)) {
    lineElem.setAttribute('font', 'Vazirmatn');
  }
}
