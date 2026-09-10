import { BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from '../../../Addons';
import Defaults from '../../../../components/Global/Defaults';
import { applyStyles, removeAllStyles } from '../../../CSS/Styles';
import {
  ClearScrollSimplebar,
  MountScrollSimplebar,
  RecalculateScrollSimplebar,
  ScrollSimplebar,
} from '../../../Scrolling/Simplebar/ScrollSimplebar';
import { ConvertTime } from '../../ConvertTime';
import { ClearLyricsContentArrays, lyricsBetweenShow, LyricsObject } from '../../lyrics';
import { ApplyLyricsCredits } from '../Credits/ApplyLyricsCredits';
import { ApplyInfo } from '../Info/ApplyInfo';
import { createMusicalLineMs } from '../Utils/createMusicalLine';
import { createRubyFragment } from '../../../sanitize';
import { decorateLineElement, processLinePhonetics } from '../Utils/decorateLine';

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

  // Add initial dot group if there's a sufficient gap before the first line
  if (data.StartTime >= lyricsBetweenShow) {
    const musicalLine = createMusicalLineMs(
      0,
      convertStartTime,
      !!data.Content[0]?.OppositeAligned,
    );
    fragment.appendChild(musicalLine);
  }

  data.Content.forEach((line, index, arr) => {
    const lineElem = document.createElement('div');

    processLinePhonetics(line, data);

    // Create main text container — use sanitized ruby fragment to prevent XSS
    const mainTextContainer = document.createElement('span');
    mainTextContainer.classList.add('main-lyrics-text');
    mainTextContainer.classList.add('line');
    mainTextContainer.appendChild(createRubyFragment(line.Text));
    lineElem.appendChild(mainTextContainer);
    // Removed lineElem.classList.add('line'); as the span is the actual line element

    decorateLineElement(lineElem, mainTextContainer, line, data.Raw?.[index]);

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
      const nextStartTime = ConvertTime(nextLine.StartTime);
      const curEndTime = endTime;
      const musicalLine = createMusicalLineMs(
        curEndTime,
        nextStartTime,
        !!nextLine.OppositeAligned,
      );
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
