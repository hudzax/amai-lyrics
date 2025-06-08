import { ArabicPersianRegex } from '../../../Addons';
import { IdleEmphasisLyricsScale } from '../../Animator/Shared';
import { ConvertTime } from '../../ConvertTime';
import { CurrentLineLyricsObject, LyricsObject } from '../../lyrics';

interface LeadObject {
  StartTime: number;
  EndTime: number;
  Text: string;
}

export default function Emphasize(
  letters: Array<string>,
  applyTo: HTMLElement,
  lead: LeadObject,
  isBgWord: boolean = false,
) {
  const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);
  const letterDuration = totalDuration / letters.length; // Duration per letter
  const word = applyTo;
  let Letters = [];

  letters.forEach((letter, index, lA) => {
    const letterElem = document.createElement('span');
    letterElem.textContent = letter;
    letterElem.classList.add('letter');
    letterElem.classList.add('Emphasis');

    // Calculate start and end time for each letter
    const letterStartTime = ConvertTime(lead.StartTime) + index * letterDuration;
    const letterEndTime = letterStartTime + letterDuration;

    const contentDuration = letterDuration > 150 ? letterDuration : 150;
    letterElem.style.setProperty('--content-duration', `${contentDuration}ms`);

    if (index === lA.length - 1) {
      letterElem.classList.add('LastLetterInWord');
    }

    if (ArabicPersianRegex.test(lead.Text)) {
      word.setAttribute('font', 'Vazirmatn');
    }

    const mcont = isBgWord
      ? {
          BGLetter: true,
        }
      : {};

    Letters.push({
      HTMLElement: letterElem,
      StartTime: letterStartTime,
      EndTime: letterEndTime,
      TotalTime: letterDuration,
      Emphasis: true,
      ...mcont,
    });

    letterElem.style.setProperty('--gradient-position', `-20%`);
    letterElem.style.setProperty('--text-shadow-opacity', `0%`);
    letterElem.style.setProperty('--text-shadow-blur-radius', `4px`);
    letterElem.style.scale = IdleEmphasisLyricsScale.toString();
    letterElem.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0.02))`;

    word.appendChild(letterElem);
  });

  word.classList.add('letterGroup');

  const mcont = isBgWord
    ? {
        BGWord: true,
      }
    : {};

  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
    HTMLElement: word,
    StartTime: ConvertTime(lead.StartTime),
    EndTime: ConvertTime(lead.EndTime),
    TotalTime: totalDuration,
    LetterGroup: true,
    Letters,
    ...mcont,
  });

  Letters = [];
}
