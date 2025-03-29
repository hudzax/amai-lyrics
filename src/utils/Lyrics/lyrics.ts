import { Maid } from '@spikerko/web-modules/Maid';
import { IntervalManager } from '../IntervalManager';
import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { Lyrics } from './Animator/Main';

export const ScrollingIntervalTime = 0.1;

export const lyricsBetweenShow = 3;

export let LyricsObject = {
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

export let CurrentLineLyricsObject =
  LyricsObject.Types.Syllable.Lines.length - 1;
export let LINE_SYNCED_CurrentLineLyricsObject =
  LyricsObject.Types.Line.Lines.length - 1;

export function SetWordArrayInAllLines() {
  LyricsObject.Types.Syllable.Lines.forEach((_, i) => {
    LyricsObject.Types.Syllable.Lines[i].Syllables = {};
    LyricsObject.Types.Syllable.Lines[i].Syllables.Lead = [];
  });
}

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
}

const THROTTLE_TIME = 0;

const LyricsInterval = new IntervalManager(THROTTLE_TIME, () => {
  if (!Defaults.LyricsContainerExists) return;
  const progress = SpotifyPlayer.GetTrackPosition();
  Lyrics.TimeSetter(progress);
  Lyrics.Animate(progress);
}).Start();

let LinesEvListenerMaid;
let LinesEvListenerExists;

function LinesEvListener(e) {
  if (e.target.classList.contains('line')) {
    let startTime;

    LyricsObject.Types.Line.Lines.forEach((line) => {
      if (line.HTMLElement === e.target) {
        startTime = line.StartTime;
      }
    });

    if (startTime) {
      Spicetify.Player.seek(startTime);
    }
  } else if (e.target.classList.contains('word')) {
    let startTime; //e.target.parentNode.getAttribute("start") ?? e.target.parentNode.parentNode.getAttribute("start");

    LyricsObject.Types.Syllable.Lines.forEach((line) => {
      line.Syllables.Lead.forEach((word) => {
        if (word.HTMLElement === e.target) {
          startTime = line.StartTime;
        }
      });
    });

    if (startTime) {
      Spicetify.Player.seek(startTime);
    }
  } else if (e.target.classList.contains('Emphasis')) {
    let startTime;

    LyricsObject.Types.Syllable.Lines.forEach((line) => {
      line.Syllables.Lead.forEach((word) => {
        if (word?.Letters) {
          word.Letters.forEach((letter) => {
            if (letter.HTMLElement === e.target) {
              startTime = line.StartTime;
            }
          });
        }
      });
    });

    if (startTime) {
      Spicetify.Player.seek(startTime);
    }
  }
}

export function addLinesEvListener() {
  if (LinesEvListenerExists) return;
  LinesEvListenerExists = true;

  LinesEvListenerMaid = new Maid();

  const el = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (!el) return;
  const evl = el.addEventListener('click', LinesEvListener);
  LinesEvListenerMaid.Give(evl);
}

export function removeLinesEvListener() {
  if (!LinesEvListenerExists) return;
  LinesEvListenerExists = false;

  const el = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (!el) return;
  el.removeEventListener('click', LinesEvListener);
  LinesEvListenerMaid.Destroy();
}
