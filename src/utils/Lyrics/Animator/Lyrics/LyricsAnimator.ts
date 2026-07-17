import Defaults from '../../../../components/Global/Defaults';
import { SpotifyPlayer } from '../../../../components/Global/SpotifyPlayer';
import { LyricsObject, Word } from '../../lyrics';
import { BlurMultiplier, IdleEmphasisLyricsScale, IdleLyricsScale, timeOffset } from '../Shared';

export let Blurring_LastLine = null;
let lastIsPlaying: boolean | null = null;

export function setBlurringLastLine(c) {
  Blurring_LastLine = c;
}

// Cache the Credits element to avoid re-querying the DOM on every animation frame
let cachedCredits: HTMLElement | null = null;
function getCredits(): HTMLElement | null {
  if (cachedCredits && cachedCredits.isConnected) return cachedCredits;
  cachedCredits = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits',
  );
  return cachedCredits;
}

// Helper: Set style property only if changed
const setStyleIfChanged = (element: HTMLElement, property: string, value: string) => {
  if (element.style.getPropertyValue(property) !== value) {
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

// Helper: Calculate opacity based on progress percentage
const calculateOpacity = (percentage: number, word: Word): number => {
  if (word?.BGWord) return 0;
  if (percentage <= 0.5) {
    return percentage * 100;
  } else {
    return (1 - percentage) * 100;
  }
};

// Helper: Reset letter styles for NotSung/Sung
function resetLetterStyles(letter, status, scaleValue, gradientPosition) {
  if (status === 'NotSung') {
    setStyleIfChanged(
      letter.HTMLElement,
      'transform',
      'translateY(calc(var(--DefaultLyricsSize) * 0.02))',
    );
    setStyleIfChanged(letter.HTMLElement, 'scale', scaleValue);
    setStyleIfChanged(letter.HTMLElement, '--text-shadow-blur-radius', '4px');
    setStyleIfChanged(letter.HTMLElement, '--text-shadow-opacity', '0%');
    setStyleIfChanged(letter.HTMLElement, '--gradient-position', gradientPosition);
  } else if (status === 'Sung') {
    setStyleIfChanged(
      letter.HTMLElement,
      'transform',
      `translateY(calc(var(--DefaultLyricsSize) * 0))`,
    );
    setStyleIfChanged(letter.HTMLElement, 'scale', '1');
    setStyleIfChanged(letter.HTMLElement, '--text-shadow-blur-radius', '4px');
    setStyleIfChanged(letter.HTMLElement, '--text-shadow-opacity', '0%');
    setStyleIfChanged(letter.HTMLElement, '--gradient-position', gradientPosition);
  }
}

// Helper: Animate word styles (non-dot, non-letterGroup)
function animateWord(
  word,
  totalDuration,
  percentage,
  gradientPosition,
  translateY,
  scale,
  blurRadius,
  textShadowOpacity,
) {
  setStyleIfChanged(word.HTMLElement, '--gradient-position', `${gradientPosition}%`);
  if (totalDuration > 230) {
    setStyleIfChanged(
      word.HTMLElement,
      'transform',
      `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`,
    );
    setStyleIfChanged(word.HTMLElement, 'scale', `${scale}`);
    setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', `${blurRadius}px`);
    setStyleIfChanged(word.HTMLElement, '--text-shadow-opacity', `${textShadowOpacity}%`);
    word.scale = scale;
    word.glow = textShadowOpacity / 100;
    word.translateY = translateY;
  } else {
    const blurRadiusShort = 4 + (0 - 4) * percentage;
    const textShadowOpacityShort = 0;
    const translateYShort = 0.01 + (0 - 0.01) * percentage;
    const scaleShort = IdleLyricsScale + (1 - IdleLyricsScale) * percentage;
    setStyleIfChanged(
      word.HTMLElement,
      'transform',
      `translateY(calc(var(--DefaultLyricsSize) * ${translateYShort}))`,
    );
    setStyleIfChanged(word.HTMLElement, 'scale', `${scaleShort}`);
    setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', `${blurRadiusShort}px`);
    setStyleIfChanged(word.HTMLElement, '--text-shadow-opacity', `${textShadowOpacityShort}%`);
    word.scale = scaleShort;
    word.glow = textShadowOpacityShort;
    word.translateY = 0;
  }
}

// Helper: Reset word animation tracking
function resetWordAnimationTracking(word) {
  word.AnimatorStoreTime_glow = undefined;
  word.AnimatorStoreTime_translateY = undefined;
  word.AnimatorStoreTime_scale = undefined;
}

export function Animate(position) {
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  const edtrackpos = position + timeOffset;
  if (!CurrentLyricsType || CurrentLyricsType === 'None') return;

  const Credits = getCredits();

  const SKIP_IF_STATUS_UNCHANGED = true;

  if (CurrentLyricsType === 'Syllable') {
    const arr = LyricsObject.Types.Syllable.Lines;
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
        line.HTMLElement.classList.remove('NotSung', 'Sung', 'OverridenByScroller');
        const words = line.Syllables.Lead;
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
          const word = words[wordIndex];
          const isLetterGroup = word?.LetterGroup;
          const isDot = word?.Dot;
          if (word.Status === 'Active') {
            const totalDuration = word.EndTime - word.StartTime;
            const elapsedDuration = edtrackpos - word.StartTime;
            const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1));
            const blurRadius = 4 + (16 - 4) * percentage;
            const textShadowOpacity = calculateOpacity(percentage, word) * 0.4;
            const translateY = 0.01 + (-0.038 - 0.01) * percentage;
            const scale = IdleLyricsScale + (1.017 - IdleLyricsScale) * percentage;
            const gradientPosition = percentage * 100;
            if (isLetterGroup) {
              const emphasisTranslateY = 0.02 + (-0.065 - 0.02) * percentage;
              const emphasisScale =
                IdleEmphasisLyricsScale + (1.023 - IdleEmphasisLyricsScale) * percentage;
              for (let k = 0; k < word.Letters.length; k++) {
                const letter = word.Letters[k];
                if (letter.Status === 'Active') {
                  resetLetterStyles(letter, 'NotSung', IdleEmphasisLyricsScale, '-20%');
                } else if (letter.Status === 'Sung') {
                  resetLetterStyles(word.Letters[k], 'Sung', '1', '100%');
                }
              }
              setStyleIfChanged(word.HTMLElement, 'scale', `${emphasisScale}`);
              setStyleIfChanged(
                word.HTMLElement,
                'transform',
                `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`,
              );
              word.scale = emphasisScale;
              word.glow = 0;
            } else if (isDot) {
              if (!word.HTMLElement.classList.contains('dot-active')) {
                const dotDuration = word.EndTime - word.StartTime;
                word.HTMLElement.style.setProperty('--dot-duration', `${dotDuration}ms`);
                void word.HTMLElement.offsetWidth;
                word.HTMLElement.classList.add('dot-active');
              }
              word.scale = 1;
              word.glow = 0.5;
            } else {
              animateWord(
                word,
                totalDuration,
                percentage,
                gradientPosition,
                translateY,
                scale,
                blurRadius,
                textShadowOpacity,
              );
              resetWordAnimationTracking(word);
            }
          } else if (word.Status === 'NotSung') {
            if (isLetterGroup) {
              for (let k = 0; k < word.Letters.length; k++) {
                resetLetterStyles(word.Letters[k], 'NotSung', IdleEmphasisLyricsScale, '-20%');
              }
              setStyleIfChanged(
                word.HTMLElement,
                'transform',
                'translateY(calc(var(--DefaultLyricsSize) * 0.02))',
              );
              word.translateY = 0.02;
            } else if (!isDot) {
              setStyleIfChanged(
                word.HTMLElement,
                'transform',
                'translateY(calc(var(--DefaultLyricsSize) * 0.01))',
              );
              word.translateY = 0.01;
            }
            if (isDot) {
              word.HTMLElement.classList.remove('dot-active');
              word.HTMLElement.style.transform = '';
              word.HTMLElement.style.scale = '';
              word.HTMLElement.style.opacity = '';
              word.HTMLElement.style.setProperty('--text-shadow-blur-radius', '');
              word.HTMLElement.style.setProperty('--text-shadow-opacity', '');
              word.translateY = 0.01;
              word.scale = 0.75;
              word.glow = 0;
            } else {
              setStyleIfChanged(
                word.HTMLElement,
                'scale',
                `${isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale}`,
              );
              word.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
              setStyleIfChanged(word.HTMLElement, '--gradient-position', '-20%');
            }
            resetWordAnimationTracking(word);
            setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', '4px');
            setStyleIfChanged(word.HTMLElement, '--text-shadow-opacity', '0%');
            word.glow = 0;
          } else if (word.Status === 'Sung') {
            if (isLetterGroup) {
              for (let k = 0; k < word.Letters.length; k++) {
                resetLetterStyles(word.Letters[k], 'Sung', '1', '100%');
              }
              setStyleIfChanged(
                word.HTMLElement,
                'transform',
                `translateY(calc(var(--DefaultLyricsSize) * 0))`,
              );
              setStyleIfChanged(word.HTMLElement, 'scale', '1');
            }
            if (isDot) {
              word.HTMLElement.classList.remove('dot-active');
              word.HTMLElement.style.transform = 'translateY(calc(var(--font-size) * 0))';
              word.HTMLElement.style.scale = '1.2';
              word.HTMLElement.style.opacity = '1';
              word.HTMLElement.style.setProperty('--text-shadow-blur-radius', '12px');
              word.HTMLElement.style.setProperty('--text-shadow-opacity', '50%');
              word.scale = 1.2;
              word.glow = 0.5;
            } else if (!isLetterGroup) {
              setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', '4px');
              const element = word.HTMLElement;
              const currentTranslateY = word.translateY;
              const currentScale = word.scale;
              const currentGlow = word.glow;
              if (!word.AnimatorStoreTime_translateY)
                word.AnimatorStoreTime_translateY = performance.now();
              if (!word.AnimatorStoreTime_scale) word.AnimatorStoreTime_scale = performance.now();
              if (!word.AnimatorStoreTime_glow) word.AnimatorStoreTime_glow = performance.now();
              const now = performance.now();
              const elapsed_translateY = now - word.AnimatorStoreTime_translateY;
              const elapsed_scale = now - word.AnimatorStoreTime_scale;
              const elapsed_glow = now - word.AnimatorStoreTime_glow;
              const duration_translateY = 550;
              const progress_translateY = Math.min(elapsed_translateY / duration_translateY, 1);
              const duration_scale = 1100;
              const progress_scale = Math.min(elapsed_scale / duration_scale, 1);
              const duration_glow = 250;
              const progress_glow = Math.min(elapsed_glow / duration_glow, 1);
              const targetTranslateY = 0.0005;
              const targetScale = 1;
              const targetGlow = 0;
              const interpolate = (start: number, end: number, progress) =>
                start + (end - start) * progress;
              const newTranslateY = interpolate(
                currentTranslateY,
                targetTranslateY,
                progress_translateY,
              );
              const newScale = interpolate(currentScale, targetScale, progress_scale);
              const newGlow = interpolate(currentGlow, targetGlow, progress_glow);
              setStyleIfChanged(element, '--text-shadow-opacity', `${newGlow * 100}%`);
              setStyleIfChanged(
                element,
                'transform',
                `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`,
              );
              setStyleIfChanged(element, 'scale', `${newScale}`);
              if (progress_glow === 1) {
                word.AnimatorStoreTime_glow = undefined;
                word.glow = 0;
              }
              if (progress_translateY === 1) {
                word.AnimatorStoreTime_translateY = undefined;
                word.translateY = 0;
              }
              if (progress_scale === 1) {
                word.AnimatorStoreTime_scale = undefined;
                word.scale = 1;
              }
            }
            setStyleIfChanged(word.HTMLElement, '--gradient-position', '100%');
          }
        }
        if (Credits) Credits.classList.remove('Active');
      } else if (line.Status === 'NotSung') {
        if (!SKIP_IF_STATUS_UNCHANGED || prevStatus !== 'NotSung') {
          line.HTMLElement.classList.add('NotSung');
          line.HTMLElement.classList.remove('Sung');
          if (
            line.HTMLElement.classList.contains('Active') &&
            !line.HTMLElement.classList.contains('OverridenByScroller')
          ) {
            line.HTMLElement.classList.remove('Active');
          }
        }
      } else if (line.Status === 'Sung') {
        if (!SKIP_IF_STATUS_UNCHANGED || prevStatus !== 'Sung') {
          line.HTMLElement.classList.add('Sung');
          line.HTMLElement.classList.remove('Active', 'NotSung');
          if (arr.length === index + 1 && Credits) {
            Credits.classList.add('Active');
          }
        }
      }
      line.lastStatus = line.Status;
    }
  } else if (CurrentLyricsType === 'Line') {
    const arr = LyricsObject.Types.Line.Lines;
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
        const percentage = 1;
        if (line.DotLine) {
          const Array = line.Syllables.Lead;
          for (let i = 0; i < Array.length; i++) {
            const dot = Array[i];
            if (dot.Status === 'Active') {
              if (!dot.HTMLElement.classList.contains('dot-active')) {
                const dotDuration = dot.EndTime - dot.StartTime;
                dot.HTMLElement.style.setProperty('--dot-duration', `${dotDuration}ms`);
                void dot.HTMLElement.offsetWidth;
                dot.HTMLElement.classList.add('dot-active');
              }
            } else if (dot.Status === 'NotSung') {
              dot.HTMLElement.classList.remove('dot-active');
              dot.HTMLElement.style.transform = '';
              dot.HTMLElement.style.scale = '';
              dot.HTMLElement.style.opacity = '';
              dot.HTMLElement.style.setProperty('--text-shadow-blur-radius', '');
              dot.HTMLElement.style.setProperty('--text-shadow-opacity', '');
            } else if (dot.Status === 'Sung') {
              dot.HTMLElement.classList.remove('dot-active');
              dot.HTMLElement.style.transform = 'translateY(calc(var(--font-size) * 0))';
              dot.HTMLElement.style.scale = '1.2';
              dot.HTMLElement.style.opacity = '1';
              dot.HTMLElement.style.setProperty('--text-shadow-blur-radius', '12px');
              dot.HTMLElement.style.setProperty('--text-shadow-opacity', '50%');
            }
          }
        } else {
          line.HTMLElement.style.setProperty('--gradient-position', `${percentage * 100}%`);
        }
      } else if (line.Status === 'NotSung') {
        if (!SKIP_IF_STATUS_UNCHANGED || prevStatus !== 'NotSung') {
          line.HTMLElement.classList.add('NotSung');
          line.HTMLElement.classList.remove('Sung');
          if (
            line.HTMLElement.classList.contains('Active') &&
            !line.HTMLElement.classList.contains('OverridenByScroller')
          ) {
            line.HTMLElement.classList.remove('Active');
          }
          line.HTMLElement.style.setProperty('--gradient-position', `0%`);
        }
      } else if (line.Status === 'Sung') {
        if (!SKIP_IF_STATUS_UNCHANGED || prevStatus !== 'Sung') {
          line.HTMLElement.classList.add('Sung');
          line.HTMLElement.classList.remove('Active', 'NotSung');
          line.HTMLElement.style.setProperty('--gradient-position', `100%`);
        }
      }
      line.lastStatus = line.Status;
    }
  }
}
