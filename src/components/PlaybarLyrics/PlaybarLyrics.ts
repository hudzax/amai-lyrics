import storage from '../../utils/storage';
import { IntervalManager } from '../../utils/IntervalManager';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { processPhoneticText } from '../../utils/Lyrics/processing';
import { convertLyrics } from '../../utils/Lyrics/conversion';
import Whentil from '../../utils/Whentil';

/**
 * Shows the currently active lyric line inside Spotify's native bottom playbar,
 * replacing the center playback controls. Hovering the control area reveals the
 * native controls again.
 */

// Matches the offset used by ScrollToActiveLine for consistency
const POSITION_OFFSET = 600; // ms — show the line a bit ahead of the audio
const UPDATE_INTERVAL = 0.15; // seconds

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

// Cache the parsed line list so we don't JSON.parse the full lyrics blob every tick
let cachedLines: LineEntry[] | null = null;
let cachedLinesRaw: string | null = null;

function isEnabled(): boolean {
  return storage.get('enable_playbar_lyrics') !== 'false';
}

/**
 * Reads the globally stored parsed lyrics and builds a timed line list for the
 * current track. Only timed lyrics (Line / Syllable) are supported.
 */
function getLinesFromStorage(): LineEntry[] | null {
  const raw = storage.get('currentLyricsData');
  if (!raw) return null;

  let data: any;
  try {
    data = JSON.parse(String(raw));
  } catch {
    return null;
  }
  if (!data || !data.id) return null;

  // Only show lyrics for the track that is currently playing
  const currentTrackId = Spicetify.Player.data?.item?.uri?.split(':')[2];
  if (currentTrackId !== data.id) return null;

  let content: any[] | undefined;
  if (data.Type === 'Line' && Array.isArray(data.Content)) {
    content = data.Content;
  } else if (data.Type === 'Syllable' && Array.isArray(data.Content)) {
    content = convertLyrics(data.Content);
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
  if (lyricsElement) lyricsElement.innerHTML = '';
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

function update(): void {
  // Re-inject if Spotify re-rendered the playbar and removed our element
  if (!lyricsElement || !lyricsElement.isConnected || !centerWrapper || !centerWrapper.isConnected) {
    const controls = document.querySelector<HTMLElement>(
      '.Root__now-playing-bar .player-controls',
    );
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

  const raw = storage.get('currentLyricsData');
  const rawKey = raw != null ? String(raw) : null;
  let lines: LineEntry[] | null;
  if (rawKey != null && rawKey === cachedLinesRaw) {
    lines = cachedLines;
  } else {
    cachedLinesRaw = rawKey;
    lines = getLinesFromStorage();
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
}

function cleanup(): void {
  intervalManager?.Stop();
  intervalManager = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener('resize', positionLyrics);
  Spicetify.Player.removeEventListener('songchange', onSongChange);
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
  Whentil.When(
    () => document.querySelector('.Root__now-playing-bar .player-controls'),
    () => {
      window.addEventListener('resize', positionLyrics);
      Spicetify.Player.addEventListener('songchange', onSongChange);

      inject();
      intervalManager = new IntervalManager(UPDATE_INTERVAL, update);
      intervalManager.Start();
    },
  );
}

export default InitializePlaybarLyrics;
