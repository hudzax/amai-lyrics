import { BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from '../../Addons';
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
import { createRubyFragment } from '../../sanitize';
import { decorateLineElement, processLinePhonetics } from './Utils/decorateLine';

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

    processLinePhonetics(line, data);

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

    decorateLineElement(lineElem, mainTextContainer, line, data.Raw?.[index]);

    lineElem.classList.add('line', 'static');

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
