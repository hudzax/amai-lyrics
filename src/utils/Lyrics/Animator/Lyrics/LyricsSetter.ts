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

interface Letter {
  StartTime: number;
  EndTime: number;
  Status?: 'Active' | 'NotSung' | 'Sung';
}

interface WordOrSyllable {
  StartTime: number;
  EndTime: number;
  Status?: 'Active' | 'NotSung' | 'Sung';
  LetterGroup?: boolean;
  Letters?: Letter[];
}

function updateCollectionStatus(
  collection: WordOrSyllable[],
  current: number,
  deep: boolean = false,
) {
  for (const item of collection) {
    item.Status = getStatus(item.StartTime, item.EndTime, current);

    if (deep && item?.LetterGroup && Array.isArray(item.Letters)) {
      for (const letter of item.Letters) {
        letter.Status = getStatus(letter.StartTime, letter.EndTime, current);
      }
    }
  }
}

export function TimeSetter(PreCurrentPosition: number) {
  const CurrentPosition = PreCurrentPosition + timeOffset;
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  if (CurrentLyricsType && CurrentLyricsType === 'None') return;

  const lines = LyricsObject.Types[CurrentLyricsType].Lines;

  // Perf: word/letter/dot Status values are only ever read by `Animate` for the
  // *active* line (non-active lines have their look driven by line.Status + CSS
  // classes). So we only deep-update the active line's inner items and cheaply
  // flip line.Status for everything else — this turns a full O(lyrics) pass over
  // every syllable/letter each frame into O(lines) + the active line only.
  if (CurrentLyricsType === 'Syllable') {
    for (const line of lines) {
      const start = line.StartTime;
      const end = line.EndTime;

      if (start <= CurrentPosition && CurrentPosition <= end) {
        line.Status = 'Active';
        updateCollectionStatus(line.Syllables.Lead, CurrentPosition, true);
      } else if (start >= CurrentPosition) {
        line.Status = 'NotSung';
      } else if (end <= CurrentPosition) {
        line.Status = 'Sung';
      }
    }
  } else if (CurrentLyricsType === 'Line') {
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
