import Defaults from '../../components/Global/Defaults';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../Lyrics/lyrics';
import { scrollIntoCenterView } from '../ScrollIntoView';
import SimpleBar from 'simplebar';
import fastdom from '../fastdom';

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
      if (
        line.StartTime <= ProcessedPosition &&
        line.EndTime >= ProcessedPosition
      ) {
        currentLine = line;
        break; // Exit the loop once a line is found
      }
    }

    // If we found an active line, process it with FastDOM
    if (currentLine) {
      // Use FastDOM for DOM reads
      fastdom
        .read(() => {
          const LineElem = currentLine.HTMLElement as HTMLElement;
          const container = ScrollSimplebar?.getScrollElement() as HTMLElement;

          // Return early if conditions aren't met
          if (!container) return null;
          if (lastLine && lastLine === LineElem) return null;

          // Return the elements we need for the write operation
          return { LineElem, container };
        })
        .then((result) => {
          // If read operation returned null, exit early
          if (!result) return;

          const { LineElem, container } = result;

          // Update lastLine reference (memory operation)
          lastLine = LineElem;

          // Use FastDOM for DOM writes
          fastdom.write(() => {
            // Scroll into view - this already uses requestAnimationFrame internally
            scrollIntoCenterView(container, LineElem, 270, -50); // Scroll Into View with a 300ms Animation

            // Add classes directly without setTimeout
            LineElem.classList.add('Active', 'OverridenByScroller');
          });
        });
    }
  }
}

export function ResetLastLine() {
  lastLine = null;
}
