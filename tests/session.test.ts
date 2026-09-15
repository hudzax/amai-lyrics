import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Session keeps module-level history, so each case gets a fresh module.
async function freshSession() {
  vi.resetModules();
  return (await import('../src/components/Global/Session')).default;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

function historyStub() {
  return g.Spicetify.Platform.History;
}

describe('Session.GoBack', () => {
  let push: ReturnType<typeof vi.fn>;
  let savedHistory: unknown;

  beforeEach(() => {
    savedHistory = historyStub();
    push = vi.fn();
    // Base stub mirrors tests/setup.ts (no entries/goBack) unless a case adds them.
    g.Spicetify.Platform.History = {
      listen: () => () => {},
      location: { pathname: '/' },
      push,
    };
  });

  afterEach(() => {
    g.Spicetify.Platform.History = savedHistory;
    vi.restoreAllMocks();
  });

  it('walks the mirror back past the lyrics page', async () => {
    const Session = await freshSession();
    Session.RecordNavigation({ pathname: '/' });
    Session.RecordNavigation({ pathname: '/search' });
    Session.RecordNavigation({ pathname: '/AmaiLyrics' });

    Session.GoBack();

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ pathname: '/search' });
  });

  it('ignores consecutive duplicate pushes so GoBack cannot resolve to the current page', async () => {
    const Session = await freshSession();
    Session.RecordNavigation({ pathname: '/' });
    Session.RecordNavigation({ pathname: '/AmaiLyrics' });
    Session.RecordNavigation({ pathname: '/AmaiLyrics' });

    Session.GoBack();

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ pathname: '/' });
  });

  it('prefers the platform history stack over the mirror', async () => {
    const Session = await freshSession();
    // Mirror only knows the lyrics page (e.g. after a hot-reload reset).
    Session.RecordNavigation({ pathname: '/AmaiLyrics' });
    g.Spicetify.Platform.History.entries = [{ pathname: '/home' }, { pathname: '/AmaiLyrics' }];

    Session.GoBack();

    expect(push).toHaveBeenCalledWith({ pathname: '/home' });
  });

  it('skips lyrics entries in the platform stack', async () => {
    const Session = await freshSession();
    g.Spicetify.Platform.History.entries = [
      { pathname: '/search' },
      { pathname: '/AmaiLyrics' },
      { pathname: '/AmaiLyrics' },
    ];
    g.Spicetify.Platform.History.index = 2;

    Session.GoBack();

    expect(push).toHaveBeenCalledWith({ pathname: '/search' });
  });

  it('falls back to home when no previous location is known', async () => {
    const Session = await freshSession();
    Session.RecordNavigation({ pathname: '/AmaiLyrics' });

    Session.GoBack();

    expect(push).toHaveBeenCalledWith({ pathname: '/' });
  });

  it('uses platform goBack when stacks only know the lyrics page', async () => {
    const Session = await freshSession();
    Session.RecordNavigation({ pathname: '/AmaiLyrics' });
    const goBack = vi.fn();
    g.Spicetify.Platform.History.goBack = goBack;

    Session.GoBack();

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });
});
