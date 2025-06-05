import Defaults from '../../../../components/Global/Defaults';
import { SpotifyPlayer } from '../../../../components/Global/SpotifyPlayer';
import { LyricsObject, Word } from '../../lyrics';
import { BlurMultiplier, IdleEmphasisLyricsScale, IdleLyricsScale, timeOffset } from '../Shared';

export let Blurring_LastLine = null;

export function setBlurringLastLine(c) {
  Blurring_LastLine = c;
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

// Helper: Animate letter styles
function animateLetter(
  letter,
  percentage,
  emphasisScale,
  emphasisBlurRadius,
  emphasisTextShadowOpacity,
) {
  let translateY;
  if (percentage <= 0.5) {
    translateY = -0.1 * (percentage / 0.5);
  } else {
    translateY = -0.1 + (0 - -0.1) * ((percentage - 0.5) / 0.5);
  }
  const letterGradientPosition = `${percentage * 100}%`;
  setStyleIfChanged(
    letter.HTMLElement,
    'transform',
    `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`,
  );
  setStyleIfChanged(letter.HTMLElement, 'scale', `${emphasisScale * 1.04}`);
  setStyleIfChanged(letter.HTMLElement, '--text-shadow-blur-radius', `${emphasisBlurRadius}px`);
  setStyleIfChanged(letter.HTMLElement, '--text-shadow-opacity', `${emphasisTextShadowOpacity}%`);
  setStyleIfChanged(letter.HTMLElement, '--gradient-position', letterGradientPosition);
}

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

// Helper: Animate dot styles
function animateDot(dot, percentage, blurRadius, textShadowOpacity, scale, translateY) {
  dot.HTMLElement.style.setProperty('--opacity-size', `${0.2 + percentage}`);
  dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;
  dot.HTMLElement.style.scale = `${0.2 + scale}`;
  dot.HTMLElement.style.setProperty('--text-shadow-blur-radius', `${blurRadius}px`);
  dot.HTMLElement.style.setProperty('--text-shadow-opacity', `${textShadowOpacity}%`);
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

  const Credits = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits',
  );

  if (CurrentLyricsType === 'Syllable') {
    const arr = LyricsObject.Types.Syllable.Lines;
    for (let index = 0; index < arr.length; index++) {
      const line = arr[index];
      if (line.Status === 'Active') {
        if (!SpotifyPlayer.IsPlaying) applyBlur(arr, index, BlurMultiplier);
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
              const emphasisBlurRadius = 6 + (18 - 6) * percentage;
              const emphasisTranslateY = 0.02 + (-0.065 - 0.02) * percentage;
              const emphasisScale =
                IdleEmphasisLyricsScale + (1.023 - IdleEmphasisLyricsScale) * percentage;
              const emphasisTextShadowOpacity = calculateOpacity(percentage, word) * 5;
              for (let k = 0; k < word.Letters.length; k++) {
                const letter = word.Letters[k];
                if (letter.Status === 'Active') {
                  // Animate active letter
                  const totalDuration = letter.EndTime - letter.StartTime;
                  const elapsedDuration = edtrackpos - letter.StartTime;
                  const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1));
                  animateLetter(
                    letter,
                    percentage,
                    emphasisScale,
                    emphasisBlurRadius,
                    emphasisTextShadowOpacity,
                  );
                  animateLetter(
                    letter,
                    percentage,
                    emphasisScale,
                    emphasisBlurRadius,
                    emphasisTextShadowOpacity,
                  );
                  resetLetterStyles(letter, 'NotSung', IdleEmphasisLyricsScale, '-20%');
                } else if (letter.Status === 'Sung') {
                  resetLetterStyles(letter, 'Sung', '1', '100%');
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
              let dotTranslateY;
              if (percentage <= 0) {
                dotTranslateY = -0.07 * percentage;
              } else if (percentage <= 0.88) {
                dotTranslateY = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
              } else {
                dotTranslateY = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
              }
              const dotScale = 0.75 + (1 - 0.75) * percentage;
              const dotTextShadowOpacity = calculateOpacity(percentage, word) * 1.5;
              animateDot(
                word,
                percentage,
                blurRadius,
                dotTextShadowOpacity,
                dotScale,
                dotTranslateY,
              );
              word.scale = dotScale;
              word.glow = dotTextShadowOpacity / 100;
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
              setStyleIfChanged(word.HTMLElement, '--opacity-size', `${0.2}`);
              setStyleIfChanged(
                word.HTMLElement,
                'transform',
                'translateY(calc(var(--font-size) * 0.01))',
              );
              word.translateY = 0.01;
              setStyleIfChanged(word.HTMLElement, 'scale', '0.75');
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
              setStyleIfChanged(word.HTMLElement, '--opacity-size', `${0.2 + 1}`);
              setStyleIfChanged(
                word.HTMLElement,
                'transform',
                `translateY(calc(var(--font-size) * 0))`,
              );
              setStyleIfChanged(word.HTMLElement, 'scale', '1.2');
              setStyleIfChanged(word.HTMLElement, '--text-shadow-opacity', `50%`);
              setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', `12px`);
            } else if (!isLetterGroup) {
              setStyleIfChanged(word.HTMLElement, '--text-shadow-blur-radius', '4px');
              // Animate out with interpolation
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
        line.HTMLElement.classList.add('NotSung');
        line.HTMLElement.classList.remove('Sung');
        if (
          line.HTMLElement.classList.contains('Active') &&
          !line.HTMLElement.classList.contains('OverridenByScroller')
        ) {
          line.HTMLElement.classList.remove('Active');
        }
      } else if (line.Status === 'Sung') {
        line.HTMLElement.classList.add('Sung');
        line.HTMLElement.classList.remove('Active', 'NotSung');
        if (arr.length === index + 1 && Credits) {
          Credits.classList.add('Active');
        }
      }
    }
  } else if (CurrentLyricsType === 'Line') {
    const arr = LyricsObject.Types.Line.Lines;
    for (let index = 0; index < arr.length; index++) {
      const line = arr[index];
      if (line.Status === 'Active') {
        if (!SpotifyPlayer.IsPlaying) applyBlur(arr, index, BlurMultiplier);
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
              const totalDuration = dot.EndTime - dot.StartTime;
              const elapsedDuration = edtrackpos - dot.StartTime;
              const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1));
              const blurRadius = 4 + (16 - 4) * percentage;
              const textShadowOpacity = calculateOpacity(percentage, dot) * 1.5;
              const scale = 0.75 + (1 - 0.75) * percentage;
              let translateY;
              if (percentage <= 0) {
                translateY = -0.07 * percentage;
              } else if (percentage <= 0.88) {
                translateY = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
              } else {
                translateY = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
              }
              animateDot(dot, percentage, blurRadius, textShadowOpacity, scale, translateY);
            } else if (dot.Status === 'NotSung') {
              dot.HTMLElement.style.setProperty('--opacity-size', `${0.2}`);
              dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
              dot.HTMLElement.style.scale = `0.75`;
              dot.HTMLElement.style.setProperty('--text-shadow-blur-radius', `4px`);
              dot.HTMLElement.style.setProperty('--text-shadow-opacity', `0%`);
            } else if (dot.Status === 'Sung') {
              dot.HTMLElement.style.setProperty('--opacity-size', `${0.2 + 1}`);
              dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
              dot.HTMLElement.style.scale = `1.2`;
              dot.HTMLElement.style.setProperty('--text-shadow-blur-radius', `12px`);
              dot.HTMLElement.style.setProperty('--text-shadow-opacity', `50%`);
            }
          }
        } else {
          line.HTMLElement.style.setProperty('--gradient-position', `${percentage * 100}%`);
        }
      } else if (line.Status === 'NotSung') {
        if (!line.HTMLElement.classList.contains('NotSung')) {
          line.HTMLElement.classList.add('NotSung');
        }
        line.HTMLElement.classList.remove('Sung');
        if (
          line.HTMLElement.classList.contains('Active') &&
          !line.HTMLElement.classList.contains('OverridenByScroller')
        ) {
          line.HTMLElement.classList.remove('Active');
        }
        line.HTMLElement.style.setProperty('--gradient-position', `0%`);
      } else if (line.Status === 'Sung') {
        if (!line.HTMLElement.classList.contains('Sung')) {
          line.HTMLElement.classList.add('Sung');
        }
        line.HTMLElement.classList.remove('Active', 'NotSung');
        line.HTMLElement.style.setProperty('--gradient-position', `100%`);
      }
    }
  }
}
