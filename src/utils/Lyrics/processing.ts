/**
 * Lyrics processing functions for Amai Lyrics
 */

import { ShowProcessingIndicator, EnsureProcessingIndicatorHidden } from './ui';
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
import {
  isCurrentLyricsRequest,
  publishInitialLyrics,
  publishEnhancedLyrics,
  type LyricsRequestToken,
} from './publish';

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
      lines: convertLyrics((lyricsJson.Content || []) as SyllableBasedLyricItem[]).map(toLineView),
    };
  }

  if (type === 'Line') {
    return {
      type: 'Line',
      id,
      lines: ((lyricsJson.Content || []) as LineBasedLyricItem[]).map(toLineView),
    };
  }

  return {
    type: 'Static',
    id,
    lines: ((lyricsJson.Lines || []) as LyricsLine[]).map(toLineView),
  };
}

/**
 * Processes and enhances lyrics with AI features.
 *
 * @param trackId - Spotify track ID
 * @param lyricsJson - Raw lyrics data from API
 * @param token - Pipeline request token: initial paint, enhancement work,
 *   and enhancement publication all check it, so a superseded request
 *   resolves its data but never touches UI, storage, or the event bus.
 * @returns The document built from the response, enhanced when enhancement runs
 */
export async function processAndEnhanceLyrics(
  trackId: string,
  lyricsJson: LyricsResult,
  token: LyricsRequestToken,
): Promise<LyricsDocument> {
  const id = lyricsJson.id || trackId;
  const document = buildDocument(id, lyricsJson);

  const { document: prepared, lyricsOnly } = prepareLyricsForGemini(document);

  const { hasKanji, hasKorean } = detectLanguages(prepared);

  // STEP 1: Display lyrics immediately (without translations). The document is
  // freshly built and not shared, and enhancement mutates its line objects in
  // place — which is what the renderer's registry holds, so the update path
  // sees the enhancement without anything being handed across.
  await cacheLyrics(trackId, prepared);
  publishInitialLyrics(token, prepared);

  // STEP 2: Process phonetic and translations asynchronously. Skip the
  // (potentially slow, network-bound) enhancement when this request is no
  // longer current, so seeking past a song doesn't waste work. The basic
  // lyrics are still cached so a re-seek is fast.
  if (isCurrentLyricsRequest(token)) {
    // Start async processing without blocking the initial display
    void processLyricsEnhancementsAsync(token, trackId, prepared, hasKanji, hasKorean, lyricsOnly);
  }

  // Return immediately with the basic lyrics
  return prepared;
}

/**
 * Runs the STEP 2 enhancement for lyrics a *different* request already prepared.
 *
 * The dedupe join path needs this. Joining a shared in-flight promise stamps a
 * newer token, which makes the originator's token stale — so its STEP 2 gate
 * fails, and `enhanceLyrics` would bail on the same check even if it didn't.
 * Without a re-run under the joiner's token the joined track never receives
 * translations or phonetics, and the unenhanced payload is what gets persisted
 * to the snapshot and cache, so the loss survives restarts.
 *
 * `prepared` must be the document STEP 1 produced: offsets already applied,
 * empty lines already stripped, `raw` holding the plain-text lines. Re-running
 * prepareLyricsForGemini would shift every StartTime a second time, so the text
 * lines are read straight from `raw`.
 *
 * Enhancement mutates that same document in place — it is the one the page is
 * already rendering, so the update path picks the result up through the
 * renderer's registry. Cloning it here would enhance a copy nobody displays.
 *
 * @param token - Request token of the caller that will publish the result
 * @param trackId - Spotify track ID
 * @param prepared - Already-prepared document from STEP 1
 */
export async function enhancePreparedLyrics(
  token: LyricsRequestToken,
  trackId: string,
  prepared: LyricsDocument,
): Promise<void> {
  if (!isCurrentLyricsRequest(token)) return;
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

/**
 * Processes lyrics enhancements (phonetic and translations) asynchronously
 * and updates the UI when complete.
 *
 * Enhancement itself is owned by the EnhancementPolicy seam (`./ai`): this
 * function only owns the two-phase orchestration around it — the processing
 * indicator, the enhanced cache write, and publication. A null result means
 * the request went stale mid-flight, so cache and publication are skipped
 * (publication would no-op anyway via its own token guard).
 *
 * @param trackId - Spotify track ID
 * @param document - Document to enhance
 * @param hasKanji - Whether lyrics contain Japanese characters
 * @param hasKorean - Whether lyrics contain Korean characters
 * @param lyricsOnly - Plain text lyrics array
 */
async function processLyricsEnhancementsAsync(
  token: LyricsRequestToken,
  trackId: string,
  document: LyricsDocument,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<void> {
  try {
    // Show processing indicator
    ShowProcessingIndicator();

    const enhanced = await enhanceLyrics(document, lyricsOnly, { hasKanji, hasKorean }, token);
    if (!enhanced) return;

    // Update cache with enhanced lyrics
    await cacheLyrics(trackId, enhanced);

    // Publish in place (scroll/animation-safe). No-op when stale.
    publishEnhancedLyrics(token, trackId, enhanced);
  } catch (error) {
    console.error('Amai Lyrics: Error processing enhancements', error);
    // Don't show error to user - keep original lyrics visible
  } finally {
    // Always hide processing indicator, whether success or failure
    EnsureProcessingIndicatorHidden();
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
