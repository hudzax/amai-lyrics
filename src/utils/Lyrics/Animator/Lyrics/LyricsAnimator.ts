import Defaults from '../../../../components/Global/Defaults';
import { SpotifyPlayer } from '../../../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../../lyrics';
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
const applyBlur = (
  arr: Array<{ Status: string; HTMLElement: HTMLElement }>,
  activeIndex: number,
  BlurMultiplier: number,
) => {
  const isPlaying = SpotifyPlayer.IsPlaying;
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
  // If no prior blur (first frame), still need to initialize far lines once.
  // We do full pass once; afterwards windowed updates keep far lines stable at 5px.
  const isFirstBlur = lastBlurActiveIndex == null;
  lastBlurActiveIndex = activeIndex;
  if (isFirstBlur) {
    for (let i = 0; i < arr.length; i++) {
      const distance = Math.abs(i - activeIndex);
      const blurAmountRaw = BlurMultiplier * distance;
      const blurAmount = blurAmountRaw >= 5 ? 5 : blurAmountRaw;
      const blurValue = isPlaying && arr[i]!.Status !== 'Active' ? `${blurAmount}px` : `0px`;
      setStyleIfChanged(arr[i]!.HTMLElement, '--BlurAmount', blurValue);
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
      const blurValue = isPlaying && arr[i]!.Status !== 'Active' ? `${blurAmount}px` : `0px`;
      setStyleIfChanged(arr[i]!.HTMLElement, '--BlurAmount', blurValue);
    }
  }
  // Paused state needs all active-cluster lines at 0px — window already covers it.
  // If activeIndex === lastBlurActiveIndex and isPlaying unchanged, setStyleIfChanged short-circuits.
};

export function resetAnimatorCache(): void {
  lastBlurActiveIndex = null;
}

// Dot-state helpers — used by the Line path's musical-break dot groups
function activateDot(word) {
  if (!word.HTMLElement.classList.contains('dot-active')) {
    const dotDuration = word.EndTime - word.StartTime;
    word.HTMLElement.style.setProperty('--dot-duration', `${dotDuration}ms`);
    void word.HTMLElement.offsetWidth;
    word.HTMLElement.classList.add('dot-active');
  }
  word.scale = 1;
  word.glow = 0.5;
}

function resetDotNotSung(word) {
  word.HTMLElement.classList.remove('dot-active');
  setStyleIfChanged(word.HTMLElement, 'transform', '');
  setStyleIfChanged(word.HTMLElement, 'scale', '');
  setStyleIfChanged(word.HTMLElement, 'opacity', '');
  setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', '');
  setStyleIfChanged(word.HTMLElement, '--text-shadow-opacity', '');
  word.translateY = 0.01;
  word.scale = 0.75;
  word.glow = 0;
}

function resetDotSung(word) {
  word.HTMLElement.classList.remove('dot-active');
  setStyleIfChanged(word.HTMLElement, 'transform', 'translateY(calc(var(--font-size) * 0))');
  setStyleIfChanged(word.HTMLElement, 'scale', '1.2');
  setStyleIfChanged(word.HTMLElement, 'opacity', '1');
  setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', '12px');
  setStyleIfChanged(word.HTMLElement, '--text-shadow-opacity', '50%');
  word.scale = 1.2;
  word.glow = 0.5;
}

function animateLineLines(
  arr: Array<{
    Status: string;
    lastStatus?: string;
    HTMLElement: HTMLElement;
    DotLine?: boolean;
    Syllables?: {
      Lead: Array<{ Status: string; HTMLElement: HTMLElement; StartTime: number; EndTime: number }>;
    };
  }>,
) {
  // Fast path: if TimeSetter's cached active index matches current Active, only that window can have changed.
  // Fall back to scanning delta range derived from Status flips.
  const cachedActive = getActiveLineIndex();
  const activeIndex =
    cachedActive !== -1 ? cachedActive : arr.findIndex((l) => l.Status === 'Active');

  // Apply blur only when active changed — TimeSetter guarantees at most one Active.
  if (activeIndex !== -1) {
    if (SpotifyPlayer.IsPlaying !== lastIsPlaying) {
      Blurring_LastLine = null;
      lastIsPlaying = SpotifyPlayer.IsPlaying;
    }
    if (Blurring_LastLine !== activeIndex) {
      applyBlur(arr as never, activeIndex, BlurMultiplier);
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
    if (prevStatus === line.Status && line.Status !== 'Active') continue;
    if (line.Status === 'Active') {
      line.HTMLElement.classList.add('Active');
      line.HTMLElement.classList.remove('NotSung', 'OverridenByScroller', 'Sung');
      if (line.DotLine) {
        const dots = line.Syllables!.Lead;
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i]!;
          if (dot.Status === 'Active') activateDot(dot as never);
          else if (dot.Status === 'NotSung') resetDotNotSung(dot as never);
          else if (dot.Status === 'Sung') resetDotSung(dot as never);
        }
      } else {
        setStyleIfChanged(line.HTMLElement, '--gradient-position', `100%`);
      }
    } else if (line.Status === 'NotSung') {
      if (prevStatus !== 'NotSung') {
        line.HTMLElement.classList.add('NotSung');
        line.HTMLElement.classList.remove('Sung');
        if (
          line.HTMLElement.classList.contains('Active') &&
          !line.HTMLElement.classList.contains('OverridenByScroller')
        )
          line.HTMLElement.classList.remove('Active');
        setStyleIfChanged(line.HTMLElement, '--gradient-position', `0%`);
      }
    } else if (line.Status === 'Sung') {
      if (prevStatus !== 'Sung') {
        line.HTMLElement.classList.add('Sung');
        line.HTMLElement.classList.remove('Active', 'NotSung');
        setStyleIfChanged(line.HTMLElement, '--gradient-position', `100%`);
      }
    }
    line.lastStatus = line.Status;
  }
}

export function Animate() {
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  if (!CurrentLyricsType || CurrentLyricsType === 'None') return;

  if (CurrentLyricsType === 'Line') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    animateLineLines(LyricsObject.Types.Line.Lines as any[]);
  }
}
