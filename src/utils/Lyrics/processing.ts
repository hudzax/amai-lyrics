/**
 * Lyrics processing functions for Amai Lyrics
 */

import { cacheLyrics } from './cache';
import { enhanceLyrics } from './ai';
import {
  convertLyrics,
  documentTexts,
  LyricsDocument,
  LineBasedLyricItem,
  SyllableBasedLyricItem,
  LyricsLine,
  toLineView,
} from './conversion';
import { LyricsResult } from '../API/Lyrics';
import { isCurrentLyricsRequest, publishEnhancedLyrics, type LyricsRequestToken } from './publish';
import { getEnhancementConfigRevision, isEnhancementComplete } from './enhancementConfig';

// Regular expressions for language detection
const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

// Timing offset for lyrics synchronization
const LYRICS_TIMING_OFFSET = 0.55;

/**
 * Builds the document every stage downstream of here consumes. This is the
 * pipeline's one normalization point: 'Syllable' payloads become line-synced
 * lines, and the two payload kinds collapse into one line shape — the union
 * stops at ingest.
 */
function buildDocument(id: string, lyricsJson: LyricsResult): LyricsDocument {
  const type = (lyricsJson.Type || 'Static') as string;

  if (type === 'Syllable') {
    // Normalize syllable-based lyrics to line-synced on ingest; the syllable
    // renderer was removed. Users still get lyrics, just line-synced.
    return {
      type: 'Line',
      id,
      enhancementStatus: 'pending',
      lines: convertLyrics((lyricsJson.Content || []) as SyllableBasedLyricItem[]).map(toLineView),
    };
  }

  if (type === 'Line') {
    return {
      type: 'Line',
      id,
      enhancementStatus: 'pending',
      lines: ((lyricsJson.Content || []) as LineBasedLyricItem[]).map(toLineView),
    };
  }

  return {
    type: 'Static',
    id,
    enhancementStatus: 'pending',
    lines: ((lyricsJson.Lines || []) as LyricsLine[]).map(toLineView),
  };
}

/** Builds and caches prepared lyrics; LyricsPipeline owns enhancement scheduling. */
export async function processAndEnhanceLyrics(
  trackId: string,
  lyricsJson: LyricsResult,
  token: LyricsRequestToken,
): Promise<LyricsDocument> {
  const id = lyricsJson.id || trackId;
  const document = buildDocument(id, lyricsJson);

  const { document: prepared } = prepareLyricsForGemini(document);
  prepared.enhancementConfigRevision = getEnhancementConfigRevision();

  // Cache the prepared document so a re-seek is fast. The pipeline owns when
  // enhancement starts; keeping that decision there gives fresh, joined and
  // durable-hit results one request lifecycle.
  if (isCurrentLyricsRequest(token)) await cacheLyrics(trackId, prepared, token);
  return prepared;
}

/** Enhances the prepared instance in place; re-preparing would shift timing twice. */
export async function enhancePreparedLyrics(
  token: LyricsRequestToken,
  trackId: string,
  prepared: LyricsDocument,
): Promise<void> {
  if (isEnhancementComplete(prepared) || !isCurrentLyricsRequest(token)) return;
  const { hasKanji, hasKorean } = detectLanguages(prepared);
  await processLyricsEnhancementsAsync(
    token,
    trackId,
    prepared,
    hasKanji,
    hasKorean,
    documentTexts(prepared),
  );
}

/** Runs the policy, then persists and publishes only while the request is current. */
async function processLyricsEnhancementsAsync(
  token: LyricsRequestToken,
  trackId: string,
  document: LyricsDocument,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<void> {
  try {
    const configRevision = getEnhancementConfigRevision();
    const enhanced = await enhanceLyrics(document, lyricsOnly, { hasKanji, hasKorean }, token);
    if (
      !enhanced ||
      !isCurrentLyricsRequest(token) ||
      getEnhancementConfigRevision() !== configRevision
    ) {
      return;
    }

    enhanced.enhancementStatus = 'complete';
    enhanced.enhancementConfigRevision = configRevision;
    await cacheLyrics(trackId, enhanced, token);
    if (isCurrentLyricsRequest(token) && getEnhancementConfigRevision() === configRevision) {
      publishEnhancedLyrics(token, trackId, enhanced);
    }
  } catch (error) {
    console.error('Amai Lyrics: Error processing enhancements', error);
  }
}

/**
 * Detects Japanese and Korean characters in lyrics
 *
 * @param document - Lyrics document
 * @returns Object with language detection flags
 */
export function detectLanguages(document: LyricsDocument): {
  hasKanji: boolean;
  hasKorean: boolean;
} {
  let hasKanji = false;
  let hasKorean = false;

  for (const line of document.lines) {
    if (!hasKanji && JAPANESE_REGEX.test(line.text)) hasKanji = true;
    if (!hasKorean && KOREAN_REGEX.test(line.text)) hasKorean = true;
    if (hasKanji && hasKorean) break;
  }

  return { hasKanji, hasKorean };
}

/**
 * Prepares lyrics for Gemini AI processing
 *
 * @param document - Lyrics document
 * @returns Prepared document and text-only array
 */
export function prepareLyricsForGemini(document: LyricsDocument): {
  document: LyricsDocument;
  lyricsOnly: string[];
} {
  const lyricsOnly = extractLyrics(document);

  return { document, lyricsOnly };
}

/**
 * Strips empty lines, normalizes the survivors' text, records each survivor's
 * plain text as its `raw` (the pre-enhancement text a translation is compared
 * against), and applies the synchronization offset.
 *
 * The offset is line-synced only: rows without a start time have nothing to
 * shift, which is exactly the Static case.
 *
 * @param document - Lyrics document
 * @returns Array of lyrics text only
 */
export function extractLyrics(document: LyricsDocument): string[] {
  document.lines = document.lines.filter((line) => line.text.trim() !== '');

  for (const line of document.lines) {
    line.text = line.text.replace(/[「」",.!]/g, '').normalize('NFKC');
    line.raw = line.text;
    if (document.type === 'Line' && typeof line.start === 'number') {
      line.start = Math.max(0, line.start - LYRICS_TIMING_OFFSET);
    }
  }

  return document.lines.map((line) => line.text);
}
