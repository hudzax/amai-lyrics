import { Maid } from '@hudzax/web-modules/Maid';
import { IntervalManager } from '../IntervalManager';
import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { Lyrics } from './Animator/Main';

export const ScrollingIntervalTime = 0.1;

export const lyricsBetweenShow = 3;

export const LyricsObject = {
  Types: {
    Syllable: {
      Lines: [],
    },
    Line: {
      Lines: [],
    },
    Static: {
      Lines: [],
    },
  },
};

interface Letter {
  HTMLElement: HTMLElement;
}

export interface Word {
  HTMLElement: HTMLElement;
  Letters?: Letter[];
  BGWord?: boolean;
  Dot?: boolean;
  LetterGroup?: boolean;
  EndTime?: number;
  StartTime?: number;
  Status?: string;
  translateY?: number;
  scale?: number;
  glow?: number;
  AnimatorStoreTime_glow?: number;
  AnimatorStoreTime_translateY?: number;
  AnimatorStoreTime_scale?: number;
}

// Maps for optimizing LinesEvListener lookups
export const lineElementToStartTimeMap = new Map<HTMLElement, number>();
export const syllableElementToStartTimeMap = new Map<HTMLElement, number>();

export let CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;
export let LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;
export function SetWordArrayInCurentLine() {
  CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;

  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables = {};
  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead = [];
}

export function SetWordArrayInCurentLine_LINE_SYNCED() {
  LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;

  LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables = {};
  LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead = [];
}

export function ClearLyricsContentArrays() {
  LyricsObject.Types.Syllable.Lines = [];
  LyricsObject.Types.Line.Lines = [];
  LyricsObject.Types.Static.Lines = [];
  // Clear the maps as well
  lineElementToStartTimeMap.clear();
  syllableElementToStartTimeMap.clear();
}

const THROTTLE_TIME = 0.05;
new IntervalManager(THROTTLE_TIME, () => {
  if (!Defaults.LyricsContainerExists) return;
  const progress = SpotifyPlayer.GetTrackPosition();
  Lyrics.TimeSetter(progress);
  Lyrics.Animate(progress);
}).Start();
let LinesEvListenerMaid: Maid;
let LinesEvListenerExists: boolean;

/**
 * Populates the lookup maps from HTMLElement to start time.
 * This should be called after lyrics HTML elements are created and associated
 * with their data objects.
 */
export function populateElementTimeMaps() {
  console.log('populateElementTimeMaps: Clearing existing maps.');
  lineElementToStartTimeMap.clear();
  syllableElementToStartTimeMap.clear();

  LyricsObject.Types.Line.Lines.forEach((line, index) => {
    if (line.HTMLElement && typeof line.StartTime === 'number') {
      lineElementToStartTimeMap.set(line.HTMLElement, line.StartTime);
      console.log(
        `populateElementTimeMaps: Added line ${index} to lineElementToStartTimeMap. StartTime: ${line.StartTime}`,
      );
    } else {
      console.log(
        `populateElementTimeMaps: Skipped line ${index} (missing HTMLElement or StartTime).`,
      );
    }
  });
  console.log(
    `populateElementTimeMaps: lineElementToStartTimeMap size: ${lineElementToStartTimeMap.size}`,
    lineElementToStartTimeMap,
  );

  LyricsObject.Types.Syllable.Lines.forEach((line, lineIndex) => {
    const lineStartTime = line.StartTime;
    if (typeof lineStartTime !== 'number') {
      console.log(
        `populateElementTimeMaps: Skipped syllable line ${lineIndex} (missing StartTime).`,
      );
      return;
    }

    line.Syllables.Lead.forEach((word: Word, wordIndex) => {
      if (word.HTMLElement) {
        syllableElementToStartTimeMap.set(word.HTMLElement, lineStartTime);
        console.log(
          `populateElementTimeMaps: Added syllable word ${lineIndex}-${wordIndex} to syllableElementToStartTimeMap. StartTime: ${lineStartTime}`,
        );
      } else {
        console.log(
          `populateElementTimeMaps: Skipped syllable word ${lineIndex}-${wordIndex} (missing HTMLElement).`,
        );
      }
      if (word?.Letters) {
        word.Letters.forEach((letter, letterIndex) => {
          if (letter.HTMLElement) {
            syllableElementToStartTimeMap.set(letter.HTMLElement, lineStartTime);
            console.log(
              `populateElementTimeMaps: Added syllable letter ${lineIndex}-${wordIndex}-${letterIndex} to syllableElementToStartTimeMap. StartTime: ${lineStartTime}`,
            );
          } else {
            console.log(
              `populateElementTimeMaps: Skipped syllable letter ${lineIndex}-${wordIndex}-${letterIndex} (missing HTMLElement).`,
            );
          }
        });
      }
    });
  });
  console.log(
    `populateElementTimeMaps: syllableElementToStartTimeMap size: ${syllableElementToStartTimeMap.size}`,
  );
}

function LinesEvListener(e: Event) {
  let target = e.target as HTMLElement;
  console.log('LinesEvListener: Click event detected. Target:', target);
  let startTime: number | undefined;

  // If rt tag is clicked, use its parent
  if (target.tagName.toLowerCase() === 'rt') {
    if (target.parentElement) {
      target = target.parentElement;
    }
  }

  // If the target element is a ruby tag or has the translation class, target its parent if it exists
  if (target.tagName.toLowerCase() === 'ruby' || target.classList.contains('translation')) {
    if (target.parentElement) {
      target = target.parentElement;
    }
  }

  if (target.classList.contains('line')) {
    startTime = lineElementToStartTimeMap.get(target);
    console.log('LinesEvListener: Target is a line. Retrieved startTime:', startTime);
  } else if (target.classList.contains('word')) {
    startTime = syllableElementToStartTimeMap.get(target);
    console.log('LinesEvListener: Target is a word. Retrieved startTime:', startTime);
  } else if (target.classList.contains('Emphasis')) {
    startTime = syllableElementToStartTimeMap.get(target);
    console.log('LinesEvListener: Target is an Emphasis. Retrieved startTime:', startTime);
  } else {
    console.log(
      'LinesEvListener: Target is not a recognized lyric element (line, word, Emphasis).',
    );
  }

  if (typeof startTime === 'number') {
    console.log(`LinesEvListener: Seeking Spicetify.Player to ${startTime}.`);
    Spicetify.Player.seek(startTime);
  } else {
    console.log('LinesEvListener: startTime is not a number, cannot seek player.');
  }
}

export function addLinesEvListener() {
  console.log('addLinesEvListener: Function called.');
  if (LinesEvListenerExists) {
    console.log('addLinesEvListener: Listener already exists, reinitializing...');
    removeLinesEvListener();
  }

  // Populate the maps before adding the listener
  console.log('addLinesEvListener: Populating element time maps...');
  populateElementTimeMaps();
  console.log('addLinesEvListener: Maps populated.');

  LinesEvListenerExists = true;
  LinesEvListenerMaid = new Maid();

  const el = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (!el) {
    console.log(
      'addLinesEvListener: Element #SpicyLyricsPage .LyricsContainer .LyricsContent not found. Retrying later.',
    );
    LinesEvListenerExists = false; // Ensure we can retry if element not found initially
    return;
  }
  console.log('addLinesEvListener: Element found, adding event listener.');
  el.addEventListener('click', LinesEvListener);
  LinesEvListenerMaid.Give(() => {
    console.log('addLinesEvListener: Removing event listener.');
    el.removeEventListener('click', LinesEvListener as EventListener);
  }); // Ensure type compatibility for Maid
  console.log('addLinesEvListener: Event listener added successfully.');
}

export function removeLinesEvListener() {
  if (!LinesEvListenerExists) return;
  LinesEvListenerExists = false;

  // Maid will handle removing the event listener if it was successfully added
  if (LinesEvListenerMaid) {
    LinesEvListenerMaid.Destroy();
  }
  // Optionally, clear maps here if they are not cleared elsewhere on lyric removal,
  // but ClearLyricsContentArrays should handle it.
}
