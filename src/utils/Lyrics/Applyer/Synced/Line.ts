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

  const fragment = document.createDocumentFragment();

  const convertStartTime = ConvertTime(data.StartTime);

  function createDotGroup(startTime, endTime) {
    const dotGroup = document.createElement('div');
    dotGroup.classList.add('dotGroup');

    const totalTime = endTime - startTime;
    const dotTime = totalTime / 3;

    const dots = [];
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.classList.add('word', 'dot');
      dot.textContent = '•';

      LyricsObject.Types.Line.Lines[
        LINE_SYNCED_CurrentLineLyricsObject
      ].Syllables.Lead.push({
        HTMLElement: dot,
        StartTime: startTime + dotTime * i,
        EndTime: i === 2 ? endTime - 400 : startTime + dotTime * (i + 1),
        TotalTime: dotTime,
        Dot: true,
      });

      dots.push(dot);
    }

    dots.forEach((d) => dotGroup.appendChild(d));
    return dotGroup;
  }

  if (data.StartTime >= lyricsBetweenShow) {
    const musicalLine = document.createElement('div');
    musicalLine.classList.add('line', 'musical-line');

    LyricsObject.Types.Line.Lines.push({
      HTMLElement: musicalLine,
      StartTime: 0,
      EndTime: convertStartTime,
      TotalTime: convertStartTime,
      DotLine: true,
    });

    SetWordArrayInCurentLine_LINE_SYNCED();

    if (data.Content[0].OppositeAligned) {
      musicalLine.classList.add('OppositeAligned');
    }

    const dotGroup = createDotGroup(0, convertStartTime);
    musicalLine.appendChild(dotGroup);
    fragment.appendChild(musicalLine);
  }

  data.Content.forEach((line, index, arr) => {
    const lineElem = document.createElement('div');

    const JapaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]/g;
    if (JapaneseRegex.test(line.Text)) {
      if (
        !data.Info &&
        (!storage.get('disable_romaji_toggle_notification') ||
          storage.get('disable_romaji_toggle_notification') === 'false')
      ) {
        data.Info =
          'Toggle between Romaji or Furigana in settings. Disable this notification there as well.';
      }
      if (storage.get('enable_romaji') === 'true') {
        line.Text = line.Text?.replace(
          /(([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)|[(\uFF08]([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)[)\uFF09])(?:{|\uFF5B)([^}\uFF5D]+)(?:}|\uFF5D)/g,
          (match, p1, p2, p3, p4) => {
            const text = p2 || p3;
            return `<ruby>${text}<rt>${p4}</rt></ruby>`;
          },
        );
      } else {
        line.Text = line.Text?.replace(
          /([\u4E00-\u9FFF々]+[\u3040-\u30FF]*){([^\}]+)}/g,
          '<ruby>$1<rt>$2</rt></ruby>',
        );
      }
    } else {
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

    const startTime = ConvertTime(line.StartTime);
    const endTime = ConvertTime(line.EndTime);

    LyricsObject.Types.Line.Lines.push({
      HTMLElement: lineElem,
      StartTime: startTime,
      EndTime: endTime,
      TotalTime: endTime - startTime,
    });

    if (line.OppositeAligned) {
      lineElem.classList.add('OppositeAligned');
    }

    fragment.appendChild(lineElem);

    const nextLine = arr[index + 1];
    if (nextLine && nextLine.StartTime - line.EndTime >= lyricsBetweenShow) {
      const musicalLine = document.createElement('div');
      musicalLine.classList.add('line', 'musical-line');

      const nextStartTime = ConvertTime(nextLine.StartTime);
      const curEndTime = endTime;

      LyricsObject.Types.Line.Lines.push({
        HTMLElement: musicalLine,
        StartTime: curEndTime,
        EndTime: nextStartTime,
        TotalTime: nextStartTime - curEndTime,
        DotLine: true,
      });

      SetWordArrayInCurentLine_LINE_SYNCED();

      if (nextLine.OppositeAligned) {
        musicalLine.classList.add('OppositeAligned');
      }

      const dotGroup = createDotGroup(curEndTime, nextStartTime);
      musicalLine.appendChild(dotGroup);
      fragment.appendChild(musicalLine);
    }
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
  removeAllStyles(LyricsStylingContainer);

  if (data.classes) {
    LyricsStylingContainer.className = data.classes;
  }

  if (data.styles) {
    applyStyles(LyricsStylingContainer, data.styles);
  }
}
