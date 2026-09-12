/**
 * Allowlisted external navigation.
 *
 * Several UI affordances point at fixed third-party destinations (Google AI
 * Studio for API keys, the GitHub repo/issues, YouTube search). Redirect and
 * `window.open` sinks accept arbitrary strings, so every external navigation
 * resolves through this module: only `https:` URLs on explicitly trusted
 * hosts produce a usable URL, everything else resolves to `null` and the
 * caller keeps the user where they are.
 */

const TRUSTED_EXTERNAL_HOSTS = new Set(['aistudio.google.com', 'github.com', 'www.youtube.com']);

/**
 * Returns the canonical URL when `rawUrl` is an `https:` URL on a trusted
 * host, otherwise `null`. Pure function — safe to unit test without jsdom
 * navigation side effects.
 */
export function resolveTrustedExternalUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (!TRUSTED_EXTERNAL_HOSTS.has(parsed.hostname)) return null;
  return parsed.toString();
}

/**
 * Builds a YouTube search URL for `query`. The host is fixed and the query
 * travels as an encoded search param, so track metadata can never break out
 * of the query string into a different destination.
 */
export function buildYouTubeSearchUrl(query: string): string | null {
  try {
    const url = new URL('https://www.youtube.com/results');
    url.searchParams.set('search_query', query);
    return resolveTrustedExternalUrl(url.toString());
  } catch {
    return null;
  }
}

/**
 * Navigates to a trusted external URL via a DOM anchor instead of assigning
 * `window.location.href` or calling `window.open` with a string. The
 * destination is allowlist-resolved first, so untrusted input never becomes
 * a navigation target. Returns false (without navigating) when rejected.
 */
export function openTrustedExternalUrl(
  rawUrl: string,
  target: '_blank' | '_self' = '_blank',
): boolean {
  const url = resolveTrustedExternalUrl(rawUrl);
  if (!url) return false;
  const anchor = document.createElement('a');
  anchor.href = url;
  if (target === '_blank') {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}

/** Builds a YouTube search navigation for `query` and follows it in a new tab. */
export function openYouTubeSearch(query: string): boolean {
  const url = buildYouTubeSearchUrl(query);
  if (!url) return false;
  return openTrustedExternalUrl(url, '_blank');
}
