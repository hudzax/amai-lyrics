import { describe, it, expect, beforeEach } from 'vitest';
import {
  isLyricsRoute,
  isPageOpen,
  isOnPageRoute,
  LYRICS_PATHNAME,
  setPageOpen,
} from '../src/utils/PagePresence';

interface HistoryStub {
  Spicetify: { Platform: { History: { location: { pathname: string } } } };
}

const historyLocation = (): { pathname: string } => {
  const sp = globalThis as unknown as HistoryStub;
  return sp.Spicetify.Platform.History.location;
};

beforeEach(() => {
  setPageOpen(false);
  historyLocation().pathname = '/';
});

describe('PagePresence seam', () => {
  it('starts closed and flips only through the writer', () => {
    expect(isPageOpen()).toBe(false);
    setPageOpen(true);
    expect(isPageOpen()).toBe(true);
    setPageOpen(false);
    expect(isPageOpen()).toBe(false);
  });

  it('owns the canonical lyrics pathname', () => {
    expect(LYRICS_PATHNAME).toBe('/AmaiLyrics');
  });

  it('recognises only the exact lyrics pathname', () => {
    expect(isLyricsRoute('/AmaiLyrics')).toBe(true);
    expect(isLyricsRoute('/AmaiLyrics/')).toBe(false);
    expect(isLyricsRoute('/AmaiLyricsExtra')).toBe(false);
    expect(isLyricsRoute('/amailyrics')).toBe(false);
    expect(isLyricsRoute('/')).toBe(false);
    expect(isLyricsRoute('')).toBe(false);
  });

  it('answers the route question from the History seam', () => {
    expect(isOnPageRoute()).toBe(false);
    historyLocation().pathname = '/AmaiLyrics';
    expect(isOnPageRoute()).toBe(true);
  });

  it('reads false when the History seam is absent', () => {
    const sp = globalThis as unknown as {
      Spicetify: { Platform: { History?: unknown } };
    };
    const original = sp.Spicetify.Platform.History;
    delete sp.Spicetify.Platform.History;
    expect(isOnPageRoute()).toBe(false);
    sp.Spicetify.Platform.History = original;
  });
});
