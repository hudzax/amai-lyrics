import storage from '../../utils/storage';
import { registerPositionConsumer } from '../../utils/PositionConsumer';
import { processPhoneticText } from '../../utils/Lyrics/phoneticPatterns';
import { findActiveIndex } from '../../utils/Lyrics/findActiveIndex';
import { convertLyrics } from '../../utils/Lyrics/conversion';
import { createRubyFragment } from '../../utils/sanitize';
import Whentil from '../../utils/Whentil';
import lifecycle from '../../utils/lifecycle';
import Event from '../../utils/EventManager';

/**
 * Shows the currently active lyric line inside Spotify's native bottom playbar,
 * replacing the center playback controls. Hovering the control area reveals the
 * native controls again.
 */

// Surface lead times live in the position module (PlaybackSurfaceOffset) —
// this module only picks its surface. Kept in sync with AutoScroll by
// construction instead of by matching comments.
const UPDATE_INTERVAL = 0.3; // seconds

interface LineEntry {
  text: string;
  StartTime: number; // ms
  EndTime: number; // ms
}

let lyricsElement: HTMLElement | null = null;
let centerWrapper: HTMLElement | null = null;
let positionConsumerDisposer: (() => void) | null = null;
let resizeObserver: ResizeObserver | null = null;
let lastText = '';

// Handle for the pending "wait for playbar" poll so it can be cancelled on teardown.
let initWhen: ReturnType<typeof Whentil.When> | null = null;

// Cache the parsed line list so we don't JSON.parse the full lyrics blob every tick
let cachedLines: LineEntry[] | null = null;
let cachedLinesRaw: string | null = null;

// In-memory lyrics data kept in sync on song change + AI enhancement so the
// update loop never reads from localStorage (synchronous I/O) on its hot path.
let inMemoryLyricsData: string | null = null;

let lyricsDataListenerId: number | null = null;

// Cached read for hot path — storage.get hits Spicetify.LocalStorage each tick.
let cachedPlaybarEnabled: boolean | null = null;
let cachedPlaybarEnabledAt = 0;
const PLAYBAR_ENABLED_TTL_MS = 1500;
function isEnabled(): boolean {
  const now = performance.now();
  if (cachedPlaybarEnabled !== null && now - cachedPlaybarEnabledAt < PLAYBAR_ENABLED_TTL_MS) {
    return cachedPlaybarEnabled;
  }
  const raw = storage.get('enable_playbar_lyrics');
  cachedPlaybarEnabled = raw !== 'false';
  cachedPlaybarEnabledAt = now;
  return cachedPlaybarEnabled;
}
// Keep cache warm when settings change in this tab (storage event is cross-tab only)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    cachedPlaybarEnabled = null;
  });
}

interface StoredLyrics {
  id: string;
  Type: string;
  Content: unknown;
}

interface TimedLyricItem {
  StartTime?: number | null;
  EndTime?: number | null;
  Text?: string;
}

/**
 * Reads the globally stored parsed lyrics and builds a timed line list for the
 * current track. Only timed lyrics (Line / Syllable) are supported.
 */
function getLinesFromStorage(rawOverride?: string): LineEntry[] | null {
  const raw = rawOverride ?? storage.get('currentLyricsData');
  if (!raw) return null;

  let data: StoredLyrics;
  try {
    data = JSON.parse(String(raw)) as StoredLyrics;
  } catch {
    return null;
  }
  if (!data || !data.id) return null;

  // Only show lyrics for the track that is currently playing
  const currentTrackId = Spicetify.Player.data?.item?.uri?.split(':')[2];
  if (currentTrackId !== data.id) return null;

  let content: TimedLyricItem[] | undefined;
  if (data.Type === 'Line' && Array.isArray(data.Content)) {
    content = data.Content as TimedLyricItem[];
  } else if (data.Type === 'Syllable' && Array.isArray(data.Content)) {
    content = convertLyrics(data.Content as Parameters<typeof convertLyrics>[0]);
  } else {
    // Static lyrics have no timing information
    return null;
  }

  const lines: LineEntry[] = [];
  for (const item of content) {
    if (item.StartTime == null || item.EndTime == null) continue;
    const text = (item.Text || '').trim();
    if (!text) continue;
    lines.push({
      text,
      StartTime: item.StartTime * 1000,
      EndTime: item.EndTime * 1000,
    });
  }
  return lines.length ? lines : null;
}

/**
 * Positions the lyrics overlay exactly over the native playback controls so it
 * visually replaces them.
 */
function positionLyrics(): void {
  if (!lyricsElement || !centerWrapper) return;
  const controls = centerWrapper.querySelector<HTMLElement>('.player-controls');
  if (!controls) return;

  const cRect = controls.getBoundingClientRect();
  const wRect = centerWrapper.getBoundingClientRect();

  lyricsElement.style.left = `${cRect.left - wRect.left + cRect.width / 2}px`;
  lyricsElement.style.top = `${cRect.top - wRect.top + cRect.height / 2}px`;
  lyricsElement.style.maxWidth = `${cRect.width}px`;
}

function onSongChange(): void {
  lastText = '';
  cachedLines = null;
  cachedLinesRaw = null;
  cachedPlaybarEnabled = null;
  inMemoryLyricsData = storage.get('currentLyricsData');
  if (lyricsElement) {
    lyricsElement.innerHTML = '';
  }
  // The animated gradient's colours are no longer resolved here: they inherit
  // --amai-accent-* published on <html> by the ArtworkSurfaces seam, whose own
  // skip-coalescing fan-out already runs on song change.
}

/**
 * Sets the lyric text on an inner span and plays a subtle entrance animation.
 * The animation targets the inner element so it doesn't conflict with the
 * container's centering transform.
 */
function setLyricsText(html: string): void {
  if (!lyricsElement) return;

  let inner = lyricsElement.querySelector<HTMLElement>('.amai-playbar-lyrics-inner');
  if (!inner) {
    inner = document.createElement('span');
    inner.className = 'amai-playbar-lyrics-inner';
    lyricsElement.appendChild(inner);
  }

  inner.textContent = '';
  inner.appendChild(createRubyFragment(html));

  requestAnimationFrame(() => {
    const cw = lyricsElement!.clientWidth;
    if (inner.scrollWidth > cw) {
      const dist = cw - inner.scrollWidth - 20;
      inner.style.setProperty('--scroll-dist', `${dist}px`);
      inner.style.setProperty('--scroll-dur', `${Math.max(3, Math.abs(dist) / 75)}s`);
      inner.classList.add('amai-marquee');
    } else {
      inner.classList.remove('amai-marquee');
      inner.style.removeProperty('--scroll-dist');
      inner.style.removeProperty('--scroll-dur');
    }
  });

  if (inner.animate) {
    inner.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 300, easing: 'ease-in-out' },
    );
  }
}

/**
 * Restores the native controls and hides the overlay. Called on every tick the
 * consumer is idle (disabled, on the lyrics page, or paused) and on teardown.
 */
function clearPlaybarOverlay(): void {
  if (lyricsElement && centerWrapper) {
    centerWrapper.classList.remove('amai-hide-controls');
    if (lyricsElement.innerHTML !== '') {
      lyricsElement.innerHTML = '';
      lastText = '';
    }
  }
}

/**
 * Renders the active line for `position`. The cadence, play-state self-heal,
 * lyrics-page gate, position refcount, and the finite position guard are owned
 * by the PositionConsumer seam; this is the per-position work only.
 */
function renderPlaybarLine(position: number): void {
  // Re-inject if Spotify re-rendered the playbar and removed our element — only when we actually need to show lyrics
  if (
    !lyricsElement ||
    !lyricsElement.isConnected ||
    !centerWrapper ||
    !centerWrapper.isConnected
  ) {
    const controls = document.querySelector<HTMLElement>('.Root__now-playing-bar .player-controls');
    if (controls?.parentElement) {
      inject();
    } else {
      return;
    }
  }
  if (!lyricsElement || !centerWrapper) return;

  const rawKey = inMemoryLyricsData;
  let lines: LineEntry[] | null;
  if (rawKey != null && rawKey === cachedLinesRaw) {
    lines = cachedLines;
  } else {
    cachedLinesRaw = rawKey;
    lines = getLinesFromStorage(inMemoryLyricsData ?? undefined);
    cachedLines = lines;
  }
  if (!lines) {
    clearPlaybarOverlay();
    return;
  }

  // Binary search — lines are sorted by StartTime
  const activeIdx = findActiveIndex(lines, position);
  const active = activeIdx === -1 ? null : lines[activeIdx]!;

  if (!active) {
    clearPlaybarOverlay();
    return;
  }

  // Active line found -> hide native controls, show lyrics
  centerWrapper.classList.add('amai-hide-controls');

  if (active.text !== lastText) {
    lastText = active.text;
    // enable_romaji changes only via settings UI; reading here is per-lyric (every few seconds), not per-tick, so direct read is fine.
    const enableRomaji = storage.get('enable_romaji') === 'true';
    setLyricsText(processPhoneticText(active.text, enableRomaji));
  }
}

function inject(): void {
  const bar = document.querySelector<HTMLElement>('.Root__now-playing-bar');
  if (!bar) return;

  const controls = bar.querySelector<HTMLElement>('.player-controls');
  const wrapper = controls?.parentElement ?? null;
  if (!wrapper) return;

  centerWrapper = wrapper;
  wrapper.classList.add('amai-playbar-host');

  lastText = '';
  lyricsElement = document.createElement('div');
  lyricsElement.className = 'amai-playbar-lyrics';
  lyricsElement.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(lyricsElement);

  positionLyrics();

  // Keep the overlay aligned with the controls if the layout changes
  resizeObserver?.disconnect();
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => positionLyrics());
    resizeObserver.observe(wrapper);
    const seek = wrapper.querySelector<HTMLElement>('.playback-bar');
    if (seek) resizeObserver.observe(seek);
  }
}

function cleanup(): void {
  positionConsumerDisposer?.();
  positionConsumerDisposer = null;
  clearPlaybarOverlay();
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener('resize', positionLyrics);
  Spicetify.Player.removeEventListener('songchange', onSongChange);
  if (lyricsDataListenerId != null) {
    Event.unListen(lyricsDataListenerId);
    lyricsDataListenerId = null;
  }
  if (lyricsElement && lyricsElement.parentElement) {
    lyricsElement.parentElement.classList.remove('amai-hide-controls');
    lyricsElement.parentElement.classList.remove('amai-playbar-host');
    lyricsElement.remove();
  }
  lyricsElement = null;
  centerWrapper = null;
  lastText = '';
}

/**
 * Initializes the playbar lyrics overlay once the native playbar exists.
 */
export function InitializePlaybarLyrics(): void {
  initWhen = Whentil.When(
    () => document.querySelector('.Root__now-playing-bar .player-controls'),
    () => {
      window.addEventListener('resize', positionLyrics);
      Spicetify.Player.addEventListener('songchange', onSongChange);

      // Listen for in-memory lyrics data updates from AI enhancements — avoids
      // reading localStorage every tick in the update loop.
      lyricsDataListenerId = Event.listen('lyrics:data-updated', (data: unknown) => {
        inMemoryLyricsData = typeof data === 'string' ? data : null;
        cachedLines = null;
        cachedLinesRaw = null;
      });

      inject();
      // Prime from the persisted snapshot: the startup fetch may have already
      // published before this listener attached (init order), in which case
      // the bus event was missed and inMemory would stay null until the next
      // songchange. A stale prime is harmless — the next publish overwrites it.
      try {
        inMemoryLyricsData = storage.get('currentLyricsData');
      } catch {
        inMemoryLyricsData = null;
      }
      cachedLines = null;
      cachedLinesRaw = null;
      positionConsumerDisposer = registerPositionConsumer({
        surface: 'playbar',
        intervalSeconds: UPDATE_INTERVAL,
        // The overlay only renders while enabled, playing, and the lyrics page
        // is not occupying the screen.
        enabled: (ctx) => isEnabled() && !ctx.onLyricsPage && ctx.isPlaying,
        wantsTracking: (ctx) => isEnabled() && !ctx.onLyricsPage && ctx.isPlaying,
        onPosition: (position) => renderPlaybarLine(position),
        onIdle: () => clearPlaybarOverlay(),
      });
    },
  );

  // Register teardown so re-init stops the loop, removes listeners, and
  // disconnects the observer instead of leaving them running forever.
  lifecycle.trackCallback(cleanup);
  lifecycle.trackWhentil(initWhen);
}

export default InitializePlaybarLyrics;
