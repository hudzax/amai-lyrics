import {
  ArabicPersianRegex,
  BOTTOM_ApplyLyricsSpacer,
  TOP_ApplyLyricsSpacer,
} from '../../../Addons';
import Defaults from '../../../../components/Global/Defaults';
import { applyStyles, removeAllStyles } from '../../../CSS/Styles';
import {
  ClearScrollSimplebar,
  MountScrollSimplebar,
  RecalculateScrollSimplebar,
  ScrollSimplebar,
} from '../../../Scrolling/Simplebar/ScrollSimplebar';
import { ConvertTime } from '../../ConvertTime';
import {
  ClearLyricsContentArrays,
  LINE_SYNCED_CurrentLineLyricsObject,
  lyricsBetweenShow,
  LyricsObject,
  SetWordArrayInCurentLine_LINE_SYNCED,
} from '../../lyrics';
import { ApplyLyricsCredits } from '../Credits/ApplyLyricsCredits';
import { ApplyInfo } from '../Info/ApplyInfo';
import isRtl from '../../isRtl';
import storage from '../../../storage';

export function ApplyLineLyrics(data) {
  if (!Defaults.LyricsContainerExists) return;
  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );

  LyricsContainer.setAttribute('data-lyrics-type', 'Line');

  ClearLyricsContentArrays();

  ClearScrollSimplebar();

  TOP_ApplyLyricsSpacer(LyricsContainer);

  if (data.StartTime >= lyricsBetweenShow) {
    const musicalLine = document.createElement('div');
    musicalLine.classList.add('line');
    musicalLine.classList.add('musical-line');

    LyricsObject.Types.Line.Lines.push({
      HTMLElement: musicalLine,
      StartTime: 0,
      EndTime: ConvertTime(data.StartTime),
      TotalTime: ConvertTime(data.StartTime),
      DotLine: true,
    });

    SetWordArrayInCurentLine_LINE_SYNCED();

    if (data.Content[0].OppositeAligned) {
      musicalLine.classList.add('OppositeAligned');
    }

    const dotGroup = document.createElement('div');
    dotGroup.classList.add('dotGroup');

    const musicalDots1 = document.createElement('span');
    const musicalDots2 = document.createElement('span');
    const musicalDots3 = document.createElement('span');

    const totalTime = ConvertTime(data.StartTime);
    const dotTime = totalTime / 3;

    musicalDots1.classList.add('word');
    musicalDots1.classList.add('dot');
    musicalDots1.textContent = '•';

    LyricsObject.Types.Line.Lines[
      LINE_SYNCED_CurrentLineLyricsObject
    ].Syllables.Lead.push({
      HTMLElement: musicalDots1,
      StartTime: 0,
      EndTime: dotTime,
      TotalTime: dotTime,
      Dot: true,
    });

    musicalDots2.classList.add('word');
    musicalDots2.classList.add('dot');
    musicalDots2.textContent = '•';

    LyricsObject.Types.Line.Lines[
      LINE_SYNCED_CurrentLineLyricsObject
    ].Syllables.Lead.push({
      HTMLElement: musicalDots2,
      StartTime: dotTime,
      EndTime: dotTime * 2,
      TotalTime: dotTime,
      Dot: true,
    });

    musicalDots3.classList.add('word');
    musicalDots3.classList.add('dot');
    musicalDots3.textContent = '•';

    LyricsObject.Types.Line.Lines[
      LINE_SYNCED_CurrentLineLyricsObject
    ].Syllables.Lead.push({
      HTMLElement: musicalDots3,
      StartTime: dotTime * 2,
      EndTime: ConvertTime(data.StartTime) - 400,
      TotalTime: dotTime,
      Dot: true,
    });

    dotGroup.appendChild(musicalDots1);
    dotGroup.appendChild(musicalDots2);
    dotGroup.appendChild(musicalDots3);

    musicalLine.appendChild(dotGroup);
    LyricsContainer.appendChild(musicalLine);
  }

  data.Content.forEach((line, index, arr) => {
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
    mainTextContainer.innerHTML = line.Text;
    lineElem.appendChild(mainTextContainer);
    lineElem.classList.add('line');

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

    if (ArabicPersianRegex.test(line.Text)) {
      lineElem.setAttribute('font', 'Vazirmatn');
    }

    LyricsObject.Types.Line.Lines.push({
      HTMLElement: lineElem,
      StartTime: ConvertTime(line.StartTime),
      EndTime: ConvertTime(line.EndTime),
      TotalTime: ConvertTime(line.EndTime) - ConvertTime(line.StartTime),
    });

    if (line.OppositeAligned) {
      lineElem.classList.add('OppositeAligned');
    }

    LyricsContainer.appendChild(lineElem);
    if (
      arr[index + 1] &&
      arr[index + 1].StartTime - line.EndTime >= lyricsBetweenShow
    ) {
      const musicalLine = document.createElement('div');
      musicalLine.classList.add('line');
      musicalLine.classList.add('musical-line');

      LyricsObject.Types.Line.Lines.push({
        HTMLElement: musicalLine,
        StartTime: ConvertTime(line.EndTime),
        EndTime: ConvertTime(arr[index + 1].StartTime),
        TotalTime:
          ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime),
        DotLine: true,
      });

      SetWordArrayInCurentLine_LINE_SYNCED();

      if (arr[index + 1].OppositeAligned) {
        musicalLine.classList.add('OppositeAligned');
      }

      const dotGroup = document.createElement('div');
      dotGroup.classList.add('dotGroup');

      const musicalDots1 = document.createElement('span');
      const musicalDots2 = document.createElement('span');
      const musicalDots3 = document.createElement('span');

      const totalTime =
        ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime);
      const dotTime = totalTime / 3;

      musicalDots1.classList.add('word');
      musicalDots1.classList.add('dot');
      musicalDots1.textContent = '•';

      LyricsObject.Types.Line.Lines[
        LINE_SYNCED_CurrentLineLyricsObject
      ].Syllables.Lead.push({
        HTMLElement: musicalDots1,
        StartTime: ConvertTime(line.EndTime),
        EndTime: ConvertTime(line.EndTime) + dotTime,
        TotalTime: dotTime,
        Dot: true,
      });

      musicalDots2.classList.add('word');
      musicalDots2.classList.add('dot');
      musicalDots2.textContent = '•';

      LyricsObject.Types.Line.Lines[
        LINE_SYNCED_CurrentLineLyricsObject
      ].Syllables.Lead.push({
        HTMLElement: musicalDots2,
        StartTime: ConvertTime(line.EndTime) + dotTime,
        EndTime: ConvertTime(line.EndTime) + dotTime * 2,
        TotalTime: dotTime,
        Dot: true,
      });

      musicalDots3.classList.add('word');
      musicalDots3.classList.add('dot');
      musicalDots3.textContent = '•';

      LyricsObject.Types.Line.Lines[
        LINE_SYNCED_CurrentLineLyricsObject
      ].Syllables.Lead.push({
        HTMLElement: musicalDots3,
        StartTime: ConvertTime(line.EndTime) + dotTime * 2,
        EndTime: ConvertTime(arr[index + 1].StartTime) - 400,
        TotalTime: dotTime,
        Dot: true,
      });

      dotGroup.appendChild(musicalDots1);
      dotGroup.appendChild(musicalDots2);
      dotGroup.appendChild(musicalDots3);

      musicalLine.appendChild(dotGroup);
      LyricsContainer.appendChild(musicalLine);
    }
  });

  ApplyInfo(data);

  ApplyLyricsCredits(data);

  BOTTOM_ApplyLyricsSpacer(LyricsContainer);

  if (ScrollSimplebar) RecalculateScrollSimplebar();
  else MountScrollSimplebar();

  const LyricsStylingContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content',
  );
  removeAllStyles(LyricsStylingContainer);

  if (data.classes) {
    LyricsStylingContainer.className = data.classes;
  }

  if (data.styles) {
    applyStyles(LyricsStylingContainer, data.styles);
  }
}
