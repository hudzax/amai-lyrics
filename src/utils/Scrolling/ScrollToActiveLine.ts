import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../Lyrics/lyrics';
import { scrollIntoCenterView } from '../ScrollIntoView';
import SimpleBar from 'simplebar';
import fastdom from 'fastdom';

// Window-persisted so hot-reload doesn't orphan in-flight rAF scroll loop
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
  if (!SpotifyPlayer.IsPlaying) return;
  if (!Defaults.LyricsContainerExists) return;

  if (Spicetify.Platform.History.location.pathname === '/AmaiLyrics') {
    // These operations don't involve DOM reads, so they can be done synchronously
    const Lines = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;
    const Position = SpotifyPlayer.GetTrackPosition();
    const PositionOffset = 370;
    const ProcessedPosition = Position + PositionOffset;

    if (!Lines) return;

    // Find the active line - this is a memory operation, not DOM
    let currentLine = null;
    for (let i = 0; i < Lines.length; i++) {
      const line = Lines[i];
      if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
        currentLine = line;
        break; // Exit the loop once a line is found
      }
    }

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
  }
}

export function ResetLastLine() {
  if (activeScrollController) {
    activeScrollController.cancel();
    setActiveController(null);
  }
  setLastLine(null);
}
