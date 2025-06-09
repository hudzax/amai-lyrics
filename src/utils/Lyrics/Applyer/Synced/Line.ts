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

// Type definitions for better type safety
interface LyricLine {
  Text: string;
  Translation?: string;
  StartTime: number;
  EndTime: number;
  OppositeAligned?: boolean;
}

interface LyricsData {
  Content: LyricLine[];
  StartTime: number;
  Raw?: string[];
  Info?: string;
  SongWriters?: string[];
  styles?: Record<string, string>;
  classes?: string;
}

/**
 * Applies line-synced lyrics to the lyrics container
 * @param data Lyrics data with content, timing and styling information
 */
export function ApplyLineLyrics(data: LyricsData): void {
  if (!Defaults.LyricsContainerExists) return;

  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );

  if (!LyricsContainer) {
    console.error('Lyrics container not found');
    return;
  }

  LyricsContainer.setAttribute('data-lyrics-type', 'Line');

  // Clear previous content
  ClearLyricsContentArrays();
  ClearScrollSimplebar();
  TOP_ApplyLyricsSpacer(LyricsContainer);

  const fragment = document.createDocumentFragment();
  const convertStartTime = ConvertTime(data.StartTime);

  /**
   * Creates a group of dots to display during musical breaks
   * @param startTime The start time of the dot group in milliseconds
   * @param endTime The end time of the dot group in milliseconds
   * @returns HTMLElement containing the dot group
   */
  function createDotGroup(startTime: number, endTime: number): HTMLElement {
    const dotGroup = document.createElement('div');
    dotGroup.classList.add('dotGroup');

    const totalTime = endTime - startTime;
    const dotTime = totalTime / 3;

    const dots: HTMLElement[] = [];
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.classList.add('word', 'dot');
      dot.textContent = '•';

      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
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

  // Add initial dot group if there's a sufficient gap before the first line
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

    if (data.Content[0]?.OppositeAligned) {
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

    // Create main text container
    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');
    mainTextContainer.classList.add('line');
    mainTextContainer.innerHTML = line.Text;
    lineElem.appendChild(mainTextContainer);
    // Removed lineElem.classList.add('line'); as the span is the actual line element

    // Add translation if available and different from original
    const hasDistinctTranslation =
      line.Translation &&
      line.Translation.trim() !== '' &&
      (!data.Raw || line.Translation.trim() !== data.Raw[index]?.trim());

    if (hasDistinctTranslation) {
      const translationElem = document.createElement('div');
      translationElem.classList.add('translation');
      translationElem.textContent = line.Translation;
      mainTextContainer.appendChild(translationElem);
    }

    // Handle right-to-left text
    if (isRtl(line.Text) && !lineElem.classList.contains('rtl')) {
      lineElem.classList.add('rtl');
    }

    // Apply special font for Arabic/Persian text
    if (ArabicPersianRegex.test(line.Text)) {
      lineElem.setAttribute('font', 'Vazirmatn');
    }

    // Convert times to milliseconds
    const startTime = ConvertTime(line.StartTime);
    const endTime = ConvertTime(line.EndTime);

    // Add line to the lyrics object, using mainTextContainer (the span) as the HTMLElement
    LyricsObject.Types.Line.Lines.push({
      HTMLElement: mainTextContainer, // Changed to mainTextContainer
      StartTime: startTime,
      EndTime: endTime,
      TotalTime: endTime - startTime,
    });

    // Handle alignment
    if (line.OppositeAligned) {
      lineElem.classList.add('OppositeAligned');
    }

    fragment.appendChild(lineElem);

    // Check for musical break between this line and the next one
    const nextLine = arr[index + 1];
    const hasMusicalBreak = nextLine && nextLine.StartTime - line.EndTime >= lyricsBetweenShow;

    if (hasMusicalBreak) {
      // Create a musical break line with dots
      const musicalLine = document.createElement('div');
      musicalLine.classList.add('line', 'musical-line');

      const nextStartTime = ConvertTime(nextLine.StartTime);
      const curEndTime = endTime;

      // Register the musical line in the lyrics object
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: musicalLine,
        StartTime: curEndTime,
        EndTime: nextStartTime,
        TotalTime: nextStartTime - curEndTime,
        DotLine: true,
      });

      SetWordArrayInCurentLine_LINE_SYNCED();

      // Apply alignment if needed
      if (nextLine.OppositeAligned) {
        musicalLine.classList.add('OppositeAligned');
      }

      // Add dot group to represent the musical break
      const dotGroup = createDotGroup(curEndTime, nextStartTime);
      musicalLine.appendChild(dotGroup);
      fragment.appendChild(musicalLine);
    }
  });

  // Add the fragment to the container
  LyricsContainer.appendChild(fragment);

  // Apply additional information and credits
  ApplyInfo(data);
  ApplyLyricsCredits(data);
  BOTTOM_ApplyLyricsSpacer(LyricsContainer);

  // Setup scrolling
  if (ScrollSimplebar) {
    RecalculateScrollSimplebar();
  } else {
    MountScrollSimplebar();
  }

  // Apply custom styles if provided
  const LyricsStylingContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content',
  );

  if (LyricsStylingContainer) {
    // Reset existing styles
    removeAllStyles(LyricsStylingContainer);

    // Apply custom classes if provided
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }

    // Apply custom styles if provided
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }
}
