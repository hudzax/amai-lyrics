import Defaults from '../../../../components/Global/Defaults';
import { LyricsObject } from '../../lyrics';
import { timeOffset } from '../Shared';

function getStatus(start: number, end: number, current: number): 'Active' | 'NotSung' | 'Sung' {
  if (start <= current && current <= end) {
    return 'Active';
  } else if (start >= current) {
    return 'NotSung';
  } else {
    return 'Sung';
  }
}

interface WordOrSyllable {
  StartTime: number;
  EndTime: number;
  Status?: 'Active' | 'NotSung' | 'Sung';
}

function updateCollectionStatus(collection: WordOrSyllable[], current: number) {
  for (const item of collection) {
    item.Status = getStatus(item.StartTime, item.EndTime, current);
  }
}

export function TimeSetter(PreCurrentPosition: number) {
  const CurrentPosition = PreCurrentPosition + timeOffset;
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  if (CurrentLyricsType && CurrentLyricsType === 'None') return;

  const lines = LyricsObject.Types[CurrentLyricsType]?.Lines;
  // Guard against unknown/legacy types (e.g. 'Syllable' from a stale storage
  // payload) — the syllable renderer has been removed.
  if (!lines) return;

  // Perf: dot Status values are only ever read by `Animate` for the *active*
  // line (non-active lines have their look driven by line.Status + CSS
  // classes). So we only update the active line's dots and cheaply flip
  // line.Status for everything else — O(lines) per frame.
  if (CurrentLyricsType === 'Line') {
    for (const line of lines) {
      const start = line.StartTime;
      const end = line.EndTime;

      if (start <= CurrentPosition && CurrentPosition <= end) {
        line.Status = 'Active';
        if (line.DotLine) {
          updateCollectionStatus(line.Syllables.Lead, CurrentPosition);
        }
      } else if (start >= CurrentPosition) {
        line.Status = 'NotSung';
      } else if (end <= CurrentPosition) {
        line.Status = 'Sung';
      }
    }
  }
}
