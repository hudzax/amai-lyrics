export type BackgroundIntensity = 'subtle' | 'normal' | 'intense';
export type BackgroundMotion = 'off' | 'slow' | 'normal' | 'fast';

export interface ThemeOption<T extends string> {
  value: T;
  label: string;
}

export const BACKGROUND_INTENSITY_OPTIONS: readonly ThemeOption<BackgroundIntensity>[] = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'normal', label: 'Normal' },
  { value: 'intense', label: 'Intense' },
];

export const BACKGROUND_MOTION_OPTIONS: readonly ThemeOption<BackgroundMotion>[] = [
  { value: 'off', label: 'Off' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

export const DEFAULT_BACKGROUND_INTENSITY: BackgroundIntensity = 'normal';
export const DEFAULT_BACKGROUND_MOTION: BackgroundMotion = 'normal';

export function isBackgroundIntensity(value: unknown): value is BackgroundIntensity {
  return BACKGROUND_INTENSITY_OPTIONS.some((option) => option.value === value);
}

export function isBackgroundMotion(value: unknown): value is BackgroundMotion {
  return BACKGROUND_MOTION_OPTIONS.some((option) => option.value === value);
}
