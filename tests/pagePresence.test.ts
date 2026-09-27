import { describe, it, expect, beforeEach } from 'vitest';
import { isPageOpen, isOnPageRoute, setPageOpen } from '../src/utils/PagePresence';

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
