import { beforeEach, describe, expect, it } from 'vitest';
import settingsValues from '../src/utils/settingsValues';
import { applyLyricsFontSizes } from '../src/utils/Lyrics/LyricsFontSizes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

function mountLyricsContent(): HTMLElement {
  document.body.innerHTML =
    '<div id="AmaiLyricsPage"><div class="ContentBox"><div class="LyricsContainer"><div class="LyricsContent"></div></div></div></div>';
  return document.querySelector<HTMLElement>('#AmaiLyricsPage .LyricsContent')!;
}

beforeEach(() => {
  spicetify.Spicetify.LocalStorage._store.clear();
  document.body.innerHTML = '';
});

describe('applyLyricsFontSizes', () => {
  it('writes both CSS variables from the stored settings', () => {
    settingsValues.set('translationFontSize', '0.7');
    settingsValues.set('defaultLyricsSize', '2.5');
    const container = mountLyricsContent();

    applyLyricsFontSizes();

    expect(container.style.getPropertyValue('--TranslationFontSize')).toBe('0.7');
    expect(container.style.getPropertyValue('--DefaultLyricsSize')).toBe('2.5rem');
  });

  it('removes both variables when their settings are empty', () => {
    const container = mountLyricsContent();
    container.style.setProperty('--TranslationFontSize', '0.7');
    container.style.setProperty('--DefaultLyricsSize', '2.5rem');
    settingsValues.set('translationFontSize', '');
    settingsValues.set('defaultLyricsSize', '');

    applyLyricsFontSizes();

    expect(container.style.getPropertyValue('--TranslationFontSize')).toBe('');
    expect(container.style.getPropertyValue('--DefaultLyricsSize')).toBe('');
  });

  it('does nothing when the lyrics page is absent', () => {
    settingsValues.set('translationFontSize', '0.7');

    expect(() => applyLyricsFontSizes()).not.toThrow();
  });
});
