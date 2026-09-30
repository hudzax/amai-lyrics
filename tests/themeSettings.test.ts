import { describe, it, expect, beforeEach } from 'vitest';
import { applyThemeSettings, getGlIntensity, getGlMotionSpeed } from '../src/utils/ThemeSettings';
import { BG_MOTION_OFF_CLASS } from '../src/components/DynamicBG/identity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;

beforeEach(() => {
  spicetify.Spicetify.LocalStorage._store.clear();
  document.documentElement.style.cssText = '';
  document.documentElement.classList.remove(BG_MOTION_OFF_CLASS);
});

describe('applyThemeSettings', () => {
  it('publishes neutral scales and no pause class for the default (normal) preset', () => {
    applyThemeSettings();

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--amai-bg-blur-scale')).toBe('1');
    expect(root.getPropertyValue('--amai-bg-saturation-scale')).toBe('1');
    expect(root.getPropertyValue('--amai-bg-brightness-scale')).toBe('1');
    expect(root.getPropertyValue('--amai-bg-motion-scale')).toBe('1');
    expect(document.documentElement.classList.contains(BG_MOTION_OFF_CLASS)).toBe(false);
  });

  it('maps the subtle preset to blurrier, dimmer, less saturated scales', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_intensity', 'subtle');
    applyThemeSettings();

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--amai-bg-blur-scale')).toBe('1.35');
    expect(root.getPropertyValue('--amai-bg-saturation-scale')).toBe('0.55');
    expect(root.getPropertyValue('--amai-bg-brightness-scale')).toBe('0.75');
  });

  it('maps the intense preset to clearer, brighter, more saturated scales', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_intensity', 'intense');
    applyThemeSettings();

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--amai-bg-blur-scale')).toBe('0.7');
    expect(root.getPropertyValue('--amai-bg-saturation-scale')).toBe('1.3');
    expect(root.getPropertyValue('--amai-bg-brightness-scale')).toBe('1.35');
  });

  it('falls back to neutral for an unrecognised stored intensity', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_intensity', 'banana');
    applyThemeSettings();

    expect(document.documentElement.style.getPropertyValue('--amai-bg-blur-scale')).toBe('1');
  });

  it('toggles the motion-off class and keeps a neutral scale for Off', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_motion', 'off');
    applyThemeSettings();

    expect(document.documentElement.classList.contains(BG_MOTION_OFF_CLASS)).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--amai-bg-motion-scale')).toBe('1');
  });

  it('maps Slow and Fast onto duration scales around 1', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_motion', 'slow');
    applyThemeSettings();
    expect(document.documentElement.style.getPropertyValue('--amai-bg-motion-scale')).toBe('1.75');
    expect(document.documentElement.classList.contains(BG_MOTION_OFF_CLASS)).toBe(false);

    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_motion', 'fast');
    applyThemeSettings();
    expect(document.documentElement.style.getPropertyValue('--amai-bg-motion-scale')).toBe('0.5');
  });
});

describe('GL lookups', () => {
  it('gives neutral GL values by default', () => {
    expect(getGlIntensity()).toEqual({ vibrance: 1, dim: 1 });
    expect(getGlMotionSpeed()).toBe(1);
  });

  it('maps the presets to the shader grade and warp speed', () => {
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_intensity', 'subtle');
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_motion', 'off');
    expect(getGlIntensity()).toEqual({ vibrance: 0.8, dim: 0.8 });
    expect(getGlMotionSpeed()).toBe(0);

    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_intensity', 'intense');
    spicetify.Spicetify.LocalStorage.set('AmaiLyrics-background_motion', 'fast');
    expect(getGlIntensity()).toEqual({ vibrance: 1.15, dim: 1.1 });
    expect(getGlMotionSpeed()).toBe(2);
  });
});
