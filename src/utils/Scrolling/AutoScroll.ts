import Defaults from '../../components/Global/Defaults';
import { getPositionFor, resolveIsPlaying } from '../Gets/GetProgress';
import { LyricsObject } from '../Lyrics/lyrics';
import { findActiveIndex } from '../Lyrics/findActiveIndex';
import { scrollIntoCenterView } from '../ScrollIntoView';
import {
  ClearScrollSimplebar,
  MountScrollSimplebar,
  RecalculateScrollSimplebar,
  ScrollSimplebar,
} from './Simplebar/ScrollSimplebar';

export interface AutoScrollLine {
  // Optional because registrations are typed that way upstream (StoredLine in
  // LyricsRenderer); the renderer always sets it, but a line without an element
  // is simply not scrollable and the tick guards against it.
  HTMLElement?: HTMLElement;
  StartTime: number;
  EndTime: number;
}

export interface AutoScrollSyncOverrides {
  position?: number;
  lines?: AutoScrollLine[];
  container?: HTMLElement | null;
  scroller?: (container: HTMLElement, element: HTMLElement) => { cancel: () => void };
  isPlaying?: boolean;
  onLyricsPage?: boolean;
}

// Window-persisted so hot-reload does not orphan an in-flight scroll loop.
// Reuses the historical key so state survives across extension versions.
// SAFETY: window augmentation for hot-reload persistence is intentional; __amaiScrollState is our own namespace.
const windowRef = window as unknown as {
  __amaiScrollState?: {
    lastLine: HTMLElement | null;
    activeScrollController: { cancel: () => void } | null;
  };
};
const sharedScrollState = (windowRef.__amaiScrollState ??= {
  lastLine: null,
  activeScrollController: null,
});

let lastLine: HTMLElement | null = sharedScrollState.lastLine;
let activeScrollController: { cancel: () => void } | null =
  sharedScrollState.activeScrollController;

function setLastLine(value: HTMLElement | null): void {
  lastLine = value;
  sharedScrollState.lastLine = value;
}

function setActiveController(value: { cancel: () => void } | null): void {
  activeScrollController = value;
  sharedScrollState.activeScrollController = value;
}

function resolveOnLyricsPage(): boolean {
  try {
    return Spicetify.Platform.History.location.pathname === '/AmaiLyrics';
  } catch {
    return false;
  }
}

/** Idempotent mount: recalculates when the container exists, mounts otherwise. */
export function mountAutoScroll(): void {
  try {
    if (ScrollSimplebar) RecalculateScrollSimplebar();
    else MountScrollSimplebar();
  } catch {
    // Mount is best-effort; the next sync tick retries with live DOM.
  }
}

/**
 * One auto-scroll tick. Never throws. Without overrides it reads the live
 * seams (play state, lyrics page, lines, position, container, motion).
 * Tests inject overrides instead of the live seams.
 */
export function syncAutoScroll(overrides: AutoScrollSyncOverrides = {}): void {
  try {
    const isPlaying = overrides.isPlaying ?? resolveIsPlaying();
    if (!isPlaying) return;
    if (!Defaults.LyricsContainerExists) return;

    const onLyricsPage = overrides.onLyricsPage ?? resolveOnLyricsPage();
    if (!onLyricsPage) return;

    const lines = (overrides.lines ?? LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines) as
      AutoScrollLine[] | undefined;

    let position: number;
    try {
      // Lead time lives in the position module, never here.
      position = overrides.position ?? getPositionFor('scroll');
    } catch {
      return;
    }
    if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) return;
    if (!lines) return;

    const activeIdx = findActiveIndex(lines, position);
    const currentLine = activeIdx !== -1 ? lines[activeIdx] : null;
    if (!currentLine) return;

    const lineElem = currentLine.HTMLElement;
    if (!lineElem) return;
    if (lastLine === lineElem) return;
    if (!lineElem.isConnected) return;
    if (!document.querySelector('#AmaiLyricsPage')) return;

    const container =
      overrides.container !== undefined
        ? overrides.container
        : (ScrollSimplebar?.getScrollElement() as HTMLElement | undefined);
    if (!container || !container.isConnected) return;

    if (activeScrollController) {
      activeScrollController.cancel();
      setActiveController(null);
    }

    // Release the previous pre-highlight target so a seek never sticks it.
    if (lastLine && lastLine.classList.contains('OverridenByScroller')) {
      lastLine.classList.remove('OverridenByScroller');
    }

    setLastLine(lineElem);

    const scroller = overrides.scroller ?? scrollIntoCenterView;
    setActiveController(scroller(container, lineElem, 270, -50));
    lineElem.classList.add('Active', 'OverridenByScroller');
  } catch {
    // Never throw from a scroll tick — the next tick self-heals.
  }
}

/** Cancel motion and forget the target line. Never throws. */
export function resetAutoScroll(): void {
  try {
    if (activeScrollController) {
      activeScrollController.cancel();
      setActiveController(null);
    }
    if (lastLine && lastLine.isConnected && lastLine.classList.contains('OverridenByScroller')) {
      lastLine.classList.remove('OverridenByScroller');
    }
    setLastLine(null);
  } catch {
    // reset is best-effort; worst case the next sync re-targets.
  }
}

/** Full teardown: reset motion plus unmount the container. Never throws. */
export function destroyAutoScroll(): void {
  resetAutoScroll();
  try {
    ClearScrollSimplebar();
  } catch {
    // ignore — destroy must never throw from teardown paths.
  }
}

/** Test-only: expose the current target without crossing the seam. */
export function __getAutoScrollLastLineForTests(): HTMLElement | null {
  return lastLine;
}

export const AutoScroll = {
  mount: mountAutoScroll,
  sync: syncAutoScroll,
  reset: resetAutoScroll,
  destroy: destroyAutoScroll,
};
