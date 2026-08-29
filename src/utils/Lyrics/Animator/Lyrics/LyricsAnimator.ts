import Defaults from '../../../../components/Global/Defaults';
import { SpotifyPlayer } from '../../../../components/Global/SpotifyPlayer';
import { LyricsObject } from '../../lyrics';
import { BlurMultiplier } from '../Shared';

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

// Helper: Apply blur to lines
const applyBlur = (arr, activeIndex, BlurMultiplier) => {
  const isPlaying = SpotifyPlayer.IsPlaying;
  for (let i = 0; i < arr.length; i++) {
    const distance = Math.abs(i - activeIndex);
    const blurAmountRaw = BlurMultiplier * distance;
    const blurAmount = blurAmountRaw >= 5 ? 5 : blurAmountRaw;
    const blurValue = isPlaying && arr[i].Status !== 'Active' ? `${blurAmount}px` : `0px`;
    setStyleIfChanged(arr[i].HTMLElement, '--BlurAmount', blurValue);
  }
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateLineLines(arr: any[]) {
  for (let index = 0; index < arr.length; index++) {
    const line = arr[index];
    const prevStatus = line.lastStatus;
    if (line.Status === 'Active') {
      if (SpotifyPlayer.IsPlaying !== lastIsPlaying) {
        Blurring_LastLine = null;
        lastIsPlaying = SpotifyPlayer.IsPlaying;
      }
      if (Blurring_LastLine !== index) {
        applyBlur(arr, index, BlurMultiplier);
        Blurring_LastLine = index;
      }
      line.HTMLElement.classList.add('Active');
      line.HTMLElement.classList.remove('NotSung', 'OverridenByScroller', 'Sung');
      if (line.DotLine) {
        const dots = line.Syllables.Lead;
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          if (dot.Status === 'Active') activateDot(dot);
          else if (dot.Status === 'NotSung') resetDotNotSung(dot);
          else if (dot.Status === 'Sung') resetDotSung(dot);
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
