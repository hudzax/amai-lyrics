import Defaults from '../../../../components/Global/Defaults';
import { LyricsObject } from '../../lyrics';
import { timeOffset } from '../Shared';

function getStatus(
  start: number,
  end: number,
  current: number,
): 'Active' | 'NotSung' | 'Sung' {
  if (start <= current && current <= end) {
    return 'Active';
  } else if (start >= current) {
    return 'NotSung';
  } else {
    return 'Sung';
  }
}

function updateCollectionStatus(
  collection: any[],
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

  if (CurrentLyricsType === 'Syllable') {
    for (const line of lines) {
      const start = line.StartTime;
      const end = line.EndTime;

      if (start <= CurrentPosition && CurrentPosition <= end) {
        line.Status = 'Active';
        updateCollectionStatus(line.Syllables.Lead, CurrentPosition, true);
      } else if (start >= CurrentPosition) {
        line.Status = 'NotSung';
        for (const word of line.Syllables.Lead) {
          word.Status = 'NotSung';
          if (word?.LetterGroup && Array.isArray(word.Letters)) {
            for (const letter of word.Letters) {
              letter.Status = 'NotSung';
            }
          }
        }
      } else if (end <= CurrentPosition) {
        line.Status = 'Sung';
        for (const word of line.Syllables.Lead) {
          word.Status = 'Sung';
          if (word?.LetterGroup && Array.isArray(word.Letters)) {
            for (const letter of word.Letters) {
              letter.Status = 'Sung';
            }
          }
        }
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
        if (line.DotLine) {
          for (const dot of line.Syllables.Lead) {
            dot.Status = 'NotSung';
          }
        }
      } else if (end <= CurrentPosition) {
        line.Status = 'Sung';
        if (line.DotLine) {
          for (const dot of line.Syllables.Lead) {
            dot.Status = 'Sung';
          }
        }
      }
    }
  }
}
