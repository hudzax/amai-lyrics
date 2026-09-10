/**
 * Amai Worker HTTP provider for Amai Lyrics.
 *
 * Owns the single timeout/abort/error path for the Amai Worker endpoint plus
 * the two calls (translation + phonetic). Nothing here is imported outside the
 * ai facade; the rest of the app speaks to ../ai instead.
 */

import Defaults from '../../../components/Global/Defaults';

/**
 * Shared helper for Amai Worker calls — single timeout/abort/error path.
 */
async function fetchFromAmai(
  url: string,
  body: Record<string, unknown>,
  resultKey: 'translation' | 'phonetic',
): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return (data[resultKey] as string[]) || [];
  } catch (error) {
    console.error(`Error fetching ${resultKey} from Amai Worker:`, error);
    return [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Fetches translations from the Amai Worker API.
 */
export async function fetchAmaiTranslations(
  lyricsOnly: string[],
  prompt: string,
): Promise<string[]> {
  return fetchFromAmai(
    Defaults.lyrics.api.translationUrl,
    { lyrics: lyricsOnly, prompt },
    'translation',
  );
}

/**
 * Fetches phonetic lyrics from the Amai Worker API.
 */
export async function fetchAmaiPhonetic(lyricsOnly: string[], prompt: string): Promise<string[]> {
  return fetchFromAmai(Defaults.lyrics.api.phoneticUrl, { lyrics: lyricsOnly, prompt }, 'phonetic');
}
