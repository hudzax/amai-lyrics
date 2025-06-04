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

interface Word {
  HTMLElement: HTMLElement;
  Letters?: Letter[];
}

// Maps for optimizing LinesEvListener lookups
export const lineElementToStartTimeMap = new Map<HTMLElement, number>();
export const syllableElementToStartTimeMap = new Map<HTMLElement, number>();

export let CurrentLineLyricsObject =
  LyricsObject.Types.Syllable.Lines.length - 1;
export let LINE_SYNCED_CurrentLineLyricsObject =
  LyricsObject.Types.Line.Lines.length - 1;
export function SetWordArrayInCurentLine() {
  CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;

  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables = {};
  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead =
    [];
}

export function SetWordArrayInCurentLine_LINE_SYNCED() {
  LINE_SYNCED_CurrentLineLyricsObject =
    LyricsObject.Types.Line.Lines.length - 1;

  LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables =
    {};
  LyricsObject.Types.Line.Lines[
    LINE_SYNCED_CurrentLineLyricsObject
  ].Syllables.Lead = [];
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
  lineElementToStartTimeMap.clear();
  syllableElementToStartTimeMap.clear();

  LyricsObject.Types.Line.Lines.forEach((line) => {
    if (line.HTMLElement && typeof line.StartTime === 'number') {
      lineElementToStartTimeMap.set(line.HTMLElement, line.StartTime);
    }
  });

  LyricsObject.Types.Syllable.Lines.forEach((line) => {
    const lineStartTime = line.StartTime;
    if (typeof lineStartTime !== 'number') return;

    line.Syllables.Lead.forEach((word: Word) => {
      if (word.HTMLElement) {
        syllableElementToStartTimeMap.set(word.HTMLElement, lineStartTime);
      }
      if (word?.Letters) {
        word.Letters.forEach((letter) => {
          if (letter.HTMLElement) {
            syllableElementToStartTimeMap.set(
              letter.HTMLElement,
              lineStartTime,
            );
          }
        });
      }
    });
  });
}

function LinesEvListener(e: Event) {
  const target = e.target as HTMLElement;
  let startTime: number | undefined;

  if (target.classList.contains('line')) {
    startTime = lineElementToStartTimeMap.get(target);
  } else if (target.classList.contains('word')) {
    startTime = syllableElementToStartTimeMap.get(target);
  } else if (target.classList.contains('Emphasis')) {
    startTime = syllableElementToStartTimeMap.get(target);
  }

  if (typeof startTime === 'number') {
    Spicetify.Player.seek(startTime);
  }
}

export function addLinesEvListener() {
  if (LinesEvListenerExists) return;

  // Populate the maps before adding the listener
  populateElementTimeMaps();

  LinesEvListenerExists = true;
  LinesEvListenerMaid = new Maid();

  const el = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (!el) {
    LinesEvListenerExists = false; // Ensure we can retry if element not found initially
    return;
  }
  el.addEventListener('click', LinesEvListener);
  LinesEvListenerMaid.Give(() =>
    el.removeEventListener('click', LinesEvListener as EventListener),
  ); // Ensure type compatibility for Maid
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
