import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../Lyrics/lyrics';
import { scrollIntoCenterView } from '../ScrollIntoView';
import SimpleBar from 'simplebar';
import fastdom from 'fastdom';

let lastLine = null;

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

      // Use closure variables to pass data from measure to mutate
      fastdom.measure(() => {
        const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
        fastdom.mutate(() => {
          if (!container || !LineElem) return;
          if (lastLine === LineElem) return;

          lastLine = LineElem;

          scrollIntoCenterView(container, LineElem, 270, -50);
          LineElem.classList.add('Active', 'OverridenByScroller');
        });
      });
    }
  }
}

export function ResetLastLine() {
  lastLine = null;
}
