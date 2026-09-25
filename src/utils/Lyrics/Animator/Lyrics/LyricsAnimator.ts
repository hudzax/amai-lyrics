import Defaults from '../../../../components/Global/Defaults';
import { SpotifyPlayer } from '../../../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../../lyrics';
import type { PaintedDot, PaintedLine } from '../../lyrics';
import { BlurMultiplier } from '../Shared';
import { getActiveLineIndex } from './LyricsSetter';

export let Blurring_LastLine = null;
let lastIsPlaying: boolean | null = null;

export function setBlurringLastLine(c) {
  Blurring_LastLine = c;
}

// Cache of the last value we wrote per (element, property) so we can skip
// unchanged style writes without reading `element.style.getPropertyValue()`.
// Reading inline style on the hot path forces style resolution and, interleaved
// with the many per-frame writes, can trigger recalculation. The WeakMap keys
// are the lyric DOM nodes themselves, so stale entries are garbage-collected
// whenever a song's lyrics are re-created. This animator is the sole writer of
// the custom properties it tracks (gradients, transforms, scales, shadows).
const styleWriteCache = new WeakMap<HTMLElement, Map<string, string>>();

const setStyleIfChanged = (element: HTMLElement, property: string, value: string) => {
  let props = styleWriteCache.get(element);
  if (!props) {
    props = new Map();
    styleWriteCache.set(element, props);
  }
  if (props.get(property) !== value) {
    props.set(property, value);
    element.style.setProperty(property, value);
  }
};

// Helper: Apply blur to lines — only lines within blur radius can change value.
// Far lines clamp at 5px, so they never change after the first active.
const MAX_BLUR_DISTANCE = 6;
let lastBlurActiveIndex: number | null = null;
// Tracks the play state the blur values were last written under. Pausing must
// unblur the WHOLE lyrics (not just the window around the active line), and
// resuming must re-blur everything — both are full passes, not windowed ones.
let lastBlurIsPlaying: boolean | null = null;
const applyBlur = (arr: PaintedLine[], activeIndex: number, BlurMultiplier: number) => {
  const isPlaying = SpotifyPlayer.IsPlaying;
  const playStateChanged = isPlaying !== lastBlurIsPlaying;
  lastBlurIsPlaying = isPlaying;
  // On sequential ticks (active+1), only the 2 windows around old/new can change.
  // For a large jump (seek), windows may not overlap — iterate union of both.
  const windows: Array<{ lo: number; hi: number }> = [];
  const pushWindow = (center: number | null) => {
    if (center == null || center < 0) return;
    const lo = Math.max(0, center - MAX_BLUR_DISTANCE);
    const hi = Math.min(arr.length - 1, center + MAX_BLUR_DISTANCE);
    windows.push({ lo, hi });
  };
  pushWindow(activeIndex);
  pushWindow(lastBlurActiveIndex);
  // If no prior blur (first frame) or the play state just flipped (pause/play),
  // do a full pass — windowed updates would leave far lines stale (e.g. still
  // blurred after pausing). Afterwards, windowed updates keep far lines stable.
  const isFirstBlur = lastBlurActiveIndex == null || playStateChanged;
  lastBlurActiveIndex = activeIndex;
  if (isFirstBlur) {
    for (let i = 0; i < arr.length; i++) {
      const distance = Math.abs(i - activeIndex);
      const blurAmountRaw = BlurMultiplier * distance;
      const blurAmount = blurAmountRaw >= 5 ? 5 : blurAmountRaw;
      const blurValue = isPlaying && arr[i]!.status !== 'Active' ? `${blurAmount}px` : `0px`;
      setStyleIfChanged(arr[i]!.element, '--BlurAmount', blurValue);
    }
    return;
  }
  // Windowed update — far lines stay at 5px and are skipped via cache.
  // Use a Set to avoid double-visiting overlap.
  const visited = new Set<number>();
  for (const { lo, hi } of windows) {
    for (let i = lo; i <= hi; i++) {
      if (visited.has(i)) continue;
      visited.add(i);
      const distance = Math.abs(i - activeIndex);
      const blurAmountRaw = BlurMultiplier * distance;
      const blurAmount = blurAmountRaw >= 5 ? 5 : blurAmountRaw;
      const blurValue = isPlaying && arr[i]!.status !== 'Active' ? `${blurAmount}px` : `0px`;
      setStyleIfChanged(arr[i]!.element, '--BlurAmount', blurValue);
    }
  }
  // Play-state flips are handled above via a full pass, so every line gets its
  // correct --BlurAmount (0px while paused). Far lines clamp at 5px and are
  // skipped via cache; if activeIndex and isPlaying are unchanged,
  // setStyleIfChanged short-circuits.
};

export function resetAnimatorCache(): void {
  lastBlurActiveIndex = null;
}

// Dot-state helpers — instrumental pill is ambient-only (CSS-driven).
// The parent .line Active/Sung/NotSung + nth-child delays own all visuals, so
// helpers only toggle .dot-active for compat and clear stale inline styles
// that would override the ambient keyframes (transform/opacity/scale).
function clearDotInlineStyles(word: PaintedDot) {
  setStyleIfChanged(word.element, 'transform', '');
  setStyleIfChanged(word.element, 'scale', '');
  setStyleIfChanged(word.element, 'opacity', '');
  setStyleIfChanged(word.element, '--text-shadow-blur-radius', '');
  setStyleIfChanged(word.element, '--text-shadow-opacity', '');
  setStyleIfChanged(word.element, '--dot-duration', '');
}

function activateDot(word: PaintedDot) {
  if (!word.element.classList.contains('dot-active')) {
    void word.element.offsetWidth;
    word.element.classList.add('dot-active');
  }
  clearDotInlineStyles(word);
}

function resetDotNotSung(word: PaintedDot) {
  word.element.classList.remove('dot-active');
  clearDotInlineStyles(word);
}

function resetDotSung(word: PaintedDot) {
  word.element.classList.remove('dot-active');
  clearDotInlineStyles(word);
}

function animateLineLines(arr: PaintedLine[]) {
  // Fast path: if TimeSetter's cached active index matches current Active, only that window can have changed.
  // Fall back to scanning delta range derived from Status flips.
  const cachedActive = getActiveLineIndex();
  const activeIndex =
    cachedActive !== -1 ? cachedActive : arr.findIndex((l) => l.status === 'Active');

  // Apply blur only when active changed — TimeSetter guarantees at most one Active.
  if (activeIndex !== -1) {
    if (SpotifyPlayer.IsPlaying !== lastIsPlaying) {
      Blurring_LastLine = null;
      lastIsPlaying = SpotifyPlayer.IsPlaying;
    }
    if (Blurring_LastLine !== activeIndex) {
      applyBlur(arr, activeIndex, BlurMultiplier);
      Blurring_LastLine = activeIndex;
    }
  } else if (Blurring_LastLine !== null) {
    // No active (interlude) — clear blur state so next active re-initializes
    lastBlurActiveIndex = null;
    Blurring_LastLine = null;
  }

  // Only lines whose Status flipped this tick need class/gradient work.
  // TimeSetter's delta window means at most a handful flipped; we find them
  // by scanning, but we break early if we processed the active and its neighbors
  // when lastStatus check shows no change elsewhere.
  // For correctness with isPlaying toggle, we still need to visit Active line.
  for (let index = 0; index < arr.length; index++) {
    const line = arr[index]!;
    const prevStatus = line.lastStatus;
    // Skip far lines whose Status hasn't changed and isn't Active — their DOM is already correct.
    if (prevStatus === line.status && line.status !== 'Active') continue;
    if (line.status === 'Active') {
      line.element.classList.add('Active');
      line.element.classList.remove('NotSung', 'OverridenByScroller', 'Sung');
      if (line.dots) {
        for (const dot of line.dots) {
          if (dot.status === 'Active') activateDot(dot);
          else if (dot.status === 'NotSung') resetDotNotSung(dot);
          else if (dot.status === 'Sung') resetDotSung(dot);
        }
      } else {
        setStyleIfChanged(line.element, '--gradient-position', `100%`);
      }
    } else if (line.status === 'NotSung') {
      if (prevStatus !== 'NotSung') {
        line.element.classList.add('NotSung');
        line.element.classList.remove('Sung');
        if (
          line.element.classList.contains('Active') &&
          !line.element.classList.contains('OverridenByScroller')
        )
          line.element.classList.remove('Active');
        setStyleIfChanged(line.element, '--gradient-position', `0%`);
      }
    } else if (line.status === 'Sung') {
      if (prevStatus !== 'Sung') {
        line.element.classList.add('Sung');
        line.element.classList.remove('Active', 'NotSung');
        setStyleIfChanged(line.element, '--gradient-position', `100%`);
      }
    }
    line.lastStatus = line.status;
  }
}

export function Animate() {
  if (Defaults.CurrentLyricsType !== 'Line') return;
  animateLineLines(LyricsObject.Lines);
}
