import storage from '../../utils/storage';
import { IntervalManager } from '../../utils/IntervalManager';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { processPhoneticText } from '../../utils/Lyrics/processing';
import { convertLyrics } from '../../utils/Lyrics/conversion';
import Whentil from '../../utils/Whentil';
import lifecycle from '../../utils/lifecycle';
import extractArtworkColors from '../../utils/ArtworkColors';
import Event from '../../utils/EventManager';

/**
 * Shows the currently active lyric line inside Spotify's native bottom playbar,
 * replacing the center playback controls. Hovering the control area reveals the
 * native controls again.
 */

// Matches the offset used by ScrollToActiveLine for consistency
const POSITION_OFFSET = 600; // ms — show the line a bit ahead of the audio
const UPDATE_INTERVAL = 0.3; // seconds

interface LineEntry {
  text: string;
  startTime: number; // ms
  endTime: number; // ms
}

let lyricsElement: HTMLElement | null = null;
let centerWrapper: HTMLElement | null = null;
let intervalManager: IntervalManager | null = null;
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

// ---- Artwork color animation state ----
let currentColors: string[] = [];
let lastArtworkUrl = '';
let artworkColorDebounceTimer: number | null = null;

// Minimum perceived brightness (0-255) for artwork colours used in text.
// Colours darker than this get lightened so the lyrics stay readable against
// Spotify's dark playbar background.
const MIN_TEXT_COLOR_LUMINANCE = 140;

/**
 * Perceived sRGB luminance of a hex colour (0-255 scale).
 */
function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Lightens a hex colour by mixing it with white until its perceived luminance
 * reaches `minLum`.  Returns the adjusted hex string.
 */
function liftToLuminance(hex: string, minLum: number): string {
  if (hexLuminance(hex) >= minLum) return hex;

  const clean = hex.replace('#', '');
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);

  // Linearly interpolate toward white (255,255,255) until luminance is adequate
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const nr = Math.round(r + (255 - r) * t);
    const ng = Math.round(g + (255 - g) * t);
    const nb = Math.round(b + (255 - b) * t);
    if (
      hexLuminance(
        `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`,
      ) >= minLum
    ) {
      r = nr;
      g = ng;
      b = nb;
      break;
    }
  }

  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isEnabled(): boolean {
  return storage.get('enable_playbar_lyrics') !== 'false';
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
      startTime: item.StartTime * 1000,
      endTime: item.EndTime * 1000,
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
  inMemoryLyricsData = storage.get('currentLyricsData');
  currentColors = [];
  lastArtworkUrl = '';
  if (lyricsElement) {
    lyricsElement.innerHTML = '';
    applyArtworkColors([]);
  }
  // Debounce artwork color extraction — when rapidly skipping tracks, only
  // the final song's artwork is processed, avoiding wasted fetch + CPU work.
  if (artworkColorDebounceTimer !== null) clearTimeout(artworkColorDebounceTimer);
  artworkColorDebounceTimer = window.setTimeout(() => {
    artworkColorDebounceTimer = null;
    refreshArtworkColors();
  }, 500);
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

  inner.innerHTML = html;

  requestAnimationFrame(() => {
    const cw = lyricsElement!.clientWidth;
    if (inner.scrollWidth > cw) {
      const dist = cw - inner.scrollWidth - 20;
      inner.style.setProperty('--scroll-dist', `${dist}px`);
      inner.style.setProperty('--scroll-dur', `${Math.max(6, Math.abs(dist) / 30)}s`);
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
 * Applies artwork-derived colors as CSS custom properties on the lyrics
 * element so the CSS animation can use them for a shifting text gradient.
 */
function applyArtworkColors(colors: string[]): void {
  if (!lyricsElement) return;

  if (!colors.length) {
    lyricsElement.style.removeProperty('--color-1');
    lyricsElement.style.removeProperty('--color-2');
    lyricsElement.style.removeProperty('--color-3');
    lyricsElement.style.removeProperty('--color-4');
    lyricsElement.style.removeProperty('--color-5');
    return;
  }

  // Boost dim colours so text stays readable against the dark playbar.
  // This preserves hue/saturation character while guaranteeing legibility.
  const boosted = colors.map((c) => liftToLuminance(c, MIN_TEXT_COLOR_LUMINANCE));

  // Pad with repeats if fewer than 5 colours were extracted
  const padded = [...boosted];
  while (padded.length < 5) {
    padded.push(padded[padded.length % padded.length]);
  }

  lyricsElement.style.setProperty('--color-1', padded[0]);
  lyricsElement.style.setProperty('--color-2', padded[1]);
  lyricsElement.style.setProperty('--color-3', padded[2]);
  lyricsElement.style.setProperty('--color-4', padded[3]);
  lyricsElement.style.setProperty('--color-5', padded[4]);
}

/**
 * Extracts colors from the current artwork URL and applies them.
 *
 * Uses the same artwork-resolving logic as ApplyDynamicBackground so we
 * get a real HTTP URL (not a spotify:image: URI) that can be loaded onto
 * a canvas for pixel sampling.
 */
async function refreshArtworkColors(): Promise<void> {
  // Resolve artwork URL the same way the dynamic background does
  let artworkUrl = await SpotifyPlayer.Artwork.Get('d');
  if (!artworkUrl) {
    applyArtworkColors([]);
    return;
  }
  if (artworkUrl.startsWith('spotify:image:')) {
    const imageId = artworkUrl.replace('spotify:image:', '');
    artworkUrl = `https://i.scdn.co/image/${imageId}`;
  }
  if (artworkUrl === lastArtworkUrl && currentColors.length > 0) {
    return; // already up-to-date
  }
  lastArtworkUrl = artworkUrl;

  const colors = await extractArtworkColors(artworkUrl);
  currentColors = colors;
  applyArtworkColors(colors);
}

function update(): void {
  // Re-inject if Spotify re-rendered the playbar and removed our element
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

  const enabled = isEnabled();
  const onLyricsPage = Spicetify.Platform.History.location.pathname === '/AmaiLyrics';
  const isPaused = !SpotifyPlayer.IsPlaying;

  // Disabled, viewing the lyrics page, or paused -> restore native controls, hide overlay
  if (!enabled || onLyricsPage || isPaused) {
    centerWrapper.classList.remove('amai-hide-controls');
    lyricsElement.innerHTML = '';
    lastText = '';
    return;
  }

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
    centerWrapper.classList.remove('amai-hide-controls');
    if (lastText !== '') {
      lyricsElement.innerHTML = '';
      lastText = '';
    }
    return;
  }

  const position = SpotifyPlayer.GetTrackPosition() + POSITION_OFFSET;

  let active: LineEntry | null = null;
  for (const line of lines) {
    if (line.startTime <= position && line.endTime >= position) {
      active = line;
      break;
    }
  }

  if (!active) {
    centerWrapper.classList.remove('amai-hide-controls');
    if (lastText !== '') {
      lyricsElement.innerHTML = '';
      lastText = '';
    }
    return;
  }

  // Active line found -> hide native controls, show lyrics
  centerWrapper.classList.add('amai-hide-controls');

  if (active.text !== lastText) {
    lastText = active.text;
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

  // Fetch and apply artwork colors for the initial track
  refreshArtworkColors();
}

function cleanup(): void {
  intervalManager?.Stop();
  intervalManager = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener('resize', positionLyrics);
  Spicetify.Player.removeEventListener('songchange', onSongChange);
  if (artworkColorDebounceTimer !== null) {
    clearTimeout(artworkColorDebounceTimer);
    artworkColorDebounceTimer = null;
  }
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
      intervalManager = new IntervalManager(UPDATE_INTERVAL, update);
      intervalManager.Start();
    },
  );

  // Register teardown so re-init stops the loop, removes listeners, and
  // disconnects the observer instead of leaving them running forever.
  lifecycle.trackCallback(cleanup);
  lifecycle.trackWhentil(initWhen);
}

export default InitializePlaybarLyrics;
