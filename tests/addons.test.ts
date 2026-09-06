import { describe, it, expect, afterEach } from 'vitest';
import {
  IsPlaying,
  TOP_ApplyLyricsSpacer,
  BOTTOM_ApplyLyricsSpacer,
  ArabicPersianRegex,
} from '../src/utils/Addons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis as any;
const originalPaused = spicetify.Spicetify.Player.data.isPaused;

afterEach(() => {
  spicetify.Spicetify.Player.data.isPaused = originalPaused;
});

describe('IsPlaying', () => {
  it('returns true when not paused', () => {
    spicetify.Spicetify.Player.data.isPaused = false;
    expect(IsPlaying()).toBe(true);
  });

  it('returns false when paused', () => {
    spicetify.Spicetify.Player.data.isPaused = true;
    expect(IsPlaying()).toBe(false);
  });
});

describe('lyrics spacers', () => {
  it('appends top and bottom spacers', () => {
    const container = document.createElement('div');
    TOP_ApplyLyricsSpacer(container);
    BOTTOM_ApplyLyricsSpacer(container);
    expect(container.querySelector('.TopSpacer')).not.toBeNull();
    expect(container.querySelector('.BottomSpacer')).not.toBeNull();
  });
});

describe('ArabicPersianRegex', () => {
  it('matches Arabic text and not Latin', () => {
    expect(ArabicPersianRegex.test('مرحبا')).toBe(true);
    expect(ArabicPersianRegex.test('hello')).toBe(false);
  });
});
