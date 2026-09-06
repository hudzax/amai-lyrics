import { describe, it, expect, beforeEach } from 'vitest';
import {
  IsMouseInLyricsPage,
  LyricsPageMouseEnter,
  LyricsPageMouseLeave,
  SetIsMouseInLyricsPage,
} from '../src/utils/Scrolling/Page/IsHovering';

beforeEach(() => {
  SetIsMouseInLyricsPage(false);
});

describe('IsHovering', () => {
  it('starts as not hovering', () => {
    expect(IsMouseInLyricsPage).toBe(false);
  });

  it('enter sets hovering, leave clears it', () => {
    LyricsPageMouseEnter();
    expect(IsMouseInLyricsPage).toBe(true);
    LyricsPageMouseLeave();
    expect(IsMouseInLyricsPage).toBe(false);
  });

  it('SetIsMouseInLyricsPage sets the flag directly', () => {
    SetIsMouseInLyricsPage(true);
    expect(IsMouseInLyricsPage).toBe(true);
    SetIsMouseInLyricsPage(false);
    expect(IsMouseInLyricsPage).toBe(false);
  });
});
