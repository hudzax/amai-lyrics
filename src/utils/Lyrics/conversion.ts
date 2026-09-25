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
 * One line as every stage downstream of `processing` sees it. Times are in
 * seconds, matching the API unit; the render path converts.
 *
 * `start`/`end` are present exactly on line-synced rows — that presence, not a
 * discriminant, is what tells the two payload kinds apart from here on.
 * `raw` is the line as the pipeline prepared it, captured before enhancement
 * and phonetics overwrite `text`; it is what decides whether a translation
 * adds information the line does not already carry.
 */
export interface LineView {
  text: string;
  translation?: string;
  raw?: string;
  start?: number;
  end?: number;
  oppositeAligned?: boolean;
}

/**
 * The single shape that crosses the pipeline boundary: built once in
 * `processing`, then carried by cache, snapshot, publish, render and update.
 * Replaces the `LyricsData` union from that point on — the union still governs
 * ingest, where the API's three payload kinds are still distinct.
 */
export interface LyricsDocument {
  type: 'Line' | 'Static';
  id?: string;
  info?: string;
  songWriters?: string[];
  styles?: Record<string, string>;
  classes?: string;
  offline?: boolean;
  lines: LineView[];
}

/**
 * Version of the *stored* document format. Bumped when the serialized shape
 * changes, so an older cache or snapshot entry reads as a miss and re-fetches
 * instead of decoding into something that renders blank.
 */
export const LYRICS_DOCUMENT_VERSION = 2;

/** A document as it sits in storage: the shape plus the format it was written with. */
export type StoredLyricsDocument = LyricsDocument & { v: number };

export function stampDocument(document: LyricsDocument): StoredLyricsDocument {
  return { ...document, v: LYRICS_DOCUMENT_VERSION };
}

/**
 * Decodes a stored value back into a document, or null when it was written by
 * an older format or is otherwise unusable. The single decode point for the
 * cache and the snapshot.
 */
export function toDocument(stored: unknown): LyricsDocument | null {
  if (!stored || typeof stored !== 'object') return null;
  const candidate = stored as Partial<StoredLyricsDocument>;
  if (candidate.v !== LYRICS_DOCUMENT_VERSION) return null;
  if (candidate.type !== 'Line' && candidate.type !== 'Static') return null;
  if (!Array.isArray(candidate.lines)) return null;
  return candidate as LyricsDocument;
}

/** Maps either payload line shape onto the one line view. */
export function toLineView(item: LineBasedLyricItem | LyricsLine): LineView {
  const view: LineView = { text: item.Text ?? '' };
  if (item.Translation !== undefined) view.translation = item.Translation;
  if (typeof item.StartTime === 'number') view.start = item.StartTime;
  if (typeof item.EndTime === 'number') view.end = item.EndTime;
  if (item.OppositeAligned) view.oppositeAligned = true;
  return view;
}

/** The plain-text lines handed to the enhancement providers. */
export function documentTexts(document: LyricsDocument): string[] {
  return document.lines.map((line) => line.raw ?? line.text);
}

/**
 * Replaces the text of each line with the provided text array, falling back to
 * the existing text when the incoming array is shorter or empty. Used by the AI
 * enhancement path to apply phonetic/romanized text. Mutates in place so the
 * line objects keep their identity — the registry and the renderer hold them.
 */
export function updateLyricsWithText(document: LyricsDocument, lines: string[]): void {
  document.lines.forEach((line, index) => {
    const replacement = lines[index];
    if (replacement) line.text = replacement;
  });
}
