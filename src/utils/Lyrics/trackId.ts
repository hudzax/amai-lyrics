/**
 * Single owner of Spotify URI → track-id parsing.
 *
 * Leaf module by design: zero imports, so the fetch pipeline (fetchLyrics),
 * currency (publish), UI (ui), and apply gate (Global Applyer) can all share
 * it without creating an import cycle. Replaces six hand-rolled
 * `uri.split(':')[2]` call sites.
 */

/** Extracts the track id from a `spotify:track:<id>` URI. Returns '' when unparseable. */
export function parseTrackId(uri: string | null | undefined): string {
  if (!uri || typeof uri !== 'string') return '';
  const parts = uri.split(':');
  return parts[2] ?? '';
}

/** Live track id straight from the player — same ground truth as publish.liveLyricsUri. */
export function liveTrackId(): string {
  try {
    const uri = Spicetify?.Player?.data?.item?.uri;
    return parseTrackId(typeof uri === 'string' ? uri : null);
  } catch {
    return '';
  }
}
