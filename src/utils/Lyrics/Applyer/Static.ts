import { ArabicPersianRegex, BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from '../../Addons';
import Defaults from '../../../components/Global/Defaults';
import { applyStyles, removeAllStyles } from '../../CSS/Styles';
import {
  ClearScrollSimplebar,
  MountScrollSimplebar,
  RecalculateScrollSimplebar,
  ScrollSimplebar,
} from '../../Scrolling/Simplebar/ScrollSimplebar';
import { ClearLyricsContentArrays, LyricsObject } from '../lyrics';
import { ApplyLyricsCredits } from './Credits/ApplyLyricsCredits';
import { ApplyInfo } from './Info/ApplyInfo';
// import { ApplyTranslation } from './Translation/ApplyTranslation';
import isRtl from '../isRtl';
import storage from '../../storage';
import { createRubyFragment } from '../../sanitize';
import { applyPhoneticPatterns, isJapaneseText } from '../phoneticPatterns';

export function ApplyStaticLyrics(data) {
  if (!Defaults.LyricsContainerExists) return;

  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  LyricsContainer.setAttribute('data-lyrics-type', 'Static');

  ClearLyricsContentArrays();
  ClearScrollSimplebar();
  TOP_ApplyLyricsSpacer(LyricsContainer);

  const fragment = document.createDocumentFragment();

  data.Lines.forEach((line, index) => {
    const lineElem = document.createElement('div');

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

    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');

    if (line.Text?.includes('[DEF=font_size:small]')) {
      lineElem.style.fontSize = '35px';
      mainTextContainer.appendChild(
        createRubyFragment(line.Text.replace('[DEF=font_size:small]', '')),
      );
    } else {
      mainTextContainer.appendChild(createRubyFragment(line.Text));
    }

    lineElem.appendChild(mainTextContainer);

    if (
      line.Translation &&
      line.Translation.trim() !== '' &&
      (!data.Raw || line.Translation.trim() !== data.Raw[index]?.trim())
    ) {
      const translationElem = document.createElement('div');
      translationElem.classList.add('translation');
      translationElem.textContent = line.Translation;
      mainTextContainer.appendChild(translationElem);
    }

    if (isRtl(line.Text) && !lineElem.classList.contains('rtl')) {
      lineElem.classList.add('rtl');
    }

    lineElem.classList.add('line', 'static');

    if (ArabicPersianRegex.test(line.Text)) {
      lineElem.setAttribute('font', 'Vazirmatn');
    }

    LyricsObject.Types.Static.Lines.push({
      HTMLElement: lineElem,
    });

    fragment.appendChild(lineElem);
  });

  LyricsContainer.appendChild(fragment);

  ApplyInfo(data);
  ApplyLyricsCredits(data);
  BOTTOM_ApplyLyricsSpacer(LyricsContainer);

  if (ScrollSimplebar) RecalculateScrollSimplebar();
  else MountScrollSimplebar();

  const LyricsStylingContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content',
  );

  if (data.offline) {
    LyricsStylingContainer.classList.add('offline');
  }

  removeAllStyles(LyricsStylingContainer);

  if (data.classes) {
    LyricsStylingContainer.className = data.classes;
  }

  if (data.styles) {
    applyStyles(LyricsStylingContainer, data.styles);
  }

  // ApplyTranslation(data.Raw);
}
