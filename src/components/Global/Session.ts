import Global from './Global';

interface Location {
  pathname: string;
  search?: string;
  hash?: string;
  state?: Record<string, unknown>;
}

const LYRICS_PATHNAME = '/AmaiLyrics';

let sessionHistory: Location[] = [];

function isSameLocation(a: Location, b: Location): boolean {
  return a.pathname === b.pathname && a.search === b.search && a.hash === b.hash;
}

interface PlatformHistoryShape {
  entries?: { pathname?: string }[];
  index?: number;
  goBack?: () => void;
}

function getPlatformHistory(): PlatformHistoryShape | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spicetify = globalThis as any;
    return spicetify?.Spicetify?.Platform?.History as PlatformHistoryShape | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Previous non-lyrics pathname from Spotify's own history stack.
 * Unlike our module-level mirror, the platform stack survives hot-reload
 * re-injections (which reset this module's state) and can never drift from
 * what the client actually shows.
 */
function previousFromPlatformHistory(): string | null {
  const history = getPlatformHistory();
  const entries = history?.entries;
  if (!Array.isArray(entries) || entries.length < 2) return null;
  const cursor =
    typeof history?.index === 'number'
      ? Math.min(history.index, entries.length - 1)
      : entries.length - 1;
  for (let i = cursor - 1; i >= 0; i--) {
    const pathname = entries[i]?.pathname;
    if (pathname && pathname !== LYRICS_PATHNAME) return pathname;
  }
  return null;
}

const Session = {
  Navigate: (data: Location) => {
    Spicetify.Platform.History.push(data);
    //Session.PushToHistory(data);
  },
  GoBack: () => {
    // Prefer the platform's own stack: it survives hot-reload and never drifts.
    // Skips lyrics-page entries so a double-push of /AmaiLyrics can't resolve
    // to the page itself (a no-op navigation that strands the user).
    const platformPrevious = previousFromPlatformHistory();
    if (platformPrevious) {
      Session.Navigate({ pathname: platformPrevious });
      return;
    }
    // Mirror fallback: walk back past the lyrics page itself instead of
    // blindly taking length - 2 (same no-op hazard as above).
    for (let i = sessionHistory.length - 2; i >= 0; i--) {
      if (sessionHistory[i].pathname !== LYRICS_PATHNAME) {
        Session.Navigate(sessionHistory[i]);
        return;
      }
    }
    // Last resort: real browser-back, then home.
    try {
      const goBack = getPlatformHistory()?.goBack;
      if (typeof goBack === 'function') {
        goBack();
        return;
      }
    } catch {
      /* fall through to home */
    }
    Session.Navigate({ pathname: '/' });
  },
  GetPreviousLocation: () => {
    if (sessionHistory.length > 1) {
      return sessionHistory[sessionHistory.length - 2];
    }
    return null;
  },
  RecordNavigation: (data: Location) => {
    Session.PushToHistory(data);
    Global.Event.evoke('session:navigation', data);
  },
  FilterOutTheSameLocation: (data: Location) => {
    sessionHistory = sessionHistory.filter(
      (location) =>
        location.pathname !== data.pathname &&
        location.search !== data?.search &&
        location.hash !== data?.hash,
    );
  },
  PushToHistory: (data: Location) => {
    // Drop consecutive duplicates (e.g. a double-push of /AmaiLyrics): they
    // would otherwise make GoBack resolve to the page the user is already on.
    const last = sessionHistory[sessionHistory.length - 1];
    if (last && isSameLocation(last, data)) return;
    sessionHistory.push(data);
  },
};

window._spicy_lyrics_session = Session;

export default Session;
