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
      isPlaying: () => false,
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
    Tippy: () => ({ destroy: () => {} }),
    TippyProps: {},
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
