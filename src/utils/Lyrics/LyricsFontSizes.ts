import settingsValues from '../settingsValues';
import { PageViewSelectors } from '../../constants/PageViewSelectors';

function setOrRemove(element: HTMLElement, property: string, value: string): void {
  if (value) {
    element.style.setProperty(property, value);
  } else {
    element.style.removeProperty(property);
  }
}

/**
 * Applies the two font-size settings to the lyrics content container.
 * The container lookup and the set-or-remove rule live here so the render path
 * and the settings handlers cannot disagree about either.
 */
export function applyLyricsFontSizes(): void {
  const container = document.querySelector<HTMLElement>(PageViewSelectors.LyricsContent);
  if (!container) return;

  setOrRemove(container, '--TranslationFontSize', settingsValues.get('translationFontSize'));

  const defaultLyricsSize = settingsValues.get('defaultLyricsSize');
  setOrRemove(container, '--DefaultLyricsSize', defaultLyricsSize ? `${defaultLyricsSize}rem` : '');
}
