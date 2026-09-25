// Global mocks for Spicetify-dependent modules.
// Vitest runs in jsdom; we provide a minimal Spicetify stub so modules that
// touch Spicetify at import time don't throw "Spicetify is not defined".

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

if (!g.Spicetify) {
  g.Spicetify = {
    Player: {
      data: { item: { uri: '', metadata: {}, duration: { milliseconds: 0 } }, isPaused: false },
      origin: {
        _state: {
          positionAsOfTimestamp: 0,
          timestamp: Date.now(),
          isPaused: true,
          shuffle: false,
          smartShuffle: false,
        },
        seekTo: () => {},
      },
      isPlaying: () => !g.Spicetify.Player.data.isPaused,
      getProgress: () => 0,
      getProgressPercent: () => 0,
      getDuration: () => 0,
      addEventListener: () => {},
      removeEventListener: () => {},
      getRepeat: () => 0,
      setShuffle: () => {},
      setRepeat: () => {},
      pause: () => {},
      play: () => {},
      next: () => {},
      back: () => {},
    },
    Platform: {
      PlatformData: { app_platform: 'test' },
      version: '1.0.0',
      History: { listen: () => () => {}, location: { pathname: '/' }, push: () => {} },
      UserAPI: { getUser: async () => null },
      PlaybackAPI: { _isLocal: true },
      Session: { accessToken: 'test', accessTokenExpirationTimestampMs: Date.now() + 3600000 },
    },
    CosmosAsync: { get: async () => ({ json: async () => ({}), status: 200 }) },
    LocalStorage: {
      _store: new Map<string, string>(),
      get(key: string) {
        return this._store.get(key) ?? null;
      },
      set(key: string, value: string) {
        this._store.set(key, value);
      },
      remove(key: string) {
        this._store.delete(key);
      },
    },
    Tippy: () => ({
      show: () => {},
      destroy: () => {},
      setContent: () => {},
      state: { isVisible: true },
    }),
    TippyProps: {},
    PopupModal: {
      display: () => {},
      hide: () => {},
    },
    showNotification: () => {},
    Snackbar: { enqueueSnackbar: (msg: unknown) => msg },
  };
}

if (!g.Spiticetify) {
  // keep alias typo-safe
}

// Stub for @hudzax/web-modules that may call Spicetify on import
if (!g.Spicetify.CosmosAsync) {
  g.Spicetify.CosmosAsync = { get: async () => ({ json: async () => ({}), status: 200 }) };
}

// Ensure window.Spicetify alias
if (typeof window !== 'undefined' && !(window as unknown as { Spicetify: unknown }).Spicetify) {
  (window as unknown as { Spicetify: unknown }).Spicetify = g.Spicetify;
}

// jsdom has no requestAnimationFrame unless pretendToBeVisual is set. DOM
// render paths (e.g. PlaybarLyrics marquee measurement) call it after mutating
// the subtree; a no-op stub keeps those assertions free of real timing.
if (typeof g.requestAnimationFrame === 'undefined') {
  g.requestAnimationFrame = () => 0;
}
if (typeof g.cancelAnimationFrame === 'undefined') {
  g.cancelAnimationFrame = () => {};
}

// jsdom has no ResizeObserver; Maid teardown and layout observers reference it.
if (typeof g.ResizeObserver === 'undefined') {
  g.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom implements no fullscreen API. The mode module re-reads
// `document.fullscreenElement` (never `event.target`), so a writable pointer
// plus resolving request/exit calls that dispatch the event is enough to drive
// real transitions. Tests reset it with `(document as any).fullscreenElement = null`.
Object.defineProperty(document, 'fullscreenElement', {
  configurable: true,
  writable: true,
  value: null,
});
g.Element.prototype.requestFullscreen = function (this: Element) {
  (document as unknown as { fullscreenElement: Element | null }).fullscreenElement = this;
  document.dispatchEvent(new Event('fullscreenchange'));
  return Promise.resolve();
};
document.exitFullscreen = function () {
  (document as unknown as { fullscreenElement: Element | null }).fullscreenElement = null;
  document.dispatchEvent(new Event('fullscreenchange'));
  return Promise.resolve();
};
