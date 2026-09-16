import { Maid } from '@hudzax/web-modules/Maid';
import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { registerPositionConsumer } from '../PositionConsumer';
import { Lyrics } from './Animator/Main';
import { AutoScroll } from '../Scrolling/AutoScroll';

import { resetLyricsSetterCache } from './Animator/Lyrics/LyricsSetter';
import { resetAnimatorCache } from './Animator/Lyrics/LyricsAnimator';

export const lyricsBetweenShow = 3;

export const LyricsObject = {
  Types: {
    Line: {
      Lines: [],
    },
    Static: {
      Lines: [],
    },
  },
};

// Maps for optimizing LinesEvListener lookups
export const lineElementToStartTimeMap = new Map<HTMLElement, number>();

export let LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;

export function SetWordArrayInCurentLine_LINE_SYNCED() {
  LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;

  LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables = {};
  LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead = [];
}

export function ClearLyricsContentArrays() {
  LyricsObject.Types.Line.Lines = [];
  LyricsObject.Types.Static.Lines = [];
  // Clear the maps as well
  lineElementToStartTimeMap.clear();
  // Force a fresh initial render on the next tick (e.g. when a new song loads)
  lastRenderedPosition = -1;
  hasRenderedInitial = false;
  resetLyricsSetterCache();
  resetAnimatorCache();
  AutoScroll.reset();
}

const THROTTLE_TIME = 0.05;
let lastRenderedPosition = -1;
let hasRenderedInitial = false;
let scrollTickCounter = 0;

// The render loop is owned by the PositionConsumer seam (interval, play-state
// self-heal, lyrics-page gate, position refcount). Exposed via
// ensureLyricsRenderLoop() for explicit init and lifecycle teardown; auto-starts
// on first import for backward compat but can also be started from app.tsx.
let renderLoopDisposer: (() => void) | null = null;

export function ensureLyricsRenderLoop(): void {
  if (renderLoopDisposer) return;
  renderLoopDisposer = registerPositionConsumer({
    surface: 'highlight',
    intervalSeconds: THROTTLE_TIME,
    enabled: (ctx) => Defaults.LyricsContainerExists && ctx.onLyricsPage,
    wantsTracking: (ctx) => ctx.onLyricsPage,
    onPosition: (progress) => {
      // Nothing moved since the last frame -> no re-render needed
      if (hasRenderedInitial && progress === lastRenderedPosition) return;

      lastRenderedPosition = progress;
      hasRenderedInitial = true;
      Lyrics.TimeSetter(progress);
      Lyrics.Animate();
      scrollTickCounter++;
      if (scrollTickCounter % 2 === 0) {
        AutoScroll.sync();
      }
    },
  });
}

export function destroyLyricsRenderLoop(): void {
  if (renderLoopDisposer) {
    renderLoopDisposer();
    renderLoopDisposer = null;
  }
  lastRenderedPosition = -1;
  hasRenderedInitial = false;
}

// Auto-start for backward compat (existing entry points rely on import side-effect).
ensureLyricsRenderLoop();
let LinesEvListenerMaid: Maid;
let LinesEvListenerExists: boolean;

/**
 * Populates the lookup maps from HTMLElement to start time.
 * This should be called after lyrics HTML elements are created and associated
 * with their data objects.
 */
export function populateElementTimeMaps() {
  lineElementToStartTimeMap.clear();

  LyricsObject.Types.Line.Lines.forEach((line) => {
    if (line.HTMLElement && typeof line.StartTime === 'number') {
      lineElementToStartTimeMap.set(line.HTMLElement, line.StartTime);
    }
  });
}

function LinesEvListener(e: Event) {
  let target = e.target as HTMLElement;
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
  }

  if (typeof startTime === 'number') {
    SpotifyPlayer.Seek(startTime);
  }
}

export function addLinesEvListener() {
  if (LinesEvListenerExists) {
    removeLinesEvListener();
  }

  // Populate the maps before adding the listener
  populateElementTimeMaps();

  LinesEvListenerExists = true;
  LinesEvListenerMaid = new Maid();

  const el = document.querySelector<HTMLElement>('#AmaiLyricsPage .LyricsContainer .LyricsContent');
  if (!el) {
    LinesEvListenerExists = false; // Ensure we can retry if element not found initially
    return;
  }
  el.addEventListener('click', LinesEvListener);
  LinesEvListenerMaid.Give(() => {
    el.removeEventListener('click', LinesEvListener as EventListener);
  }); // Ensure type compatibility for Maid
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
