/**
 * Lyrics conversion functions for Amai Lyrics
 */

// Japanese character detection regex
const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;

export interface Syllable {
  Text: string;
  IsPartOfWord?: boolean;
  // Add other properties if they exist and are used, e.g., Time: number;
}

export interface LeadData {
  Syllables: Syllable[];
  StartTime: number;
  EndTime: number;
}

export interface BackgroundData {
  Syllables: Syllable[];
  StartTime?: number;
  EndTime?: number;
}

export interface SyllableBasedLyricItem {
  Type: string; // Assuming Type is a string, adjust if needed
  OppositeAligned: boolean; // Assuming OppositeAligned is a boolean, adjust if needed
  Lead: LeadData;
  Background?: BackgroundData[];
}

export interface LyricsLine {
  Type?: string;
  OppositeAligned?: boolean;
  Text: string;
  StartTime?: number;
  EndTime?: number;
  Translation?: string;
  Lead?: {
    StartTime: number;
    EndTime: number;
    Syllables: Syllable[];
  };
}

export interface LineBasedLyricItem {
  Type: string; // Assuming Type is a string, adjust if needed
  OppositeAligned: boolean; // Assuming OppositeAligned is a boolean, adjust if needed
  Text: string;
  StartTime: number;
  EndTime: number;
  Translation?: string;
}

/**
 * Collects syllables into words, respecting IsPartOfWord and Japanese spacing.
 * Extracted to deduplicate Lead vs Background paths.
 */
function collectSyllableText(syllables: Syllable[]): string {
  let text = '';
  let prevIsJapanese: boolean | null = null;
  let i = 0;
  while (i < syllables.length) {
    let syl = syllables[i];
    let word = syl.Text;
    while (syl.IsPartOfWord && i + 1 < syllables.length) {
      i++;
      syl = syllables[i];
      word += syl.Text;
      if (!syl.IsPartOfWord) break;
    }
    if (JAPANESE_REGEX.test(word)) {
      if (prevIsJapanese === false && text) text += ' ';
      text += word;
      prevIsJapanese = true;
    } else {
      text += (text ? ' ' : '') + word;
      prevIsJapanese = false;
    }
    i++;
  }
  return text;
}

/**
 * Converts syllable-based lyrics to line-based format
 *
 * @param data - Syllable-based lyrics data
 * @returns Line-based lyrics data
 */
export function convertLyrics(data: SyllableBasedLyricItem[]): LineBasedLyricItem[] {
  return data.map((item) => {
    if (!item.Lead || !item.Lead.Syllables || !Array.isArray(item.Lead.Syllables)) {
      console.error('Amai Lyrics: Invalid lyrics structure', item);
      return {
        Type: item.Type,
        OppositeAligned: item.OppositeAligned,
        Text: '',
        StartTime: 0,
        EndTime: 0,
      };
    }

    const leadText = collectSyllableText(item.Lead.Syllables);

    let startTime = item.Lead.StartTime;
    let endTime = item.Lead.EndTime;
    let fullText = leadText;

    if (item.Background && Array.isArray(item.Background)) {
      const bgTexts = item.Background.map((bg: BackgroundData) => {
        if (typeof bg.StartTime === 'number') {
          startTime = Math.min(startTime, bg.StartTime);
        }
        if (typeof bg.EndTime === 'number') {
          endTime = Math.max(endTime, bg.EndTime);
        }
        if (!bg.Syllables || !Array.isArray(bg.Syllables)) return '';
        return collectSyllableText(bg.Syllables);
      });

      fullText += ' (' + bgTexts.join(' ') + ')';
    }

    return {
      Type: item.Type,
      OppositeAligned: item.OppositeAligned,
      Text: fullText,
      StartTime: startTime,
      EndTime: endTime,
    };
  });
}

/**
 * Domain model for a fetched/generated lyric payload, before it is applied to
 * the DOM. Lives here (rather than in processing.ts or the Applyers) because it
 * is the shared vocabulary for every stage of the pipeline: fetch, enhancement,
 * cache, display-update and apply all pass this discriminated union around.
 */
export interface LyricsDataLine {
  id?: string;
  Type: 'Line';
  Content?: LineBasedLyricItem[];
  Lines?: LyricsLine[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

export interface LyricsDataStatic {
  id?: string;
  Type: 'Static';
  Lines?: LyricsLine[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

// Syllable-based lyrics are normalized to Line on ingest — the word-by-word
// karaoke renderer has been removed from the extension.
export type LyricsData = LyricsDataLine | LyricsDataStatic;

/**
 * Replaces the Text of each line with the provided text array, falling back to
 * the existing text when the incoming array is shorter. Used by the AI
 * enhancement path to apply phonetic/romanized text to a LyricsData payload.
 */
export function updateLyricsWithText(lyricsJson: LyricsData, lines: string[]): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content = lyricsJson.Content.map((item: LineBasedLyricItem, index: number) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines = lyricsJson.Lines.map((item: LyricsLine, index: number) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  }
}
