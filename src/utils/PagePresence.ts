/**
 * PagePresence — the single place that knows whether the lyrics page is
 * present.
 *
 * Callers cross it through isPageOpen (the page node is mounted) and
 * isOnPageRoute (the History pathname check); PageView is the only production
 * writer, through setPageOpen. Never through a raw `#AmaiLyricsPage` query or
 * a pathname check of their own.
 */

/**
 * Invariant: isPageOpen() is never true while the page node is absent. The
 * writer flips it only after the awaited mount and only after the awaited
 * removal, so in-flight reads never see a page the DOM does not have.
 */
let pageOpen = false;

export function setPageOpen(open: boolean): void {
  pageOpen = open;
}

export function isPageOpen(): boolean {
  return pageOpen;
}

/**
 * The defensive read stays here so callers never each re-learn that
 * `Spicetify.Platform.History` can be absent during early startup.
 */
export function isOnPageRoute(): boolean {
  try {
    return Spicetify.Platform.History.location.pathname === '/AmaiLyrics';
  } catch {
    return false;
  }
}
