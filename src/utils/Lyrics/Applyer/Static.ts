import {
  ArabicPersianRegex,
  BOTTOM_ApplyLyricsSpacer,
  TOP_ApplyLyricsSpacer,
} from '../../Addons';
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

export function ApplyStaticLyrics(data) {
  if (!Defaults.LyricsContainerExists) return;
  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );

  LyricsContainer.setAttribute('data-lyrics-type', 'Static');

  ClearLyricsContentArrays();
  ClearScrollSimplebar();

  TOP_ApplyLyricsSpacer(LyricsContainer);

  data.Lines.forEach((line, index) => {
    const lineElem = document.createElement('div');
    // if test contains japanese characters
    const JapaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]/g;
    if (JapaneseRegex.test(line.Text)) {
      // Notify user for romaji or furigana option
      if (
        !data.Info &&
        (!storage.get('disable_romaji_toggle_notification') ||
          storage.get('disable_romaji_toggle_notification') === 'false')
      ) {
        data.Info =
          'Toggle between Romaji or Furigana in settings. Disable this notification there as well.';
      }
      if (storage.get('enable_romaji') === 'true') {
        // Generate ruby text for romaji
        line.Text = line.Text?.replace(
          /(([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)|[(\uFF08]([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)[)\uFF09])(?:{|\uFF5B)([^}\uFF5D]+)(?:}|\uFF5D)/g,
          (match, p1, p2, p3, p4) => {
            const text = p2 || p3;
            return `<ruby>${text}<rt>${p4}</rt></ruby>`;
          },
        );
      } else {
        // Generate ruby text for furigana
        line.Text = line.Text?.replace(
          /([\u4E00-\u9FFF々]+[\u3040-\u30FF]*){([^\}]+)}/g,
          '<ruby>$1<rt>$2</rt></ruby>',
        );
      }
    } else {
      // Generate ruby text for korean romaja
      line.Text = line.Text?.replace(
        /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)(?:[a-zA-Z]*)[?.!,"']?){([^\}]+)}/g,
        '<ruby class="romaja">$1<rt>$2</rt></ruby>',
      );
    }
    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');

    if (line.Text?.includes('[DEF=font_size:small]')) {
      lineElem.style.fontSize = '35px';
      mainTextContainer.innerHTML = line.Text.replace(
        '[DEF=font_size:small]',
        '',
      );
    } else {
      mainTextContainer.innerHTML = line.Text;
    }

    lineElem.appendChild(mainTextContainer);

    // Add translation if available and different from original text
    if (
      line.Translation &&
      line.Translation.trim() !== '' &&
      line.Translation.trim() !== data.Raw[index].trim()
    ) {
      const translationElem = document.createElement('div');
      translationElem.classList.add('translation');
      translationElem.textContent = line.Translation;
      lineElem.appendChild(translationElem);
    }

    if (isRtl(line.Text) && !lineElem.classList.contains('rtl')) {
      lineElem.classList.add('rtl');
    }

    lineElem.classList.add('line');
    lineElem.classList.add('static');

    if (ArabicPersianRegex.test(line.Text)) {
      lineElem.setAttribute('font', 'Vazirmatn');
    }

    LyricsObject.Types.Static.Lines.push({
      HTMLElement: lineElem,
    });

    LyricsContainer.appendChild(lineElem);
  });

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
