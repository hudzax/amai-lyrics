import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_INTENSITY_OPTIONS,
  BACKGROUND_MOTION_OPTIONS,
  isBackgroundIntensity,
  isBackgroundMotion,
} from '../src/utils/themeOptions';

describe('theme options', () => {
  it('declares unique values and labels per preset', () => {
    for (const options of [BACKGROUND_INTENSITY_OPTIONS, BACKGROUND_MOTION_OPTIONS]) {
      expect(new Set(options.map((option) => option.value)).size).toBe(options.length);
      expect(new Set(options.map((option) => option.label)).size).toBe(options.length);
    }
  });

  it('recognises only the declared preset values', () => {
    expect(isBackgroundIntensity('subtle')).toBe(true);
    expect(isBackgroundIntensity('banana')).toBe(false);
    expect(isBackgroundMotion('off')).toBe(true);
    expect(isBackgroundMotion('banana')).toBe(false);
  });
});
