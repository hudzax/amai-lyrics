import settingsValues from './settingsValues';
import { BG_MOTION_OFF_CLASS } from '../components/DynamicBG/identity';

/**
 * ThemeSettings — applies the Amai Theme appearance settings to the document.
 *
 * The CSS background layers keep their hand-tuned per-surface values
 * (`sweet-dynamic-bg.css`); the user presets are expressed as root-level
 * scale factors (`--amai-bg-*-scale`) that those values are wrapped in, so
 * one preset reaches the sidebar, lyrics-page and app-frame canvases without
 * this module knowing any per-surface number. The WebGL2 app canvas bakes its
 * grade into the shader instead, so its equivalents (`getGlIntensity`,
 * `getGlMotionSpeed`) are read by `AppBackground`/`GlAppBackground` directly.
 *
 * `applyThemeSettings` is idempotent and re-runs at startup
 * (`AppInitializer`) and from every settings handler, so the inline root
 * vars can never go stale across hot-reloads.
 */

export type BackgroundIntensity = 'subtle' | 'normal' | 'intense';
export type BackgroundMotion = 'off' | 'slow' | 'normal' | 'fast';

/** Multipliers for the blur/saturation/brightness values in sweet-dynamic-bg.css. */
const INTENSITY_PRESETS: Record<
  BackgroundIntensity,
  { blur: number; saturation: number; brightness: number }
> = {
  subtle: { blur: 1.35, saturation: 0.55, brightness: 0.75 },
  normal: { blur: 1, saturation: 1, brightness: 1 },
  intense: { blur: 0.7, saturation: 1.3, brightness: 1.35 },
};

/**
 * GL equivalent of `INTENSITY_PRESETS`: the present pass already bakes dimming
 * and legibility scrims, so intensity scales the final colour's vibrance
 * (saturation distance from grey) and brightness instead of a CSS filter,
 * which the GPU path deliberately neutralizes.
 */
const GL_INTENSITY_PRESETS: Record<BackgroundIntensity, { vibrance: number; dim: number }> = {
  subtle: { vibrance: 0.8, dim: 0.8 },
  normal: { vibrance: 1, dim: 1 },
  intense: { vibrance: 1.15, dim: 1.1 },
};

/** Multipliers for the CSS animation durations (larger = slower). */
const MOTION_DURATION_SCALES: Record<Exclude<BackgroundMotion, 'off'>, number> = {
  slow: 1.75,
  normal: 1,
  fast: 0.5,
};

/** GL warp-speed factors (0 freezes the field at its static pose). */
const GL_MOTION_SPEEDS: Record<BackgroundMotion, number> = {
  off: 0,
  slow: 0.55,
  normal: 1,
  fast: 2,
};

/** Stored values are free-form strings; unknown ones fall back to Normal. */
function readIntensity(): BackgroundIntensity {
  const raw = settingsValues.get('backgroundIntensity');
  return raw === 'subtle' || raw === 'intense' ? raw : 'normal';
}

function readMotion(): BackgroundMotion {
  const raw = settingsValues.get('backgroundMotion');
  return raw === 'off' || raw === 'slow' || raw === 'fast' ? raw : 'normal';
}

/** Publish the intensity/motion presets as root custom properties + class. */
export function applyThemeSettings(): void {
  const intensity = INTENSITY_PRESETS[readIntensity()];
  const motion = readMotion();
  const root = document.documentElement.style;

  root.setProperty('--amai-bg-blur-scale', String(intensity.blur));
  root.setProperty('--amai-bg-saturation-scale', String(intensity.saturation));
  root.setProperty('--amai-bg-brightness-scale', String(intensity.brightness));
  // The scale var is meaningless while the pause class freezes the animations.
  root.setProperty(
    '--amai-bg-motion-scale',
    String(motion === 'off' ? 1 : MOTION_DURATION_SCALES[motion]),
  );
  document.documentElement.classList.toggle(BG_MOTION_OFF_CLASS, motion === 'off');
}

/** Present-pass uniforms for the WebGL2 canvas (see `GL_INTENSITY_PRESETS`). */
export function getGlIntensity(): { vibrance: number; dim: number } {
  return GL_INTENSITY_PRESETS[readIntensity()];
}

/** Field-warp speed factor for the WebGL2 canvas (0 = frozen). */
export function getGlMotionSpeed(): number {
  return GL_MOTION_SPEEDS[readMotion()];
}
