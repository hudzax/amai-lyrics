import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../Lyrics/lyrics';
import { findActiveIndex } from '../Lyrics/findActiveIndex';
import { scrollIntoCenterView } from '../ScrollIntoView';
import SimpleBar from 'simplebar';
import fastdom from 'fastdom';

// Window-persisted so hot-reload doesn't orphan in-flight rAF scroll loop
// SAFETY: window augmentation for hot-reload persistence is intentional; __amaiScrollState is our own namespace and never conflicts with Spotify
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

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
  try {
    if (!SpotifyPlayer.IsPlaying) return;
    if (!Defaults.LyricsContainerExists) return;

    let onLyricsPage = false;
    try {
      onLyricsPage = Spicetify.Platform.History.location.pathname === '/AmaiLyrics';
    } catch {
      return;
    }
    if (!onLyricsPage) return;
    // These operations don't involve DOM reads, so they can be done synchronously
    const Lines = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;
    let Position: number;
    try {
      Position = SpotifyPlayer.GetTrackPosition();
    } catch {
      return;
    }
    if (typeof Position !== 'number' || !Number.isFinite(Position) || Position < 0) return;
    const PositionOffset = 370;
    const ProcessedPosition = Position + PositionOffset;

    if (!Lines) return;

    // Binary search for active line — O(log n) instead of O(n) scan.
    // SAFETY: Lines are domain-timed objects; narrowed to StartTime/EndTime for the search helper
    const activeIdx = findActiveIndex(
      Lines as unknown as { StartTime: number; EndTime: number }[],
      ProcessedPosition,
    );
    const currentLine = activeIdx !== -1 ? (Lines[activeIdx] as (typeof Lines)[number]) : null;
    // Hint: if cachedIdx matches activeIdx and lastLine already equals target, ScrollToActiveLine will early-return via lastLine check below.

    // If we found an active line, process it with FastDOM
    if (currentLine) {
      const LineElem = currentLine.HTMLElement as HTMLElement;
      // Already scrolled to this exact line -> skip all DOM work this tick
      if (lastLine === LineElem) return;

      // Cancel any in-flight scroll animation so seeks don't stack competing rAF loops.
      if (activeScrollController) {
        activeScrollController.cancel();
        setActiveController(null);
      }

      // Use closure variables to pass data from measure to mutate
      fastdom.measure(() => {
        // Abort if page was destroyed while this tick was queued (orphan rAF leak)
        if (!Defaults.LyricsContainerExists) return;
        if (!document.querySelector('#SpicyLyricsPage')) return;
        const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
        if (!container || !container.isConnected) return;
        if (!LineElem || !LineElem.isConnected) return;
        fastdom.mutate(() => {
          if (!Defaults.LyricsContainerExists) return;
          if (!container.isConnected || !LineElem.isConnected) return;
          if (lastLine === LineElem) return;

          // Release the previous pre-highlight target: Animate only keeps the
          // Active class on a NotSung line while OverridenByScroller is
          // present, so leaving it on a line we no longer target (e.g. after
          // a seek) would stick the highlight there.
          if (lastLine && lastLine.classList.contains('OverridenByScroller')) {
            lastLine.classList.remove('OverridenByScroller');
          }

          setLastLine(LineElem);

          setActiveController(scrollIntoCenterView(container, LineElem, 270, -50));
          LineElem.classList.add('Active', 'OverridenByScroller');
        });
      });
    }
  } catch {
    // Never throw from a scroll tick — IntervalManager would log and continue,
    // but silent skip keeps scroll self-healing across client updates.
  }
}

export function ResetLastLine() {
  if (activeScrollController) {
    activeScrollController.cancel();
    setActiveController(null);
  }
  setLastLine(null);
}
