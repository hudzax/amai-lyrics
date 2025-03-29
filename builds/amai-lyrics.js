(async function() {
        while (!Spicetify.React || !Spicetify.ReactDOM) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        var amaiDlyrics = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to2, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to2, key) && key !== except)
          __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to2;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // external-global-plugin:react
  var require_react = __commonJS({
    "external-global-plugin:react"(exports, module) {
      module.exports = Spicetify.React;
    }
  });

  // external-global-plugin:react-dom
  var require_react_dom = __commonJS({
    "external-global-plugin:react-dom"(exports, module) {
      module.exports = Spicetify.ReactDOM;
    }
  });

  // node_modules/@spikerko/web-modules/SpikyCache.js
  var SpikyCache = class {
    cacheName;
    constructor(options) {
      this.cacheName = this.normalizeKey(options.name);
    }
    normalizeKey(key) {
      return key.replace(/[^a-zA-Z0-9-]/g, "").replace(/\s+/g, "-");
    }
    async set(key, value, expirationTTL) {
      const normalizedKey = this.normalizeKey(key);
      let body = null;
      let contentType = void 0;
      if (typeof value === "string") {
        body = value;
        contentType = "text/plain";
      } else if (typeof value === "number") {
        body = value.toString();
        contentType = "text/plain";
      } else if (typeof value === "object") {
        body = JSON.stringify(value);
        contentType = "application/json";
      } else if (typeof value === "boolean") {
        body = value.toString();
        contentType = "text/plain";
      }
      try {
        const cache = await caches.open(this.cacheName);
        let headers = {};
        if (contentType) {
          headers["Content-Type"] = contentType;
        }
        const response = new Response(body, {
          headers
        });
        if (expirationTTL) {
          response.headers.append("Cache-Control", `max-age=${expirationTTL}`);
        }
        await cache.put(normalizedKey, response);
      } catch (error) {
        console.error("Error setting cache:", error);
        throw error;
      }
    }
    async get(key) {
      const normalizedKey = this.normalizeKey(key);
      try {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(normalizedKey);
        if (response) {
          const contentType = response.headers.get("Content-Type");
          if (contentType === "application/json") {
            return await response.json();
          } else if (contentType?.startsWith("text/")) {
            const text = await response.text();
            const num = parseFloat(text);
            if (!isNaN(num)) {
              return num;
            }
            if (text === "true") {
              return true;
            } else if (text === "false") {
              return false;
            }
            return text;
          } else {
            return await response.blob();
          }
        }
      } catch (error) {
        console.error("Error getting cache:", error);
        throw error;
      }
    }
    async remove(key) {
      const normalizedKey = this.normalizeKey(key);
      try {
        const cache = await caches.open(this.cacheName);
        await cache.delete(normalizedKey);
      } catch (error) {
        console.error("Error removing cache:", error);
        throw error;
      }
    }
    async destroy() {
      try {
        await caches.delete(this.cacheName);
      } catch (error) {
        console.error("Error destroying cache:", error);
        throw error;
      }
    }
  };

  // src/utils/storage.ts
  var prefix = "SpicyLyrics-";
  var currentlyFetching = false;
  function set(key, value) {
    if (key === "currentlyFetching") {
      currentlyFetching = value;
      return;
    }
    Spicetify.LocalStorage.set(`${prefix}${key}`, value);
  }
  function get(key) {
    if (key === "currentlyFetching") {
      return currentlyFetching;
    }
    const data = Spicetify.LocalStorage.get(`${prefix}${key}`);
    return data;
  }
  var storage_default = {
    set,
    get
  };

  // src/components/Global/Defaults.ts
  var Defaults = {
    lyrics: {
      api: {
        url: "https://api.spicylyrics.org"
      }
    },
    lowQualityMode: false,
    CurrentLyricsType: "None",
    LyricsContainerExists: false,
    SkipSpicyFont: false,
    OldStyleFont: false,
    SpicyLyricsVersion: "0.0.0",
    ForceCoverImage_InLowQualityMode: true,
    show_topbar_notifications: false,
    lyrics_spacing: 2
  };
  var Defaults_default = Defaults;

  // src/utils/Lyrics/SongProgressBar.ts
  var SongProgressBar = class {
    constructor() {
      this.destroyed = false;
      this.duration = 0;
      this.position = 0;
    }
    Update(params) {
      if (this.destroyed) {
        console.warn("This progress bar has been destroyed and cannot be used");
        return;
      }
      this.duration = params.duration;
      this.position = Math.min(params.position, this.duration);
    }
    Destroy() {
      if (this.destroyed)
        return;
      this.destroyed = true;
    }
    GetFormattedDuration() {
      return this.formatTime(this.duration);
    }
    GetFormattedPosition() {
      return this.formatTime(this.position);
    }
    GetProgressPercentage() {
      if (this.duration <= 0)
        return 0;
      return this.position / this.duration;
    }
    CalculatePositionFromClick(params) {
      const { sliderBar, event } = params;
      if (this.duration <= 0)
        return 0;
      const rect = sliderBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const positionMs = Math.floor(percentage * this.duration);
      return positionMs;
    }
    formatTime(timeInMs) {
      if (isNaN(timeInMs) || timeInMs < 0) {
        return "0:00";
      }
      const totalSeconds = Math.floor(timeInMs / 1e3);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  };

  // src/utils/Whentil.ts
  function Until(statement, callback, maxRepeats = Infinity) {
    let isCancelled = false;
    let hasReset = false;
    let executedCount = 0;
    const resolveStatement = () => typeof statement === "function" ? statement() : statement;
    const runner = () => {
      if (isCancelled || executedCount >= maxRepeats)
        return;
      const conditionMet = resolveStatement();
      if (!conditionMet) {
        callback();
        executedCount++;
        setTimeout(runner, 0);
      }
    };
    setTimeout(runner, 0);
    return {
      Cancel() {
        isCancelled = true;
      },
      Reset() {
        if (executedCount >= maxRepeats || isCancelled) {
          isCancelled = false;
          hasReset = true;
          executedCount = 0;
          runner();
        }
      }
    };
  }
  function When(statement, callback, repeater = 1) {
    let isCancelled = false;
    let hasReset = false;
    let executionsRemaining = repeater;
    const resolveStatement = () => typeof statement === "function" ? statement() : statement;
    const runner = () => {
      if (isCancelled || executionsRemaining <= 0)
        return;
      try {
        const conditionMet = resolveStatement();
        if (conditionMet) {
          callback(resolveStatement());
          executionsRemaining--;
          if (executionsRemaining > 0)
            setTimeout(runner, 0);
        } else {
          setTimeout(runner, 0);
        }
      } catch (error) {
        setTimeout(runner, 0);
      }
    };
    setTimeout(runner, 0);
    return {
      Cancel() {
        isCancelled = true;
      },
      Reset() {
        if (executionsRemaining <= 0 || isCancelled) {
          isCancelled = false;
          hasReset = true;
          executionsRemaining = repeater;
          runner();
        }
      }
    };
  }
  var Whentil = {
    When,
    Until
  };
  var Whentil_default = Whentil;

  // src/utils/EventManager.ts
  var eventRegistry = /* @__PURE__ */ new Map();
  var nextId = 1;
  var listen = (eventName, callback) => {
    if (!eventRegistry.has(eventName)) {
      eventRegistry.set(eventName, /* @__PURE__ */ new Map());
    }
    const id = nextId++;
    eventRegistry.get(eventName).set(id, callback);
    return id;
  };
  var unListen = (id) => {
    for (const [eventName, listeners] of eventRegistry) {
      if (listeners.has(id)) {
        listeners.delete(id);
        if (listeners.size === 0) {
          eventRegistry.delete(eventName);
        }
        return true;
      }
    }
    return false;
  };
  var evoke = (eventName, ...args) => {
    const listeners = eventRegistry.get(eventName);
    if (listeners) {
      for (const callback of listeners.values()) {
        callback(...args);
      }
    }
  };
  var Event = {
    listen,
    unListen,
    evoke
  };
  var EventManager_default = Event;

  // src/components/Global/Global.ts
  window._spicy_lyrics = {};
  var SCOPE_ROOT = window._spicy_lyrics;
  var Global = {
    Scope: SCOPE_ROOT,
    Event: EventManager_default,
    NonLocalTimeOffset: 340,
    SetScope: (key, value) => {
      const keys = key.split(".");
      let current = SCOPE_ROOT;
      for (let i2 = 0; i2 < keys.length; i2++) {
        const part = keys[i2];
        if (i2 === keys.length - 1) {
          current[part] = current[part] ?? value;
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          if (typeof current[part] !== "object" || Array.isArray(current[part])) {
            throw new TypeError(
              `Cannot set nested property: ${keys.slice(0, i2 + 1).join(".")} is not an object.`
            );
          }
          current = current[part];
        }
      }
    },
    GetScope: (key, fallback = void 0) => {
      const keys = key.split(".");
      let current = SCOPE_ROOT;
      for (const part of keys) {
        if (current === void 0 || current === null) {
          return fallback;
        }
        current = current[part];
      }
      return current === void 0 ? fallback : current;
    }
  };
  var Global_default = Global;

  // node_modules/@spikerko/web-modules/Scheduler.js
  var Cancel = (scheduled) => {
    if (scheduled[2]) {
      return;
    }
    scheduled[2] = true;
    switch (scheduled[0]) {
      case 0:
        globalThis.clearTimeout(scheduled[1]);
        break;
      case 1:
        globalThis.clearInterval(scheduled[1]);
        break;
      case 2:
        globalThis.cancelAnimationFrame(scheduled[1]);
        break;
    }
  };
  var Timeout = (seconds, callback) => {
    return [
      0,
      setTimeout(callback, seconds * 1e3)
    ];
  };
  var Defer = (callback) => {
    const scheduled = [
      2,
      0
    ];
    scheduled[1] = requestAnimationFrame(() => {
      scheduled[0] = 0;
      scheduled[1] = setTimeout(callback, 0);
    });
    return scheduled;
  };
  var IsScheduled = (value) => {
    return Array.isArray(value) && (value.length === 2 || value.length === 3) && typeof value[0] === "number" && typeof value[1] === "number" && (value[2] === void 0 || value[2] === true);
  };

  // src/components/Global/Platform.ts
  var Spotify = globalThis.Spicetify;
  var SpotifyPlatform;
  var SpotifyInternalFetch;
  var OnSpotifyReady = new Promise((resolve) => {
    const CheckForServices = () => {
      SpotifyPlatform = Spotify.Platform;
      SpotifyInternalFetch = Spotify.CosmosAsync;
      if (!SpotifyPlatform || !SpotifyInternalFetch) {
        Defer(CheckForServices);
        return;
      }
      resolve();
    };
    CheckForServices();
  });
  var tokenProviderResponse;
  var accessTokenPromise;
  var GetSpotifyAccessToken = () => {
    if (tokenProviderResponse) {
      const timeUntilRefresh = (tokenProviderResponse.expiresAtTime - Date.now()) / 1e3;
      if (timeUntilRefresh <= 2) {
        tokenProviderResponse = void 0;
        accessTokenPromise = new Promise(
          (resolve) => Timeout(timeUntilRefresh, resolve)
        ).then(() => {
          accessTokenPromise = void 0;
          return GetSpotifyAccessToken();
        });
        return accessTokenPromise;
      }
    }
    if (accessTokenPromise) {
      return accessTokenPromise;
    }
    accessTokenPromise = SpotifyInternalFetch.get("sp://oauth/v2/token").then((result) => {
      tokenProviderResponse = result;
      accessTokenPromise = Promise.resolve(result.accessToken);
      return GetSpotifyAccessToken();
    }).catch((error) => {
      if (error.message.includes("Resolver not found")) {
        if (!SpotifyPlatform.Session) {
          console.warn("Failed to find SpotifyPlatform.Session for fetching token");
        } else {
          tokenProviderResponse = {
            accessToken: SpotifyPlatform.Session.accessToken,
            expiresAtTime: SpotifyPlatform.Session.accessTokenExpirationTimestampMs,
            tokenType: "Bearer"
          };
          accessTokenPromise = Promise.resolve(tokenProviderResponse.accessToken);
        }
      }
      return GetSpotifyAccessToken();
    });
    return accessTokenPromise;
  };
  var Platform = {
    OnSpotifyReady,
    GetSpotifyAccessToken
  };
  var Platform_default = Platform;

  // src/utils/API/SendJob.ts
  var API_URL = Defaults_default.lyrics.api.url;
  async function SendJob(jobs, headers = {}) {
    const res = await fetch(`${API_URL}/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ jobs })
    });
    if (!res.ok)
      throw new Error("Request failed");
    const data = await res.json();
    const results = /* @__PURE__ */ new Map();
    for (const job of data.jobs) {
      results.set(job.handler, job.result);
    }
    return {
      get(handler) {
        return results.get(handler);
      }
    };
  }

  // src/components/Global/Session.ts
  var sessionHistory = [];
  var Session = {
    Navigate: (data) => {
      Spicetify.Platform.History.push(data);
    },
    GoBack: () => {
      if (sessionHistory.length > 1) {
        Session.Navigate(sessionHistory[sessionHistory.length - 2]);
      } else {
        Session.Navigate({ pathname: "/" });
      }
    },
    GetPreviousLocation: () => {
      if (sessionHistory.length > 1) {
        return sessionHistory[sessionHistory.length - 2];
      }
      return null;
    },
    RecordNavigation: (data) => {
      Session.PushToHistory(data);
      Global_default.Event.evoke("session:navigation", data);
    },
    FilterOutTheSameLocation: (data) => {
      const filtered = sessionHistory.filter(
        (location2) => location2.pathname !== data.pathname && location2.search !== data?.search && location2.hash !== data?.hash
      );
      sessionHistory = filtered;
    },
    PushToHistory: (data) => {
      sessionHistory.push(data);
    },
    SpicyLyrics: {
      ParseVersion: (version) => {
        const versionMatches = version.match(/(\d+)\.(\d+)\.(\d+)/);
        if (versionMatches === null) {
          return void 0;
        }
        return {
          Text: versionMatches[0],
          Major: parseInt(versionMatches[1]),
          Minor: parseInt(versionMatches[2]),
          Patch: parseInt(versionMatches[3])
        };
      },
      GetCurrentVersion: () => {
        return Session.SpicyLyrics.ParseVersion(Defaults_default.SpicyLyricsVersion);
      },
      GetLatestVersion: async () => {
        const res = await SendJob([
          {
            handler: "VERSION"
          }
        ]);
        const versionJob = res.get("VERSION");
        if (versionJob.status !== 200 || versionJob.type !== "text")
          return void 0;
        const data = versionJob.responseData;
        return Session.SpicyLyrics.ParseVersion(data);
      },
      IsOutdated: async () => {
        const latestVersion = await Session.SpicyLyrics.GetLatestVersion();
        const currentVersion = Session.SpicyLyrics.GetCurrentVersion();
        if (latestVersion === void 0 || currentVersion === void 0)
          return false;
        return latestVersion.Major > currentVersion.Major || latestVersion.Minor > currentVersion.Minor || latestVersion.Patch > currentVersion.Patch;
      }
    }
  };
  window._spicy_lyrics_session = Session;
  var Session_default = Session;

  // src/utils/version/CheckForUpdates.ts
  var ShownUpdateNotice = false;
  async function CheckForUpdates(force = false) {
    const IsOutdated = await Session_default.SpicyLyrics.IsOutdated();
    if (IsOutdated) {
      if (!force && ShownUpdateNotice)
        return;
      const currentVersion = Session_default.SpicyLyrics.GetCurrentVersion();
      const latestVersion = await Session_default.SpicyLyrics.GetLatestVersion();
      Spicetify.PopupModal.display({
        title: "New Update - Spicy Lyrics",
        content: `
          <div style="font-size: 1.5rem;">
            Your Spicy Lyrics version is outdated.
            To update, click on the "Update" button.
            <br>
            Version: From: ${currentVersion.Text} -> To: ${latestVersion.Text}
            <br><br>
            <button onclick="window._spicy_lyrics_session.Navigate({ pathname: '/SpicyLyrics/Update' })" class="Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold" data-encore-id="buttonSecondary">
              Update
            </button>
          </div>`
      });
      ShownUpdateNotice = true;
    }
  }

  // src/utils/API/SpicyFetch.ts
  var SpicyFetchCache = new SpikyCache({
    name: "SpicyFetch__Cache"
  });
  async function SpicyFetch(path, IsExternal = false, cache = false, cosmos = false) {
    return new Promise(async (resolve, reject) => {
      const lyricsApi = Defaults_default.lyrics.api.url;
      const CurrentVersion = Session_default.SpicyLyrics.GetCurrentVersion();
      const url = IsExternal ? path : `${lyricsApi}/${path}${path.includes("?") ? "&" : "?"}origin_version=${CurrentVersion.Text}`;
      const CachedContent = await GetCachedContent(url);
      if (CachedContent) {
        if (Array.isArray(CachedContent)) {
          resolve(CachedContent);
          return;
        }
        resolve([CachedContent, 200]);
        return;
      }
      const SpotifyAccessToken = await Platform_default.GetSpotifyAccessToken();
      if (cosmos) {
        Spicetify.CosmosAsync.get(url).then(async (res) => {
          const data = typeof res === "object" ? JSON.stringify(res) : res;
          const sentData = [data, res.status];
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 6048e5);
          }
        }).catch((err) => {
          console.log("CosmosAsync Error:", err);
          reject(err);
        });
      } else {
        const SpicyLyricsAPI_Headers = IsExternal ? null : {};
        const SpotifyAPI_Headers = IsExternal ? {
          "Spotify-App-Version": Spicetify.Platform.version,
          "App-Platform": Spicetify.Platform.PlatformData.app_platform,
          "Accept": "application/json",
          "Content-Type": "application/json"
        } : null;
        const headers = {
          Authorization: `Bearer ${SpotifyAccessToken}`,
          ...SpotifyAPI_Headers,
          ...SpicyLyricsAPI_Headers
        };
        fetch(url, {
          method: "GET",
          headers
        }).then(CheckForErrors).then(async (res) => {
          if (res === null) {
            resolve([null, 500]);
            return;
          }
          ;
          const data = await res.text();
          const sentData = [data, res.status];
          resolve(sentData);
          if (cache) {
            await CacheContent(url, sentData, 6048e5);
          }
        }).catch((err) => {
          console.log("Fetch Error:", err);
          reject(err);
        });
      }
    });
  }
  async function CacheContent(key, data, expirationTtl = 6048e5) {
    try {
      const expiresIn = Date.now() + expirationTtl;
      const processedKey = SpicyHasher.md5(key);
      const processedData = typeof data === "object" ? JSON.stringify(data) : data;
      const compressedData = pako.deflate(processedData, { to: "string", level: 1 });
      const compressedString = String.fromCharCode(...new Uint8Array(compressedData));
      await SpicyFetchCache.set(processedKey, {
        Content: compressedString,
        expiresIn
      });
    } catch (error) {
      console.error("ERR CC", error);
      await SpicyFetchCache.destroy();
    }
  }
  async function GetCachedContent(key) {
    try {
      const processedKey = SpicyHasher.md5(key);
      const content = await SpicyFetchCache.get(processedKey);
      if (content) {
        if (content.expiresIn > Date.now()) {
          if (typeof content.Content !== "string") {
            await SpicyFetchCache.remove(key);
            return content.Content;
          }
          const compressedData = Uint8Array.from(content.Content, (c2) => c2.charCodeAt(0));
          const decompressedData = pako.inflate(compressedData, { to: "string" });
          const data = typeof decompressedData === "string" && (decompressedData.startsWith("{") || decompressedData.startsWith(`{"`) || decompressedData.startsWith("[") || decompressedData.startsWith(`["`)) ? JSON.parse(decompressedData) : decompressedData;
          return data;
        } else {
          await SpicyFetchCache.remove(key);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("ERR CC", error);
    }
  }
  var ENDPOINT_DISABLEMENT_Shown = false;
  async function CheckForErrors(res) {
    if (res.status === 500) {
      const TEXT = await res.text();
      if (TEXT.includes(`{"`)) {
        const data = JSON.parse(TEXT);
        if (data.type === "ENDPOINT_DISABLEMENT") {
          if (ENDPOINT_DISABLEMENT_Shown)
            return;
          Spicetify.PopupModal.display({
            title: "Endpoint Disabled",
            content: `
                        <div>
                            <p>The endpoint you're trying to access is disabled.</p><br>
                            <p>This could mean a few things:</p><br>
                            <ul>
                                <li>Maintenace on the API</li>
                                <li>A Critical Issue</li>
                                <li>A quick Disablement of the Endpoint</li>
                            </ul><br><br>
                            <p>Is this problem persists, contact us on Github: <a href="https://github.com/spikenew7774/spicy-lyrics/" target="_blank" style="text-decoration:underline;">https://github.com/spikenew7774/spicy-lyrics</a>
                            ,<br> Or at <b>spikerko@spikerko.org</b></p>
                            <h3>Thanks!</h3>
                        </div>
                    `
          });
          ENDPOINT_DISABLEMENT_Shown = true;
          return res;
        }
        return res;
      }
      return res;
    } else if (res.status === 403) {
      const TEXT = await res.text();
      if (TEXT.includes(`{"`)) {
        const data = JSON.parse(TEXT);
        if (data?.message === "Update Spicy Lyrics") {
          await CheckForUpdates(true);
          return null;
        }
      }
    }
    return res;
  }

  // src/utils/Gets/GetProgress.ts
  var syncedPosition;
  var syncTimings = [0.05, 0.1, 0.15, 0.75];
  var canSyncNonLocalTimestamp = Spicetify.Player.isPlaying() ? syncTimings.length : 0;
  var requestPositionSync = () => {
    try {
      const SpotifyPlatform2 = Spicetify.Platform;
      const startedAt = performance.now();
      const isLocallyPlaying = SpotifyPlatform2.PlaybackAPI._isLocal;
      const getLocalPosition = () => {
        return SpotifyPlatform2.PlayerAPI._contextPlayer.getPositionState({}).then(({ position }) => ({
          StartedSyncAt: startedAt,
          Position: Number(position)
        }));
      };
      const getNonLocalPosition = () => {
        return (canSyncNonLocalTimestamp > 0 ? SpotifyPlatform2.PlayerAPI._contextPlayer.resume({}) : Promise.resolve()).then(() => {
          canSyncNonLocalTimestamp = Math.max(0, canSyncNonLocalTimestamp - 1);
          return {
            StartedSyncAt: startedAt,
            Position: SpotifyPlatform2.PlayerAPI._state.positionAsOfTimestamp + (Date.now() - SpotifyPlatform2.PlayerAPI._state.timestamp)
          };
        });
      };
      const sync = isLocallyPlaying ? getLocalPosition() : getNonLocalPosition();
      sync.then((position) => {
        syncedPosition = position;
      }).then(() => {
        const delay = isLocallyPlaying ? 1 / 60 : canSyncNonLocalTimestamp === 0 ? 1 / 60 : syncTimings[syncTimings.length - canSyncNonLocalTimestamp];
        setTimeout(requestPositionSync, delay * 1e3);
      });
    } catch (error) {
      console.error("Sync Position: Fail, More Details:", error);
    }
  };
  function GetProgress() {
    if (!syncedPosition) {
      console.error("Synced Position: Unavailable");
      if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
        console.warn("Synced Position: Skip, Using DEPRECATED Version");
        return SpotifyPlayer._DEPRECATED_.GetTrackPosition();
      }
      console.warn("Synced Position: Skip, Returning 0");
      return 0;
    }
    const SpotifyPlatform2 = Spicetify.Platform;
    const isLocallyPlaying = SpotifyPlatform2.PlaybackAPI._isLocal;
    const { StartedSyncAt, Position } = syncedPosition;
    const now2 = performance.now();
    const deltaTime = now2 - StartedSyncAt;
    if (!Spicetify.Player.isPlaying()) {
      return SpotifyPlatform2.PlayerAPI._state.positionAsOfTimestamp;
    }
    const FinalPosition = Position + deltaTime;
    return isLocallyPlaying ? FinalPosition : FinalPosition + Global_default.NonLocalTimeOffset;
  }
  function _DEPRECATED___GetProgress() {
    if (!Spicetify?.Player?.origin?._state) {
      console.error("Spicetify Player state is not available.");
      return 0;
    }
    const state = Spicetify.Player.origin._state;
    const positionAsOfTimestamp = state.positionAsOfTimestamp;
    const timestamp = state.timestamp;
    const isPaused = state.isPaused;
    if (positionAsOfTimestamp == null || timestamp == null) {
      console.error("Playback state is incomplete.");
      return null;
    }
    const now2 = Date.now();
    if (isPaused) {
      return positionAsOfTimestamp;
    } else {
      return positionAsOfTimestamp + (now2 - timestamp);
    }
  }

  // src/components/Global/SpotifyPlayer.ts
  var TrackData_Map = /* @__PURE__ */ new Map();
  var SpotifyPlayer = {
    IsPlaying: false,
    GetTrackPosition: GetProgress,
    GetTrackDuration: () => {
      if (Spicetify.Player.data.item.duration?.milliseconds) {
        return Spicetify.Player.data.item.duration.milliseconds;
      }
      return 0;
    },
    Track: {
      GetTrackInfo: async () => {
        const spotifyHexString = SpicyHasher.spotifyHex(SpotifyPlayer.GetSongId());
        if (TrackData_Map.has(spotifyHexString))
          return TrackData_Map.get(spotifyHexString);
        const URL2 = `https://spclient.wg.spotify.com/metadata/4/track/${spotifyHexString}?market=from_token`;
        const [data, status] = await SpicyFetch(URL2, true, true, false);
        if (status !== 200)
          return null;
        const parsedData = data.startsWith(`{"`) || data.startsWith("{") ? JSON.parse(data) : data;
        TrackData_Map.set(spotifyHexString, parsedData);
        return parsedData;
      },
      SortImages: (images) => {
        const sizeMap = {
          s: "SMALL",
          l: "DEFAULT",
          xl: "LARGE"
        };
        const sortedImages = images.reduce((acc, image) => {
          const { size } = image;
          if (size === sizeMap.s) {
            acc.s.push(image);
          } else if (size === sizeMap.l) {
            acc.l.push(image);
          } else if (size === sizeMap.xl) {
            acc.xl.push(image);
          }
          return acc;
        }, { s: [], l: [], xl: [] });
        return sortedImages;
      }
    },
    Seek: (position) => {
      Spicetify.Player.origin.seekTo(position);
    },
    Artwork: {
      Get: async (size) => {
        const psize = size === "d" ? null : size?.toLowerCase() ?? null;
        const Data = await SpotifyPlayer.Track.GetTrackInfo();
        const Images = SpotifyPlayer.Track.SortImages(Data.album.cover_group.image);
        switch (psize) {
          case "s":
            return `spotify:image:${Images.s[0].file_id}`;
          case "l":
            return `spotify:image:${Images.l[0].file_id}`;
          case "xl":
            return `spotify:image:${Images.xl[0].file_id}`;
          default:
            return `spotify:image:${Images.l[0].file_id}`;
        }
      }
    },
    GetSongName: async () => {
      const Data = await SpotifyPlayer.Track.GetTrackInfo();
      return Data.name;
    },
    GetAlbumName: () => {
      return Spicetify.Player.data.item.metadata.album_title;
    },
    GetSongId: () => {
      return Spicetify.Player.data.item.uri?.split(":")[2] ?? null;
    },
    GetArtists: async () => {
      const data = await SpotifyPlayer.Track.GetTrackInfo();
      return data?.artist?.map((a2) => a2.name) ?? [];
    },
    JoinArtists: (artists) => {
      return artists?.join(", ") ?? null;
    },
    IsPodcast: false,
    _DEPRECATED_: {
      GetTrackPosition: _DEPRECATED___GetProgress
    },
    Pause: Spicetify.Player.pause,
    Play: Spicetify.Player.play,
    Skip: {
      Next: Spicetify.Player.next,
      Prev: Spicetify.Player.back
    },
    LoopType: "none",
    ShuffleType: "none"
  };

  // node_modules/@spikerko/web-modules/UniqueId.js
  var GeneratedIds = /* @__PURE__ */ new Set();
  function GetUniqueId() {
    while (true) {
      const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c2) {
        let r2 = Math.random() * 16 | 0, v2 = c2 == "x" ? r2 : r2 & 3 | 8;
        return v2.toString(16);
      });
      if (GeneratedIds.has(id) === false) {
        GeneratedIds.add(id);
        return id;
      }
    }
  }

  // node_modules/@spikerko/web-modules/FreeArray.js
  var FreeArray = class {
    Items;
    DestroyedState;
    constructor() {
      this.Items = /* @__PURE__ */ new Map();
      this.DestroyedState = false;
    }
    Push(item) {
      const key = GetUniqueId();
      this.Items.set(key, item);
      return key;
    }
    Get(key) {
      return this.Items.get(key);
    }
    Remove(key) {
      const item = this.Items.get(key);
      if (item !== void 0) {
        this.Items.delete(key);
        return item;
      }
    }
    GetIterator() {
      return this.Items.entries();
    }
    IsDestroyed() {
      return this.DestroyedState;
    }
    Destroy() {
      if (this.DestroyedState) {
        return;
      }
      this.DestroyedState = true;
    }
  };

  // node_modules/@spikerko/web-modules/Signal.js
  var Connection = class {
    ConnectionReferences;
    Location;
    Disconnected;
    constructor(connections, callback) {
      this.ConnectionReferences = connections;
      this.Disconnected = false;
      this.Location = connections.Push({
        Callback: callback,
        Connection: this
      });
    }
    Disconnect() {
      if (this.Disconnected) {
        return;
      }
      this.Disconnected = true;
      this.ConnectionReferences.Remove(this.Location);
    }
    IsDisconnected() {
      return this.Disconnected;
    }
  };
  var Event2 = class {
    Signal;
    constructor(signal) {
      this.Signal = signal;
    }
    Connect(callback) {
      return this.Signal.Connect(callback);
    }
    IsDestroyed() {
      return this.Signal.IsDestroyed();
    }
  };
  var Signal = class {
    ConnectionReferences;
    DestroyedState;
    constructor() {
      this.ConnectionReferences = new FreeArray();
      this.DestroyedState = false;
    }
    Connect(callback) {
      if (this.DestroyedState) {
        throw "Cannot connect to a Destroyed Signal";
      }
      return new Connection(this.ConnectionReferences, callback);
    }
    Fire(...args) {
      if (this.DestroyedState) {
        throw "Cannot fire a Destroyed Signal";
      }
      for (const [_2, reference] of this.ConnectionReferences.GetIterator()) {
        reference.Callback(...args);
      }
    }
    GetEvent() {
      return new Event2(this);
    }
    IsDestroyed() {
      return this.DestroyedState;
    }
    Destroy() {
      if (this.DestroyedState) {
        return;
      }
      for (const [_2, reference] of this.ConnectionReferences.GetIterator()) {
        reference.Connection.Disconnect();
      }
      this.DestroyedState = true;
    }
  };
  var IsConnection = (value) => {
    return value instanceof Connection;
  };

  // node_modules/@spikerko/web-modules/Maid.js
  var IsGiveable = (item) => {
    return "Destroy" in item;
  };
  var Maid = class {
    Items;
    DestroyedState;
    DestroyingSignal;
    CleanedSignal;
    DestroyedSignal;
    Destroying;
    Cleaned;
    Destroyed;
    constructor() {
      this.Items = /* @__PURE__ */ new Map();
      this.DestroyedState = false;
      {
        this.DestroyingSignal = new Signal();
        this.CleanedSignal = new Signal();
        this.DestroyedSignal = new Signal();
        this.Destroying = this.DestroyingSignal.GetEvent();
        this.Cleaned = this.CleanedSignal.GetEvent();
        this.Destroyed = this.DestroyedSignal.GetEvent();
      }
    }
    CleanItem(item) {
      if (IsGiveable(item)) {
        item.Destroy();
      } else if (IsScheduled(item)) {
        Cancel(item);
      } else if (item instanceof MutationObserver || item instanceof ResizeObserver) {
        item.disconnect();
      } else if (IsConnection(item)) {
        item.Disconnect();
      } else if (item instanceof Element) {
        item.remove();
      } else if (typeof item === "function") {
        item();
      } else {
        console.warn("UNSUPPORTED MAID ITEM", typeof item, item);
      }
    }
    Give(item, key) {
      if (this.DestroyedState) {
        this.CleanItem(item);
        return item;
      }
      const finalKey = key ?? GetUniqueId();
      if (this.Has(finalKey)) {
        this.Clean(finalKey);
      }
      this.Items.set(finalKey, item);
      return item;
    }
    GiveItems(...args) {
      for (const item of args) {
        this.Give(item);
      }
      return args;
    }
    Get(key) {
      return this.DestroyedState ? void 0 : this.Items.get(key);
    }
    Has(key) {
      return this.DestroyedState ? false : this.Items.has(key);
    }
    Clean(key) {
      if (this.DestroyedState) {
        return;
      }
      const item = this.Items.get(key);
      if (item !== void 0) {
        this.Items.delete(key);
        this.CleanItem(item);
      }
    }
    CleanUp() {
      if (this.DestroyedState) {
        return;
      }
      for (const [key, _2] of this.Items) {
        this.Clean(key);
      }
      if (this.DestroyedState === false) {
        this.CleanedSignal.Fire();
      }
    }
    IsDestroyed() {
      return this.DestroyedState;
    }
    Destroy() {
      if (this.DestroyedState === false) {
        this.DestroyingSignal.Fire();
        this.CleanUp();
        this.DestroyedState = true;
        this.DestroyedSignal.Fire();
        this.DestroyingSignal.Destroy();
        this.CleanedSignal.Destroy();
        this.DestroyedSignal.Destroy();
      }
    }
  };

  // src/utils/IntervalManager.ts
  var IntervalManager = class {
    constructor(duration, callback) {
      if (isNaN(duration)) {
        throw new Error("Duration cannot be NaN.");
      }
      this.maid = new Maid();
      this.callback = callback;
      this.duration = duration === Infinity ? 0 : duration * 1e3;
      this.lastTimestamp = null;
      this.animationFrameId = null;
      this.Running = false;
      this.Destroyed = false;
    }
    Start() {
      if (this.Destroyed) {
        console.warn("Cannot start; IntervalManager has been destroyed.");
        return;
      }
      if (this.Running) {
        console.warn("Interval is already running.");
        return;
      }
      this.Running = true;
      this.lastTimestamp = null;
      const loop = (timestamp) => {
        if (!this.Running || this.Destroyed)
          return;
        if (this.lastTimestamp === null) {
          this.lastTimestamp = timestamp;
        }
        const elapsed = timestamp - this.lastTimestamp;
        if (this.duration === 0 || elapsed >= this.duration) {
          this.callback();
          this.lastTimestamp = this.duration === 0 ? null : timestamp;
        }
        this.animationFrameId = requestAnimationFrame(loop);
      };
      this.animationFrameId = requestAnimationFrame(loop);
      this.maid.Give(() => this.Stop());
    }
    Stop() {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
        this.Running = false;
        this.lastTimestamp = null;
      }
    }
    Restart() {
      if (this.Destroyed) {
        console.warn("Cannot restart; IntervalManager has been destroyed.");
        return;
      }
      this.Stop();
      this.Start();
    }
    Destroy() {
      if (this.Destroyed) {
        console.warn("IntervalManager is already destroyed.");
        return;
      }
      this.Stop();
      this.maid.CleanUp();
      this.Destroyed = true;
      this.Running = false;
    }
  };

  // src/utils/Lyrics/Animator/Shared.ts
  var IdleLyricsScale = 0.95;
  var IdleEmphasisLyricsScale = 0.95;
  var timeOffset = 0;
  var BlurMultiplier = 0.5;

  // src/utils/Lyrics/Animator/Lyrics/LyricsAnimator.ts
  var Blurring_LastLine = null;
  function setBlurringLastLine(c2) {
    Blurring_LastLine = c2;
  }
  function Animate(position) {
    const CurrentLyricsType = Defaults_default.CurrentLyricsType;
    const edtrackpos = position + timeOffset;
    if (!CurrentLyricsType || CurrentLyricsType === "None")
      return;
    const Credits = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits"
    );
    const applyBlur = (arr, activeIndex, BlurMultiplier2) => {
      for (let i2 = activeIndex + 1; i2 < arr.length; i2++) {
        const blurAmount = BlurMultiplier2 * (i2 - activeIndex);
        if (arr[i2].Status === "Active") {
          arr[i2].HTMLElement.style.setProperty("--BlurAmount", `0px`);
        } else {
          if (!SpotifyPlayer.IsPlaying) {
            arr[i2].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i2].HTMLElement.style.setProperty(
              "--BlurAmount",
              `${blurAmount >= 5 ? 5 : blurAmount}px`
            );
          }
        }
      }
      for (let i2 = activeIndex - 1; i2 >= 0; i2--) {
        const blurAmount = BlurMultiplier2 * (activeIndex - i2);
        if (arr[i2].Status === "Active") {
          arr[i2].HTMLElement.style.setProperty("--BlurAmount", `0px`);
        } else {
          if (!SpotifyPlayer.IsPlaying) {
            arr[i2].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i2].HTMLElement.style.setProperty(
              "--BlurAmount",
              `${blurAmount >= 5 ? 5 : blurAmount}px`
            );
          }
        }
      }
    };
    const calculateOpacity = (percentage, word) => {
      if (word?.BGWord)
        return 0;
      if (percentage <= 0.5) {
        return percentage * 100;
      } else {
        return (1 - percentage) * 100;
      }
    };
    if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
        if (line.Status === "Active") {
          if (!SpotifyPlayer.IsPlaying) {
            applyBlur(arr, index, BlurMultiplier);
          }
          if (Blurring_LastLine !== index) {
            applyBlur(arr, index, BlurMultiplier);
            Blurring_LastLine = index;
          }
          if (!line.HTMLElement.classList.contains("Active")) {
            line.HTMLElement.classList.add("Active");
          }
          if (line.HTMLElement.classList.contains("NotSung")) {
            line.HTMLElement.classList.remove("NotSung");
          }
          if (line.HTMLElement.classList.contains("Sung")) {
            line.HTMLElement.classList.remove("Sung");
          }
          if (line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("OverridenByScroller");
          }
          const words = line.Syllables.Lead;
          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            const isLetterGroup = word?.LetterGroup;
            const isDot = word?.Dot;
            if (word.Status === "Active") {
              const totalDuration = word.EndTime - word.StartTime;
              const elapsedDuration = edtrackpos - word.StartTime;
              const percentage = Math.max(
                0,
                Math.min(elapsedDuration / totalDuration, 1)
              );
              const blurRadius = 4 + (16 - 4) * percentage;
              const textShadowOpacity = calculateOpacity(percentage, word) * 0.4;
              const translateY = 0.01 + (-0.038 - 0.01) * percentage;
              const scale = IdleLyricsScale + (1.017 - IdleLyricsScale) * percentage;
              const gradientPosition = percentage * 100;
              if (isLetterGroup) {
                const emphasisBlurRadius = 6 + (18 - 6) * percentage;
                const emphasisTranslateY = 0.02 + (-0.065 - 0.02) * percentage;
                const emphasisScale = IdleEmphasisLyricsScale + (1.023 - IdleEmphasisLyricsScale) * percentage;
                const emphasisTextShadowOpacity = calculateOpacity(percentage, word) * 5;
                for (let k2 = 0; k2 < word.Letters.length; k2++) {
                  const letter = word.Letters[k2];
                  if (letter.Status === "Active") {
                    const totalDuration2 = letter.EndTime - letter.StartTime;
                    const elapsedDuration2 = edtrackpos - letter.StartTime;
                    const percentage2 = Math.max(
                      0,
                      Math.min(elapsedDuration2 / totalDuration2, 1)
                    );
                    let translateY2;
                    if (percentage2 <= 0.5) {
                      translateY2 = 0 + (-0.1 - 0) * (percentage2 / 0.5);
                    } else {
                      translateY2 = -0.1 + (0 - -0.1) * ((percentage2 - 0.5) / 0.5);
                    }
                    const letterGradientPosition = `${percentage2 * 100}%`;
                    letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY2}))`;
                    letter.HTMLElement.style.scale = `${emphasisScale * 1.04}`;
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      `${emphasisBlurRadius}px`
                    );
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      `${emphasisTextShadowOpacity}%`
                    );
                    letter.HTMLElement.style.setProperty(
                      "--gradient-position",
                      letterGradientPosition
                    );
                  } else if (letter.Status === "NotSung") {
                    if (letter.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.02))") {
                      letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                    }
                    if (letter.HTMLElement.style.getPropertyValue("scale") !== IdleLyricsScale) {
                      letter.HTMLElement.style.scale = IdleLyricsScale;
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--text-shadow-blur-radius"
                    ) !== "4px") {
                      letter.HTMLElement.style.setProperty(
                        "--text-shadow-blur-radius",
                        "4px"
                      );
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--text-shadow-opacity"
                    ) !== "0%") {
                      letter.HTMLElement.style.setProperty(
                        "--text-shadow-opacity",
                        "0%"
                      );
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--gradient-position"
                    ) !== "-20%") {
                      letter.HTMLElement.style.setProperty(
                        "--gradient-position",
                        "-20%"
                      );
                    }
                  } else if (letter.Status === "Sung") {
                    const NextLetter = word.Letters[k2 + 1] ?? null;
                    if (NextLetter) {
                      const totalDuration2 = NextLetter.EndTime - NextLetter.StartTime;
                      const elapsedDuration2 = edtrackpos - NextLetter.StartTime;
                      const percentage2 = Math.max(
                        0,
                        Math.min(elapsedDuration2 / totalDuration2, 1)
                      );
                      const translateY2 = 0.02 + (-0.065 - 0.02) * percentage2;
                      if (NextLetter.Status === "Active") {
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${Math.abs(
                          translateY2 * 0.8
                        )}))`;
                        letter.HTMLElement.style.setProperty(
                          "--text-shadow-opacity",
                          `${percentage2 * 100 * 0.85}%`
                        );
                      } else {
                        if (letter.HTMLElement.style.getPropertyValue(
                          "transform"
                        ) !== "translateY(calc(var(--DefaultLyricsSize) * 0))") {
                          letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                        }
                      }
                      if (letter.HTMLElement.style.getPropertyValue(
                        "--text-shadow-opacity"
                      ) !== "50%") {
                        letter.HTMLElement.style.setProperty(
                          "--text-shadow-opacity",
                          `50%`
                        );
                      }
                    } else {
                      if (letter.HTMLElement.style.getPropertyValue(
                        "--text-shadow-opacity"
                      ) !== "50%") {
                        letter.HTMLElement.style.setProperty(
                          "--text-shadow-opacity",
                          `50%`
                        );
                      }
                      if (letter.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0))") {
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                      }
                    }
                    if (letter.HTMLElement.style.getPropertyValue("scale") !== "1") {
                      letter.HTMLElement.style.scale = "1";
                    }
                    if (letter.HTMLElement.style.getPropertyValue(
                      "--gradient-position"
                    ) !== "100%") {
                      letter.HTMLElement.style.setProperty(
                        "--gradient-position",
                        "100%"
                      );
                    }
                  }
                }
                if (word.HTMLElement.style.getPropertyValue("scale") !== `${emphasisScale}`) {
                  word.HTMLElement.style.scale = `${emphasisScale}`;
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`) {
                  word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`;
                }
                word.scale = emphasisScale;
                word.glow = 0;
              } else {
                if (isDot) {
                  word.HTMLElement.style.setProperty(
                    "--opacity-size",
                    `${0.2 + percentage}`
                  );
                  let translateY2;
                  if (percentage <= 0) {
                    translateY2 = 0 + (-0.07 - 0) * percentage;
                  } else if (percentage <= 0.88) {
                    translateY2 = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
                  } else {
                    translateY2 = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
                  }
                  word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY2}))`;
                  const scale2 = 0.75 + (1 - 0.75) * percentage;
                  word.HTMLElement.style.scale = `${0.2 + scale2}`;
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-blur-radius",
                    `${blurRadius}px`
                  );
                  const textShadowOpacity2 = calculateOpacity(percentage, word) * 1.5;
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-opacity",
                    `${textShadowOpacity2}%`
                  );
                  word.scale = scale2;
                  word.glow = textShadowOpacity2 / 100;
                } else {
                  word.HTMLElement.style.setProperty(
                    "--gradient-position",
                    `${gradientPosition}%`
                  );
                  if (totalDuration > 230) {
                    word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                    word.HTMLElement.style.scale = `${scale}`;
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      `${blurRadius}px`
                    );
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      `${textShadowOpacity}%`
                    );
                    word.scale = scale;
                    word.glow = textShadowOpacity / 100;
                  } else {
                    const blurRadius2 = 4 + (0 - 4) * percentage;
                    const textShadowOpacity2 = 0;
                    const translateY2 = 0.01 + (0 - 0.01) * percentage;
                    const scale2 = IdleLyricsScale + (1 - IdleLyricsScale) * percentage;
                    word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY2}))`;
                    word.HTMLElement.style.scale = `${scale2}`;
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      `${blurRadius2}px`
                    );
                    word.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      `${textShadowOpacity2}%`
                    );
                    word.scale = scale2;
                    word.glow = textShadowOpacity2;
                  }
                }
                if (totalDuration > 230) {
                  word.translateY = translateY;
                } else {
                  word.translateY = 0;
                }
                if (!isDot && !isLetterGroup) {
                  word.AnimatorStoreTime_glow = void 0;
                  word.AnimatorStoreTime_translateY = void 0;
                  word.AnimatorStoreTime_scale = void 0;
                }
              }
            } else if (word.Status === "NotSung") {
              if (isLetterGroup) {
                for (let k2 = 0; k2 < word.Letters.length; k2++) {
                  const letter = word.Letters[k2];
                  if (letter.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.02))") {
                    letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                  }
                  if (letter.HTMLElement.style.getPropertyValue("scale") !== IdleEmphasisLyricsScale) {
                    letter.HTMLElement.style.scale = IdleEmphasisLyricsScale;
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-blur-radius"
                  ) !== "4px") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      "4px"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-opacity"
                  ) !== "0%") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      "0%"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--gradient-position"
                  ) !== "-20%") {
                    letter.HTMLElement.style.setProperty(
                      "--gradient-position",
                      "-20%"
                    );
                  }
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.02))") {
                  word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                }
                word.translateY = 0.02;
              } else if (!isDot) {
                if (word.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--DefaultLyricsSize) * 0.01))") {
                  word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.01))";
                }
                word.translateY = 0.01;
              }
              if (isDot) {
                if (word.HTMLElement.style.getPropertyValue("--opacity-size") !== `${0.2}`) {
                  word.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== "translateY(calc(var(--font-size) * 0.01))") {
                  word.HTMLElement.style.transform = "translateY(calc(var(--font-size) * 0.01))";
                }
                word.translateY = 0.01;
                if (word.HTMLElement.style.getPropertyValue("scale") !== "0.75") {
                  word.HTMLElement.style.scale = "0.75";
                }
              } else {
                if (word.HTMLElement.style.getPropertyValue("scale") !== (isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale)) {
                  word.HTMLElement.style.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                }
                word.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                if (word.HTMLElement.style.getPropertyValue(
                  "--gradient-position"
                ) !== "-20%") {
                  word.HTMLElement.style.setProperty(
                    "--gradient-position",
                    "-20%"
                  );
                }
              }
              if (!isDot && !isLetterGroup) {
                word.AnimatorStoreTime_glow = void 0;
                word.glow = 0;
                word.AnimatorStoreTime_translateY = void 0;
                word.translateY = 0.01;
                word.AnimatorStoreTime_scale = void 0;
                word.scale = IdleLyricsScale;
              }
              if (word.HTMLElement.style.getPropertyValue(
                "--text-shadow-blur-radius"
              ) !== "4px") {
                word.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  "4px"
                );
              }
              if (word.HTMLElement.style.getPropertyValue(
                "--text-shadow-opacity"
              ) !== "0%") {
                word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
              }
              word.glow = 0;
            } else if (word.Status === "Sung") {
              if (isLetterGroup) {
                for (let k2 = 0; k2 < word.Letters.length; k2++) {
                  const letter = word.Letters[k2];
                  if (letter.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * 0))`) {
                    letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                  }
                  if (letter.HTMLElement.style.getPropertyValue("scale") !== "1") {
                    letter.HTMLElement.style.scale = "1";
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-blur-radius"
                  ) !== "4px") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-blur-radius",
                      "4px"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--text-shadow-opacity"
                  ) !== "0%") {
                    letter.HTMLElement.style.setProperty(
                      "--text-shadow-opacity",
                      "0%"
                    );
                  }
                  if (letter.HTMLElement.style.getPropertyValue(
                    "--gradient-position"
                  ) !== "100%") {
                    letter.HTMLElement.style.setProperty(
                      "--gradient-position",
                      "100%"
                    );
                  }
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * 0))`) {
                  word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                }
                if (word.HTMLElement.style.getPropertyValue("scale") !== "1") {
                  word.HTMLElement.style.scale = "1";
                }
              }
              if (isDot) {
                if (word.HTMLElement.style.getPropertyValue("--opacity-size") !== `${0.2 + 1}`) {
                  word.HTMLElement.style.setProperty(
                    "--opacity-size",
                    `${0.2 + 1}`
                  );
                }
                if (word.HTMLElement.style.getPropertyValue("transform") !== `translateY(calc(var(--font-size) * 0))`) {
                  word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                }
                if (word.HTMLElement.style.getPropertyValue("scale") !== "1.2") {
                  word.HTMLElement.style.scale = "1.2";
                }
                if (word.HTMLElement.style.getPropertyValue(
                  "--text-shadow-opacity"
                ) !== `${50}%`) {
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-opacity",
                    `${50}%`
                  );
                }
                if (word.HTMLElement.style.getPropertyValue(
                  "--text-shadow-blur-radius"
                ) !== `${12}px`) {
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-blur-radius",
                    `${12}px`
                  );
                }
              } else if (!isLetterGroup) {
                if (word.HTMLElement.style.getPropertyValue(
                  "--text-shadow-blur-radius"
                ) !== "4px") {
                  word.HTMLElement.style.setProperty(
                    "--text-shadow-blur-radius",
                    "4px"
                  );
                }
                const element = word.HTMLElement;
                const transform = word.translateY;
                const currentTranslateY = transform;
                const currentScale = word.scale;
                const currentGlow = word.glow;
                if (!word.AnimatorStoreTime_translateY) {
                  word.AnimatorStoreTime_translateY = performance.now();
                }
                if (!word.AnimatorStoreTime_scale) {
                  word.AnimatorStoreTime_scale = performance.now();
                }
                if (!word.AnimatorStoreTime_glow) {
                  word.AnimatorStoreTime_glow = performance.now();
                }
                const now2 = performance.now();
                const elapsed_translateY = now2 - word.AnimatorStoreTime_translateY;
                const elapsed_scale = now2 - word.AnimatorStoreTime_scale;
                const elapsed_glow = now2 - word.AnimatorStoreTime_glow;
                const duration_translateY = 550;
                const progress_translateY = Math.min(
                  elapsed_translateY / duration_translateY,
                  1
                );
                const duration_scale = 1100;
                const progress_scale = Math.min(
                  elapsed_scale / duration_scale,
                  1
                );
                const duration_glow = 250;
                const progress_glow = Math.min(elapsed_glow / duration_glow, 1);
                const targetTranslateY = 5e-4;
                const targetScale = 1;
                const targetGlow = 0;
                const interpolate = (start, end, progress) => start + (end - start) * progress;
                const newTranslateY = interpolate(
                  currentTranslateY,
                  targetTranslateY,
                  progress_translateY
                );
                const newScale = interpolate(
                  currentScale,
                  targetScale,
                  progress_scale
                );
                const newGlow = interpolate(
                  currentGlow,
                  targetGlow,
                  progress_glow
                );
                if (element.style.getPropertyValue("--text-shadow-opacity") !== `${newGlow * 100}%`) {
                  element.style.setProperty(
                    "--text-shadow-opacity",
                    `${newGlow * 100}%`
                  );
                }
                if (element.style.getPropertyValue("transform") !== `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`) {
                  element.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`;
                }
                if (element.style.getPropertyValue("scale") !== `${newScale}`) {
                  element.style.scale = `${newScale}`;
                }
                if (progress_glow === 1) {
                  word.AnimatorStoreTime_glow = void 0;
                  word.glow = 0;
                }
                if (progress_translateY === 1) {
                  word.AnimatorStoreTime_translateY = void 0;
                  word.translateY = 0;
                }
                if (progress_scale === 1) {
                  word.AnimatorStoreTime_scale = void 0;
                  word.scale = 1;
                }
              }
              if (word.HTMLElement.style.getPropertyValue("--gradient-position") !== "100%") {
                word.HTMLElement.style.setProperty("--gradient-position", "100%");
              }
            }
          }
          if (Credits) {
            Credits.classList.remove("Active");
          }
        } else if (line.Status === "NotSung") {
          line.HTMLElement.classList.add("NotSung");
          line.HTMLElement.classList.remove("Sung");
          if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("Active");
          }
        } else if (line.Status === "Sung") {
          line.HTMLElement.classList.add("Sung");
          line.HTMLElement.classList.remove("Active", "NotSung");
          if (arr.length === index + 1) {
            if (Credits) {
              Credits.classList.add("Active");
            }
          }
        }
      }
    } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
        if (line.Status === "Active") {
          if (!SpotifyPlayer.IsPlaying) {
            applyBlur(arr, index, BlurMultiplier);
          }
          if (Blurring_LastLine !== index) {
            applyBlur(arr, index, BlurMultiplier);
            Blurring_LastLine = index;
          }
          if (!line.HTMLElement.classList.contains("Active")) {
            line.HTMLElement.classList.add("Active");
          }
          if (line.HTMLElement.classList.contains("NotSung")) {
            line.HTMLElement.classList.remove("NotSung");
          }
          if (line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("OverridenByScroller");
          }
          if (line.HTMLElement.classList.contains("Sung")) {
            line.HTMLElement.classList.remove("Sung");
          }
          const totalDuration = line.EndTime - line.StartTime;
          const elapsedDuration = edtrackpos - line.StartTime;
          const percentage = 1;
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i2 = 0; i2 < Array2.length; i2++) {
              const dot = Array2[i2];
              if (dot.Status === "Active") {
                const totalDuration2 = dot.EndTime - dot.StartTime;
                const elapsedDuration2 = edtrackpos - dot.StartTime;
                const percentage2 = Math.max(
                  0,
                  Math.min(elapsedDuration2 / totalDuration2, 1)
                );
                const blurRadius = 4 + (16 - 4) * percentage2;
                const textShadowOpacity = calculateOpacity(percentage2, dot) * 1.5;
                const scale = 0.75 + (1 - 0.75) * percentage2;
                let translateY;
                if (percentage2 <= 0) {
                  translateY = 0 + (-0.07 - 0) * percentage2;
                } else if (percentage2 <= 0.88) {
                  translateY = -0.07 + (0.2 - -0.07) * ((percentage2 - 0.88) / 0.88);
                } else {
                  translateY = 0.2 + (0 - 0.2) * ((percentage2 - 0.22) / 0.88);
                }
                dot.HTMLElement.style.setProperty(
                  "--opacity-size",
                  `${0.2 + percentage2}`
                );
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;
                dot.HTMLElement.style.scale = `${0.2 + scale}`;
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  `${blurRadius}px`
                );
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-opacity",
                  `${textShadowOpacity}%`
                );
              } else if (dot.Status === "NotSung") {
                dot.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                dot.HTMLElement.style.scale = `0.75`;
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  `4px`
                );
                dot.HTMLElement.style.setProperty("--text-shadow-opacity", `0%`);
              } else if (dot.Status === "Sung") {
                dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + 1}`);
                dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                dot.HTMLElement.style.scale = `1.2`;
                dot.HTMLElement.style.setProperty(
                  "--text-shadow-blur-radius",
                  `12px`
                );
                dot.HTMLElement.style.setProperty("--text-shadow-opacity", `50%`);
              }
            }
          } else {
            line.HTMLElement.style.setProperty(
              "--gradient-position",
              `${percentage * 100}%`
            );
          }
        } else if (line.Status === "NotSung") {
          if (!line.HTMLElement.classList.contains("NotSung")) {
            line.HTMLElement.classList.add("NotSung");
          }
          line.HTMLElement.classList.remove("Sung");
          if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
            line.HTMLElement.classList.remove("Active");
          }
          line.HTMLElement.style.setProperty("--gradient-position", `0%`);
        } else if (line.Status === "Sung") {
          if (!line.HTMLElement.classList.contains("Sung")) {
            line.HTMLElement.classList.add("Sung");
          }
          line.HTMLElement.classList.remove("Active", "NotSung");
          line.HTMLElement.style.setProperty("--gradient-position", `100%`);
        }
      }
    }
  }

  // src/utils/Lyrics/Animator/Lyrics/LyricsSetter.ts
  function TimeSetter(PreCurrentPosition) {
    const CurrentPosition = PreCurrentPosition + timeOffset;
    const CurrentLyricsType = Defaults_default.CurrentLyricsType;
    if (CurrentLyricsType && CurrentLyricsType === "None")
      return;
    const lines = LyricsObject.Types[CurrentLyricsType].Lines;
    if (CurrentLyricsType === "Syllable") {
      for (let i2 = 0; i2 < lines.length; i2++) {
        const line = lines[i2];
        const lineTimes = {
          start: line.StartTime,
          end: line.EndTime,
          total: line.EndTime - line.StartTime
        };
        if (lineTimes.start <= CurrentPosition && CurrentPosition <= lineTimes.end) {
          line.Status = "Active";
          const words = line.Syllables.Lead;
          for (let j2 = 0; j2 < words.length; j2++) {
            const word = words[j2];
            if (word.StartTime <= CurrentPosition && CurrentPosition <= word.EndTime) {
              word.Status = "Active";
            } else if (word.StartTime >= CurrentPosition) {
              word.Status = "NotSung";
            } else if (word.EndTime <= CurrentPosition) {
              word.Status = "Sung";
            }
            if (word?.LetterGroup) {
              for (let k2 = 0; k2 < word.Letters.length; k2++) {
                const letter = word.Letters[k2];
                if (letter.StartTime <= CurrentPosition && CurrentPosition <= letter.EndTime) {
                  letter.Status = "Active";
                } else if (letter.StartTime >= CurrentPosition) {
                  letter.Status = "NotSung";
                } else if (letter.EndTime <= CurrentPosition) {
                  letter.Status = "Sung";
                }
              }
            }
          }
        } else if (lineTimes.start >= CurrentPosition) {
          line.Status = "NotSung";
          const words = line.Syllables.Lead;
          for (let j2 = 0; j2 < words.length; j2++) {
            const word = words[j2];
            word.Status = "NotSung";
            if (word?.LetterGroup) {
              for (let k2 = 0; k2 < word.Letters.length; k2++) {
                const letter = word.Letters[k2];
                letter.Status = "NotSung";
              }
            }
          }
        } else if (lineTimes.end <= CurrentPosition) {
          line.Status = "Sung";
          const words = line.Syllables.Lead;
          for (let j2 = 0; j2 < words.length; j2++) {
            const word = words[j2];
            word.Status = "Sung";
            if (word?.LetterGroup) {
              for (let k2 = 0; k2 < word.Letters.length; k2++) {
                const letter = word.Letters[k2];
                letter.Status = "Sung";
              }
            }
          }
        }
      }
    } else if (CurrentLyricsType === "Line") {
      for (let i2 = 0; i2 < lines.length; i2++) {
        const line = lines[i2];
        const lineTimes = {
          start: line.StartTime,
          end: line.EndTime,
          total: line.EndTime - line.StartTime
        };
        if (lineTimes.start <= CurrentPosition && CurrentPosition <= lineTimes.end) {
          line.Status = "Active";
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i3 = 0; i3 < Array2.length; i3++) {
              const dot = Array2[i3];
              if (dot.StartTime <= CurrentPosition && CurrentPosition <= dot.EndTime) {
                dot.Status = "Active";
              } else if (dot.StartTime >= CurrentPosition) {
                dot.Status = "NotSung";
              } else if (dot.EndTime <= CurrentPosition) {
                dot.Status = "Sung";
              }
            }
          }
        } else if (lineTimes.start >= CurrentPosition) {
          line.Status = "NotSung";
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i3 = 0; i3 < Array2.length; i3++) {
              const dot = Array2[i3];
              dot.Status = "NotSung";
            }
          }
        } else if (lineTimes.end <= CurrentPosition) {
          line.Status = "Sung";
          if (line.DotLine) {
            const Array2 = line.Syllables.Lead;
            for (let i3 = 0; i3 < Array2.length; i3++) {
              const dot = Array2[i3];
              dot.Status = "Sung";
            }
          }
        }
      }
    }
  }

  // src/utils/Lyrics/Animator/Main.ts
  var Lyrics = {
    Animate,
    TimeSetter
  };

  // src/utils/Lyrics/lyrics.ts
  var ScrollingIntervalTime = Infinity;
  var lyricsBetweenShow = 3;
  var LyricsObject = {
    Types: {
      Syllable: {
        Lines: []
      },
      Line: {
        Lines: []
      },
      Static: {
        Lines: []
      }
    }
  };
  var CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;
  var LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;
  function SetWordArrayInCurentLine() {
    CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables = {};
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead = [];
  }
  function SetWordArrayInCurentLine_LINE_SYNCED() {
    LINE_SYNCED_CurrentLineLyricsObject = LyricsObject.Types.Line.Lines.length - 1;
    LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables = {};
    LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead = [];
  }
  function ClearLyricsContentArrays() {
    LyricsObject.Types.Syllable.Lines = [];
    LyricsObject.Types.Line.Lines = [];
    LyricsObject.Types.Static.Lines = [];
  }
  var THROTTLE_TIME = 0;
  var LyricsInterval = new IntervalManager(THROTTLE_TIME, () => {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const progress = SpotifyPlayer.GetTrackPosition();
    Lyrics.TimeSetter(progress);
    Lyrics.Animate(progress);
  }).Start();
  var LinesEvListenerMaid;
  var LinesEvListenerExists;
  function LinesEvListener(e2) {
    if (e2.target.classList.contains("line")) {
      let startTime;
      LyricsObject.Types.Line.Lines.forEach((line) => {
        if (line.HTMLElement === e2.target) {
          startTime = line.StartTime;
        }
      });
      if (startTime) {
        Spicetify.Player.seek(startTime);
      }
    } else if (e2.target.classList.contains("word")) {
      let startTime;
      LyricsObject.Types.Syllable.Lines.forEach((line) => {
        line.Syllables.Lead.forEach((word) => {
          if (word.HTMLElement === e2.target) {
            startTime = line.StartTime;
          }
        });
      });
      if (startTime) {
        Spicetify.Player.seek(startTime);
      }
    } else if (e2.target.classList.contains("Emphasis")) {
      let startTime;
      LyricsObject.Types.Syllable.Lines.forEach((line) => {
        line.Syllables.Lead.forEach((word) => {
          if (word?.Letters) {
            word.Letters.forEach((letter) => {
              if (letter.HTMLElement === e2.target) {
                startTime = line.StartTime;
              }
            });
          }
        });
      });
      if (startTime) {
        Spicetify.Player.seek(startTime);
      }
    }
  }
  function addLinesEvListener() {
    if (LinesEvListenerExists)
      return;
    LinesEvListenerExists = true;
    LinesEvListenerMaid = new Maid();
    const el = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (!el)
      return;
    const evl = el.addEventListener("click", LinesEvListener);
    LinesEvListenerMaid.Give(evl);
  }
  function removeLinesEvListener() {
    if (!LinesEvListenerExists)
      return;
    LinesEvListenerExists = false;
    const el = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (!el)
      return;
    el.removeEventListener("click", LinesEvListener);
    LinesEvListenerMaid.Destroy();
  }

  // src/utils/Animator.ts
  var Animator = class {
    constructor(from, to2, duration) {
      this.startTime = null;
      this.pausedTime = null;
      this.animationFrameId = null;
      this.events = {};
      this.isDestroyed = false;
      this.reversed = false;
      this.from = from;
      this.to = to2;
      this.duration = duration * 1e3;
      this.currentProgress = from;
      this.maid = new Maid();
    }
    emit(event, progress) {
      if (this.events[event] && !this.isDestroyed) {
        const callback = this.events[event];
        callback?.(progress ?? this.currentProgress, this.from, this.to);
      }
    }
    on(event, callback) {
      this.events[event] = callback;
    }
    Start() {
      if (this.isDestroyed)
        return;
      this.startTime = performance.now();
      this.animate();
    }
    animate() {
      if (this.isDestroyed || this.startTime === null)
        return;
      const now2 = performance.now();
      const elapsed = now2 - this.startTime;
      const t2 = Math.min(elapsed / this.duration, 1);
      const startValue = this.reversed ? this.to : this.from;
      const endValue = this.reversed ? this.from : this.to;
      this.currentProgress = startValue + (endValue - startValue) * t2;
      this.emit("progress", this.currentProgress);
      if (t2 < 1) {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.maid.Give(() => cancelAnimationFrame(this.animationFrameId));
      } else {
        this.emit("finish");
        this.reset();
      }
    }
    Pause() {
      if (this.isDestroyed || this.animationFrameId === null)
        return;
      cancelAnimationFrame(this.animationFrameId);
      this.pausedTime = performance.now();
      this.emit("pause", this.currentProgress);
    }
    Resume() {
      if (this.isDestroyed || this.pausedTime === null)
        return;
      const pausedDuration = performance.now() - this.pausedTime;
      if (this.startTime !== null)
        this.startTime += pausedDuration;
      this.pausedTime = null;
      this.emit("resume", this.currentProgress);
      this.animate();
    }
    Restart() {
      if (this.isDestroyed)
        return;
      this.reset();
      this.emit("restart", this.currentProgress);
      this.Start();
    }
    Reverse() {
      if (this.isDestroyed)
        return;
      this.reversed = !this.reversed;
      this.emit("reverse", this.currentProgress);
    }
    Destroy() {
      if (this.isDestroyed)
        return;
      this.emit("destroy");
      this.maid.Destroy();
      this.reset();
      this.isDestroyed = true;
    }
    reset() {
      this.startTime = null;
      this.pausedTime = null;
      this.animationFrameId = null;
    }
  };

  // src/utils/BlobURLMaker.ts
  async function BlobURLMaker(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching and converting to blob URL:", error);
      throw error;
    }
  }

  // src/components/DynamicBG/ArtistVisuals/Cache.ts
  var Cache = new SpikyCache({
    name: "SpicyLyrics-ArtistVisualsCache"
  });
  var Cache_default = Cache;

  // src/components/DynamicBG/ArtistVisuals/HeaderImage/GetHeaderUrl.ts
  function GetHeaderUrl(data) {
    if (!data)
      return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
    const HeaderImage = typeof data === "object" ? data?.Visuals?.headerImage?.sources[0]?.url : JSON.parse(data)?.Visuals?.headerImage?.sources[0]?.url;
    if (!HeaderImage)
      return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
    return `spotify:image:${HeaderImage.replace("https://i.scdn.co/image/", "")}`;
  }

  // src/components/DynamicBG/ArtistVisuals/HeaderImage/Main.ts
  var isFetching = /* @__PURE__ */ new Map();
  async function ApplyContent(CurrentSongArtist, CurrentSongUri) {
    if (!CurrentSongArtist)
      throw new Error("Invalid Song Artist");
    if (!CurrentSongUri)
      throw new Error("Invalid Song URI");
    const TrackId = CurrentSongUri.split(":")[2];
    const ArtistId = CurrentSongArtist.split(":")[2];
    if (!TrackId || !ArtistId)
      throw new Error("Invalid URIs");
    const Cached = await Main_default.Cache.get(ArtistId);
    if (Cached) {
      if (Cached.metadata.expiresIn <= Date.now()) {
        await Main_default.Cache.remove(ArtistId);
        return Continue();
      }
      if (Cached?.data) {
        return GetHeaderUrl(Cached?.data);
      }
      await Main_default.Cache.remove(ArtistId);
      return Continue();
    }
    return Continue();
    async function Continue() {
      if (isFetching.has(ArtistId)) {
        return isFetching.get(ArtistId);
      }
      const fetchPromise = (async () => {
        try {
          const [res, status] = await SpicyFetch(`artist/visuals?artist=${CurrentSongArtist}&track=${CurrentSongUri}`);
          if (status === 200) {
            await Main_default.Cache.set(ArtistId, {
              data: res ?? "",
              metadata: {
                expiresIn: Date.now() + 2592e5
              }
            });
            return GetHeaderUrl(res ?? "");
          } else {
            throw new Error(`Failed to fetch visuals: ${status}`);
          }
        } finally {
          isFetching.delete(ArtistId);
        }
      })();
      isFetching.set(ArtistId, fetchPromise);
      return fetchPromise;
    }
  }

  // src/components/DynamicBG/ArtistVisuals/Main.ts
  var ArtistVisuals = {
    Cache: Cache_default,
    ApplyContent
  };
  var Main_default = ArtistVisuals;

  // src/components/DynamicBG/dynamicBackground.ts
  async function ApplyDynamicBackground(element) {
    if (!element)
      return;
    let currentImgCover = await SpotifyPlayer.Artwork.Get("d");
    const lowQMode = storage_default.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
    const IsEpisode = Spicetify.Player.data.item.type === "episode";
    const CurrentSongArtist = IsEpisode ? null : Spicetify.Player.data?.item.artists[0].uri;
    const CurrentSongUri = Spicetify.Player.data?.item.uri;
    if (lowQModeEnabled) {
      try {
        currentImgCover = IsEpisode ? null : storage_default.get("force-cover-bg_in-lowqmode") == "true" ? currentImgCover : await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
      } catch (error) {
        console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
      }
    }
    if (lowQModeEnabled) {
      if (IsEpisode)
        return;
      const dynamicBg = document.createElement("img");
      const prevBg = element.querySelector(".spicy-dynamic-bg.lowqmode");
      if (prevBg && prevBg.getAttribute("spotifyimageurl") === currentImgCover) {
        dynamicBg.remove();
        return;
      }
      dynamicBg.classList.add("spicy-dynamic-bg", "lowqmode");
      const processedCover = `https://i.scdn.co/image/${currentImgCover.replace("spotify:image:", "")}`;
      dynamicBg.src = await BlobURLMaker(processedCover) ?? currentImgCover;
      dynamicBg.setAttribute("spotifyimageurl", currentImgCover);
      element.appendChild(dynamicBg);
      const Animator1 = new Animator(0, 1, 0.3);
      const Animator2 = new Animator(1, 0, 0.3);
      Animator1.on("progress", (progress) => {
        dynamicBg.style.opacity = progress.toString();
      });
      Animator2.on("progress", (progress) => {
        if (!prevBg)
          return;
        prevBg.style.opacity = progress.toString();
      });
      Animator1.on("finish", () => {
        dynamicBg.style.opacity = "1";
        Animator1.Destroy();
      });
      Animator2.on("finish", () => {
        prevBg?.remove();
        Animator2.Destroy();
      });
      Animator2.Start();
      Animator1.Start();
    } else {
      if (element?.querySelector(".spicy-dynamic-bg")) {
        if (element.querySelector(".spicy-dynamic-bg").getAttribute("current_tag") === currentImgCover)
          return;
        const e2 = element.querySelector(".spicy-dynamic-bg");
        e2.setAttribute("current_tag", currentImgCover);
        e2.innerHTML = `
                <img class="Front" src="${currentImgCover}" />
                <img class="Back" src="${currentImgCover}" />
                <img class="BackCenter" src="${currentImgCover}" />
            `;
        return;
      }
      const dynamicBg = document.createElement("div");
      dynamicBg.classList.add("spicy-dynamic-bg");
      dynamicBg.classList.remove("lowqmode");
      dynamicBg.setAttribute("current_tag", currentImgCover);
      dynamicBg.innerHTML = `
            <img class="Front" src="${currentImgCover}" />
            <img class="Back" src="${currentImgCover}" />
            <img class="BackCenter" src="${currentImgCover}" />
        `;
      element.appendChild(dynamicBg);
    }
  }
  async function LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri) {
    if (storage_default.get("force-cover-bg_in-lowqmode") == "true")
      return;
    try {
      return await Main_default.ApplyContent(CurrentSongArtist, CurrentSongUri);
    } catch (error) {
      console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
    }
  }

  // src/components/Styling/Icons.ts
  var TrackSkip = `
	<div class="PlaybackControl TrackSkip REPLACEME">
		<svg viewBox="0 0 35 20" xmlns="http://www.w3.org/2000/svg">
			<path d="M 19.467 19.905 C 20.008 19.905 20.463 19.746 21.005 19.426 L 33.61 12.023 C 34.533 11.482 35 10.817 35 9.993 C 35 9.158 34.545 8.53 33.61 7.977 L 21.005 0.574 C 20.463 0.254 19.998 0.094 19.456 0.094 C 18.374 0.094 17.475 0.917 17.475 2.418 L 17.475 9.49 C 17.315 8.898 16.873 8.408 16.135 7.977 L 3.529 0.574 C 3 0.254 2.533 0.094 1.993 0.094 C 0.911 0.094 0 0.917 0 2.418 L 0 17.582 C 0 19.083 0.91 19.906 1.993 19.906 C 2.533 19.906 3 19.746 3.529 19.426 L 16.135 12.023 C 16.861 11.593 17.315 11.088 17.475 10.485 L 17.475 17.582 C 17.475 19.083 18.386 19.906 19.467 19.906 L 19.467 19.905 Z" fill-rule="nonzero"/>
		</svg>
	</div>
`;
  var Icons = {
    LyricsPage: `
        <svg class="Svg-sc-ytk21e-0 Svg-img-16-icon" id="SpicyLyricsPageSvg" version="1.0" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <g clip-path="url(#clip0_1_2)">
                <g clip-path="url(#clip1_1_2)">
                    <path d="M167.664 32.175C163.033 27.5654 157.213 24.3179 150.845 22.7905C144.477 21.2632 137.809 21.5155 131.576 23.5194C125.343 25.5234 119.788 29.2012 115.522 34.1473C111.256 39.0935 108.446 45.1157 107.402 51.55L148.192 92.1375C154.659 91.0982 160.711 88.3022 165.682 84.0577C170.653 79.8132 174.349 74.2852 176.363 68.0832C178.377 61.8813 178.63 55.2464 177.096 48.9102C175.561 42.5741 172.297 36.7828 167.664 32.175ZM130.906 101.475L98.0051 68.725C84.8516 83.6287 71.6986 98.5328 58.5462 113.438L24.9416 151.5C22.243 154.572 20.8182 158.549 20.9557 162.627C21.0932 166.705 22.7827 170.578 25.6821 173.463C28.5815 176.348 32.4743 178.029 36.5724 178.166C40.6705 178.303 44.6678 176.885 47.7551 174.2L86.1963 140.6L130.919 101.488L130.906 101.475ZM88.445 51.175C89.5849 41.0445 93.5761 31.44 99.9594 23.4668C106.343 15.4936 114.859 9.47565 124.527 6.10546C134.196 2.73527 144.625 2.14979 154.613 4.41638C164.601 6.68297 173.744 11.7095 180.988 18.9177C188.232 26.1258 193.284 35.2226 195.562 45.1612C197.839 55.0999 197.251 65.4765 193.864 75.0971C190.477 84.7177 184.429 93.1913 176.416 99.5429C168.403 105.894 158.75 109.866 148.569 111L98.6458 154.663L60.2045 188.275C53.5213 194.108 44.8584 197.193 35.9733 196.904C27.0881 196.615 18.6462 192.974 12.3601 186.719C6.07397 180.464 2.41449 172.064 2.12407 163.223C1.83364 154.382 4.93401 145.762 10.7962 139.113L44.4134 101.05L88.445 51.175Z" />
                    <path d="M14.4253 71.9866L24.7716 82.7005L38.1583 76.1714L31.166 89.3221L41.5123 100.036L26.8445 97.4497L19.8521 110.6L17.7792 95.8513L3.11139 93.2649L16.4981 86.7358L14.4253 71.9866Z" />
                    <path d="M116.417 140.835L133.497 158.522L155.597 147.744L144.053 169.454L161.134 187.141L136.919 182.871L125.376 204.581L121.954 180.232L97.7398 175.963L119.839 165.184L116.417 140.835Z" />
                    <path d="M81.5977 24.9164L63.3254 41.3689L73.3262 63.831L52.0325 51.5371L33.7602 67.9896L38.8723 43.939L17.5786 31.6451L42.0317 29.075L47.1438 5.02446L57.1446 27.4866L81.5977 24.9164Z" />
                    <path d="M169.688 110.558L166.338 125.071L179.105 132.742L164.267 134.04L160.917 148.552L155.097 134.842L140.26 136.14L151.501 126.369L145.681 112.659L158.448 120.33L169.688 110.558Z" />
                </g>
            </g>
            <defs>
                <clipPath id="clip0_1_2">
                    <rect width="200" height="200" />
                </clipPath>
                <clipPath id="clip1_1_2">
                    <rect width="201" height="200" transform="translate(-1)"/>
                </clipPath>
            </defs>
        </svg>
    `,
    LyricsLargeIcon: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 200 200" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon" id="SpicyLyricsPageSvg">
            <g clip-path="url(#clip0_1_2)">
                <g clip-path="url(#clip1_1_2)">
                    <path d="M167.664 32.175C163.033 27.5654 157.213 24.3179 150.845 22.7905C144.477 21.2632 137.809 21.5155 131.576 23.5194C125.343 25.5234 119.788 29.2012 115.522 34.1473C111.256 39.0935 108.446 45.1157 107.402 51.55L148.192 92.1375C154.659 91.0982 160.711 88.3022 165.682 84.0577C170.653 79.8132 174.349 74.2852 176.363 68.0832C178.377 61.8813 178.63 55.2464 177.096 48.9102C175.561 42.5741 172.297 36.7828 167.664 32.175ZM130.906 101.475L98.0051 68.725C84.8516 83.6287 71.6986 98.5328 58.5462 113.438L24.9416 151.5C22.243 154.572 20.8182 158.549 20.9557 162.627C21.0932 166.705 22.7827 170.578 25.6821 173.463C28.5815 176.348 32.4743 178.029 36.5724 178.166C40.6705 178.303 44.6678 176.885 47.7551 174.2L86.1963 140.6L130.919 101.488L130.906 101.475ZM88.445 51.175C89.5849 41.0445 93.5761 31.44 99.9594 23.4668C106.343 15.4936 114.859 9.47565 124.527 6.10546C134.196 2.73527 144.625 2.14979 154.613 4.41638C164.601 6.68297 173.744 11.7095 180.988 18.9177C188.232 26.1258 193.284 35.2226 195.562 45.1612C197.839 55.0999 197.251 65.4765 193.864 75.0971C190.477 84.7177 184.429 93.1913 176.416 99.5429C168.403 105.894 158.75 109.866 148.569 111L98.6458 154.663L60.2045 188.275C53.5213 194.108 44.8584 197.193 35.9733 196.904C27.0881 196.615 18.6462 192.974 12.3601 186.719C6.07397 180.464 2.41449 172.064 2.12407 163.223C1.83364 154.382 4.93401 145.762 10.7962 139.113L44.4134 101.05L88.445 51.175Z" />
                    <path d="M14.4253 71.9866L24.7716 82.7005L38.1583 76.1714L31.166 89.3221L41.5123 100.036L26.8445 97.4497L19.8521 110.6L17.7792 95.8513L3.11139 93.2649L16.4981 86.7358L14.4253 71.9866Z" />
                    <path d="M116.417 140.835L133.497 158.522L155.597 147.744L144.053 169.454L161.134 187.141L136.919 182.871L125.376 204.581L121.954 180.232L97.7398 175.963L119.839 165.184L116.417 140.835Z" />
                    <path d="M81.5977 24.9164L63.3254 41.3689L73.3262 63.831L52.0325 51.5371L33.7602 67.9896L38.8723 43.939L17.5786 31.6451L42.0317 29.075L47.1438 5.02446L57.1446 27.4866L81.5977 24.9164Z" />
                    <path d="M169.688 110.558L166.338 125.071L179.105 132.742L164.267 134.04L160.917 148.552L155.097 134.842L140.26 136.14L151.501 126.369L145.681 112.659L158.448 120.33L169.688 110.558Z" />
                </g>
            </g>
            <defs>
                <clipPath id="clip0_1_2">
                    <rect width="200" height="200" />
                </clipPath>
                <clipPath id="clip1_1_2">
                    <rect width="201" height="200" transform="translate(-1)"/>
                </clipPath>
            </defs>
        </svg>
    `,
    Close: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M1.47 1.47a.75.75 0 0 1 1.06 0L8 6.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L9.06 8l5.47 5.47a.75.75 0 1 1-1.06 1.06L8 9.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L6.94 8 1.47 2.53a.75.75 0 0 1 0-1.06z"></path>
        </svg>
    `,
    Kofi: `
        <img height="16" loading="eager" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUEAAAECCAMAAABXHJXBAAAASFBMVEVMaXH///8gICD/////////////////+PX59/f/////WhY1NTXLy8vl4+NwcHCUlJRUVFSrq6v/bDD/rIqCgoL/jl//zLe5ubkCLxQzAAAACnRSTlMAOv//GGKF5/mwCIDTfQAAAAlwSFlzAAALEwAACxMBAJqcGAAAD91JREFUeJztnemS4joMRgnZHJzE2YD3f9NboXtourFkyXZsJ9zv31QNNBy0xYt0Om2uoiiyrFxVVVXzo/pFIifq9UV1/fJuTVVV1fpHsiwriuK0ZxXFyusBi4HGux58V6hZtg+eRVGWVVxmBpwrzDRZZmXVpMlNI1E3VZmdklFRVnW+R9VNAhiLstmL4eklmioixaJs8iNINGWM0HgUfN+qQ5tidih8X6qbYBCLcp+Zw6w6iDsX1b5zh0GbG+LB+a2qy//5pcswO2r8C8SwOGD+Dcqw/AgH3o5h8TEO/KLGY23zcQb4rcoTv8+KgL9UeykPPycF61QVSXlw13Vd27b3cZX60tL/1aDV23/r+/77LZR6vOG9XdV1fkNO7Yqwsv/bXdfexweiYZBSngNKSrkyX5Qa29YVqVs0ZIdAsVLr+yEsMZNWnkrd2y50UubkkO6ulj4tbjrJYVGtCOXJ5CqwVX3y6H5JDurOwSjKDQEKNeyL3lNDz6BYbQRQqOG8aw2q3QwhAWC7M9/VSy7dNgiNSaTdufm9aBgp7tz4rQPHI5jfj2TfeUZYfYz9PTW0PhGW6Bt1B+S3ahi9IcSziDqWA7PskJpO6g80wG+Z4mHlHAQPlkE0UjjC0jEILufjS6JmKDKXIHhwD6aZoXmZAS6lu8N7MMkMG2sfbj8G4PksR+tsAvvwJwE8456cWeXhDwN4PvfCKhQW0Is+JwZSgmHFTyMfCPCMIQT9OANeINwBSvm1Zbk8dycfm5Pr9uSb3n9Arb7f4HX7dN07XfdG/WzYwAhBP4ZMsLdk1i9qJeV5C5eoFfFjt3Ww3oeAEVa8Skbx/uzQqzESNVCibdUyDP4Q6o0QqGQ6OrtlZG8lBpVoVc/CKAWnrs5cgqDsld1+dniJ+0KnOHCSSWO9miAX6pZXKupGKsSFboRALdiaf6Y236OoEEfyOhdggiYf7vfJ76Gud8gmNdEEDXl42EvwA9QR9iwGQYuEpcXDiNyx/T1lZrjQIqG+lEHNfEm6cvHoyy3FCDN2KYiuoe1Lpsf+gWKE+jzSH9yDqeFeER5MaqYJ4vsx+5Mh4Avj03HGNMGjAcwN0VCfTERhWpuWnwMwN3hyZ8olWicewfe75/mHIewNuURfTg+W+/qHRNjhblyy8ojM889DuOAPxw3r7Y4YBM25U6BuLDh5RB8SjiEBr9cozI0z1rLWgU0wR+pCiWXjkuPERzbBHAuFLVJUa8Pg8IkmmCMVyIKsEuqqQfGZJpjDfqzPJQVYDUJh8FALCjw/bsF6JmNsMO2zFhSP0xHU/yw5btyAiWQ4jBOL5yr0QLtHBxmhBAOhdllBbuDEdV1bdG0QVq+Czu1J89YYaIQtFAgbRhi0+xb1bb5O0+WhabrON9r+QPfzqst0nefOT2Iwrq4vnKJ6rQh1X+fO3MJHdJv/UXjR9VZbvGy6EtkbntMMW4yQ+WhDWAmk4sXTqozQ4fuGWNu8bMJeppH+e0j8iwyMQNgAqbj3sjBYXyF8KEME+5f90j8B+GyqbHKJznRrgCDwK7AikcBBrJp1r7sZX0a3Q/jQCoYQWtjTBVABFDMeqsGbEcTqlG8sxEx4mR4979gPhlAyKsJCW8wI50QiSCDeWdQU7lr07INTSFnTM1JJpiXYutbTNRHEX4Qd+XXTzZUgYg8jwwdLTjmoNgB4eUVI8nwt+tzi8J7iBkIGwdGNYMcB8YLixnoZBWFrdcYXDIS6TFppCSqnYqbmAXyiYAKkIMQPkMIPJwM9dDba1UHl8lRccwF+o7B9nT3BgZtKRjLB3oGg4IO4XDorgJeLKZ0YDjGDbqw4BAWdIKmgvlqAuEwitwFoLGoMBMHAzkgE9Sn3S3C2AXG5zJavm5wIguXZnV5S+yZYW5mSg2YXguBDFqMg1hMEUtFWPuwk1I9NlzmYBaHWZv0SvF2C6+pCsEuO4BSeIJqPTQTb1AjeIgBEjdBE8M4jOLgS7FI0wQtmhCaCY2IEb1EAYka4N4LXOATXJ5rUCFrWg1MkgnOoTLI1wVskgMiDyc4IXmMRhHNJtHrQjuAUjeCc3DOJFcEuGkA4GxsIDh6eiwVnfbBLMwxe4EBouzbTctZmvBGc4xEElxcMBO/M1S21LcFrRIK3mGvU3lb5p4gEZyuC8P4349yQR4KXS3qpBCd4T2uvTuyOIHIMiOH1lTeC9e4IwtvFLevMgi+CXUyCkwVB5BSQYpSPmbczC7edEcQu6g+M028sguOBbFAiDiU428v6o/yjBcF6V3FQYv4E9UfQQa8PTrCzsED4orbu/zYnf6ffLgkSBI6x4dchIOzaRFJ5JDhFJAgubyn+XQjQibWJpGRdadohwfzNI6Uy3eph3QrLTv7OUV8jEkQ2PBW34Slkgtp6Wpw8EpwjEsTiWjc+2nz3C3FaJ6tFRwMQ5CxyJ1FS5/4EtnoaoRvapeNWVQrljOEUIUtgt48OutrJuNM07G6nyWOTgB4Kgx5vhV2jEWTcVTQI7rk4gk0CMropGwjO0Qi6XIKnfHHwu8ONKoA3ytMMhFO+fcMefRaFm6XYHT2a9h4GkcWwDu5c5pHgvHMnRrqx9lj3vNzblZzbvp0YG4Oh/+bfrd8cb0XFz8a+MjEy6kBfx/1rP8jYKDFd7pz37MRYN+AWbYHpkaCIkUvQ6xB+AOqj4LMNK2OB0HjJfd6rCSLdL8EM+uwhylggNBKsd2qC+Fxc4Gs/21EzFmfMzT6uu8wj+FBNYF/0pxs1o9mHmWC9RxM0DDYYTXOGtEsLwI8ikjPC2pmfabK1NI4Z4hA0r5GLaWcmaBqSA51teBl1VXgsqfPQ6djVBFvjxDBlnnTFIUjolyKm/awpmPmB5cevaWuCHlwpXY9ue3kiJvAjDlur6SU1qfPWdQ8+TBm0hqxG/R74xyipSd3fxJS6D7eKOHUSilp/5v01jP0C0o7rLWEf7u5LTx5oDIb9PzMn/ZYzwfIxpYFe27+KOwwajPp/p/1xGlLTmpeJKREf5k2vpgb91xFXD3E6sULTaMO3nSEFwcEFoCAPIS9cD2PHCIW0ICi3APg2NlZfztwdW7HOGwMkFTLtFgB1Q9w5yZjcV/4aH6BDGEQeHd58mNmZnzzwVEzxFwUpI565CVPjw1tNhxBT9FJabgBQ48ObTSipt0LooRs1JvSg//v8djAZQycRRXSEM/XvA9nQIPSgvy4IQskY+gE5vfnrKerTsE0YxA/6/30YQZMxq7V6QISM5QSLehq/aaIPgmAy5syYCIeQARAbog58N/yh9e1pzpCMoVExIibCmfGn4fHBgHrD2bSXecWkVALFYXJFuAFC1uYwMwwOpocFfRo+bT/0r/aGkDbNwK4aNPID0zCSSqBAyJ2VJDw9I0+8UVetV34GgLxAyB+5NnsByNwVITuxVISfxgCQN4CXVc9YjM3Q68o1fZoTy6GlvLEJoH7HEzoVazN6sp5C7ypRnFj2I+13MQPkTeC1mZworgFzCMWJJW0GpTkLn4JNgZ4dAPI3hpFyWsp+GRlZSSB1oCEQgl0KuCHJ0ZNni78H3hLuuG8GP8r9luC4MXt2oktZY+HB3FvCmBoiQH0ghNzYZn6nbU5mjpk05RFuDCfkECwQevsc1EGU7wZoebIDyiPMOkJQcgj2aAz6gkVJaGWGdgaI5JF+Gw9+qGbNk7bLJUwztDVApJRpt/FgeI0Q/C0tcwnLDG0NEPnYHCeuSUWMqZ4Bs7HNcwnPDO0NEDFB+g8vmAa4SrD2rJmrhGwztDdArJrutomAmBuDN0atCxqSGboYIGKC/VYOjLnx4r2gITyi2DyEUEyw9V7C/JZglYSuRpjnOTBk2+4hhGCCtDPMlY0DI24Mbxk6G2GudWU3B0Y3mMZt+UFuDLeRzD3oLaO4ZBCrhievaqz9F3s2hj+RU0341O3FDqfZ/aamsjVBUdnlD+OzMfyRXB5MXiVu8/V6vc4zbyeJ268Da/67mp+L+/5TIXgtMPwYoV/BS9Nqa3ywG8N+0eWpCU4jkAkKf/jAXAIb4ZAnJqTnjnJagN7MCFW+Fx8GErHF069NLhGW0Tm4kJPnQCL2bYJALkE+2ZAnJGx/jnmi8uT5uQTZ/1f5HoJgMBMEjRA5ANDmqQjZY++DmSBohPCBWplKKMSu33TBTBDaccJCzJAnD1AFNEGooME+4JInIOygEbSksIkJgkaItTdUedJZBEojG5kgaITYj6zylAH2YU0QNEL0ONmYpwsQSnWbmSCYjjE/Po/JAgTLrc1MEKwJ8fsZY54oQCjCeH8iJhghfixU5ZFkaB4IvMr7ogzJCFE/PkdCONp0X6Qd7PW+RGMcxSry8LLrvqi/qR6gojF8Xhn8AU8YzpuDfrGpD8OL1cYLp3JMKQQiD5wbVjKmZIKHwvN5CenJtu0rN04jeDIx/uwy2GqXqX8qElQ2TiN4MjHf2u3DRENz/0Cwn0EAH8aSibkNjgwQDQn9K8EsEsKHUT+GD8TRJrN6UEe4twmXp0F8GPVjyr3TYcNwKCgNQGGAgXwY9WN8DMC3hntEfsiqbygfxv2YhPAsiVdPOWoX0rVh5LhvQICYH+PLIU/J3qszi3HYpHNbhLqajPBMu4Lv0/zwjZuAQfChoravZ380EEbeGiTo+Cw6t22KEI5ktFj4LdnTL5S/qVWsHr7KqmlRhFDI7ogjh+XOxdjdF2YHZHSxPFglSAuFdk06h16Nrbm9RteOqufCMz2WB84ixqrQrd2zHIa+79VfLWvjbWndwhddoQydRQjZxLxSE1joKnn4LEJC2KWEEN2piQfwdMrQqLWcExG+MhkTIJ6Qc8NmWTDh+1wx6hg6ws6l+70nmbpXul9X2rCmySnrxRsLb58aqRBkIeysu48HMMAkABoR5hGjoXF/MAmAZoRdpKRsXA23v7IeGmEew5XNOzLxkwgDYU6ZAOeVn/m0U0oAKQjzkAylMu8ixC2kuXXhl9pAvjwQ+CUH8HTKKF0QugAMabupVn13Yi4zPNVtW9tI4oJ3pPVALwjzvKVPJmSK1v44nTLQKp986b4BRFL0c+n8FEQlfSO99QmR3D061RDI9+SHWuWFIqN7dLoh8EcF2ZO/1I69Q524bpUyh6Ik7MH/VLKbO4lWsXcu5dCrO//MQ9oe/E8FtocHS7R3tZjG4Eo59OumqN15kXRWEjwmFK26rtWoY/cs36UBOpnhptqPAdpGw43l1D1wF0l5WzU7SMEpu7LYmQOn5spifw6cFEOxa37xGe6fX1yGx+C3qoySU47DL05edm5/nJyKkM7so/1xisqaMBC9NqBNTWWz9U33Q+P7UrmhJX4Avi9l1QaJxW/36PRVlJVHU/w0ev9UZJV7WBR19Zn0niqysrHkWDdVecyqxUJFVlZNU9NI1iu6svhsyztBKrIsK8vqS81Tj3+WZZllewL3H/2YOVHv+BUaAAAAAElFTkSuQmCC" />
    `,
    NowBar: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M11.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M1.75 3A1.75 1.75 0 000 4.75v6.5C0 12.216.784 13 1.75 13H2v1.25a.75.75 0 001.5 0V13h9v1.25a.75.75 0 001.5 0V13h.25A1.75 1.75 0 0016 11.25v-6.5A1.75 1.75 0 0014.25 3H1.75zM1.5 4.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v6.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25v-6.5z"/>
        </svg>
    `,
    Fullscreen: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M6.064 10.229l-2.418 2.418L2 11v4h4l-1.647-1.646 2.418-2.418-.707-.707zM11 2l1.647 1.647-2.418 2.418.707.707 2.418-2.418L15 6V2h-4z"/>
        </svg>
    `,
    CloseFullscreen: `
        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 24 24" data-encore-id="icon" class="Svg-sc-ytk21e-0 Svg-img-16-icon">
            <path d="M21.707 2.293a1 1 0 0 1 0 1.414L17.414 8h1.829a1 1 0 0 1 0 2H14V4.757a1 1 0 1 1 2 0v1.829l4.293-4.293a1 1 0 0 1 1.414 0zM2.293 21.707a1 1 0 0 1 0-1.414L6.586 16H4.757a1 1 0 0 1 0-2H10v5.243a1 1 0 0 1-2 0v-1.829l-4.293 4.293a1 1 0 0 1-1.414 0z" />
        </svg>
    `,
    PrevTrack: TrackSkip.replace("REPLACEME", "PrevTrack"),
    Play: `
		<svg viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg" class="Play">
			<path d="M 1.558 20 C 2.006 20 2.381 19.838 2.874 19.561 L 16.622 11.572 C 17.527 11.053 17.894 10.65 17.894 9.997 C 17.894 9.35 17.527 8.948 16.622 8.419 L 2.874 0.439 C 2.381 0.153 2.006 0 1.558 0 C 0.706 0 0.106 0.654 0.106 1.694 L 0.106 18.298 C 0.106 19.346 0.706 20 1.558 20 L 1.558 20 Z" fill-rule="nonzero" transform="matrix(1, 0, 0, 1, 0, 8.881784197001252e-16)"/>
		</svg>
	`,
    Pause: `
		<svg viewBox="0 0 15 20" xmlns="http://www.w3.org/2000/svg" class="Pause">
			<path d="M 4.427 19.963 C 5.513 19.963 6.06 19.416 6.06 18.33 L 6.06 1.66 C 6.06 0.545 5.513 0.037 4.427 0.037 L 1.633 0.037 C 0.548 0.037 0 0.575 0 1.66 L 0 18.331 C -0.009 19.416 0.538 19.963 1.633 19.963 L 4.427 19.963 Z M 13.377 19.963 C 14.462 19.963 15 19.416 15 18.33 L 15 1.66 C 15 0.545 14.462 0.037 13.376 0.037 L 10.573 0.037 C 9.487 0.037 8.949 0.575 8.949 1.66 L 8.949 18.331 C 8.949 19.416 9.487 19.963 10.573 19.963 L 13.376 19.963 L 13.377 19.963 Z" fill-rule="nonzero"/>
		</svg>
	`,
    NextTrack: TrackSkip.replace("REPLACEME", "NextTrack"),
    Shuffle: `
        <svg viewBox="0 0 25 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M 19.857 19.948 C 20.135 19.94 20.403 19.841 20.62 19.663 L 24.632 16.281 C 25.123 15.868 25.123 15.223 24.632 14.797 L 20.62 11.402 C 20.403 11.224 20.135 11.125 19.857 11.117 C 19.212 11.117 18.81 11.518 18.81 12.164 L 18.81 14.1 L 17.003 14.1 C 15.853 14.1 15.144 13.738 14.33 12.782 L 11.956 9.981 L 14.33 7.167 C 15.17 6.186 15.802 5.849 16.939 5.849 L 18.81 5.849 L 18.81 7.838 C 18.81 8.471 19.212 8.871 19.857 8.871 C 20.133 8.868 20.403 8.773 20.62 8.6 L 24.632 5.216 C 25.123 4.803 25.123 4.145 24.632 3.732 L 20.62 0.337 C 20.406 0.154 20.136 0.053 19.857 0.052 C 19.212 0.052 18.81 0.453 18.81 1.087 L 18.81 3.241 L 16.925 3.241 C 15.015 3.241 13.827 3.771 12.472 5.398 L 10.277 7.992 L 7.992 5.269 C 6.738 3.798 5.55 3.241 3.719 3.241 L 1.393 3.241 C 0.569 3.241 0 3.784 0 4.546 C 0 5.308 0.567 5.849 1.393 5.849 L 3.628 5.849 C 4.712 5.849 5.436 6.199 6.249 7.167 L 8.611 9.967 L 6.247 12.782 C 5.423 13.752 4.763 14.1 3.691 14.1 L 1.393 14.1 C 0.569 14.1 0 14.641 0 15.403 C 0 16.165 0.567 16.707 1.393 16.707 L 3.783 16.707 C 5.617 16.707 6.738 16.153 7.992 14.68 L 10.29 11.956 L 12.537 14.629 C 13.815 16.153 15.066 16.707 16.925 16.707 L 18.81 16.707 L 18.81 18.902 C 18.81 19.548 19.212 19.948 19.857 19.948 Z"/>
        </svg>
	`,
    Loop: `
		<svg viewBox="0 0 20 17" xmlns="http://www.w3.org/2000/svg" class="Loop">
			<path d="M 1.148 8.951 C 1.786 8.956 2.307 8.441 2.307 7.803 L 2.307 7.201 C 2.307 5.853 3.255 4.949 4.705 4.949 L 11.426 4.949 L 11.426 6.778 C 11.426 7.325 11.773 7.67 12.33 7.67 C 12.572 7.67 12.806 7.583 12.988 7.424 L 16.454 4.515 C 16.879 4.158 16.879 3.589 16.454 3.233 L 12.988 0.301 C 12.806 0.142 12.572 0.055 12.33 0.055 C 11.773 0.055 11.428 0.402 11.428 0.948 L 11.428 2.686 L 4.872 2.686 C 1.895 2.686 0 4.37 0 7.001 L 0 7.803 C 0 8.44 0.513 8.951 1.148 8.951 L 1.148 8.951 Z M 7.681 16.945 C 8.227 16.945 8.572 16.6 8.572 16.053 L 8.572 14.303 L 15.128 14.303 C 18.116 14.303 20 12.619 20 9.988 L 20 9.186 C 20 8.302 19.043 7.75 18.278 8.192 C 17.922 8.397 17.703 8.776 17.703 9.186 L 17.703 9.788 C 17.703 11.136 16.745 12.04 15.295 12.04 L 8.572 12.04 L 8.572 10.223 C 8.572 9.676 8.227 9.331 7.681 9.331 C 7.436 9.331 7.199 9.417 7.012 9.576 L 3.556 12.497 C 3.121 12.842 3.133 13.41 3.556 13.767 L 7.012 16.711 C 7.202 16.862 7.438 16.944 7.681 16.945 L 7.681 16.945 Z" fill-rule="nonzero"/>
		</svg>
	`,
    LoopTrack: `
		<svg viewBox="0 0 20 17" xmlns="http://www.w3.org/2000/svg" class="LoopTrack">
			<path d="M 18.885 6.353 C 19.52 6.353 19.888 6.008 19.888 5.318 L 19.888 1.236 C 19.888 0.511 19.409 0.022 18.696 0.022 C 18.105 0.022 17.758 0.21 17.302 0.556 L 16.176 1.437 C 15.907 1.639 15.819 1.839 15.819 2.073 C 15.819 2.418 16.074 2.697 16.488 2.697 C 16.666 2.697 16.81 2.641 16.956 2.529 L 17.781 1.839 L 17.859 1.839 L 17.859 5.318 C 17.859 6.008 18.227 6.353 18.885 6.353 L 18.885 6.353 Z M 1.147 8.986 C 1.791 9.003 2.319 8.48 2.306 7.836 L 2.306 7.234 C 2.306 5.886 3.254 4.982 4.703 4.982 L 9.274 4.982 L 9.274 6.811 C 9.274 7.358 9.62 7.703 10.178 7.703 C 10.42 7.703 10.653 7.616 10.836 7.457 L 14.302 4.548 C 14.727 4.191 14.727 3.621 14.302 3.265 L 10.837 0.333 C 10.655 0.175 10.421 0.087 10.179 0.088 C 9.622 0.088 9.275 0.434 9.275 0.981 L 9.275 2.719 L 4.873 2.719 C 1.895 2.719 0 4.403 0 7.034 L 0 7.836 C 0 8.494 0.502 8.984 1.148 8.984 L 1.147 8.986 Z M 7.68 16.978 C 8.226 16.978 8.572 16.633 8.572 16.086 L 8.572 14.336 L 15.127 14.336 C 18.115 14.336 20 12.652 20 10.021 L 20 9.219 C 20.013 8.58 19.491 8.058 18.851 8.071 C 18.21 8.054 17.686 8.578 17.703 9.219 L 17.703 9.821 C 17.703 11.169 16.744 12.073 15.295 12.073 L 8.572 12.073 L 8.572 10.256 C 8.572 9.709 8.226 9.364 7.68 9.364 C 7.435 9.364 7.198 9.45 7.011 9.609 L 3.555 12.53 C 3.12 12.875 3.132 13.443 3.555 13.8 L 7.011 16.744 C 7.201 16.895 7.437 16.977 7.68 16.978 L 7.68 16.978 Z" fill-rule="nonzero" transform="matrix(1, 0, 0, 1, 0, -8.881784197001252e-16)"/>
		</svg>
	`
  };

  // node_modules/lodash-es/_freeGlobal.js
  var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
  var freeGlobal_default = freeGlobal;

  // node_modules/lodash-es/_root.js
  var freeSelf = typeof self == "object" && self && self.Object === Object && self;
  var root = freeGlobal_default || freeSelf || Function("return this")();
  var root_default = root;

  // node_modules/lodash-es/_Symbol.js
  var Symbol2 = root_default.Symbol;
  var Symbol_default = Symbol2;

  // node_modules/lodash-es/_getRawTag.js
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var nativeObjectToString = objectProto.toString;
  var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    try {
      value[symToStringTag] = void 0;
      var unmasked = true;
    } catch (e2) {
    }
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  var getRawTag_default = getRawTag;

  // node_modules/lodash-es/_objectToString.js
  var objectProto2 = Object.prototype;
  var nativeObjectToString2 = objectProto2.toString;
  function objectToString(value) {
    return nativeObjectToString2.call(value);
  }
  var objectToString_default = objectToString;

  // node_modules/lodash-es/_baseGetTag.js
  var nullTag = "[object Null]";
  var undefinedTag = "[object Undefined]";
  var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
  }
  var baseGetTag_default = baseGetTag;

  // node_modules/lodash-es/isObjectLike.js
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  var isObjectLike_default = isObjectLike;

  // node_modules/lodash-es/isSymbol.js
  var symbolTag = "[object Symbol]";
  function isSymbol(value) {
    return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
  }
  var isSymbol_default = isSymbol;

  // node_modules/lodash-es/_trimmedEndIndex.js
  var reWhitespace = /\s/;
  function trimmedEndIndex(string) {
    var index = string.length;
    while (index-- && reWhitespace.test(string.charAt(index))) {
    }
    return index;
  }
  var trimmedEndIndex_default = trimmedEndIndex;

  // node_modules/lodash-es/_baseTrim.js
  var reTrimStart = /^\s+/;
  function baseTrim(string) {
    return string ? string.slice(0, trimmedEndIndex_default(string) + 1).replace(reTrimStart, "") : string;
  }
  var baseTrim_default = baseTrim;

  // node_modules/lodash-es/isObject.js
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var isObject_default = isObject;

  // node_modules/lodash-es/toNumber.js
  var NAN = 0 / 0;
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  var reIsBinary = /^0b[01]+$/i;
  var reIsOctal = /^0o[0-7]+$/i;
  var freeParseInt = parseInt;
  function toNumber(value) {
    if (typeof value == "number") {
      return value;
    }
    if (isSymbol_default(value)) {
      return NAN;
    }
    if (isObject_default(value)) {
      var other = typeof value.valueOf == "function" ? value.valueOf() : value;
      value = isObject_default(other) ? other + "" : other;
    }
    if (typeof value != "string") {
      return value === 0 ? value : +value;
    }
    value = baseTrim_default(value);
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }
  var toNumber_default = toNumber;

  // node_modules/lodash-es/now.js
  var now = function() {
    return root_default.Date.now();
  };
  var now_default = now;

  // node_modules/lodash-es/debounce.js
  var FUNC_ERROR_TEXT = "Expected a function";
  var nativeMax = Math.max;
  var nativeMin = Math.min;
  function debounce(func, wait, options) {
    var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = toNumber_default(wait) || 0;
    if (isObject_default(options)) {
      leading = !!options.leading;
      maxing = "maxWait" in options;
      maxWait = maxing ? nativeMax(toNumber_default(options.maxWait) || 0, wait) : maxWait;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    function invokeFunc(time) {
      var args = lastArgs, thisArg = lastThis;
      lastArgs = lastThis = void 0;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    function leadingEdge(time) {
      lastInvokeTime = time;
      timerId = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    }
    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
      return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
    }
    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
      return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
    }
    function timerExpired() {
      var time = now_default();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timerId = setTimeout(timerExpired, remainingWait(time));
    }
    function trailingEdge(time) {
      timerId = void 0;
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = void 0;
      return result;
    }
    function cancel() {
      if (timerId !== void 0) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = void 0;
    }
    function flush() {
      return timerId === void 0 ? result : trailingEdge(now_default());
    }
    function debounced() {
      var time = now_default(), isInvoking = shouldInvoke(time);
      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;
      if (isInvoking) {
        if (timerId === void 0) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          clearTimeout(timerId);
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === void 0) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }
  var debounce_default = debounce;

  // node_modules/lodash-es/throttle.js
  var FUNC_ERROR_TEXT2 = "Expected a function";
  function throttle(func, wait, options) {
    var leading = true, trailing = true;
    if (typeof func != "function") {
      throw new TypeError(FUNC_ERROR_TEXT2);
    }
    if (isObject_default(options)) {
      leading = "leading" in options ? !!options.leading : leading;
      trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    return debounce_default(func, wait, {
      "leading": leading,
      "maxWait": wait,
      "trailing": trailing
    });
  }
  var throttle_default = throttle;

  // node_modules/simplebar-core/dist/index.mjs
  var __assign = function() {
    __assign = Object.assign || function __assign2(t2) {
      for (var s2, i2 = 1, n2 = arguments.length; i2 < n2; i2++) {
        s2 = arguments[i2];
        for (var p2 in s2)
          if (Object.prototype.hasOwnProperty.call(s2, p2))
            t2[p2] = s2[p2];
      }
      return t2;
    };
    return __assign.apply(this, arguments);
  };
  function getElementWindow$1(element) {
    if (!element || !element.ownerDocument || !element.ownerDocument.defaultView) {
      return window;
    }
    return element.ownerDocument.defaultView;
  }
  function getElementDocument$1(element) {
    if (!element || !element.ownerDocument) {
      return document;
    }
    return element.ownerDocument;
  }
  var getOptions$1 = function(obj) {
    var initialObj = {};
    var options = Array.prototype.reduce.call(obj, function(acc, attribute) {
      var option = attribute.name.match(/data-simplebar-(.+)/);
      if (option) {
        var key = option[1].replace(/\W+(.)/g, function(_2, chr) {
          return chr.toUpperCase();
        });
        switch (attribute.value) {
          case "true":
            acc[key] = true;
            break;
          case "false":
            acc[key] = false;
            break;
          case void 0:
            acc[key] = true;
            break;
          default:
            acc[key] = attribute.value;
        }
      }
      return acc;
    }, initialObj);
    return options;
  };
  function addClasses$1(el, classes) {
    var _a2;
    if (!el)
      return;
    (_a2 = el.classList).add.apply(_a2, classes.split(" "));
  }
  function removeClasses$1(el, classes) {
    if (!el)
      return;
    classes.split(" ").forEach(function(className) {
      el.classList.remove(className);
    });
  }
  function classNamesToQuery$1(classNames) {
    return ".".concat(classNames.split(" ").join("."));
  }
  var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
  var helpers = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    addClasses: addClasses$1,
    canUseDOM,
    classNamesToQuery: classNamesToQuery$1,
    getElementDocument: getElementDocument$1,
    getElementWindow: getElementWindow$1,
    getOptions: getOptions$1,
    removeClasses: removeClasses$1
  });
  var cachedScrollbarWidth = null;
  var cachedDevicePixelRatio = null;
  if (canUseDOM) {
    window.addEventListener("resize", function() {
      if (cachedDevicePixelRatio !== window.devicePixelRatio) {
        cachedDevicePixelRatio = window.devicePixelRatio;
        cachedScrollbarWidth = null;
      }
    });
  }
  function scrollbarWidth() {
    if (cachedScrollbarWidth === null) {
      if (typeof document === "undefined") {
        cachedScrollbarWidth = 0;
        return cachedScrollbarWidth;
      }
      var body = document.body;
      var box = document.createElement("div");
      box.classList.add("simplebar-hide-scrollbar");
      body.appendChild(box);
      var width = box.getBoundingClientRect().right;
      body.removeChild(box);
      cachedScrollbarWidth = width;
    }
    return cachedScrollbarWidth;
  }
  var getElementWindow = getElementWindow$1;
  var getElementDocument = getElementDocument$1;
  var getOptions = getOptions$1;
  var addClasses = addClasses$1;
  var removeClasses = removeClasses$1;
  var classNamesToQuery = classNamesToQuery$1;
  var SimpleBarCore = function() {
    function SimpleBarCore2(element, options) {
      if (options === void 0) {
        options = {};
      }
      var _this = this;
      this.removePreventClickId = null;
      this.minScrollbarWidth = 20;
      this.stopScrollDelay = 175;
      this.isScrolling = false;
      this.isMouseEntering = false;
      this.isDragging = false;
      this.scrollXTicking = false;
      this.scrollYTicking = false;
      this.wrapperEl = null;
      this.contentWrapperEl = null;
      this.contentEl = null;
      this.offsetEl = null;
      this.maskEl = null;
      this.placeholderEl = null;
      this.heightAutoObserverWrapperEl = null;
      this.heightAutoObserverEl = null;
      this.rtlHelpers = null;
      this.scrollbarWidth = 0;
      this.resizeObserver = null;
      this.mutationObserver = null;
      this.elStyles = null;
      this.isRtl = null;
      this.mouseX = 0;
      this.mouseY = 0;
      this.onMouseMove = function() {
      };
      this.onWindowResize = function() {
      };
      this.onStopScrolling = function() {
      };
      this.onMouseEntered = function() {
      };
      this.onScroll = function() {
        var elWindow = getElementWindow(_this.el);
        if (!_this.scrollXTicking) {
          elWindow.requestAnimationFrame(_this.scrollX);
          _this.scrollXTicking = true;
        }
        if (!_this.scrollYTicking) {
          elWindow.requestAnimationFrame(_this.scrollY);
          _this.scrollYTicking = true;
        }
        if (!_this.isScrolling) {
          _this.isScrolling = true;
          addClasses(_this.el, _this.classNames.scrolling);
        }
        _this.showScrollbar("x");
        _this.showScrollbar("y");
        _this.onStopScrolling();
      };
      this.scrollX = function() {
        if (_this.axis.x.isOverflowing) {
          _this.positionScrollbar("x");
        }
        _this.scrollXTicking = false;
      };
      this.scrollY = function() {
        if (_this.axis.y.isOverflowing) {
          _this.positionScrollbar("y");
        }
        _this.scrollYTicking = false;
      };
      this._onStopScrolling = function() {
        removeClasses(_this.el, _this.classNames.scrolling);
        if (_this.options.autoHide) {
          _this.hideScrollbar("x");
          _this.hideScrollbar("y");
        }
        _this.isScrolling = false;
      };
      this.onMouseEnter = function() {
        if (!_this.isMouseEntering) {
          addClasses(_this.el, _this.classNames.mouseEntered);
          _this.showScrollbar("x");
          _this.showScrollbar("y");
          _this.isMouseEntering = true;
        }
        _this.onMouseEntered();
      };
      this._onMouseEntered = function() {
        removeClasses(_this.el, _this.classNames.mouseEntered);
        if (_this.options.autoHide) {
          _this.hideScrollbar("x");
          _this.hideScrollbar("y");
        }
        _this.isMouseEntering = false;
      };
      this._onMouseMove = function(e2) {
        _this.mouseX = e2.clientX;
        _this.mouseY = e2.clientY;
        if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
          _this.onMouseMoveForAxis("x");
        }
        if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
          _this.onMouseMoveForAxis("y");
        }
      };
      this.onMouseLeave = function() {
        _this.onMouseMove.cancel();
        if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
          _this.onMouseLeaveForAxis("x");
        }
        if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
          _this.onMouseLeaveForAxis("y");
        }
        _this.mouseX = -1;
        _this.mouseY = -1;
      };
      this._onWindowResize = function() {
        _this.scrollbarWidth = _this.getScrollbarWidth();
        _this.hideNativeScrollbar();
      };
      this.onPointerEvent = function(e2) {
        if (!_this.axis.x.track.el || !_this.axis.y.track.el || !_this.axis.x.scrollbar.el || !_this.axis.y.scrollbar.el)
          return;
        var isWithinTrackXBounds, isWithinTrackYBounds;
        _this.axis.x.track.rect = _this.axis.x.track.el.getBoundingClientRect();
        _this.axis.y.track.rect = _this.axis.y.track.el.getBoundingClientRect();
        if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
          isWithinTrackXBounds = _this.isWithinBounds(_this.axis.x.track.rect);
        }
        if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
          isWithinTrackYBounds = _this.isWithinBounds(_this.axis.y.track.rect);
        }
        if (isWithinTrackXBounds || isWithinTrackYBounds) {
          e2.stopPropagation();
          if (e2.type === "pointerdown" && e2.pointerType !== "touch") {
            if (isWithinTrackXBounds) {
              _this.axis.x.scrollbar.rect = _this.axis.x.scrollbar.el.getBoundingClientRect();
              if (_this.isWithinBounds(_this.axis.x.scrollbar.rect)) {
                _this.onDragStart(e2, "x");
              } else {
                _this.onTrackClick(e2, "x");
              }
            }
            if (isWithinTrackYBounds) {
              _this.axis.y.scrollbar.rect = _this.axis.y.scrollbar.el.getBoundingClientRect();
              if (_this.isWithinBounds(_this.axis.y.scrollbar.rect)) {
                _this.onDragStart(e2, "y");
              } else {
                _this.onTrackClick(e2, "y");
              }
            }
          }
        }
      };
      this.drag = function(e2) {
        var _a2, _b, _c, _d, _e2, _f, _g, _h, _j, _k, _l;
        if (!_this.draggedAxis || !_this.contentWrapperEl)
          return;
        var eventOffset;
        var track = _this.axis[_this.draggedAxis].track;
        var trackSize = (_b = (_a2 = track.rect) === null || _a2 === void 0 ? void 0 : _a2[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _b !== void 0 ? _b : 0;
        var scrollbar = _this.axis[_this.draggedAxis].scrollbar;
        var contentSize = (_d = (_c = _this.contentWrapperEl) === null || _c === void 0 ? void 0 : _c[_this.axis[_this.draggedAxis].scrollSizeAttr]) !== null && _d !== void 0 ? _d : 0;
        var hostSize = parseInt((_f = (_e2 = _this.elStyles) === null || _e2 === void 0 ? void 0 : _e2[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _f !== void 0 ? _f : "0px", 10);
        e2.preventDefault();
        e2.stopPropagation();
        if (_this.draggedAxis === "y") {
          eventOffset = e2.pageY;
        } else {
          eventOffset = e2.pageX;
        }
        var dragPos = eventOffset - ((_h = (_g = track.rect) === null || _g === void 0 ? void 0 : _g[_this.axis[_this.draggedAxis].offsetAttr]) !== null && _h !== void 0 ? _h : 0) - _this.axis[_this.draggedAxis].dragOffset;
        dragPos = _this.draggedAxis === "x" && _this.isRtl ? ((_k = (_j = track.rect) === null || _j === void 0 ? void 0 : _j[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _k !== void 0 ? _k : 0) - scrollbar.size - dragPos : dragPos;
        var dragPerc = dragPos / (trackSize - scrollbar.size);
        var scrollPos = dragPerc * (contentSize - hostSize);
        if (_this.draggedAxis === "x" && _this.isRtl) {
          scrollPos = ((_l = SimpleBarCore2.getRtlHelpers()) === null || _l === void 0 ? void 0 : _l.isScrollingToNegative) ? -scrollPos : scrollPos;
        }
        _this.contentWrapperEl[_this.axis[_this.draggedAxis].scrollOffsetAttr] = scrollPos;
      };
      this.onEndDrag = function(e2) {
        _this.isDragging = false;
        var elDocument = getElementDocument(_this.el);
        var elWindow = getElementWindow(_this.el);
        e2.preventDefault();
        e2.stopPropagation();
        removeClasses(_this.el, _this.classNames.dragging);
        _this.onStopScrolling();
        elDocument.removeEventListener("mousemove", _this.drag, true);
        elDocument.removeEventListener("mouseup", _this.onEndDrag, true);
        _this.removePreventClickId = elWindow.setTimeout(function() {
          elDocument.removeEventListener("click", _this.preventClick, true);
          elDocument.removeEventListener("dblclick", _this.preventClick, true);
          _this.removePreventClickId = null;
        });
      };
      this.preventClick = function(e2) {
        e2.preventDefault();
        e2.stopPropagation();
      };
      this.el = element;
      this.options = __assign(__assign({}, SimpleBarCore2.defaultOptions), options);
      this.classNames = __assign(__assign({}, SimpleBarCore2.defaultOptions.classNames), options.classNames);
      this.axis = {
        x: {
          scrollOffsetAttr: "scrollLeft",
          sizeAttr: "width",
          scrollSizeAttr: "scrollWidth",
          offsetSizeAttr: "offsetWidth",
          offsetAttr: "left",
          overflowAttr: "overflowX",
          dragOffset: 0,
          isOverflowing: true,
          forceVisible: false,
          track: { size: null, el: null, rect: null, isVisible: false },
          scrollbar: { size: null, el: null, rect: null, isVisible: false }
        },
        y: {
          scrollOffsetAttr: "scrollTop",
          sizeAttr: "height",
          scrollSizeAttr: "scrollHeight",
          offsetSizeAttr: "offsetHeight",
          offsetAttr: "top",
          overflowAttr: "overflowY",
          dragOffset: 0,
          isOverflowing: true,
          forceVisible: false,
          track: { size: null, el: null, rect: null, isVisible: false },
          scrollbar: { size: null, el: null, rect: null, isVisible: false }
        }
      };
      if (typeof this.el !== "object" || !this.el.nodeName) {
        throw new Error("Argument passed to SimpleBar must be an HTML element instead of ".concat(this.el));
      }
      this.onMouseMove = throttle_default(this._onMouseMove, 64);
      this.onWindowResize = debounce_default(this._onWindowResize, 64, { leading: true });
      this.onStopScrolling = debounce_default(this._onStopScrolling, this.stopScrollDelay);
      this.onMouseEntered = debounce_default(this._onMouseEntered, this.stopScrollDelay);
      this.init();
    }
    SimpleBarCore2.getRtlHelpers = function() {
      if (SimpleBarCore2.rtlHelpers) {
        return SimpleBarCore2.rtlHelpers;
      }
      var dummyDiv = document.createElement("div");
      dummyDiv.innerHTML = '<div class="simplebar-dummy-scrollbar-size"><div></div></div>';
      var scrollbarDummyEl = dummyDiv.firstElementChild;
      var dummyChild = scrollbarDummyEl === null || scrollbarDummyEl === void 0 ? void 0 : scrollbarDummyEl.firstElementChild;
      if (!dummyChild)
        return null;
      document.body.appendChild(scrollbarDummyEl);
      scrollbarDummyEl.scrollLeft = 0;
      var dummyContainerOffset = SimpleBarCore2.getOffset(scrollbarDummyEl);
      var dummyChildOffset = SimpleBarCore2.getOffset(dummyChild);
      scrollbarDummyEl.scrollLeft = -999;
      var dummyChildOffsetAfterScroll = SimpleBarCore2.getOffset(dummyChild);
      document.body.removeChild(scrollbarDummyEl);
      SimpleBarCore2.rtlHelpers = {
        isScrollOriginAtZero: dummyContainerOffset.left !== dummyChildOffset.left,
        isScrollingToNegative: dummyChildOffset.left !== dummyChildOffsetAfterScroll.left
      };
      return SimpleBarCore2.rtlHelpers;
    };
    SimpleBarCore2.prototype.getScrollbarWidth = function() {
      try {
        if (this.contentWrapperEl && getComputedStyle(this.contentWrapperEl, "::-webkit-scrollbar").display === "none" || "scrollbarWidth" in document.documentElement.style || "-ms-overflow-style" in document.documentElement.style) {
          return 0;
        } else {
          return scrollbarWidth();
        }
      } catch (e2) {
        return scrollbarWidth();
      }
    };
    SimpleBarCore2.getOffset = function(el) {
      var rect = el.getBoundingClientRect();
      var elDocument = getElementDocument(el);
      var elWindow = getElementWindow(el);
      return {
        top: rect.top + (elWindow.pageYOffset || elDocument.documentElement.scrollTop),
        left: rect.left + (elWindow.pageXOffset || elDocument.documentElement.scrollLeft)
      };
    };
    SimpleBarCore2.prototype.init = function() {
      if (canUseDOM) {
        this.initDOM();
        this.rtlHelpers = SimpleBarCore2.getRtlHelpers();
        this.scrollbarWidth = this.getScrollbarWidth();
        this.recalculate();
        this.initListeners();
      }
    };
    SimpleBarCore2.prototype.initDOM = function() {
      var _a2, _b;
      this.wrapperEl = this.el.querySelector(classNamesToQuery(this.classNames.wrapper));
      this.contentWrapperEl = this.options.scrollableNode || this.el.querySelector(classNamesToQuery(this.classNames.contentWrapper));
      this.contentEl = this.options.contentNode || this.el.querySelector(classNamesToQuery(this.classNames.contentEl));
      this.offsetEl = this.el.querySelector(classNamesToQuery(this.classNames.offset));
      this.maskEl = this.el.querySelector(classNamesToQuery(this.classNames.mask));
      this.placeholderEl = this.findChild(this.wrapperEl, classNamesToQuery(this.classNames.placeholder));
      this.heightAutoObserverWrapperEl = this.el.querySelector(classNamesToQuery(this.classNames.heightAutoObserverWrapperEl));
      this.heightAutoObserverEl = this.el.querySelector(classNamesToQuery(this.classNames.heightAutoObserverEl));
      this.axis.x.track.el = this.findChild(this.el, "".concat(classNamesToQuery(this.classNames.track)).concat(classNamesToQuery(this.classNames.horizontal)));
      this.axis.y.track.el = this.findChild(this.el, "".concat(classNamesToQuery(this.classNames.track)).concat(classNamesToQuery(this.classNames.vertical)));
      this.axis.x.scrollbar.el = ((_a2 = this.axis.x.track.el) === null || _a2 === void 0 ? void 0 : _a2.querySelector(classNamesToQuery(this.classNames.scrollbar))) || null;
      this.axis.y.scrollbar.el = ((_b = this.axis.y.track.el) === null || _b === void 0 ? void 0 : _b.querySelector(classNamesToQuery(this.classNames.scrollbar))) || null;
      if (!this.options.autoHide) {
        addClasses(this.axis.x.scrollbar.el, this.classNames.visible);
        addClasses(this.axis.y.scrollbar.el, this.classNames.visible);
      }
    };
    SimpleBarCore2.prototype.initListeners = function() {
      var _this = this;
      var _a2;
      var elWindow = getElementWindow(this.el);
      this.el.addEventListener("mouseenter", this.onMouseEnter);
      this.el.addEventListener("pointerdown", this.onPointerEvent, true);
      this.el.addEventListener("mousemove", this.onMouseMove);
      this.el.addEventListener("mouseleave", this.onMouseLeave);
      (_a2 = this.contentWrapperEl) === null || _a2 === void 0 ? void 0 : _a2.addEventListener("scroll", this.onScroll);
      elWindow.addEventListener("resize", this.onWindowResize);
      if (!this.contentEl)
        return;
      if (window.ResizeObserver) {
        var resizeObserverStarted_1 = false;
        var resizeObserver = elWindow.ResizeObserver || ResizeObserver;
        this.resizeObserver = new resizeObserver(function() {
          if (!resizeObserverStarted_1)
            return;
          elWindow.requestAnimationFrame(function() {
            _this.recalculate();
          });
        });
        this.resizeObserver.observe(this.el);
        this.resizeObserver.observe(this.contentEl);
        elWindow.requestAnimationFrame(function() {
          resizeObserverStarted_1 = true;
        });
      }
      this.mutationObserver = new elWindow.MutationObserver(function() {
        elWindow.requestAnimationFrame(function() {
          _this.recalculate();
        });
      });
      this.mutationObserver.observe(this.contentEl, {
        childList: true,
        subtree: true,
        characterData: true
      });
    };
    SimpleBarCore2.prototype.recalculate = function() {
      if (!this.heightAutoObserverEl || !this.contentEl || !this.contentWrapperEl || !this.wrapperEl || !this.placeholderEl)
        return;
      var elWindow = getElementWindow(this.el);
      this.elStyles = elWindow.getComputedStyle(this.el);
      this.isRtl = this.elStyles.direction === "rtl";
      var contentElOffsetWidth = this.contentEl.offsetWidth;
      var isHeightAuto = this.heightAutoObserverEl.offsetHeight <= 1;
      var isWidthAuto = this.heightAutoObserverEl.offsetWidth <= 1 || contentElOffsetWidth > 0;
      var contentWrapperElOffsetWidth = this.contentWrapperEl.offsetWidth;
      var elOverflowX = this.elStyles.overflowX;
      var elOverflowY = this.elStyles.overflowY;
      this.contentEl.style.padding = "".concat(this.elStyles.paddingTop, " ").concat(this.elStyles.paddingRight, " ").concat(this.elStyles.paddingBottom, " ").concat(this.elStyles.paddingLeft);
      this.wrapperEl.style.margin = "-".concat(this.elStyles.paddingTop, " -").concat(this.elStyles.paddingRight, " -").concat(this.elStyles.paddingBottom, " -").concat(this.elStyles.paddingLeft);
      var contentElScrollHeight = this.contentEl.scrollHeight;
      var contentElScrollWidth = this.contentEl.scrollWidth;
      this.contentWrapperEl.style.height = isHeightAuto ? "auto" : "100%";
      this.placeholderEl.style.width = isWidthAuto ? "".concat(contentElOffsetWidth || contentElScrollWidth, "px") : "auto";
      this.placeholderEl.style.height = "".concat(contentElScrollHeight, "px");
      var contentWrapperElOffsetHeight = this.contentWrapperEl.offsetHeight;
      this.axis.x.isOverflowing = contentElOffsetWidth !== 0 && contentElScrollWidth > contentElOffsetWidth;
      this.axis.y.isOverflowing = contentElScrollHeight > contentWrapperElOffsetHeight;
      this.axis.x.isOverflowing = elOverflowX === "hidden" ? false : this.axis.x.isOverflowing;
      this.axis.y.isOverflowing = elOverflowY === "hidden" ? false : this.axis.y.isOverflowing;
      this.axis.x.forceVisible = this.options.forceVisible === "x" || this.options.forceVisible === true;
      this.axis.y.forceVisible = this.options.forceVisible === "y" || this.options.forceVisible === true;
      this.hideNativeScrollbar();
      var offsetForXScrollbar = this.axis.x.isOverflowing ? this.scrollbarWidth : 0;
      var offsetForYScrollbar = this.axis.y.isOverflowing ? this.scrollbarWidth : 0;
      this.axis.x.isOverflowing = this.axis.x.isOverflowing && contentElScrollWidth > contentWrapperElOffsetWidth - offsetForYScrollbar;
      this.axis.y.isOverflowing = this.axis.y.isOverflowing && contentElScrollHeight > contentWrapperElOffsetHeight - offsetForXScrollbar;
      this.axis.x.scrollbar.size = this.getScrollbarSize("x");
      this.axis.y.scrollbar.size = this.getScrollbarSize("y");
      if (this.axis.x.scrollbar.el)
        this.axis.x.scrollbar.el.style.width = "".concat(this.axis.x.scrollbar.size, "px");
      if (this.axis.y.scrollbar.el)
        this.axis.y.scrollbar.el.style.height = "".concat(this.axis.y.scrollbar.size, "px");
      this.positionScrollbar("x");
      this.positionScrollbar("y");
      this.toggleTrackVisibility("x");
      this.toggleTrackVisibility("y");
    };
    SimpleBarCore2.prototype.getScrollbarSize = function(axis) {
      var _a2, _b;
      if (axis === void 0) {
        axis = "y";
      }
      if (!this.axis[axis].isOverflowing || !this.contentEl) {
        return 0;
      }
      var contentSize = this.contentEl[this.axis[axis].scrollSizeAttr];
      var trackSize = (_b = (_a2 = this.axis[axis].track.el) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetSizeAttr]) !== null && _b !== void 0 ? _b : 0;
      var scrollbarRatio = trackSize / contentSize;
      var scrollbarSize;
      scrollbarSize = Math.max(~~(scrollbarRatio * trackSize), this.options.scrollbarMinSize);
      if (this.options.scrollbarMaxSize) {
        scrollbarSize = Math.min(scrollbarSize, this.options.scrollbarMaxSize);
      }
      return scrollbarSize;
    };
    SimpleBarCore2.prototype.positionScrollbar = function(axis) {
      var _a2, _b, _c;
      if (axis === void 0) {
        axis = "y";
      }
      var scrollbar = this.axis[axis].scrollbar;
      if (!this.axis[axis].isOverflowing || !this.contentWrapperEl || !scrollbar.el || !this.elStyles) {
        return;
      }
      var contentSize = this.contentWrapperEl[this.axis[axis].scrollSizeAttr];
      var trackSize = ((_a2 = this.axis[axis].track.el) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetSizeAttr]) || 0;
      var hostSize = parseInt(this.elStyles[this.axis[axis].sizeAttr], 10);
      var scrollOffset = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
      scrollOffset = axis === "x" && this.isRtl && ((_b = SimpleBarCore2.getRtlHelpers()) === null || _b === void 0 ? void 0 : _b.isScrollOriginAtZero) ? -scrollOffset : scrollOffset;
      if (axis === "x" && this.isRtl) {
        scrollOffset = ((_c = SimpleBarCore2.getRtlHelpers()) === null || _c === void 0 ? void 0 : _c.isScrollingToNegative) ? scrollOffset : -scrollOffset;
      }
      var scrollPourcent = scrollOffset / (contentSize - hostSize);
      var handleOffset = ~~((trackSize - scrollbar.size) * scrollPourcent);
      handleOffset = axis === "x" && this.isRtl ? -handleOffset + (trackSize - scrollbar.size) : handleOffset;
      scrollbar.el.style.transform = axis === "x" ? "translate3d(".concat(handleOffset, "px, 0, 0)") : "translate3d(0, ".concat(handleOffset, "px, 0)");
    };
    SimpleBarCore2.prototype.toggleTrackVisibility = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      var track = this.axis[axis].track.el;
      var scrollbar = this.axis[axis].scrollbar.el;
      if (!track || !scrollbar || !this.contentWrapperEl)
        return;
      if (this.axis[axis].isOverflowing || this.axis[axis].forceVisible) {
        track.style.visibility = "visible";
        this.contentWrapperEl.style[this.axis[axis].overflowAttr] = "scroll";
        this.el.classList.add("".concat(this.classNames.scrollable, "-").concat(axis));
      } else {
        track.style.visibility = "hidden";
        this.contentWrapperEl.style[this.axis[axis].overflowAttr] = "hidden";
        this.el.classList.remove("".concat(this.classNames.scrollable, "-").concat(axis));
      }
      if (this.axis[axis].isOverflowing) {
        scrollbar.style.display = "block";
      } else {
        scrollbar.style.display = "none";
      }
    };
    SimpleBarCore2.prototype.showScrollbar = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      if (this.axis[axis].isOverflowing && !this.axis[axis].scrollbar.isVisible) {
        addClasses(this.axis[axis].scrollbar.el, this.classNames.visible);
        this.axis[axis].scrollbar.isVisible = true;
      }
    };
    SimpleBarCore2.prototype.hideScrollbar = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      if (this.isDragging)
        return;
      if (this.axis[axis].isOverflowing && this.axis[axis].scrollbar.isVisible) {
        removeClasses(this.axis[axis].scrollbar.el, this.classNames.visible);
        this.axis[axis].scrollbar.isVisible = false;
      }
    };
    SimpleBarCore2.prototype.hideNativeScrollbar = function() {
      if (!this.offsetEl)
        return;
      this.offsetEl.style[this.isRtl ? "left" : "right"] = this.axis.y.isOverflowing || this.axis.y.forceVisible ? "-".concat(this.scrollbarWidth, "px") : "0px";
      this.offsetEl.style.bottom = this.axis.x.isOverflowing || this.axis.x.forceVisible ? "-".concat(this.scrollbarWidth, "px") : "0px";
    };
    SimpleBarCore2.prototype.onMouseMoveForAxis = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      var currentAxis = this.axis[axis];
      if (!currentAxis.track.el || !currentAxis.scrollbar.el)
        return;
      currentAxis.track.rect = currentAxis.track.el.getBoundingClientRect();
      currentAxis.scrollbar.rect = currentAxis.scrollbar.el.getBoundingClientRect();
      if (this.isWithinBounds(currentAxis.track.rect)) {
        this.showScrollbar(axis);
        addClasses(currentAxis.track.el, this.classNames.hover);
        if (this.isWithinBounds(currentAxis.scrollbar.rect)) {
          addClasses(currentAxis.scrollbar.el, this.classNames.hover);
        } else {
          removeClasses(currentAxis.scrollbar.el, this.classNames.hover);
        }
      } else {
        removeClasses(currentAxis.track.el, this.classNames.hover);
        if (this.options.autoHide) {
          this.hideScrollbar(axis);
        }
      }
    };
    SimpleBarCore2.prototype.onMouseLeaveForAxis = function(axis) {
      if (axis === void 0) {
        axis = "y";
      }
      removeClasses(this.axis[axis].track.el, this.classNames.hover);
      removeClasses(this.axis[axis].scrollbar.el, this.classNames.hover);
      if (this.options.autoHide) {
        this.hideScrollbar(axis);
      }
    };
    SimpleBarCore2.prototype.onDragStart = function(e2, axis) {
      var _a2;
      if (axis === void 0) {
        axis = "y";
      }
      this.isDragging = true;
      var elDocument = getElementDocument(this.el);
      var elWindow = getElementWindow(this.el);
      var scrollbar = this.axis[axis].scrollbar;
      var eventOffset = axis === "y" ? e2.pageY : e2.pageX;
      this.axis[axis].dragOffset = eventOffset - (((_a2 = scrollbar.rect) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetAttr]) || 0);
      this.draggedAxis = axis;
      addClasses(this.el, this.classNames.dragging);
      elDocument.addEventListener("mousemove", this.drag, true);
      elDocument.addEventListener("mouseup", this.onEndDrag, true);
      if (this.removePreventClickId === null) {
        elDocument.addEventListener("click", this.preventClick, true);
        elDocument.addEventListener("dblclick", this.preventClick, true);
      } else {
        elWindow.clearTimeout(this.removePreventClickId);
        this.removePreventClickId = null;
      }
    };
    SimpleBarCore2.prototype.onTrackClick = function(e2, axis) {
      var _this = this;
      var _a2, _b, _c, _d;
      if (axis === void 0) {
        axis = "y";
      }
      var currentAxis = this.axis[axis];
      if (!this.options.clickOnTrack || !currentAxis.scrollbar.el || !this.contentWrapperEl)
        return;
      e2.preventDefault();
      var elWindow = getElementWindow(this.el);
      this.axis[axis].scrollbar.rect = currentAxis.scrollbar.el.getBoundingClientRect();
      var scrollbar = this.axis[axis].scrollbar;
      var scrollbarOffset = (_b = (_a2 = scrollbar.rect) === null || _a2 === void 0 ? void 0 : _a2[this.axis[axis].offsetAttr]) !== null && _b !== void 0 ? _b : 0;
      var hostSize = parseInt((_d = (_c = this.elStyles) === null || _c === void 0 ? void 0 : _c[this.axis[axis].sizeAttr]) !== null && _d !== void 0 ? _d : "0px", 10);
      var scrolled = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
      var t2 = axis === "y" ? this.mouseY - scrollbarOffset : this.mouseX - scrollbarOffset;
      var dir = t2 < 0 ? -1 : 1;
      var scrollSize = dir === -1 ? scrolled - hostSize : scrolled + hostSize;
      var speed = 40;
      var scrollTo = function() {
        if (!_this.contentWrapperEl)
          return;
        if (dir === -1) {
          if (scrolled > scrollSize) {
            scrolled -= speed;
            _this.contentWrapperEl[_this.axis[axis].scrollOffsetAttr] = scrolled;
            elWindow.requestAnimationFrame(scrollTo);
          }
        } else {
          if (scrolled < scrollSize) {
            scrolled += speed;
            _this.contentWrapperEl[_this.axis[axis].scrollOffsetAttr] = scrolled;
            elWindow.requestAnimationFrame(scrollTo);
          }
        }
      };
      scrollTo();
    };
    SimpleBarCore2.prototype.getContentElement = function() {
      return this.contentEl;
    };
    SimpleBarCore2.prototype.getScrollElement = function() {
      return this.contentWrapperEl;
    };
    SimpleBarCore2.prototype.removeListeners = function() {
      var elWindow = getElementWindow(this.el);
      this.el.removeEventListener("mouseenter", this.onMouseEnter);
      this.el.removeEventListener("pointerdown", this.onPointerEvent, true);
      this.el.removeEventListener("mousemove", this.onMouseMove);
      this.el.removeEventListener("mouseleave", this.onMouseLeave);
      if (this.contentWrapperEl) {
        this.contentWrapperEl.removeEventListener("scroll", this.onScroll);
      }
      elWindow.removeEventListener("resize", this.onWindowResize);
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      this.onMouseMove.cancel();
      this.onWindowResize.cancel();
      this.onStopScrolling.cancel();
      this.onMouseEntered.cancel();
    };
    SimpleBarCore2.prototype.unMount = function() {
      this.removeListeners();
    };
    SimpleBarCore2.prototype.isWithinBounds = function(bbox) {
      return this.mouseX >= bbox.left && this.mouseX <= bbox.left + bbox.width && this.mouseY >= bbox.top && this.mouseY <= bbox.top + bbox.height;
    };
    SimpleBarCore2.prototype.findChild = function(el, query) {
      var matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;
      return Array.prototype.filter.call(el.children, function(child) {
        return matches.call(child, query);
      })[0];
    };
    SimpleBarCore2.rtlHelpers = null;
    SimpleBarCore2.defaultOptions = {
      forceVisible: false,
      clickOnTrack: true,
      scrollbarMinSize: 25,
      scrollbarMaxSize: 0,
      ariaLabel: "scrollable content",
      tabIndex: 0,
      classNames: {
        contentEl: "simplebar-content",
        contentWrapper: "simplebar-content-wrapper",
        offset: "simplebar-offset",
        mask: "simplebar-mask",
        wrapper: "simplebar-wrapper",
        placeholder: "simplebar-placeholder",
        scrollbar: "simplebar-scrollbar",
        track: "simplebar-track",
        heightAutoObserverWrapperEl: "simplebar-height-auto-observer-wrapper",
        heightAutoObserverEl: "simplebar-height-auto-observer",
        visible: "simplebar-visible",
        horizontal: "simplebar-horizontal",
        vertical: "simplebar-vertical",
        hover: "simplebar-hover",
        dragging: "simplebar-dragging",
        scrolling: "simplebar-scrolling",
        scrollable: "simplebar-scrollable",
        mouseEntered: "simplebar-mouse-entered"
      },
      scrollableNode: null,
      contentNode: null,
      autoHide: true
    };
    SimpleBarCore2.getOptions = getOptions;
    SimpleBarCore2.helpers = helpers;
    return SimpleBarCore2;
  }();

  // node_modules/simplebar/dist/index.mjs
  var extendStatics = function(d2, b2) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b3) {
      d3.__proto__ = b3;
    } || function(d3, b3) {
      for (var p2 in b3)
        if (Object.prototype.hasOwnProperty.call(b3, p2))
          d3[p2] = b3[p2];
    };
    return extendStatics(d2, b2);
  };
  function __extends(d2, b2) {
    if (typeof b2 !== "function" && b2 !== null)
      throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
    extendStatics(d2, b2);
    function __() {
      this.constructor = d2;
    }
    d2.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
  }
  var _a = SimpleBarCore.helpers;
  var getOptions2 = _a.getOptions;
  var addClasses2 = _a.addClasses;
  var canUseDOM2 = _a.canUseDOM;
  var SimpleBar = function(_super) {
    __extends(SimpleBar2, _super);
    function SimpleBar2() {
      var args = [];
      for (var _i2 = 0; _i2 < arguments.length; _i2++) {
        args[_i2] = arguments[_i2];
      }
      var _this = _super.apply(this, args) || this;
      SimpleBar2.instances.set(args[0], _this);
      return _this;
    }
    SimpleBar2.initDOMLoadedElements = function() {
      document.removeEventListener("DOMContentLoaded", this.initDOMLoadedElements);
      window.removeEventListener("load", this.initDOMLoadedElements);
      Array.prototype.forEach.call(document.querySelectorAll("[data-simplebar]"), function(el) {
        if (el.getAttribute("data-simplebar") !== "init" && !SimpleBar2.instances.has(el))
          new SimpleBar2(el, getOptions2(el.attributes));
      });
    };
    SimpleBar2.removeObserver = function() {
      var _a2;
      (_a2 = SimpleBar2.globalObserver) === null || _a2 === void 0 ? void 0 : _a2.disconnect();
    };
    SimpleBar2.prototype.initDOM = function() {
      var _this = this;
      var _a2, _b, _c;
      if (!Array.prototype.filter.call(this.el.children, function(child) {
        return child.classList.contains(_this.classNames.wrapper);
      }).length) {
        this.wrapperEl = document.createElement("div");
        this.contentWrapperEl = document.createElement("div");
        this.offsetEl = document.createElement("div");
        this.maskEl = document.createElement("div");
        this.contentEl = document.createElement("div");
        this.placeholderEl = document.createElement("div");
        this.heightAutoObserverWrapperEl = document.createElement("div");
        this.heightAutoObserverEl = document.createElement("div");
        addClasses2(this.wrapperEl, this.classNames.wrapper);
        addClasses2(this.contentWrapperEl, this.classNames.contentWrapper);
        addClasses2(this.offsetEl, this.classNames.offset);
        addClasses2(this.maskEl, this.classNames.mask);
        addClasses2(this.contentEl, this.classNames.contentEl);
        addClasses2(this.placeholderEl, this.classNames.placeholder);
        addClasses2(this.heightAutoObserverWrapperEl, this.classNames.heightAutoObserverWrapperEl);
        addClasses2(this.heightAutoObserverEl, this.classNames.heightAutoObserverEl);
        while (this.el.firstChild) {
          this.contentEl.appendChild(this.el.firstChild);
        }
        this.contentWrapperEl.appendChild(this.contentEl);
        this.offsetEl.appendChild(this.contentWrapperEl);
        this.maskEl.appendChild(this.offsetEl);
        this.heightAutoObserverWrapperEl.appendChild(this.heightAutoObserverEl);
        this.wrapperEl.appendChild(this.heightAutoObserverWrapperEl);
        this.wrapperEl.appendChild(this.maskEl);
        this.wrapperEl.appendChild(this.placeholderEl);
        this.el.appendChild(this.wrapperEl);
        (_a2 = this.contentWrapperEl) === null || _a2 === void 0 ? void 0 : _a2.setAttribute("tabindex", this.options.tabIndex.toString());
        (_b = this.contentWrapperEl) === null || _b === void 0 ? void 0 : _b.setAttribute("role", "region");
        (_c = this.contentWrapperEl) === null || _c === void 0 ? void 0 : _c.setAttribute("aria-label", this.options.ariaLabel);
      }
      if (!this.axis.x.track.el || !this.axis.y.track.el) {
        var track = document.createElement("div");
        var scrollbar = document.createElement("div");
        addClasses2(track, this.classNames.track);
        addClasses2(scrollbar, this.classNames.scrollbar);
        track.appendChild(scrollbar);
        this.axis.x.track.el = track.cloneNode(true);
        addClasses2(this.axis.x.track.el, this.classNames.horizontal);
        this.axis.y.track.el = track.cloneNode(true);
        addClasses2(this.axis.y.track.el, this.classNames.vertical);
        this.el.appendChild(this.axis.x.track.el);
        this.el.appendChild(this.axis.y.track.el);
      }
      SimpleBarCore.prototype.initDOM.call(this);
      this.el.setAttribute("data-simplebar", "init");
    };
    SimpleBar2.prototype.unMount = function() {
      SimpleBarCore.prototype.unMount.call(this);
      SimpleBar2.instances["delete"](this.el);
    };
    SimpleBar2.initHtmlApi = function() {
      this.initDOMLoadedElements = this.initDOMLoadedElements.bind(this);
      if (typeof MutationObserver !== "undefined") {
        this.globalObserver = new MutationObserver(SimpleBar2.handleMutations);
        this.globalObserver.observe(document, { childList: true, subtree: true });
      }
      if (document.readyState === "complete" || document.readyState !== "loading" && !document.documentElement.doScroll) {
        window.setTimeout(this.initDOMLoadedElements);
      } else {
        document.addEventListener("DOMContentLoaded", this.initDOMLoadedElements);
        window.addEventListener("load", this.initDOMLoadedElements);
      }
    };
    SimpleBar2.handleMutations = function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(addedNode) {
          if (addedNode.nodeType === 1) {
            if (addedNode.hasAttribute("data-simplebar")) {
              !SimpleBar2.instances.has(addedNode) && document.documentElement.contains(addedNode) && new SimpleBar2(addedNode, getOptions2(addedNode.attributes));
            } else {
              addedNode.querySelectorAll("[data-simplebar]").forEach(function(el) {
                if (el.getAttribute("data-simplebar") !== "init" && !SimpleBar2.instances.has(el) && document.documentElement.contains(el))
                  new SimpleBar2(el, getOptions2(el.attributes));
              });
            }
          }
        });
        mutation.removedNodes.forEach(function(removedNode) {
          var _a2;
          if (removedNode.nodeType === 1) {
            if (removedNode.getAttribute("data-simplebar") === "init") {
              !document.documentElement.contains(removedNode) && ((_a2 = SimpleBar2.instances.get(removedNode)) === null || _a2 === void 0 ? void 0 : _a2.unMount());
            } else {
              Array.prototype.forEach.call(removedNode.querySelectorAll('[data-simplebar="init"]'), function(el) {
                var _a3;
                !document.documentElement.contains(el) && ((_a3 = SimpleBar2.instances.get(el)) === null || _a3 === void 0 ? void 0 : _a3.unMount());
              });
            }
          }
        });
      });
    };
    SimpleBar2.instances = /* @__PURE__ */ new WeakMap();
    return SimpleBar2;
  }(SimpleBarCore);
  if (canUseDOM2) {
    SimpleBar.initHtmlApi();
  }

  // src/utils/Gets/GetElementHeight.ts
  function GetElementHeight(element) {
    const beforeStyles = getComputedStyle(element, "::before");
    const afterStyles = getComputedStyle(element, "::after");
    return element.offsetHeight + beforeStyles.height + afterStyles.height;
  }

  // src/utils/Scrolling/Page/IsHovering.ts
  var IsMouseInLyricsPage = false;
  function LyricsPageMouseEnter() {
    IsMouseInLyricsPage = true;
  }
  function LyricsPageMouseLeave() {
    IsMouseInLyricsPage = false;
  }
  function SetIsMouseInLyricsPage(value) {
    IsMouseInLyricsPage = value;
  }

  // src/utils/Scrolling/Simplebar/ScrollSimplebar.ts
  var ScrollSimplebar;
  var ElementEventQuery = "#SpicyLyricsPage .ContentBox .LyricsContainer";
  function MountScrollSimplebar() {
    const LyricsContainer = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    LyricsContainer.style.height = `${GetElementHeight(LyricsContainer)}px`;
    ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });
    document.querySelector(ElementEventQuery)?.addEventListener("mouseenter", LyricsPageMouseEnter);
    document.querySelector(ElementEventQuery)?.addEventListener("mouseleave", LyricsPageMouseLeave);
  }
  function ClearScrollSimplebar() {
    ScrollSimplebar?.unMount();
    ScrollSimplebar = null;
    SetIsMouseInLyricsPage(false);
    document.querySelector(ElementEventQuery)?.removeEventListener("mouseenter", LyricsPageMouseEnter);
    document.querySelector(ElementEventQuery)?.removeEventListener("mouseleave", LyricsPageMouseLeave);
  }
  function RecalculateScrollSimplebar() {
    ScrollSimplebar?.recalculate();
  }
  new IntervalManager(Infinity, () => {
    const LyricsContainer = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (!LyricsContainer || !ScrollSimplebar)
      return;
    if (IsMouseInLyricsPage) {
      LyricsContainer.classList.remove("hide-scrollbar");
    } else {
      if (ScrollSimplebar.isDragging) {
        LyricsContainer.classList.remove("hide-scrollbar");
      } else {
        LyricsContainer.classList.add("hide-scrollbar");
      }
    }
  }).Start();

  // src/utils/Addons.ts
  function DeepFreeze(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    const clone = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      clone[key] = DeepFreeze(value);
    });
    return Object.freeze(clone);
  }
  function IsPlaying() {
    const state = Spicetify?.Player?.data?.isPaused;
    return !state;
  }
  function TOP_ApplyLyricsSpacer(Container) {
    const div = document.createElement("div");
    div.classList.add("TopSpacer");
    Container.appendChild(div);
  }
  function BOTTOM_ApplyLyricsSpacer(Container) {
    const div = document.createElement("div");
    div.classList.add("BottomSpacer");
    Container.appendChild(div);
  }
  var ArabicPersianRegex = /[\u0600-\u06FF]/;

  // src/utils/CSS/Styles.ts
  function applyStyles(element, styles) {
    if (element) {
      Object.entries(styles).forEach(([key, value]) => {
        element.style[key] = value;
      });
    } else {
      console.warn("Element not found");
    }
  }
  function removeAllStyles(element) {
    if (element) {
      element.style = null;
    } else {
      console.warn("Element not found");
    }
  }

  // src/utils/Lyrics/Applyer/Credits/ApplyLyricsCredits.ts
  function ApplyLyricsCredits(data) {
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    if (!data?.SongWriters)
      return;
    const CreditsElement = document.createElement("div");
    CreditsElement.classList.add("Credits");
    const SongWriters = data.SongWriters.join(", ");
    CreditsElement.textContent = `Credits: ${SongWriters}`;
    LyricsContainer.appendChild(CreditsElement);
  }

  // src/utils/Lyrics/Applyer/Info/ApplyInfo.ts
  function ApplyInfo(data) {
    const TopBarContainer = document.querySelector(
      "header.main-topBar-container"
    );
    if (!data?.Info || !TopBarContainer)
      return;
    const infoElement = document.createElement("a");
    infoElement.className = "FuriganaInfo";
    infoElement.textContent = data.Info;
    infoElement.role = "menuitem";
    infoElement.href = "/preferences";
    infoElement.addEventListener("click", (event) => {
      event.preventDefault();
      Spicetify.Platform.History.push({
        pathname: "/preferences",
        hash: "#spicy-lyrics-settings"
      });
    });
    TopBarContainer.appendChild(infoElement);
    setTimeout(() => {
      TopBarContainer.removeChild(infoElement);
    }, 8e3);
  }

  // src/utils/Lyrics/isRtl.ts
  function isRtl(text) {
    if (!text || text.length === 0)
      return false;
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    for (let i2 = 0; i2 < text.length; i2++) {
      const char = text[i2];
      if (/[\d\s,.;:?!()[\]{}"'\\/<>@#$%^&*_=+\-]/.test(char)) {
        continue;
      }
      return rtlRegex.test(char);
    }
    return false;
  }
  var isRtl_default = isRtl;

  // src/utils/Lyrics/Applyer/Static.ts
  function ApplyStaticLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.setAttribute("data-lyrics-type", "Static");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    data.Lines.forEach((line) => {
      const lineElem = document.createElement("div");
      line.Text = line.Text.replace(/{/g, "<span class='line-furigana'>").replace(
        /}/g,
        "</span>"
      );
      if (line.Text.includes("[DEF=font_size:small]")) {
        lineElem.style.fontSize = "35px";
        lineElem.innerHTML = line.Text.replace("[DEF=font_size:small]", "");
      } else {
        lineElem.innerHTML = line.Text;
      }
      if (isRtl_default(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl");
      }
      lineElem.classList.add("line");
      lineElem.classList.add("static");
      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn");
      }
      LyricsObject.Types.Static.Lines.push({
        HTMLElement: lineElem
      });
      LyricsContainer.appendChild(lineElem);
    });
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar)
      RecalculateScrollSimplebar();
    else
      MountScrollSimplebar();
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    if (data.offline) {
      LyricsStylingContainer.classList.add("offline");
    }
    removeAllStyles(LyricsStylingContainer);
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }

  // src/utils/Lyrics/ConvertTime.ts
  function ConvertTime(time) {
    return time * 1e3;
  }

  // src/utils/Lyrics/Applyer/Synced/Line.ts
  function ApplyLineLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.setAttribute("data-lyrics-type", "Line");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    if (data.StartTime >= lyricsBetweenShow) {
      const musicalLine = document.createElement("div");
      musicalLine.classList.add("line");
      musicalLine.classList.add("musical-line");
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: musicalLine,
        StartTime: 0,
        EndTime: ConvertTime(data.StartTime),
        TotalTime: ConvertTime(data.StartTime),
        DotLine: true
      });
      SetWordArrayInCurentLine_LINE_SYNCED();
      if (data.Content[0].OppositeAligned) {
        musicalLine.classList.add("OppositeAligned");
      }
      const dotGroup = document.createElement("div");
      dotGroup.classList.add("dotGroup");
      const musicalDots1 = document.createElement("span");
      const musicalDots2 = document.createElement("span");
      const musicalDots3 = document.createElement("span");
      const totalTime = ConvertTime(data.StartTime);
      const dotTime = totalTime / 3;
      musicalDots1.classList.add("word");
      musicalDots1.classList.add("dot");
      musicalDots1.textContent = "\u2022";
      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots1,
        StartTime: 0,
        EndTime: dotTime,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots2.classList.add("word");
      musicalDots2.classList.add("dot");
      musicalDots2.textContent = "\u2022";
      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots2,
        StartTime: dotTime,
        EndTime: dotTime * 2,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots3.classList.add("word");
      musicalDots3.classList.add("dot");
      musicalDots3.textContent = "\u2022";
      LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots3,
        StartTime: dotTime * 2,
        EndTime: ConvertTime(data.StartTime) - 400,
        TotalTime: dotTime,
        Dot: true
      });
      dotGroup.appendChild(musicalDots1);
      dotGroup.appendChild(musicalDots2);
      dotGroup.appendChild(musicalDots3);
      musicalLine.appendChild(dotGroup);
      LyricsContainer.appendChild(musicalLine);
    }
    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div");
      line.Text = line.Text.replace(/{/g, "<span class='line-furigana'>").replace(
        /}/g,
        "</span>"
      );
      lineElem.innerHTML = line.Text;
      lineElem.classList.add("line");
      if (isRtl_default(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl");
      }
      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn");
      }
      LyricsObject.Types.Line.Lines.push({
        HTMLElement: lineElem,
        StartTime: ConvertTime(line.StartTime),
        EndTime: ConvertTime(line.EndTime),
        TotalTime: ConvertTime(line.EndTime) - ConvertTime(line.StartTime)
      });
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned");
      }
      LyricsContainer.appendChild(lineElem);
      if (arr[index + 1] && arr[index + 1].StartTime - line.EndTime >= lyricsBetweenShow) {
        const musicalLine = document.createElement("div");
        musicalLine.classList.add("line");
        musicalLine.classList.add("musical-line");
        LyricsObject.Types.Line.Lines.push({
          HTMLElement: musicalLine,
          StartTime: ConvertTime(line.EndTime),
          EndTime: ConvertTime(arr[index + 1].StartTime),
          TotalTime: ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime),
          DotLine: true
        });
        SetWordArrayInCurentLine_LINE_SYNCED();
        if (arr[index + 1].OppositeAligned) {
          musicalLine.classList.add("OppositeAligned");
        }
        const dotGroup = document.createElement("div");
        dotGroup.classList.add("dotGroup");
        const musicalDots1 = document.createElement("span");
        const musicalDots2 = document.createElement("span");
        const musicalDots3 = document.createElement("span");
        const totalTime = ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime);
        const dotTime = totalTime / 3;
        musicalDots1.classList.add("word");
        musicalDots1.classList.add("dot");
        musicalDots1.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots1,
          StartTime: ConvertTime(line.EndTime),
          EndTime: ConvertTime(line.EndTime) + dotTime,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots2,
          StartTime: ConvertTime(line.EndTime) + dotTime,
          EndTime: ConvertTime(line.EndTime) + dotTime * 2,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "\u2022";
        LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots3,
          StartTime: ConvertTime(line.EndTime) + dotTime * 2,
          EndTime: ConvertTime(arr[index + 1].StartTime) - 400,
          TotalTime: dotTime,
          Dot: true
        });
        dotGroup.appendChild(musicalDots1);
        dotGroup.appendChild(musicalDots2);
        dotGroup.appendChild(musicalDots3);
        musicalLine.appendChild(dotGroup);
        LyricsContainer.appendChild(musicalLine);
      }
    });
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar)
      RecalculateScrollSimplebar();
    else
      MountScrollSimplebar();
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    removeAllStyles(LyricsStylingContainer);
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }

  // src/utils/Lyrics/Applyer/Utils/IsLetterCapable.ts
  function IsLetterCapable(letterLength, totalDuration) {
    if (letterLength > 12) {
      return false;
    }
    const minDuration = 1500 + (letterLength - 1) / 1 * 25;
    return totalDuration >= minDuration;
  }

  // src/utils/Lyrics/Applyer/Utils/Emphasize.ts
  function Emphasize(letters, applyTo, lead, isBgWord = false) {
    const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);
    const letterDuration = totalDuration / letters.length;
    const word = applyTo;
    let Letters = [];
    letters.forEach((letter, index, lA) => {
      const letterElem = document.createElement("span");
      letterElem.textContent = letter;
      letterElem.classList.add("letter");
      letterElem.classList.add("Emphasis");
      const letterStartTime = ConvertTime(lead.StartTime) + index * letterDuration;
      const letterEndTime = letterStartTime + letterDuration;
      const contentDuration = letterDuration > 150 ? letterDuration : 150;
      letterElem.style.setProperty("--content-duration", `${contentDuration}ms`);
      if (index === lA.length - 1) {
        letterElem.classList.add("LastLetterInWord");
      }
      if (ArabicPersianRegex.test(lead.Text)) {
        word.setAttribute("font", "Vazirmatn");
      }
      const mcont2 = isBgWord ? {
        BGLetter: true
      } : {};
      Letters.push({
        HTMLElement: letterElem,
        StartTime: letterStartTime,
        EndTime: letterEndTime,
        TotalTime: letterDuration,
        Emphasis: true,
        ...mcont2
      });
      letterElem.style.setProperty("--gradient-position", `-20%`);
      letterElem.style.setProperty("--text-shadow-opacity", `0%`);
      letterElem.style.setProperty("--text-shadow-blur-radius", `4px`);
      letterElem.style.scale = IdleEmphasisLyricsScale.toString();
      letterElem.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0.02))`;
      word.appendChild(letterElem);
    });
    word.classList.add("letterGroup");
    const mcont = isBgWord ? {
      BGWord: true
    } : {};
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
      HTMLElement: word,
      StartTime: ConvertTime(lead.StartTime),
      EndTime: ConvertTime(lead.EndTime),
      TotalTime: totalDuration,
      LetterGroup: true,
      Letters,
      ...mcont
    });
    Letters = [];
  }

  // src/utils/Lyrics/Applyer/Synced/Syllable.ts
  function ApplySyllableLyrics(data) {
    if (!Defaults_default.LyricsContainerExists)
      return;
    const LyricsContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent"
    );
    LyricsContainer.setAttribute("data-lyrics-type", "Syllable");
    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    TOP_ApplyLyricsSpacer(LyricsContainer);
    if (data.StartTime >= lyricsBetweenShow && !SpotifyPlayer.IsPodcast) {
      const musicalLine = document.createElement("div");
      musicalLine.classList.add("line");
      musicalLine.classList.add("musical-line");
      LyricsObject.Types.Syllable.Lines.push({
        HTMLElement: musicalLine,
        StartTime: 0,
        EndTime: ConvertTime(data.StartTime),
        TotalTime: ConvertTime(data.StartTime),
        DotLine: true
      });
      SetWordArrayInCurentLine();
      if (data.Content[0].OppositeAligned) {
        musicalLine.classList.add("OppositeAligned");
      }
      const dotGroup = document.createElement("div");
      dotGroup.classList.add("dotGroup");
      const musicalDots1 = document.createElement("span");
      const musicalDots2 = document.createElement("span");
      const musicalDots3 = document.createElement("span");
      const totalTime = ConvertTime(data.StartTime);
      const dotTime = totalTime / 3;
      musicalDots1.classList.add("word");
      musicalDots1.classList.add("dot");
      musicalDots1.textContent = "\u2022";
      LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots1,
        StartTime: 0,
        EndTime: dotTime,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots2.classList.add("word");
      musicalDots2.classList.add("dot");
      musicalDots2.textContent = "\u2022";
      LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots2,
        StartTime: dotTime,
        EndTime: dotTime * 2,
        TotalTime: dotTime,
        Dot: true
      });
      musicalDots3.classList.add("word");
      musicalDots3.classList.add("dot");
      musicalDots3.textContent = "\u2022";
      LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: musicalDots3,
        StartTime: dotTime * 2,
        EndTime: ConvertTime(data.StartTime) - 400,
        TotalTime: dotTime,
        Dot: true
      });
      dotGroup.appendChild(musicalDots1);
      dotGroup.appendChild(musicalDots2);
      dotGroup.appendChild(musicalDots3);
      musicalLine.appendChild(dotGroup);
      LyricsContainer.appendChild(musicalLine);
    }
    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div");
      lineElem.classList.add("line");
      LyricsObject.Types.Syllable.Lines.push({
        HTMLElement: lineElem,
        StartTime: ConvertTime(line.Lead.StartTime),
        EndTime: ConvertTime(line.Lead.EndTime),
        TotalTime: ConvertTime(line.Lead.EndTime) - ConvertTime(line.Lead.StartTime)
      });
      SetWordArrayInCurentLine();
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned");
      }
      LyricsContainer.appendChild(lineElem);
      line.Lead.Syllables.forEach((lead, iL, aL) => {
        let word = document.createElement("span");
        if (isRtl_default(lead.Text) && !lineElem.classList.contains("rtl")) {
          lineElem.classList.add("rtl");
        }
        const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);
        const letterLength = lead.Text.split("").length;
        const IfLetterCapable = IsLetterCapable(letterLength, totalDuration) && !SpotifyPlayer.IsPodcast;
        if (IfLetterCapable) {
          word = document.createElement("div");
          const letters = lead.Text.split("");
          Emphasize(letters, word, lead);
          iL === aL.length - 1 ? word.classList.add("LastWordInLine") : lead.IsPartOfWord ? word.classList.add("PartOfWord") : null;
          word.style.setProperty("--text-shadow-opacity", `0%`);
          word.style.setProperty("--text-shadow-blur-radius", `4px`);
          word.style.scale = IdleEmphasisLyricsScale.toString();
          word.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0.02))`;
          const contentDuration = totalDuration > 200 ? totalDuration : 200;
          word.style.setProperty("--content-duration", `${contentDuration}ms`);
          lineElem.appendChild(word);
        } else {
          word.textContent = lead.Text;
          word.style.setProperty("--gradient-position", `-20%`);
          word.style.setProperty("--text-shadow-opacity", `0%`);
          word.style.setProperty("--text-shadow-blur-radius", `4px`);
          word.style.scale = SpotifyPlayer.IsPodcast ? "1" : IdleLyricsScale.toString();
          word.style.transform = SpotifyPlayer.IsPodcast ? null : `translateY(calc(var(--DefaultLyricsSize) * 0.01))`;
          if (ArabicPersianRegex.test(lead.Text)) {
            word.setAttribute("font", "Vazirmatn");
          }
          word.classList.add("word");
          iL === aL.length - 1 ? word.classList.add("LastWordInLine") : lead.IsPartOfWord ? word.classList.add("PartOfWord") : null;
          lineElem.appendChild(word);
          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: word,
            StartTime: ConvertTime(lead.StartTime),
            EndTime: ConvertTime(lead.EndTime),
            TotalTime: totalDuration
          });
        }
      });
      if (line.Background) {
        line.Background.forEach((bg) => {
          const lineE = document.createElement("div");
          lineE.classList.add("line", "bg-line");
          LyricsObject.Types.Syllable.Lines.push({
            HTMLElement: lineE,
            StartTime: ConvertTime(bg.StartTime),
            EndTime: ConvertTime(bg.EndTime),
            TotalTime: ConvertTime(bg.EndTime) - ConvertTime(bg.StartTime),
            BGLine: true
          });
          SetWordArrayInCurentLine();
          if (line.OppositeAligned) {
            lineE.classList.add("OppositeAligned");
          }
          LyricsContainer.appendChild(lineE);
          bg.Syllables.forEach((bw, bI, bA) => {
            let bwE = document.createElement("span");
            if (isRtl_default(bw.Text) && !lineE.classList.contains("rtl")) {
              lineE.classList.add("rtl");
            }
            const totalDuration = ConvertTime(bw.EndTime) - ConvertTime(bw.StartTime);
            const letterLength = bw.Text.split("").length;
            const IfLetterCapable = IsLetterCapable(letterLength, totalDuration);
            if (IfLetterCapable) {
              bwE = document.createElement("div");
              const letters = bw.Text.split("");
              Emphasize(letters, bwE, bw, true);
              bI === bA.length - 1 ? bwE.classList.add("LastWordInLine") : bw.IsPartOfWord ? bwE.classList.add("PartOfWord") : null;
              bwE.style.setProperty("--text-shadow-opacity", `0%`);
              bwE.style.setProperty("--text-shadow-blur-radius", `4px`);
              bwE.style.scale = IdleEmphasisLyricsScale.toString();
              bwE.style.transform = `translateY(calc(var(--font-size) * 0.02))`;
              const contentDuration = totalDuration > 200 ? totalDuration : 200;
              bwE.style.setProperty("--content-duration", `${contentDuration}ms`);
              lineE.appendChild(bwE);
            } else {
              bwE.textContent = bw.Text;
              bwE.style.setProperty("--gradient-position", `0%`);
              bwE.style.setProperty("--text-shadow-opacity", `0%`);
              bwE.style.setProperty("--text-shadow-blur-radius", `4px`);
              bwE.style.scale = IdleLyricsScale.toString();
              bwE.style.transform = `translateY(calc(var(--font-size) * 0.01))`;
              if (ArabicPersianRegex.test(bw.Text)) {
                bwE.setAttribute("font", "Vazirmatn");
              }
              LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
                HTMLElement: bwE,
                StartTime: ConvertTime(bw.StartTime),
                EndTime: ConvertTime(bw.EndTime),
                TotalTime: ConvertTime(bw.EndTime) - ConvertTime(bw.StartTime),
                BGWord: true
              });
              bwE.classList.add("bg-word");
              bwE.classList.add("word");
              bI === bA.length - 1 ? bwE.classList.add("LastWordInLine") : bw.IsPartOfWord ? bwE.classList.add("PartOfWord") : null;
              lineE.appendChild(bwE);
            }
          });
        });
      }
      if (arr[index + 1] && arr[index + 1].Lead.StartTime - line.Lead.EndTime >= lyricsBetweenShow && !SpotifyPlayer.IsPodcast) {
        const musicalLine = document.createElement("div");
        musicalLine.classList.add("line");
        musicalLine.classList.add("musical-line");
        LyricsObject.Types.Syllable.Lines.push({
          HTMLElement: musicalLine,
          StartTime: ConvertTime(line.Lead.EndTime),
          EndTime: ConvertTime(arr[index + 1].Lead.StartTime),
          TotalTime: ConvertTime(arr[index + 1].Lead.StartTime) - ConvertTime(line.Lead.EndTime),
          DotLine: true
        });
        SetWordArrayInCurentLine();
        if (arr[index + 1].OppositeAligned) {
          musicalLine.classList.add("OppositeAligned");
        }
        const dotGroup = document.createElement("div");
        dotGroup.classList.add("dotGroup");
        const musicalDots1 = document.createElement("span");
        const musicalDots2 = document.createElement("span");
        const musicalDots3 = document.createElement("span");
        const totalTime = ConvertTime(arr[index + 1].Lead.StartTime) - ConvertTime(line.Lead.EndTime);
        const dotTime = totalTime / 3;
        musicalDots1.classList.add("word");
        musicalDots1.classList.add("dot");
        musicalDots1.textContent = "\u2022";
        LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots1,
          StartTime: ConvertTime(line.Lead.EndTime),
          EndTime: ConvertTime(line.Lead.EndTime) + dotTime,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "\u2022";
        LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots2,
          StartTime: ConvertTime(line.Lead.EndTime) + dotTime,
          EndTime: ConvertTime(line.Lead.EndTime) + dotTime * 2,
          TotalTime: dotTime,
          Dot: true
        });
        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "\u2022";
        LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
          HTMLElement: musicalDots3,
          StartTime: ConvertTime(line.Lead.EndTime) + dotTime * 2,
          EndTime: ConvertTime(arr[index + 1].Lead.StartTime) - 400,
          TotalTime: dotTime,
          Dot: true
        });
        dotGroup.appendChild(musicalDots1);
        dotGroup.appendChild(musicalDots2);
        dotGroup.appendChild(musicalDots3);
        musicalLine.appendChild(dotGroup);
        LyricsContainer.appendChild(musicalLine);
      }
    });
    ApplyInfo(data);
    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);
    if (ScrollSimplebar)
      RecalculateScrollSimplebar();
    else
      MountScrollSimplebar();
    const LyricsStylingContainer = document.querySelector(
      "#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content"
    );
    removeAllStyles(LyricsStylingContainer);
    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }
    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  }

  // src/utils/Lyrics/Global/Applyer.ts
  function ApplyLyrics(lyrics) {
    if (!document.querySelector("#SpicyLyricsPage"))
      return;
    setBlurringLastLine(null);
    if (!lyrics)
      return;
    if (lyrics?.Type === "Syllable") {
      ApplySyllableLyrics(lyrics);
    } else if (lyrics?.Type === "Line") {
      ApplyLineLyrics(lyrics);
    } else if (lyrics?.Type === "Static") {
      ApplyStaticLyrics(lyrics);
    }
  }

  // src/utils/ScrollIntoView/Center.ts
  var containerRects = /* @__PURE__ */ new WeakMap();
  function ScrollIntoCenterView(container, element, duration = 150, offset = 0) {
    function resetContainerData(container2) {
      containerRects.delete(container2);
    }
    const observer = new MutationObserver(() => {
      resetContainerData(container);
    });
    observer.observe(container, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(() => {
      resetContainerData(container);
    });
    resizeObserver.observe(container);
    let containerData = containerRects.get(container);
    if (!containerData) {
      containerData = {
        container: container.getBoundingClientRect(),
        elements: /* @__PURE__ */ new Map()
      };
      containerRects.set(container, containerData);
    }
    const containerRect = containerData.container;
    let elementRect = containerData.elements.get(element);
    if (!elementRect) {
      elementRect = element.getBoundingClientRect();
      containerData.elements.set(element, elementRect);
    }
    const targetScrollTop = elementRect.top - containerRect.top + container.scrollTop - (container.clientHeight / 2 - element.clientHeight / 2) - offset;
    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const startTime = performance.now();
    function smoothScroll(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easing = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const newScrollTop = startScrollTop + distance * easing;
      container.scrollTop = newScrollTop;
      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      }
    }
    requestAnimationFrame(smoothScroll);
    setTimeout(() => {
      observer.disconnect();
      resizeObserver.disconnect();
    }, duration);
  }

  // src/utils/Scrolling/ScrollToActiveLine.ts
  var lastLine = null;
  function ScrollToActiveLine(ScrollSimplebar2) {
    if (!SpotifyPlayer.IsPlaying)
      return;
    if (!Defaults_default.LyricsContainerExists)
      return;
    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
      let Continue = function(currentLine) {
        if (currentLine) {
          const LineElem = currentLine.HTMLElement;
          const container = ScrollSimplebar2?.getScrollElement();
          if (!container)
            return;
          if (lastLine && lastLine === LineElem)
            return;
          lastLine = LineElem;
          setTimeout(() => LineElem.classList.add("Active", "OverridenByScroller"), PositionOffset / 2);
          ScrollIntoCenterView(container, LineElem, 270, -50);
        }
      };
      const Lines = LyricsObject.Types[Defaults_default.CurrentLyricsType]?.Lines;
      const Position = SpotifyPlayer.GetTrackPosition();
      const PositionOffset = 370;
      const ProcessedPosition = Position + PositionOffset;
      if (!Lines)
        return;
      for (let i2 = 0; i2 < Lines.length; i2++) {
        const line = Lines[i2];
        if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
          const currentLine = line;
          Continue(currentLine);
          return;
        }
      }
    }
  }
  function ResetLastLine() {
    lastLine = null;
  }

  // src/components/Utils/TransferElement.ts
  function TransferElement(element, targetContainer, index = -1) {
    if (!element || !targetContainer) {
      console.error("Both element and target container must be provided.");
      return;
    }
    try {
      if (index < 0 || index >= targetContainer.children.length) {
        targetContainer.appendChild(element);
      } else {
        targetContainer.insertBefore(element, targetContainer.children[index]);
      }
    } catch (error) {
      console.error("Error transferring element:", error);
    }
  }

  // src/components/Utils/Fullscreen.ts
  var Fullscreen = {
    Open,
    Close,
    Toggle,
    IsOpen: false
  };
  var MediaBox_Data = {
    Eventified: false,
    Functions: {
      MouseIn: () => {
        if (MediaBox_Data.Animators.brightness.reversed)
          MediaBox_Data.Animators.brightness.Reverse();
        if (MediaBox_Data.Animators.blur.reversed)
          MediaBox_Data.Animators.blur.Reverse();
        MediaBox_Data.Animators.brightness.Start();
        MediaBox_Data.Animators.blur.Start();
      },
      MouseOut: () => {
        if (!MediaBox_Data.Animators.brightness.reversed)
          MediaBox_Data.Animators.brightness.Reverse();
        if (!MediaBox_Data.Animators.blur.reversed)
          MediaBox_Data.Animators.blur.Reverse();
        MediaBox_Data.Animators.brightness.Start();
        MediaBox_Data.Animators.blur.Start();
      },
      Reset: (MediaImage) => {
        MediaImage.style.removeProperty("--ArtworkBrightness");
        MediaImage.style.removeProperty("--ArtworkBlur");
      },
      Eventify: (MediaImage) => {
        MediaBox_Data.Animators.brightness.on("progress", (progress) => {
          MediaImage.style.setProperty("--ArtworkBrightness", `${progress}`);
        });
        MediaBox_Data.Animators.blur.on("progress", (progress) => {
          MediaImage.style.setProperty("--ArtworkBlur", `${progress}px`);
        });
        MediaBox_Data.Eventified = true;
      }
    },
    Animators: {
      brightness: new Animator(1, 0.5, 0.25),
      blur: new Animator(0, 0.2, 0.25)
    }
  };
  function Open() {
    const SpicyPage = document.querySelector(
      ".Root__main-view #SpicyLyricsPage"
    );
    const Root = document.body;
    if (SpicyPage) {
      TransferElement(SpicyPage, Root);
      SpicyPage.classList.add("Fullscreen");
      Fullscreen.IsOpen = true;
      PageView_default.AppendViewControls(true);
      Tooltips.NowBarToggle?.destroy();
      const NowBarToggle = document.querySelector(
        "#SpicyLyricsPage .ViewControls #NowBarToggle"
      );
      if (NowBarToggle) {
        NowBarToggle.remove();
      }
      OpenNowBar();
      if (!document.fullscreenElement) {
        Root.querySelector("#SpicyLyricsPage").requestFullscreen().catch((err) => {
          alert(
            `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
          );
        });
      } else {
        document.exitFullscreen();
      }
      ResetLastLine();
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox"
      );
      const MediaImage = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
      );
      MediaBox_Data.Functions.Eventify(MediaImage);
      MediaBox.addEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
      MediaBox.addEventListener("mouseleave", MediaBox_Data.Functions.MouseOut);
      Global_default.Event.evoke("fullscreen:open", null);
    }
  }
  function Close() {
    const SpicyPage = document.querySelector("#SpicyLyricsPage");
    if (SpicyPage) {
      TransferElement(SpicyPage, PageRoot);
      SpicyPage.classList.remove("Fullscreen");
      Fullscreen.IsOpen = false;
      PageView_default.AppendViewControls(true);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      const NoLyrics = storage_default.get("currentLyricsData")?.includes("NO_LYRICS");
      if (NoLyrics) {
        OpenNowBar();
        document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer").classList.add("Hidden");
        DeregisterNowBarBtn();
      }
      ResetLastLine();
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox"
      );
      const MediaImage = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
      );
      MediaBox.removeEventListener("mouseenter", MediaBox_Data.Functions.MouseIn);
      MediaBox.removeEventListener(
        "mouseleave",
        MediaBox_Data.Functions.MouseOut
      );
      MediaBox_Data.Functions.Reset(MediaImage);
      Global_default.Event.evoke("fullscreen:exit", null);
    }
  }
  function Toggle() {
    const SpicyPage = document.querySelector("#SpicyLyricsPage");
    if (SpicyPage) {
      if (Fullscreen.IsOpen) {
        Close();
      } else {
        Open();
      }
    }
  }
  var Fullscreen_default = Fullscreen;

  // src/components/Pages/PageView.ts
  var Tooltips = {
    Close: null,
    Kofi: null,
    NowBarToggle: null,
    FullscreenToggle: null,
    LyricsToggle: null
  };
  var PageView = {
    Open: OpenPage,
    Destroy: DestroyPage,
    AppendViewControls,
    IsOpened: false
  };
  var PageRoot = document.querySelector(
    ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
  );
  function OpenPage() {
    if (PageView.IsOpened)
      return;
    const elem = document.createElement("div");
    elem.id = "SpicyLyricsPage";
    elem.innerHTML = `
        <div class="NotificationContainer">
            <div class="NotificationIcon"></div>
            <div class="NotificationText">
                <div class="NotificationTitle"></div>
                <div class="NotificationDescription"></div>
            </div>
            <div class="NotificationCloseButton">X</div>
        </div>
        <div class="ContentBox">
            <div class="NowBar">
                <div class="CenteredView">
                    <div class="Header">
                        <div class="MediaBox">
                            <div class="MediaContent" draggable="true"></div>
                            <img class="MediaImage" src="${SpotifyPlayer.Artwork.Get(
      "xl"
    )}" draggable="true" />
                        </div>
                        <div class="Metadata">
                            <div class="SongName">
                                <span>
                                    ${SpotifyPlayer.GetSongName()}
                                </span>
                            </div>
                            <div class="Artists">
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="LyricsContainer">
                <div class="loaderContainer">
                    <div id="DotLoader"></div>
                </div>
                <div class="LyricsContent ScrollbarScrollable"></div>
            </div>
            <div class="ViewControls"></div>
            <div class="DropZone LeftSide">
                <span>Switch Sides</span>
            </div>
            <div class="DropZone RightSide">
                <span>Switch Sides</span>
            </div>
        </div>
    `;
    const SkipSpicyFont = storage_default.get("skip-spicy-font");
    if (SkipSpicyFont != "true") {
      elem.classList.add("UseSpicyFont");
    }
    PageRoot.appendChild(elem);
    const lowQMode = storage_default.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
    if (lowQModeEnabled) {
      elem.querySelector(".LyricsContainer .LyricsContent").classList.add("lowqmode");
    }
    Defaults_default.LyricsContainerExists = true;
    ApplyDynamicBackground(
      document.querySelector("#SpicyLyricsPage .ContentBox")
    );
    addLinesEvListener();
    {
      if (!Spicetify.Player.data?.item?.uri)
        return;
      const currentUri = Spicetify.Player.data.item.uri;
      fetchLyrics(currentUri).then(ApplyLyrics);
    }
    Session_OpenNowBar();
    Session_NowBar_SetSide();
    AppendViewControls();
    PageView.IsOpened = true;
  }
  function DestroyPage() {
    if (!PageView.IsOpened)
      return;
    if (Fullscreen_default.IsOpen)
      Fullscreen_default.Close();
    if (!document.querySelector("#SpicyLyricsPage"))
      return;
    document.querySelector("#SpicyLyricsPage")?.remove();
    Defaults_default.LyricsContainerExists = false;
    removeLinesEvListener();
    Object.values(Tooltips).forEach((a2) => a2?.destroy());
    ResetLastLine();
    ScrollSimplebar?.unMount();
    PageView.IsOpened = false;
  }
  function AppendViewControls(ReAppend = false) {
    const elem = document.querySelector(
      "#SpicyLyricsPage .ContentBox .ViewControls"
    );
    if (!elem)
      return;
    if (ReAppend)
      elem.innerHTML = "";
    elem.innerHTML = `
        <button id="Close" class="ViewControl">${Icons.Close}</button>
        <button id="NowBarToggle" class="ViewControl">${Icons.NowBar}</button>
        <button id="FullscreenToggle" class="ViewControl">${Fullscreen_default.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen}</button>
    `;
    if (Fullscreen_default.IsOpen) {
      TransferElement(
        elem,
        document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header"
        ),
        0
      );
      Object.values(Tooltips).forEach((a2) => a2?.destroy());
      SetupTippy(
        document.querySelector(
          "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"
        )
      );
    } else {
      if (document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"
      )) {
        TransferElement(
          elem,
          document.querySelector("#SpicyLyricsPage .ContentBox")
        );
      }
      Object.values(Tooltips).forEach((a2) => a2?.destroy());
      SetupTippy(elem);
    }
    function SetupTippy(elem2) {
      {
        const closeButton = elem2.querySelector("#Close");
        Tooltips.Close = Spicetify.Tippy(closeButton, {
          ...Spicetify.TippyProps,
          content: `Close Page`
        });
        closeButton.addEventListener("click", () => Session_default.GoBack());
        const nowBarButton = elem2.querySelector("#NowBarToggle");
        Tooltips.NowBarToggle = Spicetify.Tippy(nowBarButton, {
          ...Spicetify.TippyProps,
          content: `NowBar`
        });
        nowBarButton.addEventListener("click", () => ToggleNowBar());
        const fullscreenBtn = elem2.querySelector("#FullscreenToggle");
        Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
          ...Spicetify.TippyProps,
          content: `Toggle Fullscreen`
        });
        fullscreenBtn.addEventListener("click", () => Fullscreen_default.Toggle());
      }
    }
  }
  var showTopbarNotifications = storage_default.get("show_topbar_notifications") === "true";
  var PageView_default = PageView;

  // src/components/Utils/NowBar.ts
  var ActivePlaybackControlsInstance = null;
  var ActiveSongProgressBarInstance_Map = /* @__PURE__ */ new Map();
  var ActiveSetupSongProgressBarInstance = null;
  function OpenNowBar() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    UpdateNowBar(true);
    NowBar.classList.add("Active");
    storage_default.set("IsNowBarOpen", "true");
    if (Fullscreen_default.IsOpen) {
      const MediaBox = document.querySelector(
        "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
      );
      const existingAlbumData = MediaBox.querySelector(".AlbumData");
      if (existingAlbumData) {
        MediaBox.removeChild(existingAlbumData);
      }
      const existingPlaybackControls = MediaBox.querySelector(".PlaybackControls");
      if (existingPlaybackControls) {
        MediaBox.removeChild(existingPlaybackControls);
      }
      {
        const AppendQueue = [];
        {
          const AlbumNameElement = document.createElement("div");
          AlbumNameElement.classList.add("AlbumData");
          AlbumNameElement.innerHTML = `<span>${SpotifyPlayer.GetAlbumName()}</span>`;
          AppendQueue.push(AlbumNameElement);
        }
        const SetupPlaybackControls = () => {
          const ControlsElement = document.createElement("div");
          ControlsElement.classList.add("PlaybackControls");
          ControlsElement.innerHTML = `
                    <div class="PlaybackControl ShuffleToggle">
                        ${Icons.Shuffle} 
                    </div>
                    ${Icons.PrevTrack}
                    <div class="PlaybackControl PlayStateToggle ${SpotifyPlayer.IsPlaying ? "Playing" : "Paused"}">
                        ${SpotifyPlayer.IsPlaying ? Icons.Pause : Icons.Play}
                    </div>
                    ${Icons.NextTrack}
                    <div class="PlaybackControl LoopToggle">
                        ${SpotifyPlayer.LoopType === "track" ? Icons.LoopTrack : Icons.Loop}
                    </div>
                `;
          if (SpotifyPlayer.LoopType !== "none") {
            ControlsElement.querySelector(".LoopToggle").classList.add("Enabled");
            ControlsElement.querySelector(
              ".LoopToggle svg"
            ).style.filter = "drop-shadow(0 0 5px white)";
          }
          if (SpotifyPlayer.ShuffleType !== "none") {
            ControlsElement.querySelector(".ShuffleToggle").classList.add(
              "Enabled"
            );
            ControlsElement.querySelector(
              ".ShuffleToggle svg"
            ).style.filter = "drop-shadow(0 0 5px white)";
          }
          const eventHandlers = {
            pressHandlers: /* @__PURE__ */ new Map(),
            releaseHandlers: /* @__PURE__ */ new Map(),
            clickHandlers: /* @__PURE__ */ new Map()
          };
          const playbackControls = ControlsElement.querySelectorAll(".PlaybackControl");
          playbackControls.forEach((control) => {
            const pressHandler = () => {
              control.classList.add("Pressed");
            };
            const releaseHandler = () => {
              control.classList.remove("Pressed");
            };
            eventHandlers.pressHandlers.set(control, pressHandler);
            eventHandlers.releaseHandlers.set(control, releaseHandler);
            control.addEventListener("mousedown", pressHandler);
            control.addEventListener("touchstart", pressHandler);
            control.addEventListener("mouseup", releaseHandler);
            control.addEventListener("mouseleave", releaseHandler);
            control.addEventListener("touchend", releaseHandler);
          });
          const PlayPauseControl = ControlsElement.querySelector(".PlayStateToggle");
          const PrevTrackControl = ControlsElement.querySelector(".PrevTrack");
          const NextTrackControl = ControlsElement.querySelector(".NextTrack");
          const ShuffleControl = ControlsElement.querySelector(".ShuffleToggle");
          const LoopControl = ControlsElement.querySelector(".LoopToggle");
          const playPauseHandler = () => {
            if (SpotifyPlayer.IsPlaying) {
              SpotifyPlayer.Pause();
            } else {
              SpotifyPlayer.Play();
            }
          };
          const prevTrackHandler = () => {
            SpotifyPlayer.Skip.Prev();
          };
          const nextTrackHandler = () => {
            SpotifyPlayer.Skip.Next();
          };
          const shuffleHandler = () => {
            if (SpotifyPlayer.ShuffleType === "none") {
              SpotifyPlayer.ShuffleType = "normal";
              ShuffleControl.classList.add("Enabled");
              Spicetify.Player.setShuffle(true);
            } else if (SpotifyPlayer.ShuffleType === "normal") {
              SpotifyPlayer.ShuffleType = "none";
              ShuffleControl.classList.remove("Enabled");
              Spicetify.Player.setShuffle(false);
            }
          };
          const loopHandler = () => {
            if (SpotifyPlayer.LoopType === "none") {
              LoopControl.classList.add("Enabled");
            } else {
              LoopControl.classList.remove("Enabled");
            }
            if (SpotifyPlayer.LoopType === "none") {
              SpotifyPlayer.LoopType = "context";
              Spicetify.Player.setRepeat(1);
            } else if (SpotifyPlayer.LoopType === "context") {
              SpotifyPlayer.LoopType = "track";
              Spicetify.Player.setRepeat(2);
            } else if (SpotifyPlayer.LoopType === "track") {
              SpotifyPlayer.LoopType = "none";
              Spicetify.Player.setRepeat(0);
            }
          };
          eventHandlers.clickHandlers.set(PlayPauseControl, playPauseHandler);
          eventHandlers.clickHandlers.set(PrevTrackControl, prevTrackHandler);
          eventHandlers.clickHandlers.set(NextTrackControl, nextTrackHandler);
          eventHandlers.clickHandlers.set(ShuffleControl, shuffleHandler);
          eventHandlers.clickHandlers.set(LoopControl, loopHandler);
          PlayPauseControl.addEventListener("click", playPauseHandler);
          PrevTrackControl.addEventListener("click", prevTrackHandler);
          NextTrackControl.addEventListener("click", nextTrackHandler);
          ShuffleControl.addEventListener("click", shuffleHandler);
          LoopControl.addEventListener("click", loopHandler);
          const cleanup = () => {
            playbackControls.forEach((control) => {
              const pressHandler = eventHandlers.pressHandlers.get(control);
              const releaseHandler = eventHandlers.releaseHandlers.get(control);
              control.removeEventListener("mousedown", pressHandler);
              control.removeEventListener("touchstart", pressHandler);
              control.removeEventListener("mouseup", releaseHandler);
              control.removeEventListener("mouseleave", releaseHandler);
              control.removeEventListener("touchend", releaseHandler);
            });
            PlayPauseControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(PlayPauseControl)
            );
            PrevTrackControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(PrevTrackControl)
            );
            NextTrackControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(NextTrackControl)
            );
            ShuffleControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(ShuffleControl)
            );
            LoopControl.removeEventListener(
              "click",
              eventHandlers.clickHandlers.get(LoopControl)
            );
            eventHandlers.pressHandlers.clear();
            eventHandlers.releaseHandlers.clear();
            eventHandlers.clickHandlers.clear();
            if (ControlsElement.parentNode) {
              ControlsElement.parentNode.removeChild(ControlsElement);
            }
          };
          return {
            Apply: () => {
              AppendQueue.push(ControlsElement);
            },
            CleanUp: cleanup,
            GetElement: () => ControlsElement
          };
        };
        const SetupSongProgressBar = () => {
          const songProgressBar = new SongProgressBar();
          ActiveSongProgressBarInstance_Map.set(
            "SongProgressBar_ClassInstance",
            songProgressBar
          );
          songProgressBar.Update({
            duration: SpotifyPlayer.GetTrackDuration() ?? 0,
            position: SpotifyPlayer.GetTrackPosition() ?? 0
          });
          const TimelineElem = document.createElement("div");
          ActiveSongProgressBarInstance_Map.set("TimeLineElement", TimelineElem);
          TimelineElem.classList.add("Timeline");
          TimelineElem.innerHTML = `
                    <span class="Time Position">${songProgressBar.GetFormattedPosition() ?? "0:00"}</span>
                    <div class="SliderBar" style="--SliderProgress: ${songProgressBar.GetProgressPercentage() ?? 0}">
                        <div class="Handle"></div>
                    </div>
                    <span class="Time Duration">${songProgressBar.GetFormattedDuration() ?? "0:00"}</span>
                `;
          const SliderBar = TimelineElem.querySelector(".SliderBar");
          if (!SliderBar) {
            console.error("Could not find SliderBar element");
            return null;
          }
          const updateTimelineState = (e2 = null) => {
            const PositionElem = TimelineElem.querySelector(".Time.Position");
            const DurationElem = TimelineElem.querySelector(".Time.Duration");
            if (!PositionElem || !DurationElem || !SliderBar) {
              console.error("Missing required elements for timeline update");
              return;
            }
            songProgressBar.Update({
              duration: SpotifyPlayer.GetTrackDuration() ?? 0,
              position: e2 ?? SpotifyPlayer.GetTrackPosition() ?? 0
            });
            const sliderPercentage = songProgressBar.GetProgressPercentage();
            const formattedPosition = songProgressBar.GetFormattedPosition();
            const formattedDuration = songProgressBar.GetFormattedDuration();
            SliderBar.style.setProperty(
              "--SliderProgress",
              sliderPercentage.toString()
            );
            DurationElem.textContent = formattedDuration;
            PositionElem.textContent = formattedPosition;
          };
          const sliderBarHandler = (event) => {
            const positionMs = songProgressBar.CalculatePositionFromClick({
              sliderBar: SliderBar,
              event
            });
            if (typeof SpotifyPlayer !== "undefined" && SpotifyPlayer.Seek) {
              SpotifyPlayer.Seek(positionMs);
            }
          };
          SliderBar.addEventListener("click", sliderBarHandler);
          updateTimelineState();
          ActiveSongProgressBarInstance_Map.set(
            "updateTimelineState_Function",
            updateTimelineState
          );
          const cleanup = () => {
            if (SliderBar) {
              SliderBar.removeEventListener("click", sliderBarHandler);
            }
            const progressBar = ActiveSongProgressBarInstance_Map.get(
              "SongProgressBar_ClassInstance"
            );
            if (progressBar) {
              progressBar.Destroy();
            }
            if (TimelineElem.parentNode) {
              TimelineElem.parentNode.removeChild(TimelineElem);
            }
            ActiveSongProgressBarInstance_Map.clear();
          };
          return {
            Apply: () => {
              AppendQueue.push(TimelineElem);
            },
            GetElement: () => TimelineElem,
            CleanUp: cleanup
          };
        };
        ActivePlaybackControlsInstance = SetupPlaybackControls();
        ActivePlaybackControlsInstance.Apply();
        ActiveSetupSongProgressBarInstance = SetupSongProgressBar();
        ActiveSetupSongProgressBarInstance.Apply();
        Whentil_default.When(
          () => document.querySelector(
            "#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls"
          ),
          () => {
            const viewControls = MediaBox.querySelector(".ViewControls");
            const fragment = document.createDocumentFragment();
            AppendQueue.forEach((element) => {
              fragment.appendChild(element);
            });
            MediaBox.innerHTML = "";
            if (viewControls)
              MediaBox.appendChild(viewControls);
            MediaBox.appendChild(fragment);
          }
        );
      }
    }
    const DragBox = Fullscreen_default.IsOpen ? document.querySelector(
      "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
    ) : document.querySelector(
      "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage"
    );
    const dropZones = document.querySelectorAll(
      "#SpicyLyricsPage .ContentBox .DropZone"
    );
    DragBox.addEventListener("dragstart", (e2) => {
      setTimeout(() => {
        document.querySelector("#SpicyLyricsPage").classList.add("SomethingDragging");
        if (NowBar.classList.contains("LeftSide")) {
          dropZones.forEach((zone) => {
            if (zone.classList.contains("LeftSide")) {
              zone.classList.add("Hidden");
            } else {
              zone.classList.remove("Hidden");
            }
          });
        } else if (NowBar.classList.contains("RightSide")) {
          dropZones.forEach((zone) => {
            if (zone.classList.contains("RightSide")) {
              zone.classList.add("Hidden");
            } else {
              zone.classList.remove("Hidden");
            }
          });
        }
        DragBox.classList.add("Dragging");
      }, 0);
    });
    DragBox.addEventListener("dragend", () => {
      document.querySelector("#SpicyLyricsPage").classList.remove("SomethingDragging");
      dropZones.forEach((zone) => zone.classList.remove("Hidden"));
      DragBox.classList.remove("Dragging");
    });
    dropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e2) => {
        e2.preventDefault();
        zone.classList.add("DraggingOver");
      });
      zone.addEventListener("dragleave", () => {
        zone.classList.remove("DraggingOver");
      });
      zone.addEventListener("drop", (e2) => {
        e2.preventDefault();
        zone.classList.remove("DraggingOver");
        const currentClass = NowBar.classList.contains("LeftSide") ? "LeftSide" : "RightSide";
        const newClass = zone.classList.contains("RightSide") ? "RightSide" : "LeftSide";
        NowBar.classList.remove(currentClass);
        NowBar.classList.add(newClass);
        const side = zone.classList.contains("RightSide") ? "right" : "left";
        storage_default.set("NowBarSide", side);
      });
    });
  }
  function CleanUpActiveComponents() {
    if (ActivePlaybackControlsInstance) {
      ActivePlaybackControlsInstance?.CleanUp();
      ActivePlaybackControlsInstance = null;
    }
    if (ActiveSetupSongProgressBarInstance) {
      ActiveSetupSongProgressBarInstance?.CleanUp();
      ActiveSetupSongProgressBarInstance = null;
    }
    if (ActiveSongProgressBarInstance_Map.size > 0) {
      ActiveSongProgressBarInstance_Map?.clear();
    }
    const MediaBox = document.querySelector(
      "#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent"
    );
    if (MediaBox) {
      const albumData = MediaBox.querySelector(".AlbumData");
      if (albumData)
        MediaBox.removeChild(albumData);
      const playbackControls = MediaBox.querySelector(".PlaybackControls");
      if (playbackControls)
        MediaBox.removeChild(playbackControls);
      const songProgressBar = MediaBox.querySelector(".SongProgressBar");
      if (songProgressBar)
        MediaBox.removeChild(songProgressBar);
    }
  }
  function CloseNowBar() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    NowBar.classList.remove("Active");
    storage_default.set("IsNowBarOpen", "false");
    CleanUpActiveComponents();
  }
  function ToggleNowBar() {
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen === "true") {
      CloseNowBar();
    } else {
      OpenNowBar();
    }
  }
  function Session_OpenNowBar() {
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen === "true") {
      OpenNowBar();
    } else {
      CloseNowBar();
    }
  }
  function UpdateNowBar(force = false) {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    const ArtistsDiv = NowBar.querySelector(".Header .Metadata .Artists");
    const ArtistsSpan = NowBar.querySelector(".Header .Metadata .Artists span");
    const MediaImage = NowBar.querySelector(
      ".Header .MediaBox .MediaImage"
    );
    const SongNameSpan = NowBar.querySelector(".Header .Metadata .SongName span");
    const MediaBox = NowBar.querySelector(".Header .MediaBox");
    const SongName = NowBar.querySelector(".Header .Metadata .SongName");
    ArtistsDiv.classList.add("Skeletoned");
    MediaBox.classList.add("Skeletoned");
    SongName.classList.add("Skeletoned");
    const IsNowBarOpen = storage_default.get("IsNowBarOpen");
    if (IsNowBarOpen == "false" && !force)
      return;
    SpotifyPlayer.Artwork.Get("xl").then((artwork) => {
      MediaImage.src = artwork;
      MediaBox.classList.remove("Skeletoned");
    });
    SpotifyPlayer.GetSongName().then((title) => {
      SongNameSpan.textContent = title;
      SongName.classList.remove("Skeletoned");
    });
    SpotifyPlayer.GetArtists().then((artists) => {
      const JoinedArtists = SpotifyPlayer.JoinArtists(artists);
      ArtistsSpan.textContent = JoinedArtists;
      ArtistsDiv.classList.remove("Skeletoned");
    });
    if (Fullscreen_default.IsOpen) {
      const NowBarAlbum = NowBar.querySelector(
        ".Header .MediaBox .AlbumData"
      );
      if (NowBarAlbum) {
        NowBarAlbum.classList.add("Skeletoned");
        const AlbumSpan = NowBarAlbum.querySelector("span");
        AlbumSpan.textContent = SpotifyPlayer.GetAlbumName();
        NowBarAlbum.classList.remove("Skeletoned");
      }
    }
  }
  function Session_NowBar_SetSide() {
    const NowBar = document.querySelector("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar)
      return;
    const CurrentSide = storage_default.get("NowBarSide");
    if (CurrentSide === "left") {
      storage_default.set("NowBarSide", "left");
      NowBar.classList.remove("RightSide");
      NowBar.classList.add("LeftSide");
    } else if (CurrentSide === "right") {
      storage_default.set("NowBarSide", "right");
      NowBar.classList.remove("LeftSide");
      NowBar.classList.add("RightSide");
    } else {
      storage_default.set("NowBarSide", "left");
      NowBar.classList.remove("RightSide");
      NowBar.classList.add("LeftSide");
    }
  }
  function DeregisterNowBarBtn() {
    Tooltips.NowBarToggle?.destroy();
    Tooltips.NowBarToggle = null;
    const nowBarButton = document.querySelector(
      "#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle"
    );
    nowBarButton?.remove();
  }
  Global_default.Event.listen("playback:playpause", (e2) => {
    if (Fullscreen_default.IsOpen) {
      if (ActivePlaybackControlsInstance) {
        const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
        const PlayPauseButton = PlaybackControls.querySelector(".PlayStateToggle");
        if (e2.data.isPaused) {
          PlayPauseButton.classList.remove("Playing");
          PlayPauseButton.classList.add("Paused");
          const SVG = PlayPauseButton.querySelector("svg");
          SVG.innerHTML = Icons.Play;
        } else {
          PlayPauseButton.classList.remove("Paused");
          PlayPauseButton.classList.add("Playing");
          const SVG = PlayPauseButton.querySelector("svg");
          SVG.innerHTML = Icons.Pause;
        }
      }
    }
  });
  Global_default.Event.listen("playback:loop", (e2) => {
    if (Fullscreen_default.IsOpen) {
      if (ActivePlaybackControlsInstance) {
        const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
        const LoopButton = PlaybackControls.querySelector(".LoopToggle");
        const SVG = LoopButton.querySelector("svg");
        SVG.style.filter = "";
        if (e2 === "track") {
          SVG.innerHTML = Icons.LoopTrack;
        } else {
          SVG.innerHTML = Icons.Loop;
        }
        if (e2 !== "none") {
          LoopButton.classList.add("Enabled");
          SVG.style.filter = "drop-shadow(0 0 5px white)";
        } else {
          LoopButton.classList.remove("Enabled");
        }
      }
    }
  });
  Global_default.Event.listen("playback:shuffle", (e2) => {
    if (Fullscreen_default.IsOpen) {
      if (ActivePlaybackControlsInstance) {
        const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
        const ShuffleButton = PlaybackControls.querySelector(".ShuffleToggle");
        const SVG = ShuffleButton.querySelector("svg");
        SVG.style.filter = "";
        if (e2 !== "none") {
          ShuffleButton.classList.add("Enabled");
          SVG.style.filter = "drop-shadow(0 0 5px white)";
        } else {
          ShuffleButton.classList.remove("Enabled");
        }
      }
    }
  });
  Global_default.Event.listen("playback:position", (e2) => {
    if (Fullscreen_default.IsOpen) {
      if (ActiveSetupSongProgressBarInstance) {
        const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
          "updateTimelineState_Function"
        );
        updateTimelineState(e2);
      }
    }
  });
  Global_default.Event.listen("fullscreen:exit", () => {
    CleanUpActiveComponents();
  });

  // node_modules/@google/genai/dist/web/index.mjs
  var BaseModule = class {
  };
  function formatMap(templateString, valueMap) {
    const regex = /\{([^}]+)\}/g;
    return templateString.replace(regex, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(valueMap, key)) {
        const value = valueMap[key];
        return value !== void 0 && value !== null ? String(value) : "";
      } else {
        throw new Error(`Key '${key}' not found in valueMap.`);
      }
    });
  }
  function setValueByPath(data, keys, value) {
    for (let i2 = 0; i2 < keys.length - 1; i2++) {
      const key = keys[i2];
      if (key.endsWith("[]")) {
        const keyName = key.slice(0, -2);
        if (!(keyName in data)) {
          if (Array.isArray(value)) {
            data[keyName] = Array.from({ length: value.length }, () => ({}));
          } else {
            throw new Error(`Value must be a list given an array path ${key}`);
          }
        }
        if (Array.isArray(data[keyName])) {
          const arrayData = data[keyName];
          if (Array.isArray(value)) {
            for (let j2 = 0; j2 < arrayData.length; j2++) {
              const entry = arrayData[j2];
              setValueByPath(entry, keys.slice(i2 + 1), value[j2]);
            }
          } else {
            for (const d2 of arrayData) {
              setValueByPath(d2, keys.slice(i2 + 1), value);
            }
          }
        }
        return;
      } else if (key.endsWith("[0]")) {
        const keyName = key.slice(0, -3);
        if (!(keyName in data)) {
          data[keyName] = [{}];
        }
        const arrayData = data[keyName];
        setValueByPath(arrayData[0], keys.slice(i2 + 1), value);
        return;
      }
      if (!data[key] || typeof data[key] !== "object") {
        data[key] = {};
      }
      data = data[key];
    }
    const keyToSet = keys[keys.length - 1];
    const existingData = data[keyToSet];
    if (existingData !== void 0) {
      if (!value || typeof value === "object" && Object.keys(value).length === 0) {
        return;
      }
      if (value === existingData) {
        return;
      }
      if (typeof existingData === "object" && typeof value === "object" && existingData !== null && value !== null) {
        Object.assign(existingData, value);
      } else {
        throw new Error(`Cannot set value for an existing key. Key: ${keyToSet}`);
      }
    } else {
      data[keyToSet] = value;
    }
  }
  function getValueByPath(data, keys) {
    try {
      if (keys.length === 1 && keys[0] === "_self") {
        return data;
      }
      for (let i2 = 0; i2 < keys.length; i2++) {
        if (typeof data !== "object" || data === null) {
          return void 0;
        }
        const key = keys[i2];
        if (key.endsWith("[]")) {
          const keyName = key.slice(0, -2);
          if (keyName in data) {
            const arrayData = data[keyName];
            if (!Array.isArray(arrayData)) {
              return void 0;
            }
            return arrayData.map((d2) => getValueByPath(d2, keys.slice(i2 + 1)));
          } else {
            return void 0;
          }
        } else {
          data = data[key];
        }
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        return void 0;
      }
      throw error;
    }
  }
  function tModel(apiClient, model) {
    if (!model || typeof model !== "string") {
      throw new Error("model is required and must be a string");
    }
    if (apiClient.isVertexAI()) {
      if (model.startsWith("publishers/") || model.startsWith("projects/") || model.startsWith("models/")) {
        return model;
      } else if (model.indexOf("/") >= 0) {
        const parts = model.split("/", 2);
        return `publishers/${parts[0]}/models/${parts[1]}`;
      } else {
        return `publishers/google/models/${model}`;
      }
    } else {
      if (model.startsWith("models/") || model.startsWith("tunedModels/")) {
        return model;
      } else {
        return `models/${model}`;
      }
    }
  }
  function tCachesModel(apiClient, model) {
    const transformedModel = tModel(apiClient, model);
    if (!transformedModel) {
      return "";
    }
    if (transformedModel.startsWith("publishers/") && apiClient.isVertexAI()) {
      return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/${transformedModel}`;
    } else if (transformedModel.startsWith("models/") && apiClient.isVertexAI()) {
      return `projects/${apiClient.getProject()}/locations/${apiClient.getLocation()}/publishers/google/${transformedModel}`;
    } else {
      return transformedModel;
    }
  }
  function tPart(apiClient, origin) {
    if (origin === null || origin === void 0) {
      throw new Error("PartUnion is required");
    }
    if (typeof origin === "object") {
      return origin;
    }
    if (typeof origin === "string") {
      return { text: origin };
    }
    throw new Error(`Unsupported part type: ${typeof origin}`);
  }
  function tParts(apiClient, origin) {
    if (origin === null || origin === void 0 || Array.isArray(origin) && origin.length === 0) {
      throw new Error("PartListUnion is required");
    }
    if (Array.isArray(origin)) {
      return origin.map((item) => tPart(apiClient, item));
    }
    return [tPart(apiClient, origin)];
  }
  function _isContent(origin) {
    return origin !== null && origin !== void 0 && typeof origin === "object" && "parts" in origin && Array.isArray(origin.parts);
  }
  function _isFunctionCallPart(origin) {
    return origin !== null && origin !== void 0 && typeof origin === "object" && "functionCall" in origin;
  }
  function _isUserPart(origin) {
    if (origin === null || origin === void 0) {
      return false;
    }
    if (_isFunctionCallPart(origin)) {
      return false;
    }
    return true;
  }
  function _areUserParts(origin) {
    if (origin === null || origin === void 0 || Array.isArray(origin) && origin.length === 0) {
      return false;
    }
    return origin.every(_isUserPart);
  }
  function tContent(apiClient, origin) {
    if (origin === null || origin === void 0) {
      throw new Error("ContentUnion is required");
    }
    if (_isContent(origin)) {
      return origin;
    }
    if (_isUserPart(origin)) {
      return {
        role: "user",
        parts: tParts(apiClient, origin)
      };
    } else {
      return {
        role: "model",
        parts: tParts(apiClient, origin)
      };
    }
  }
  function tContentsForEmbed(apiClient, origin) {
    if (!origin) {
      return [];
    }
    if (apiClient.isVertexAI() && Array.isArray(origin)) {
      return origin.flatMap((item) => {
        const content = tContent(apiClient, item);
        if (content.parts && content.parts.length > 0 && content.parts[0].text !== void 0) {
          return [content.parts[0].text];
        }
        return [];
      });
    } else if (apiClient.isVertexAI()) {
      const content = tContent(apiClient, origin);
      if (content.parts && content.parts.length > 0 && content.parts[0].text !== void 0) {
        return [content.parts[0].text];
      }
      return [];
    }
    if (Array.isArray(origin)) {
      return origin.map((item) => tContent(apiClient, item));
    }
    return [tContent(apiClient, origin)];
  }
  function _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts) {
    if (accumulatedParts.length === 0) {
      return;
    }
    if (_areUserParts(accumulatedParts)) {
      result.push({
        role: "user",
        parts: tParts(apiClient, accumulatedParts)
      });
    } else {
      result.push({
        role: "model",
        parts: tParts(apiClient, accumulatedParts)
      });
    }
    accumulatedParts.length = 0;
  }
  function _handleCurrentPart(apiClient, result, accumulatedParts, currentPart) {
    if (_isUserPart(currentPart) === _areUserParts(accumulatedParts)) {
      accumulatedParts.push(currentPart);
    } else {
      _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
      accumulatedParts.length = 0;
      accumulatedParts.push(currentPart);
    }
  }
  function tContents(apiClient, origin) {
    if (origin === null || origin === void 0 || Array.isArray(origin) && origin.length === 0) {
      throw new Error("contents are required");
    }
    if (!Array.isArray(origin)) {
      return [tContent(apiClient, origin)];
    }
    const result = [];
    const accumulatedParts = [];
    for (const content of origin) {
      if (_isContent(content)) {
        _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
        result.push(content);
      } else if (typeof content === "string" || typeof content === "object" && !Array.isArray(content)) {
        _handleCurrentPart(apiClient, result, accumulatedParts, content);
      } else if (Array.isArray(content)) {
        _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
        result.push({
          role: "user",
          parts: tParts(apiClient, content)
        });
      } else {
        throw new Error(`Unsupported content type: ${typeof content}`);
      }
    }
    _appendAccumulatedPartsAsContent(apiClient, result, accumulatedParts);
    return result;
  }
  function processSchema(apiClient, schema) {
    if (!apiClient.isVertexAI()) {
      if ("default" in schema) {
        throw new Error("Default value is not supported in the response schema for the Gemini API.");
      }
    }
    if ("anyOf" in schema) {
      if (schema["anyOf"] !== void 0) {
        for (const subSchema of schema["anyOf"]) {
          processSchema(apiClient, subSchema);
        }
      }
    }
    if ("items" in schema) {
      if (schema["items"] !== void 0) {
        processSchema(apiClient, schema["items"]);
      }
    }
    if ("properties" in schema) {
      if (schema["properties"] !== void 0) {
        for (const subSchema of Object.values(schema["properties"])) {
          processSchema(apiClient, subSchema);
        }
      }
    }
  }
  function tSchema(apiClient, schema) {
    processSchema(apiClient, schema);
    return schema;
  }
  function tSpeechConfig(apiClient, speechConfig) {
    if (typeof speechConfig === "object" && "voiceConfig" in speechConfig) {
      return speechConfig;
    } else if (typeof speechConfig === "string") {
      return {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: speechConfig
          }
        }
      };
    } else {
      throw new Error(`Unsupported speechConfig type: ${typeof speechConfig}`);
    }
  }
  function tTool(apiClient, tool) {
    return tool;
  }
  function tTools(apiClient, tool) {
    if (!Array.isArray(tool)) {
      throw new Error("tool is required and must be an array of Tools");
    }
    return tool;
  }
  function resourceName(client, resourceName2, resourcePrefix, splitsAfterPrefix = 1) {
    const shouldAppendPrefix = !resourceName2.startsWith(`${resourcePrefix}/`) && resourceName2.split("/").length === splitsAfterPrefix;
    if (client.isVertexAI()) {
      if (resourceName2.startsWith("projects/")) {
        return resourceName2;
      } else if (resourceName2.startsWith("locations/")) {
        return `projects/${client.getProject()}/${resourceName2}`;
      } else if (resourceName2.startsWith(`${resourcePrefix}/`)) {
        return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourceName2}`;
      } else if (shouldAppendPrefix) {
        return `projects/${client.getProject()}/locations/${client.getLocation()}/${resourcePrefix}/${resourceName2}`;
      } else {
        return resourceName2;
      }
    }
    if (shouldAppendPrefix) {
      return `${resourcePrefix}/${resourceName2}`;
    }
    return resourceName2;
  }
  function tCachedContentName(apiClient, name) {
    if (typeof name !== "string") {
      throw new Error("name must be a string");
    }
    return resourceName(apiClient, name, "cachedContents");
  }
  function tBytes(apiClient, fromImageBytes) {
    if (typeof fromImageBytes !== "string") {
      throw new Error("fromImageBytes must be a string");
    }
    return fromImageBytes;
  }
  function tFileName(apiClient, fromName) {
    if (typeof fromName !== "string") {
      throw new Error("fromName must be a string");
    }
    if (fromName.startsWith("files/")) {
      return fromName.split("files/")[1];
    }
    return fromName;
  }
  function partToMldev$1(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["videoMetadata"]) !== void 0) {
      throw new Error("videoMetadata parameter is not supported in Gemini API.");
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function functionDeclarationToMldev$1(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["response"]) !== void 0) {
      throw new Error("response parameter is not supported in Gemini API.");
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToMldev$1() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToMldev$1(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    if (getValueByPath(fromObject, ["retrieval"]) !== void 0) {
      throw new Error("retrieval parameter is not supported in Gemini API.");
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToMldev$1());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToMldev$1(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToMldev$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToMldev$1(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function createCachedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (parentObject !== void 0 && fromDisplayName != null) {
      setValueByPath(parentObject, ["displayName"], fromDisplayName);
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (parentObject !== void 0 && fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToMldev$1(apiClient, item);
        })));
      } else {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToMldev$1(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], fromTools.map((item) => {
          return toolToMldev$1(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["tools"], fromTools);
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToMldev$1(apiClient, fromToolConfig));
    }
    return toObject;
  }
  function createCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], tCachesModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], createCachedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function getCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function deleteCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function updateCachedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    return toObject;
  }
  function updateCachedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], updateCachedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function listCachedContentsConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ["pageSize"]);
    if (parentObject !== void 0 && fromPageSize != null) {
      setValueByPath(parentObject, ["_query", "pageSize"], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ["pageToken"]);
    if (parentObject !== void 0 && fromPageToken != null) {
      setValueByPath(parentObject, ["_query", "pageToken"], fromPageToken);
    }
    return toObject;
  }
  function listCachedContentsParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], listCachedContentsConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function partToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function schemaToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromExample = getValueByPath(fromObject, ["example"]);
    if (fromExample != null) {
      setValueByPath(toObject, ["example"], fromExample);
    }
    const fromPattern = getValueByPath(fromObject, ["pattern"]);
    if (fromPattern != null) {
      setValueByPath(toObject, ["pattern"], fromPattern);
    }
    const fromDefault = getValueByPath(fromObject, ["default"]);
    if (fromDefault != null) {
      setValueByPath(toObject, ["default"], fromDefault);
    }
    const fromMaxLength = getValueByPath(fromObject, ["maxLength"]);
    if (fromMaxLength != null) {
      setValueByPath(toObject, ["maxLength"], fromMaxLength);
    }
    const fromMinLength = getValueByPath(fromObject, ["minLength"]);
    if (fromMinLength != null) {
      setValueByPath(toObject, ["minLength"], fromMinLength);
    }
    const fromMinProperties = getValueByPath(fromObject, [
      "minProperties"
    ]);
    if (fromMinProperties != null) {
      setValueByPath(toObject, ["minProperties"], fromMinProperties);
    }
    const fromMaxProperties = getValueByPath(fromObject, [
      "maxProperties"
    ]);
    if (fromMaxProperties != null) {
      setValueByPath(toObject, ["maxProperties"], fromMaxProperties);
    }
    const fromAnyOf = getValueByPath(fromObject, ["anyOf"]);
    if (fromAnyOf != null) {
      setValueByPath(toObject, ["anyOf"], fromAnyOf);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ["enum"]);
    if (fromEnum != null) {
      setValueByPath(toObject, ["enum"], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ["format"]);
    if (fromFormat != null) {
      setValueByPath(toObject, ["format"], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ["items"]);
    if (fromItems != null) {
      setValueByPath(toObject, ["items"], fromItems);
    }
    const fromMaxItems = getValueByPath(fromObject, ["maxItems"]);
    if (fromMaxItems != null) {
      setValueByPath(toObject, ["maxItems"], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ["maximum"]);
    if (fromMaximum != null) {
      setValueByPath(toObject, ["maximum"], fromMaximum);
    }
    const fromMinItems = getValueByPath(fromObject, ["minItems"]);
    if (fromMinItems != null) {
      setValueByPath(toObject, ["minItems"], fromMinItems);
    }
    const fromMinimum = getValueByPath(fromObject, ["minimum"]);
    if (fromMinimum != null) {
      setValueByPath(toObject, ["minimum"], fromMinimum);
    }
    const fromNullable = getValueByPath(fromObject, ["nullable"]);
    if (fromNullable != null) {
      setValueByPath(toObject, ["nullable"], fromNullable);
    }
    const fromProperties = getValueByPath(fromObject, ["properties"]);
    if (fromProperties != null) {
      setValueByPath(toObject, ["properties"], fromProperties);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
      "propertyOrdering"
    ]);
    if (fromPropertyOrdering != null) {
      setValueByPath(toObject, ["propertyOrdering"], fromPropertyOrdering);
    }
    const fromRequired = getValueByPath(fromObject, ["required"]);
    if (fromRequired != null) {
      setValueByPath(toObject, ["required"], fromRequired);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (fromTitle != null) {
      setValueByPath(toObject, ["title"], fromTitle);
    }
    const fromType = getValueByPath(fromObject, ["type"]);
    if (fromType != null) {
      setValueByPath(toObject, ["type"], fromType);
    }
    return toObject;
  }
  function functionDeclarationToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromResponse = getValueByPath(fromObject, ["response"]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], schemaToVertex$1(apiClient, fromResponse));
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToVertex$1() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToVertex$1(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    const fromRetrieval = getValueByPath(fromObject, ["retrieval"]);
    if (fromRetrieval != null) {
      setValueByPath(toObject, ["retrieval"], fromRetrieval);
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToVertex$1());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToVertex$1(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToVertex$1(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToVertex$1(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function createCachedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (parentObject !== void 0 && fromDisplayName != null) {
      setValueByPath(parentObject, ["displayName"], fromDisplayName);
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (parentObject !== void 0 && fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex$1(apiClient, item);
        })));
      } else {
        setValueByPath(parentObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToVertex$1(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], fromTools.map((item) => {
          return toolToVertex$1(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["tools"], fromTools);
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToVertex$1(apiClient, fromToolConfig));
    }
    return toObject;
  }
  function createCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], tCachesModel(apiClient, fromModel));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], createCachedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function getCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function deleteCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function updateCachedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTtl = getValueByPath(fromObject, ["ttl"]);
    if (parentObject !== void 0 && fromTtl != null) {
      setValueByPath(parentObject, ["ttl"], fromTtl);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (parentObject !== void 0 && fromExpireTime != null) {
      setValueByPath(parentObject, ["expireTime"], fromExpireTime);
    }
    return toObject;
  }
  function updateCachedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "name"], tCachedContentName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], updateCachedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function listCachedContentsConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ["pageSize"]);
    if (parentObject !== void 0 && fromPageSize != null) {
      setValueByPath(parentObject, ["_query", "pageSize"], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ["pageToken"]);
    if (parentObject !== void 0 && fromPageToken != null) {
      setValueByPath(parentObject, ["_query", "pageToken"], fromPageToken);
    }
    return toObject;
  }
  function listCachedContentsParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], listCachedContentsConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function cachedContentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], fromModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (fromExpireTime != null) {
      setValueByPath(toObject, ["expireTime"], fromExpireTime);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function deleteCachedContentResponseFromMldev() {
    const toObject = {};
    return toObject;
  }
  function listCachedContentsResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
      "nextPageToken"
    ]);
    if (fromNextPageToken != null) {
      setValueByPath(toObject, ["nextPageToken"], fromNextPageToken);
    }
    const fromCachedContents = getValueByPath(fromObject, [
      "cachedContents"
    ]);
    if (fromCachedContents != null) {
      if (Array.isArray(fromCachedContents)) {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents.map((item) => {
          return cachedContentFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents);
      }
    }
    return toObject;
  }
  function cachedContentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["model"], fromModel);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromExpireTime = getValueByPath(fromObject, ["expireTime"]);
    if (fromExpireTime != null) {
      setValueByPath(toObject, ["expireTime"], fromExpireTime);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function deleteCachedContentResponseFromVertex() {
    const toObject = {};
    return toObject;
  }
  function listCachedContentsResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
      "nextPageToken"
    ]);
    if (fromNextPageToken != null) {
      setValueByPath(toObject, ["nextPageToken"], fromNextPageToken);
    }
    const fromCachedContents = getValueByPath(fromObject, [
      "cachedContents"
    ]);
    if (fromCachedContents != null) {
      if (Array.isArray(fromCachedContents)) {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents.map((item) => {
          return cachedContentFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["cachedContents"], fromCachedContents);
      }
    }
    return toObject;
  }
  var PagedItem;
  (function(PagedItem2) {
    PagedItem2["PAGED_ITEM_BATCH_JOBS"] = "batchJobs";
    PagedItem2["PAGED_ITEM_MODELS"] = "models";
    PagedItem2["PAGED_ITEM_TUNING_JOBS"] = "tuningJobs";
    PagedItem2["PAGED_ITEM_FILES"] = "files";
    PagedItem2["PAGED_ITEM_CACHED_CONTENTS"] = "cachedContents";
  })(PagedItem || (PagedItem = {}));
  var Pager = class {
    constructor(name, request, response, params) {
      this.pageInternal = [];
      this.paramsInternal = {};
      this.requestInternal = request;
      this.init(name, response, params);
    }
    init(name, response, params) {
      var _a2, _b;
      this.nameInternal = name;
      this.pageInternal = response[this.nameInternal] || [];
      this.idxInternal = 0;
      let requestParams = { config: {} };
      if (!params) {
        requestParams = { config: {} };
      } else if (typeof params === "object") {
        requestParams = Object.assign({}, params);
      } else {
        requestParams = params;
      }
      if (requestParams["config"]) {
        requestParams["config"]["pageToken"] = response["nextPageToken"];
      }
      this.paramsInternal = requestParams;
      this.pageInternalSize = (_b = (_a2 = requestParams["config"]) === null || _a2 === void 0 ? void 0 : _a2["pageSize"]) !== null && _b !== void 0 ? _b : this.pageInternal.length;
    }
    initNextPage(response) {
      this.init(this.nameInternal, response, this.paramsInternal);
    }
    get page() {
      return this.pageInternal;
    }
    get name() {
      return this.nameInternal;
    }
    get pageSize() {
      return this.pageInternalSize;
    }
    get params() {
      return this.paramsInternal;
    }
    get pageLength() {
      return this.pageInternal.length;
    }
    getItem(index) {
      return this.pageInternal[index];
    }
    [Symbol.asyncIterator]() {
      return {
        next: async () => {
          if (this.idxInternal >= this.pageLength) {
            if (this.hasNextPage()) {
              await this.nextPage();
            } else {
              return { value: void 0, done: true };
            }
          }
          const item = this.getItem(this.idxInternal);
          this.idxInternal += 1;
          return { value: item, done: false };
        },
        return: async () => {
          return { value: void 0, done: true };
        }
      };
    }
    async nextPage() {
      if (!this.hasNextPage()) {
        throw new Error("No more pages to fetch.");
      }
      const response = await this.requestInternal(this.params);
      this.initNextPage(response);
      return this.page;
    }
    hasNextPage() {
      var _a2;
      if (((_a2 = this.params["config"]) === null || _a2 === void 0 ? void 0 : _a2["pageToken"]) !== void 0) {
        return true;
      }
      return false;
    }
  };
  var Outcome;
  (function(Outcome2) {
    Outcome2["OUTCOME_UNSPECIFIED"] = "OUTCOME_UNSPECIFIED";
    Outcome2["OUTCOME_OK"] = "OUTCOME_OK";
    Outcome2["OUTCOME_FAILED"] = "OUTCOME_FAILED";
    Outcome2["OUTCOME_DEADLINE_EXCEEDED"] = "OUTCOME_DEADLINE_EXCEEDED";
  })(Outcome || (Outcome = {}));
  var Language;
  (function(Language2) {
    Language2["LANGUAGE_UNSPECIFIED"] = "LANGUAGE_UNSPECIFIED";
    Language2["PYTHON"] = "PYTHON";
  })(Language || (Language = {}));
  var Type;
  (function(Type2) {
    Type2["TYPE_UNSPECIFIED"] = "TYPE_UNSPECIFIED";
    Type2["STRING"] = "STRING";
    Type2["NUMBER"] = "NUMBER";
    Type2["INTEGER"] = "INTEGER";
    Type2["BOOLEAN"] = "BOOLEAN";
    Type2["ARRAY"] = "ARRAY";
    Type2["OBJECT"] = "OBJECT";
  })(Type || (Type = {}));
  var HarmCategory;
  (function(HarmCategory2) {
    HarmCategory2["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
    HarmCategory2["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
    HarmCategory2["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
    HarmCategory2["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
    HarmCategory2["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    HarmCategory2["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
  })(HarmCategory || (HarmCategory = {}));
  var HarmBlockMethod;
  (function(HarmBlockMethod2) {
    HarmBlockMethod2["HARM_BLOCK_METHOD_UNSPECIFIED"] = "HARM_BLOCK_METHOD_UNSPECIFIED";
    HarmBlockMethod2["SEVERITY"] = "SEVERITY";
    HarmBlockMethod2["PROBABILITY"] = "PROBABILITY";
  })(HarmBlockMethod || (HarmBlockMethod = {}));
  var HarmBlockThreshold;
  (function(HarmBlockThreshold2) {
    HarmBlockThreshold2["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
    HarmBlockThreshold2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    HarmBlockThreshold2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    HarmBlockThreshold2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    HarmBlockThreshold2["BLOCK_NONE"] = "BLOCK_NONE";
    HarmBlockThreshold2["OFF"] = "OFF";
  })(HarmBlockThreshold || (HarmBlockThreshold = {}));
  var Mode;
  (function(Mode2) {
    Mode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    Mode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
  })(Mode || (Mode = {}));
  var FinishReason;
  (function(FinishReason2) {
    FinishReason2["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
    FinishReason2["STOP"] = "STOP";
    FinishReason2["MAX_TOKENS"] = "MAX_TOKENS";
    FinishReason2["SAFETY"] = "SAFETY";
    FinishReason2["RECITATION"] = "RECITATION";
    FinishReason2["OTHER"] = "OTHER";
    FinishReason2["BLOCKLIST"] = "BLOCKLIST";
    FinishReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
    FinishReason2["SPII"] = "SPII";
    FinishReason2["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
    FinishReason2["IMAGE_SAFETY"] = "IMAGE_SAFETY";
  })(FinishReason || (FinishReason = {}));
  var HarmProbability;
  (function(HarmProbability2) {
    HarmProbability2["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
    HarmProbability2["NEGLIGIBLE"] = "NEGLIGIBLE";
    HarmProbability2["LOW"] = "LOW";
    HarmProbability2["MEDIUM"] = "MEDIUM";
    HarmProbability2["HIGH"] = "HIGH";
  })(HarmProbability || (HarmProbability = {}));
  var HarmSeverity;
  (function(HarmSeverity2) {
    HarmSeverity2["HARM_SEVERITY_UNSPECIFIED"] = "HARM_SEVERITY_UNSPECIFIED";
    HarmSeverity2["HARM_SEVERITY_NEGLIGIBLE"] = "HARM_SEVERITY_NEGLIGIBLE";
    HarmSeverity2["HARM_SEVERITY_LOW"] = "HARM_SEVERITY_LOW";
    HarmSeverity2["HARM_SEVERITY_MEDIUM"] = "HARM_SEVERITY_MEDIUM";
    HarmSeverity2["HARM_SEVERITY_HIGH"] = "HARM_SEVERITY_HIGH";
  })(HarmSeverity || (HarmSeverity = {}));
  var BlockedReason;
  (function(BlockedReason2) {
    BlockedReason2["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
    BlockedReason2["SAFETY"] = "SAFETY";
    BlockedReason2["OTHER"] = "OTHER";
    BlockedReason2["BLOCKLIST"] = "BLOCKLIST";
    BlockedReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
  })(BlockedReason || (BlockedReason = {}));
  var Modality;
  (function(Modality2) {
    Modality2["MODALITY_UNSPECIFIED"] = "MODALITY_UNSPECIFIED";
    Modality2["TEXT"] = "TEXT";
    Modality2["IMAGE"] = "IMAGE";
    Modality2["AUDIO"] = "AUDIO";
  })(Modality || (Modality = {}));
  var State;
  (function(State2) {
    State2["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    State2["ACTIVE"] = "ACTIVE";
    State2["ERROR"] = "ERROR";
  })(State || (State = {}));
  var DynamicRetrievalConfigMode;
  (function(DynamicRetrievalConfigMode2) {
    DynamicRetrievalConfigMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    DynamicRetrievalConfigMode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
  })(DynamicRetrievalConfigMode || (DynamicRetrievalConfigMode = {}));
  var FunctionCallingConfigMode;
  (function(FunctionCallingConfigMode2) {
    FunctionCallingConfigMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
    FunctionCallingConfigMode2["AUTO"] = "AUTO";
    FunctionCallingConfigMode2["ANY"] = "ANY";
    FunctionCallingConfigMode2["NONE"] = "NONE";
  })(FunctionCallingConfigMode || (FunctionCallingConfigMode = {}));
  var MediaResolution;
  (function(MediaResolution2) {
    MediaResolution2["MEDIA_RESOLUTION_UNSPECIFIED"] = "MEDIA_RESOLUTION_UNSPECIFIED";
    MediaResolution2["MEDIA_RESOLUTION_LOW"] = "MEDIA_RESOLUTION_LOW";
    MediaResolution2["MEDIA_RESOLUTION_MEDIUM"] = "MEDIA_RESOLUTION_MEDIUM";
    MediaResolution2["MEDIA_RESOLUTION_HIGH"] = "MEDIA_RESOLUTION_HIGH";
  })(MediaResolution || (MediaResolution = {}));
  var SafetyFilterLevel;
  (function(SafetyFilterLevel2) {
    SafetyFilterLevel2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    SafetyFilterLevel2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    SafetyFilterLevel2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    SafetyFilterLevel2["BLOCK_NONE"] = "BLOCK_NONE";
  })(SafetyFilterLevel || (SafetyFilterLevel = {}));
  var PersonGeneration;
  (function(PersonGeneration2) {
    PersonGeneration2["DONT_ALLOW"] = "DONT_ALLOW";
    PersonGeneration2["ALLOW_ADULT"] = "ALLOW_ADULT";
    PersonGeneration2["ALLOW_ALL"] = "ALLOW_ALL";
  })(PersonGeneration || (PersonGeneration = {}));
  var ImagePromptLanguage;
  (function(ImagePromptLanguage2) {
    ImagePromptLanguage2["auto"] = "auto";
    ImagePromptLanguage2["en"] = "en";
    ImagePromptLanguage2["ja"] = "ja";
    ImagePromptLanguage2["ko"] = "ko";
    ImagePromptLanguage2["hi"] = "hi";
  })(ImagePromptLanguage || (ImagePromptLanguage = {}));
  var FileState;
  (function(FileState2) {
    FileState2["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    FileState2["PROCESSING"] = "PROCESSING";
    FileState2["ACTIVE"] = "ACTIVE";
    FileState2["FAILED"] = "FAILED";
  })(FileState || (FileState = {}));
  var FileSource;
  (function(FileSource2) {
    FileSource2["SOURCE_UNSPECIFIED"] = "SOURCE_UNSPECIFIED";
    FileSource2["UPLOADED"] = "UPLOADED";
    FileSource2["GENERATED"] = "GENERATED";
  })(FileSource || (FileSource = {}));
  var MaskReferenceMode;
  (function(MaskReferenceMode2) {
    MaskReferenceMode2["MASK_MODE_DEFAULT"] = "MASK_MODE_DEFAULT";
    MaskReferenceMode2["MASK_MODE_USER_PROVIDED"] = "MASK_MODE_USER_PROVIDED";
    MaskReferenceMode2["MASK_MODE_BACKGROUND"] = "MASK_MODE_BACKGROUND";
    MaskReferenceMode2["MASK_MODE_FOREGROUND"] = "MASK_MODE_FOREGROUND";
    MaskReferenceMode2["MASK_MODE_SEMANTIC"] = "MASK_MODE_SEMANTIC";
  })(MaskReferenceMode || (MaskReferenceMode = {}));
  var ControlReferenceType;
  (function(ControlReferenceType2) {
    ControlReferenceType2["CONTROL_TYPE_DEFAULT"] = "CONTROL_TYPE_DEFAULT";
    ControlReferenceType2["CONTROL_TYPE_CANNY"] = "CONTROL_TYPE_CANNY";
    ControlReferenceType2["CONTROL_TYPE_SCRIBBLE"] = "CONTROL_TYPE_SCRIBBLE";
    ControlReferenceType2["CONTROL_TYPE_FACE_MESH"] = "CONTROL_TYPE_FACE_MESH";
  })(ControlReferenceType || (ControlReferenceType = {}));
  var SubjectReferenceType;
  (function(SubjectReferenceType2) {
    SubjectReferenceType2["SUBJECT_TYPE_DEFAULT"] = "SUBJECT_TYPE_DEFAULT";
    SubjectReferenceType2["SUBJECT_TYPE_PERSON"] = "SUBJECT_TYPE_PERSON";
    SubjectReferenceType2["SUBJECT_TYPE_ANIMAL"] = "SUBJECT_TYPE_ANIMAL";
    SubjectReferenceType2["SUBJECT_TYPE_PRODUCT"] = "SUBJECT_TYPE_PRODUCT";
  })(SubjectReferenceType || (SubjectReferenceType = {}));
  var GenerateContentResponse = class {
    get text() {
      var _a2, _b, _c, _d, _e2, _f, _g, _h;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning text from the first one.");
      }
      let text = "";
      let anyTextPartText = false;
      const nonTextParts = [];
      for (const part of (_h = (_g = (_f = (_e2 = this.candidates) === null || _e2 === void 0 ? void 0 : _e2[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) !== null && _h !== void 0 ? _h : []) {
        for (const [fieldName, fieldValue] of Object.entries(part)) {
          if (fieldName !== "text" && fieldName !== "thought" && (fieldValue !== null || fieldValue !== void 0)) {
            nonTextParts.push(fieldName);
          }
        }
        if (typeof part.text === "string") {
          if (typeof part.thought === "boolean" && part.thought) {
            continue;
          }
          anyTextPartText = true;
          text += part.text;
        }
      }
      if (nonTextParts.length > 0) {
        console.warn(`there are non-text parts ${nonTextParts} in the response, returning concatenation of all text parts. Please refer to the non text parts for a full response from model.`);
      }
      return anyTextPartText ? text : void 0;
    }
    get functionCalls() {
      var _a2, _b, _c, _d, _e2, _f, _g, _h;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning function calls from the first one.");
      }
      const functionCalls = (_h = (_g = (_f = (_e2 = this.candidates) === null || _e2 === void 0 ? void 0 : _e2[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.functionCall).map((part) => part.functionCall).filter((functionCall) => functionCall !== void 0);
      if ((functionCalls === null || functionCalls === void 0 ? void 0 : functionCalls.length) === 0) {
        return void 0;
      }
      return functionCalls;
    }
    get executableCode() {
      var _a2, _b, _c, _d, _e2, _f, _g, _h, _j;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning executable code from the first one.");
      }
      const executableCode = (_h = (_g = (_f = (_e2 = this.candidates) === null || _e2 === void 0 ? void 0 : _e2[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.executableCode).map((part) => part.executableCode).filter((executableCode2) => executableCode2 !== void 0);
      if ((executableCode === null || executableCode === void 0 ? void 0 : executableCode.length) === 0) {
        return void 0;
      }
      return (_j = executableCode === null || executableCode === void 0 ? void 0 : executableCode[0]) === null || _j === void 0 ? void 0 : _j.code;
    }
    get codeExecutionResult() {
      var _a2, _b, _c, _d, _e2, _f, _g, _h, _j;
      if (((_d = (_c = (_b = (_a2 = this.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.length) === 0) {
        return void 0;
      }
      if (this.candidates && this.candidates.length > 1) {
        console.warn("there are multiple candidates in the response, returning code execution result from the first one.");
      }
      const codeExecutionResult = (_h = (_g = (_f = (_e2 = this.candidates) === null || _e2 === void 0 ? void 0 : _e2[0]) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.parts) === null || _h === void 0 ? void 0 : _h.filter((part) => part.codeExecutionResult).map((part) => part.codeExecutionResult).filter((codeExecutionResult2) => codeExecutionResult2 !== void 0);
      if ((codeExecutionResult === null || codeExecutionResult === void 0 ? void 0 : codeExecutionResult.length) === 0) {
        return void 0;
      }
      return (_j = codeExecutionResult === null || codeExecutionResult === void 0 ? void 0 : codeExecutionResult[0]) === null || _j === void 0 ? void 0 : _j.output;
    }
  };
  var EmbedContentResponse = class {
  };
  var GenerateImagesResponse = class {
  };
  var CountTokensResponse = class {
  };
  var ComputeTokensResponse = class {
  };
  var DeleteCachedContentResponse = class {
  };
  var ListCachedContentsResponse = class {
  };
  var ListFilesResponse = class {
  };
  var HttpResponse = class {
    constructor(response) {
      const headers = {};
      for (const pair of response.headers.entries()) {
        headers[pair[0]] = pair[1];
      }
      this.headers = headers;
      this.responseInternal = response;
    }
    json() {
      return this.responseInternal.json();
    }
  };
  var CreateFileResponse = class {
  };
  var DeleteFileResponse = class {
  };
  var Caches = class extends BaseModule {
    constructor(apiClient) {
      super();
      this.apiClient = apiClient;
      this.list = async (params = {}) => {
        return new Pager(PagedItem.PAGED_ITEM_CACHED_CONTENTS, (x2) => this.listInternal(x2), await this.listInternal(params), params);
      };
    }
    async create(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = createCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromVertex(this.apiClient, apiResponse);
          return resp;
        });
      } else {
        const body = createCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async get(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = getCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromVertex(this.apiClient, apiResponse);
          return resp;
        });
      } else {
        const body = getCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async delete(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = deleteCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "DELETE",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then(() => {
          const resp = deleteCachedContentResponseFromVertex();
          const typedResp = new DeleteCachedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = deleteCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "DELETE",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then(() => {
          const resp = deleteCachedContentResponseFromMldev();
          const typedResp = new DeleteCachedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async update(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = updateCachedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "PATCH",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromVertex(this.apiClient, apiResponse);
          return resp;
        });
      } else {
        const body = updateCachedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{name}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "PATCH",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = cachedContentFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async listInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = listCachedContentsParametersToVertex(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = listCachedContentsResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new ListCachedContentsResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = listCachedContentsParametersToMldev(this.apiClient, params);
        path = formatMap("cachedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = listCachedContentsResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new ListCachedContentsResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
  };
  function __values(o2) {
    var s2 = typeof Symbol === "function" && Symbol.iterator, m2 = s2 && o2[s2], i2 = 0;
    if (m2)
      return m2.call(o2);
    if (o2 && typeof o2.length === "number")
      return {
        next: function() {
          if (o2 && i2 >= o2.length)
            o2 = void 0;
          return { value: o2 && o2[i2++], done: !o2 };
        }
      };
    throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __await(v2) {
    return this instanceof __await ? (this.v = v2, this) : new __await(v2);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var g2 = generator.apply(thisArg, _arguments || []), i2, q2 = [];
    return i2 = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i2[Symbol.asyncIterator] = function() {
      return this;
    }, i2;
    function awaitReturn(f) {
      return function(v2) {
        return Promise.resolve(v2).then(f, reject);
      };
    }
    function verb(n2, f) {
      if (g2[n2]) {
        i2[n2] = function(v2) {
          return new Promise(function(a2, b2) {
            q2.push([n2, v2, a2, b2]) > 1 || resume(n2, v2);
          });
        };
        if (f)
          i2[n2] = f(i2[n2]);
      }
    }
    function resume(n2, v2) {
      try {
        step(g2[n2](v2));
      } catch (e2) {
        settle(q2[0][3], e2);
      }
    }
    function step(r2) {
      r2.value instanceof __await ? Promise.resolve(r2.value.v).then(fulfill, reject) : settle(q2[0][2], r2);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v2) {
      if (f(v2), q2.shift(), q2.length)
        resume(q2[0][0], q2[0][1]);
    }
  }
  function __asyncValues(o2) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var m2 = o2[Symbol.asyncIterator], i2;
    return m2 ? m2.call(o2) : (o2 = typeof __values === "function" ? __values(o2) : o2[Symbol.iterator](), i2 = {}, verb("next"), verb("throw"), verb("return"), i2[Symbol.asyncIterator] = function() {
      return this;
    }, i2);
    function verb(n2) {
      i2[n2] = o2[n2] && function(v2) {
        return new Promise(function(resolve, reject) {
          v2 = o2[n2](v2), settle(resolve, reject, v2.done, v2.value);
        });
      };
    }
    function settle(resolve, reject, d2, v2) {
      Promise.resolve(v2).then(function(v3) {
        resolve({ value: v3, done: d2 });
      }, reject);
    }
  }
  function isValidResponse(response) {
    var _a2;
    if (response.candidates == void 0 || response.candidates.length === 0) {
      return false;
    }
    const content = (_a2 = response.candidates[0]) === null || _a2 === void 0 ? void 0 : _a2.content;
    if (content === void 0) {
      return false;
    }
    return isValidContent(content);
  }
  function isValidContent(content) {
    if (content.parts === void 0 || content.parts.length === 0) {
      return false;
    }
    for (const part of content.parts) {
      if (part === void 0 || Object.keys(part).length === 0) {
        return false;
      }
      if (part.text !== void 0 && part.text === "") {
        return false;
      }
    }
    return true;
  }
  function validateHistory(history) {
    if (history.length === 0) {
      return;
    }
    if (history[0].role !== "user") {
      throw new Error("History must start with a user turn.");
    }
    for (const content of history) {
      if (content.role !== "user" && content.role !== "model") {
        throw new Error(`Role must be user or model, but got ${content.role}.`);
      }
    }
  }
  function extractCuratedHistory(comprehensiveHistory) {
    if (comprehensiveHistory === void 0 || comprehensiveHistory.length === 0) {
      return [];
    }
    const curatedHistory = [];
    const length = comprehensiveHistory.length;
    let i2 = 0;
    let userInput = comprehensiveHistory[0];
    while (i2 < length) {
      if (comprehensiveHistory[i2].role === "user") {
        userInput = comprehensiveHistory[i2];
        i2++;
      } else {
        const modelOutput = [];
        let isValid = true;
        while (i2 < length && comprehensiveHistory[i2].role === "model") {
          modelOutput.push(comprehensiveHistory[i2]);
          if (isValid && !isValidContent(comprehensiveHistory[i2])) {
            isValid = false;
          }
          i2++;
        }
        if (isValid) {
          curatedHistory.push(userInput);
          curatedHistory.push(...modelOutput);
        }
      }
    }
    return curatedHistory;
  }
  var Chats = class {
    constructor(modelsModule, apiClient) {
      this.modelsModule = modelsModule;
      this.apiClient = apiClient;
    }
    create(params) {
      return new Chat(this.apiClient, this.modelsModule, params.model, params.config, params.history);
    }
  };
  var Chat = class {
    constructor(apiClient, modelsModule, model, config = {}, history = []) {
      this.apiClient = apiClient;
      this.modelsModule = modelsModule;
      this.model = model;
      this.config = config;
      this.history = history;
      this.sendPromise = Promise.resolve();
      validateHistory(history);
    }
    async sendMessage(params) {
      var _a2;
      await this.sendPromise;
      const inputContent = tContent(this.apiClient, params.message);
      const responsePromise = this.modelsModule.generateContent({
        model: this.model,
        contents: this.getHistory(true).concat(inputContent),
        config: (_a2 = params.config) !== null && _a2 !== void 0 ? _a2 : this.config
      });
      this.sendPromise = (async () => {
        var _a3, _b;
        const response = await responsePromise;
        const outputContent = (_b = (_a3 = response.candidates) === null || _a3 === void 0 ? void 0 : _a3[0]) === null || _b === void 0 ? void 0 : _b.content;
        const modelOutput = outputContent ? [outputContent] : [];
        this.recordHistory(inputContent, modelOutput);
        return;
      })();
      await this.sendPromise;
      return responsePromise;
    }
    async sendMessageStream(params) {
      var _a2;
      await this.sendPromise;
      const inputContent = tContent(this.apiClient, params.message);
      const streamResponse = this.modelsModule.generateContentStream({
        model: this.model,
        contents: this.getHistory(true).concat(inputContent),
        config: (_a2 = params.config) !== null && _a2 !== void 0 ? _a2 : this.config
      });
      this.sendPromise = streamResponse.then(() => void 0);
      const response = await streamResponse;
      const result = this.processStreamResponse(response, inputContent);
      return result;
    }
    getHistory(curated = false) {
      return curated ? extractCuratedHistory(this.history) : this.history;
    }
    processStreamResponse(streamResponse, inputContent) {
      var _a2, _b;
      return __asyncGenerator(this, arguments, function* processStreamResponse_1() {
        var _c, e_1, _d, _e2;
        const outputContent = [];
        try {
          for (var _f = true, streamResponse_1 = __asyncValues(streamResponse), streamResponse_1_1; streamResponse_1_1 = yield __await(streamResponse_1.next()), _c = streamResponse_1_1.done, !_c; _f = true) {
            _e2 = streamResponse_1_1.value;
            _f = false;
            const chunk = _e2;
            if (isValidResponse(chunk)) {
              const content = (_b = (_a2 = chunk.candidates) === null || _a2 === void 0 ? void 0 : _a2[0]) === null || _b === void 0 ? void 0 : _b.content;
              if (content !== void 0) {
                outputContent.push(content);
              }
            }
            yield yield __await(chunk);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (!_f && !_c && (_d = streamResponse_1.return))
              yield __await(_d.call(streamResponse_1));
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        this.recordHistory(inputContent, outputContent);
      });
    }
    recordHistory(userInput, modelOutput) {
      let outputContents = [];
      if (modelOutput.length > 0 && modelOutput.every((content) => content.role === "model")) {
        outputContents = modelOutput;
      } else {
        outputContents.push({
          role: "model",
          parts: []
        });
      }
      this.history.push(userInput);
      this.history.push(...outputContents);
    }
  };
  function partToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["videoMetadata"]) !== void 0) {
      throw new Error("videoMetadata parameter is not supported in Gemini API.");
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function schemaToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["example"]) !== void 0) {
      throw new Error("example parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["pattern"]) !== void 0) {
      throw new Error("pattern parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["default"]) !== void 0) {
      throw new Error("default parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["maxLength"]) !== void 0) {
      throw new Error("maxLength parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["minLength"]) !== void 0) {
      throw new Error("minLength parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["minProperties"]) !== void 0) {
      throw new Error("minProperties parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["maxProperties"]) !== void 0) {
      throw new Error("maxProperties parameter is not supported in Gemini API.");
    }
    const fromAnyOf = getValueByPath(fromObject, ["anyOf"]);
    if (fromAnyOf != null) {
      setValueByPath(toObject, ["anyOf"], fromAnyOf);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ["enum"]);
    if (fromEnum != null) {
      setValueByPath(toObject, ["enum"], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ["format"]);
    if (fromFormat != null) {
      setValueByPath(toObject, ["format"], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ["items"]);
    if (fromItems != null) {
      setValueByPath(toObject, ["items"], fromItems);
    }
    const fromMaxItems = getValueByPath(fromObject, ["maxItems"]);
    if (fromMaxItems != null) {
      setValueByPath(toObject, ["maxItems"], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ["maximum"]);
    if (fromMaximum != null) {
      setValueByPath(toObject, ["maximum"], fromMaximum);
    }
    const fromMinItems = getValueByPath(fromObject, ["minItems"]);
    if (fromMinItems != null) {
      setValueByPath(toObject, ["minItems"], fromMinItems);
    }
    const fromMinimum = getValueByPath(fromObject, ["minimum"]);
    if (fromMinimum != null) {
      setValueByPath(toObject, ["minimum"], fromMinimum);
    }
    const fromNullable = getValueByPath(fromObject, ["nullable"]);
    if (fromNullable != null) {
      setValueByPath(toObject, ["nullable"], fromNullable);
    }
    const fromProperties = getValueByPath(fromObject, ["properties"]);
    if (fromProperties != null) {
      setValueByPath(toObject, ["properties"], fromProperties);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
      "propertyOrdering"
    ]);
    if (fromPropertyOrdering != null) {
      setValueByPath(toObject, ["propertyOrdering"], fromPropertyOrdering);
    }
    const fromRequired = getValueByPath(fromObject, ["required"]);
    if (fromRequired != null) {
      setValueByPath(toObject, ["required"], fromRequired);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (fromTitle != null) {
      setValueByPath(toObject, ["title"], fromTitle);
    }
    const fromType = getValueByPath(fromObject, ["type"]);
    if (fromType != null) {
      setValueByPath(toObject, ["type"], fromType);
    }
    return toObject;
  }
  function safetySettingToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["method"]) !== void 0) {
      throw new Error("method parameter is not supported in Gemini API.");
    }
    const fromCategory = getValueByPath(fromObject, ["category"]);
    if (fromCategory != null) {
      setValueByPath(toObject, ["category"], fromCategory);
    }
    const fromThreshold = getValueByPath(fromObject, ["threshold"]);
    if (fromThreshold != null) {
      setValueByPath(toObject, ["threshold"], fromThreshold);
    }
    return toObject;
  }
  function functionDeclarationToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["response"]) !== void 0) {
      throw new Error("response parameter is not supported in Gemini API.");
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToMldev() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToMldev(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    if (getValueByPath(fromObject, ["retrieval"]) !== void 0) {
      throw new Error("retrieval parameter is not supported in Gemini API.");
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToMldev());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToMldev(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToMldev(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function prebuiltVoiceConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceName = getValueByPath(fromObject, ["voiceName"]);
    if (fromVoiceName != null) {
      setValueByPath(toObject, ["voiceName"], fromVoiceName);
    }
    return toObject;
  }
  function voiceConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromPrebuiltVoiceConfig = getValueByPath(fromObject, [
      "prebuiltVoiceConfig"
    ]);
    if (fromPrebuiltVoiceConfig != null) {
      setValueByPath(toObject, ["prebuiltVoiceConfig"], prebuiltVoiceConfigToMldev(apiClient, fromPrebuiltVoiceConfig));
    }
    return toObject;
  }
  function speechConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceConfig = getValueByPath(fromObject, ["voiceConfig"]);
    if (fromVoiceConfig != null) {
      setValueByPath(toObject, ["voiceConfig"], voiceConfigToMldev(apiClient, fromVoiceConfig));
    }
    return toObject;
  }
  function thinkingConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromIncludeThoughts = getValueByPath(fromObject, [
      "includeThoughts"
    ]);
    if (fromIncludeThoughts != null) {
      setValueByPath(toObject, ["includeThoughts"], fromIncludeThoughts);
    }
    return toObject;
  }
  function generateContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToMldev(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTemperature = getValueByPath(fromObject, ["temperature"]);
    if (fromTemperature != null) {
      setValueByPath(toObject, ["temperature"], fromTemperature);
    }
    const fromTopP = getValueByPath(fromObject, ["topP"]);
    if (fromTopP != null) {
      setValueByPath(toObject, ["topP"], fromTopP);
    }
    const fromTopK = getValueByPath(fromObject, ["topK"]);
    if (fromTopK != null) {
      setValueByPath(toObject, ["topK"], fromTopK);
    }
    const fromCandidateCount = getValueByPath(fromObject, [
      "candidateCount"
    ]);
    if (fromCandidateCount != null) {
      setValueByPath(toObject, ["candidateCount"], fromCandidateCount);
    }
    const fromMaxOutputTokens = getValueByPath(fromObject, [
      "maxOutputTokens"
    ]);
    if (fromMaxOutputTokens != null) {
      setValueByPath(toObject, ["maxOutputTokens"], fromMaxOutputTokens);
    }
    const fromStopSequences = getValueByPath(fromObject, [
      "stopSequences"
    ]);
    if (fromStopSequences != null) {
      setValueByPath(toObject, ["stopSequences"], fromStopSequences);
    }
    const fromResponseLogprobs = getValueByPath(fromObject, [
      "responseLogprobs"
    ]);
    if (fromResponseLogprobs != null) {
      setValueByPath(toObject, ["responseLogprobs"], fromResponseLogprobs);
    }
    const fromLogprobs = getValueByPath(fromObject, ["logprobs"]);
    if (fromLogprobs != null) {
      setValueByPath(toObject, ["logprobs"], fromLogprobs);
    }
    const fromPresencePenalty = getValueByPath(fromObject, [
      "presencePenalty"
    ]);
    if (fromPresencePenalty != null) {
      setValueByPath(toObject, ["presencePenalty"], fromPresencePenalty);
    }
    const fromFrequencyPenalty = getValueByPath(fromObject, [
      "frequencyPenalty"
    ]);
    if (fromFrequencyPenalty != null) {
      setValueByPath(toObject, ["frequencyPenalty"], fromFrequencyPenalty);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (fromSeed != null) {
      setValueByPath(toObject, ["seed"], fromSeed);
    }
    const fromResponseMimeType = getValueByPath(fromObject, [
      "responseMimeType"
    ]);
    if (fromResponseMimeType != null) {
      setValueByPath(toObject, ["responseMimeType"], fromResponseMimeType);
    }
    const fromResponseSchema = getValueByPath(fromObject, [
      "responseSchema"
    ]);
    if (fromResponseSchema != null) {
      setValueByPath(toObject, ["responseSchema"], schemaToMldev(apiClient, tSchema(apiClient, fromResponseSchema)));
    }
    if (getValueByPath(fromObject, ["routingConfig"]) !== void 0) {
      throw new Error("routingConfig parameter is not supported in Gemini API.");
    }
    const fromSafetySettings = getValueByPath(fromObject, [
      "safetySettings"
    ]);
    if (parentObject !== void 0 && fromSafetySettings != null) {
      if (Array.isArray(fromSafetySettings)) {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings.map((item) => {
          return safetySettingToMldev(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings);
      }
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, tTools(apiClient, fromTools).map((item) => {
          return toolToMldev(apiClient, tTool(apiClient, item));
        })));
      } else {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, fromTools));
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToMldev(apiClient, fromToolConfig));
    }
    if (getValueByPath(fromObject, ["labels"]) !== void 0) {
      throw new Error("labels parameter is not supported in Gemini API.");
    }
    const fromCachedContent = getValueByPath(fromObject, [
      "cachedContent"
    ]);
    if (parentObject !== void 0 && fromCachedContent != null) {
      setValueByPath(parentObject, ["cachedContent"], tCachedContentName(apiClient, fromCachedContent));
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities != null) {
      setValueByPath(toObject, ["responseModalities"], fromResponseModalities);
    }
    const fromMediaResolution = getValueByPath(fromObject, [
      "mediaResolution"
    ]);
    if (fromMediaResolution != null) {
      setValueByPath(toObject, ["mediaResolution"], fromMediaResolution);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig != null) {
      setValueByPath(toObject, ["speechConfig"], speechConfigToMldev(apiClient, tSpeechConfig(apiClient, fromSpeechConfig)));
    }
    if (getValueByPath(fromObject, ["audioTimestamp"]) !== void 0) {
      throw new Error("audioTimestamp parameter is not supported in Gemini API.");
    }
    const fromThinkingConfig = getValueByPath(fromObject, [
      "thinkingConfig"
    ]);
    if (fromThinkingConfig != null) {
      setValueByPath(toObject, ["thinkingConfig"], thinkingConfigToMldev(apiClient, fromThinkingConfig));
    }
    return toObject;
  }
  function generateContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToMldev(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["generationConfig"], generateContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function embedContentConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTaskType = getValueByPath(fromObject, ["taskType"]);
    if (parentObject !== void 0 && fromTaskType != null) {
      setValueByPath(parentObject, ["requests[]", "taskType"], fromTaskType);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (parentObject !== void 0 && fromTitle != null) {
      setValueByPath(parentObject, ["requests[]", "title"], fromTitle);
    }
    const fromOutputDimensionality = getValueByPath(fromObject, [
      "outputDimensionality"
    ]);
    if (parentObject !== void 0 && fromOutputDimensionality != null) {
      setValueByPath(parentObject, ["requests[]", "outputDimensionality"], fromOutputDimensionality);
    }
    if (getValueByPath(fromObject, ["mimeType"]) !== void 0) {
      throw new Error("mimeType parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["autoTruncate"]) !== void 0) {
      throw new Error("autoTruncate parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function embedContentParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      setValueByPath(toObject, ["requests[]", "content"], tContentsForEmbed(apiClient, fromContents));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], embedContentConfigToMldev(apiClient, fromConfig, toObject));
    }
    const fromModelForEmbedContent = getValueByPath(fromObject, ["model"]);
    if (fromModelForEmbedContent !== void 0) {
      setValueByPath(toObject, ["requests[]", "model"], tModel(apiClient, fromModelForEmbedContent));
    }
    return toObject;
  }
  function generateImagesConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["outputGcsUri"]) !== void 0) {
      throw new Error("outputGcsUri parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["negativePrompt"]) !== void 0) {
      throw new Error("negativePrompt parameter is not supported in Gemini API.");
    }
    const fromNumberOfImages = getValueByPath(fromObject, [
      "numberOfImages"
    ]);
    if (parentObject !== void 0 && fromNumberOfImages != null) {
      setValueByPath(parentObject, ["parameters", "sampleCount"], fromNumberOfImages);
    }
    const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
    if (parentObject !== void 0 && fromAspectRatio != null) {
      setValueByPath(parentObject, ["parameters", "aspectRatio"], fromAspectRatio);
    }
    const fromGuidanceScale = getValueByPath(fromObject, [
      "guidanceScale"
    ]);
    if (parentObject !== void 0 && fromGuidanceScale != null) {
      setValueByPath(parentObject, ["parameters", "guidanceScale"], fromGuidanceScale);
    }
    if (getValueByPath(fromObject, ["seed"]) !== void 0) {
      throw new Error("seed parameter is not supported in Gemini API.");
    }
    const fromSafetyFilterLevel = getValueByPath(fromObject, [
      "safetyFilterLevel"
    ]);
    if (parentObject !== void 0 && fromSafetyFilterLevel != null) {
      setValueByPath(parentObject, ["parameters", "safetySetting"], fromSafetyFilterLevel);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
      "personGeneration"
    ]);
    if (parentObject !== void 0 && fromPersonGeneration != null) {
      setValueByPath(parentObject, ["parameters", "personGeneration"], fromPersonGeneration);
    }
    const fromIncludeSafetyAttributes = getValueByPath(fromObject, [
      "includeSafetyAttributes"
    ]);
    if (parentObject !== void 0 && fromIncludeSafetyAttributes != null) {
      setValueByPath(parentObject, ["parameters", "includeSafetyAttributes"], fromIncludeSafetyAttributes);
    }
    const fromIncludeRaiReason = getValueByPath(fromObject, [
      "includeRaiReason"
    ]);
    if (parentObject !== void 0 && fromIncludeRaiReason != null) {
      setValueByPath(parentObject, ["parameters", "includeRaiReason"], fromIncludeRaiReason);
    }
    const fromLanguage = getValueByPath(fromObject, ["language"]);
    if (parentObject !== void 0 && fromLanguage != null) {
      setValueByPath(parentObject, ["parameters", "language"], fromLanguage);
    }
    const fromOutputMimeType = getValueByPath(fromObject, [
      "outputMimeType"
    ]);
    if (parentObject !== void 0 && fromOutputMimeType != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "mimeType"], fromOutputMimeType);
    }
    const fromOutputCompressionQuality = getValueByPath(fromObject, [
      "outputCompressionQuality"
    ]);
    if (parentObject !== void 0 && fromOutputCompressionQuality != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "compressionQuality"], fromOutputCompressionQuality);
    }
    if (getValueByPath(fromObject, ["addWatermark"]) !== void 0) {
      throw new Error("addWatermark parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["enhancePrompt"]) !== void 0) {
      throw new Error("enhancePrompt parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function generateImagesParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromPrompt != null) {
      setValueByPath(toObject, ["instances[0]", "prompt"], fromPrompt);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], generateImagesConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function countTokensConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    if (getValueByPath(fromObject, ["systemInstruction"]) !== void 0) {
      throw new Error("systemInstruction parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["tools"]) !== void 0) {
      throw new Error("tools parameter is not supported in Gemini API.");
    }
    if (getValueByPath(fromObject, ["generationConfig"]) !== void 0) {
      throw new Error("generationConfig parameter is not supported in Gemini API.");
    }
    return toObject;
  }
  function countTokensParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToMldev(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], countTokensConfigToMldev(apiClient, fromConfig));
    }
    return toObject;
  }
  function partToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function schemaToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromExample = getValueByPath(fromObject, ["example"]);
    if (fromExample != null) {
      setValueByPath(toObject, ["example"], fromExample);
    }
    const fromPattern = getValueByPath(fromObject, ["pattern"]);
    if (fromPattern != null) {
      setValueByPath(toObject, ["pattern"], fromPattern);
    }
    const fromDefault = getValueByPath(fromObject, ["default"]);
    if (fromDefault != null) {
      setValueByPath(toObject, ["default"], fromDefault);
    }
    const fromMaxLength = getValueByPath(fromObject, ["maxLength"]);
    if (fromMaxLength != null) {
      setValueByPath(toObject, ["maxLength"], fromMaxLength);
    }
    const fromMinLength = getValueByPath(fromObject, ["minLength"]);
    if (fromMinLength != null) {
      setValueByPath(toObject, ["minLength"], fromMinLength);
    }
    const fromMinProperties = getValueByPath(fromObject, [
      "minProperties"
    ]);
    if (fromMinProperties != null) {
      setValueByPath(toObject, ["minProperties"], fromMinProperties);
    }
    const fromMaxProperties = getValueByPath(fromObject, [
      "maxProperties"
    ]);
    if (fromMaxProperties != null) {
      setValueByPath(toObject, ["maxProperties"], fromMaxProperties);
    }
    const fromAnyOf = getValueByPath(fromObject, ["anyOf"]);
    if (fromAnyOf != null) {
      setValueByPath(toObject, ["anyOf"], fromAnyOf);
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromEnum = getValueByPath(fromObject, ["enum"]);
    if (fromEnum != null) {
      setValueByPath(toObject, ["enum"], fromEnum);
    }
    const fromFormat = getValueByPath(fromObject, ["format"]);
    if (fromFormat != null) {
      setValueByPath(toObject, ["format"], fromFormat);
    }
    const fromItems = getValueByPath(fromObject, ["items"]);
    if (fromItems != null) {
      setValueByPath(toObject, ["items"], fromItems);
    }
    const fromMaxItems = getValueByPath(fromObject, ["maxItems"]);
    if (fromMaxItems != null) {
      setValueByPath(toObject, ["maxItems"], fromMaxItems);
    }
    const fromMaximum = getValueByPath(fromObject, ["maximum"]);
    if (fromMaximum != null) {
      setValueByPath(toObject, ["maximum"], fromMaximum);
    }
    const fromMinItems = getValueByPath(fromObject, ["minItems"]);
    if (fromMinItems != null) {
      setValueByPath(toObject, ["minItems"], fromMinItems);
    }
    const fromMinimum = getValueByPath(fromObject, ["minimum"]);
    if (fromMinimum != null) {
      setValueByPath(toObject, ["minimum"], fromMinimum);
    }
    const fromNullable = getValueByPath(fromObject, ["nullable"]);
    if (fromNullable != null) {
      setValueByPath(toObject, ["nullable"], fromNullable);
    }
    const fromProperties = getValueByPath(fromObject, ["properties"]);
    if (fromProperties != null) {
      setValueByPath(toObject, ["properties"], fromProperties);
    }
    const fromPropertyOrdering = getValueByPath(fromObject, [
      "propertyOrdering"
    ]);
    if (fromPropertyOrdering != null) {
      setValueByPath(toObject, ["propertyOrdering"], fromPropertyOrdering);
    }
    const fromRequired = getValueByPath(fromObject, ["required"]);
    if (fromRequired != null) {
      setValueByPath(toObject, ["required"], fromRequired);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (fromTitle != null) {
      setValueByPath(toObject, ["title"], fromTitle);
    }
    const fromType = getValueByPath(fromObject, ["type"]);
    if (fromType != null) {
      setValueByPath(toObject, ["type"], fromType);
    }
    return toObject;
  }
  function safetySettingToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromMethod = getValueByPath(fromObject, ["method"]);
    if (fromMethod != null) {
      setValueByPath(toObject, ["method"], fromMethod);
    }
    const fromCategory = getValueByPath(fromObject, ["category"]);
    if (fromCategory != null) {
      setValueByPath(toObject, ["category"], fromCategory);
    }
    const fromThreshold = getValueByPath(fromObject, ["threshold"]);
    if (fromThreshold != null) {
      setValueByPath(toObject, ["threshold"], fromThreshold);
    }
    return toObject;
  }
  function functionDeclarationToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromResponse = getValueByPath(fromObject, ["response"]);
    if (fromResponse != null) {
      setValueByPath(toObject, ["response"], schemaToVertex(apiClient, fromResponse));
    }
    const fromDescription = getValueByPath(fromObject, ["description"]);
    if (fromDescription != null) {
      setValueByPath(toObject, ["description"], fromDescription);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromParameters = getValueByPath(fromObject, ["parameters"]);
    if (fromParameters != null) {
      setValueByPath(toObject, ["parameters"], fromParameters);
    }
    return toObject;
  }
  function googleSearchToVertex() {
    const toObject = {};
    return toObject;
  }
  function dynamicRetrievalConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromDynamicThreshold = getValueByPath(fromObject, [
      "dynamicThreshold"
    ]);
    if (fromDynamicThreshold != null) {
      setValueByPath(toObject, ["dynamicThreshold"], fromDynamicThreshold);
    }
    return toObject;
  }
  function googleSearchRetrievalToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromDynamicRetrievalConfig = getValueByPath(fromObject, [
      "dynamicRetrievalConfig"
    ]);
    if (fromDynamicRetrievalConfig != null) {
      setValueByPath(toObject, ["dynamicRetrievalConfig"], dynamicRetrievalConfigToVertex(apiClient, fromDynamicRetrievalConfig));
    }
    return toObject;
  }
  function toolToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionDeclarations = getValueByPath(fromObject, [
      "functionDeclarations"
    ]);
    if (fromFunctionDeclarations != null) {
      if (Array.isArray(fromFunctionDeclarations)) {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations.map((item) => {
          return functionDeclarationToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["functionDeclarations"], fromFunctionDeclarations);
      }
    }
    const fromRetrieval = getValueByPath(fromObject, ["retrieval"]);
    if (fromRetrieval != null) {
      setValueByPath(toObject, ["retrieval"], fromRetrieval);
    }
    const fromGoogleSearch = getValueByPath(fromObject, ["googleSearch"]);
    if (fromGoogleSearch != null) {
      setValueByPath(toObject, ["googleSearch"], googleSearchToVertex());
    }
    const fromGoogleSearchRetrieval = getValueByPath(fromObject, [
      "googleSearchRetrieval"
    ]);
    if (fromGoogleSearchRetrieval != null) {
      setValueByPath(toObject, ["googleSearchRetrieval"], googleSearchRetrievalToVertex(apiClient, fromGoogleSearchRetrieval));
    }
    const fromCodeExecution = getValueByPath(fromObject, [
      "codeExecution"
    ]);
    if (fromCodeExecution != null) {
      setValueByPath(toObject, ["codeExecution"], fromCodeExecution);
    }
    return toObject;
  }
  function functionCallingConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromMode = getValueByPath(fromObject, ["mode"]);
    if (fromMode != null) {
      setValueByPath(toObject, ["mode"], fromMode);
    }
    const fromAllowedFunctionNames = getValueByPath(fromObject, [
      "allowedFunctionNames"
    ]);
    if (fromAllowedFunctionNames != null) {
      setValueByPath(toObject, ["allowedFunctionNames"], fromAllowedFunctionNames);
    }
    return toObject;
  }
  function toolConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCallingConfig = getValueByPath(fromObject, [
      "functionCallingConfig"
    ]);
    if (fromFunctionCallingConfig != null) {
      setValueByPath(toObject, ["functionCallingConfig"], functionCallingConfigToVertex(apiClient, fromFunctionCallingConfig));
    }
    return toObject;
  }
  function prebuiltVoiceConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceName = getValueByPath(fromObject, ["voiceName"]);
    if (fromVoiceName != null) {
      setValueByPath(toObject, ["voiceName"], fromVoiceName);
    }
    return toObject;
  }
  function voiceConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromPrebuiltVoiceConfig = getValueByPath(fromObject, [
      "prebuiltVoiceConfig"
    ]);
    if (fromPrebuiltVoiceConfig != null) {
      setValueByPath(toObject, ["prebuiltVoiceConfig"], prebuiltVoiceConfigToVertex(apiClient, fromPrebuiltVoiceConfig));
    }
    return toObject;
  }
  function speechConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVoiceConfig = getValueByPath(fromObject, ["voiceConfig"]);
    if (fromVoiceConfig != null) {
      setValueByPath(toObject, ["voiceConfig"], voiceConfigToVertex(apiClient, fromVoiceConfig));
    }
    return toObject;
  }
  function thinkingConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromIncludeThoughts = getValueByPath(fromObject, [
      "includeThoughts"
    ]);
    if (fromIncludeThoughts != null) {
      setValueByPath(toObject, ["includeThoughts"], fromIncludeThoughts);
    }
    return toObject;
  }
  function generateContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToVertex(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTemperature = getValueByPath(fromObject, ["temperature"]);
    if (fromTemperature != null) {
      setValueByPath(toObject, ["temperature"], fromTemperature);
    }
    const fromTopP = getValueByPath(fromObject, ["topP"]);
    if (fromTopP != null) {
      setValueByPath(toObject, ["topP"], fromTopP);
    }
    const fromTopK = getValueByPath(fromObject, ["topK"]);
    if (fromTopK != null) {
      setValueByPath(toObject, ["topK"], fromTopK);
    }
    const fromCandidateCount = getValueByPath(fromObject, [
      "candidateCount"
    ]);
    if (fromCandidateCount != null) {
      setValueByPath(toObject, ["candidateCount"], fromCandidateCount);
    }
    const fromMaxOutputTokens = getValueByPath(fromObject, [
      "maxOutputTokens"
    ]);
    if (fromMaxOutputTokens != null) {
      setValueByPath(toObject, ["maxOutputTokens"], fromMaxOutputTokens);
    }
    const fromStopSequences = getValueByPath(fromObject, [
      "stopSequences"
    ]);
    if (fromStopSequences != null) {
      setValueByPath(toObject, ["stopSequences"], fromStopSequences);
    }
    const fromResponseLogprobs = getValueByPath(fromObject, [
      "responseLogprobs"
    ]);
    if (fromResponseLogprobs != null) {
      setValueByPath(toObject, ["responseLogprobs"], fromResponseLogprobs);
    }
    const fromLogprobs = getValueByPath(fromObject, ["logprobs"]);
    if (fromLogprobs != null) {
      setValueByPath(toObject, ["logprobs"], fromLogprobs);
    }
    const fromPresencePenalty = getValueByPath(fromObject, [
      "presencePenalty"
    ]);
    if (fromPresencePenalty != null) {
      setValueByPath(toObject, ["presencePenalty"], fromPresencePenalty);
    }
    const fromFrequencyPenalty = getValueByPath(fromObject, [
      "frequencyPenalty"
    ]);
    if (fromFrequencyPenalty != null) {
      setValueByPath(toObject, ["frequencyPenalty"], fromFrequencyPenalty);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (fromSeed != null) {
      setValueByPath(toObject, ["seed"], fromSeed);
    }
    const fromResponseMimeType = getValueByPath(fromObject, [
      "responseMimeType"
    ]);
    if (fromResponseMimeType != null) {
      setValueByPath(toObject, ["responseMimeType"], fromResponseMimeType);
    }
    const fromResponseSchema = getValueByPath(fromObject, [
      "responseSchema"
    ]);
    if (fromResponseSchema != null) {
      setValueByPath(toObject, ["responseSchema"], schemaToVertex(apiClient, tSchema(apiClient, fromResponseSchema)));
    }
    const fromRoutingConfig = getValueByPath(fromObject, [
      "routingConfig"
    ]);
    if (fromRoutingConfig != null) {
      setValueByPath(toObject, ["routingConfig"], fromRoutingConfig);
    }
    const fromSafetySettings = getValueByPath(fromObject, [
      "safetySettings"
    ]);
    if (parentObject !== void 0 && fromSafetySettings != null) {
      if (Array.isArray(fromSafetySettings)) {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings.map((item) => {
          return safetySettingToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["safetySettings"], fromSafetySettings);
      }
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, tTools(apiClient, fromTools).map((item) => {
          return toolToVertex(apiClient, tTool(apiClient, item));
        })));
      } else {
        setValueByPath(parentObject, ["tools"], tTools(apiClient, fromTools));
      }
    }
    const fromToolConfig = getValueByPath(fromObject, ["toolConfig"]);
    if (parentObject !== void 0 && fromToolConfig != null) {
      setValueByPath(parentObject, ["toolConfig"], toolConfigToVertex(apiClient, fromToolConfig));
    }
    const fromLabels = getValueByPath(fromObject, ["labels"]);
    if (parentObject !== void 0 && fromLabels != null) {
      setValueByPath(parentObject, ["labels"], fromLabels);
    }
    const fromCachedContent = getValueByPath(fromObject, [
      "cachedContent"
    ]);
    if (parentObject !== void 0 && fromCachedContent != null) {
      setValueByPath(parentObject, ["cachedContent"], tCachedContentName(apiClient, fromCachedContent));
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities != null) {
      setValueByPath(toObject, ["responseModalities"], fromResponseModalities);
    }
    const fromMediaResolution = getValueByPath(fromObject, [
      "mediaResolution"
    ]);
    if (fromMediaResolution != null) {
      setValueByPath(toObject, ["mediaResolution"], fromMediaResolution);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig != null) {
      setValueByPath(toObject, ["speechConfig"], speechConfigToVertex(apiClient, tSpeechConfig(apiClient, fromSpeechConfig)));
    }
    const fromAudioTimestamp = getValueByPath(fromObject, [
      "audioTimestamp"
    ]);
    if (fromAudioTimestamp != null) {
      setValueByPath(toObject, ["audioTimestamp"], fromAudioTimestamp);
    }
    const fromThinkingConfig = getValueByPath(fromObject, [
      "thinkingConfig"
    ]);
    if (fromThinkingConfig != null) {
      setValueByPath(toObject, ["thinkingConfig"], thinkingConfigToVertex(apiClient, fromThinkingConfig));
    }
    return toObject;
  }
  function generateContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["generationConfig"], generateContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function embedContentConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromTaskType = getValueByPath(fromObject, ["taskType"]);
    if (parentObject !== void 0 && fromTaskType != null) {
      setValueByPath(parentObject, ["instances[]", "task_type"], fromTaskType);
    }
    const fromTitle = getValueByPath(fromObject, ["title"]);
    if (parentObject !== void 0 && fromTitle != null) {
      setValueByPath(parentObject, ["instances[]", "title"], fromTitle);
    }
    const fromOutputDimensionality = getValueByPath(fromObject, [
      "outputDimensionality"
    ]);
    if (parentObject !== void 0 && fromOutputDimensionality != null) {
      setValueByPath(parentObject, ["parameters", "outputDimensionality"], fromOutputDimensionality);
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (parentObject !== void 0 && fromMimeType != null) {
      setValueByPath(parentObject, ["instances[]", "mimeType"], fromMimeType);
    }
    const fromAutoTruncate = getValueByPath(fromObject, ["autoTruncate"]);
    if (parentObject !== void 0 && fromAutoTruncate != null) {
      setValueByPath(parentObject, ["parameters", "autoTruncate"], fromAutoTruncate);
    }
    return toObject;
  }
  function embedContentParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      setValueByPath(toObject, ["instances[]", "content"], tContentsForEmbed(apiClient, fromContents));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], embedContentConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function generateImagesConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromOutputGcsUri = getValueByPath(fromObject, ["outputGcsUri"]);
    if (parentObject !== void 0 && fromOutputGcsUri != null) {
      setValueByPath(parentObject, ["parameters", "storageUri"], fromOutputGcsUri);
    }
    const fromNegativePrompt = getValueByPath(fromObject, [
      "negativePrompt"
    ]);
    if (parentObject !== void 0 && fromNegativePrompt != null) {
      setValueByPath(parentObject, ["parameters", "negativePrompt"], fromNegativePrompt);
    }
    const fromNumberOfImages = getValueByPath(fromObject, [
      "numberOfImages"
    ]);
    if (parentObject !== void 0 && fromNumberOfImages != null) {
      setValueByPath(parentObject, ["parameters", "sampleCount"], fromNumberOfImages);
    }
    const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
    if (parentObject !== void 0 && fromAspectRatio != null) {
      setValueByPath(parentObject, ["parameters", "aspectRatio"], fromAspectRatio);
    }
    const fromGuidanceScale = getValueByPath(fromObject, [
      "guidanceScale"
    ]);
    if (parentObject !== void 0 && fromGuidanceScale != null) {
      setValueByPath(parentObject, ["parameters", "guidanceScale"], fromGuidanceScale);
    }
    const fromSeed = getValueByPath(fromObject, ["seed"]);
    if (parentObject !== void 0 && fromSeed != null) {
      setValueByPath(parentObject, ["parameters", "seed"], fromSeed);
    }
    const fromSafetyFilterLevel = getValueByPath(fromObject, [
      "safetyFilterLevel"
    ]);
    if (parentObject !== void 0 && fromSafetyFilterLevel != null) {
      setValueByPath(parentObject, ["parameters", "safetySetting"], fromSafetyFilterLevel);
    }
    const fromPersonGeneration = getValueByPath(fromObject, [
      "personGeneration"
    ]);
    if (parentObject !== void 0 && fromPersonGeneration != null) {
      setValueByPath(parentObject, ["parameters", "personGeneration"], fromPersonGeneration);
    }
    const fromIncludeSafetyAttributes = getValueByPath(fromObject, [
      "includeSafetyAttributes"
    ]);
    if (parentObject !== void 0 && fromIncludeSafetyAttributes != null) {
      setValueByPath(parentObject, ["parameters", "includeSafetyAttributes"], fromIncludeSafetyAttributes);
    }
    const fromIncludeRaiReason = getValueByPath(fromObject, [
      "includeRaiReason"
    ]);
    if (parentObject !== void 0 && fromIncludeRaiReason != null) {
      setValueByPath(parentObject, ["parameters", "includeRaiReason"], fromIncludeRaiReason);
    }
    const fromLanguage = getValueByPath(fromObject, ["language"]);
    if (parentObject !== void 0 && fromLanguage != null) {
      setValueByPath(parentObject, ["parameters", "language"], fromLanguage);
    }
    const fromOutputMimeType = getValueByPath(fromObject, [
      "outputMimeType"
    ]);
    if (parentObject !== void 0 && fromOutputMimeType != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "mimeType"], fromOutputMimeType);
    }
    const fromOutputCompressionQuality = getValueByPath(fromObject, [
      "outputCompressionQuality"
    ]);
    if (parentObject !== void 0 && fromOutputCompressionQuality != null) {
      setValueByPath(parentObject, ["parameters", "outputOptions", "compressionQuality"], fromOutputCompressionQuality);
    }
    const fromAddWatermark = getValueByPath(fromObject, ["addWatermark"]);
    if (parentObject !== void 0 && fromAddWatermark != null) {
      setValueByPath(parentObject, ["parameters", "addWatermark"], fromAddWatermark);
    }
    const fromEnhancePrompt = getValueByPath(fromObject, [
      "enhancePrompt"
    ]);
    if (parentObject !== void 0 && fromEnhancePrompt != null) {
      setValueByPath(parentObject, ["parameters", "enhancePrompt"], fromEnhancePrompt);
    }
    return toObject;
  }
  function generateImagesParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromPrompt != null) {
      setValueByPath(toObject, ["instances[0]", "prompt"], fromPrompt);
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], generateImagesConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function countTokensConfigToVertex(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (parentObject !== void 0 && fromSystemInstruction != null) {
      setValueByPath(parentObject, ["systemInstruction"], contentToVertex(apiClient, tContent(apiClient, fromSystemInstruction)));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (parentObject !== void 0 && fromTools != null) {
      if (Array.isArray(fromTools)) {
        setValueByPath(parentObject, ["tools"], fromTools.map((item) => {
          return toolToVertex(apiClient, item);
        }));
      } else {
        setValueByPath(parentObject, ["tools"], fromTools);
      }
    }
    const fromGenerationConfig = getValueByPath(fromObject, [
      "generationConfig"
    ]);
    if (parentObject !== void 0 && fromGenerationConfig != null) {
      setValueByPath(parentObject, ["generationConfig"], fromGenerationConfig);
    }
    return toObject;
  }
  function countTokensParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], countTokensConfigToVertex(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function computeTokensParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel != null) {
      setValueByPath(toObject, ["_url", "model"], tModel(apiClient, fromModel));
    }
    const fromContents = getValueByPath(fromObject, ["contents"]);
    if (fromContents != null) {
      if (Array.isArray(fromContents)) {
        setValueByPath(toObject, ["contents"], tContents(apiClient, tContents(apiClient, fromContents).map((item) => {
          return contentToVertex(apiClient, item);
        })));
      } else {
        setValueByPath(toObject, ["contents"], tContents(apiClient, fromContents));
      }
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function partFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function citationMetadataFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromCitations = getValueByPath(fromObject, ["citationSources"]);
    if (fromCitations != null) {
      setValueByPath(toObject, ["citations"], fromCitations);
    }
    return toObject;
  }
  function candidateFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromContent = getValueByPath(fromObject, ["content"]);
    if (fromContent != null) {
      setValueByPath(toObject, ["content"], contentFromMldev(apiClient, fromContent));
    }
    const fromCitationMetadata = getValueByPath(fromObject, [
      "citationMetadata"
    ]);
    if (fromCitationMetadata != null) {
      setValueByPath(toObject, ["citationMetadata"], citationMetadataFromMldev(apiClient, fromCitationMetadata));
    }
    const fromTokenCount = getValueByPath(fromObject, ["tokenCount"]);
    if (fromTokenCount != null) {
      setValueByPath(toObject, ["tokenCount"], fromTokenCount);
    }
    const fromFinishReason = getValueByPath(fromObject, ["finishReason"]);
    if (fromFinishReason != null) {
      setValueByPath(toObject, ["finishReason"], fromFinishReason);
    }
    const fromAvgLogprobs = getValueByPath(fromObject, ["avgLogprobs"]);
    if (fromAvgLogprobs != null) {
      setValueByPath(toObject, ["avgLogprobs"], fromAvgLogprobs);
    }
    const fromGroundingMetadata = getValueByPath(fromObject, [
      "groundingMetadata"
    ]);
    if (fromGroundingMetadata != null) {
      setValueByPath(toObject, ["groundingMetadata"], fromGroundingMetadata);
    }
    const fromIndex = getValueByPath(fromObject, ["index"]);
    if (fromIndex != null) {
      setValueByPath(toObject, ["index"], fromIndex);
    }
    const fromLogprobsResult = getValueByPath(fromObject, [
      "logprobsResult"
    ]);
    if (fromLogprobsResult != null) {
      setValueByPath(toObject, ["logprobsResult"], fromLogprobsResult);
    }
    const fromSafetyRatings = getValueByPath(fromObject, [
      "safetyRatings"
    ]);
    if (fromSafetyRatings != null) {
      setValueByPath(toObject, ["safetyRatings"], fromSafetyRatings);
    }
    return toObject;
  }
  function generateContentResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromCandidates = getValueByPath(fromObject, ["candidates"]);
    if (fromCandidates != null) {
      if (Array.isArray(fromCandidates)) {
        setValueByPath(toObject, ["candidates"], fromCandidates.map((item) => {
          return candidateFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["candidates"], fromCandidates);
      }
    }
    const fromModelVersion = getValueByPath(fromObject, ["modelVersion"]);
    if (fromModelVersion != null) {
      setValueByPath(toObject, ["modelVersion"], fromModelVersion);
    }
    const fromPromptFeedback = getValueByPath(fromObject, [
      "promptFeedback"
    ]);
    if (fromPromptFeedback != null) {
      setValueByPath(toObject, ["promptFeedback"], fromPromptFeedback);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function contentEmbeddingFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromValues = getValueByPath(fromObject, ["values"]);
    if (fromValues != null) {
      setValueByPath(toObject, ["values"], fromValues);
    }
    return toObject;
  }
  function embedContentMetadataFromMldev() {
    const toObject = {};
    return toObject;
  }
  function embedContentResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromEmbeddings = getValueByPath(fromObject, ["embeddings"]);
    if (fromEmbeddings != null) {
      if (Array.isArray(fromEmbeddings)) {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings.map((item) => {
          return contentEmbeddingFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings);
      }
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], embedContentMetadataFromMldev());
    }
    return toObject;
  }
  function imageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromImageBytes = getValueByPath(fromObject, [
      "bytesBase64Encoded"
    ]);
    if (fromImageBytes != null) {
      setValueByPath(toObject, ["imageBytes"], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function safetyAttributesFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromCategories = getValueByPath(fromObject, [
      "safetyAttributes",
      "categories"
    ]);
    if (fromCategories != null) {
      setValueByPath(toObject, ["categories"], fromCategories);
    }
    const fromScores = getValueByPath(fromObject, [
      "safetyAttributes",
      "scores"
    ]);
    if (fromScores != null) {
      setValueByPath(toObject, ["scores"], fromScores);
    }
    const fromContentType = getValueByPath(fromObject, ["contentType"]);
    if (fromContentType != null) {
      setValueByPath(toObject, ["contentType"], fromContentType);
    }
    return toObject;
  }
  function generatedImageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromImage = getValueByPath(fromObject, ["_self"]);
    if (fromImage != null) {
      setValueByPath(toObject, ["image"], imageFromMldev(apiClient, fromImage));
    }
    const fromRaiFilteredReason = getValueByPath(fromObject, [
      "raiFilteredReason"
    ]);
    if (fromRaiFilteredReason != null) {
      setValueByPath(toObject, ["raiFilteredReason"], fromRaiFilteredReason);
    }
    const fromSafetyAttributes = getValueByPath(fromObject, ["_self"]);
    if (fromSafetyAttributes != null) {
      setValueByPath(toObject, ["safetyAttributes"], safetyAttributesFromMldev(apiClient, fromSafetyAttributes));
    }
    return toObject;
  }
  function generateImagesResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedImages = getValueByPath(fromObject, [
      "predictions"
    ]);
    if (fromGeneratedImages != null) {
      if (Array.isArray(fromGeneratedImages)) {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages.map((item) => {
          return generatedImageFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages);
      }
    }
    const fromPositivePromptSafetyAttributes = getValueByPath(fromObject, [
      "positivePromptSafetyAttributes"
    ]);
    if (fromPositivePromptSafetyAttributes != null) {
      setValueByPath(toObject, ["positivePromptSafetyAttributes"], safetyAttributesFromMldev(apiClient, fromPositivePromptSafetyAttributes));
    }
    return toObject;
  }
  function countTokensResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromTotalTokens = getValueByPath(fromObject, ["totalTokens"]);
    if (fromTotalTokens != null) {
      setValueByPath(toObject, ["totalTokens"], fromTotalTokens);
    }
    const fromCachedContentTokenCount = getValueByPath(fromObject, [
      "cachedContentTokenCount"
    ]);
    if (fromCachedContentTokenCount != null) {
      setValueByPath(toObject, ["cachedContentTokenCount"], fromCachedContentTokenCount);
    }
    return toObject;
  }
  function partFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromThought = getValueByPath(fromObject, ["thought"]);
    if (fromThought != null) {
      setValueByPath(toObject, ["thought"], fromThought);
    }
    const fromCodeExecutionResult = getValueByPath(fromObject, [
      "codeExecutionResult"
    ]);
    if (fromCodeExecutionResult != null) {
      setValueByPath(toObject, ["codeExecutionResult"], fromCodeExecutionResult);
    }
    const fromExecutableCode = getValueByPath(fromObject, [
      "executableCode"
    ]);
    if (fromExecutableCode != null) {
      setValueByPath(toObject, ["executableCode"], fromExecutableCode);
    }
    const fromFileData = getValueByPath(fromObject, ["fileData"]);
    if (fromFileData != null) {
      setValueByPath(toObject, ["fileData"], fromFileData);
    }
    const fromFunctionCall = getValueByPath(fromObject, ["functionCall"]);
    if (fromFunctionCall != null) {
      setValueByPath(toObject, ["functionCall"], fromFunctionCall);
    }
    const fromFunctionResponse = getValueByPath(fromObject, [
      "functionResponse"
    ]);
    if (fromFunctionResponse != null) {
      setValueByPath(toObject, ["functionResponse"], fromFunctionResponse);
    }
    const fromInlineData = getValueByPath(fromObject, ["inlineData"]);
    if (fromInlineData != null) {
      setValueByPath(toObject, ["inlineData"], fromInlineData);
    }
    const fromText = getValueByPath(fromObject, ["text"]);
    if (fromText != null) {
      setValueByPath(toObject, ["text"], fromText);
    }
    return toObject;
  }
  function contentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromParts = getValueByPath(fromObject, ["parts"]);
    if (fromParts != null) {
      if (Array.isArray(fromParts)) {
        setValueByPath(toObject, ["parts"], fromParts.map((item) => {
          return partFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["parts"], fromParts);
      }
    }
    const fromRole = getValueByPath(fromObject, ["role"]);
    if (fromRole != null) {
      setValueByPath(toObject, ["role"], fromRole);
    }
    return toObject;
  }
  function citationMetadataFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromCitations = getValueByPath(fromObject, ["citations"]);
    if (fromCitations != null) {
      setValueByPath(toObject, ["citations"], fromCitations);
    }
    return toObject;
  }
  function candidateFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromContent = getValueByPath(fromObject, ["content"]);
    if (fromContent != null) {
      setValueByPath(toObject, ["content"], contentFromVertex(apiClient, fromContent));
    }
    const fromCitationMetadata = getValueByPath(fromObject, [
      "citationMetadata"
    ]);
    if (fromCitationMetadata != null) {
      setValueByPath(toObject, ["citationMetadata"], citationMetadataFromVertex(apiClient, fromCitationMetadata));
    }
    const fromFinishMessage = getValueByPath(fromObject, [
      "finishMessage"
    ]);
    if (fromFinishMessage != null) {
      setValueByPath(toObject, ["finishMessage"], fromFinishMessage);
    }
    const fromFinishReason = getValueByPath(fromObject, ["finishReason"]);
    if (fromFinishReason != null) {
      setValueByPath(toObject, ["finishReason"], fromFinishReason);
    }
    const fromAvgLogprobs = getValueByPath(fromObject, ["avgLogprobs"]);
    if (fromAvgLogprobs != null) {
      setValueByPath(toObject, ["avgLogprobs"], fromAvgLogprobs);
    }
    const fromGroundingMetadata = getValueByPath(fromObject, [
      "groundingMetadata"
    ]);
    if (fromGroundingMetadata != null) {
      setValueByPath(toObject, ["groundingMetadata"], fromGroundingMetadata);
    }
    const fromIndex = getValueByPath(fromObject, ["index"]);
    if (fromIndex != null) {
      setValueByPath(toObject, ["index"], fromIndex);
    }
    const fromLogprobsResult = getValueByPath(fromObject, [
      "logprobsResult"
    ]);
    if (fromLogprobsResult != null) {
      setValueByPath(toObject, ["logprobsResult"], fromLogprobsResult);
    }
    const fromSafetyRatings = getValueByPath(fromObject, [
      "safetyRatings"
    ]);
    if (fromSafetyRatings != null) {
      setValueByPath(toObject, ["safetyRatings"], fromSafetyRatings);
    }
    return toObject;
  }
  function generateContentResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromCandidates = getValueByPath(fromObject, ["candidates"]);
    if (fromCandidates != null) {
      if (Array.isArray(fromCandidates)) {
        setValueByPath(toObject, ["candidates"], fromCandidates.map((item) => {
          return candidateFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["candidates"], fromCandidates);
      }
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromResponseId = getValueByPath(fromObject, ["responseId"]);
    if (fromResponseId != null) {
      setValueByPath(toObject, ["responseId"], fromResponseId);
    }
    const fromModelVersion = getValueByPath(fromObject, ["modelVersion"]);
    if (fromModelVersion != null) {
      setValueByPath(toObject, ["modelVersion"], fromModelVersion);
    }
    const fromPromptFeedback = getValueByPath(fromObject, [
      "promptFeedback"
    ]);
    if (fromPromptFeedback != null) {
      setValueByPath(toObject, ["promptFeedback"], fromPromptFeedback);
    }
    const fromUsageMetadata = getValueByPath(fromObject, [
      "usageMetadata"
    ]);
    if (fromUsageMetadata != null) {
      setValueByPath(toObject, ["usageMetadata"], fromUsageMetadata);
    }
    return toObject;
  }
  function contentEmbeddingStatisticsFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromTruncated = getValueByPath(fromObject, ["truncated"]);
    if (fromTruncated != null) {
      setValueByPath(toObject, ["truncated"], fromTruncated);
    }
    const fromTokenCount = getValueByPath(fromObject, ["token_count"]);
    if (fromTokenCount != null) {
      setValueByPath(toObject, ["tokenCount"], fromTokenCount);
    }
    return toObject;
  }
  function contentEmbeddingFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromValues = getValueByPath(fromObject, ["values"]);
    if (fromValues != null) {
      setValueByPath(toObject, ["values"], fromValues);
    }
    const fromStatistics = getValueByPath(fromObject, ["statistics"]);
    if (fromStatistics != null) {
      setValueByPath(toObject, ["statistics"], contentEmbeddingStatisticsFromVertex(apiClient, fromStatistics));
    }
    return toObject;
  }
  function embedContentMetadataFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromBillableCharacterCount = getValueByPath(fromObject, [
      "billableCharacterCount"
    ]);
    if (fromBillableCharacterCount != null) {
      setValueByPath(toObject, ["billableCharacterCount"], fromBillableCharacterCount);
    }
    return toObject;
  }
  function embedContentResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromEmbeddings = getValueByPath(fromObject, [
      "predictions[]",
      "embeddings"
    ]);
    if (fromEmbeddings != null) {
      if (Array.isArray(fromEmbeddings)) {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings.map((item) => {
          return contentEmbeddingFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["embeddings"], fromEmbeddings);
      }
    }
    const fromMetadata = getValueByPath(fromObject, ["metadata"]);
    if (fromMetadata != null) {
      setValueByPath(toObject, ["metadata"], embedContentMetadataFromVertex(apiClient, fromMetadata));
    }
    return toObject;
  }
  function imageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGcsUri = getValueByPath(fromObject, ["gcsUri"]);
    if (fromGcsUri != null) {
      setValueByPath(toObject, ["gcsUri"], fromGcsUri);
    }
    const fromImageBytes = getValueByPath(fromObject, [
      "bytesBase64Encoded"
    ]);
    if (fromImageBytes != null) {
      setValueByPath(toObject, ["imageBytes"], tBytes(apiClient, fromImageBytes));
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    return toObject;
  }
  function safetyAttributesFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromCategories = getValueByPath(fromObject, [
      "safetyAttributes",
      "categories"
    ]);
    if (fromCategories != null) {
      setValueByPath(toObject, ["categories"], fromCategories);
    }
    const fromScores = getValueByPath(fromObject, [
      "safetyAttributes",
      "scores"
    ]);
    if (fromScores != null) {
      setValueByPath(toObject, ["scores"], fromScores);
    }
    const fromContentType = getValueByPath(fromObject, ["contentType"]);
    if (fromContentType != null) {
      setValueByPath(toObject, ["contentType"], fromContentType);
    }
    return toObject;
  }
  function generatedImageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromImage = getValueByPath(fromObject, ["_self"]);
    if (fromImage != null) {
      setValueByPath(toObject, ["image"], imageFromVertex(apiClient, fromImage));
    }
    const fromRaiFilteredReason = getValueByPath(fromObject, [
      "raiFilteredReason"
    ]);
    if (fromRaiFilteredReason != null) {
      setValueByPath(toObject, ["raiFilteredReason"], fromRaiFilteredReason);
    }
    const fromSafetyAttributes = getValueByPath(fromObject, ["_self"]);
    if (fromSafetyAttributes != null) {
      setValueByPath(toObject, ["safetyAttributes"], safetyAttributesFromVertex(apiClient, fromSafetyAttributes));
    }
    const fromEnhancedPrompt = getValueByPath(fromObject, ["prompt"]);
    if (fromEnhancedPrompt != null) {
      setValueByPath(toObject, ["enhancedPrompt"], fromEnhancedPrompt);
    }
    return toObject;
  }
  function generateImagesResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGeneratedImages = getValueByPath(fromObject, [
      "predictions"
    ]);
    if (fromGeneratedImages != null) {
      if (Array.isArray(fromGeneratedImages)) {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages.map((item) => {
          return generatedImageFromVertex(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["generatedImages"], fromGeneratedImages);
      }
    }
    const fromPositivePromptSafetyAttributes = getValueByPath(fromObject, [
      "positivePromptSafetyAttributes"
    ]);
    if (fromPositivePromptSafetyAttributes != null) {
      setValueByPath(toObject, ["positivePromptSafetyAttributes"], safetyAttributesFromVertex(apiClient, fromPositivePromptSafetyAttributes));
    }
    return toObject;
  }
  function countTokensResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromTotalTokens = getValueByPath(fromObject, ["totalTokens"]);
    if (fromTotalTokens != null) {
      setValueByPath(toObject, ["totalTokens"], fromTotalTokens);
    }
    return toObject;
  }
  function computeTokensResponseFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromTokensInfo = getValueByPath(fromObject, ["tokensInfo"]);
    if (fromTokensInfo != null) {
      setValueByPath(toObject, ["tokensInfo"], fromTokensInfo);
    }
    return toObject;
  }
  function liveConnectParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig !== void 0 && fromConfig !== null) {
      setValueByPath(toObject, ["setup"], liveConnectConfigToMldev(apiClient, fromConfig));
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel !== void 0) {
      setValueByPath(toObject, ["setup", "model"], fromModel);
    }
    return toObject;
  }
  function liveConnectParametersToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig !== void 0 && fromConfig !== null) {
      setValueByPath(toObject, ["setup"], liveConnectConfigToVertex(apiClient, fromConfig));
    }
    const fromModel = getValueByPath(fromObject, ["model"]);
    if (fromModel !== void 0) {
      setValueByPath(toObject, ["setup", "model"], fromModel);
    }
    return toObject;
  }
  function liveServerMessageFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromSetupComplete = getValueByPath(fromObject, [
      "setupComplete"
    ]);
    if (fromSetupComplete !== void 0) {
      setValueByPath(toObject, ["setupComplete"], fromSetupComplete);
    }
    const fromServerContent = getValueByPath(fromObject, [
      "serverContent"
    ]);
    if (fromServerContent !== void 0 && fromServerContent !== null) {
      setValueByPath(toObject, ["serverContent"], liveServerContentFromMldev(apiClient, fromServerContent));
    }
    const fromToolCall = getValueByPath(fromObject, ["toolCall"]);
    if (fromToolCall !== void 0 && fromToolCall !== null) {
      setValueByPath(toObject, ["toolCall"], liveServerToolCallFromMldev(apiClient, fromToolCall));
    }
    const fromToolCallCancellation = getValueByPath(fromObject, [
      "toolCallCancellation"
    ]);
    if (fromToolCallCancellation !== void 0 && fromToolCallCancellation !== null) {
      setValueByPath(toObject, ["toolCallCancellation"], liveServerToolCallCancellationFromMldev(apiClient, fromToolCallCancellation));
    }
    return toObject;
  }
  function liveServerMessageFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromSetupComplete = getValueByPath(fromObject, [
      "setupComplete"
    ]);
    if (fromSetupComplete !== void 0) {
      setValueByPath(toObject, ["setupComplete"], fromSetupComplete);
    }
    const fromServerContent = getValueByPath(fromObject, [
      "serverContent"
    ]);
    if (fromServerContent !== void 0 && fromServerContent !== null) {
      setValueByPath(toObject, ["serverContent"], liveServerContentFromVertex(apiClient, fromServerContent));
    }
    const fromToolCall = getValueByPath(fromObject, ["toolCall"]);
    if (fromToolCall !== void 0 && fromToolCall !== null) {
      setValueByPath(toObject, ["toolCall"], liveServerToolCallFromVertex(apiClient, fromToolCall));
    }
    const fromToolCallCancellation = getValueByPath(fromObject, [
      "toolCallCancellation"
    ]);
    if (fromToolCallCancellation !== void 0 && fromToolCallCancellation !== null) {
      setValueByPath(toObject, ["toolCallCancellation"], liveServerToolCallCancellationFromVertex(apiClient, fromToolCallCancellation));
    }
    return toObject;
  }
  function liveConnectConfigToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromGenerationConfig = getValueByPath(fromObject, [
      "generationConfig"
    ]);
    if (fromGenerationConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig"], fromGenerationConfig);
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities !== void 0) {
      setValueByPath(toObject, ["generationConfig", "responseModalities"], fromResponseModalities);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig", "speechConfig"], fromSpeechConfig);
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (fromSystemInstruction !== void 0 && fromSystemInstruction !== null) {
      setValueByPath(toObject, ["systemInstruction"], contentToMldev(apiClient, fromSystemInstruction));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (fromTools !== void 0 && fromTools !== null && Array.isArray(fromTools)) {
      setValueByPath(toObject, ["tools"], fromTools.map((item) => {
        return toolToMldev(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveConnectConfigToVertex(apiClient, fromObject) {
    const toObject = {};
    const fromGenerationConfig = getValueByPath(fromObject, [
      "generationConfig"
    ]);
    if (fromGenerationConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig"], fromGenerationConfig);
    }
    const fromResponseModalities = getValueByPath(fromObject, [
      "responseModalities"
    ]);
    if (fromResponseModalities !== void 0) {
      setValueByPath(toObject, ["generationConfig", "responseModalities"], fromResponseModalities);
    } else {
      setValueByPath(toObject, ["generationConfig", "responseModalities"], ["AUDIO"]);
    }
    const fromSpeechConfig = getValueByPath(fromObject, ["speechConfig"]);
    if (fromSpeechConfig !== void 0) {
      setValueByPath(toObject, ["generationConfig", "speechConfig"], fromSpeechConfig);
    }
    const fromSystemInstruction = getValueByPath(fromObject, [
      "systemInstruction"
    ]);
    if (fromSystemInstruction !== void 0 && fromSystemInstruction !== null) {
      setValueByPath(toObject, ["systemInstruction"], contentToVertex(apiClient, fromSystemInstruction));
    }
    const fromTools = getValueByPath(fromObject, ["tools"]);
    if (fromTools !== void 0 && fromTools !== null && Array.isArray(fromTools)) {
      setValueByPath(toObject, ["tools"], fromTools.map((item) => {
        return toolToVertex(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveServerContentFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromModelTurn = getValueByPath(fromObject, ["modelTurn"]);
    if (fromModelTurn !== void 0 && fromModelTurn !== null) {
      setValueByPath(toObject, ["modelTurn"], contentFromMldev(apiClient, fromModelTurn));
    }
    const fromTurnComplete = getValueByPath(fromObject, ["turnComplete"]);
    if (fromTurnComplete !== void 0) {
      setValueByPath(toObject, ["turnComplete"], fromTurnComplete);
    }
    const fromInterrupted = getValueByPath(fromObject, ["interrupted"]);
    if (fromInterrupted !== void 0) {
      setValueByPath(toObject, ["interrupted"], fromInterrupted);
    }
    return toObject;
  }
  function liveServerContentFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromModelTurn = getValueByPath(fromObject, ["modelTurn"]);
    if (fromModelTurn !== void 0 && fromModelTurn !== null) {
      setValueByPath(toObject, ["modelTurn"], contentFromVertex(apiClient, fromModelTurn));
    }
    const fromTurnComplete = getValueByPath(fromObject, ["turnComplete"]);
    if (fromTurnComplete !== void 0) {
      setValueByPath(toObject, ["turnComplete"], fromTurnComplete);
    }
    const fromInterrupted = getValueByPath(fromObject, ["interrupted"]);
    if (fromInterrupted !== void 0) {
      setValueByPath(toObject, ["interrupted"], fromInterrupted);
    }
    return toObject;
  }
  function functionCallFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromId = getValueByPath(fromObject, ["id"]);
    if (fromId !== void 0) {
      setValueByPath(toObject, ["id"], fromId);
    }
    const fromArgs = getValueByPath(fromObject, ["args"]);
    if (fromArgs !== void 0) {
      setValueByPath(toObject, ["args"], fromArgs);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName !== void 0) {
      setValueByPath(toObject, ["name"], fromName);
    }
    return toObject;
  }
  function functionCallFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromArgs = getValueByPath(fromObject, ["args"]);
    if (fromArgs !== void 0) {
      setValueByPath(toObject, ["args"], fromArgs);
    }
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName !== void 0) {
      setValueByPath(toObject, ["name"], fromName);
    }
    return toObject;
  }
  function liveServerToolCallFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCalls = getValueByPath(fromObject, [
      "functionCalls"
    ]);
    if (fromFunctionCalls !== void 0 && fromFunctionCalls !== null && Array.isArray(fromFunctionCalls)) {
      setValueByPath(toObject, ["functionCalls"], fromFunctionCalls.map((item) => {
        return functionCallFromMldev(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveServerToolCallFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromFunctionCalls = getValueByPath(fromObject, [
      "functionCalls"
    ]);
    if (fromFunctionCalls !== void 0 && fromFunctionCalls !== null && Array.isArray(fromFunctionCalls)) {
      setValueByPath(toObject, ["functionCalls"], fromFunctionCalls.map((item) => {
        return functionCallFromVertex(apiClient, item);
      }));
    }
    return toObject;
  }
  function liveServerToolCallCancellationFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromIds = getValueByPath(fromObject, ["ids"]);
    if (fromIds !== void 0) {
      setValueByPath(toObject, ["ids"], fromIds);
    }
    return toObject;
  }
  function liveServerToolCallCancellationFromVertex(apiClient, fromObject) {
    const toObject = {};
    const fromIds = getValueByPath(fromObject, ["ids"]);
    if (fromIds !== void 0) {
      setValueByPath(toObject, ["ids"], fromIds);
    }
    return toObject;
  }
  var FUNCTION_RESPONSE_REQUIRES_ID = "FunctionResponse request must have an `id` field from the response of a ToolCall.FunctionalCalls in Google AI.";
  async function handleWebSocketMessage(apiClient, onmessage, event) {
    let serverMessage;
    let data;
    if (event.data instanceof Blob) {
      data = JSON.parse(await event.data.text());
    } else {
      data = JSON.parse(event.data);
    }
    if (apiClient.isVertexAI()) {
      serverMessage = liveServerMessageFromVertex(apiClient, data);
    } else {
      serverMessage = liveServerMessageFromMldev(apiClient, data);
    }
    onmessage(serverMessage);
  }
  var Live = class {
    constructor(apiClient, auth, webSocketFactory) {
      this.apiClient = apiClient;
      this.auth = auth;
      this.webSocketFactory = webSocketFactory;
    }
    async connect(params) {
      var _a2, _b;
      const websocketBaseUrl = this.apiClient.getWebsocketBaseUrl();
      const apiVersion = this.apiClient.getApiVersion();
      let url;
      const headers = mapToHeaders(this.apiClient.getDefaultHeaders());
      if (this.apiClient.isVertexAI()) {
        url = `${websocketBaseUrl}/ws/google.cloud.aiplatform.${apiVersion}.LlmBidiService/BidiGenerateContent`;
        await this.auth.addAuthHeaders(headers);
      } else {
        const apiKey = this.apiClient.getApiKey();
        url = `${websocketBaseUrl}/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      }
      let onopenResolve = () => {
      };
      const onopenPromise = new Promise((resolve) => {
        onopenResolve = resolve;
      });
      const callbacks = params.callbacks;
      const onopenAwaitedCallback = function() {
        var _a3;
        (_a3 = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onopen) === null || _a3 === void 0 ? void 0 : _a3.call(callbacks);
        onopenResolve({});
      };
      const apiClient = this.apiClient;
      const websocketCallbacks = {
        onopen: onopenAwaitedCallback,
        onmessage: (event) => {
          void handleWebSocketMessage(apiClient, callbacks.onmessage, event);
        },
        onerror: (_a2 = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onerror) !== null && _a2 !== void 0 ? _a2 : function(e2) {
        },
        onclose: (_b = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onclose) !== null && _b !== void 0 ? _b : function(e2) {
        }
      };
      const conn = this.webSocketFactory.create(url, headersToMap(headers), websocketCallbacks);
      conn.connect();
      await onopenPromise;
      let transformedModel = tModel(this.apiClient, params.model);
      if (this.apiClient.isVertexAI() && transformedModel.startsWith("publishers/")) {
        const project = this.apiClient.getProject();
        const location2 = this.apiClient.getLocation();
        transformedModel = `projects/${project}/locations/${location2}/` + transformedModel;
      }
      let clientMessage = {};
      const liveConnectParameters = {
        model: transformedModel,
        config: params.config,
        callbacks: params.callbacks
      };
      if (this.apiClient.isVertexAI()) {
        clientMessage = liveConnectParametersToVertex(this.apiClient, liveConnectParameters);
      } else {
        clientMessage = liveConnectParametersToMldev(this.apiClient, liveConnectParameters);
      }
      conn.send(JSON.stringify(clientMessage));
      return new Session2(conn, this.apiClient);
    }
  };
  var defaultLiveSendClientContentParamerters = {
    turnComplete: true
  };
  var Session2 = class {
    constructor(conn, apiClient) {
      this.conn = conn;
      this.apiClient = apiClient;
    }
    tLiveClientContent(apiClient, params) {
      if (params.turns !== null && params.turns !== void 0) {
        let contents = [];
        try {
          contents = tContents(apiClient, params.turns);
          if (apiClient.isVertexAI()) {
            contents = contents.map((item) => contentToVertex(apiClient, item));
          } else {
            contents = contents.map((item) => contentToMldev(apiClient, item));
          }
        } catch (_a2) {
          throw new Error(`Failed to parse client content "turns", type: '${typeof params.turns}'`);
        }
        return {
          clientContent: { turns: contents, turnComplete: params.turnComplete }
        };
      }
      return {
        clientContent: { turnComplete: params.turnComplete }
      };
    }
    tLiveClientRealtimeInput(apiClient, params) {
      let clientMessage = {};
      if (!("media" in params) || !params.media) {
        throw new Error(`Failed to convert realtime input "media", type: '${typeof params.media}'`);
      }
      clientMessage = { realtimeInput: { mediaChunks: [params.media] } };
      return clientMessage;
    }
    tLiveClienttToolResponse(apiClient, params) {
      let functionResponses = [];
      if (params.functionResponses == null) {
        throw new Error("functionResponses is required.");
      }
      if (!Array.isArray(params.functionResponses)) {
        functionResponses = [params.functionResponses];
      }
      if (functionResponses.length === 0) {
        throw new Error("functionResponses is required.");
      }
      for (const functionResponse of functionResponses) {
        if (typeof functionResponse !== "object" || functionResponse === null || !("name" in functionResponse) || !("response" in functionResponse)) {
          throw new Error(`Could not parse function response, type '${typeof functionResponse}'.`);
        }
        if (!apiClient.isVertexAI() && !("id" in functionResponse)) {
          throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
        }
      }
      const clientMessage = {
        toolResponse: { functionResponses }
      };
      return clientMessage;
    }
    sendClientContent(params) {
      params = Object.assign(Object.assign({}, defaultLiveSendClientContentParamerters), params);
      const clientMessage = this.tLiveClientContent(this.apiClient, params);
      this.conn.send(JSON.stringify(clientMessage));
    }
    sendRealtimeInput(params) {
      if (params.media == null) {
        throw new Error("Media is required.");
      }
      const clientMessage = this.tLiveClientRealtimeInput(this.apiClient, params);
      this.conn.send(JSON.stringify(clientMessage));
    }
    sendToolResponse(params) {
      if (params.functionResponses == null) {
        throw new Error("Tool response parameters are required.");
      }
      const clientMessage = this.tLiveClienttToolResponse(this.apiClient, params);
      this.conn.send(JSON.stringify(clientMessage));
    }
    close() {
      this.conn.close();
    }
  };
  function headersToMap(headers) {
    const headerMap = {};
    headers.forEach((value, key) => {
      headerMap[key] = value;
    });
    return headerMap;
  }
  function mapToHeaders(map) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(map)) {
      headers.append(key, value);
    }
    return headers;
  }
  var Models = class extends BaseModule {
    constructor(apiClient) {
      super();
      this.apiClient = apiClient;
      this.generateContent = async (params) => {
        return await this.generateContentInternal(params);
      };
      this.generateContentStream = async (params) => {
        return await this.generateContentStreamInternal(params);
      };
      this.generateImages = async (params) => {
        return await this.generateImagesInternal(params).then((apiResponse) => {
          var _a2;
          let positivePromptSafetyAttributes;
          const generatedImages = [];
          if (apiResponse === null || apiResponse === void 0 ? void 0 : apiResponse.generatedImages) {
            for (const generatedImage of apiResponse.generatedImages) {
              if (generatedImage && (generatedImage === null || generatedImage === void 0 ? void 0 : generatedImage.safetyAttributes) && ((_a2 = generatedImage === null || generatedImage === void 0 ? void 0 : generatedImage.safetyAttributes) === null || _a2 === void 0 ? void 0 : _a2.contentType) === "Positive Prompt") {
                positivePromptSafetyAttributes = generatedImage === null || generatedImage === void 0 ? void 0 : generatedImage.safetyAttributes;
              } else {
                generatedImages.push(generatedImage);
              }
            }
          }
          let response;
          if (positivePromptSafetyAttributes) {
            response = {
              generatedImages,
              positivePromptSafetyAttributes
            };
          } else {
            response = {
              generatedImages
            };
          }
          return response;
        });
      };
    }
    async generateContentInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = generateContentParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:generateContent", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateContentResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new GenerateContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = generateContentParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:generateContent", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateContentResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new GenerateContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async generateContentStreamInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = generateContentParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:streamGenerateContent?alt=sse", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        const apiClient = this.apiClient;
        response = apiClient.requestStream({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        });
        return response.then(function(apiResponse) {
          return __asyncGenerator(this, arguments, function* () {
            var _a3, e_1, _b2, _c;
            try {
              for (var _d = true, apiResponse_1 = __asyncValues(apiResponse), apiResponse_1_1; apiResponse_1_1 = yield __await(apiResponse_1.next()), _a3 = apiResponse_1_1.done, !_a3; _d = true) {
                _c = apiResponse_1_1.value;
                _d = false;
                const chunk = _c;
                const resp = generateContentResponseFromVertex(apiClient, chunk);
                const typedResp = new GenerateContentResponse();
                Object.assign(typedResp, resp);
                yield yield __await(typedResp);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (!_d && !_a3 && (_b2 = apiResponse_1.return))
                  yield __await(_b2.call(apiResponse_1));
              } finally {
                if (e_1)
                  throw e_1.error;
              }
            }
          });
        });
      } else {
        const body = generateContentParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:streamGenerateContent?alt=sse", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        const apiClient = this.apiClient;
        response = apiClient.requestStream({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        });
        return response.then(function(apiResponse) {
          return __asyncGenerator(this, arguments, function* () {
            var _a3, e_2, _b2, _c;
            try {
              for (var _d = true, apiResponse_2 = __asyncValues(apiResponse), apiResponse_2_1; apiResponse_2_1 = yield __await(apiResponse_2.next()), _a3 = apiResponse_2_1.done, !_a3; _d = true) {
                _c = apiResponse_2_1.value;
                _d = false;
                const chunk = _c;
                const resp = generateContentResponseFromMldev(apiClient, chunk);
                const typedResp = new GenerateContentResponse();
                Object.assign(typedResp, resp);
                yield yield __await(typedResp);
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (!_d && !_a3 && (_b2 = apiResponse_2.return))
                  yield __await(_b2.call(apiResponse_2));
              } finally {
                if (e_2)
                  throw e_2.error;
              }
            }
          });
        });
      }
    }
    async embedContent(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = embedContentParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:predict", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = embedContentResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new EmbedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = embedContentParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:batchEmbedContents", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = embedContentResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new EmbedContentResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async generateImagesInternal(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = generateImagesParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:predict", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateImagesResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new GenerateImagesResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = generateImagesParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:predict", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = generateImagesResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new GenerateImagesResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async countTokens(params) {
      var _a2, _b;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = countTokensParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:countTokens", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = countTokensResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new CountTokensResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        const body = countTokensParametersToMldev(this.apiClient, params);
        path = formatMap("{model}:countTokens", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_b = params.config) === null || _b === void 0 ? void 0 : _b.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = countTokensResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new CountTokensResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async computeTokens(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        const body = computeTokensParametersToVertex(this.apiClient, params);
        path = formatMap("{model}:computeTokens", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = computeTokensResponseFromVertex(this.apiClient, apiResponse);
          const typedResp = new ComputeTokensResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      } else {
        throw new Error("This method is only supported by the Vertex AI.");
      }
    }
  };
  var CONTENT_TYPE_HEADER = "Content-Type";
  var USER_AGENT_HEADER = "User-Agent";
  var GOOGLE_API_CLIENT_HEADER = "x-goog-api-client";
  var SDK_VERSION = "0.6.1";
  var LIBRARY_LABEL = `google-genai-sdk/${SDK_VERSION}`;
  var VERTEX_AI_API_DEFAULT_VERSION = "v1beta1";
  var GOOGLE_AI_API_DEFAULT_VERSION = "v1beta";
  var responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
  var ClientError = class extends Error {
    constructor(message, stackTrace) {
      if (stackTrace) {
        super(message, { cause: stackTrace });
      } else {
        super(message, { cause: new Error().stack });
      }
      this.message = message;
      this.name = "ClientError";
    }
  };
  var ServerError = class extends Error {
    constructor(message, stackTrace) {
      if (stackTrace) {
        super(message, { cause: stackTrace });
      } else {
        super(message, { cause: new Error().stack });
      }
      this.message = message;
      this.name = "ServerError";
    }
  };
  var ApiClient = class {
    constructor(opts) {
      var _a2, _b;
      this.clientOptions = Object.assign(Object.assign({}, opts), { project: opts.project, location: opts.location, apiKey: opts.apiKey, vertexai: opts.vertexai });
      const initHttpOptions = {};
      if (this.clientOptions.vertexai) {
        initHttpOptions.apiVersion = (_a2 = this.clientOptions.apiVersion) !== null && _a2 !== void 0 ? _a2 : VERTEX_AI_API_DEFAULT_VERSION;
        if (this.getProject() || this.getLocation()) {
          initHttpOptions.baseUrl = `https://${this.clientOptions.location}-aiplatform.googleapis.com/`;
          this.clientOptions.apiKey = void 0;
        } else {
          initHttpOptions.baseUrl = `https://aiplatform.googleapis.com/`;
          this.clientOptions.project = void 0;
          this.clientOptions.location = void 0;
        }
      } else {
        initHttpOptions.apiVersion = (_b = this.clientOptions.apiVersion) !== null && _b !== void 0 ? _b : GOOGLE_AI_API_DEFAULT_VERSION;
        initHttpOptions.baseUrl = `https://generativelanguage.googleapis.com/`;
      }
      initHttpOptions.headers = this.getDefaultHeaders();
      this.clientOptions.httpOptions = initHttpOptions;
      if (opts.httpOptions) {
        this.clientOptions.httpOptions = this.patchHttpOptions(initHttpOptions, opts.httpOptions);
      }
    }
    isVertexAI() {
      var _a2;
      return (_a2 = this.clientOptions.vertexai) !== null && _a2 !== void 0 ? _a2 : false;
    }
    getProject() {
      return this.clientOptions.project;
    }
    getLocation() {
      return this.clientOptions.location;
    }
    getApiVersion() {
      if (this.clientOptions.httpOptions && this.clientOptions.httpOptions.apiVersion !== void 0) {
        return this.clientOptions.httpOptions.apiVersion;
      }
      throw new Error("API version is not set.");
    }
    getBaseUrl() {
      if (this.clientOptions.httpOptions && this.clientOptions.httpOptions.baseUrl !== void 0) {
        return this.clientOptions.httpOptions.baseUrl;
      }
      throw new Error("Base URL is not set.");
    }
    getRequestUrl() {
      return this.getRequestUrlInternal(this.clientOptions.httpOptions);
    }
    getHeaders() {
      if (this.clientOptions.httpOptions && this.clientOptions.httpOptions.headers !== void 0) {
        return this.clientOptions.httpOptions.headers;
      } else {
        throw new Error("Headers are not set.");
      }
    }
    getRequestUrlInternal(httpOptions) {
      if (!httpOptions || httpOptions.baseUrl === void 0 || httpOptions.apiVersion === void 0) {
        throw new Error("HTTP options are not correctly set.");
      }
      const baseUrl = httpOptions.baseUrl.endsWith("/") ? httpOptions.baseUrl.slice(0, -1) : httpOptions.baseUrl;
      const urlElement = [baseUrl];
      if (httpOptions.apiVersion && httpOptions.apiVersion !== "") {
        urlElement.push(httpOptions.apiVersion);
      }
      return urlElement.join("/");
    }
    getBaseResourcePath() {
      return `projects/${this.clientOptions.project}/locations/${this.clientOptions.location}`;
    }
    getApiKey() {
      return this.clientOptions.apiKey;
    }
    getWebsocketBaseUrl() {
      const baseUrl = this.getBaseUrl();
      const urlParts = new URL(baseUrl);
      urlParts.protocol = "wss";
      return urlParts.toString();
    }
    setBaseUrl(url) {
      if (this.clientOptions.httpOptions) {
        this.clientOptions.httpOptions.baseUrl = url;
      } else {
        throw new Error("HTTP options are not correctly set.");
      }
    }
    constructUrl(path, httpOptions) {
      const urlElement = [this.getRequestUrlInternal(httpOptions)];
      if (this.clientOptions.vertexai && !this.clientOptions.apiKey && !path.startsWith("projects/")) {
        urlElement.push(this.getBaseResourcePath());
      }
      if (path !== "") {
        urlElement.push(path);
      }
      const url = new URL(`${urlElement.join("/")}`);
      return url;
    }
    async request(request) {
      let patchedHttpOptions = this.clientOptions.httpOptions;
      if (request.httpOptions) {
        patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
      }
      const url = this.constructUrl(request.path, patchedHttpOptions);
      if (request.queryParams) {
        for (const [key, value] of Object.entries(request.queryParams)) {
          url.searchParams.append(key, String(value));
        }
      }
      let requestInit = {};
      if (request.httpMethod === "GET") {
        if (request.body && request.body !== "{}") {
          throw new Error("Request body should be empty for GET request, but got non empty request body");
        }
      } else {
        requestInit.body = request.body;
      }
      requestInit = await this.includeExtraHttpOptionsToRequestInit(requestInit, patchedHttpOptions);
      return this.unaryApiCall(url, requestInit, request.httpMethod);
    }
    patchHttpOptions(baseHttpOptions, requestHttpOptions) {
      const patchedHttpOptions = JSON.parse(JSON.stringify(baseHttpOptions));
      for (const [key, value] of Object.entries(requestHttpOptions)) {
        if (typeof value === "object") {
          patchedHttpOptions[key] = Object.assign(Object.assign({}, patchedHttpOptions[key]), value);
        } else if (value !== void 0) {
          patchedHttpOptions[key] = value;
        }
      }
      return patchedHttpOptions;
    }
    async requestStream(request) {
      let patchedHttpOptions = this.clientOptions.httpOptions;
      if (request.httpOptions) {
        patchedHttpOptions = this.patchHttpOptions(this.clientOptions.httpOptions, request.httpOptions);
      }
      const url = this.constructUrl(request.path, patchedHttpOptions);
      if (!url.searchParams.has("alt") || url.searchParams.get("alt") !== "sse") {
        url.searchParams.set("alt", "sse");
      }
      let requestInit = {};
      requestInit.body = request.body;
      requestInit = await this.includeExtraHttpOptionsToRequestInit(requestInit, patchedHttpOptions);
      return this.streamApiCall(url, requestInit, request.httpMethod);
    }
    async includeExtraHttpOptionsToRequestInit(requestInit, httpOptions) {
      if (httpOptions && httpOptions.timeout && httpOptions.timeout > 0) {
        const abortController = new AbortController();
        const signal = abortController.signal;
        setTimeout(() => abortController.abort(), httpOptions.timeout);
        requestInit.signal = signal;
      }
      requestInit.headers = await this.getHeadersInternal(httpOptions);
      return requestInit;
    }
    async unaryApiCall(url, requestInit, httpMethod) {
      return this.apiCall(url.toString(), Object.assign(Object.assign({}, requestInit), { method: httpMethod })).then(async (response) => {
        await throwErrorIfNotOK(response);
        return new HttpResponse(response);
      }).catch((e2) => {
        if (e2 instanceof Error) {
          throw e2;
        } else {
          throw new Error(JSON.stringify(e2));
        }
      });
    }
    async streamApiCall(url, requestInit, httpMethod) {
      return this.apiCall(url.toString(), Object.assign(Object.assign({}, requestInit), { method: httpMethod })).then(async (response) => {
        await throwErrorIfNotOK(response);
        return this.processStreamResponse(response);
      }).catch((e2) => {
        if (e2 instanceof Error) {
          throw e2;
        } else {
          throw new Error(JSON.stringify(e2));
        }
      });
    }
    processStreamResponse(response) {
      var _a2;
      return __asyncGenerator(this, arguments, function* processStreamResponse_1() {
        const reader = (_a2 = response === null || response === void 0 ? void 0 : response.body) === null || _a2 === void 0 ? void 0 : _a2.getReader();
        const decoder = new TextDecoder("utf-8");
        if (!reader) {
          throw new Error("Response body is empty");
        }
        try {
          let buffer = "";
          while (true) {
            const { done, value } = yield __await(reader.read());
            if (done) {
              if (buffer.trim().length > 0) {
                throw new Error("Incomplete JSON segment at the end");
              }
              break;
            }
            const chunkString = decoder.decode(value);
            buffer += chunkString;
            let match = buffer.match(responseLineRE);
            while (match) {
              const processedChunkString = match[1];
              try {
                const chunkData = JSON.parse(processedChunkString);
                yield yield __await(chunkData);
                buffer = buffer.slice(match[0].length);
                match = buffer.match(responseLineRE);
              } catch (e2) {
                throw new Error(`exception parsing stream chunk ${processedChunkString}. ${e2}`);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      });
    }
    async apiCall(url, requestInit) {
      return fetch(url, requestInit).catch((e2) => {
        throw new Error(`exception ${e2} sending request`);
      });
    }
    getDefaultHeaders() {
      const headers = {};
      const versionHeaderValue = LIBRARY_LABEL + " " + this.clientOptions.userAgentExtra;
      headers[USER_AGENT_HEADER] = versionHeaderValue;
      headers[GOOGLE_API_CLIENT_HEADER] = versionHeaderValue;
      headers[CONTENT_TYPE_HEADER] = "application/json";
      return headers;
    }
    async getHeadersInternal(httpOptions) {
      const headers = new Headers();
      if (httpOptions && httpOptions.headers) {
        for (const [key, value] of Object.entries(httpOptions.headers)) {
          headers.append(key, value);
        }
      }
      await this.clientOptions.auth.addAuthHeaders(headers);
      return headers;
    }
    async uploadFile(file, config) {
      var _a2;
      const fileToUpload = {};
      if (config != null) {
        fileToUpload.mimeType = config.mimeType;
        fileToUpload.name = config.name;
        fileToUpload.displayName = config.displayName;
      }
      if (fileToUpload.name && !fileToUpload.name.startsWith("files/")) {
        fileToUpload.name = `files/${fileToUpload.name}`;
      }
      const uploader = this.clientOptions.uploader;
      const fileStat = await uploader.stat(file);
      fileToUpload.sizeBytes = fileStat.size;
      const mimeType = (_a2 = config === null || config === void 0 ? void 0 : config.mimeType) !== null && _a2 !== void 0 ? _a2 : fileStat.type;
      if (mimeType === void 0 || mimeType === "") {
        throw new Error("Can not determine mimeType. Please provide mimeType in the config.");
      }
      fileToUpload.mimeType = mimeType;
      const uploadUrl = await this.fetchUploadUrl(fileToUpload, config);
      return uploader.upload(file, uploadUrl, this);
    }
    async fetchUploadUrl(file, config) {
      var _a2;
      let httpOptions = {};
      if (config === null || config === void 0 ? void 0 : config.httpOptions) {
        httpOptions = config.httpOptions;
      } else {
        httpOptions = {
          apiVersion: "",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": `${file.sizeBytes}`,
            "X-Goog-Upload-Header-Content-Type": `${file.mimeType}`
          }
        };
      }
      const body = {
        "file": file
      };
      const httpResponse = await this.request({
        path: formatMap("upload/v1beta/files", body["_url"]),
        body: JSON.stringify(body),
        httpMethod: "POST",
        httpOptions
      });
      if (!httpResponse || !(httpResponse === null || httpResponse === void 0 ? void 0 : httpResponse.headers)) {
        throw new Error("Server did not return an HttpResponse or the returned HttpResponse did not have headers.");
      }
      const uploadUrl = (_a2 = httpResponse === null || httpResponse === void 0 ? void 0 : httpResponse.headers) === null || _a2 === void 0 ? void 0 : _a2["x-goog-upload-url"];
      if (uploadUrl === void 0) {
        throw new Error("Failed to get upload url. Server did not return the x-google-upload-url in the headers");
      }
      return uploadUrl;
    }
  };
  async function throwErrorIfNotOK(response) {
    var _a2;
    if (response === void 0) {
      throw new ServerError("response is undefined");
    }
    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      let errorBody;
      if ((_a2 = response.headers.get("content-type")) === null || _a2 === void 0 ? void 0 : _a2.includes("application/json")) {
        errorBody = await response.json();
      } else {
        errorBody = {
          error: {
            message: "exception parsing response",
            code: response.status,
            status: response.statusText
          }
        };
      }
      const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(errorBody)}`;
      if (status >= 400 && status < 500) {
        const clientError = new ClientError(errorMessage);
        throw clientError;
      } else if (status >= 500 && status < 600) {
        const serverError = new ServerError(errorMessage);
        throw serverError;
      }
      throw new Error(errorMessage);
    }
  }
  function listFilesConfigToMldev(apiClient, fromObject, parentObject) {
    const toObject = {};
    const fromPageSize = getValueByPath(fromObject, ["pageSize"]);
    if (parentObject !== void 0 && fromPageSize != null) {
      setValueByPath(parentObject, ["_query", "pageSize"], fromPageSize);
    }
    const fromPageToken = getValueByPath(fromObject, ["pageToken"]);
    if (parentObject !== void 0 && fromPageToken != null) {
      setValueByPath(parentObject, ["_query", "pageToken"], fromPageToken);
    }
    return toObject;
  }
  function listFilesParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], listFilesConfigToMldev(apiClient, fromConfig, toObject));
    }
    return toObject;
  }
  function fileStatusToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromDetails = getValueByPath(fromObject, ["details"]);
    if (fromDetails != null) {
      setValueByPath(toObject, ["details"], fromDetails);
    }
    const fromMessage = getValueByPath(fromObject, ["message"]);
    if (fromMessage != null) {
      setValueByPath(toObject, ["message"], fromMessage);
    }
    const fromCode = getValueByPath(fromObject, ["code"]);
    if (fromCode != null) {
      setValueByPath(toObject, ["code"], fromCode);
    }
    return toObject;
  }
  function fileToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    const fromSizeBytes = getValueByPath(fromObject, ["sizeBytes"]);
    if (fromSizeBytes != null) {
      setValueByPath(toObject, ["sizeBytes"], fromSizeBytes);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromExpirationTime = getValueByPath(fromObject, [
      "expirationTime"
    ]);
    if (fromExpirationTime != null) {
      setValueByPath(toObject, ["expirationTime"], fromExpirationTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromSha256Hash = getValueByPath(fromObject, ["sha256Hash"]);
    if (fromSha256Hash != null) {
      setValueByPath(toObject, ["sha256Hash"], fromSha256Hash);
    }
    const fromUri = getValueByPath(fromObject, ["uri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromDownloadUri = getValueByPath(fromObject, ["downloadUri"]);
    if (fromDownloadUri != null) {
      setValueByPath(toObject, ["downloadUri"], fromDownloadUri);
    }
    const fromState = getValueByPath(fromObject, ["state"]);
    if (fromState != null) {
      setValueByPath(toObject, ["state"], fromState);
    }
    const fromSource = getValueByPath(fromObject, ["source"]);
    if (fromSource != null) {
      setValueByPath(toObject, ["source"], fromSource);
    }
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fileStatusToMldev(apiClient, fromError));
    }
    return toObject;
  }
  function createFileParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromFile = getValueByPath(fromObject, ["file"]);
    if (fromFile != null) {
      setValueByPath(toObject, ["file"], fileToMldev(apiClient, fromFile));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function getFileParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "file"], tFileName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function deleteFileParametersToMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["_url", "file"], tFileName(apiClient, fromName));
    }
    const fromConfig = getValueByPath(fromObject, ["config"]);
    if (fromConfig != null) {
      setValueByPath(toObject, ["config"], fromConfig);
    }
    return toObject;
  }
  function fileStatusFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromDetails = getValueByPath(fromObject, ["details"]);
    if (fromDetails != null) {
      setValueByPath(toObject, ["details"], fromDetails);
    }
    const fromMessage = getValueByPath(fromObject, ["message"]);
    if (fromMessage != null) {
      setValueByPath(toObject, ["message"], fromMessage);
    }
    const fromCode = getValueByPath(fromObject, ["code"]);
    if (fromCode != null) {
      setValueByPath(toObject, ["code"], fromCode);
    }
    return toObject;
  }
  function fileFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromName = getValueByPath(fromObject, ["name"]);
    if (fromName != null) {
      setValueByPath(toObject, ["name"], fromName);
    }
    const fromDisplayName = getValueByPath(fromObject, ["displayName"]);
    if (fromDisplayName != null) {
      setValueByPath(toObject, ["displayName"], fromDisplayName);
    }
    const fromMimeType = getValueByPath(fromObject, ["mimeType"]);
    if (fromMimeType != null) {
      setValueByPath(toObject, ["mimeType"], fromMimeType);
    }
    const fromSizeBytes = getValueByPath(fromObject, ["sizeBytes"]);
    if (fromSizeBytes != null) {
      setValueByPath(toObject, ["sizeBytes"], fromSizeBytes);
    }
    const fromCreateTime = getValueByPath(fromObject, ["createTime"]);
    if (fromCreateTime != null) {
      setValueByPath(toObject, ["createTime"], fromCreateTime);
    }
    const fromExpirationTime = getValueByPath(fromObject, [
      "expirationTime"
    ]);
    if (fromExpirationTime != null) {
      setValueByPath(toObject, ["expirationTime"], fromExpirationTime);
    }
    const fromUpdateTime = getValueByPath(fromObject, ["updateTime"]);
    if (fromUpdateTime != null) {
      setValueByPath(toObject, ["updateTime"], fromUpdateTime);
    }
    const fromSha256Hash = getValueByPath(fromObject, ["sha256Hash"]);
    if (fromSha256Hash != null) {
      setValueByPath(toObject, ["sha256Hash"], fromSha256Hash);
    }
    const fromUri = getValueByPath(fromObject, ["uri"]);
    if (fromUri != null) {
      setValueByPath(toObject, ["uri"], fromUri);
    }
    const fromDownloadUri = getValueByPath(fromObject, ["downloadUri"]);
    if (fromDownloadUri != null) {
      setValueByPath(toObject, ["downloadUri"], fromDownloadUri);
    }
    const fromState = getValueByPath(fromObject, ["state"]);
    if (fromState != null) {
      setValueByPath(toObject, ["state"], fromState);
    }
    const fromSource = getValueByPath(fromObject, ["source"]);
    if (fromSource != null) {
      setValueByPath(toObject, ["source"], fromSource);
    }
    const fromVideoMetadata = getValueByPath(fromObject, [
      "videoMetadata"
    ]);
    if (fromVideoMetadata != null) {
      setValueByPath(toObject, ["videoMetadata"], fromVideoMetadata);
    }
    const fromError = getValueByPath(fromObject, ["error"]);
    if (fromError != null) {
      setValueByPath(toObject, ["error"], fileStatusFromMldev(apiClient, fromError));
    }
    return toObject;
  }
  function listFilesResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromNextPageToken = getValueByPath(fromObject, [
      "nextPageToken"
    ]);
    if (fromNextPageToken != null) {
      setValueByPath(toObject, ["nextPageToken"], fromNextPageToken);
    }
    const fromFiles = getValueByPath(fromObject, ["files"]);
    if (fromFiles != null) {
      if (Array.isArray(fromFiles)) {
        setValueByPath(toObject, ["files"], fromFiles.map((item) => {
          return fileFromMldev(apiClient, item);
        }));
      } else {
        setValueByPath(toObject, ["files"], fromFiles);
      }
    }
    return toObject;
  }
  function createFileResponseFromMldev(apiClient, fromObject) {
    const toObject = {};
    const fromHttpHeaders = getValueByPath(fromObject, ["httpHeaders"]);
    if (fromHttpHeaders != null) {
      setValueByPath(toObject, ["httpHeaders"], fromHttpHeaders);
    }
    return toObject;
  }
  function deleteFileResponseFromMldev() {
    const toObject = {};
    return toObject;
  }
  var Files = class extends BaseModule {
    constructor(apiClient) {
      super();
      this.apiClient = apiClient;
      this.list = async (params = {}) => {
        return new Pager(PagedItem.PAGED_ITEM_FILES, (x2) => this.listInternal(x2), await this.listInternal(params), params);
      };
    }
    async upload(params) {
      if (this.apiClient.isVertexAI()) {
        throw new Error("Vertex AI does not support uploading files. You can share files through a GCS bucket.");
      }
      return this.apiClient.uploadFile(params.file, params.config).then((response) => {
        const file = fileFromMldev(this.apiClient, response);
        return file;
      });
    }
    async listInternal(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = listFilesParametersToMldev(this.apiClient, params);
        path = formatMap("files", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = listFilesResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new ListFilesResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async createInternal(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = createFileParametersToMldev(this.apiClient, params);
        path = formatMap("upload/v1beta/files", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "POST",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = createFileResponseFromMldev(this.apiClient, apiResponse);
          const typedResp = new CreateFileResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
    async get(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = getFileParametersToMldev(this.apiClient, params);
        path = formatMap("files/{file}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "GET",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then((apiResponse) => {
          const resp = fileFromMldev(this.apiClient, apiResponse);
          return resp;
        });
      }
    }
    async delete(params) {
      var _a2;
      let response;
      let path = "";
      let queryParams = {};
      if (this.apiClient.isVertexAI()) {
        throw new Error("This method is only supported by the Gemini Developer API.");
      } else {
        const body = deleteFileParametersToMldev(this.apiClient, params);
        path = formatMap("files/{file}", body["_url"]);
        queryParams = body["_query"];
        delete body["config"];
        delete body["_url"];
        delete body["_query"];
        response = this.apiClient.request({
          path,
          queryParams,
          body: JSON.stringify(body),
          httpMethod: "DELETE",
          httpOptions: (_a2 = params.config) === null || _a2 === void 0 ? void 0 : _a2.httpOptions
        }).then((httpResponse) => {
          return httpResponse.json();
        });
        return response.then(() => {
          const resp = deleteFileResponseFromMldev();
          const typedResp = new DeleteFileResponse();
          Object.assign(typedResp, resp);
          return typedResp;
        });
      }
    }
  };
  var MAX_CHUNK_SIZE = 1024 * 1024 * 8;
  async function uploadBlob(file, uploadUrl, apiClient) {
    var _a2, _b;
    let fileSize = 0;
    let offset = 0;
    let response = new HttpResponse(new Response());
    let uploadCommand = "upload";
    fileSize = file.size;
    while (offset < fileSize) {
      const chunkSize = Math.min(MAX_CHUNK_SIZE, fileSize - offset);
      const chunk = file.slice(offset, offset + chunkSize);
      if (offset + chunkSize >= fileSize) {
        uploadCommand += ", finalize";
      }
      response = await apiClient.request({
        path: "",
        body: chunk,
        httpMethod: "POST",
        httpOptions: {
          apiVersion: "",
          baseUrl: uploadUrl,
          headers: {
            "X-Goog-Upload-Command": uploadCommand,
            "X-Goog-Upload-Offset": String(offset),
            "Content-Length": String(chunkSize)
          }
        }
      });
      offset += chunkSize;
      if (((_a2 = response === null || response === void 0 ? void 0 : response.headers) === null || _a2 === void 0 ? void 0 : _a2["x-goog-upload-status"]) !== "active") {
        break;
      }
      if (fileSize <= offset) {
        throw new Error("All content has been uploaded, but the upload status is not finalized.");
      }
    }
    const responseJson = await (response === null || response === void 0 ? void 0 : response.json());
    if (((_b = response === null || response === void 0 ? void 0 : response.headers) === null || _b === void 0 ? void 0 : _b["x-goog-upload-status"]) !== "final") {
      throw new Error("Failed to upload file: Upload status is not finalized.");
    }
    return responseJson["file"];
  }
  async function getBlobStat(file) {
    const fileStat = { size: file.size, type: file.type };
    return fileStat;
  }
  var BrowserUploader = class {
    async upload(file, uploadUrl, apiClient) {
      if (typeof file === "string") {
        throw new Error("File path is not supported in browser uploader.");
      }
      return await uploadBlob(file, uploadUrl, apiClient);
    }
    async stat(file) {
      if (typeof file === "string") {
        throw new Error("File path is not supported in browser uploader.");
      } else {
        return await getBlobStat(file);
      }
    }
  };
  var BrowserWebSocketFactory = class {
    create(url, headers, callbacks) {
      return new BrowserWebSocket(url, headers, callbacks);
    }
  };
  var BrowserWebSocket = class {
    constructor(url, headers, callbacks) {
      this.url = url;
      this.headers = headers;
      this.callbacks = callbacks;
    }
    connect() {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.callbacks.onopen;
      this.ws.onerror = this.callbacks.onerror;
      this.ws.onclose = this.callbacks.onclose;
      this.ws.onmessage = this.callbacks.onmessage;
    }
    send(message) {
      if (this.ws === void 0) {
        throw new Error("WebSocket is not connected");
      }
      this.ws.send(message);
    }
    close() {
      if (this.ws === void 0) {
        throw new Error("WebSocket is not connected");
      }
      this.ws.close();
    }
  };
  var GOOGLE_API_KEY_HEADER = "x-goog-api-key";
  var WebAuth = class {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }
    async addAuthHeaders(headers) {
      if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
        return;
      }
      headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
    }
  };
  var LANGUAGE_LABEL_PREFIX = "gl-node/";
  var GoogleGenAI = class {
    constructor(options) {
      var _a2;
      if (options.apiKey == null) {
        throw new Error("An API Key must be set when running in a browser");
      }
      if (options.project || options.location) {
        throw new Error("Vertex AI project based authentication is not supported on browser runtimes. Please do not provide a project or location.");
      }
      this.vertexai = (_a2 = options.vertexai) !== null && _a2 !== void 0 ? _a2 : false;
      this.apiKey = options.apiKey;
      this.apiVersion = options.apiVersion;
      const auth = new WebAuth(this.apiKey);
      this.apiClient = new ApiClient({
        auth,
        apiVersion: this.apiVersion,
        apiKey: this.apiKey,
        vertexai: this.vertexai,
        httpOptions: options.httpOptions,
        userAgentExtra: LANGUAGE_LABEL_PREFIX + "web",
        uploader: new BrowserUploader()
      });
      this.models = new Models(this.apiClient);
      this.live = new Live(this.apiClient, auth, new BrowserWebSocketFactory());
      this.chats = new Chats(this.models, this.apiClient);
      this.caches = new Caches(this.apiClient);
      this.files = new Files(this.apiClient);
    }
  };

  // src/utils/Lyrics/fetchLyrics.ts
  var lyricsCache = new SpikyCache({
    name: "SpikyCache_Spicy_Lyrics"
  });
  async function fetchLyrics(uri) {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent")?.classList.contains("offline")) {
      document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent").classList.remove("offline");
    }
    document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
    if (!Fullscreen_default.IsOpen)
      PageView_default.AppendViewControls(true);
    const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";
    if (IsSomethingElseThanTrack) {
      return NotTrackMessage();
    }
    const currFetching = storage_default.get("currentlyFetching");
    if (currFetching == "true")
      return;
    storage_default.set("currentlyFetching", "true");
    document.querySelector("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
    ClearLyricsPageContainer();
    if (Spicetify.Player.data?.item?.type && Spicetify.Player.data?.item?.type === "unknown" && Spicetify.Player.data?.item?.provider && Spicetify.Player.data?.item?.provider?.startsWith("narration"))
      return DJMessage();
    if (Spicetify.Player.data?.item?.mediaType && Spicetify.Player.data?.item?.mediaType !== "audio")
      return NotTrackMessage();
    const trackId = uri.split(":")[2];
    const savedLyricsData = storage_default.get("currentLyricsData")?.toString();
    if (savedLyricsData) {
      try {
        if (savedLyricsData.includes("NO_LYRICS")) {
          const split = savedLyricsData.split(":");
          const id = split[1];
          if (id === trackId) {
            return await noLyricsMessage(false, true);
          }
        } else {
          const lyricsData = JSON.parse(savedLyricsData);
          if (lyricsData?.id === trackId) {
            storage_default.set("currentlyFetching", "false");
            HideLoaderContainer();
            ClearLyricsPageContainer();
            Defaults_default.CurrentLyricsType = lyricsData.Type;
            return lyricsData;
          }
        }
      } catch (error) {
        console.error("Error parsing saved lyrics data:", error);
        storage_default.set("currentlyFetching", "false");
        HideLoaderContainer();
        ClearLyricsPageContainer();
      }
    }
    if (lyricsCache) {
      try {
        const lyricsFromCache = await lyricsCache.get(trackId);
        if (lyricsFromCache) {
          if (navigator.onLine && lyricsFromCache?.expiresAt < new Date().getTime()) {
            await lyricsCache.remove(trackId);
          } else {
            if (lyricsFromCache?.status === "NO_LYRICS") {
              return await noLyricsMessage(false, true);
            }
            storage_default.set("currentLyricsData", JSON.stringify(lyricsFromCache));
            storage_default.set("currentlyFetching", "false");
            HideLoaderContainer();
            ClearLyricsPageContainer();
            Defaults_default.CurrentLyricsType = lyricsFromCache.Type;
            return { ...lyricsFromCache, fromCache: true };
          }
        }
      } catch (error) {
        ClearLyricsPageContainer();
        console.log("Error parsing saved lyrics data:", error);
        return await noLyricsMessage(false, true);
      }
    }
    if (!navigator.onLine)
      return urOfflineMessage();
    ShowLoaderContainer();
    try {
      Spicetify.showNotification("Fetching lyrics, please wait..", false, 2e3);
      const SpotifyAccessToken = await Platform_default.GetSpotifyAccessToken();
      let lyricsText = "";
      let status = 0;
      const jobs = await SendJob(
        [
          {
            handler: "LYRICS_ID",
            args: {
              id: trackId,
              auth: "SpicyLyrics-WebAuth"
            }
          }
        ],
        {
          "SpicyLyrics-WebAuth": `Bearer ${SpotifyAccessToken}`
        }
      );
      const lyricsJob = jobs.get("LYRICS_ID");
      status = lyricsJob.status;
      if (lyricsJob.type !== "json") {
        lyricsText = "";
      }
      lyricsText = JSON.stringify(lyricsJob.responseData);
      if (status !== 200) {
        if (status === 500)
          return await noLyricsMessage(false, true);
        if (status === 401) {
          storage_default.set("currentlyFetching", "false");
          return await noLyricsMessage(false, false);
        }
        ClearLyricsPageContainer();
        if (status === 404) {
          return await noLyricsMessage(false, true);
        }
        return await noLyricsMessage(false, true);
      }
      ClearLyricsPageContainer();
      if (lyricsText === null)
        return await noLyricsMessage(false, false);
      if (lyricsText === "")
        return await noLyricsMessage(false, true);
      let lyricsJson = await generateFurigana(JSON.parse(lyricsText));
      console.log("DEBUG", lyricsJson);
      storage_default.set("currentLyricsData", JSON.stringify(lyricsJson));
      storage_default.set("currentlyFetching", "false");
      HideLoaderContainer();
      ClearLyricsPageContainer();
      if (lyricsCache) {
        const expiresAt = new Date().getTime() + 1e3 * 60 * 60 * 24 * 7;
        try {
          await lyricsCache.set(trackId, {
            ...lyricsJson,
            expiresAt
          });
        } catch (error) {
          console.error("Error saving lyrics to cache:", error);
        }
      }
      Defaults_default.CurrentLyricsType = lyricsJson.Type;
      Spicetify.showNotification("Completed", false, 2e3);
      return { ...lyricsJson, fromCache: false };
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      storage_default.set("currentlyFetching", "false");
      ClearLyricsPageContainer();
      return await noLyricsMessage(false, true);
    }
  }
  async function generateFurigana(lyricsJson) {
    const GEMINI_API_KEY = storage_default.get("GEMINI_API_KEY")?.toString();
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "") {
      console.error("Amai Lyrics: Gemini API Key missing");
      lyricsJson.Info = "Amai Lyrics: Gemini API Key missing. Click here to add your own API key.";
    } else {
      try {
        console.log("Furigana: Gemini API Key present");
        const ai2 = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const generationConfig = {
          temperature: 0.2,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseModalities: [],
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              lines: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            }
          }
        };
        console.log("Amai Lyrics:", "Fetch Begin");
        if (lyricsJson.Type === "Syllable") {
          lyricsJson.Type = "Line";
          lyricsJson.Content = convertLyrics(lyricsJson.Content);
        }
        let lyricsOnly = [];
        if (lyricsJson.Type === "Line") {
          const offset = 0.55;
          lyricsJson.Content = lyricsJson.Content.map((item) => ({
            ...item,
            StartTime: Math.max(0, item.StartTime - offset)
          }));
          lyricsOnly = lyricsJson.Content.map((item) => item.Text);
        }
        if (lyricsJson.Type === "Static")
          lyricsOnly = lyricsJson.Lines.map((item) => item.Text);
        if (lyricsOnly.length > 0) {
          const response = await ai2.models.generateContent({
            config: generationConfig,
            model: "gemini-2.0-flash",
            contents: `You are an expert in Japanese language, specializing in kanji readings and song lyrics. Follow these instructions carefully: For each line in the following lyrics, identify all kanji characters and add their furigana in hiragana within curly braces, following standard Japanese orthography. For example: \u9858\u3044 would be written as \u9858{\u306D\u304C}\u3044, \u53EF\u611B\u3044 would be written as \u53EF\u611B{\u304B\u308F\u3044}\u3044, 5\u4EBA would be written as 5\u4EBA{\u306B\u3093}, \u660E\u5F8C\u65E5 would be written as \u660E\u5F8C\u65E5{\u3042\u3055\u3063\u3066}, etc. Use context-appropriate readings for each kanji based on standard Japanese usage. Here are the lyrics:
${lyricsOnly.join(
              "\n"
            )}`
          });
          let lyrics = JSON.parse(response.text);
          console.log("Amai Lyrics:", "Fetch Finished", lyrics);
          if (lyricsJson.Type === "Line") {
            lyricsJson.Content = lyricsJson.Content.map((item, index) => ({
              ...item,
              Text: lyrics.lines[index]
            }));
          } else if (lyricsJson.Type === "Static") {
            lyricsJson.Lines = lyricsJson.Lines.map((item, index) => ({
              ...item,
              Text: lyrics.lines[index]
            }));
          }
        }
      } catch (error) {
        console.error("Amai Lyrics:", error);
        lyricsJson.Info = "Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.";
      }
    }
    return lyricsJson;
  }
  function convertLyrics(data) {
    console.log("DEBUG", "Converting Syllable to Line type");
    return data.map((item) => {
      const leadText = item.Lead.Syllables.map((syl) => syl.Text).join("");
      let startTime = item.Lead.StartTime;
      let endTime = item.Lead.EndTime;
      let fullText = leadText;
      if (item.Background && Array.isArray(item.Background)) {
        const bgTexts = item.Background.map((bg) => {
          startTime = Math.min(startTime, bg.StartTime);
          endTime = Math.max(endTime, bg.EndTime);
          return bg.Syllables.map((syl) => syl.Text).join("");
        });
        fullText += " (" + bgTexts.join(" ") + ")";
      }
      return {
        Type: item.Type,
        OppositeAligned: item.OppositeAligned,
        Text: fullText,
        StartTime: startTime,
        EndTime: endTime
      };
    });
  }
  async function noLyricsMessage(Cache2 = true, LocalStorage = true) {
    LocalStorage ? storage_default.set(
      "currentLyricsData",
      `NO_LYRICS:${Spicetify.Player.data.item.uri.split(":")[2]}`
    ) : null;
    if (lyricsCache && Cache2) {
      const expiresAt = new Date().getTime() + 1e3 * 60 * 60 * 24 * 7;
      try {
        await lyricsCache.set(Spicetify.Player.data.item.uri.split(":")[2], {
          status: `NO_LYRICS`,
          expiresAt
        });
      } catch (error) {
        console.error("Error saving lyrics to cache:", error);
      }
    }
    storage_default.set("currentlyFetching", "false");
    HideLoaderContainer();
    Defaults_default.CurrentLyricsType = "None";
    document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.add("Hidden");
    document.querySelector("#SpicyLyricsPage .ContentBox")?.classList.add("LyricsHidden");
    OpenNowBar();
    DeregisterNowBarBtn();
    return "1";
  }
  function urOfflineMessage() {
    const Message = {
      Type: "Static",
      alternative_api: false,
      offline: true,
      Lines: [
        {
          Text: "You're offline"
        },
        {
          Text: ""
        },
        {
          Text: "[DEF=font_size:small]This extension works only if you're online."
        }
      ]
    };
    storage_default.set("currentlyFetching", "false");
    HideLoaderContainer();
    ClearLyricsPageContainer();
    Defaults_default.CurrentLyricsType = Message.Type;
    return Message;
  }
  function DJMessage() {
    const Message = {
      Type: "Static",
      alternative_api: false,
      styles: {
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "flex-direction": "column"
      },
      Lines: [
        {
          Text: "DJ Mode is On"
        },
        {
          Text: ""
        },
        {
          Text: "[DEF=font_size:small]If you want to load lyrics, please select a Song."
        }
      ]
    };
    storage_default.set("currentlyFetching", "false");
    HideLoaderContainer();
    ClearLyricsPageContainer();
    Defaults_default.CurrentLyricsType = Message.Type;
    return Message;
  }
  function NotTrackMessage() {
    const Message = {
      Type: "Static",
      styles: {
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "flex-direction": "column"
      },
      Lines: [
        {
          Text: "[DEF=font_size:small]You're playing an unsupported Content Type"
        }
      ]
    };
    storage_default.set("currentlyFetching", "false");
    HideLoaderContainer();
    ClearLyricsPageContainer();
    CloseNowBar();
    Defaults_default.CurrentLyricsType = Message.Type;
    return Message;
  }
  var ContainerShowLoaderTimeout;
  function ShowLoaderContainer() {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer")) {
      ContainerShowLoaderTimeout = setTimeout(
        () => document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer").classList.add("active"),
        1e3
      );
    }
  }
  function HideLoaderContainer() {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer")) {
      if (ContainerShowLoaderTimeout) {
        clearTimeout(ContainerShowLoaderTimeout);
        ContainerShowLoaderTimeout = null;
      }
      document.querySelector("#SpicyLyricsPage .LyricsContainer .loaderContainer").classList.remove("active");
    }
  }
  function ClearLyricsPageContainer() {
    if (document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent")) {
      document.querySelector(
        "#SpicyLyricsPage .LyricsContainer .LyricsContent"
      ).innerHTML = "";
    }
  }

  // src/edited_packages/spcr-settings/settingsSection.tsx
  var import_react = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());
  var SettingsSection = class {
    constructor(name, settingsId, initialSettingsFields = {}) {
      this.name = name;
      this.settingsId = settingsId;
      this.initialSettingsFields = initialSettingsFields;
      this.settingsFields = this.initialSettingsFields;
      this.setRerender = null;
      this.pushSettings = async () => {
        Object.entries(this.settingsFields).forEach(([nameId, field]) => {
          if (field.type !== "button" && this.getFieldValue(nameId) === void 0) {
            this.setFieldValue(nameId, field.defaultValue);
          }
        });
        while (!Spicetify?.Platform?.History?.listen) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (this.stopHistoryListener)
          this.stopHistoryListener();
        this.stopHistoryListener = Spicetify.Platform.History.listen((e2) => {
          if (e2.pathname === "/preferences") {
            this.render();
          }
        });
        if (Spicetify.Platform.History.location.pathname === "/preferences") {
          await this.render();
        }
      };
      this.rerender = () => {
        if (this.setRerender) {
          this.setRerender(Math.random());
        }
      };
      this.render = async () => {
        while (!document.getElementById("desktop.settings.selectLanguage")) {
          if (Spicetify.Platform.History.location.pathname !== "/preferences")
            return;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const allSettingsContainer = document.querySelector(
          ".main-view-container__scroll-node-child main div"
        );
        if (!allSettingsContainer)
          return console.error("[spcr-settings] settings container not found");
        let pluginSettingsContainer = Array.from(
          allSettingsContainer.children
        ).find((child) => child.id === this.settingsId);
        if (!pluginSettingsContainer) {
          pluginSettingsContainer = document.createElement("div");
          pluginSettingsContainer.id = this.settingsId;
          allSettingsContainer.appendChild(pluginSettingsContainer);
        } else {
          console.log(pluginSettingsContainer);
        }
        import_react_dom.default.render(/* @__PURE__ */ import_react.default.createElement(this.FieldsContainer, null), pluginSettingsContainer);
      };
      this.addButton = (nameId, description, value, onClick, events) => {
        this.settingsFields[nameId] = {
          type: "button",
          description,
          value,
          events: {
            onClick,
            ...events
          }
        };
      };
      this.addInput = (nameId, description, defaultValue, onChange, inputType, events) => {
        this.settingsFields[nameId] = {
          type: "input",
          description,
          defaultValue,
          inputType,
          events: {
            onChange,
            ...events
          }
        };
      };
      this.addHidden = (nameId, defaultValue) => {
        this.settingsFields[nameId] = {
          type: "hidden",
          defaultValue
        };
      };
      this.addToggle = (nameId, description, defaultValue, onChange, events) => {
        this.settingsFields[nameId] = {
          type: "toggle",
          description,
          defaultValue,
          events: {
            onChange,
            ...events
          }
        };
      };
      this.addDropDown = (nameId, description, options, defaultIndex, onSelect, events) => {
        this.settingsFields[nameId] = {
          type: "dropdown",
          description,
          defaultValue: options[defaultIndex],
          options,
          events: {
            onSelect,
            ...events
          }
        };
      };
      this.getFieldValue = (nameId) => {
        return JSON.parse(
          Spicetify.LocalStorage.get(`${this.settingsId}.${nameId}`) || "{}"
        )?.value;
      };
      this.setFieldValue = (nameId, newValue) => {
        Spicetify.LocalStorage.set(
          `${this.settingsId}.${nameId}`,
          JSON.stringify({ value: newValue })
        );
      };
      this.FieldsContainer = () => {
        const [rerender, setRerender] = (0, import_react.useState)(0);
        this.setRerender = setRerender;
        return /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-section",
          key: rerender
        }, /* @__PURE__ */ import_react.default.createElement("h2", {
          className: "TypeElement-cello-textBase-type"
        }, this.name), Object.entries(this.settingsFields).map(([nameId, field]) => {
          return /* @__PURE__ */ import_react.default.createElement(this.Field, {
            nameId,
            field
          });
        }));
      };
      this.Field = (props) => {
        const id = `${this.settingsId}.${props.nameId}`;
        let defaultStateValue;
        if (props.field.type === "button") {
          defaultStateValue = props.field.value;
        } else {
          defaultStateValue = this.getFieldValue(props.nameId);
        }
        if (props.field.type === "hidden") {
          return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null);
        }
        const [value, setValueState] = (0, import_react.useState)(defaultStateValue);
        const setValue = (newValue) => {
          if (newValue !== void 0) {
            setValueState(newValue);
            this.setFieldValue(props.nameId, newValue);
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-row"
        }, /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-firstColumn"
        }, /* @__PURE__ */ import_react.default.createElement("label", {
          className: "TypeElement-viola-textSubdued-type",
          htmlFor: id
        }, props.field.description || "")), /* @__PURE__ */ import_react.default.createElement("div", {
          className: "x-settings-secondColumn"
        }, props.field.type === "input" ? /* @__PURE__ */ import_react.default.createElement("input", {
          className: "x-settings-input",
          id,
          dir: "ltr",
          value,
          type: props.field.inputType || "text",
          ...props.field.events,
          onChange: (e2) => {
            setValue(e2.currentTarget.value);
            const onChange = props.field.events?.onChange;
            if (onChange)
              onChange(e2);
          }
        }) : props.field.type === "button" ? /* @__PURE__ */ import_react.default.createElement("span", null, /* @__PURE__ */ import_react.default.createElement("button", {
          id,
          className: "Button-sc-y0gtbx-0 Button-small-buttonSecondary-useBrowserDefaultFocusStyle x-settings-button",
          ...props.field.events,
          onClick: (e2) => {
            setValue();
            const onClick = props.field.events?.onClick;
            if (onClick)
              onClick(e2);
          },
          type: "button"
        }, value)) : props.field.type === "toggle" ? /* @__PURE__ */ import_react.default.createElement("label", {
          className: "x-settings-secondColumn x-toggle-wrapper"
        }, /* @__PURE__ */ import_react.default.createElement("input", {
          id,
          className: "x-toggle-input",
          type: "checkbox",
          checked: value,
          ...props.field.events,
          onClick: (e2) => {
            setValue(e2.currentTarget.checked);
            const onClick = props.field.events?.onClick;
            if (onClick)
              onClick(e2);
          }
        }), /* @__PURE__ */ import_react.default.createElement("span", {
          className: "x-toggle-indicatorWrapper"
        }, /* @__PURE__ */ import_react.default.createElement("span", {
          className: "x-toggle-indicator"
        }))) : props.field.type === "dropdown" ? /* @__PURE__ */ import_react.default.createElement("select", {
          className: "main-dropDown-dropDown",
          id,
          ...props.field.events,
          onChange: (e2) => {
            setValue(
              props.field.options[e2.currentTarget.selectedIndex]
            );
            const onSelect = props.field.events?.onSelect;
            if (onSelect)
              onSelect(e2);
          }
        }, props.field.options.map((option, i2) => {
          return /* @__PURE__ */ import_react.default.createElement("option", {
            selected: option === value,
            value: i2 + 1
          }, option);
        })) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null)));
      };
    }
  };

  // src/utils/settings.ts
  function setSettingsMenu() {
    generalSettings();
    devSettings();
    infos();
  }
  function devSettings() {
    const settings = new SettingsSection(
      "Amai - Dev Settings",
      "spicy-lyrics-dev-settings"
    );
    settings.addButton(
      "remove-cached-lyrics",
      "Remove Cached Lyrics",
      "Remove Cached Lyrics",
      () => {
        lyricsCache.destroy();
        Spicetify.showNotification("Cache Destroyed Successfully!", false, 5e3);
      }
    );
    settings.addButton(
      "remove-current-song-lyrics-from-localStorage",
      "Remove Current Song Lyrics from LocalStorage",
      "Remove Current Lyrics",
      () => {
        storage_default.set("currentLyricsData", null);
        Spicetify.showNotification(
          "Current Lyrics Removed Successfully!",
          false,
          5e3
        );
      }
    );
    settings.addButton("reload", "Reload UI", "Reload", () => {
      window.location.reload();
    });
    settings.pushSettings();
  }
  function generalSettings() {
    const settings = new SettingsSection(
      "Amai - General",
      "spicy-lyrics-settings"
    );
    settings.addInput("gemini-api-key", "Gemini API Key", "", () => {
      storage_default.set(
        "GEMINI_API_KEY",
        settings.getFieldValue("gemini-api-key")
      );
      lyricsCache.destroy();
      storage_default.set("currentLyricsData", null);
      if (!Spicetify.Player.data?.item?.uri)
        return;
      const currentUri = Spicetify.Player.data.item.uri;
      fetchLyrics(currentUri).then(ApplyLyrics);
    });
    settings.addButton(
      "get-gemini-api",
      "Get your own Gemini API here",
      "get API",
      () => {
        window.location.href = "https://aistudio.google.com/app/apikey/";
      }
    );
    settings.pushSettings();
  }
  function infos() {
    const settings = new SettingsSection("Amai - Info", "amai-info");
    settings.addButton(
      "more-info",
      "This fork adds Furigana support to the original Spicy Lyrics utilizing free Gemini API. For personal use only.",
      "v1.0.6",
      () => {
      }
    );
    settings.pushSettings();
  }

  // src/components/Styling/Fonts.ts
  var Fonts = DeepFreeze({
    Lyrics: () => LoadFont("https://fonts.spikerko.org/spicy-lyrics/source.css"),
    Vazirmatn: () => LoadFont("https://fonts.spikerko.org/Vazirmatn/source.css")
  });
  function LoadFonts() {
    Object.values(Fonts).forEach((loadFontFunction) => loadFontFunction());
  }
  function LoadFont(url) {
    const fontElement = document.createElement("link");
    fontElement.href = url;
    fontElement.rel = "stylesheet";
    fontElement.type = "text/css";
    document.head.appendChild(fontElement);
  }

  // src/components/PlaylistBGs/main.ts
  var ThisPageRoot = document.querySelector(".Root__main-view");
  Global_default.Event.listen("session:navigation", (data) => {
    if (Session_default.GetPreviousLocation()?.pathname.startsWith("/playlist") && ThisPageRoot.classList.contains("spicy-playlist-bg")) {
      const underMainView = ThisPageRoot.querySelector(".under-main-view");
      underMainView.innerHTML = ``;
      ThisPageRoot.classList.remove("spicy-playlist-bg");
    }
    if (data.pathname.startsWith("/playlist")) {
      Whentil_default.When(() => ThisPageRoot.querySelector(".under-main-view") && ThisPageRoot.querySelector(".main-entityHeader-container"), async () => {
        const bgColorEntity = ThisPageRoot.querySelector(".main-entityHeader-backgroundColor");
        const bgColorOverlayEntity = ThisPageRoot.querySelector(".main-entityHeader-backgroundColor.main-entityHeader-overlay");
        const divEntityContainer = ThisPageRoot.querySelector(".main-entityHeader-container");
        const underMainView = ThisPageRoot.querySelector(".under-main-view");
        const playlistContentActionBar = ThisPageRoot.querySelector(".main-actionBarBackground-background");
        if (underMainView.querySelector(".main-entityHeader-background")) {
          return;
        }
        const currentPlaylistId = data.pathname.replace("/playlist/", "");
        bgColorEntity.style.setProperty("--BorderRadius", "0");
        bgColorEntity.classList.add("Skeletoned");
        divEntityContainer?.classList.add("main-entityHeader-withBackgroundImage");
        const PROD_HOSTNAME = "https://portal.spicylyrics.org";
        const prefetchUrl = `${PROD_HOSTNAME}/api/playlist-bgs?playlistId=${currentPlaylistId}`;
        let imagePrefetch;
        try {
          imagePrefetch = await fetch(prefetchUrl, {
            method: "GET"
          });
        } catch (error) {
          console.error("Error fetching playlist bg", error);
          bgColorEntity.classList.remove("Skeletoned");
          divEntityContainer?.classList.remove("main-entityHeader-withBackgroundImage");
          return;
        }
        if (imagePrefetch.status !== 200) {
          bgColorEntity.classList.remove("Skeletoned");
          divEntityContainer?.classList.remove("main-entityHeader-withBackgroundImage");
          return;
        }
        const imagePrefetchData = await imagePrefetch.json();
        const ImageUrl = imagePrefetchData.body?.url;
        const ImageBlob = await BlobURLMaker(ImageUrl);
        if (ImageBlob === null) {
          return;
        }
        let VibrantColor;
        Whentil_default.When(() => playlistContentActionBar.style.backgroundColor, async () => {
          const vibrantColor = (await ExtractColorsFromImage(ImageBlob))?.LightVibrant?.getHex();
          playlistContentActionBar.style.backgroundColor = vibrantColor;
          VibrantColor = vibrantColor;
        });
        underMainView.innerHTML = `
                <div>
                    <div data-testid="background-image" class="main-entityHeader-background main-entityHeader-gradient" style="background-image: url('${ImageBlob}');background-position:center center;"></div>
                    <div class="main-entityHeader-background main-entityHeader-overlay" style="--bgColor: ${VibrantColor};"></div>
                </div>
            `;
        bgColorEntity?.remove();
        bgColorOverlayEntity?.remove();
        ThisPageRoot.classList.add("spicy-playlist-bg");
      });
    }
  });
  async function ExtractColorsFromImage(imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.crossOrigin = "anonymous";
    img.style.display = "none";
    document.body.appendChild(img);
    const pallete = await Vibrant.from(img).getPalette();
    img.remove();
    return pallete;
  }

  // node_modules/posthog-js/dist/module.js
  var e;
  var t = "undefined" != typeof window ? window : void 0;
  var i = "undefined" != typeof globalThis ? globalThis : t;
  var n = Array.prototype;
  var r = n.forEach;
  var s = n.indexOf;
  var o = null == i ? void 0 : i.navigator;
  var a = null == i ? void 0 : i.document;
  var l = null == i ? void 0 : i.location;
  var u = null == i ? void 0 : i.fetch;
  var c = null != i && i.XMLHttpRequest && "withCredentials" in new i.XMLHttpRequest() ? i.XMLHttpRequest : void 0;
  var d = null == i ? void 0 : i.AbortController;
  var h = null == o ? void 0 : o.userAgent;
  var _ = null != t ? t : {};
  var p = { DEBUG: false, LIB_VERSION: "1.203.1" };
  var v = "$copy_autocapture";
  var g = ["$snapshot", "$pageview", "$pageleave", "$set", "survey dismissed", "survey sent", "survey shown", "$identify", "$groupidentify", "$create_alias", "$$client_ingestion_warning", "$web_experiment_applied", "$feature_enrollment_update", "$feature_flag_called"];
  !function(e2) {
    e2.GZipJS = "gzip-js", e2.Base64 = "base64";
  }(e || (e = {}));
  function m(e2, t2) {
    return -1 !== e2.indexOf(t2);
  }
  var b = function(e2) {
    return e2.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  };
  var y = function(e2) {
    return e2.replace(/^\$/, "");
  };
  var w = Array.isArray;
  var S = Object.prototype;
  var E = S.hasOwnProperty;
  var k = S.toString;
  var x = w || function(e2) {
    return "[object Array]" === k.call(e2);
  };
  var I = (e2) => "function" == typeof e2;
  var C = (e2) => e2 === Object(e2) && !x(e2);
  var P = (e2) => {
    if (C(e2)) {
      for (var t2 in e2)
        if (E.call(e2, t2))
          return false;
      return true;
    }
    return false;
  };
  var R = (e2) => void 0 === e2;
  var F = (e2) => "[object String]" == k.call(e2);
  var T = (e2) => F(e2) && 0 === e2.trim().length;
  var $ = (e2) => null === e2;
  var O = (e2) => R(e2) || $(e2);
  var L = (e2) => "[object Number]" == k.call(e2);
  var M = (e2) => "[object Boolean]" === k.call(e2);
  var A = (e2) => e2 instanceof FormData;
  var D = (e2) => m(g, e2);
  var N = (e2) => {
    var i2 = { _log: function(i3) {
      if (t && (p.DEBUG || _.POSTHOG_DEBUG) && !R(t.console) && t.console) {
        for (var n2 = ("__rrweb_original__" in t.console[i3]) ? t.console[i3].__rrweb_original__ : t.console[i3], r2 = arguments.length, s2 = new Array(r2 > 1 ? r2 - 1 : 0), o2 = 1; o2 < r2; o2++)
          s2[o2 - 1] = arguments[o2];
        n2(e2, ...s2);
      }
    }, info: function() {
      for (var e3 = arguments.length, t2 = new Array(e3), n2 = 0; n2 < e3; n2++)
        t2[n2] = arguments[n2];
      i2._log("log", ...t2);
    }, warn: function() {
      for (var e3 = arguments.length, t2 = new Array(e3), n2 = 0; n2 < e3; n2++)
        t2[n2] = arguments[n2];
      i2._log("warn", ...t2);
    }, error: function() {
      for (var e3 = arguments.length, t2 = new Array(e3), n2 = 0; n2 < e3; n2++)
        t2[n2] = arguments[n2];
      i2._log("error", ...t2);
    }, critical: function() {
      for (var t2 = arguments.length, i3 = new Array(t2), n2 = 0; n2 < t2; n2++)
        i3[n2] = arguments[n2];
      console.error(e2, ...i3);
    }, uninitializedWarning: (e3) => {
      i2.error("You must initialize PostHog before calling ".concat(e3));
    }, createLogger: (t2) => N("".concat(e2, " ").concat(t2)) };
    return i2;
  };
  var q = N("[PostHog.js]");
  var B = q.createLogger;
  var H = B("[ExternalScriptsLoader]");
  var U = (e2, t2, i2) => {
    if (e2.config.disable_external_dependency_loading)
      return H.warn("".concat(t2, " was requested but loading of external scripts is disabled.")), i2("Loading of external scripts is disabled");
    var n2 = () => {
      if (!a)
        return i2("document not found");
      var e3 = a.createElement("script");
      e3.type = "text/javascript", e3.crossOrigin = "anonymous", e3.src = t2, e3.onload = (e4) => i2(void 0, e4), e3.onerror = (e4) => i2(e4);
      var n3, r2 = a.querySelectorAll("body > script");
      r2.length > 0 ? null === (n3 = r2[0].parentNode) || void 0 === n3 || n3.insertBefore(e3, r2[0]) : a.body.appendChild(e3);
    };
    null != a && a.body ? n2() : null == a || a.addEventListener("DOMContentLoaded", n2);
  };
  function z(e2, t2) {
    var i2 = Object.keys(e2);
    if (Object.getOwnPropertySymbols) {
      var n2 = Object.getOwnPropertySymbols(e2);
      t2 && (n2 = n2.filter(function(t3) {
        return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
      })), i2.push.apply(i2, n2);
    }
    return i2;
  }
  function j(e2) {
    for (var t2 = 1; t2 < arguments.length; t2++) {
      var i2 = null != arguments[t2] ? arguments[t2] : {};
      t2 % 2 ? z(Object(i2), true).forEach(function(t3) {
        W(e2, t3, i2[t3]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(i2)) : z(Object(i2)).forEach(function(t3) {
        Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(i2, t3));
      });
    }
    return e2;
  }
  function W(e2, t2, i2) {
    return t2 in e2 ? Object.defineProperty(e2, t2, { value: i2, enumerable: true, configurable: true, writable: true }) : e2[t2] = i2, e2;
  }
  function G(e2, t2) {
    if (null == e2)
      return {};
    var i2, n2, r2 = function(e3, t3) {
      if (null == e3)
        return {};
      var i3, n3, r3 = {}, s3 = Object.keys(e3);
      for (n3 = 0; n3 < s3.length; n3++)
        i3 = s3[n3], t3.indexOf(i3) >= 0 || (r3[i3] = e3[i3]);
      return r3;
    }(e2, t2);
    if (Object.getOwnPropertySymbols) {
      var s2 = Object.getOwnPropertySymbols(e2);
      for (n2 = 0; n2 < s2.length; n2++)
        i2 = s2[n2], t2.indexOf(i2) >= 0 || Object.prototype.propertyIsEnumerable.call(e2, i2) && (r2[i2] = e2[i2]);
    }
    return r2;
  }
  _.__PosthogExtensions__ = _.__PosthogExtensions__ || {}, _.__PosthogExtensions__.loadExternalDependency = (e2, t2, i2) => {
    var n2 = "/static/".concat(t2, ".js") + "?v=".concat(e2.version);
    if ("remote-config" === t2 && (n2 = "/array/".concat(e2.config.token, "/config.js")), "toolbar" === t2) {
      var r2 = 3e5, s2 = Math.floor(Date.now() / r2) * r2;
      n2 = "".concat(n2, "&t=").concat(s2);
    }
    var o2 = e2.requestRouter.endpointFor("assets", n2);
    U(e2, o2, i2);
  }, _.__PosthogExtensions__.loadSiteApp = (e2, t2, i2) => {
    var n2 = e2.requestRouter.endpointFor("api", t2);
    U(e2, n2, i2);
  };
  var V = {};
  function J(e2, t2, i2) {
    if (x(e2)) {
      if (r && e2.forEach === r)
        e2.forEach(t2, i2);
      else if ("length" in e2 && e2.length === +e2.length) {
        for (var n2 = 0, s2 = e2.length; n2 < s2; n2++)
          if (n2 in e2 && t2.call(i2, e2[n2], n2) === V)
            return;
      }
    }
  }
  function Y(e2, t2, i2) {
    if (!O(e2)) {
      if (x(e2))
        return J(e2, t2, i2);
      if (A(e2)) {
        for (var n2 of e2.entries())
          if (t2.call(i2, n2[1], n2[0]) === V)
            return;
      } else
        for (var r2 in e2)
          if (E.call(e2, r2) && t2.call(i2, e2[r2], r2) === V)
            return;
    }
  }
  var K = function(e2) {
    for (var t2 = arguments.length, i2 = new Array(t2 > 1 ? t2 - 1 : 0), n2 = 1; n2 < t2; n2++)
      i2[n2 - 1] = arguments[n2];
    return J(i2, function(t3) {
      for (var i3 in t3)
        void 0 !== t3[i3] && (e2[i3] = t3[i3]);
    }), e2;
  };
  function X(e2) {
    for (var t2 = Object.keys(e2), i2 = t2.length, n2 = new Array(i2); i2--; )
      n2[i2] = [t2[i2], e2[t2[i2]]];
    return n2;
  }
  var Q = function(e2) {
    try {
      return e2();
    } catch (e3) {
      return;
    }
  };
  var Z = function(e2) {
    return function() {
      try {
        for (var t2 = arguments.length, i2 = new Array(t2), n2 = 0; n2 < t2; n2++)
          i2[n2] = arguments[n2];
        return e2.apply(this, i2);
      } catch (e3) {
        q.critical("Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A."), q.critical(e3);
      }
    };
  };
  var ee = function(e2) {
    var t2 = {};
    return Y(e2, function(e3, i2) {
      F(e3) && e3.length > 0 && (t2[i2] = e3);
    }), t2;
  };
  function te(e2, t2) {
    return i2 = e2, n2 = (e3) => F(e3) && !$(t2) ? e3.slice(0, t2) : e3, r2 = /* @__PURE__ */ new Set(), function e3(t3, i3) {
      return t3 !== Object(t3) ? n2 ? n2(t3, i3) : t3 : r2.has(t3) ? void 0 : (r2.add(t3), x(t3) ? (s2 = [], J(t3, (t4) => {
        s2.push(e3(t4));
      })) : (s2 = {}, Y(t3, (t4, i4) => {
        r2.has(t4) || (s2[i4] = e3(t4, i4));
      })), s2);
      var s2;
    }(i2);
    var i2, n2, r2;
  }
  var ie = function() {
    function e2(t2) {
      return t2 && (t2.preventDefault = e2.preventDefault, t2.stopPropagation = e2.stopPropagation), t2;
    }
    return e2.preventDefault = function() {
      this.returnValue = false;
    }, e2.stopPropagation = function() {
      this.cancelBubble = true;
    }, function(i2, n2, r2, s2, o2) {
      if (i2)
        if (i2.addEventListener && !s2)
          i2.addEventListener(n2, r2, !!o2);
        else {
          var a2 = "on" + n2, l2 = i2[a2];
          i2[a2] = function(i3, n3, r3) {
            return function(s3) {
              if (s3 = s3 || e2(null == t ? void 0 : t.event)) {
                var o3, a3 = true;
                I(r3) && (o3 = r3(s3));
                var l3 = n3.call(i3, s3);
                return false !== o3 && false !== l3 || (a3 = false), a3;
              }
            };
          }(i2, r2, l2);
        }
      else
        q.error("No valid element provided to register_event");
    };
  }();
  function ne(e2, t2) {
    for (var i2 = 0; i2 < e2.length; i2++)
      if (t2(e2[i2]))
        return e2[i2];
  }
  var re = "$people_distinct_id";
  var se = "__alias";
  var oe = "__timers";
  var ae = "$autocapture_disabled_server_side";
  var le = "$heatmaps_enabled_server_side";
  var ue = "$exception_capture_enabled_server_side";
  var ce = "$web_vitals_enabled_server_side";
  var de = "$dead_clicks_enabled_server_side";
  var he = "$web_vitals_allowed_metrics";
  var _e = "$session_recording_enabled_server_side";
  var pe = "$console_log_recording_enabled_server_side";
  var ve = "$session_recording_network_payload_capture";
  var ge = "$session_recording_canvas_recording";
  var fe = "$replay_sample_rate";
  var me = "$replay_minimum_duration";
  var be = "$replay_script_config";
  var ye = "$sesid";
  var we = "$session_is_sampled";
  var Se = "$session_recording_url_trigger_activated_session";
  var Ee = "$session_recording_event_trigger_activated_session";
  var ke = "$enabled_feature_flags";
  var xe = "$early_access_features";
  var Ie = "$stored_person_properties";
  var Ce = "$stored_group_properties";
  var Pe = "$surveys";
  var Re = "$surveys_activated";
  var Fe = "$flag_call_reported";
  var Te = "$user_state";
  var $e = "$client_session_props";
  var Oe = "$capture_rate_limit";
  var Le = "$initial_campaign_params";
  var Me = "$initial_referrer_info";
  var Ae = "$initial_person_info";
  var De = "$epp";
  var Ne = "__POSTHOG_TOOLBAR__";
  var qe = "$posthog_cklsh";
  var Be = [re, se, "__cmpns", oe, _e, le, ye, ke, Te, xe, Ce, Ie, Pe, Fe, $e, Oe, Le, Me, De];
  var He = B("[FeatureFlags]");
  var Ue = "$active_feature_flags";
  var ze = "$override_feature_flags";
  var je = "$feature_flag_payloads";
  var We = (e2) => {
    var t2 = {};
    for (var [i2, n2] of X(e2 || {}))
      n2 && (t2[i2] = n2);
    return t2;
  };
  var Ge = class {
    constructor(e2) {
      W(this, "_override_warning", false), W(this, "_hasLoadedFlags", false), W(this, "_requestInFlight", false), W(this, "_reloadingDisabled", false), W(this, "_additionalReloadRequested", false), W(this, "_decideCalled", false), W(this, "_flagsLoadedFromRemote", false), this.instance = e2, this.featureFlagEventHandlers = [];
    }
    decide() {
      if (this.instance.config.__preview_remote_config)
        this._decideCalled = true;
      else {
        var e2 = !this._reloadDebouncer && (this.instance.config.advanced_disable_feature_flags || this.instance.config.advanced_disable_feature_flags_on_first_load);
        this._callDecideEndpoint({ disableFlags: e2 });
      }
    }
    get hasLoadedFlags() {
      return this._hasLoadedFlags;
    }
    getFlags() {
      return Object.keys(this.getFlagVariants());
    }
    getFlagVariants() {
      var e2 = this.instance.get_property(ke), t2 = this.instance.get_property(ze);
      if (!t2)
        return e2 || {};
      for (var i2 = K({}, e2), n2 = Object.keys(t2), r2 = 0; r2 < n2.length; r2++)
        i2[n2[r2]] = t2[n2[r2]];
      return this._override_warning || (He.warn(" Overriding feature flags!", { enabledFlags: e2, overriddenFlags: t2, finalFlags: i2 }), this._override_warning = true), i2;
    }
    getFlagPayloads() {
      return this.instance.get_property(je) || {};
    }
    reloadFeatureFlags() {
      this._reloadingDisabled || this.instance.config.advanced_disable_feature_flags || this._reloadDebouncer || (this._reloadDebouncer = setTimeout(() => {
        this._callDecideEndpoint();
      }, 5));
    }
    clearDebouncer() {
      clearTimeout(this._reloadDebouncer), this._reloadDebouncer = void 0;
    }
    ensureFlagsLoaded() {
      this._hasLoadedFlags || this._requestInFlight || this._reloadDebouncer || this.reloadFeatureFlags();
    }
    setAnonymousDistinctId(e2) {
      this.$anon_distinct_id = e2;
    }
    setReloadingPaused(e2) {
      this._reloadingDisabled = e2;
    }
    _callDecideEndpoint(t2) {
      if (this.clearDebouncer(), !this.instance.config.advanced_disable_decide)
        if (this._requestInFlight)
          this._additionalReloadRequested = true;
        else {
          var i2 = { token: this.instance.config.token, distinct_id: this.instance.get_distinct_id(), groups: this.instance.getGroups(), $anon_distinct_id: this.$anon_distinct_id, person_properties: this.instance.get_property(Ie), group_properties: this.instance.get_property(Ce) };
          (null != t2 && t2.disableFlags || this.instance.config.advanced_disable_feature_flags) && (i2.disable_flags = true), this._requestInFlight = true, this.instance._send_request({ method: "POST", url: this.instance.requestRouter.endpointFor("api", "/decide/?v=3"), data: i2, compression: this.instance.config.disable_compression ? void 0 : e.Base64, timeout: this.instance.config.feature_flag_request_timeout_ms, callback: (e2) => {
            var t3, n2, r2 = true;
            (200 === e2.statusCode && (this.$anon_distinct_id = void 0, r2 = false), this._requestInFlight = false, this._decideCalled) || (this._decideCalled = true, this.instance._onRemoteConfig(null !== (n2 = e2.json) && void 0 !== n2 ? n2 : {}));
            i2.disable_flags || (this._flagsLoadedFromRemote = !r2, this.receivedFeatureFlags(null !== (t3 = e2.json) && void 0 !== t3 ? t3 : {}, r2), this._additionalReloadRequested && (this._additionalReloadRequested = false, this._callDecideEndpoint()));
          } });
        }
    }
    getFeatureFlag(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      if (this._hasLoadedFlags || this.getFlags() && this.getFlags().length > 0) {
        var i2, n2, r2, s2, o2, a2 = this.getFlagVariants()[e2], l2 = "".concat(a2), u2 = this.instance.get_property(Fe) || {};
        if (t2.send_event || !("send_event" in t2)) {
          if (!(e2 in u2) || !u2[e2].includes(l2))
            x(u2[e2]) ? u2[e2].push(l2) : u2[e2] = [l2], null === (i2 = this.instance.persistence) || void 0 === i2 || i2.register({ [Fe]: u2 }), this.instance.capture("$feature_flag_called", { $feature_flag: e2, $feature_flag_response: a2, $feature_flag_payload: this.getFeatureFlagPayload(e2) || null, $feature_flag_bootstrapped_response: (null === (n2 = this.instance.config.bootstrap) || void 0 === n2 || null === (r2 = n2.featureFlags) || void 0 === r2 ? void 0 : r2[e2]) || null, $feature_flag_bootstrapped_payload: (null === (s2 = this.instance.config.bootstrap) || void 0 === s2 || null === (o2 = s2.featureFlagPayloads) || void 0 === o2 ? void 0 : o2[e2]) || null, $used_bootstrap_value: !this._flagsLoadedFromRemote });
        }
        return a2;
      }
      He.warn('getFeatureFlag for key "' + e2 + `" failed. Feature flags didn't load in time.`);
    }
    getFeatureFlagPayload(e2) {
      return this.getFlagPayloads()[e2];
    }
    isFeatureEnabled(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      if (this._hasLoadedFlags || this.getFlags() && this.getFlags().length > 0)
        return !!this.getFeatureFlag(e2, t2);
      He.warn('isFeatureEnabled for key "' + e2 + `" failed. Feature flags didn't load in time.`);
    }
    addFeatureFlagsHandler(e2) {
      this.featureFlagEventHandlers.push(e2);
    }
    removeFeatureFlagsHandler(e2) {
      this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter((t2) => t2 !== e2);
    }
    receivedFeatureFlags(e2, t2) {
      if (this.instance.persistence) {
        this._hasLoadedFlags = true;
        var i2 = this.getFlagVariants(), n2 = this.getFlagPayloads();
        !function(e3, t3) {
          var i3 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}, n3 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {}, r2 = e3.featureFlags, s2 = e3.featureFlagPayloads;
          if (r2)
            if (x(r2)) {
              var o2 = {};
              if (r2)
                for (var a2 = 0; a2 < r2.length; a2++)
                  o2[r2[a2]] = true;
              t3 && t3.register({ [Ue]: r2, [ke]: o2 });
            } else {
              var l2 = r2, u2 = s2;
              e3.errorsWhileComputingFlags && (l2 = j(j({}, i3), l2), u2 = j(j({}, n3), u2)), t3 && t3.register({ [Ue]: Object.keys(We(l2)), [ke]: l2 || {}, [je]: u2 || {} });
            }
        }(e2, this.instance.persistence, i2, n2), this._fireFeatureFlagsCallbacks(t2);
      }
    }
    override(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
      if (!this.instance.__loaded || !this.instance.persistence)
        return He.uninitializedWarning("posthog.feature_flags.override");
      if (this._override_warning = t2, false === e2)
        this.instance.persistence.unregister(ze);
      else if (x(e2)) {
        for (var i2 = {}, n2 = 0; n2 < e2.length; n2++)
          i2[e2[n2]] = true;
        this.instance.persistence.register({ [ze]: i2 });
      } else
        this.instance.persistence.register({ [ze]: e2 });
    }
    onFeatureFlags(e2) {
      if (this.addFeatureFlagsHandler(e2), this._hasLoadedFlags) {
        var { flags: t2, flagVariants: i2 } = this._prepareFeatureFlagsForCallbacks();
        e2(t2, i2);
      }
      return () => this.removeFeatureFlagsHandler(e2);
    }
    updateEarlyAccessFeatureEnrollment(e2, t2) {
      var i2, n2 = (this.instance.get_property(xe) || []).find((t3) => t3.flagKey === e2), r2 = { ["$feature_enrollment/".concat(e2)]: t2 }, s2 = { $feature_flag: e2, $feature_enrollment: t2, $set: r2 };
      n2 && (s2.$early_access_feature_name = n2.name), this.instance.capture("$feature_enrollment_update", s2), this.setPersonPropertiesForFlags(r2, false);
      var o2 = j(j({}, this.getFlagVariants()), {}, { [e2]: t2 });
      null === (i2 = this.instance.persistence) || void 0 === i2 || i2.register({ [Ue]: Object.keys(We(o2)), [ke]: o2 }), this._fireFeatureFlagsCallbacks();
    }
    getEarlyAccessFeatures(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], i2 = this.instance.get_property(xe);
      if (i2 && !t2)
        return e2(i2);
      this.instance._send_request({ url: this.instance.requestRouter.endpointFor("api", "/api/early_access_features/?token=".concat(this.instance.config.token)), method: "GET", callback: (t3) => {
        var i3;
        if (t3.json) {
          var n2 = t3.json.earlyAccessFeatures;
          return null === (i3 = this.instance.persistence) || void 0 === i3 || i3.register({ [xe]: n2 }), e2(n2);
        }
      } });
    }
    _prepareFeatureFlagsForCallbacks() {
      var e2 = this.getFlags(), t2 = this.getFlagVariants();
      return { flags: e2.filter((e3) => t2[e3]), flagVariants: Object.keys(t2).filter((e3) => t2[e3]).reduce((e3, i2) => (e3[i2] = t2[i2], e3), {}) };
    }
    _fireFeatureFlagsCallbacks(e2) {
      var { flags: t2, flagVariants: i2 } = this._prepareFeatureFlagsForCallbacks();
      this.featureFlagEventHandlers.forEach((n2) => n2(t2, i2, { errorsLoading: e2 }));
    }
    setPersonPropertiesForFlags(e2) {
      var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1], i2 = this.instance.get_property(Ie) || {};
      this.instance.register({ [Ie]: j(j({}, i2), e2) }), t2 && this.instance.reloadFeatureFlags();
    }
    resetPersonPropertiesForFlags() {
      this.instance.unregister(Ie);
    }
    setGroupPropertiesForFlags(e2) {
      var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1], i2 = this.instance.get_property(Ce) || {};
      0 !== Object.keys(i2).length && Object.keys(i2).forEach((t3) => {
        i2[t3] = j(j({}, i2[t3]), e2[t3]), delete e2[t3];
      }), this.instance.register({ [Ce]: j(j({}, i2), e2) }), t2 && this.instance.reloadFeatureFlags();
    }
    resetGroupPropertiesForFlags(e2) {
      if (e2) {
        var t2 = this.instance.get_property(Ce) || {};
        this.instance.register({ [Ce]: j(j({}, t2), {}, { [e2]: {} }) });
      } else
        this.instance.unregister(Ce);
    }
  };
  Math.trunc || (Math.trunc = function(e2) {
    return e2 < 0 ? Math.ceil(e2) : Math.floor(e2);
  }), Number.isInteger || (Number.isInteger = function(e2) {
    return L(e2) && isFinite(e2) && Math.floor(e2) === e2;
  });
  var Ve = "0123456789abcdef";
  var Je = class {
    constructor(e2) {
      if (this.bytes = e2, 16 !== e2.length)
        throw new TypeError("not 128-bit length");
    }
    static fromFieldsV7(e2, t2, i2, n2) {
      if (!Number.isInteger(e2) || !Number.isInteger(t2) || !Number.isInteger(i2) || !Number.isInteger(n2) || e2 < 0 || t2 < 0 || i2 < 0 || n2 < 0 || e2 > 281474976710655 || t2 > 4095 || i2 > 1073741823 || n2 > 4294967295)
        throw new RangeError("invalid field value");
      var r2 = new Uint8Array(16);
      return r2[0] = e2 / Math.pow(2, 40), r2[1] = e2 / Math.pow(2, 32), r2[2] = e2 / Math.pow(2, 24), r2[3] = e2 / Math.pow(2, 16), r2[4] = e2 / Math.pow(2, 8), r2[5] = e2, r2[6] = 112 | t2 >>> 8, r2[7] = t2, r2[8] = 128 | i2 >>> 24, r2[9] = i2 >>> 16, r2[10] = i2 >>> 8, r2[11] = i2, r2[12] = n2 >>> 24, r2[13] = n2 >>> 16, r2[14] = n2 >>> 8, r2[15] = n2, new Je(r2);
    }
    toString() {
      for (var e2 = "", t2 = 0; t2 < this.bytes.length; t2++)
        e2 = e2 + Ve.charAt(this.bytes[t2] >>> 4) + Ve.charAt(15 & this.bytes[t2]), 3 !== t2 && 5 !== t2 && 7 !== t2 && 9 !== t2 || (e2 += "-");
      if (36 !== e2.length)
        throw new Error("Invalid UUIDv7 was generated");
      return e2;
    }
    clone() {
      return new Je(this.bytes.slice(0));
    }
    equals(e2) {
      return 0 === this.compareTo(e2);
    }
    compareTo(e2) {
      for (var t2 = 0; t2 < 16; t2++) {
        var i2 = this.bytes[t2] - e2.bytes[t2];
        if (0 !== i2)
          return Math.sign(i2);
      }
      return 0;
    }
  };
  var Ye = class {
    constructor() {
      W(this, "timestamp", 0), W(this, "counter", 0), W(this, "random", new Qe());
    }
    generate() {
      var e2 = this.generateOrAbort();
      if (R(e2)) {
        this.timestamp = 0;
        var t2 = this.generateOrAbort();
        if (R(t2))
          throw new Error("Could not generate UUID after timestamp reset");
        return t2;
      }
      return e2;
    }
    generateOrAbort() {
      var e2 = Date.now();
      if (e2 > this.timestamp)
        this.timestamp = e2, this.resetCounter();
      else {
        if (!(e2 + 1e4 > this.timestamp))
          return;
        this.counter++, this.counter > 4398046511103 && (this.timestamp++, this.resetCounter());
      }
      return Je.fromFieldsV7(this.timestamp, Math.trunc(this.counter / Math.pow(2, 30)), this.counter & Math.pow(2, 30) - 1, this.random.nextUint32());
    }
    resetCounter() {
      this.counter = 1024 * this.random.nextUint32() + (1023 & this.random.nextUint32());
    }
  };
  var Ke;
  var Xe = (e2) => {
    if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG)
      throw new Error("no cryptographically strong RNG available");
    for (var t2 = 0; t2 < e2.length; t2++)
      e2[t2] = 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random());
    return e2;
  };
  t && !R(t.crypto) && crypto.getRandomValues && (Xe = (e2) => crypto.getRandomValues(e2));
  var Qe = class {
    constructor() {
      W(this, "buffer", new Uint32Array(8)), W(this, "cursor", 1 / 0);
    }
    nextUint32() {
      return this.cursor >= this.buffer.length && (Xe(this.buffer), this.cursor = 0), this.buffer[this.cursor++];
    }
  };
  var Ze = () => et().toString();
  var et = () => (Ke || (Ke = new Ye())).generate();
  var tt = "Thu, 01 Jan 1970 00:00:00 GMT";
  var it = "";
  var nt = /[a-z0-9][a-z0-9-]+\.[a-z]{2,}$/i;
  function rt(e2, t2) {
    if (t2) {
      var i2 = function(e3) {
        var t3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : a;
        if (it)
          return it;
        if (!t3)
          return "";
        if (["localhost", "127.0.0.1"].includes(e3))
          return "";
        for (var i3 = e3.split("."), n3 = Math.min(i3.length, 8), r2 = "dmn_chk_" + Ze(), s2 = new RegExp("(^|;)\\s*" + r2 + "=1"); !it && n3--; ) {
          var o2 = i3.slice(n3).join("."), l2 = r2 + "=1;domain=." + o2;
          t3.cookie = l2, s2.test(t3.cookie) && (t3.cookie = l2 + ";expires=" + tt, it = o2);
        }
        return it;
      }(e2);
      if (!i2) {
        var n2 = ((e3) => {
          var t3 = e3.match(nt);
          return t3 ? t3[0] : "";
        })(e2);
        n2 !== i2 && q.info("Warning: cookie subdomain discovery mismatch", n2, i2), i2 = n2;
      }
      return i2 ? "; domain=." + i2 : "";
    }
    return "";
  }
  var st = { is_supported: () => !!a, error: function(e2) {
    q.error("cookieStore error: " + e2);
  }, get: function(e2) {
    if (a) {
      try {
        for (var t2 = e2 + "=", i2 = a.cookie.split(";").filter((e3) => e3.length), n2 = 0; n2 < i2.length; n2++) {
          for (var r2 = i2[n2]; " " == r2.charAt(0); )
            r2 = r2.substring(1, r2.length);
          if (0 === r2.indexOf(t2))
            return decodeURIComponent(r2.substring(t2.length, r2.length));
        }
      } catch (e3) {
      }
      return null;
    }
  }, parse: function(e2) {
    var t2;
    try {
      t2 = JSON.parse(st.get(e2)) || {};
    } catch (e3) {
    }
    return t2;
  }, set: function(e2, t2, i2, n2, r2) {
    if (a)
      try {
        var s2 = "", o2 = "", l2 = rt(a.location.hostname, n2);
        if (i2) {
          var u2 = new Date();
          u2.setTime(u2.getTime() + 24 * i2 * 60 * 60 * 1e3), s2 = "; expires=" + u2.toUTCString();
        }
        r2 && (o2 = "; secure");
        var c2 = e2 + "=" + encodeURIComponent(JSON.stringify(t2)) + s2 + "; SameSite=Lax; path=/" + l2 + o2;
        return c2.length > 3686.4 && q.warn("cookieStore warning: large cookie, len=" + c2.length), a.cookie = c2, c2;
      } catch (e3) {
        return;
      }
  }, remove: function(e2, t2) {
    try {
      st.set(e2, "", -1, t2);
    } catch (e3) {
      return;
    }
  } };
  var ot = null;
  var at = { is_supported: function() {
    if (!$(ot))
      return ot;
    var e2 = true;
    if (R(t))
      e2 = false;
    else
      try {
        var i2 = "__mplssupport__";
        at.set(i2, "xyz"), '"xyz"' !== at.get(i2) && (e2 = false), at.remove(i2);
      } catch (t2) {
        e2 = false;
      }
    return e2 || q.error("localStorage unsupported; falling back to cookie store"), ot = e2, e2;
  }, error: function(e2) {
    q.error("localStorage error: " + e2);
  }, get: function(e2) {
    try {
      return null == t ? void 0 : t.localStorage.getItem(e2);
    } catch (e3) {
      at.error(e3);
    }
    return null;
  }, parse: function(e2) {
    try {
      return JSON.parse(at.get(e2)) || {};
    } catch (e3) {
    }
    return null;
  }, set: function(e2, i2) {
    try {
      null == t || t.localStorage.setItem(e2, JSON.stringify(i2));
    } catch (e3) {
      at.error(e3);
    }
  }, remove: function(e2) {
    try {
      null == t || t.localStorage.removeItem(e2);
    } catch (e3) {
      at.error(e3);
    }
  } };
  var lt = ["distinct_id", ye, we, De, Ae];
  var ut = j(j({}, at), {}, { parse: function(e2) {
    try {
      var t2 = {};
      try {
        t2 = st.parse(e2) || {};
      } catch (e3) {
      }
      var i2 = K(t2, JSON.parse(at.get(e2) || "{}"));
      return at.set(e2, i2), i2;
    } catch (e3) {
    }
    return null;
  }, set: function(e2, t2, i2, n2, r2, s2) {
    try {
      at.set(e2, t2, void 0, void 0, s2);
      var o2 = {};
      lt.forEach((e3) => {
        t2[e3] && (o2[e3] = t2[e3]);
      }), Object.keys(o2).length && st.set(e2, o2, i2, n2, r2, s2);
    } catch (e3) {
      at.error(e3);
    }
  }, remove: function(e2, i2) {
    try {
      null == t || t.localStorage.removeItem(e2), st.remove(e2, i2);
    } catch (e3) {
      at.error(e3);
    }
  } });
  var ct = {};
  var dt = { is_supported: function() {
    return true;
  }, error: function(e2) {
    q.error("memoryStorage error: " + e2);
  }, get: function(e2) {
    return ct[e2] || null;
  }, parse: function(e2) {
    return ct[e2] || null;
  }, set: function(e2, t2) {
    ct[e2] = t2;
  }, remove: function(e2) {
    delete ct[e2];
  } };
  var ht = null;
  var _t = { is_supported: function() {
    if (!$(ht))
      return ht;
    if (ht = true, R(t))
      ht = false;
    else
      try {
        var e2 = "__support__";
        _t.set(e2, "xyz"), '"xyz"' !== _t.get(e2) && (ht = false), _t.remove(e2);
      } catch (e3) {
        ht = false;
      }
    return ht;
  }, error: function(e2) {
    q.error("sessionStorage error: ", e2);
  }, get: function(e2) {
    try {
      return null == t ? void 0 : t.sessionStorage.getItem(e2);
    } catch (e3) {
      _t.error(e3);
    }
    return null;
  }, parse: function(e2) {
    try {
      return JSON.parse(_t.get(e2)) || null;
    } catch (e3) {
    }
    return null;
  }, set: function(e2, i2) {
    try {
      null == t || t.sessionStorage.setItem(e2, JSON.stringify(i2));
    } catch (e3) {
      _t.error(e3);
    }
  }, remove: function(e2) {
    try {
      null == t || t.sessionStorage.removeItem(e2);
    } catch (e3) {
      _t.error(e3);
    }
  } };
  var pt = ["localhost", "127.0.0.1"];
  var vt = (e2) => {
    var t2 = null == a ? void 0 : a.createElement("a");
    return R(t2) ? null : (t2.href = e2, t2);
  };
  var gt = function(e2, t2) {
    return !!function(e3) {
      try {
        new RegExp(e3);
      } catch (e4) {
        return false;
      }
      return true;
    }(t2) && new RegExp(t2).test(e2);
  };
  var ft = function(e2) {
    var t2, i2, n2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "&", r2 = [];
    return Y(e2, function(e3, n3) {
      R(e3) || R(n3) || "undefined" === n3 || (t2 = encodeURIComponent(((e4) => e4 instanceof File)(e3) ? e3.name : e3.toString()), i2 = encodeURIComponent(n3), r2[r2.length] = i2 + "=" + t2);
    }), r2.join(n2);
  };
  var mt = function(e2, t2) {
    for (var i2, n2 = ((e2.split("#")[0] || "").split("?")[1] || "").split("&"), r2 = 0; r2 < n2.length; r2++) {
      var s2 = n2[r2].split("=");
      if (s2[0] === t2) {
        i2 = s2;
        break;
      }
    }
    if (!x(i2) || i2.length < 2)
      return "";
    var o2 = i2[1];
    try {
      o2 = decodeURIComponent(o2);
    } catch (e3) {
      q.error("Skipping decoding for malformed query param: " + o2);
    }
    return o2.replace(/\+/g, " ");
  };
  var bt = function(e2, t2) {
    var i2 = e2.match(new RegExp(t2 + "=([^&]*)"));
    return i2 ? i2[1] : null;
  };
  var yt = "Mobile";
  var wt = "iOS";
  var St = "Android";
  var Et = "Tablet";
  var kt = St + " " + Et;
  var xt = "iPad";
  var It = "Apple";
  var Ct = It + " Watch";
  var Pt = "Safari";
  var Rt = "BlackBerry";
  var Ft = "Samsung";
  var Tt = Ft + "Browser";
  var $t = Ft + " Internet";
  var Ot = "Chrome";
  var Lt = Ot + " OS";
  var Mt = Ot + " " + wt;
  var At = "Internet Explorer";
  var Dt = At + " " + yt;
  var Nt = "Opera";
  var qt = Nt + " Mini";
  var Bt = "Edge";
  var Ht = "Microsoft " + Bt;
  var Ut = "Firefox";
  var zt = Ut + " " + wt;
  var jt = "Nintendo";
  var Wt = "PlayStation";
  var Gt = "Xbox";
  var Vt = St + " " + yt;
  var Jt = yt + " " + Pt;
  var Yt = "Windows";
  var Kt = Yt + " Phone";
  var Xt = "Nokia";
  var Qt = "Ouya";
  var Zt = "Generic";
  var ei = Zt + " " + yt.toLowerCase();
  var ti = Zt + " " + Et.toLowerCase();
  var ii = "Konqueror";
  var ni = "(\\d+(\\.\\d+)?)";
  var ri = new RegExp("Version/" + ni);
  var si = new RegExp(Gt, "i");
  var oi = new RegExp(Wt + " \\w+", "i");
  var ai = new RegExp(jt + " \\w+", "i");
  var li = new RegExp(Rt + "|PlayBook|BB10", "i");
  var ui = { "NT3.51": "NT 3.11", "NT4.0": "NT 4.0", "5.0": "2000", 5.1: "XP", 5.2: "XP", "6.0": "Vista", 6.1: "7", 6.2: "8", 6.3: "8.1", 6.4: "10", "10.0": "10" };
  var ci = (e2, t2) => t2 && m(t2, It) || function(e3) {
    return m(e3, Pt) && !m(e3, Ot) && !m(e3, St);
  }(e2);
  var di = function(e2, t2) {
    return t2 = t2 || "", m(e2, " OPR/") && m(e2, "Mini") ? qt : m(e2, " OPR/") ? Nt : li.test(e2) ? Rt : m(e2, "IE" + yt) || m(e2, "WPDesktop") ? Dt : m(e2, Tt) ? $t : m(e2, Bt) || m(e2, "Edg/") ? Ht : m(e2, "FBIOS") ? "Facebook " + yt : m(e2, "UCWEB") || m(e2, "UCBrowser") ? "UC Browser" : m(e2, "CriOS") ? Mt : m(e2, "CrMo") || m(e2, Ot) ? Ot : m(e2, St) && m(e2, Pt) ? Vt : m(e2, "FxiOS") ? zt : m(e2.toLowerCase(), ii.toLowerCase()) ? ii : ci(e2, t2) ? m(e2, yt) ? Jt : Pt : m(e2, Ut) ? Ut : m(e2, "MSIE") || m(e2, "Trident/") ? At : m(e2, "Gecko") ? Ut : "";
  };
  var hi = { [Dt]: [new RegExp("rv:" + ni)], [Ht]: [new RegExp(Bt + "?\\/" + ni)], [Ot]: [new RegExp("(" + Ot + "|CrMo)\\/" + ni)], [Mt]: [new RegExp("CriOS\\/" + ni)], "UC Browser": [new RegExp("(UCBrowser|UCWEB)\\/" + ni)], [Pt]: [ri], [Jt]: [ri], [Nt]: [new RegExp("(Opera|OPR)\\/" + ni)], [Ut]: [new RegExp(Ut + "\\/" + ni)], [zt]: [new RegExp("FxiOS\\/" + ni)], [ii]: [new RegExp("Konqueror[:/]?" + ni, "i")], [Rt]: [new RegExp(Rt + " " + ni), ri], [Vt]: [new RegExp("android\\s" + ni, "i")], [$t]: [new RegExp(Tt + "\\/" + ni)], [At]: [new RegExp("(rv:|MSIE )" + ni)], Mozilla: [new RegExp("rv:" + ni)] };
  var _i = [[new RegExp(Gt + "; " + Gt + " (.*?)[);]", "i"), (e2) => [Gt, e2 && e2[1] || ""]], [new RegExp(jt, "i"), [jt, ""]], [new RegExp(Wt, "i"), [Wt, ""]], [li, [Rt, ""]], [new RegExp(Yt, "i"), (e2, t2) => {
    if (/Phone/.test(t2) || /WPDesktop/.test(t2))
      return [Kt, ""];
    if (new RegExp(yt).test(t2) && !/IEMobile\b/.test(t2))
      return [Yt + " " + yt, ""];
    var i2 = /Windows NT ([0-9.]+)/i.exec(t2);
    if (i2 && i2[1]) {
      var n2 = i2[1], r2 = ui[n2] || "";
      return /arm/i.test(t2) && (r2 = "RT"), [Yt, r2];
    }
    return [Yt, ""];
  }], [/((iPhone|iPad|iPod).*?OS (\d+)_(\d+)_?(\d+)?|iPhone)/, (e2) => {
    if (e2 && e2[3]) {
      var t2 = [e2[3], e2[4], e2[5] || "0"];
      return [wt, t2.join(".")];
    }
    return [wt, ""];
  }], [/(watch.*\/(\d+\.\d+\.\d+)|watch os,(\d+\.\d+),)/i, (e2) => {
    var t2 = "";
    return e2 && e2.length >= 3 && (t2 = R(e2[2]) ? e2[3] : e2[2]), ["watchOS", t2];
  }], [new RegExp("(" + St + " (\\d+)\\.(\\d+)\\.?(\\d+)?|" + St + ")", "i"), (e2) => {
    if (e2 && e2[2]) {
      var t2 = [e2[2], e2[3], e2[4] || "0"];
      return [St, t2.join(".")];
    }
    return [St, ""];
  }], [/Mac OS X (\d+)[_.](\d+)[_.]?(\d+)?/i, (e2) => {
    var t2 = ["Mac OS X", ""];
    if (e2 && e2[1]) {
      var i2 = [e2[1], e2[2], e2[3] || "0"];
      t2[1] = i2.join(".");
    }
    return t2;
  }], [/Mac/i, ["Mac OS X", ""]], [/CrOS/, [Lt, ""]], [/Linux|debian/i, ["Linux", ""]]];
  var pi = function(e2) {
    return ai.test(e2) ? jt : oi.test(e2) ? Wt : si.test(e2) ? Gt : new RegExp(Qt, "i").test(e2) ? Qt : new RegExp("(" + Kt + "|WPDesktop)", "i").test(e2) ? Kt : /iPad/.test(e2) ? xt : /iPod/.test(e2) ? "iPod Touch" : /iPhone/.test(e2) ? "iPhone" : /(watch)(?: ?os[,/]|\d,\d\/)[\d.]+/i.test(e2) ? Ct : li.test(e2) ? Rt : /(kobo)\s(ereader|touch)/i.test(e2) ? "Kobo" : new RegExp(Xt, "i").test(e2) ? Xt : /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i.test(e2) || /(kf[a-z]+)( bui|\)).+silk\//i.test(e2) ? "Kindle Fire" : /(Android|ZTE)/i.test(e2) ? !new RegExp(yt).test(e2) || /(9138B|TB782B|Nexus [97]|pixel c|HUAWEISHT|BTV|noble nook|smart ultra 6)/i.test(e2) ? /pixel[\daxl ]{1,6}/i.test(e2) && !/pixel c/i.test(e2) || /(huaweimed-al00|tah-|APA|SM-G92|i980|zte|U304AA)/i.test(e2) || /lmy47v/i.test(e2) && !/QTAQZ3/i.test(e2) ? St : kt : St : new RegExp("(pda|" + yt + ")", "i").test(e2) ? ei : new RegExp(Et, "i").test(e2) && !new RegExp(Et + " pc", "i").test(e2) ? ti : "";
  };
  var vi = "https?://(.*)";
  var gi = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gad_source", "gclsrc", "dclid", "gbraid", "wbraid", "fbclid", "msclkid", "twclid", "li_fat_id", "mc_cid", "igshid", "ttclid", "rdt_cid"];
  var fi = { campaignParams: function(e2) {
    return a ? this._campaignParamsFromUrl(a.URL, e2) : {};
  }, _campaignParamsFromUrl: function(e2, t2) {
    var i2 = gi.concat(t2 || []), n2 = {};
    return Y(i2, function(t3) {
      var i3 = mt(e2, t3);
      n2[t3] = i3 || null;
    }), n2;
  }, _searchEngine: function(e2) {
    return e2 ? 0 === e2.search(vi + "google.([^/?]*)") ? "google" : 0 === e2.search(vi + "bing.com") ? "bing" : 0 === e2.search(vi + "yahoo.com") ? "yahoo" : 0 === e2.search(vi + "duckduckgo.com") ? "duckduckgo" : null : null;
  }, _searchInfoFromReferrer: function(e2) {
    var t2 = fi._searchEngine(e2), i2 = "yahoo" != t2 ? "q" : "p", n2 = {};
    if (!$(t2)) {
      n2.$search_engine = t2;
      var r2 = a ? mt(a.referrer, i2) : "";
      r2.length && (n2.ph_keyword = r2);
    }
    return n2;
  }, searchInfo: function() {
    var e2 = null == a ? void 0 : a.referrer;
    return e2 ? this._searchInfoFromReferrer(e2) : {};
  }, browser: di, browserVersion: function(e2, t2) {
    var i2 = di(e2, t2), n2 = hi[i2];
    if (R(n2))
      return null;
    for (var r2 = 0; r2 < n2.length; r2++) {
      var s2 = n2[r2], o2 = e2.match(s2);
      if (o2)
        return parseFloat(o2[o2.length - 2]);
    }
    return null;
  }, browserLanguage: function() {
    return navigator.language || navigator.userLanguage;
  }, browserLanguagePrefix: function() {
    var e2 = this.browserLanguage();
    return "string" == typeof e2 ? e2.split("-")[0] : void 0;
  }, os: function(e2) {
    for (var t2 = 0; t2 < _i.length; t2++) {
      var [i2, n2] = _i[t2], r2 = i2.exec(e2), s2 = r2 && (I(n2) ? n2(r2, e2) : n2);
      if (s2)
        return s2;
    }
    return ["", ""];
  }, device: pi, deviceType: function(e2) {
    var t2 = pi(e2);
    return t2 === xt || t2 === kt || "Kobo" === t2 || "Kindle Fire" === t2 || t2 === ti ? Et : t2 === jt || t2 === Gt || t2 === Wt || t2 === Qt ? "Console" : t2 === Ct ? "Wearable" : t2 ? yt : "Desktop";
  }, referrer: function() {
    return (null == a ? void 0 : a.referrer) || "$direct";
  }, referringDomain: function() {
    var e2;
    return null != a && a.referrer && (null === (e2 = vt(a.referrer)) || void 0 === e2 ? void 0 : e2.host) || "$direct";
  }, referrerInfo: function() {
    return { $referrer: this.referrer(), $referring_domain: this.referringDomain() };
  }, initialPersonInfo: function() {
    return { r: this.referrer().substring(0, 1e3), u: null == l ? void 0 : l.href.substring(0, 1e3) };
  }, initialPersonPropsFromInfo: function(e2) {
    var t2, { r: i2, u: n2 } = e2, r2 = { $initial_referrer: i2, $initial_referring_domain: null == i2 ? void 0 : "$direct" == i2 ? "$direct" : null === (t2 = vt(i2)) || void 0 === t2 ? void 0 : t2.host };
    if (n2) {
      r2.$initial_current_url = n2;
      var s2 = vt(n2);
      r2.$initial_host = null == s2 ? void 0 : s2.host, r2.$initial_pathname = null == s2 ? void 0 : s2.pathname, Y(this._campaignParamsFromUrl(n2), function(e3, t3) {
        r2["$initial_" + y(t3)] = e3;
      });
    }
    i2 && Y(this._searchInfoFromReferrer(i2), function(e3, t3) {
      r2["$initial_" + y(t3)] = e3;
    });
    return r2;
  }, timezone: function() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e2) {
      return;
    }
  }, timezoneOffset: function() {
    try {
      return new Date().getTimezoneOffset();
    } catch (e2) {
      return;
    }
  }, properties: function() {
    if (!h)
      return {};
    var [e2, i2] = fi.os(h);
    return K(ee({ $os: e2, $os_version: i2, $browser: fi.browser(h, navigator.vendor), $device: fi.device(h), $device_type: fi.deviceType(h), $timezone: fi.timezone(), $timezone_offset: fi.timezoneOffset() }), { $current_url: null == l ? void 0 : l.href, $host: null == l ? void 0 : l.host, $pathname: null == l ? void 0 : l.pathname, $raw_user_agent: h.length > 1e3 ? h.substring(0, 997) + "..." : h, $browser_version: fi.browserVersion(h, navigator.vendor), $browser_language: fi.browserLanguage(), $browser_language_prefix: fi.browserLanguagePrefix(), $screen_height: null == t ? void 0 : t.screen.height, $screen_width: null == t ? void 0 : t.screen.width, $viewport_height: null == t ? void 0 : t.innerHeight, $viewport_width: null == t ? void 0 : t.innerWidth, $lib: "web", $lib_version: p.LIB_VERSION, $insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10), $time: Date.now() / 1e3 });
  }, people_properties: function() {
    if (!h)
      return {};
    var [e2, t2] = fi.os(h);
    return K(ee({ $os: e2, $os_version: t2, $browser: fi.browser(h, navigator.vendor) }), { $browser_version: fi.browserVersion(h, navigator.vendor) });
  } };
  var mi = ["cookie", "localstorage", "localstorage+cookie", "sessionstorage", "memory"];
  var bi = class {
    constructor(e2) {
      this.config = e2, this.props = {}, this.campaign_params_saved = false, this.name = ((e3) => {
        var t2 = "";
        return e3.token && (t2 = e3.token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")), e3.persistence_name ? "ph_" + e3.persistence_name : "ph_" + t2 + "_posthog";
      })(e2), this.storage = this.buildStorage(e2), this.load(), e2.debug && q.info("Persistence loaded", e2.persistence, j({}, this.props)), this.update_config(e2, e2), this.save();
    }
    buildStorage(e2) {
      -1 === mi.indexOf(e2.persistence.toLowerCase()) && (q.critical("Unknown persistence type " + e2.persistence + "; falling back to localStorage+cookie"), e2.persistence = "localStorage+cookie");
      var t2 = e2.persistence.toLowerCase();
      return "localstorage" === t2 && at.is_supported() ? at : "localstorage+cookie" === t2 && ut.is_supported() ? ut : "sessionstorage" === t2 && _t.is_supported() ? _t : "memory" === t2 ? dt : "cookie" === t2 ? st : ut.is_supported() ? ut : st;
    }
    properties() {
      var e2 = {};
      return Y(this.props, function(t2, i2) {
        if (i2 === ke && C(t2))
          for (var n2 = Object.keys(t2), r2 = 0; r2 < n2.length; r2++)
            e2["$feature/".concat(n2[r2])] = t2[n2[r2]];
        else
          a2 = i2, l2 = false, ($(o2 = Be) ? l2 : s && o2.indexOf === s ? -1 != o2.indexOf(a2) : (Y(o2, function(e3) {
            if (l2 || (l2 = e3 === a2))
              return V;
          }), l2)) || (e2[i2] = t2);
        var o2, a2, l2;
      }), e2;
    }
    load() {
      if (!this.disabled) {
        var e2 = this.storage.parse(this.name);
        e2 && (this.props = K({}, e2));
      }
    }
    save() {
      this.disabled || this.storage.set(this.name, this.props, this.expire_days, this.cross_subdomain, this.secure, this.config.debug);
    }
    remove() {
      this.storage.remove(this.name, false), this.storage.remove(this.name, true);
    }
    clear() {
      this.remove(), this.props = {};
    }
    register_once(e2, t2, i2) {
      if (C(e2)) {
        R(t2) && (t2 = "None"), this.expire_days = R(i2) ? this.default_expiry : i2;
        var n2 = false;
        if (Y(e2, (e3, i3) => {
          this.props.hasOwnProperty(i3) && this.props[i3] !== t2 || (this.props[i3] = e3, n2 = true);
        }), n2)
          return this.save(), true;
      }
      return false;
    }
    register(e2, t2) {
      if (C(e2)) {
        this.expire_days = R(t2) ? this.default_expiry : t2;
        var i2 = false;
        if (Y(e2, (t3, n2) => {
          e2.hasOwnProperty(n2) && this.props[n2] !== t3 && (this.props[n2] = t3, i2 = true);
        }), i2)
          return this.save(), true;
      }
      return false;
    }
    unregister(e2) {
      e2 in this.props && (delete this.props[e2], this.save());
    }
    update_campaign_params() {
      if (!this.campaign_params_saved) {
        var e2 = fi.campaignParams(this.config.custom_campaign_params);
        P(ee(e2)) || this.register(e2), this.campaign_params_saved = true;
      }
    }
    update_search_keyword() {
      this.register(fi.searchInfo());
    }
    update_referrer_info() {
      this.register_once(fi.referrerInfo(), void 0);
    }
    set_initial_person_info() {
      this.props[Le] || this.props[Me] || this.register_once({ [Ae]: fi.initialPersonInfo() }, void 0);
    }
    get_referrer_info() {
      return ee({ $referrer: this.props.$referrer, $referring_domain: this.props.$referring_domain });
    }
    get_initial_props() {
      var e2 = {};
      Y([Me, Le], (t3) => {
        var i3 = this.props[t3];
        i3 && Y(i3, function(t4, i4) {
          e2["$initial_" + y(i4)] = t4;
        });
      });
      var t2 = this.props[Ae];
      if (t2) {
        var i2 = fi.initialPersonPropsFromInfo(t2);
        K(e2, i2);
      }
      return e2;
    }
    safe_merge(e2) {
      return Y(this.props, function(t2, i2) {
        i2 in e2 || (e2[i2] = t2);
      }), e2;
    }
    update_config(e2, t2) {
      if (this.default_expiry = this.expire_days = e2.cookie_expiration, this.set_disabled(e2.disable_persistence), this.set_cross_subdomain(e2.cross_subdomain_cookie), this.set_secure(e2.secure_cookie), e2.persistence !== t2.persistence) {
        var i2 = this.buildStorage(e2), n2 = this.props;
        this.clear(), this.storage = i2, this.props = n2, this.save();
      }
    }
    set_disabled(e2) {
      this.disabled = e2, this.disabled ? this.remove() : this.save();
    }
    set_cross_subdomain(e2) {
      e2 !== this.cross_subdomain && (this.cross_subdomain = e2, this.remove(), this.save());
    }
    get_cross_subdomain() {
      return !!this.cross_subdomain;
    }
    set_secure(e2) {
      e2 !== this.secure && (this.secure = e2, this.remove(), this.save());
    }
    set_event_timer(e2, t2) {
      var i2 = this.props[oe] || {};
      i2[e2] = t2, this.props[oe] = i2, this.save();
    }
    remove_event_timer(e2) {
      var t2 = (this.props[oe] || {})[e2];
      return R(t2) || (delete this.props[oe][e2], this.save()), t2;
    }
    get_property(e2) {
      return this.props[e2];
    }
    set_property(e2, t2) {
      this.props[e2] = t2, this.save();
    }
  };
  function yi(e2) {
    var t2, i2;
    return (null === (t2 = JSON.stringify(e2, (i2 = [], function(e3, t3) {
      if (C(t3)) {
        for (; i2.length > 0 && i2[i2.length - 1] !== this; )
          i2.pop();
        return i2.includes(t3) ? "[Circular]" : (i2.push(t3), t3);
      }
      return t3;
    }))) || void 0 === t2 ? void 0 : t2.length) || 0;
  }
  function wi(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 66060288e-1;
    if (e2.size >= t2 && e2.data.length > 1) {
      var i2 = Math.floor(e2.data.length / 2), n2 = e2.data.slice(0, i2), r2 = e2.data.slice(i2);
      return [wi({ size: yi(n2), data: n2, sessionId: e2.sessionId, windowId: e2.windowId }), wi({ size: yi(r2), data: r2, sessionId: e2.sessionId, windowId: e2.windowId })].flatMap((e3) => e3);
    }
    return [e2];
  }
  var Si = ((e2) => (e2[e2.DomContentLoaded = 0] = "DomContentLoaded", e2[e2.Load = 1] = "Load", e2[e2.FullSnapshot = 2] = "FullSnapshot", e2[e2.IncrementalSnapshot = 3] = "IncrementalSnapshot", e2[e2.Meta = 4] = "Meta", e2[e2.Custom = 5] = "Custom", e2[e2.Plugin = 6] = "Plugin", e2))(Si || {});
  var Ei = ((e2) => (e2[e2.Mutation = 0] = "Mutation", e2[e2.MouseMove = 1] = "MouseMove", e2[e2.MouseInteraction = 2] = "MouseInteraction", e2[e2.Scroll = 3] = "Scroll", e2[e2.ViewportResize = 4] = "ViewportResize", e2[e2.Input = 5] = "Input", e2[e2.TouchMove = 6] = "TouchMove", e2[e2.MediaInteraction = 7] = "MediaInteraction", e2[e2.StyleSheetRule = 8] = "StyleSheetRule", e2[e2.CanvasMutation = 9] = "CanvasMutation", e2[e2.Font = 10] = "Font", e2[e2.Log = 11] = "Log", e2[e2.Drag = 12] = "Drag", e2[e2.StyleDeclaration = 13] = "StyleDeclaration", e2[e2.Selection = 14] = "Selection", e2[e2.AdoptedStyleSheet = 15] = "AdoptedStyleSheet", e2[e2.CustomElement = 16] = "CustomElement", e2))(Ei || {});
  function ki(e2) {
    var t2;
    return e2 instanceof Element && (e2.id === Ne || !(null === (t2 = e2.closest) || void 0 === t2 || !t2.call(e2, ".toolbar-global-fade-container")));
  }
  function xi(e2) {
    return !!e2 && 1 === e2.nodeType;
  }
  function Ii(e2, t2) {
    return !!e2 && !!e2.tagName && e2.tagName.toLowerCase() === t2.toLowerCase();
  }
  function Ci(e2) {
    return !!e2 && 3 === e2.nodeType;
  }
  function Pi(e2) {
    return !!e2 && 11 === e2.nodeType;
  }
  function Ri(e2) {
    return e2 ? b(e2).split(/\s+/) : [];
  }
  function Fi(e2) {
    var i2 = null == t ? void 0 : t.location.href;
    return !!(i2 && e2 && e2.some((e3) => i2.match(e3)));
  }
  function Ti(e2) {
    var t2 = "";
    switch (typeof e2.className) {
      case "string":
        t2 = e2.className;
        break;
      case "object":
        t2 = (e2.className && "baseVal" in e2.className ? e2.className.baseVal : null) || e2.getAttribute("class") || "";
        break;
      default:
        t2 = "";
    }
    return Ri(t2);
  }
  function $i(e2) {
    return O(e2) ? null : b(e2).split(/(\s+)/).filter((e3) => Gi(e3)).join("").replace(/[\r\n]/g, " ").replace(/[ ]+/g, " ").substring(0, 255);
  }
  function Oi(e2) {
    var t2 = "";
    return Ni(e2) && !qi(e2) && e2.childNodes && e2.childNodes.length && Y(e2.childNodes, function(e3) {
      var i2;
      Ci(e3) && e3.textContent && (t2 += null !== (i2 = $i(e3.textContent)) && void 0 !== i2 ? i2 : "");
    }), b(t2);
  }
  function Li(e2) {
    return R(e2.target) ? e2.srcElement || null : null !== (t2 = e2.target) && void 0 !== t2 && t2.shadowRoot ? e2.composedPath()[0] || null : e2.target || null;
    var t2;
  }
  var Mi = ["a", "button", "form", "input", "select", "textarea", "label"];
  function Ai(e2) {
    var t2 = e2.parentNode;
    return !(!t2 || !xi(t2)) && t2;
  }
  function Di(e2, i2) {
    var n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0, r2 = arguments.length > 3 ? arguments[3] : void 0, s2 = arguments.length > 4 ? arguments[4] : void 0;
    if (!t || !e2 || Ii(e2, "html") || !xi(e2))
      return false;
    if (null != n2 && n2.url_allowlist && !Fi(n2.url_allowlist))
      return false;
    if (null != n2 && n2.url_ignorelist && Fi(n2.url_ignorelist))
      return false;
    if (null != n2 && n2.dom_event_allowlist) {
      var o2 = n2.dom_event_allowlist;
      if (o2 && !o2.some((e3) => i2.type === e3))
        return false;
    }
    for (var a2 = false, l2 = [e2], u2 = true, c2 = e2; c2.parentNode && !Ii(c2, "body"); )
      if (Pi(c2.parentNode))
        l2.push(c2.parentNode.host), c2 = c2.parentNode.host;
      else {
        if (!(u2 = Ai(c2)))
          break;
        if (r2 || Mi.indexOf(u2.tagName.toLowerCase()) > -1)
          a2 = true;
        else {
          var d2 = t.getComputedStyle(u2);
          d2 && "pointer" === d2.getPropertyValue("cursor") && (a2 = true);
        }
        l2.push(u2), c2 = u2;
      }
    if (!function(e3, t2) {
      var i3 = null == t2 ? void 0 : t2.element_allowlist;
      if (R(i3))
        return true;
      var n3 = function(e4) {
        if (i3.some((t3) => e4.tagName.toLowerCase() === t3))
          return { v: true };
      };
      for (var r3 of e3) {
        var s3 = n3(r3);
        if ("object" == typeof s3)
          return s3.v;
      }
      return false;
    }(l2, n2))
      return false;
    if (!function(e3, t2) {
      var i3 = null == t2 ? void 0 : t2.css_selector_allowlist;
      if (R(i3))
        return true;
      var n3 = function(e4) {
        if (i3.some((t3) => e4.matches(t3)))
          return { v: true };
      };
      for (var r3 of e3) {
        var s3 = n3(r3);
        if ("object" == typeof s3)
          return s3.v;
      }
      return false;
    }(l2, n2))
      return false;
    var h2 = t.getComputedStyle(e2);
    if (h2 && "pointer" === h2.getPropertyValue("cursor") && "click" === i2.type)
      return true;
    var _2 = e2.tagName.toLowerCase();
    switch (_2) {
      case "html":
        return false;
      case "form":
        return (s2 || ["submit"]).indexOf(i2.type) >= 0;
      case "input":
      case "select":
      case "textarea":
        return (s2 || ["change", "click"]).indexOf(i2.type) >= 0;
      default:
        return a2 ? (s2 || ["click"]).indexOf(i2.type) >= 0 : (s2 || ["click"]).indexOf(i2.type) >= 0 && (Mi.indexOf(_2) > -1 || "true" === e2.getAttribute("contenteditable"));
    }
  }
  function Ni(e2) {
    for (var t2 = e2; t2.parentNode && !Ii(t2, "body"); t2 = t2.parentNode) {
      var i2 = Ti(t2);
      if (m(i2, "ph-sensitive") || m(i2, "ph-no-capture"))
        return false;
    }
    if (m(Ti(e2), "ph-include"))
      return true;
    var n2 = e2.type || "";
    if (F(n2))
      switch (n2.toLowerCase()) {
        case "hidden":
        case "password":
          return false;
      }
    var r2 = e2.name || e2.id || "";
    if (F(r2)) {
      if (/^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i.test(r2.replace(/[^a-zA-Z0-9]/g, "")))
        return false;
    }
    return true;
  }
  function qi(e2) {
    return !!(Ii(e2, "input") && !["button", "checkbox", "submit", "reset"].includes(e2.type) || Ii(e2, "select") || Ii(e2, "textarea") || "true" === e2.getAttribute("contenteditable"));
  }
  var Bi = "(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11})";
  var Hi = new RegExp("^(?:".concat(Bi, ")$"));
  var Ui = new RegExp(Bi);
  var zi = "\\d{3}-?\\d{2}-?\\d{4}";
  var ji = new RegExp("^(".concat(zi, ")$"));
  var Wi = new RegExp("(".concat(zi, ")"));
  function Gi(e2) {
    var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
    if (O(e2))
      return false;
    if (F(e2)) {
      if (e2 = b(e2), (t2 ? Hi : Ui).test((e2 || "").replace(/[- ]/g, "")))
        return false;
      if ((t2 ? ji : Wi).test(e2))
        return false;
    }
    return true;
  }
  function Vi(e2) {
    var t2 = Oi(e2);
    return Gi(t2 = "".concat(t2, " ").concat(Ji(e2)).trim()) ? t2 : "";
  }
  function Ji(e2) {
    var t2 = "";
    return e2 && e2.childNodes && e2.childNodes.length && Y(e2.childNodes, function(e3) {
      var i2;
      if (e3 && "span" === (null === (i2 = e3.tagName) || void 0 === i2 ? void 0 : i2.toLowerCase()))
        try {
          var n2 = Oi(e3);
          t2 = "".concat(t2, " ").concat(n2).trim(), e3.childNodes && e3.childNodes.length && (t2 = "".concat(t2, " ").concat(Ji(e3)).trim());
        } catch (e4) {
          q.error("[AutoCapture]", e4);
        }
    }), t2;
  }
  function Yi(e2) {
    return function(e3) {
      var t2 = e3.map((e4) => {
        var t3, i2, n2 = "";
        if (e4.tag_name && (n2 += e4.tag_name), e4.attr_class)
          for (var r2 of (e4.attr_class.sort(), e4.attr_class))
            n2 += ".".concat(r2.replace(/"/g, ""));
        var s2 = j(j(j(j({}, e4.text ? { text: e4.text } : {}), {}, { "nth-child": null !== (t3 = e4.nth_child) && void 0 !== t3 ? t3 : 0, "nth-of-type": null !== (i2 = e4.nth_of_type) && void 0 !== i2 ? i2 : 0 }, e4.href ? { href: e4.href } : {}), e4.attr_id ? { attr_id: e4.attr_id } : {}), e4.attributes), o2 = {};
        return X(s2).sort((e5, t4) => {
          var [i3] = e5, [n3] = t4;
          return i3.localeCompare(n3);
        }).forEach((e5) => {
          var [t4, i3] = e5;
          return o2[Ki(t4.toString())] = Ki(i3.toString());
        }), n2 += ":", n2 += X(s2).map((e5) => {
          var [t4, i3] = e5;
          return "".concat(t4, '="').concat(i3, '"');
        }).join("");
      });
      return t2.join(";");
    }(function(e3) {
      return e3.map((e4) => {
        var t2, i2, n2 = { text: null === (t2 = e4.$el_text) || void 0 === t2 ? void 0 : t2.slice(0, 400), tag_name: e4.tag_name, href: null === (i2 = e4.attr__href) || void 0 === i2 ? void 0 : i2.slice(0, 2048), attr_class: Xi(e4), attr_id: e4.attr__id, nth_child: e4.nth_child, nth_of_type: e4.nth_of_type, attributes: {} };
        return X(e4).filter((e5) => {
          var [t3] = e5;
          return 0 === t3.indexOf("attr__");
        }).forEach((e5) => {
          var [t3, i3] = e5;
          return n2.attributes[t3] = i3;
        }), n2;
      });
    }(e2));
  }
  function Ki(e2) {
    return e2.replace(/"|\\"/g, '\\"');
  }
  function Xi(e2) {
    var t2 = e2.attr__class;
    return t2 ? x(t2) ? t2 : Ri(t2) : void 0;
  }
  var Qi = "[SessionRecording]";
  var Zi = "redacted";
  var en = { initiatorTypes: ["audio", "beacon", "body", "css", "early-hint", "embed", "fetch", "frame", "iframe", "icon", "image", "img", "input", "link", "navigation", "object", "ping", "script", "track", "video", "xmlhttprequest"], maskRequestFn: (e2) => e2, recordHeaders: false, recordBody: false, recordInitialRequests: false, recordPerformance: false, performanceEntryTypeToObserve: ["first-input", "navigation", "paint", "resource"], payloadSizeLimitBytes: 1e6, payloadHostDenyList: [".lr-ingest.io", ".ingest.sentry.io", ".clarity.ms", "analytics.google.com"] };
  var tn = ["authorization", "x-forwarded-for", "authorization", "cookie", "set-cookie", "x-api-key", "x-real-ip", "remote-addr", "forwarded", "proxy-authorization", "x-csrf-token", "x-csrftoken", "x-xsrf-token"];
  var nn = ["password", "secret", "passwd", "api_key", "apikey", "auth", "credentials", "mysql_pwd", "privatekey", "private_key", "token"];
  var rn = ["/s/", "/e/", "/i/"];
  function sn(e2, t2, i2, n2) {
    if (O(e2))
      return e2;
    var r2 = (null == t2 ? void 0 : t2["content-length"]) || function(e3) {
      return new Blob([e3]).size;
    }(e2);
    return F(r2) && (r2 = parseInt(r2)), r2 > i2 ? Qi + " ".concat(n2, " body too large to record (").concat(r2, " bytes)") : e2;
  }
  function on(e2, t2) {
    if (O(e2))
      return e2;
    var i2 = e2;
    return Gi(i2, false) || (i2 = Qi + " " + t2 + " body " + Zi), Y(nn, (e3) => {
      var n2, r2;
      null !== (n2 = i2) && void 0 !== n2 && n2.length && -1 !== (null === (r2 = i2) || void 0 === r2 ? void 0 : r2.indexOf(e3)) && (i2 = Qi + " " + t2 + " body " + Zi + " as might contain: " + e3);
    }), i2;
  }
  var an = (e2, t2) => {
    var i2, n2, r2, s2 = { payloadSizeLimitBytes: en.payloadSizeLimitBytes, performanceEntryTypeToObserve: [...en.performanceEntryTypeToObserve], payloadHostDenyList: [...t2.payloadHostDenyList || [], ...en.payloadHostDenyList] }, o2 = false !== e2.session_recording.recordHeaders && t2.recordHeaders, a2 = false !== e2.session_recording.recordBody && t2.recordBody, l2 = false !== e2.capture_performance && t2.recordPerformance, u2 = (i2 = s2, r2 = Math.min(1e6, null !== (n2 = i2.payloadSizeLimitBytes) && void 0 !== n2 ? n2 : 1e6), (e3) => (null != e3 && e3.requestBody && (e3.requestBody = sn(e3.requestBody, e3.requestHeaders, r2, "Request")), null != e3 && e3.responseBody && (e3.responseBody = sn(e3.responseBody, e3.responseHeaders, r2, "Response")), e3)), c2 = (t3) => {
      return u2(((e3, t4) => {
        var i4, n4 = vt(e3.name), r3 = 0 === t4.indexOf("http") ? null === (i4 = vt(t4)) || void 0 === i4 ? void 0 : i4.pathname : t4;
        "/" === r3 && (r3 = "");
        var s3 = null == n4 ? void 0 : n4.pathname.replace(r3 || "", "");
        if (!(n4 && s3 && rn.some((e4) => 0 === s3.indexOf(e4))))
          return e3;
      })((n3 = (i3 = t3).requestHeaders, O(n3) || Y(Object.keys(null != n3 ? n3 : {}), (e3) => {
        tn.includes(e3.toLowerCase()) && (n3[e3] = Zi);
      }), i3), e2.api_host));
      var i3, n3;
    }, d2 = I(e2.session_recording.maskNetworkRequestFn);
    return d2 && I(e2.session_recording.maskCapturedNetworkRequestFn) && q.warn("Both `maskNetworkRequestFn` and `maskCapturedNetworkRequestFn` are defined. `maskNetworkRequestFn` will be ignored."), d2 && (e2.session_recording.maskCapturedNetworkRequestFn = (t3) => {
      var i3 = e2.session_recording.maskNetworkRequestFn({ url: t3.name });
      return j(j({}, t3), {}, { name: null == i3 ? void 0 : i3.url });
    }), s2.maskRequestFn = I(e2.session_recording.maskCapturedNetworkRequestFn) ? (t3) => {
      var i3, n3, r3, s3 = c2(t3);
      return s3 && null !== (i3 = null === (n3 = (r3 = e2.session_recording).maskCapturedNetworkRequestFn) || void 0 === n3 ? void 0 : n3.call(r3, s3)) && void 0 !== i3 ? i3 : void 0;
    } : (e3) => function(e4) {
      if (!R(e4))
        return e4.requestBody = on(e4.requestBody, "Request"), e4.responseBody = on(e4.responseBody, "Response"), e4;
    }(c2(e3)), j(j(j({}, en), s2), {}, { recordHeaders: o2, recordBody: a2, recordPerformance: l2, recordInitialRequests: l2 });
  };
  function ln(e2, t2, i2, n2, r2) {
    return t2 > i2 && (q.warn("min cannot be greater than max."), t2 = i2), L(e2) ? e2 > i2 ? (n2 && q.warn(n2 + " cannot be  greater than max: " + i2 + ". Using max value instead."), i2) : e2 < t2 ? (n2 && q.warn(n2 + " cannot be less than min: " + t2 + ". Using min value instead."), t2) : e2 : (n2 && q.warn(n2 + " must be a number. using max or fallback. max: " + i2 + ", fallback: " + r2), ln(r2 || i2, t2, i2, n2));
  }
  var un = class {
    constructor(e2) {
      var t2, i2, n2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      W(this, "bucketSize", 100), W(this, "refillRate", 10), W(this, "mutationBuckets", {}), W(this, "loggedTracker", {}), W(this, "refillBuckets", () => {
        Object.keys(this.mutationBuckets).forEach((e3) => {
          this.mutationBuckets[e3] = this.mutationBuckets[e3] + this.refillRate, this.mutationBuckets[e3] >= this.bucketSize && delete this.mutationBuckets[e3];
        });
      }), W(this, "getNodeOrRelevantParent", (e3) => {
        var t3 = this.rrweb.mirror.getNode(e3);
        if ("svg" !== (null == t3 ? void 0 : t3.nodeName) && t3 instanceof Element) {
          var i3 = t3.closest("svg");
          if (i3)
            return [this.rrweb.mirror.getId(i3), i3];
        }
        return [e3, t3];
      }), W(this, "numberOfChanges", (e3) => {
        var t3, i3, n3, r2, s2, o2, a2, l2;
        return (null !== (t3 = null === (i3 = e3.removes) || void 0 === i3 ? void 0 : i3.length) && void 0 !== t3 ? t3 : 0) + (null !== (n3 = null === (r2 = e3.attributes) || void 0 === r2 ? void 0 : r2.length) && void 0 !== n3 ? n3 : 0) + (null !== (s2 = null === (o2 = e3.texts) || void 0 === o2 ? void 0 : o2.length) && void 0 !== s2 ? s2 : 0) + (null !== (a2 = null === (l2 = e3.adds) || void 0 === l2 ? void 0 : l2.length) && void 0 !== a2 ? a2 : 0);
      }), W(this, "throttleMutations", (e3) => {
        if (3 !== e3.type || 0 !== e3.data.source)
          return e3;
        var t3 = e3.data, i3 = this.numberOfChanges(t3);
        t3.attributes && (t3.attributes = t3.attributes.filter((e4) => {
          var t4, i4, n4, [r2, s2] = this.getNodeOrRelevantParent(e4.id);
          if (0 === this.mutationBuckets[r2])
            return false;
          (this.mutationBuckets[r2] = null !== (t4 = this.mutationBuckets[r2]) && void 0 !== t4 ? t4 : this.bucketSize, this.mutationBuckets[r2] = Math.max(this.mutationBuckets[r2] - 1, 0), 0 === this.mutationBuckets[r2]) && (this.loggedTracker[r2] || (this.loggedTracker[r2] = true, null === (i4 = (n4 = this.options).onBlockedNode) || void 0 === i4 || i4.call(n4, r2, s2)));
          return e4;
        }));
        var n3 = this.numberOfChanges(t3);
        return 0 !== n3 || i3 === n3 ? e3 : void 0;
      }), this.rrweb = e2, this.options = n2, this.refillRate = ln(null !== (t2 = this.options.refillRate) && void 0 !== t2 ? t2 : this.refillRate, 0, 100, "mutation throttling refill rate"), this.bucketSize = ln(null !== (i2 = this.options.bucketSize) && void 0 !== i2 ? i2 : this.bucketSize, 0, 100, "mutation throttling bucket size"), setInterval(() => {
        this.refillBuckets();
      }, 1e3);
    }
  };
  var cn = Uint8Array;
  var dn = Uint16Array;
  var hn = Uint32Array;
  var _n = new cn([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
  var pn = new cn([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
  var vn = new cn([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var gn = function(e2, t2) {
    for (var i2 = new dn(31), n2 = 0; n2 < 31; ++n2)
      i2[n2] = t2 += 1 << e2[n2 - 1];
    var r2 = new hn(i2[30]);
    for (n2 = 1; n2 < 30; ++n2)
      for (var s2 = i2[n2]; s2 < i2[n2 + 1]; ++s2)
        r2[s2] = s2 - i2[n2] << 5 | n2;
    return [i2, r2];
  };
  var fn = gn(_n, 2);
  var mn = fn[0];
  var bn = fn[1];
  mn[28] = 258, bn[258] = 28;
  for (yn = gn(pn, 0)[1], wn = new dn(32768), Sn = 0; Sn < 32768; ++Sn) {
    En = (43690 & Sn) >>> 1 | (21845 & Sn) << 1;
    En = (61680 & (En = (52428 & En) >>> 2 | (13107 & En) << 2)) >>> 4 | (3855 & En) << 4, wn[Sn] = ((65280 & En) >>> 8 | (255 & En) << 8) >>> 1;
  }
  var En;
  var yn;
  var wn;
  var Sn;
  var kn = function(e2, t2, i2) {
    for (var n2 = e2.length, r2 = 0, s2 = new dn(t2); r2 < n2; ++r2)
      ++s2[e2[r2] - 1];
    var o2, a2 = new dn(t2);
    for (r2 = 0; r2 < t2; ++r2)
      a2[r2] = a2[r2 - 1] + s2[r2 - 1] << 1;
    if (i2) {
      o2 = new dn(1 << t2);
      var l2 = 15 - t2;
      for (r2 = 0; r2 < n2; ++r2)
        if (e2[r2])
          for (var u2 = r2 << 4 | e2[r2], c2 = t2 - e2[r2], d2 = a2[e2[r2] - 1]++ << c2, h2 = d2 | (1 << c2) - 1; d2 <= h2; ++d2)
            o2[wn[d2] >>> l2] = u2;
    } else
      for (o2 = new dn(n2), r2 = 0; r2 < n2; ++r2)
        o2[r2] = wn[a2[e2[r2] - 1]++] >>> 15 - e2[r2];
    return o2;
  };
  var xn = new cn(288);
  for (Sn = 0; Sn < 144; ++Sn)
    xn[Sn] = 8;
  for (Sn = 144; Sn < 256; ++Sn)
    xn[Sn] = 9;
  for (Sn = 256; Sn < 280; ++Sn)
    xn[Sn] = 7;
  for (Sn = 280; Sn < 288; ++Sn)
    xn[Sn] = 8;
  var In = new cn(32);
  for (Sn = 0; Sn < 32; ++Sn)
    In[Sn] = 5;
  var Cn = kn(xn, 9, 0);
  var Pn = kn(In, 5, 0);
  var Rn = function(e2) {
    return (e2 / 8 >> 0) + (7 & e2 && 1);
  };
  var Fn = function(e2, t2, i2) {
    (null == i2 || i2 > e2.length) && (i2 = e2.length);
    var n2 = new (e2 instanceof dn ? dn : e2 instanceof hn ? hn : cn)(i2 - t2);
    return n2.set(e2.subarray(t2, i2)), n2;
  };
  var Tn = function(e2, t2, i2) {
    i2 <<= 7 & t2;
    var n2 = t2 / 8 >> 0;
    e2[n2] |= i2, e2[n2 + 1] |= i2 >>> 8;
  };
  var $n = function(e2, t2, i2) {
    i2 <<= 7 & t2;
    var n2 = t2 / 8 >> 0;
    e2[n2] |= i2, e2[n2 + 1] |= i2 >>> 8, e2[n2 + 2] |= i2 >>> 16;
  };
  var On = function(e2, t2) {
    for (var i2 = [], n2 = 0; n2 < e2.length; ++n2)
      e2[n2] && i2.push({ s: n2, f: e2[n2] });
    var r2 = i2.length, s2 = i2.slice();
    if (!r2)
      return [new cn(0), 0];
    if (1 == r2) {
      var o2 = new cn(i2[0].s + 1);
      return o2[i2[0].s] = 1, [o2, 1];
    }
    i2.sort(function(e3, t3) {
      return e3.f - t3.f;
    }), i2.push({ s: -1, f: 25001 });
    var a2 = i2[0], l2 = i2[1], u2 = 0, c2 = 1, d2 = 2;
    for (i2[0] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 }; c2 != r2 - 1; )
      a2 = i2[i2[u2].f < i2[d2].f ? u2++ : d2++], l2 = i2[u2 != c2 && i2[u2].f < i2[d2].f ? u2++ : d2++], i2[c2++] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 };
    var h2 = s2[0].s;
    for (n2 = 1; n2 < r2; ++n2)
      s2[n2].s > h2 && (h2 = s2[n2].s);
    var _2 = new dn(h2 + 1), p2 = Ln(i2[c2 - 1], _2, 0);
    if (p2 > t2) {
      n2 = 0;
      var v2 = 0, g2 = p2 - t2, f = 1 << g2;
      for (s2.sort(function(e3, t3) {
        return _2[t3.s] - _2[e3.s] || e3.f - t3.f;
      }); n2 < r2; ++n2) {
        var m2 = s2[n2].s;
        if (!(_2[m2] > t2))
          break;
        v2 += f - (1 << p2 - _2[m2]), _2[m2] = t2;
      }
      for (v2 >>>= g2; v2 > 0; ) {
        var b2 = s2[n2].s;
        _2[b2] < t2 ? v2 -= 1 << t2 - _2[b2]++ - 1 : ++n2;
      }
      for (; n2 >= 0 && v2; --n2) {
        var y2 = s2[n2].s;
        _2[y2] == t2 && (--_2[y2], ++v2);
      }
      p2 = t2;
    }
    return [new cn(_2), p2];
  };
  var Ln = function(e2, t2, i2) {
    return -1 == e2.s ? Math.max(Ln(e2.l, t2, i2 + 1), Ln(e2.r, t2, i2 + 1)) : t2[e2.s] = i2;
  };
  var Mn = function(e2) {
    for (var t2 = e2.length; t2 && !e2[--t2]; )
      ;
    for (var i2 = new dn(++t2), n2 = 0, r2 = e2[0], s2 = 1, o2 = function(e3) {
      i2[n2++] = e3;
    }, a2 = 1; a2 <= t2; ++a2)
      if (e2[a2] == r2 && a2 != t2)
        ++s2;
      else {
        if (!r2 && s2 > 2) {
          for (; s2 > 138; s2 -= 138)
            o2(32754);
          s2 > 2 && (o2(s2 > 10 ? s2 - 11 << 5 | 28690 : s2 - 3 << 5 | 12305), s2 = 0);
        } else if (s2 > 3) {
          for (o2(r2), --s2; s2 > 6; s2 -= 6)
            o2(8304);
          s2 > 2 && (o2(s2 - 3 << 5 | 8208), s2 = 0);
        }
        for (; s2--; )
          o2(r2);
        s2 = 1, r2 = e2[a2];
      }
    return [i2.subarray(0, n2), t2];
  };
  var An = function(e2, t2) {
    for (var i2 = 0, n2 = 0; n2 < t2.length; ++n2)
      i2 += e2[n2] * t2[n2];
    return i2;
  };
  var Dn = function(e2, t2, i2) {
    var n2 = i2.length, r2 = Rn(t2 + 2);
    e2[r2] = 255 & n2, e2[r2 + 1] = n2 >>> 8, e2[r2 + 2] = 255 ^ e2[r2], e2[r2 + 3] = 255 ^ e2[r2 + 1];
    for (var s2 = 0; s2 < n2; ++s2)
      e2[r2 + s2 + 4] = i2[s2];
    return 8 * (r2 + 4 + n2);
  };
  var Nn = function(e2, t2, i2, n2, r2, s2, o2, a2, l2, u2, c2) {
    Tn(t2, c2++, i2), ++r2[256];
    for (var d2 = On(r2, 15), h2 = d2[0], _2 = d2[1], p2 = On(s2, 15), v2 = p2[0], g2 = p2[1], f = Mn(h2), m2 = f[0], b2 = f[1], y2 = Mn(v2), w2 = y2[0], S2 = y2[1], E2 = new dn(19), k2 = 0; k2 < m2.length; ++k2)
      E2[31 & m2[k2]]++;
    for (k2 = 0; k2 < w2.length; ++k2)
      E2[31 & w2[k2]]++;
    for (var x2 = On(E2, 7), I2 = x2[0], C2 = x2[1], P2 = 19; P2 > 4 && !I2[vn[P2 - 1]]; --P2)
      ;
    var R2, F2, T2, $2, O2 = u2 + 5 << 3, L2 = An(r2, xn) + An(s2, In) + o2, M2 = An(r2, h2) + An(s2, v2) + o2 + 14 + 3 * P2 + An(E2, I2) + (2 * E2[16] + 3 * E2[17] + 7 * E2[18]);
    if (O2 <= L2 && O2 <= M2)
      return Dn(t2, c2, e2.subarray(l2, l2 + u2));
    if (Tn(t2, c2, 1 + (M2 < L2)), c2 += 2, M2 < L2) {
      R2 = kn(h2, _2, 0), F2 = h2, T2 = kn(v2, g2, 0), $2 = v2;
      var A2 = kn(I2, C2, 0);
      Tn(t2, c2, b2 - 257), Tn(t2, c2 + 5, S2 - 1), Tn(t2, c2 + 10, P2 - 4), c2 += 14;
      for (k2 = 0; k2 < P2; ++k2)
        Tn(t2, c2 + 3 * k2, I2[vn[k2]]);
      c2 += 3 * P2;
      for (var D2 = [m2, w2], N2 = 0; N2 < 2; ++N2) {
        var q2 = D2[N2];
        for (k2 = 0; k2 < q2.length; ++k2) {
          var B2 = 31 & q2[k2];
          Tn(t2, c2, A2[B2]), c2 += I2[B2], B2 > 15 && (Tn(t2, c2, q2[k2] >>> 5 & 127), c2 += q2[k2] >>> 12);
        }
      }
    } else
      R2 = Cn, F2 = xn, T2 = Pn, $2 = In;
    for (k2 = 0; k2 < a2; ++k2)
      if (n2[k2] > 255) {
        B2 = n2[k2] >>> 18 & 31;
        $n(t2, c2, R2[B2 + 257]), c2 += F2[B2 + 257], B2 > 7 && (Tn(t2, c2, n2[k2] >>> 23 & 31), c2 += _n[B2]);
        var H2 = 31 & n2[k2];
        $n(t2, c2, T2[H2]), c2 += $2[H2], H2 > 3 && ($n(t2, c2, n2[k2] >>> 5 & 8191), c2 += pn[H2]);
      } else
        $n(t2, c2, R2[n2[k2]]), c2 += F2[n2[k2]];
    return $n(t2, c2, R2[256]), c2 + F2[256];
  };
  var qn = new hn([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var Bn = function() {
    for (var e2 = new hn(256), t2 = 0; t2 < 256; ++t2) {
      for (var i2 = t2, n2 = 9; --n2; )
        i2 = (1 & i2 && 3988292384) ^ i2 >>> 1;
      e2[t2] = i2;
    }
    return e2;
  }();
  var Hn = function() {
    var e2 = 4294967295;
    return { p: function(t2) {
      for (var i2 = e2, n2 = 0; n2 < t2.length; ++n2)
        i2 = Bn[255 & i2 ^ t2[n2]] ^ i2 >>> 8;
      e2 = i2;
    }, d: function() {
      return 4294967295 ^ e2;
    } };
  };
  var Un = function(e2, t2, i2, n2, r2) {
    return function(e3, t3, i3, n3, r3, s2) {
      var o2 = e3.length, a2 = new cn(n3 + o2 + 5 * (1 + Math.floor(o2 / 7e3)) + r3), l2 = a2.subarray(n3, a2.length - r3), u2 = 0;
      if (!t3 || o2 < 8)
        for (var c2 = 0; c2 <= o2; c2 += 65535) {
          var d2 = c2 + 65535;
          d2 < o2 ? u2 = Dn(l2, u2, e3.subarray(c2, d2)) : (l2[c2] = s2, u2 = Dn(l2, u2, e3.subarray(c2, o2)));
        }
      else {
        for (var h2 = qn[t3 - 1], _2 = h2 >>> 13, p2 = 8191 & h2, v2 = (1 << i3) - 1, g2 = new dn(32768), f = new dn(v2 + 1), m2 = Math.ceil(i3 / 3), b2 = 2 * m2, y2 = function(t4) {
          return (e3[t4] ^ e3[t4 + 1] << m2 ^ e3[t4 + 2] << b2) & v2;
        }, w2 = new hn(25e3), S2 = new dn(288), E2 = new dn(32), k2 = 0, x2 = 0, I2 = (c2 = 0, 0), C2 = 0, P2 = 0; c2 < o2; ++c2) {
          var R2 = y2(c2), F2 = 32767 & c2, T2 = f[R2];
          if (g2[F2] = T2, f[R2] = F2, C2 <= c2) {
            var $2 = o2 - c2;
            if ((k2 > 7e3 || I2 > 24576) && $2 > 423) {
              u2 = Nn(e3, l2, 0, w2, S2, E2, x2, I2, P2, c2 - P2, u2), I2 = k2 = x2 = 0, P2 = c2;
              for (var O2 = 0; O2 < 286; ++O2)
                S2[O2] = 0;
              for (O2 = 0; O2 < 30; ++O2)
                E2[O2] = 0;
            }
            var L2 = 2, M2 = 0, A2 = p2, D2 = F2 - T2 & 32767;
            if ($2 > 2 && R2 == y2(c2 - D2))
              for (var N2 = Math.min(_2, $2) - 1, q2 = Math.min(32767, c2), B2 = Math.min(258, $2); D2 <= q2 && --A2 && F2 != T2; ) {
                if (e3[c2 + L2] == e3[c2 + L2 - D2]) {
                  for (var H2 = 0; H2 < B2 && e3[c2 + H2] == e3[c2 + H2 - D2]; ++H2)
                    ;
                  if (H2 > L2) {
                    if (L2 = H2, M2 = D2, H2 > N2)
                      break;
                    var U2 = Math.min(D2, H2 - 2), z2 = 0;
                    for (O2 = 0; O2 < U2; ++O2) {
                      var j2 = c2 - D2 + O2 + 32768 & 32767, W2 = j2 - g2[j2] + 32768 & 32767;
                      W2 > z2 && (z2 = W2, T2 = j2);
                    }
                  }
                }
                D2 += (F2 = T2) - (T2 = g2[F2]) + 32768 & 32767;
              }
            if (M2) {
              w2[I2++] = 268435456 | bn[L2] << 18 | yn[M2];
              var G2 = 31 & bn[L2], V2 = 31 & yn[M2];
              x2 += _n[G2] + pn[V2], ++S2[257 + G2], ++E2[V2], C2 = c2 + L2, ++k2;
            } else
              w2[I2++] = e3[c2], ++S2[e3[c2]];
          }
        }
        u2 = Nn(e3, l2, s2, w2, S2, E2, x2, I2, P2, c2 - P2, u2);
      }
      return Fn(a2, 0, n3 + Rn(u2) + r3);
    }(e2, null == t2.level ? 6 : t2.level, null == t2.mem ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(e2.length)))) : 12 + t2.mem, i2, n2, !r2);
  };
  var zn = function(e2, t2, i2) {
    for (; i2; ++t2)
      e2[t2] = i2, i2 >>>= 8;
  };
  var jn = function(e2, t2) {
    var i2 = t2.filename;
    if (e2[0] = 31, e2[1] = 139, e2[2] = 8, e2[8] = t2.level < 2 ? 4 : 9 == t2.level ? 2 : 0, e2[9] = 3, 0 != t2.mtime && zn(e2, 4, Math.floor(new Date(t2.mtime || Date.now()) / 1e3)), i2) {
      e2[3] = 8;
      for (var n2 = 0; n2 <= i2.length; ++n2)
        e2[n2 + 10] = i2.charCodeAt(n2);
    }
  };
  var Wn = function(e2) {
    return 10 + (e2.filename && e2.filename.length + 1 || 0);
  };
  function Gn(e2, t2) {
    void 0 === t2 && (t2 = {});
    var i2 = Hn(), n2 = e2.length;
    i2.p(e2);
    var r2 = Un(e2, t2, Wn(t2), 8), s2 = r2.length;
    return jn(r2, t2), zn(r2, s2 - 8, i2.d()), zn(r2, s2 - 4, n2), r2;
  }
  function Vn(e2, t2) {
    var i2 = e2.length;
    if ("undefined" != typeof TextEncoder)
      return new TextEncoder().encode(e2);
    for (var n2 = new cn(e2.length + (e2.length >>> 1)), r2 = 0, s2 = function(e3) {
      n2[r2++] = e3;
    }, o2 = 0; o2 < i2; ++o2) {
      if (r2 + 5 > n2.length) {
        var a2 = new cn(r2 + 8 + (i2 - o2 << 1));
        a2.set(n2), n2 = a2;
      }
      var l2 = e2.charCodeAt(o2);
      l2 < 128 || t2 ? s2(l2) : l2 < 2048 ? (s2(192 | l2 >>> 6), s2(128 | 63 & l2)) : l2 > 55295 && l2 < 57344 ? (s2(240 | (l2 = 65536 + (1047552 & l2) | 1023 & e2.charCodeAt(++o2)) >>> 18), s2(128 | l2 >>> 12 & 63), s2(128 | l2 >>> 6 & 63), s2(128 | 63 & l2)) : (s2(224 | l2 >>> 12), s2(128 | l2 >>> 6 & 63), s2(128 | 63 & l2));
    }
    return Fn(n2, 0, r2);
  }
  var Jn = "[SessionRecording]";
  var Yn = B(Jn);
  var Kn = 3e5;
  var Xn = [Ei.MouseMove, Ei.MouseInteraction, Ei.Scroll, Ei.ViewportResize, Ei.Input, Ei.TouchMove, Ei.MediaInteraction, Ei.Drag];
  var Qn = (e2) => ({ rrwebMethod: e2, enqueuedAt: Date.now(), attempt: 1 });
  function Zn(e2) {
    return function(e3, t2) {
      for (var i2 = "", n2 = 0; n2 < e3.length; ) {
        var r2 = e3[n2++];
        r2 < 128 || t2 ? i2 += String.fromCharCode(r2) : r2 < 224 ? i2 += String.fromCharCode((31 & r2) << 6 | 63 & e3[n2++]) : r2 < 240 ? i2 += String.fromCharCode((15 & r2) << 12 | (63 & e3[n2++]) << 6 | 63 & e3[n2++]) : (r2 = ((15 & r2) << 18 | (63 & e3[n2++]) << 12 | (63 & e3[n2++]) << 6 | 63 & e3[n2++]) - 65536, i2 += String.fromCharCode(55296 | r2 >> 10, 56320 | 1023 & r2));
      }
      return i2;
    }(Gn(Vn(JSON.stringify(e2))), true);
  }
  function er(e2) {
    return e2.type === Si.Custom && "sessionIdle" === e2.data.tag;
  }
  function tr(e2, t2) {
    return t2.some((t3) => "regex" === t3.matching && new RegExp(t3.url).test(e2));
  }
  var ir = class {
    get sessionIdleThresholdMilliseconds() {
      return this.instance.config.session_recording.session_idle_threshold_ms || 3e5;
    }
    get rrwebRecord() {
      var e2, t2;
      return null == _ || null === (e2 = _.__PosthogExtensions__) || void 0 === e2 || null === (t2 = e2.rrweb) || void 0 === t2 ? void 0 : t2.record;
    }
    get started() {
      return this._captureStarted;
    }
    get sessionManager() {
      if (!this.instance.sessionManager)
        throw new Error(Jn + " must be started with a valid sessionManager.");
      return this.instance.sessionManager;
    }
    get fullSnapshotIntervalMillis() {
      var e2, t2;
      return "trigger_pending" === this.triggerStatus ? 6e4 : null !== (e2 = null === (t2 = this.instance.config.session_recording) || void 0 === t2 ? void 0 : t2.full_snapshot_interval_millis) && void 0 !== e2 ? e2 : Kn;
    }
    get isSampled() {
      var e2 = this.instance.get_property(we);
      return M(e2) ? e2 : null;
    }
    get sessionDuration() {
      var e2, t2, i2 = null === (e2 = this.buffer) || void 0 === e2 ? void 0 : e2.data[(null === (t2 = this.buffer) || void 0 === t2 ? void 0 : t2.data.length) - 1], { sessionStartTimestamp: n2 } = this.sessionManager.checkAndGetSessionAndWindowId(true);
      return i2 ? i2.timestamp - n2 : null;
    }
    get isRecordingEnabled() {
      var e2 = !!this.instance.get_property(_e), i2 = !this.instance.config.disable_session_recording;
      return t && e2 && i2;
    }
    get isConsoleLogCaptureEnabled() {
      var e2 = !!this.instance.get_property(pe), t2 = this.instance.config.enable_recording_console_log;
      return null != t2 ? t2 : e2;
    }
    get canvasRecording() {
      var e2, t2, i2, n2, r2, s2, o2 = this.instance.config.session_recording.captureCanvas, a2 = this.instance.get_property(ge), l2 = null !== (e2 = null !== (t2 = null == o2 ? void 0 : o2.recordCanvas) && void 0 !== t2 ? t2 : null == a2 ? void 0 : a2.enabled) && void 0 !== e2 && e2, u2 = null !== (i2 = null !== (n2 = null == o2 ? void 0 : o2.canvasFps) && void 0 !== n2 ? n2 : null == a2 ? void 0 : a2.fps) && void 0 !== i2 ? i2 : 0, c2 = null !== (r2 = null !== (s2 = null == o2 ? void 0 : o2.canvasQuality) && void 0 !== s2 ? s2 : null == a2 ? void 0 : a2.quality) && void 0 !== r2 ? r2 : 0;
      return { enabled: l2, fps: ln(u2, 0, 12, "canvas recording fps"), quality: ln(c2, 0, 1, "canvas recording quality") };
    }
    get networkPayloadCapture() {
      var e2, t2, i2 = this.instance.get_property(ve), n2 = { recordHeaders: null === (e2 = this.instance.config.session_recording) || void 0 === e2 ? void 0 : e2.recordHeaders, recordBody: null === (t2 = this.instance.config.session_recording) || void 0 === t2 ? void 0 : t2.recordBody }, r2 = (null == n2 ? void 0 : n2.recordHeaders) || (null == i2 ? void 0 : i2.recordHeaders), s2 = (null == n2 ? void 0 : n2.recordBody) || (null == i2 ? void 0 : i2.recordBody), o2 = C(this.instance.config.capture_performance) ? this.instance.config.capture_performance.network_timing : this.instance.config.capture_performance, a2 = !!(M(o2) ? o2 : null == i2 ? void 0 : i2.capturePerformance);
      return r2 || s2 || a2 ? { recordHeaders: r2, recordBody: s2, recordPerformance: a2 } : void 0;
    }
    get sampleRate() {
      var e2 = this.instance.get_property(fe);
      return L(e2) ? e2 : null;
    }
    get minimumDuration() {
      var e2 = this.instance.get_property(me);
      return L(e2) ? e2 : null;
    }
    get status() {
      return this.receivedDecide ? this.isRecordingEnabled ? this._urlBlocked ? "paused" : O(this._linkedFlag) || this._linkedFlagSeen ? "trigger_pending" === this.triggerStatus ? "buffering" : M(this.isSampled) ? this.isSampled ? "sampled" : "disabled" : "active" : "buffering" : "disabled" : "buffering";
    }
    get urlTriggerStatus() {
      var e2;
      return 0 === this._urlTriggers.length ? "trigger_disabled" : (null === (e2 = this.instance) || void 0 === e2 ? void 0 : e2.get_property(Se)) === this.sessionId ? "trigger_activated" : "trigger_pending";
    }
    get eventTriggerStatus() {
      var e2;
      return 0 === this._eventTriggers.length ? "trigger_disabled" : (null === (e2 = this.instance) || void 0 === e2 ? void 0 : e2.get_property(Ee)) === this.sessionId ? "trigger_activated" : "trigger_pending";
    }
    get triggerStatus() {
      var e2 = "trigger_activated" === this.eventTriggerStatus || "trigger_activated" === this.urlTriggerStatus, t2 = "trigger_pending" === this.eventTriggerStatus || "trigger_pending" === this.urlTriggerStatus;
      return e2 ? "trigger_activated" : t2 ? "trigger_pending" : "trigger_disabled";
    }
    constructor(e2) {
      if (W(this, "queuedRRWebEvents", []), W(this, "isIdle", false), W(this, "_linkedFlagSeen", false), W(this, "_lastActivityTimestamp", Date.now()), W(this, "_linkedFlag", null), W(this, "_removePageViewCaptureHook", void 0), W(this, "_onSessionIdListener", void 0), W(this, "_persistDecideOnSessionListener", void 0), W(this, "_samplingSessionListener", void 0), W(this, "_urlTriggers", []), W(this, "_urlBlocklist", []), W(this, "_urlBlocked", false), W(this, "_eventTriggers", []), W(this, "_removeEventTriggerCaptureHook", void 0), W(this, "_forceAllowLocalhostNetworkCapture", false), W(this, "_onBeforeUnload", () => {
        this._flushBuffer();
      }), W(this, "_onOffline", () => {
        this._tryAddCustomEvent("browser offline", {});
      }), W(this, "_onOnline", () => {
        this._tryAddCustomEvent("browser online", {});
      }), W(this, "_onVisibilityChange", () => {
        if (null != a && a.visibilityState) {
          var e3 = "window " + a.visibilityState;
          this._tryAddCustomEvent(e3, {});
        }
      }), this.instance = e2, this._captureStarted = false, this._endpoint = "/s/", this.stopRrweb = void 0, this.receivedDecide = false, !this.instance.sessionManager)
        throw Yn.error("started without valid sessionManager"), new Error(Jn + " started without valid sessionManager. This is a bug.");
      if (this.instance.config.__preview_experimental_cookieless_mode)
        throw new Error(Jn + " cannot be used with __preview_experimental_cookieless_mode.");
      var { sessionId: t2, windowId: i2 } = this.sessionManager.checkAndGetSessionAndWindowId();
      this.sessionId = t2, this.windowId = i2, this.buffer = this.clearBuffer(), this.sessionIdleThresholdMilliseconds >= this.sessionManager.sessionTimeoutMs && Yn.warn("session_idle_threshold_ms (".concat(this.sessionIdleThresholdMilliseconds, ") is greater than the session timeout (").concat(this.sessionManager.sessionTimeoutMs, "). Session will never be detected as idle"));
    }
    startIfEnabledOrStop(e2) {
      this.isRecordingEnabled ? (this._startCapture(e2), null == t || t.addEventListener("beforeunload", this._onBeforeUnload), null == t || t.addEventListener("offline", this._onOffline), null == t || t.addEventListener("online", this._onOnline), null == t || t.addEventListener("visibilitychange", this._onVisibilityChange), this._setupSampling(), this._addEventTriggerListener(), O(this._removePageViewCaptureHook) && (this._removePageViewCaptureHook = this.instance.on("eventCaptured", (e3) => {
        try {
          if ("$pageview" === e3.event) {
            var t2 = null != e3 && e3.properties.$current_url ? this._maskUrl(null == e3 ? void 0 : e3.properties.$current_url) : "";
            if (!t2)
              return;
            this._tryAddCustomEvent("$pageview", { href: t2 });
          }
        } catch (e4) {
          Yn.error("Could not add $pageview to rrweb session", e4);
        }
      })), this._onSessionIdListener || (this._onSessionIdListener = this.sessionManager.onSessionId((e3, t2, i2) => {
        var n2, r2, s2, o2;
        i2 && (this._tryAddCustomEvent("$session_id_change", { sessionId: e3, windowId: t2, changeReason: i2 }), null === (n2 = this.instance) || void 0 === n2 || null === (r2 = n2.persistence) || void 0 === r2 || r2.unregister(Ee), null === (s2 = this.instance) || void 0 === s2 || null === (o2 = s2.persistence) || void 0 === o2 || o2.unregister(Se));
      }))) : this.stopRecording();
    }
    stopRecording() {
      var e2, i2, n2, r2;
      this._captureStarted && this.stopRrweb && (this.stopRrweb(), this.stopRrweb = void 0, this._captureStarted = false, null == t || t.removeEventListener("beforeunload", this._onBeforeUnload), null == t || t.removeEventListener("offline", this._onOffline), null == t || t.removeEventListener("online", this._onOnline), null == t || t.removeEventListener("visibilitychange", this._onVisibilityChange), this.clearBuffer(), clearInterval(this._fullSnapshotTimer), null === (e2 = this._removePageViewCaptureHook) || void 0 === e2 || e2.call(this), this._removePageViewCaptureHook = void 0, null === (i2 = this._removeEventTriggerCaptureHook) || void 0 === i2 || i2.call(this), this._removeEventTriggerCaptureHook = void 0, null === (n2 = this._onSessionIdListener) || void 0 === n2 || n2.call(this), this._onSessionIdListener = void 0, null === (r2 = this._samplingSessionListener) || void 0 === r2 || r2.call(this), this._samplingSessionListener = void 0, Yn.info("stopped"));
    }
    makeSamplingDecision(e2) {
      var t2, i2 = this.sessionId !== e2, n2 = this.sampleRate;
      if (L(n2)) {
        var r2, s2 = this.isSampled, o2 = i2 || !M(s2);
        if (o2)
          r2 = Math.random() < n2;
        else
          r2 = s2;
        o2 && (r2 ? this._reportStarted("sampled") : Yn.warn("Sample rate (".concat(n2, ") has determined that this sessionId (").concat(e2, ") will not be sent to the server.")), this._tryAddCustomEvent("samplingDecisionMade", { sampleRate: n2, isSampled: r2 })), null === (t2 = this.instance.persistence) || void 0 === t2 || t2.register({ [we]: r2 });
      } else {
        var a2;
        null === (a2 = this.instance.persistence) || void 0 === a2 || a2.register({ [we]: null });
      }
    }
    onRemoteConfig(e2) {
      var t2, i2, n2, r2, s2, o2;
      (this._tryAddCustomEvent("$remote_config_received", e2), this._persistRemoteConfig(e2), this._linkedFlag = (null === (t2 = e2.sessionRecording) || void 0 === t2 ? void 0 : t2.linkedFlag) || null, null !== (i2 = e2.sessionRecording) && void 0 !== i2 && i2.endpoint) && (this._endpoint = null === (o2 = e2.sessionRecording) || void 0 === o2 ? void 0 : o2.endpoint);
      if (this._setupSampling(), !O(this._linkedFlag) && !this._linkedFlagSeen) {
        var a2 = F(this._linkedFlag) ? this._linkedFlag : this._linkedFlag.flag, l2 = F(this._linkedFlag) ? null : this._linkedFlag.variant;
        this.instance.onFeatureFlags((e3, t3) => {
          var i3 = C(t3) && a2 in t3, n3 = l2 ? t3[a2] === l2 : i3;
          n3 && this._reportStarted("linked_flag_matched", { linkedFlag: a2, linkedVariant: l2 }), this._linkedFlagSeen = n3;
        });
      }
      null !== (n2 = e2.sessionRecording) && void 0 !== n2 && n2.urlTriggers && (this._urlTriggers = e2.sessionRecording.urlTriggers), null !== (r2 = e2.sessionRecording) && void 0 !== r2 && r2.urlBlocklist && (this._urlBlocklist = e2.sessionRecording.urlBlocklist), null !== (s2 = e2.sessionRecording) && void 0 !== s2 && s2.eventTriggers && (this._eventTriggers = e2.sessionRecording.eventTriggers), this.receivedDecide = true, this.startIfEnabledOrStop();
    }
    _setupSampling() {
      L(this.sampleRate) && O(this._samplingSessionListener) && (this._samplingSessionListener = this.sessionManager.onSessionId((e2) => {
        this.makeSamplingDecision(e2);
      }));
    }
    _persistRemoteConfig(e2) {
      if (this.instance.persistence) {
        var t2, i2 = this.instance.persistence, n2 = () => {
          var t3, n3, r2, s2, o2, a2, l2, u2, c2 = null === (t3 = e2.sessionRecording) || void 0 === t3 ? void 0 : t3.sampleRate, d2 = O(c2) ? null : parseFloat(c2), h2 = null === (n3 = e2.sessionRecording) || void 0 === n3 ? void 0 : n3.minimumDurationMilliseconds;
          i2.register({ [_e]: !!e2.sessionRecording, [pe]: null === (r2 = e2.sessionRecording) || void 0 === r2 ? void 0 : r2.consoleLogRecordingEnabled, [ve]: j({ capturePerformance: e2.capturePerformance }, null === (s2 = e2.sessionRecording) || void 0 === s2 ? void 0 : s2.networkPayloadCapture), [ge]: { enabled: null === (o2 = e2.sessionRecording) || void 0 === o2 ? void 0 : o2.recordCanvas, fps: null === (a2 = e2.sessionRecording) || void 0 === a2 ? void 0 : a2.canvasFps, quality: null === (l2 = e2.sessionRecording) || void 0 === l2 ? void 0 : l2.canvasQuality }, [fe]: d2, [me]: R(h2) ? null : h2, [be]: null === (u2 = e2.sessionRecording) || void 0 === u2 ? void 0 : u2.scriptConfig });
        };
        n2(), null === (t2 = this._persistDecideOnSessionListener) || void 0 === t2 || t2.call(this), this._persistDecideOnSessionListener = this.sessionManager.onSessionId(n2);
      }
    }
    log(e2) {
      var t2, i2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "log";
      null === (t2 = this.instance.sessionRecording) || void 0 === t2 || t2.onRRwebEmit({ type: 6, data: { plugin: "rrweb/console@1", payload: { level: i2, trace: [], payload: [JSON.stringify(e2)] } }, timestamp: Date.now() });
    }
    _startCapture(e2) {
      if (!R(Object.assign) && !R(Array.from) && !(this._captureStarted || this.instance.config.disable_session_recording || this.instance.consent.isOptedOut())) {
        var t2, i2;
        if (this._captureStarted = true, this.sessionManager.checkAndGetSessionAndWindowId(), this.rrwebRecord)
          this._onScriptLoaded();
        else
          null === (t2 = _.__PosthogExtensions__) || void 0 === t2 || null === (i2 = t2.loadExternalDependency) || void 0 === i2 || i2.call(t2, this.instance, this.scriptName, (e3) => {
            if (e3)
              return Yn.error("could not load recorder", e3);
            this._onScriptLoaded();
          });
        Yn.info("starting"), "active" === this.status && this._reportStarted(e2 || "recording_initialized");
      }
    }
    get scriptName() {
      var e2, t2, i2;
      return (null === (e2 = this.instance) || void 0 === e2 || null === (t2 = e2.persistence) || void 0 === t2 || null === (i2 = t2.get_property(be)) || void 0 === i2 ? void 0 : i2.script) || "recorder";
    }
    isInteractiveEvent(e2) {
      var t2;
      return 3 === e2.type && -1 !== Xn.indexOf(null === (t2 = e2.data) || void 0 === t2 ? void 0 : t2.source);
    }
    _updateWindowAndSessionIds(e2) {
      var t2 = this.isInteractiveEvent(e2);
      t2 || this.isIdle || e2.timestamp - this._lastActivityTimestamp > this.sessionIdleThresholdMilliseconds && (this.isIdle = true, clearInterval(this._fullSnapshotTimer), this._tryAddCustomEvent("sessionIdle", { eventTimestamp: e2.timestamp, lastActivityTimestamp: this._lastActivityTimestamp, threshold: this.sessionIdleThresholdMilliseconds, bufferLength: this.buffer.data.length, bufferSize: this.buffer.size }), this._flushBuffer());
      var i2 = false;
      if (t2 && (this._lastActivityTimestamp = e2.timestamp, this.isIdle && (this.isIdle = false, this._tryAddCustomEvent("sessionNoLongerIdle", { reason: "user activity", type: e2.type }), i2 = true)), !this.isIdle) {
        var { windowId: n2, sessionId: r2 } = this.sessionManager.checkAndGetSessionAndWindowId(!t2, e2.timestamp), s2 = this.sessionId !== r2, o2 = this.windowId !== n2;
        this.windowId = n2, this.sessionId = r2, s2 || o2 ? (this.stopRecording(), this.startIfEnabledOrStop("session_id_changed")) : i2 && this._scheduleFullSnapshot();
      }
    }
    _tryRRWebMethod(e2) {
      try {
        return e2.rrwebMethod(), true;
      } catch (t2) {
        return this.queuedRRWebEvents.length < 10 ? this.queuedRRWebEvents.push({ enqueuedAt: e2.enqueuedAt || Date.now(), attempt: e2.attempt++, rrwebMethod: e2.rrwebMethod }) : Yn.warn("could not emit queued rrweb event.", t2, e2), false;
      }
    }
    _tryAddCustomEvent(e2, t2) {
      return this._tryRRWebMethod(Qn(() => this.rrwebRecord.addCustomEvent(e2, t2)));
    }
    _tryTakeFullSnapshot() {
      return this._tryRRWebMethod(Qn(() => this.rrwebRecord.takeFullSnapshot()));
    }
    _onScriptLoaded() {
      var e2, t2 = { blockClass: "ph-no-capture", blockSelector: void 0, ignoreClass: "ph-ignore-input", maskTextClass: "ph-mask", maskTextSelector: void 0, maskTextFn: void 0, maskAllInputs: true, maskInputOptions: { password: true }, maskInputFn: void 0, slimDOMOptions: {}, collectFonts: false, inlineStylesheet: true, recordCrossOriginIframes: false }, i2 = this.instance.config.session_recording;
      for (var [n2, r2] of Object.entries(i2 || {}))
        n2 in t2 && ("maskInputOptions" === n2 ? t2.maskInputOptions = j({ password: true }, r2) : t2[n2] = r2);
      if (this.canvasRecording && this.canvasRecording.enabled && (t2.recordCanvas = true, t2.sampling = { canvas: this.canvasRecording.fps }, t2.dataURLOptions = { type: "image/webp", quality: this.canvasRecording.quality }), this.rrwebRecord) {
        this.mutationRateLimiter = null !== (e2 = this.mutationRateLimiter) && void 0 !== e2 ? e2 : new un(this.rrwebRecord, { refillRate: this.instance.config.session_recording.__mutationRateLimiterRefillRate, bucketSize: this.instance.config.session_recording.__mutationRateLimiterBucketSize, onBlockedNode: (e3, t3) => {
          var i3 = "Too many mutations on node '".concat(e3, "'. Rate limiting. This could be due to SVG animations or something similar");
          Yn.info(i3, { node: t3 }), this.log(Jn + " " + i3, "warn");
        } });
        var s2 = this._gatherRRWebPlugins();
        this.stopRrweb = this.rrwebRecord(j({ emit: (e3) => {
          this.onRRwebEmit(e3);
        }, plugins: s2 }, t2)), this._lastActivityTimestamp = Date.now(), this.isIdle = false, this._tryAddCustomEvent("$session_options", { sessionRecordingOptions: t2, activePlugins: s2.map((e3) => null == e3 ? void 0 : e3.name) }), this._tryAddCustomEvent("$posthog_config", { config: this.instance.config });
      } else
        Yn.error("onScriptLoaded was called but rrwebRecord is not available. This indicates something has gone wrong.");
    }
    _scheduleFullSnapshot() {
      if (this._fullSnapshotTimer && clearInterval(this._fullSnapshotTimer), !this.isIdle) {
        var e2 = this.fullSnapshotIntervalMillis;
        e2 && (this._fullSnapshotTimer = setInterval(() => {
          this._tryTakeFullSnapshot();
        }, e2));
      }
    }
    _gatherRRWebPlugins() {
      var e2, t2, i2, n2, r2 = [], s2 = null === (e2 = _.__PosthogExtensions__) || void 0 === e2 || null === (t2 = e2.rrwebPlugins) || void 0 === t2 ? void 0 : t2.getRecordConsolePlugin;
      s2 && this.isConsoleLogCaptureEnabled && r2.push(s2());
      var o2 = null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (n2 = i2.rrwebPlugins) || void 0 === n2 ? void 0 : n2.getRecordNetworkPlugin;
      this.networkPayloadCapture && I(o2) && (!pt.includes(location.hostname) || this._forceAllowLocalhostNetworkCapture ? r2.push(o2(an(this.instance.config, this.networkPayloadCapture))) : Yn.info("NetworkCapture not started because we are on localhost."));
      return r2;
    }
    onRRwebEmit(e2) {
      var t2;
      if (this._processQueuedEvents(), e2 && C(e2)) {
        if (e2.type === Si.Meta) {
          var i2 = this._maskUrl(e2.data.href);
          if (this._lastHref = i2, !i2)
            return;
          e2.data.href = i2;
        } else
          this._pageViewFallBack();
        if (this._checkUrlTriggerConditions(), "paused" !== this.status || function(e3) {
          return e3.type === Si.Custom && "recording paused" === e3.data.tag;
        }(e2)) {
          e2.type === Si.FullSnapshot && this._scheduleFullSnapshot(), e2.type === Si.FullSnapshot && "trigger_pending" === this.triggerStatus && this.clearBuffer();
          var n2 = this.mutationRateLimiter ? this.mutationRateLimiter.throttleMutations(e2) : e2;
          if (n2) {
            var r2 = function(e3) {
              var t3 = e3;
              if (t3 && C(t3) && 6 === t3.type && C(t3.data) && "rrweb/console@1" === t3.data.plugin) {
                t3.data.payload.payload.length > 10 && (t3.data.payload.payload = t3.data.payload.payload.slice(0, 10), t3.data.payload.payload.push("...[truncated]"));
                for (var i3 = [], n3 = 0; n3 < t3.data.payload.payload.length; n3++)
                  t3.data.payload.payload[n3] && t3.data.payload.payload[n3].length > 2e3 ? i3.push(t3.data.payload.payload[n3].slice(0, 2e3) + "...[truncated]") : i3.push(t3.data.payload.payload[n3]);
                return t3.data.payload.payload = i3, e3;
              }
              return e3;
            }(n2);
            if (this._updateWindowAndSessionIds(r2), !this.isIdle || er(r2)) {
              if (er(r2)) {
                var s2 = r2.data.payload;
                if (s2) {
                  var o2 = s2.lastActivityTimestamp, a2 = s2.threshold;
                  r2.timestamp = o2 + a2;
                }
              }
              var l2 = null === (t2 = this.instance.config.session_recording.compress_events) || void 0 === t2 || t2 ? function(e3) {
                if (yi(e3) < 1024)
                  return e3;
                try {
                  if (e3.type === Si.FullSnapshot)
                    return j(j({}, e3), {}, { data: Zn(e3.data), cv: "2024-10" });
                  if (e3.type === Si.IncrementalSnapshot && e3.data.source === Ei.Mutation)
                    return j(j({}, e3), {}, { cv: "2024-10", data: j(j({}, e3.data), {}, { texts: Zn(e3.data.texts), attributes: Zn(e3.data.attributes), removes: Zn(e3.data.removes), adds: Zn(e3.data.adds) }) });
                  if (e3.type === Si.IncrementalSnapshot && e3.data.source === Ei.StyleSheetRule)
                    return j(j({}, e3), {}, { cv: "2024-10", data: j(j({}, e3.data), {}, { adds: Zn(e3.data.adds), removes: Zn(e3.data.removes) }) });
                } catch (e4) {
                  Yn.error("could not compress event - will use uncompressed event", e4);
                }
                return e3;
              }(r2) : r2, u2 = { $snapshot_bytes: yi(l2), $snapshot_data: l2, $session_id: this.sessionId, $window_id: this.windowId };
              "disabled" !== this.status ? this._captureSnapshotBuffered(u2) : this.clearBuffer();
            }
          }
        }
      }
    }
    _pageViewFallBack() {
      if (!this.instance.config.capture_pageview && t) {
        var e2 = this._maskUrl(t.location.href);
        this._lastHref !== e2 && (this._tryAddCustomEvent("$url_changed", { href: e2 }), this._lastHref = e2);
      }
    }
    _processQueuedEvents() {
      if (this.queuedRRWebEvents.length) {
        var e2 = [...this.queuedRRWebEvents];
        this.queuedRRWebEvents = [], e2.forEach((e3) => {
          Date.now() - e3.enqueuedAt <= 2e3 && this._tryRRWebMethod(e3);
        });
      }
    }
    _maskUrl(e2) {
      var t2 = this.instance.config.session_recording;
      if (t2.maskNetworkRequestFn) {
        var i2, n2 = { url: e2 };
        return null === (i2 = n2 = t2.maskNetworkRequestFn(n2)) || void 0 === i2 ? void 0 : i2.url;
      }
      return e2;
    }
    clearBuffer() {
      return this.buffer = { size: 0, data: [], sessionId: this.sessionId, windowId: this.windowId }, this.buffer;
    }
    _flushBuffer() {
      this.flushBufferTimer && (clearTimeout(this.flushBufferTimer), this.flushBufferTimer = void 0);
      var e2 = this.minimumDuration, t2 = this.sessionDuration, i2 = L(t2) && t2 >= 0, n2 = L(e2) && i2 && t2 < e2;
      if ("buffering" === this.status || "paused" === this.status || n2)
        return this.flushBufferTimer = setTimeout(() => {
          this._flushBuffer();
        }, 2e3), this.buffer;
      this.buffer.data.length > 0 && wi(this.buffer).forEach((e3) => {
        this._captureSnapshot({ $snapshot_bytes: e3.size, $snapshot_data: e3.data, $session_id: e3.sessionId, $window_id: e3.windowId, $lib: "web", $lib_version: p.LIB_VERSION });
      });
      return this.clearBuffer();
    }
    _captureSnapshotBuffered(e2) {
      var t2, i2 = 2 + ((null === (t2 = this.buffer) || void 0 === t2 ? void 0 : t2.data.length) || 0);
      !this.isIdle && (this.buffer.size + e2.$snapshot_bytes + i2 > 943718.4 || this.buffer.sessionId !== this.sessionId) && (this.buffer = this._flushBuffer()), this.buffer.size += e2.$snapshot_bytes, this.buffer.data.push(e2.$snapshot_data), this.flushBufferTimer || this.isIdle || (this.flushBufferTimer = setTimeout(() => {
        this._flushBuffer();
      }, 2e3));
    }
    _captureSnapshot(e2) {
      this.instance.capture("$snapshot", e2, { _url: this.instance.requestRouter.endpointFor("api", this._endpoint), _noTruncate: true, _batchKey: "recordings", skip_client_rate_limiting: true });
    }
    _checkUrlTriggerConditions() {
      if (void 0 !== t && t.location.href) {
        var e2 = t.location.href, i2 = "paused" === this.status, n2 = tr(e2, this._urlBlocklist);
        n2 && !i2 ? this._pauseRecording() : !n2 && i2 && this._resumeRecording(), tr(e2, this._urlTriggers) && this._activateTrigger("url");
      }
    }
    _activateTrigger(e2) {
      var t2, i2;
      "trigger_pending" === this.triggerStatus && (null === (t2 = this.instance) || void 0 === t2 || null === (i2 = t2.persistence) || void 0 === i2 || i2.register({ ["url" === e2 ? Se : Ee]: this.sessionId }), this._flushBuffer(), this._reportStarted(e2 + "_trigger_matched"));
    }
    _pauseRecording() {
      "paused" !== this.status && (this._urlBlocked = true, clearInterval(this._fullSnapshotTimer), Yn.info("recording paused due to URL blocker"), this._tryAddCustomEvent("recording paused", { reason: "url blocker" }));
    }
    _resumeRecording() {
      "paused" === this.status && (this._urlBlocked = false, this._tryTakeFullSnapshot(), this._scheduleFullSnapshot(), this._tryAddCustomEvent("recording resumed", { reason: "left blocked url" }), Yn.info("recording resumed"));
    }
    _addEventTriggerListener() {
      0 !== this._eventTriggers.length && O(this._removeEventTriggerCaptureHook) && (this._removeEventTriggerCaptureHook = this.instance.on("eventCaptured", (e2) => {
        try {
          this._eventTriggers.includes(e2.event) && this._activateTrigger("event");
        } catch (e3) {
          Yn.error("Could not activate event trigger", e3);
        }
      }));
    }
    overrideLinkedFlag() {
      this._linkedFlagSeen = true, this._reportStarted("linked_flag_overridden");
    }
    overrideSampling() {
      var e2;
      null === (e2 = this.instance.persistence) || void 0 === e2 || e2.register({ [we]: true }), this._reportStarted("sampling_overridden");
    }
    overrideTrigger(e2) {
      this._activateTrigger(e2);
    }
    _reportStarted(e2, t2) {
      this.instance.register_for_session({ $session_recording_start_reason: e2 }), Yn.info(e2.replace("_", " "), t2), m(["recording_initialized", "session_id_changed"], e2) || this._tryAddCustomEvent(e2, t2);
    }
  };
  var nr = B("[RemoteConfig]");
  var rr = class {
    constructor(e2) {
      this.instance = e2;
    }
    get remoteConfig() {
      var e2, t2;
      return null === (e2 = _._POSTHOG_REMOTE_CONFIG) || void 0 === e2 || null === (t2 = e2[this.instance.config.token]) || void 0 === t2 ? void 0 : t2.config;
    }
    _loadRemoteConfigJs(e2) {
      var t2, i2, n2;
      null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.loadExternalDependency ? null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (n2 = i2.loadExternalDependency) || void 0 === n2 || n2.call(i2, this.instance, "remote-config", () => e2(this.remoteConfig)) : (nr.error("PostHog Extensions not found. Cannot load remote config."), e2());
    }
    _loadRemoteConfigJSON(e2) {
      this.instance._send_request({ method: "GET", url: this.instance.requestRouter.endpointFor("assets", "/array/".concat(this.instance.config.token, "/config")), callback: (t2) => {
        e2(t2.json);
      } });
    }
    load() {
      try {
        if (this.remoteConfig)
          return nr.info("Using preloaded remote config", this.remoteConfig), void this.onRemoteConfig(this.remoteConfig);
        if (this.instance.config.advanced_disable_decide)
          return void nr.warn("Remote config is disabled. Falling back to local config.");
        this._loadRemoteConfigJs((e2) => {
          if (!e2)
            return nr.info("No config found after loading remote JS config. Falling back to JSON."), void this._loadRemoteConfigJSON((e3) => {
              this.onRemoteConfig(e3);
            });
          this.onRemoteConfig(e2);
        });
      } catch (e2) {
        nr.error("Error loading remote config", e2);
      }
    }
    onRemoteConfig(e2) {
      e2 ? this.instance.config.__preview_remote_config ? (this.instance._onRemoteConfig(e2), false !== e2.hasFeatureFlags && this.instance.featureFlags.ensureFlagsLoaded()) : nr.info("__preview_remote_config is disabled. Logging config instead", e2) : nr.error("Failed to fetch remote config from PostHog.");
    }
  };
  var sr;
  var or = null != t && t.location ? bt(t.location.hash, "__posthog") || bt(location.hash, "state") : null;
  var ar = "_postHogToolbarParams";
  !function(e2) {
    e2[e2.UNINITIALIZED = 0] = "UNINITIALIZED", e2[e2.LOADING = 1] = "LOADING", e2[e2.LOADED = 2] = "LOADED";
  }(sr || (sr = {}));
  var lr = class {
    constructor(e2) {
      this.instance = e2;
    }
    setToolbarState(e2) {
      _.ph_toolbar_state = e2;
    }
    getToolbarState() {
      var e2;
      return null !== (e2 = _.ph_toolbar_state) && void 0 !== e2 ? e2 : sr.UNINITIALIZED;
    }
    maybeLoadToolbar() {
      var e2, i2, n2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0, r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0, s2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0;
      if (!t || !a)
        return false;
      n2 = null !== (e2 = n2) && void 0 !== e2 ? e2 : t.location, s2 = null !== (i2 = s2) && void 0 !== i2 ? i2 : t.history;
      try {
        if (!r2) {
          try {
            t.localStorage.setItem("test", "test"), t.localStorage.removeItem("test");
          } catch (e3) {
            return false;
          }
          r2 = null == t ? void 0 : t.localStorage;
        }
        var o2, l2 = or || bt(n2.hash, "__posthog") || bt(n2.hash, "state"), u2 = l2 ? Q(() => JSON.parse(atob(decodeURIComponent(l2)))) || Q(() => JSON.parse(decodeURIComponent(l2))) : null;
        return u2 && "ph_authorize" === u2.action ? ((o2 = u2).source = "url", o2 && Object.keys(o2).length > 0 && (u2.desiredHash ? n2.hash = u2.desiredHash : s2 ? s2.replaceState(s2.state, "", n2.pathname + n2.search) : n2.hash = "")) : ((o2 = JSON.parse(r2.getItem(ar) || "{}")).source = "localstorage", delete o2.userIntent), !(!o2.token || this.instance.config.token !== o2.token) && (this.loadToolbar(o2), true);
      } catch (e3) {
        return false;
      }
    }
    _callLoadToolbar(e2) {
      (_.ph_load_toolbar || _.ph_load_editor)(e2, this.instance);
    }
    loadToolbar(e2) {
      var i2 = !(null == a || !a.getElementById(Ne));
      if (!t || i2)
        return false;
      var n2 = "custom" === this.instance.requestRouter.region && this.instance.config.advanced_disable_toolbar_metrics, r2 = j(j({ token: this.instance.config.token }, e2), {}, { apiURL: this.instance.requestRouter.endpointFor("ui") }, n2 ? { instrument: false } : {});
      if (t.localStorage.setItem(ar, JSON.stringify(j(j({}, r2), {}, { source: void 0 }))), this.getToolbarState() === sr.LOADED)
        this._callLoadToolbar(r2);
      else if (this.getToolbarState() === sr.UNINITIALIZED) {
        var s2, o2;
        this.setToolbarState(sr.LOADING), null === (s2 = _.__PosthogExtensions__) || void 0 === s2 || null === (o2 = s2.loadExternalDependency) || void 0 === o2 || o2.call(s2, this.instance, "toolbar", (e3) => {
          if (e3)
            return q.error("[Toolbar] Failed to load", e3), void this.setToolbarState(sr.UNINITIALIZED);
          this.setToolbarState(sr.LOADED), this._callLoadToolbar(r2);
        }), ie(t, "turbolinks:load", () => {
          this.setToolbarState(sr.UNINITIALIZED), this.loadToolbar(r2);
        });
      }
      return true;
    }
    _loadEditor(e2) {
      return this.loadToolbar(e2);
    }
    maybeLoadEditor() {
      var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0, t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0, i2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0;
      return this.maybeLoadToolbar(e2, t2, i2);
    }
  };
  var ur = class {
    constructor(e2) {
      W(this, "isPaused", true), W(this, "queue", []), W(this, "flushTimeoutMs", 3e3), this.sendRequest = e2;
    }
    enqueue(e2) {
      this.queue.push(e2), this.flushTimeout || this.setFlushTimeout();
    }
    unload() {
      this.clearFlushTimeout();
      var e2 = this.queue.length > 0 ? this.formatQueue() : {}, t2 = Object.values(e2), i2 = [...t2.filter((e3) => 0 === e3.url.indexOf("/e")), ...t2.filter((e3) => 0 !== e3.url.indexOf("/e"))];
      i2.map((e3) => {
        this.sendRequest(j(j({}, e3), {}, { transport: "sendBeacon" }));
      });
    }
    enable() {
      this.isPaused = false, this.setFlushTimeout();
    }
    setFlushTimeout() {
      var e2 = this;
      this.isPaused || (this.flushTimeout = setTimeout(() => {
        if (this.clearFlushTimeout(), this.queue.length > 0) {
          var t2 = this.formatQueue(), i2 = function(i3) {
            var n3 = t2[i3], r2 = new Date().getTime();
            n3.data && x(n3.data) && Y(n3.data, (e3) => {
              e3.offset = Math.abs(e3.timestamp - r2), delete e3.timestamp;
            }), e2.sendRequest(n3);
          };
          for (var n2 in t2)
            i2(n2);
        }
      }, this.flushTimeoutMs));
    }
    clearFlushTimeout() {
      clearTimeout(this.flushTimeout), this.flushTimeout = void 0;
    }
    formatQueue() {
      var e2 = {};
      return Y(this.queue, (t2) => {
        var i2, n2 = t2, r2 = (n2 ? n2.batchKey : null) || n2.url;
        R(e2[r2]) && (e2[r2] = j(j({}, n2), {}, { data: [] })), null === (i2 = e2[r2].data) || void 0 === i2 || i2.push(n2.data);
      }), this.queue = [], e2;
    }
  };
  var cr = function(e2) {
    var t2, i2, n2, r2, s2 = "";
    for (t2 = i2 = 0, n2 = (e2 = (e2 + "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")).length, r2 = 0; r2 < n2; r2++) {
      var o2 = e2.charCodeAt(r2), a2 = null;
      o2 < 128 ? i2++ : a2 = o2 > 127 && o2 < 2048 ? String.fromCharCode(o2 >> 6 | 192, 63 & o2 | 128) : String.fromCharCode(o2 >> 12 | 224, o2 >> 6 & 63 | 128, 63 & o2 | 128), $(a2) || (i2 > t2 && (s2 += e2.substring(t2, i2)), s2 += a2, t2 = i2 = r2 + 1);
    }
    return i2 > t2 && (s2 += e2.substring(t2, e2.length)), s2;
  };
  var dr = !!c || !!u;
  var hr = "text/plain";
  var _r = (e2, t2) => {
    var [i2, n2] = e2.split("?"), r2 = j({}, t2);
    null == n2 || n2.split("&").forEach((e3) => {
      var [t3] = e3.split("=");
      delete r2[t3];
    });
    var s2 = ft(r2);
    return s2 = s2 ? (n2 ? n2 + "&" : "") + s2 : n2, "".concat(i2, "?").concat(s2);
  };
  var pr = (e2, t2) => JSON.stringify(e2, (e3, t3) => "bigint" == typeof t3 ? t3.toString() : t3, t2);
  var vr = (t2) => {
    var { data: i2, compression: n2 } = t2;
    if (i2) {
      if (n2 === e.GZipJS) {
        var r2 = Gn(Vn(pr(i2)), { mtime: 0 }), s2 = new Blob([r2], { type: hr });
        return { contentType: hr, body: s2, estimatedSize: s2.size };
      }
      if (n2 === e.Base64) {
        var o2 = function(e2) {
          var t3, i3, n3, r3, s3, o3 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", a3 = 0, l3 = 0, u2 = "", c2 = [];
          if (!e2)
            return e2;
          e2 = cr(e2);
          do {
            t3 = (s3 = e2.charCodeAt(a3++) << 16 | e2.charCodeAt(a3++) << 8 | e2.charCodeAt(a3++)) >> 18 & 63, i3 = s3 >> 12 & 63, n3 = s3 >> 6 & 63, r3 = 63 & s3, c2[l3++] = o3.charAt(t3) + o3.charAt(i3) + o3.charAt(n3) + o3.charAt(r3);
          } while (a3 < e2.length);
          switch (u2 = c2.join(""), e2.length % 3) {
            case 1:
              u2 = u2.slice(0, -2) + "==";
              break;
            case 2:
              u2 = u2.slice(0, -1) + "=";
          }
          return u2;
        }(pr(i2)), a2 = ((e2) => "data=" + encodeURIComponent("string" == typeof e2 ? e2 : pr(e2)))(o2);
        return { contentType: "application/x-www-form-urlencoded", body: a2, estimatedSize: new Blob([a2]).size };
      }
      var l2 = pr(i2);
      return { contentType: "application/json", body: l2, estimatedSize: new Blob([l2]).size };
    }
  };
  var gr = [];
  u && gr.push({ transport: "fetch", method: (e2) => {
    var t2, i2, { contentType: n2, body: r2, estimatedSize: s2 } = null !== (t2 = vr(e2)) && void 0 !== t2 ? t2 : {}, o2 = new Headers();
    Y(e2.headers, function(e3, t3) {
      o2.append(t3, e3);
    }), n2 && o2.append("Content-Type", n2);
    var a2 = e2.url, l2 = null;
    if (d) {
      var c2 = new d();
      l2 = { signal: c2.signal, timeout: setTimeout(() => c2.abort(), e2.timeout) };
    }
    u(a2, j({ method: (null == e2 ? void 0 : e2.method) || "GET", headers: o2, keepalive: "POST" === e2.method && (s2 || 0) < 52428.8, body: r2, signal: null === (i2 = l2) || void 0 === i2 ? void 0 : i2.signal }, e2.fetchOptions)).then((t3) => t3.text().then((i3) => {
      var n3, r3 = { statusCode: t3.status, text: i3 };
      if (200 === t3.status)
        try {
          r3.json = JSON.parse(i3);
        } catch (e3) {
          q.error(e3);
        }
      null === (n3 = e2.callback) || void 0 === n3 || n3.call(e2, r3);
    })).catch((t3) => {
      var i3;
      q.error(t3), null === (i3 = e2.callback) || void 0 === i3 || i3.call(e2, { statusCode: 0, text: t3 });
    }).finally(() => l2 ? clearTimeout(l2.timeout) : null);
  } }), c && gr.push({ transport: "XHR", method: (e2) => {
    var t2, i2 = new c();
    i2.open(e2.method || "GET", e2.url, true);
    var { contentType: n2, body: r2 } = null !== (t2 = vr(e2)) && void 0 !== t2 ? t2 : {};
    Y(e2.headers, function(e3, t3) {
      i2.setRequestHeader(t3, e3);
    }), n2 && i2.setRequestHeader("Content-Type", n2), e2.timeout && (i2.timeout = e2.timeout), i2.withCredentials = true, i2.onreadystatechange = () => {
      if (4 === i2.readyState) {
        var t3, n3 = { statusCode: i2.status, text: i2.responseText };
        if (200 === i2.status)
          try {
            n3.json = JSON.parse(i2.responseText);
          } catch (e3) {
          }
        null === (t3 = e2.callback) || void 0 === t3 || t3.call(e2, n3);
      }
    }, i2.send(r2);
  } }), null != o && o.sendBeacon && gr.push({ transport: "sendBeacon", method: (e2) => {
    var t2 = _r(e2.url, { beacon: "1" });
    try {
      var i2, { contentType: n2, body: r2 } = null !== (i2 = vr(e2)) && void 0 !== i2 ? i2 : {}, s2 = "string" == typeof r2 ? new Blob([r2], { type: n2 }) : r2;
      o.sendBeacon(t2, s2);
    } catch (e3) {
    }
  } });
  var fr = ["retriesPerformedSoFar"];
  var mr = class {
    constructor(e2) {
      W(this, "isPolling", false), W(this, "pollIntervalMs", 3e3), W(this, "queue", []), this.instance = e2, this.queue = [], this.areWeOnline = true, !R(t) && "onLine" in t.navigator && (this.areWeOnline = t.navigator.onLine, t.addEventListener("online", () => {
        this.areWeOnline = true, this.flush();
      }), t.addEventListener("offline", () => {
        this.areWeOnline = false;
      }));
    }
    retriableRequest(e2) {
      var { retriesPerformedSoFar: t2 } = e2, i2 = G(e2, fr);
      L(t2) && t2 > 0 && (i2.url = _r(i2.url, { retry_count: t2 })), this.instance._send_request(j(j({}, i2), {}, { callback: (e3) => {
        var n2;
        200 !== e3.statusCode && (e3.statusCode < 400 || e3.statusCode >= 500) && (null != t2 ? t2 : 0) < 10 ? this.enqueue(j({ retriesPerformedSoFar: t2 }, i2)) : null === (n2 = i2.callback) || void 0 === n2 || n2.call(i2, e3);
      } }));
    }
    enqueue(e2) {
      var t2 = e2.retriesPerformedSoFar || 0;
      e2.retriesPerformedSoFar = t2 + 1;
      var i2 = function(e3) {
        var t3 = 3e3 * Math.pow(2, e3), i3 = t3 / 2, n3 = Math.min(18e5, t3), r3 = (Math.random() - 0.5) * (n3 - i3);
        return Math.ceil(n3 + r3);
      }(t2), n2 = Date.now() + i2;
      this.queue.push({ retryAt: n2, requestOptions: e2 });
      var r2 = "Enqueued failed request for retry in ".concat(i2);
      navigator.onLine || (r2 += " (Browser is offline)"), q.warn(r2), this.isPolling || (this.isPolling = true, this.poll());
    }
    poll() {
      this.poller && clearTimeout(this.poller), this.poller = setTimeout(() => {
        this.areWeOnline && this.queue.length > 0 && this.flush(), this.poll();
      }, this.pollIntervalMs);
    }
    flush() {
      var e2 = Date.now(), t2 = [], i2 = this.queue.filter((i3) => i3.retryAt < e2 || (t2.push(i3), false));
      if (this.queue = t2, i2.length > 0)
        for (var { requestOptions: n2 } of i2)
          this.retriableRequest(n2);
    }
    unload() {
      for (var { requestOptions: e2 } of (this.poller && (clearTimeout(this.poller), this.poller = void 0), this.queue))
        try {
          this.instance._send_request(j(j({}, e2), {}, { transport: "sendBeacon" }));
        } catch (e3) {
          q.error(e3);
        }
      this.queue = [];
    }
  };
  var br;
  var yr = B("[SessionId]");
  var wr = class {
    constructor(e2, t2, i2) {
      var n2;
      if (W(this, "_sessionIdChangedHandlers", []), !e2.persistence)
        throw new Error("SessionIdManager requires a PostHogPersistence instance");
      if (e2.config.__preview_experimental_cookieless_mode)
        throw new Error("SessionIdManager cannot be used with __preview_experimental_cookieless_mode");
      this.config = e2.config, this.persistence = e2.persistence, this._windowId = void 0, this._sessionId = void 0, this._sessionStartTimestamp = null, this._sessionActivityTimestamp = null, this._sessionIdGenerator = t2 || Ze, this._windowIdGenerator = i2 || Ze;
      var r2 = this.config.persistence_name || this.config.token, s2 = this.config.session_idle_timeout_seconds || 1800;
      if (this._sessionTimeoutMs = 1e3 * ln(s2, 60, 36e3, "session_idle_timeout_seconds", 1800), e2.register({ $configured_session_timeout_ms: this._sessionTimeoutMs }), this.resetIdleTimer(), this._window_id_storage_key = "ph_" + r2 + "_window_id", this._primary_window_exists_storage_key = "ph_" + r2 + "_primary_window_exists", this._canUseSessionStorage()) {
        var o2 = _t.parse(this._window_id_storage_key), a2 = _t.parse(this._primary_window_exists_storage_key);
        o2 && !a2 ? this._windowId = o2 : _t.remove(this._window_id_storage_key), _t.set(this._primary_window_exists_storage_key, true);
      }
      if (null !== (n2 = this.config.bootstrap) && void 0 !== n2 && n2.sessionID)
        try {
          var l2 = ((e3) => {
            var t3 = e3.replace(/-/g, "");
            if (32 !== t3.length)
              throw new Error("Not a valid UUID");
            if ("7" !== t3[12])
              throw new Error("Not a UUIDv7");
            return parseInt(t3.substring(0, 12), 16);
          })(this.config.bootstrap.sessionID);
          this._setSessionId(this.config.bootstrap.sessionID, new Date().getTime(), l2);
        } catch (e3) {
          yr.error("Invalid sessionID in bootstrap", e3);
        }
      this._listenToReloadWindow();
    }
    get sessionTimeoutMs() {
      return this._sessionTimeoutMs;
    }
    onSessionId(e2) {
      return R(this._sessionIdChangedHandlers) && (this._sessionIdChangedHandlers = []), this._sessionIdChangedHandlers.push(e2), this._sessionId && e2(this._sessionId, this._windowId), () => {
        this._sessionIdChangedHandlers = this._sessionIdChangedHandlers.filter((t2) => t2 !== e2);
      };
    }
    _canUseSessionStorage() {
      return "memory" !== this.config.persistence && !this.persistence.disabled && _t.is_supported();
    }
    _setWindowId(e2) {
      e2 !== this._windowId && (this._windowId = e2, this._canUseSessionStorage() && _t.set(this._window_id_storage_key, e2));
    }
    _getWindowId() {
      return this._windowId ? this._windowId : this._canUseSessionStorage() ? _t.parse(this._window_id_storage_key) : null;
    }
    _setSessionId(e2, t2, i2) {
      e2 === this._sessionId && t2 === this._sessionActivityTimestamp && i2 === this._sessionStartTimestamp || (this._sessionStartTimestamp = i2, this._sessionActivityTimestamp = t2, this._sessionId = e2, this.persistence.register({ [ye]: [t2, e2, i2] }));
    }
    _getSessionId() {
      if (this._sessionId && this._sessionActivityTimestamp && this._sessionStartTimestamp)
        return [this._sessionActivityTimestamp, this._sessionId, this._sessionStartTimestamp];
      var e2 = this.persistence.props[ye];
      return x(e2) && 2 === e2.length && e2.push(e2[0]), e2 || [0, null, 0];
    }
    resetSessionId() {
      this._setSessionId(null, null, null);
    }
    _listenToReloadWindow() {
      null == t || t.addEventListener("beforeunload", () => {
        this._canUseSessionStorage() && _t.remove(this._primary_window_exists_storage_key);
      });
    }
    checkAndGetSessionAndWindowId() {
      var e2 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0], t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null;
      if (this.config.__preview_experimental_cookieless_mode)
        throw new Error("checkAndGetSessionAndWindowId should not be called in __preview_experimental_cookieless_mode");
      var i2 = t2 || new Date().getTime(), [n2, r2, s2] = this._getSessionId(), o2 = this._getWindowId(), a2 = L(s2) && s2 > 0 && Math.abs(i2 - s2) > 864e5, l2 = false, u2 = !r2, c2 = !e2 && Math.abs(i2 - n2) > this.sessionTimeoutMs;
      u2 || c2 || a2 ? (r2 = this._sessionIdGenerator(), o2 = this._windowIdGenerator(), yr.info("new session ID generated", { sessionId: r2, windowId: o2, changeReason: { noSessionId: u2, activityTimeout: c2, sessionPastMaximumLength: a2 } }), s2 = i2, l2 = true) : o2 || (o2 = this._windowIdGenerator(), l2 = true);
      var d2 = 0 === n2 || !e2 || a2 ? i2 : n2, h2 = 0 === s2 ? new Date().getTime() : s2;
      return this._setWindowId(o2), this._setSessionId(r2, d2, h2), e2 || this.resetIdleTimer(), l2 && this._sessionIdChangedHandlers.forEach((e3) => e3(r2, o2, l2 ? { noSessionId: u2, activityTimeout: c2, sessionPastMaximumLength: a2 } : void 0)), { sessionId: r2, windowId: o2, sessionStartTimestamp: h2, changeReason: l2 ? { noSessionId: u2, activityTimeout: c2, sessionPastMaximumLength: a2 } : void 0, lastActivityTimestamp: n2 };
    }
    resetIdleTimer() {
      clearTimeout(this._enforceIdleTimeout), this._enforceIdleTimeout = setTimeout(() => {
        this.resetSessionId();
      }, 1.1 * this.sessionTimeoutMs);
    }
  };
  !function(e2) {
    e2.US = "us", e2.EU = "eu", e2.CUSTOM = "custom";
  }(br || (br = {}));
  var Sr = "i.posthog.com";
  var Er = class {
    constructor(e2) {
      W(this, "_regionCache", {}), this.instance = e2;
    }
    get apiHost() {
      var e2 = this.instance.config.api_host.trim().replace(/\/$/, "");
      return "https://app.posthog.com" === e2 ? "https://us.i.posthog.com" : e2;
    }
    get uiHost() {
      var e2, t2 = null === (e2 = this.instance.config.ui_host) || void 0 === e2 ? void 0 : e2.replace(/\/$/, "");
      return t2 || (t2 = this.apiHost.replace(".".concat(Sr), ".posthog.com")), "https://app.posthog.com" === t2 ? "https://us.posthog.com" : t2;
    }
    get region() {
      return this._regionCache[this.apiHost] || (/https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? this._regionCache[this.apiHost] = br.US : /https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? this._regionCache[this.apiHost] = br.EU : this._regionCache[this.apiHost] = br.CUSTOM), this._regionCache[this.apiHost];
    }
    endpointFor(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "";
      if (t2 && (t2 = "/" === t2[0] ? t2 : "/".concat(t2)), "ui" === e2)
        return this.uiHost + t2;
      if (this.region === br.CUSTOM)
        return this.apiHost + t2;
      var i2 = Sr + t2;
      switch (e2) {
        case "assets":
          return "https://".concat(this.region, "-assets.").concat(i2);
        case "api":
          return "https://".concat(this.region, ".").concat(i2);
      }
    }
  };
  var kr = "posthog-js";
  function xr(e2) {
    var { organization: t2, projectId: i2, prefix: n2, severityAllowList: r2 = ["error"] } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return (s2) => {
      var o2, a2, l2, u2, c2;
      if (!("*" === r2 || r2.includes(s2.level)) || !e2.__loaded)
        return s2;
      s2.tags || (s2.tags = {});
      var d2 = e2.requestRouter.endpointFor("ui", "/project/".concat(e2.config.token, "/person/").concat(e2.get_distinct_id()));
      s2.tags["PostHog Person URL"] = d2, e2.sessionRecordingStarted() && (s2.tags["PostHog Recording URL"] = e2.get_session_replay_url({ withTimestamp: true }));
      var h2 = (null === (o2 = s2.exception) || void 0 === o2 ? void 0 : o2.values) || [];
      h2.map((e3) => {
        e3.stacktrace && (e3.stacktrace.type = "raw");
      });
      var _2 = { $exception_message: (null === (a2 = h2[0]) || void 0 === a2 ? void 0 : a2.value) || s2.message, $exception_type: null === (l2 = h2[0]) || void 0 === l2 ? void 0 : l2.type, $exception_personURL: d2, $exception_level: s2.level, $exception_list: h2, $sentry_event_id: s2.event_id, $sentry_exception: s2.exception, $sentry_exception_message: (null === (u2 = h2[0]) || void 0 === u2 ? void 0 : u2.value) || s2.message, $sentry_exception_type: null === (c2 = h2[0]) || void 0 === c2 ? void 0 : c2.type, $sentry_tags: s2.tags };
      return t2 && i2 && (_2.$sentry_url = (n2 || "https://sentry.io/organizations/") + t2 + "/issues/?project=" + i2 + "&query=" + s2.event_id), e2.exceptions.sendExceptionEvent(_2), s2;
    };
  }
  var Ir = class {
    constructor(e2, t2, i2, n2, r2) {
      this.name = kr, this.setupOnce = function(s2) {
        s2(xr(e2, { organization: t2, projectId: i2, prefix: n2, severityAllowList: r2 }));
      };
    }
  };
  var Cr;
  var Pr;
  var Rr;
  var Fr = B("[SegmentIntegration]");
  function Tr(e2, t2) {
    var i2 = e2.config.segment;
    if (!i2)
      return t2();
    !function(e3, t3) {
      var i3 = e3.config.segment;
      if (!i3)
        return t3();
      var n2 = (i4) => {
        var n3 = () => i4.anonymousId() || Ze();
        e3.config.get_device_id = n3, i4.id() && (e3.register({ distinct_id: i4.id(), $device_id: n3() }), e3.persistence.set_property(Te, "identified")), t3();
      }, r2 = i3.user();
      "then" in r2 && I(r2.then) ? r2.then((e4) => n2(e4)) : n2(r2);
    }(e2, () => {
      i2.register(((e3) => {
        Promise && Promise.resolve || Fr.warn("This browser does not have Promise support, and can not use the segment integration");
        var t3 = (t4, i3) => {
          var n2;
          if (!i3)
            return t4;
          t4.event.userId || t4.event.anonymousId === e3.get_distinct_id() || (Fr.info("No userId set, resetting PostHog"), e3.reset()), t4.event.userId && t4.event.userId !== e3.get_distinct_id() && (Fr.info("UserId set, identifying with PostHog"), e3.identify(t4.event.userId));
          var r2 = e3._calculate_event_properties(i3, null !== (n2 = t4.event.properties) && void 0 !== n2 ? n2 : {}, new Date());
          return t4.event.properties = Object.assign({}, r2, t4.event.properties), t4;
        };
        return { name: "PostHog JS", type: "enrichment", version: "1.0.0", isLoaded: () => true, load: () => Promise.resolve(), track: (e4) => t3(e4, e4.event.event), page: (e4) => t3(e4, "$pageview"), identify: (e4) => t3(e4, "$identify"), screen: (e4) => t3(e4, "$screen") };
      })(e2)).then(() => {
        t2();
      });
    });
  }
  var $r = class {
    constructor(e2) {
      this._instance = e2;
    }
    doPageView(e2) {
      var i2, n2 = this._previousPageViewProperties(e2);
      return this._currentPath = null !== (i2 = null == t ? void 0 : t.location.pathname) && void 0 !== i2 ? i2 : "", this._instance.scrollManager.resetContext(), this._prevPageviewTimestamp = e2, n2;
    }
    doPageLeave(e2) {
      return this._previousPageViewProperties(e2);
    }
    _previousPageViewProperties(e2) {
      var t2 = this._currentPath, i2 = this._prevPageviewTimestamp, n2 = this._instance.scrollManager.getContext();
      if (!i2)
        return {};
      var r2 = {};
      if (n2) {
        var { maxScrollHeight: s2, lastScrollY: o2, maxScrollY: a2, maxContentHeight: l2, lastContentY: u2, maxContentY: c2 } = n2;
        if (!(R(s2) || R(o2) || R(a2) || R(l2) || R(u2) || R(c2)))
          s2 = Math.ceil(s2), o2 = Math.ceil(o2), a2 = Math.ceil(a2), l2 = Math.ceil(l2), u2 = Math.ceil(u2), c2 = Math.ceil(c2), r2 = { $prev_pageview_last_scroll: o2, $prev_pageview_last_scroll_percentage: s2 <= 1 ? 1 : ln(o2 / s2, 0, 1), $prev_pageview_max_scroll: a2, $prev_pageview_max_scroll_percentage: s2 <= 1 ? 1 : ln(a2 / s2, 0, 1), $prev_pageview_last_content: u2, $prev_pageview_last_content_percentage: l2 <= 1 ? 1 : ln(u2 / l2, 0, 1), $prev_pageview_max_content: c2, $prev_pageview_max_content_percentage: l2 <= 1 ? 1 : ln(c2 / l2, 0, 1) };
      }
      return t2 && (r2.$prev_pageview_pathname = t2), i2 && (r2.$prev_pageview_duration = (e2.getTime() - i2.getTime()) / 1e3), r2;
    }
  };
  !function(e2) {
    e2.Popover = "popover", e2.API = "api", e2.Widget = "widget";
  }(Cr || (Cr = {})), function(e2) {
    e2.Open = "open", e2.MultipleChoice = "multiple_choice", e2.SingleChoice = "single_choice", e2.Rating = "rating", e2.Link = "link";
  }(Pr || (Pr = {})), function(e2) {
    e2.NextQuestion = "next_question", e2.End = "end", e2.ResponseBased = "response_based", e2.SpecificQuestion = "specific_question";
  }(Rr || (Rr = {}));
  var Or = class {
    constructor() {
      W(this, "events", {}), this.events = {};
    }
    on(e2, t2) {
      return this.events[e2] || (this.events[e2] = []), this.events[e2].push(t2), () => {
        this.events[e2] = this.events[e2].filter((e3) => e3 !== t2);
      };
    }
    emit(e2, t2) {
      for (var i2 of this.events[e2] || [])
        i2(t2);
      for (var n2 of this.events["*"] || [])
        n2(e2, t2);
    }
  };
  var Lr = class {
    constructor(e2) {
      W(this, "_debugEventEmitter", new Or()), W(this, "checkStep", (e3, t2) => this.checkStepEvent(e3, t2) && this.checkStepUrl(e3, t2) && this.checkStepElement(e3, t2)), W(this, "checkStepEvent", (e3, t2) => null == t2 || !t2.event || (null == e3 ? void 0 : e3.event) === (null == t2 ? void 0 : t2.event)), this.instance = e2, this.actionEvents = /* @__PURE__ */ new Set(), this.actionRegistry = /* @__PURE__ */ new Set();
    }
    init() {
      var e2;
      if (!R(null === (e2 = this.instance) || void 0 === e2 ? void 0 : e2._addCaptureHook)) {
        var t2;
        null === (t2 = this.instance) || void 0 === t2 || t2._addCaptureHook((e3, t3) => {
          this.on(e3, t3);
        });
      }
    }
    register(e2) {
      var t2, i2;
      if (!R(null === (t2 = this.instance) || void 0 === t2 ? void 0 : t2._addCaptureHook) && (e2.forEach((e3) => {
        var t3, i3;
        null === (t3 = this.actionRegistry) || void 0 === t3 || t3.add(e3), null === (i3 = e3.steps) || void 0 === i3 || i3.forEach((e4) => {
          var t4;
          null === (t4 = this.actionEvents) || void 0 === t4 || t4.add((null == e4 ? void 0 : e4.event) || "");
        });
      }), null !== (i2 = this.instance) && void 0 !== i2 && i2.autocapture)) {
        var n2, r2 = /* @__PURE__ */ new Set();
        e2.forEach((e3) => {
          var t3;
          null === (t3 = e3.steps) || void 0 === t3 || t3.forEach((e4) => {
            null != e4 && e4.selector && r2.add(null == e4 ? void 0 : e4.selector);
          });
        }), null === (n2 = this.instance) || void 0 === n2 || n2.autocapture.setElementSelectors(r2);
      }
    }
    on(e2, t2) {
      var i2;
      null != t2 && 0 != e2.length && (this.actionEvents.has(e2) || this.actionEvents.has(null == t2 ? void 0 : t2.event)) && this.actionRegistry && (null === (i2 = this.actionRegistry) || void 0 === i2 ? void 0 : i2.size) > 0 && this.actionRegistry.forEach((e3) => {
        this.checkAction(t2, e3) && this._debugEventEmitter.emit("actionCaptured", e3.name);
      });
    }
    _addActionHook(e2) {
      this.onAction("actionCaptured", (t2) => e2(t2));
    }
    checkAction(e2, t2) {
      if (null == (null == t2 ? void 0 : t2.steps))
        return false;
      for (var i2 of t2.steps)
        if (this.checkStep(e2, i2))
          return true;
      return false;
    }
    onAction(e2, t2) {
      return this._debugEventEmitter.on(e2, t2);
    }
    checkStepUrl(e2, t2) {
      if (null != t2 && t2.url) {
        var i2, n2 = null == e2 || null === (i2 = e2.properties) || void 0 === i2 ? void 0 : i2.$current_url;
        if (!n2 || "string" != typeof n2)
          return false;
        if (!Lr.matchString(n2, null == t2 ? void 0 : t2.url, (null == t2 ? void 0 : t2.url_matching) || "contains"))
          return false;
      }
      return true;
    }
    static matchString(e2, i2, n2) {
      switch (n2) {
        case "regex":
          return !!t && gt(e2, i2);
        case "exact":
          return i2 === e2;
        case "contains":
          var r2 = Lr.escapeStringRegexp(i2).replace(/_/g, ".").replace(/%/g, ".*");
          return gt(e2, r2);
        default:
          return false;
      }
    }
    static escapeStringRegexp(e2) {
      return e2.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
    }
    checkStepElement(e2, t2) {
      if ((null != t2 && t2.href || null != t2 && t2.tag_name || null != t2 && t2.text) && !this.getElementsList(e2).some((e3) => !(null != t2 && t2.href && !Lr.matchString(e3.href || "", null == t2 ? void 0 : t2.href, (null == t2 ? void 0 : t2.href_matching) || "exact")) && ((null == t2 || !t2.tag_name || e3.tag_name === (null == t2 ? void 0 : t2.tag_name)) && !(null != t2 && t2.text && !Lr.matchString(e3.text || "", null == t2 ? void 0 : t2.text, (null == t2 ? void 0 : t2.text_matching) || "exact") && !Lr.matchString(e3.$el_text || "", null == t2 ? void 0 : t2.text, (null == t2 ? void 0 : t2.text_matching) || "exact")))))
        return false;
      if (null != t2 && t2.selector) {
        var i2, n2 = null == e2 || null === (i2 = e2.properties) || void 0 === i2 ? void 0 : i2.$element_selectors;
        if (!n2)
          return false;
        if (!n2.includes(null == t2 ? void 0 : t2.selector))
          return false;
      }
      return true;
    }
    getElementsList(e2) {
      return null == (null == e2 ? void 0 : e2.properties.$elements) ? [] : null == e2 ? void 0 : e2.properties.$elements;
    }
  };
  var Mr = class {
    constructor(e2) {
      this.instance = e2, this.eventToSurveys = /* @__PURE__ */ new Map(), this.actionToSurveys = /* @__PURE__ */ new Map();
    }
    register(e2) {
      var t2;
      R(null === (t2 = this.instance) || void 0 === t2 ? void 0 : t2._addCaptureHook) || (this.setupEventBasedSurveys(e2), this.setupActionBasedSurveys(e2));
    }
    setupActionBasedSurveys(e2) {
      var t2 = e2.filter((e3) => {
        var t3, i2, n2, r2;
        return (null === (t3 = e3.conditions) || void 0 === t3 ? void 0 : t3.actions) && (null === (i2 = e3.conditions) || void 0 === i2 || null === (n2 = i2.actions) || void 0 === n2 || null === (r2 = n2.values) || void 0 === r2 ? void 0 : r2.length) > 0;
      });
      if (0 !== t2.length) {
        if (null == this.actionMatcher) {
          this.actionMatcher = new Lr(this.instance), this.actionMatcher.init();
          this.actionMatcher._addActionHook((e3) => {
            this.onAction(e3);
          });
        }
        t2.forEach((e3) => {
          var t3, i2, n2, r2, s2, o2, a2, l2, u2, c2;
          e3.conditions && null !== (t3 = e3.conditions) && void 0 !== t3 && t3.actions && null !== (i2 = e3.conditions) && void 0 !== i2 && null !== (n2 = i2.actions) && void 0 !== n2 && n2.values && (null === (r2 = e3.conditions) || void 0 === r2 || null === (s2 = r2.actions) || void 0 === s2 || null === (o2 = s2.values) || void 0 === o2 ? void 0 : o2.length) > 0 && (null === (a2 = this.actionMatcher) || void 0 === a2 || a2.register(e3.conditions.actions.values), null === (l2 = e3.conditions) || void 0 === l2 || null === (u2 = l2.actions) || void 0 === u2 || null === (c2 = u2.values) || void 0 === c2 || c2.forEach((t4) => {
            if (t4 && t4.name) {
              var i3 = this.actionToSurveys.get(t4.name);
              i3 && i3.push(e3.id), this.actionToSurveys.set(t4.name, i3 || [e3.id]);
            }
          }));
        });
      }
    }
    setupEventBasedSurveys(e2) {
      var t2;
      if (0 !== e2.filter((e3) => {
        var t3, i2, n2, r2;
        return (null === (t3 = e3.conditions) || void 0 === t3 ? void 0 : t3.events) && (null === (i2 = e3.conditions) || void 0 === i2 || null === (n2 = i2.events) || void 0 === n2 || null === (r2 = n2.values) || void 0 === r2 ? void 0 : r2.length) > 0;
      }).length) {
        null === (t2 = this.instance) || void 0 === t2 || t2._addCaptureHook((e3, t3) => {
          this.onEvent(e3, t3);
        }), e2.forEach((e3) => {
          var t3, i2, n2;
          null === (t3 = e3.conditions) || void 0 === t3 || null === (i2 = t3.events) || void 0 === i2 || null === (n2 = i2.values) || void 0 === n2 || n2.forEach((t4) => {
            if (t4 && t4.name) {
              var i3 = this.eventToSurveys.get(t4.name);
              i3 && i3.push(e3.id), this.eventToSurveys.set(t4.name, i3 || [e3.id]);
            }
          });
        });
      }
    }
    onEvent(e2, t2) {
      var i2, n2, r2 = (null === (i2 = this.instance) || void 0 === i2 || null === (n2 = i2.persistence) || void 0 === n2 ? void 0 : n2.props[Re]) || [];
      if (Mr.SURVEY_SHOWN_EVENT_NAME == e2 && t2 && r2.length > 0) {
        var s2, o2 = null == t2 || null === (s2 = t2.properties) || void 0 === s2 ? void 0 : s2.$survey_id;
        if (o2) {
          var a2 = r2.indexOf(o2);
          a2 >= 0 && (r2.splice(a2, 1), this._updateActivatedSurveys(r2));
        }
      } else
        this.eventToSurveys.has(e2) && this._updateActivatedSurveys(r2.concat(this.eventToSurveys.get(e2) || []));
    }
    onAction(e2) {
      var t2, i2, n2 = (null === (t2 = this.instance) || void 0 === t2 || null === (i2 = t2.persistence) || void 0 === i2 ? void 0 : i2.props[Re]) || [];
      this.actionToSurveys.has(e2) && this._updateActivatedSurveys(n2.concat(this.actionToSurveys.get(e2) || []));
    }
    _updateActivatedSurveys(e2) {
      var t2, i2;
      null === (t2 = this.instance) || void 0 === t2 || null === (i2 = t2.persistence) || void 0 === i2 || i2.register({ [Re]: [...new Set(e2)] });
    }
    getSurveys() {
      var e2, t2, i2 = null === (e2 = this.instance) || void 0 === e2 || null === (t2 = e2.persistence) || void 0 === t2 ? void 0 : t2.props[Re];
      return i2 || [];
    }
    getEventToSurveys() {
      return this.eventToSurveys;
    }
    _getActionMatcher() {
      return this.actionMatcher;
    }
  };
  W(Mr, "SURVEY_SHOWN_EVENT_NAME", "survey shown");
  var Ar;
  var Dr;
  var Nr;
  var qr;
  var Br;
  var Hr;
  var Ur;
  var zr;
  var jr = {};
  var Wr = [];
  var Gr = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var Vr = Array.isArray;
  function Jr(e2, t2) {
    for (var i2 in t2)
      e2[i2] = t2[i2];
    return e2;
  }
  function Yr(e2) {
    var t2 = e2.parentNode;
    t2 && t2.removeChild(e2);
  }
  function Kr(e2, t2, i2, n2, r2) {
    var s2 = { type: e2, props: t2, key: i2, ref: n2, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r2 ? ++Nr : r2, __i: -1, __u: 0 };
    return null == r2 && null != Dr.vnode && Dr.vnode(s2), s2;
  }
  function Xr(e2) {
    return e2.children;
  }
  function Qr(e2, t2) {
    this.props = e2, this.context = t2;
  }
  function Zr(e2, t2) {
    if (null == t2)
      return e2.__ ? Zr(e2.__, e2.__i + 1) : null;
    for (var i2; t2 < e2.__k.length; t2++)
      if (null != (i2 = e2.__k[t2]) && null != i2.__e)
        return i2.__e;
    return "function" == typeof e2.type ? Zr(e2) : null;
  }
  function es(e2) {
    var t2, i2;
    if (null != (e2 = e2.__) && null != e2.__c) {
      for (e2.__e = e2.__c.base = null, t2 = 0; t2 < e2.__k.length; t2++)
        if (null != (i2 = e2.__k[t2]) && null != i2.__e) {
          e2.__e = e2.__c.base = i2.__e;
          break;
        }
      return es(e2);
    }
  }
  function ts(e2) {
    (!e2.__d && (e2.__d = true) && qr.push(e2) && !is.__r++ || Br !== Dr.debounceRendering) && ((Br = Dr.debounceRendering) || Hr)(is);
  }
  function is() {
    var e2, t2, i2, n2, r2, s2, o2, a2, l2;
    for (qr.sort(Ur); e2 = qr.shift(); )
      e2.__d && (t2 = qr.length, n2 = void 0, s2 = (r2 = (i2 = e2).__v).__e, a2 = [], l2 = [], (o2 = i2.__P) && ((n2 = Jr({}, r2)).__v = r2.__v + 1, Dr.vnode && Dr.vnode(n2), ds(o2, n2, r2, i2.__n, void 0 !== o2.ownerSVGElement, 32 & r2.__u ? [s2] : null, a2, null == s2 ? Zr(r2) : s2, !!(32 & r2.__u), l2), n2.__.__k[n2.__i] = n2, hs(a2, n2, l2), n2.__e != s2 && es(n2)), qr.length > t2 && qr.sort(Ur));
    is.__r = 0;
  }
  function ns(e2, t2, i2, n2, r2, s2, o2, a2, l2, u2, c2) {
    var d2, h2, _2, p2, v2, g2 = n2 && n2.__k || Wr, f = t2.length;
    for (i2.__d = l2, rs(i2, t2, g2), l2 = i2.__d, d2 = 0; d2 < f; d2++)
      null != (_2 = i2.__k[d2]) && "boolean" != typeof _2 && "function" != typeof _2 && (h2 = -1 === _2.__i ? jr : g2[_2.__i] || jr, _2.__i = d2, ds(e2, _2, h2, r2, s2, o2, a2, l2, u2, c2), p2 = _2.__e, _2.ref && h2.ref != _2.ref && (h2.ref && ps(h2.ref, null, _2), c2.push(_2.ref, _2.__c || p2, _2)), null == v2 && null != p2 && (v2 = p2), 65536 & _2.__u || h2.__k === _2.__k ? l2 = ss(_2, l2, e2) : "function" == typeof _2.type && void 0 !== _2.__d ? l2 = _2.__d : p2 && (l2 = p2.nextSibling), _2.__d = void 0, _2.__u &= -196609);
    i2.__d = l2, i2.__e = v2;
  }
  function rs(e2, t2, i2) {
    var n2, r2, s2, o2, a2, l2 = t2.length, u2 = i2.length, c2 = u2, d2 = 0;
    for (e2.__k = [], n2 = 0; n2 < l2; n2++)
      null != (r2 = e2.__k[n2] = null == (r2 = t2[n2]) || "boolean" == typeof r2 || "function" == typeof r2 ? null : "string" == typeof r2 || "number" == typeof r2 || "bigint" == typeof r2 || r2.constructor == String ? Kr(null, r2, null, null, r2) : Vr(r2) ? Kr(Xr, { children: r2 }, null, null, null) : void 0 === r2.constructor && r2.__b > 0 ? Kr(r2.type, r2.props, r2.key, r2.ref ? r2.ref : null, r2.__v) : r2) ? (r2.__ = e2, r2.__b = e2.__b + 1, a2 = os(r2, i2, o2 = n2 + d2, c2), r2.__i = a2, s2 = null, -1 !== a2 && (c2--, (s2 = i2[a2]) && (s2.__u |= 131072)), null == s2 || null === s2.__v ? (-1 == a2 && d2--, "function" != typeof r2.type && (r2.__u |= 65536)) : a2 !== o2 && (a2 === o2 + 1 ? d2++ : a2 > o2 ? c2 > l2 - o2 ? d2 += a2 - o2 : d2-- : d2 = a2 < o2 && a2 == o2 - 1 ? a2 - o2 : 0, a2 !== n2 + d2 && (r2.__u |= 65536))) : (s2 = i2[n2]) && null == s2.key && s2.__e && (s2.__e == e2.__d && (e2.__d = Zr(s2)), vs(s2, s2, false), i2[n2] = null, c2--);
    if (c2)
      for (n2 = 0; n2 < u2; n2++)
        null != (s2 = i2[n2]) && 0 == (131072 & s2.__u) && (s2.__e == e2.__d && (e2.__d = Zr(s2)), vs(s2, s2));
  }
  function ss(e2, t2, i2) {
    var n2, r2;
    if ("function" == typeof e2.type) {
      for (n2 = e2.__k, r2 = 0; n2 && r2 < n2.length; r2++)
        n2[r2] && (n2[r2].__ = e2, t2 = ss(n2[r2], t2, i2));
      return t2;
    }
    return e2.__e != t2 && (i2.insertBefore(e2.__e, t2 || null), t2 = e2.__e), t2 && t2.nextSibling;
  }
  function os(e2, t2, i2, n2) {
    var r2 = e2.key, s2 = e2.type, o2 = i2 - 1, a2 = i2 + 1, l2 = t2[i2];
    if (null === l2 || l2 && r2 == l2.key && s2 === l2.type)
      return i2;
    if (n2 > (null != l2 && 0 == (131072 & l2.__u) ? 1 : 0))
      for (; o2 >= 0 || a2 < t2.length; ) {
        if (o2 >= 0) {
          if ((l2 = t2[o2]) && 0 == (131072 & l2.__u) && r2 == l2.key && s2 === l2.type)
            return o2;
          o2--;
        }
        if (a2 < t2.length) {
          if ((l2 = t2[a2]) && 0 == (131072 & l2.__u) && r2 == l2.key && s2 === l2.type)
            return a2;
          a2++;
        }
      }
    return -1;
  }
  function as(e2, t2, i2) {
    "-" === t2[0] ? e2.setProperty(t2, null == i2 ? "" : i2) : e2[t2] = null == i2 ? "" : "number" != typeof i2 || Gr.test(t2) ? i2 : i2 + "px";
  }
  function ls(e2, t2, i2, n2, r2) {
    var s2;
    e:
      if ("style" === t2)
        if ("string" == typeof i2)
          e2.style.cssText = i2;
        else {
          if ("string" == typeof n2 && (e2.style.cssText = n2 = ""), n2)
            for (t2 in n2)
              i2 && t2 in i2 || as(e2.style, t2, "");
          if (i2)
            for (t2 in i2)
              n2 && i2[t2] === n2[t2] || as(e2.style, t2, i2[t2]);
        }
      else if ("o" === t2[0] && "n" === t2[1])
        s2 = t2 !== (t2 = t2.replace(/(PointerCapture)$|Capture$/, "$1")), t2 = t2.toLowerCase() in e2 ? t2.toLowerCase().slice(2) : t2.slice(2), e2.l || (e2.l = {}), e2.l[t2 + s2] = i2, i2 ? n2 ? i2.u = n2.u : (i2.u = Date.now(), e2.addEventListener(t2, s2 ? cs : us, s2)) : e2.removeEventListener(t2, s2 ? cs : us, s2);
      else {
        if (r2)
          t2 = t2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if ("width" !== t2 && "height" !== t2 && "href" !== t2 && "list" !== t2 && "form" !== t2 && "tabIndex" !== t2 && "download" !== t2 && "rowSpan" !== t2 && "colSpan" !== t2 && "role" !== t2 && t2 in e2)
          try {
            e2[t2] = null == i2 ? "" : i2;
            break e;
          } catch (e3) {
          }
        "function" == typeof i2 || (null == i2 || false === i2 && "-" !== t2[4] ? e2.removeAttribute(t2) : e2.setAttribute(t2, i2));
      }
  }
  function us(e2) {
    var t2 = this.l[e2.type + false];
    if (e2.t) {
      if (e2.t <= t2.u)
        return;
    } else
      e2.t = Date.now();
    return t2(Dr.event ? Dr.event(e2) : e2);
  }
  function cs(e2) {
    return this.l[e2.type + true](Dr.event ? Dr.event(e2) : e2);
  }
  function ds(e2, t2, i2, n2, r2, s2, o2, a2, l2, u2) {
    var c2, d2, h2, _2, p2, v2, g2, f, m2, b2, y2, w2, S2, E2, k2, x2 = t2.type;
    if (void 0 !== t2.constructor)
      return null;
    128 & i2.__u && (l2 = !!(32 & i2.__u), s2 = [a2 = t2.__e = i2.__e]), (c2 = Dr.__b) && c2(t2);
    e:
      if ("function" == typeof x2)
        try {
          if (f = t2.props, m2 = (c2 = x2.contextType) && n2[c2.__c], b2 = c2 ? m2 ? m2.props.value : c2.__ : n2, i2.__c ? g2 = (d2 = t2.__c = i2.__c).__ = d2.__E : ("prototype" in x2 && x2.prototype.render ? t2.__c = d2 = new x2(f, b2) : (t2.__c = d2 = new Qr(f, b2), d2.constructor = x2, d2.render = gs), m2 && m2.sub(d2), d2.props = f, d2.state || (d2.state = {}), d2.context = b2, d2.__n = n2, h2 = d2.__d = true, d2.__h = [], d2._sb = []), null == d2.__s && (d2.__s = d2.state), null != x2.getDerivedStateFromProps && (d2.__s == d2.state && (d2.__s = Jr({}, d2.__s)), Jr(d2.__s, x2.getDerivedStateFromProps(f, d2.__s))), _2 = d2.props, p2 = d2.state, d2.__v = t2, h2)
            null == x2.getDerivedStateFromProps && null != d2.componentWillMount && d2.componentWillMount(), null != d2.componentDidMount && d2.__h.push(d2.componentDidMount);
          else {
            if (null == x2.getDerivedStateFromProps && f !== _2 && null != d2.componentWillReceiveProps && d2.componentWillReceiveProps(f, b2), !d2.__e && (null != d2.shouldComponentUpdate && false === d2.shouldComponentUpdate(f, d2.__s, b2) || t2.__v === i2.__v)) {
              for (t2.__v !== i2.__v && (d2.props = f, d2.state = d2.__s, d2.__d = false), t2.__e = i2.__e, t2.__k = i2.__k, t2.__k.forEach(function(e3) {
                e3 && (e3.__ = t2);
              }), y2 = 0; y2 < d2._sb.length; y2++)
                d2.__h.push(d2._sb[y2]);
              d2._sb = [], d2.__h.length && o2.push(d2);
              break e;
            }
            null != d2.componentWillUpdate && d2.componentWillUpdate(f, d2.__s, b2), null != d2.componentDidUpdate && d2.__h.push(function() {
              d2.componentDidUpdate(_2, p2, v2);
            });
          }
          if (d2.context = b2, d2.props = f, d2.__P = e2, d2.__e = false, w2 = Dr.__r, S2 = 0, "prototype" in x2 && x2.prototype.render) {
            for (d2.state = d2.__s, d2.__d = false, w2 && w2(t2), c2 = d2.render(d2.props, d2.state, d2.context), E2 = 0; E2 < d2._sb.length; E2++)
              d2.__h.push(d2._sb[E2]);
            d2._sb = [];
          } else
            do {
              d2.__d = false, w2 && w2(t2), c2 = d2.render(d2.props, d2.state, d2.context), d2.state = d2.__s;
            } while (d2.__d && ++S2 < 25);
          d2.state = d2.__s, null != d2.getChildContext && (n2 = Jr(Jr({}, n2), d2.getChildContext())), h2 || null == d2.getSnapshotBeforeUpdate || (v2 = d2.getSnapshotBeforeUpdate(_2, p2)), ns(e2, Vr(k2 = null != c2 && c2.type === Xr && null == c2.key ? c2.props.children : c2) ? k2 : [k2], t2, i2, n2, r2, s2, o2, a2, l2, u2), d2.base = t2.__e, t2.__u &= -161, d2.__h.length && o2.push(d2), g2 && (d2.__E = d2.__ = null);
        } catch (e3) {
          t2.__v = null, l2 || null != s2 ? (t2.__e = a2, t2.__u |= l2 ? 160 : 32, s2[s2.indexOf(a2)] = null) : (t2.__e = i2.__e, t2.__k = i2.__k), Dr.__e(e3, t2, i2);
        }
      else
        null == s2 && t2.__v === i2.__v ? (t2.__k = i2.__k, t2.__e = i2.__e) : t2.__e = _s(i2.__e, t2, i2, n2, r2, s2, o2, l2, u2);
    (c2 = Dr.diffed) && c2(t2);
  }
  function hs(e2, t2, i2) {
    t2.__d = void 0;
    for (var n2 = 0; n2 < i2.length; n2++)
      ps(i2[n2], i2[++n2], i2[++n2]);
    Dr.__c && Dr.__c(t2, e2), e2.some(function(t3) {
      try {
        e2 = t3.__h, t3.__h = [], e2.some(function(e3) {
          e3.call(t3);
        });
      } catch (e3) {
        Dr.__e(e3, t3.__v);
      }
    });
  }
  function _s(e2, t2, i2, n2, r2, s2, o2, a2, l2) {
    var u2, c2, d2, h2, _2, p2, v2, g2 = i2.props, f = t2.props, m2 = t2.type;
    if ("svg" === m2 && (r2 = true), null != s2) {
      for (u2 = 0; u2 < s2.length; u2++)
        if ((_2 = s2[u2]) && "setAttribute" in _2 == !!m2 && (m2 ? _2.localName === m2 : 3 === _2.nodeType)) {
          e2 = _2, s2[u2] = null;
          break;
        }
    }
    if (null == e2) {
      if (null === m2)
        return document.createTextNode(f);
      e2 = r2 ? document.createElementNS("http://www.w3.org/2000/svg", m2) : document.createElement(m2, f.is && f), s2 = null, a2 = false;
    }
    if (null === m2)
      g2 === f || a2 && e2.data === f || (e2.data = f);
    else {
      if (s2 = s2 && Ar.call(e2.childNodes), g2 = i2.props || jr, !a2 && null != s2)
        for (g2 = {}, u2 = 0; u2 < e2.attributes.length; u2++)
          g2[(_2 = e2.attributes[u2]).name] = _2.value;
      for (u2 in g2)
        _2 = g2[u2], "children" == u2 || ("dangerouslySetInnerHTML" == u2 ? d2 = _2 : "key" === u2 || u2 in f || ls(e2, u2, null, _2, r2));
      for (u2 in f)
        _2 = f[u2], "children" == u2 ? h2 = _2 : "dangerouslySetInnerHTML" == u2 ? c2 = _2 : "value" == u2 ? p2 = _2 : "checked" == u2 ? v2 = _2 : "key" === u2 || a2 && "function" != typeof _2 || g2[u2] === _2 || ls(e2, u2, _2, g2[u2], r2);
      if (c2)
        a2 || d2 && (c2.__html === d2.__html || c2.__html === e2.innerHTML) || (e2.innerHTML = c2.__html), t2.__k = [];
      else if (d2 && (e2.innerHTML = ""), ns(e2, Vr(h2) ? h2 : [h2], t2, i2, n2, r2 && "foreignObject" !== m2, s2, o2, s2 ? s2[0] : i2.__k && Zr(i2, 0), a2, l2), null != s2)
        for (u2 = s2.length; u2--; )
          null != s2[u2] && Yr(s2[u2]);
      a2 || (u2 = "value", void 0 !== p2 && (p2 !== e2[u2] || "progress" === m2 && !p2 || "option" === m2 && p2 !== g2[u2]) && ls(e2, u2, p2, g2[u2], false), u2 = "checked", void 0 !== v2 && v2 !== e2[u2] && ls(e2, u2, v2, g2[u2], false));
    }
    return e2;
  }
  function ps(e2, t2, i2) {
    try {
      "function" == typeof e2 ? e2(t2) : e2.current = t2;
    } catch (e3) {
      Dr.__e(e3, i2);
    }
  }
  function vs(e2, t2, i2) {
    var n2, r2;
    if (Dr.unmount && Dr.unmount(e2), (n2 = e2.ref) && (n2.current && n2.current !== e2.__e || ps(n2, null, t2)), null != (n2 = e2.__c)) {
      if (n2.componentWillUnmount)
        try {
          n2.componentWillUnmount();
        } catch (e3) {
          Dr.__e(e3, t2);
        }
      n2.base = n2.__P = null, e2.__c = void 0;
    }
    if (n2 = e2.__k)
      for (r2 = 0; r2 < n2.length; r2++)
        n2[r2] && vs(n2[r2], t2, i2 || "function" != typeof e2.type);
    i2 || null == e2.__e || Yr(e2.__e), e2.__ = e2.__e = e2.__d = void 0;
  }
  function gs(e2, t2, i2) {
    return this.constructor(e2, i2);
  }
  Ar = Wr.slice, Dr = { __e: function(e2, t2, i2, n2) {
    for (var r2, s2, o2; t2 = t2.__; )
      if ((r2 = t2.__c) && !r2.__)
        try {
          if ((s2 = r2.constructor) && null != s2.getDerivedStateFromError && (r2.setState(s2.getDerivedStateFromError(e2)), o2 = r2.__d), null != r2.componentDidCatch && (r2.componentDidCatch(e2, n2 || {}), o2 = r2.__d), o2)
            return r2.__E = r2;
        } catch (t3) {
          e2 = t3;
        }
    throw e2;
  } }, Nr = 0, Qr.prototype.setState = function(e2, t2) {
    var i2;
    i2 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = Jr({}, this.state), "function" == typeof e2 && (e2 = e2(Jr({}, i2), this.props)), e2 && Jr(i2, e2), null != e2 && this.__v && (t2 && this._sb.push(t2), ts(this));
  }, Qr.prototype.forceUpdate = function(e2) {
    this.__v && (this.__e = true, e2 && this.__h.push(e2), ts(this));
  }, Qr.prototype.render = Xr, qr = [], Hr = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Ur = function(e2, t2) {
    return e2.__v.__b - t2.__v.__b;
  }, is.__r = 0, zr = 0;
  !function(e2, t2) {
    var i2 = { __c: t2 = "__cC" + zr++, __: e2, Consumer: function(e3, t3) {
      return e3.children(t3);
    }, Provider: function(e3) {
      var i3, n2;
      return this.getChildContext || (i3 = [], (n2 = {})[t2] = this, this.getChildContext = function() {
        return n2;
      }, this.shouldComponentUpdate = function(e4) {
        this.props.value !== e4.value && i3.some(function(e5) {
          e5.__e = true, ts(e5);
        });
      }, this.sub = function(e4) {
        i3.push(e4);
        var t3 = e4.componentWillUnmount;
        e4.componentWillUnmount = function() {
          i3.splice(i3.indexOf(e4), 1), t3 && t3.call(e4);
        };
      }), e3.children;
    } };
    i2.Provider.__ = i2.Consumer.contextType = i2;
  }({ isPreviewMode: false, previewPageIndex: 0, handleCloseSurveyPopup: () => {
  }, isPopup: true });
  var fs = B("[Surveys]");
  var ms = { icontains: (e2) => !!t && t.location.href.toLowerCase().indexOf(e2.toLowerCase()) > -1, not_icontains: (e2) => !!t && -1 === t.location.href.toLowerCase().indexOf(e2.toLowerCase()), regex: (e2) => !!t && gt(t.location.href, e2), not_regex: (e2) => !!t && !gt(t.location.href, e2), exact: (e2) => (null == t ? void 0 : t.location.href) === e2, is_not: (e2) => (null == t ? void 0 : t.location.href) !== e2 };
  var bs = class {
    constructor(e2) {
      this.instance = e2, this._surveyEventReceiver = null;
    }
    onRemoteConfig(e2) {
      this._decideServerResponse = !!e2.surveys, this.loadIfEnabled();
    }
    reset() {
      localStorage.removeItem("lastSeenSurveyDate");
      var e2 = (() => {
        for (var e3 = [], t2 = 0; t2 < localStorage.length; t2++) {
          var i2 = localStorage.key(t2);
          null != i2 && i2.startsWith("seenSurvey_") && e3.push(i2);
        }
        return e3;
      })();
      e2.forEach((e3) => localStorage.removeItem(e3));
    }
    loadIfEnabled() {
      var e2, t2, i2, n2 = null == _ || null === (e2 = _.__PosthogExtensions__) || void 0 === e2 ? void 0 : e2.generateSurveys;
      this.instance.config.disable_surveys || !this._decideServerResponse || n2 || (null == this._surveyEventReceiver && (this._surveyEventReceiver = new Mr(this.instance)), null === (t2 = _.__PosthogExtensions__) || void 0 === t2 || null === (i2 = t2.loadExternalDependency) || void 0 === i2 || i2.call(t2, this.instance, "surveys", (e3) => {
        var t3, i3;
        if (e3)
          return fs.error("Could not load surveys script", e3);
        this._surveyManager = null === (t3 = _.__PosthogExtensions__) || void 0 === t3 || null === (i3 = t3.generateSurveys) || void 0 === i3 ? void 0 : i3.call(t3, this.instance);
      }));
    }
    getSurveys(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
      if (this.instance.config.disable_surveys)
        return e2([]);
      null == this._surveyEventReceiver && (this._surveyEventReceiver = new Mr(this.instance));
      var i2 = this.instance.get_property(Pe);
      if (i2 && !t2)
        return e2(i2);
      this.instance._send_request({ url: this.instance.requestRouter.endpointFor("api", "/api/surveys/?token=".concat(this.instance.config.token)), method: "GET", callback: (t3) => {
        var i3;
        if (200 !== t3.statusCode || !t3.json)
          return e2([]);
        var n2, r2 = t3.json.surveys || [], s2 = r2.filter((e3) => {
          var t4, i4, n3, r3, s3, o2, a2, l2, u2, c2, d2, h2;
          return (null === (t4 = e3.conditions) || void 0 === t4 ? void 0 : t4.events) && (null === (i4 = e3.conditions) || void 0 === i4 || null === (n3 = i4.events) || void 0 === n3 ? void 0 : n3.values) && (null === (r3 = e3.conditions) || void 0 === r3 || null === (s3 = r3.events) || void 0 === s3 || null === (o2 = s3.values) || void 0 === o2 ? void 0 : o2.length) > 0 || (null === (a2 = e3.conditions) || void 0 === a2 ? void 0 : a2.actions) && (null === (l2 = e3.conditions) || void 0 === l2 || null === (u2 = l2.actions) || void 0 === u2 ? void 0 : u2.values) && (null === (c2 = e3.conditions) || void 0 === c2 || null === (d2 = c2.actions) || void 0 === d2 || null === (h2 = d2.values) || void 0 === h2 ? void 0 : h2.length) > 0;
        });
        s2.length > 0 && (null === (n2 = this._surveyEventReceiver) || void 0 === n2 || n2.register(s2));
        return null === (i3 = this.instance.persistence) || void 0 === i3 || i3.register({ [Pe]: r2 }), e2(r2);
      } });
    }
    getActiveMatchingSurveys(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
      this.getSurveys((t3) => {
        var i2, n2 = t3.filter((e3) => !(!e3.start_date || e3.end_date)).filter((e3) => {
          var t4, i3, n3, r3;
          if (!e3.conditions)
            return true;
          var s3 = null === (t4 = e3.conditions) || void 0 === t4 || !t4.url || ms[null !== (i3 = null === (n3 = e3.conditions) || void 0 === n3 ? void 0 : n3.urlMatchType) && void 0 !== i3 ? i3 : "icontains"](e3.conditions.url), o2 = null === (r3 = e3.conditions) || void 0 === r3 || !r3.selector || (null == a ? void 0 : a.querySelector(e3.conditions.selector));
          return s3 && o2;
        }), r2 = null === (i2 = this._surveyEventReceiver) || void 0 === i2 ? void 0 : i2.getSurveys(), s2 = n2.filter((e3) => {
          var t4, i3, n3, s3, o2, a2, l2, u2, c2, d2, h2;
          if (!(e3.linked_flag_key || e3.targeting_flag_key || e3.internal_targeting_flag_key || null !== (t4 = e3.feature_flag_keys) && void 0 !== t4 && t4.length))
            return true;
          var _2 = !e3.linked_flag_key || this.instance.featureFlags.isFeatureEnabled(e3.linked_flag_key), p2 = !e3.targeting_flag_key || this.instance.featureFlags.isFeatureEnabled(e3.targeting_flag_key), v2 = (null === (i3 = e3.conditions) || void 0 === i3 ? void 0 : i3.events) && (null === (n3 = e3.conditions) || void 0 === n3 || null === (s3 = n3.events) || void 0 === s3 ? void 0 : s3.values) && (null === (o2 = e3.conditions) || void 0 === o2 || null === (a2 = o2.events) || void 0 === a2 ? void 0 : a2.values.length) > 0, g2 = (null === (l2 = e3.conditions) || void 0 === l2 ? void 0 : l2.actions) && (null === (u2 = e3.conditions) || void 0 === u2 || null === (c2 = u2.actions) || void 0 === c2 ? void 0 : c2.values) && (null === (d2 = e3.conditions) || void 0 === d2 || null === (h2 = d2.actions) || void 0 === h2 ? void 0 : h2.values.length) > 0, f = !v2 && !g2 || (null == r2 ? void 0 : r2.includes(e3.id)), m2 = this._canActivateRepeatedly(e3), b2 = !(e3.internal_targeting_flag_key && !m2) || this.instance.featureFlags.isFeatureEnabled(e3.internal_targeting_flag_key), y2 = this.checkFlags(e3);
          return _2 && p2 && b2 && f && y2;
        });
        return e2(s2);
      }, t2);
    }
    checkFlags(e2) {
      var t2;
      return null === (t2 = e2.feature_flag_keys) || void 0 === t2 || !t2.length || e2.feature_flag_keys.every((e3) => {
        var { key: t3, value: i2 } = e3;
        return !t3 || !i2 || this.instance.featureFlags.isFeatureEnabled(i2);
      });
    }
    getNextSurveyStep(e2, t2, i2) {
      var n2, r2 = e2.questions[t2], s2 = t2 + 1;
      if (null === (n2 = r2.branching) || void 0 === n2 || !n2.type)
        return t2 === e2.questions.length - 1 ? Rr.End : s2;
      if (r2.branching.type === Rr.End)
        return Rr.End;
      if (r2.branching.type === Rr.SpecificQuestion) {
        if (Number.isInteger(r2.branching.index))
          return r2.branching.index;
      } else if (r2.branching.type === Rr.ResponseBased) {
        if (r2.type === Pr.SingleChoice) {
          var o2, a2, l2 = r2.choices.indexOf("".concat(i2));
          if (null !== (o2 = r2.branching) && void 0 !== o2 && null !== (a2 = o2.responseValues) && void 0 !== a2 && a2.hasOwnProperty(l2)) {
            var u2 = r2.branching.responseValues[l2];
            return Number.isInteger(u2) ? u2 : u2 === Rr.End ? Rr.End : s2;
          }
        } else if (r2.type === Pr.Rating) {
          var c2, d2;
          if ("number" != typeof i2 || !Number.isInteger(i2))
            throw new Error("The response type must be an integer");
          var h2 = function(e3, t3) {
            if (3 === t3) {
              if (e3 < 1 || e3 > 3)
                throw new Error("The response must be in range 1-3");
              return 1 === e3 ? "negative" : 2 === e3 ? "neutral" : "positive";
            }
            if (5 === t3) {
              if (e3 < 1 || e3 > 5)
                throw new Error("The response must be in range 1-5");
              return e3 <= 2 ? "negative" : 3 === e3 ? "neutral" : "positive";
            }
            if (7 === t3) {
              if (e3 < 1 || e3 > 7)
                throw new Error("The response must be in range 1-7");
              return e3 <= 3 ? "negative" : 4 === e3 ? "neutral" : "positive";
            }
            if (10 === t3) {
              if (e3 < 0 || e3 > 10)
                throw new Error("The response must be in range 0-10");
              return e3 <= 6 ? "detractors" : e3 <= 8 ? "passives" : "promoters";
            }
            throw new Error("The scale must be one of: 3, 5, 7, 10");
          }(i2, r2.scale);
          if (null !== (c2 = r2.branching) && void 0 !== c2 && null !== (d2 = c2.responseValues) && void 0 !== d2 && d2.hasOwnProperty(h2)) {
            var _2 = r2.branching.responseValues[h2];
            return Number.isInteger(_2) ? _2 : _2 === Rr.End ? Rr.End : s2;
          }
        }
        return s2;
      }
      return fs.warn("Falling back to next question index due to unexpected branching type"), s2;
    }
    _canActivateRepeatedly(e2) {
      var t2;
      return O(null === (t2 = _.__PosthogExtensions__) || void 0 === t2 ? void 0 : t2.canActivateRepeatedly) ? (fs.warn("init was not called"), false) : _.__PosthogExtensions__.canActivateRepeatedly(e2);
    }
    canRenderSurvey(e2) {
      O(this._surveyManager) ? fs.warn("init was not called") : this.getSurveys((t2) => {
        var i2 = t2.filter((t3) => t3.id === e2)[0];
        this._surveyManager.canRenderSurvey(i2);
      });
    }
    renderSurvey(e2, t2) {
      O(this._surveyManager) ? fs.warn("init was not called") : this.getSurveys((i2) => {
        var n2 = i2.filter((t3) => t3.id === e2)[0];
        this._surveyManager.renderSurvey(n2, null == a ? void 0 : a.querySelector(t2));
      });
    }
  };
  var ys = B("[RateLimiter]");
  var ws = class {
    constructor(e2) {
      var t2, i2;
      W(this, "serverLimits", {}), W(this, "lastEventRateLimited", false), W(this, "checkForLimiting", (e3) => {
        var t3 = e3.text;
        if (t3 && t3.length)
          try {
            (JSON.parse(t3).quota_limited || []).forEach((e4) => {
              ys.info("".concat(e4 || "events", " is quota limited.")), this.serverLimits[e4] = new Date().getTime() + 6e4;
            });
          } catch (e4) {
            return void ys.warn('could not rate limit - continuing. Error: "'.concat(null == e4 ? void 0 : e4.message, '"'), { text: t3 });
          }
      }), this.instance = e2, this.captureEventsPerSecond = (null === (t2 = e2.config.rate_limiting) || void 0 === t2 ? void 0 : t2.events_per_second) || 10, this.captureEventsBurstLimit = Math.max((null === (i2 = e2.config.rate_limiting) || void 0 === i2 ? void 0 : i2.events_burst_limit) || 10 * this.captureEventsPerSecond, this.captureEventsPerSecond), this.lastEventRateLimited = this.clientRateLimitContext(true).isRateLimited;
    }
    clientRateLimitContext() {
      var e2, t2, i2, n2 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0], r2 = new Date().getTime(), s2 = null !== (e2 = null === (t2 = this.instance.persistence) || void 0 === t2 ? void 0 : t2.get_property(Oe)) && void 0 !== e2 ? e2 : { tokens: this.captureEventsBurstLimit, last: r2 };
      s2.tokens += (r2 - s2.last) / 1e3 * this.captureEventsPerSecond, s2.last = r2, s2.tokens > this.captureEventsBurstLimit && (s2.tokens = this.captureEventsBurstLimit);
      var o2 = s2.tokens < 1;
      return o2 || n2 || (s2.tokens = Math.max(0, s2.tokens - 1)), !o2 || this.lastEventRateLimited || n2 || this.instance.capture("$$client_ingestion_warning", { $$client_ingestion_warning_message: "posthog-js client rate limited. Config is set to ".concat(this.captureEventsPerSecond, " events per second and ").concat(this.captureEventsBurstLimit, " events burst limit.") }, { skip_client_rate_limiting: true }), this.lastEventRateLimited = o2, null === (i2 = this.instance.persistence) || void 0 === i2 || i2.set_property(Oe, s2), { isRateLimited: o2, remainingTokens: s2.tokens };
    }
    isServerRateLimited(e2) {
      var t2 = this.serverLimits[e2 || "events"] || false;
      return false !== t2 && new Date().getTime() < t2;
    }
  };
  var Ss = () => j({ initialPathName: (null == l ? void 0 : l.pathname) || "", referringDomain: fi.referringDomain() }, fi.campaignParams());
  var Es = class {
    constructor(e2, t2, i2) {
      W(this, "_onSessionIdCallback", (e3) => {
        var t3 = this._getStoredProps();
        if (!t3 || t3.sessionId !== e3) {
          var i3 = { sessionId: e3, props: this._sessionSourceParamGenerator() };
          this._persistence.register({ [$e]: i3 });
        }
      }), this._sessionIdManager = e2, this._persistence = t2, this._sessionSourceParamGenerator = i2 || Ss, this._sessionIdManager.onSessionId(this._onSessionIdCallback);
    }
    _getStoredProps() {
      return this._persistence.props[$e];
    }
    getSessionProps() {
      var e2, t2 = null === (e2 = this._getStoredProps()) || void 0 === e2 ? void 0 : e2.props;
      return t2 ? { $client_session_initial_referring_host: t2.referringDomain, $client_session_initial_pathname: t2.initialPathName, $client_session_initial_utm_source: t2.utm_source, $client_session_initial_utm_campaign: t2.utm_campaign, $client_session_initial_utm_medium: t2.utm_medium, $client_session_initial_utm_content: t2.utm_content, $client_session_initial_utm_term: t2.utm_term } : {};
    }
  };
  var ks = ["ahrefsbot", "ahrefssiteaudit", "applebot", "baiduspider", "bingbot", "bingpreview", "bot.htm", "bot.php", "crawler", "deepscan", "duckduckbot", "facebookexternal", "facebookcatalog", "gptbot", "http://yandex.com/bots", "hubspot", "ia_archiver", "linkedinbot", "mj12bot", "msnbot", "nessus", "petalbot", "pinterest", "prerender", "rogerbot", "screaming frog", "semrushbot", "sitebulb", "slurp", "turnitin", "twitterbot", "vercelbot", "yahoo! slurp", "yandexbot", "headlesschrome", "cypress", "Google-HotelAdsVerifier", "adsbot-google", "apis-google", "duplexweb-google", "feedfetcher-google", "google favicon", "google web preview", "google-read-aloud", "googlebot", "googleweblight", "mediapartners-google", "storebot-google", "Bytespider;"];
  var xs = function(e2, t2) {
    if (!e2)
      return false;
    var i2 = e2.toLowerCase();
    return ks.concat(t2 || []).some((e3) => {
      var t3 = e3.toLowerCase();
      return -1 !== i2.indexOf(t3);
    });
  };
  var Is = function(e2, t2) {
    if (!e2)
      return false;
    var i2 = e2.userAgent;
    if (i2 && xs(i2, t2))
      return true;
    try {
      var n2 = null == e2 ? void 0 : e2.userAgentData;
      if (null != n2 && n2.brands && n2.brands.some((e3) => xs(null == e3 ? void 0 : e3.brand, t2)))
        return true;
    } catch (e3) {
    }
    return !!e2.webdriver;
  };
  var Cs = class {
    constructor() {
      this.clicks = [];
    }
    isRageClick(e2, t2, i2) {
      var n2 = this.clicks[this.clicks.length - 1];
      if (n2 && Math.abs(e2 - n2.x) + Math.abs(t2 - n2.y) < 30 && i2 - n2.timestamp < 1e3) {
        if (this.clicks.push({ x: e2, y: t2, timestamp: i2 }), 3 === this.clicks.length)
          return true;
      } else
        this.clicks = [{ x: e2, y: t2, timestamp: i2 }];
      return false;
    }
  };
  var Ps = B("[Dead Clicks]");
  var Rs = () => true;
  var Fs = (e2) => {
    var t2, i2 = !(null === (t2 = e2.instance.persistence) || void 0 === t2 || !t2.get_property(de)), n2 = e2.instance.config.capture_dead_clicks;
    return M(n2) ? n2 : i2;
  };
  var Ts = class {
    get lazyLoadedDeadClicksAutocapture() {
      return this._lazyLoadedDeadClicksAutocapture;
    }
    constructor(e2, t2, i2) {
      this.instance = e2, this.isEnabled = t2, this.onCapture = i2, this.startIfEnabled();
    }
    onRemoteConfig(e2) {
      this.instance.persistence && this.instance.persistence.register({ [de]: null == e2 ? void 0 : e2.captureDeadClicks }), this.startIfEnabled();
    }
    startIfEnabled() {
      this.isEnabled(this) && this.loadScript(() => {
        this.start();
      });
    }
    loadScript(e2) {
      var t2, i2, n2;
      null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.initDeadClicksAutocapture && e2(), null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (n2 = i2.loadExternalDependency) || void 0 === n2 || n2.call(i2, this.instance, "dead-clicks-autocapture", (t3) => {
        t3 ? Ps.error("failed to load script", t3) : e2();
      });
    }
    start() {
      var e2;
      if (a) {
        if (!this._lazyLoadedDeadClicksAutocapture && null !== (e2 = _.__PosthogExtensions__) && void 0 !== e2 && e2.initDeadClicksAutocapture) {
          var t2 = C(this.instance.config.capture_dead_clicks) ? this.instance.config.capture_dead_clicks : {};
          t2.__onCapture = this.onCapture, this._lazyLoadedDeadClicksAutocapture = _.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, t2), this._lazyLoadedDeadClicksAutocapture.start(a), Ps.info("starting...");
        }
      } else
        Ps.error("`document` not found. Cannot start.");
    }
    stop() {
      this._lazyLoadedDeadClicksAutocapture && (this._lazyLoadedDeadClicksAutocapture.stop(), this._lazyLoadedDeadClicksAutocapture = void 0, Ps.info("stopping..."));
    }
  };
  var $s = B("[Heatmaps]");
  function Os(e2) {
    return C(e2) && "clientX" in e2 && "clientY" in e2 && L(e2.clientX) && L(e2.clientY);
  }
  var Ls = class {
    constructor(e2) {
      var i2;
      W(this, "rageclicks", new Cs()), W(this, "_enabledServerSide", false), W(this, "_initialized", false), W(this, "_flushInterval", null), this.instance = e2, this._enabledServerSide = !(null === (i2 = this.instance.persistence) || void 0 === i2 || !i2.props[le]), null == t || t.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
    get flushIntervalMilliseconds() {
      var e2 = 5e3;
      return C(this.instance.config.capture_heatmaps) && this.instance.config.capture_heatmaps.flush_interval_milliseconds && (e2 = this.instance.config.capture_heatmaps.flush_interval_milliseconds), e2;
    }
    get isEnabled() {
      return R(this.instance.config.capture_heatmaps) ? R(this.instance.config.enable_heatmaps) ? this._enabledServerSide : this.instance.config.enable_heatmaps : false !== this.instance.config.capture_heatmaps;
    }
    startIfEnabled() {
      if (this.isEnabled) {
        if (this._initialized)
          return;
        $s.info("starting..."), this._setupListeners(), this._flushInterval = setInterval(this.flush.bind(this), this.flushIntervalMilliseconds);
      } else {
        var e2, t2;
        clearInterval(null !== (e2 = this._flushInterval) && void 0 !== e2 ? e2 : void 0), null === (t2 = this.deadClicksCapture) || void 0 === t2 || t2.stop(), this.getAndClearBuffer();
      }
    }
    onRemoteConfig(e2) {
      var t2 = !!e2.heatmaps;
      this.instance.persistence && this.instance.persistence.register({ [le]: t2 }), this._enabledServerSide = t2, this.startIfEnabled();
    }
    getAndClearBuffer() {
      var e2 = this.buffer;
      return this.buffer = void 0, e2;
    }
    _onDeadClick(e2) {
      this._onClick(e2.originalEvent, "deadclick");
    }
    _setupListeners() {
      t && a && (ie(a, "click", (e2) => this._onClick(e2 || (null == t ? void 0 : t.event)), false, true), ie(a, "mousemove", (e2) => this._onMouseMove(e2 || (null == t ? void 0 : t.event)), false, true), this.deadClicksCapture = new Ts(this.instance, Rs, this._onDeadClick.bind(this)), this.deadClicksCapture.startIfEnabled(), this._initialized = true);
    }
    _getProperties(e2, i2) {
      var n2 = this.instance.scrollManager.scrollY(), r2 = this.instance.scrollManager.scrollX(), s2 = this.instance.scrollManager.scrollElement(), o2 = function(e3, i3, n3) {
        for (var r3 = e3; r3 && xi(r3) && !Ii(r3, "body"); ) {
          if (r3 === n3)
            return false;
          if (m(i3, null == t ? void 0 : t.getComputedStyle(r3).position))
            return true;
          r3 = Ai(r3);
        }
        return false;
      }(Li(e2), ["fixed", "sticky"], s2);
      return { x: e2.clientX + (o2 ? 0 : r2), y: e2.clientY + (o2 ? 0 : n2), target_fixed: o2, type: i2 };
    }
    _onClick(e2) {
      var t2, i2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "click";
      if (!ki(e2.target) && Os(e2)) {
        var n2 = this._getProperties(e2, i2);
        null !== (t2 = this.rageclicks) && void 0 !== t2 && t2.isRageClick(e2.clientX, e2.clientY, new Date().getTime()) && this._capture(j(j({}, n2), {}, { type: "rageclick" })), this._capture(n2);
      }
    }
    _onMouseMove(e2) {
      !ki(e2.target) && Os(e2) && (clearTimeout(this._mouseMoveTimeout), this._mouseMoveTimeout = setTimeout(() => {
        this._capture(this._getProperties(e2, "mousemove"));
      }, 500));
    }
    _capture(e2) {
      if (t) {
        var i2 = t.location.href;
        this.buffer = this.buffer || {}, this.buffer[i2] || (this.buffer[i2] = []), this.buffer[i2].push(e2);
      }
    }
    flush() {
      this.buffer && !P(this.buffer) && this.instance.capture("$$heatmap", { $heatmap_data: this.getAndClearBuffer() });
    }
  };
  var Ms = class {
    constructor(e2) {
      W(this, "_updateScrollData", () => {
        var e3, t2, i2, n2;
        this.context || (this.context = {});
        var r2 = this.scrollElement(), s2 = this.scrollY(), o2 = r2 ? Math.max(0, r2.scrollHeight - r2.clientHeight) : 0, a2 = s2 + ((null == r2 ? void 0 : r2.clientHeight) || 0), l2 = (null == r2 ? void 0 : r2.scrollHeight) || 0;
        this.context.lastScrollY = Math.ceil(s2), this.context.maxScrollY = Math.max(s2, null !== (e3 = this.context.maxScrollY) && void 0 !== e3 ? e3 : 0), this.context.maxScrollHeight = Math.max(o2, null !== (t2 = this.context.maxScrollHeight) && void 0 !== t2 ? t2 : 0), this.context.lastContentY = a2, this.context.maxContentY = Math.max(a2, null !== (i2 = this.context.maxContentY) && void 0 !== i2 ? i2 : 0), this.context.maxContentHeight = Math.max(l2, null !== (n2 = this.context.maxContentHeight) && void 0 !== n2 ? n2 : 0);
      }), this.instance = e2;
    }
    getContext() {
      return this.context;
    }
    resetContext() {
      var e2 = this.context;
      return setTimeout(this._updateScrollData, 0), e2;
    }
    startMeasuringScrollPosition() {
      null == t || t.addEventListener("scroll", this._updateScrollData, true), null == t || t.addEventListener("scrollend", this._updateScrollData, true), null == t || t.addEventListener("resize", this._updateScrollData);
    }
    scrollElement() {
      if (!this.instance.config.scroll_root_selector)
        return null == t ? void 0 : t.document.documentElement;
      var e2 = x(this.instance.config.scroll_root_selector) ? this.instance.config.scroll_root_selector : [this.instance.config.scroll_root_selector];
      for (var i2 of e2) {
        var n2 = null == t ? void 0 : t.document.querySelector(i2);
        if (n2)
          return n2;
      }
    }
    scrollY() {
      if (this.instance.config.scroll_root_selector) {
        var e2 = this.scrollElement();
        return e2 && e2.scrollTop || 0;
      }
      return t && (t.scrollY || t.pageYOffset || t.document.documentElement.scrollTop) || 0;
    }
    scrollX() {
      if (this.instance.config.scroll_root_selector) {
        var e2 = this.scrollElement();
        return e2 && e2.scrollLeft || 0;
      }
      return t && (t.scrollX || t.pageXOffset || t.document.documentElement.scrollLeft) || 0;
    }
  };
  var As = B("[AutoCapture]");
  function Ds(e2, t2) {
    return t2.length > e2 ? t2.slice(0, e2) + "..." : t2;
  }
  function Ns(e2) {
    if (e2.previousElementSibling)
      return e2.previousElementSibling;
    var t2 = e2;
    do {
      t2 = t2.previousSibling;
    } while (t2 && !xi(t2));
    return t2;
  }
  function qs(e2, t2, i2, n2) {
    var r2 = e2.tagName.toLowerCase(), s2 = { tag_name: r2 };
    Mi.indexOf(r2) > -1 && !i2 && ("a" === r2.toLowerCase() || "button" === r2.toLowerCase() ? s2.$el_text = Ds(1024, Vi(e2)) : s2.$el_text = Ds(1024, Oi(e2)));
    var o2 = Ti(e2);
    o2.length > 0 && (s2.classes = o2.filter(function(e3) {
      return "" !== e3;
    })), Y(e2.attributes, function(i3) {
      var r3;
      if ((!qi(e2) || -1 !== ["name", "id", "class", "aria-label"].indexOf(i3.name)) && ((null == n2 || !n2.includes(i3.name)) && !t2 && Gi(i3.value) && (r3 = i3.name, !F(r3) || "_ngcontent" !== r3.substring(0, 10) && "_nghost" !== r3.substring(0, 7)))) {
        var o3 = i3.value;
        "class" === i3.name && (o3 = Ri(o3).join(" ")), s2["attr__" + i3.name] = Ds(1024, o3);
      }
    });
    for (var a2 = 1, l2 = 1, u2 = e2; u2 = Ns(u2); )
      a2++, u2.tagName === e2.tagName && l2++;
    return s2.nth_child = a2, s2.nth_of_type = l2, s2;
  }
  function Bs(e2, i2) {
    for (var n2, r2, { e: s2, maskAllElementAttributes: o2, maskAllText: a2, elementAttributeIgnoreList: l2, elementsChainAsString: u2 } = i2, c2 = [e2], d2 = e2; d2.parentNode && !Ii(d2, "body"); )
      Pi(d2.parentNode) ? (c2.push(d2.parentNode.host), d2 = d2.parentNode.host) : (c2.push(d2.parentNode), d2 = d2.parentNode);
    var h2, _2 = [], p2 = {}, v2 = false, g2 = false;
    if (Y(c2, (e3) => {
      var t2 = Ni(e3);
      "a" === e3.tagName.toLowerCase() && (v2 = e3.getAttribute("href"), v2 = t2 && v2 && Gi(v2) && v2), m(Ti(e3), "ph-no-capture") && (g2 = true), _2.push(qs(e3, o2, a2, l2));
      var i3 = function(e4) {
        if (!Ni(e4))
          return {};
        var t3 = {};
        return Y(e4.attributes, function(e5) {
          if (e5.name && 0 === e5.name.indexOf("data-ph-capture-attribute")) {
            var i4 = e5.name.replace("data-ph-capture-attribute-", ""), n3 = e5.value;
            i4 && n3 && Gi(n3) && (t3[i4] = n3);
          }
        }), t3;
      }(e3);
      K(p2, i3);
    }), g2)
      return { props: {}, explicitNoCapture: g2 };
    if (a2 || ("a" === e2.tagName.toLowerCase() || "button" === e2.tagName.toLowerCase() ? _2[0].$el_text = Vi(e2) : _2[0].$el_text = Oi(e2)), v2) {
      var f, b2;
      _2[0].attr__href = v2;
      var y2 = null === (f = vt(v2)) || void 0 === f ? void 0 : f.host, w2 = null == t || null === (b2 = t.location) || void 0 === b2 ? void 0 : b2.host;
      y2 && w2 && y2 !== w2 && (h2 = v2);
    }
    return { props: K({ $event_type: s2.type, $ce_version: 1 }, u2 ? {} : { $elements: _2 }, { $elements_chain: Yi(_2) }, null !== (n2 = _2[0]) && void 0 !== n2 && n2.$el_text ? { $el_text: null === (r2 = _2[0]) || void 0 === r2 ? void 0 : r2.$el_text } : {}, h2 && "click" === s2.type ? { $external_click_url: h2 } : {}, p2) };
  }
  var Hs = class {
    constructor(e2) {
      W(this, "_initialized", false), W(this, "_isDisabledServerSide", null), W(this, "rageclicks", new Cs()), W(this, "_elementsChainAsString", false), this.instance = e2, this._elementSelectors = null;
    }
    get config() {
      var e2, t2, i2 = C(this.instance.config.autocapture) ? this.instance.config.autocapture : {};
      return i2.url_allowlist = null === (e2 = i2.url_allowlist) || void 0 === e2 ? void 0 : e2.map((e3) => new RegExp(e3)), i2.url_ignorelist = null === (t2 = i2.url_ignorelist) || void 0 === t2 ? void 0 : t2.map((e3) => new RegExp(e3)), i2;
    }
    _addDomEventHandlers() {
      if (this.isBrowserSupported()) {
        if (t && a) {
          var e2 = (e3) => {
            e3 = e3 || (null == t ? void 0 : t.event);
            try {
              this._captureEvent(e3);
            } catch (e4) {
              As.error("Failed to capture event", e4);
            }
          }, i2 = (e3) => {
            e3 = e3 || (null == t ? void 0 : t.event), this._captureEvent(e3, v);
          };
          ie(a, "submit", e2, false, true), ie(a, "change", e2, false, true), ie(a, "click", e2, false, true), this.config.capture_copied_text && (ie(a, "copy", i2, false, true), ie(a, "cut", i2, false, true));
        }
      } else
        As.info("Disabling Automatic Event Collection because this browser is not supported");
    }
    startIfEnabled() {
      this.isEnabled && !this._initialized && (this._addDomEventHandlers(), this._initialized = true);
    }
    onRemoteConfig(e2) {
      e2.elementsChainAsString && (this._elementsChainAsString = e2.elementsChainAsString), this.instance.persistence && this.instance.persistence.register({ [ae]: !!e2.autocapture_opt_out }), this._isDisabledServerSide = !!e2.autocapture_opt_out, this.startIfEnabled();
    }
    setElementSelectors(e2) {
      this._elementSelectors = e2;
    }
    getElementSelectors(e2) {
      var t2, i2 = [];
      return null === (t2 = this._elementSelectors) || void 0 === t2 || t2.forEach((t3) => {
        var n2 = null == a ? void 0 : a.querySelectorAll(t3);
        null == n2 || n2.forEach((n3) => {
          e2 === n3 && i2.push(t3);
        });
      }), i2;
    }
    get isEnabled() {
      var e2, t2, i2 = null === (e2 = this.instance.persistence) || void 0 === e2 ? void 0 : e2.props[ae], n2 = this._isDisabledServerSide;
      if ($(n2) && !M(i2) && !this.instance.config.advanced_disable_decide)
        return false;
      var r2 = null !== (t2 = this._isDisabledServerSide) && void 0 !== t2 ? t2 : !!i2;
      return !!this.instance.config.autocapture && !r2;
    }
    _captureEvent(e2) {
      var i2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "$autocapture";
      if (this.isEnabled) {
        var n2, r2 = Li(e2);
        if (Ci(r2) && (r2 = r2.parentNode || null), "$autocapture" === i2 && "click" === e2.type && e2 instanceof MouseEvent)
          this.instance.config.rageclick && null !== (n2 = this.rageclicks) && void 0 !== n2 && n2.isRageClick(e2.clientX, e2.clientY, new Date().getTime()) && this._captureEvent(e2, "$rageclick");
        var s2 = i2 === v;
        if (r2 && Di(r2, e2, this.config, s2, s2 ? ["copy", "cut"] : void 0)) {
          var { props: o2, explicitNoCapture: a2 } = Bs(r2, { e: e2, maskAllElementAttributes: this.instance.config.mask_all_element_attributes, maskAllText: this.instance.config.mask_all_text, elementAttributeIgnoreList: this.config.element_attribute_ignorelist, elementsChainAsString: this._elementsChainAsString });
          if (a2)
            return false;
          var l2 = this.getElementSelectors(r2);
          if (l2 && l2.length > 0 && (o2.$element_selectors = l2), i2 === v) {
            var u2, c2 = $i(null == t || null === (u2 = t.getSelection()) || void 0 === u2 ? void 0 : u2.toString()), d2 = e2.type || "clipboard";
            if (!c2)
              return false;
            o2.$selected_content = c2, o2.$copy_type = d2;
          }
          return this.instance.capture(i2, o2), true;
        }
      }
    }
    isBrowserSupported() {
      return I(null == a ? void 0 : a.querySelectorAll);
    }
  };
  var Us = B("[TracingHeaders]");
  var zs = class {
    constructor(e2) {
      W(this, "_restoreXHRPatch", void 0), W(this, "_restoreFetchPatch", void 0), W(this, "_startCapturing", () => {
        var e3, t2, i2, n2;
        R(this._restoreXHRPatch) && (null === (e3 = _.__PosthogExtensions__) || void 0 === e3 || null === (t2 = e3.tracingHeadersPatchFns) || void 0 === t2 || t2._patchXHR(this.instance.sessionManager));
        R(this._restoreFetchPatch) && (null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (n2 = i2.tracingHeadersPatchFns) || void 0 === n2 || n2._patchFetch(this.instance.sessionManager));
      }), this.instance = e2;
    }
    _loadScript(e2) {
      var t2, i2, n2;
      null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.tracingHeadersPatchFns && e2(), null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (n2 = i2.loadExternalDependency) || void 0 === n2 || n2.call(i2, this.instance, "tracing-headers", (t3) => {
        if (t3)
          return Us.error("failed to load script", t3);
        e2();
      });
    }
    startIfEnabledOrStop() {
      var e2, t2;
      this.instance.config.__add_tracing_headers ? this._loadScript(this._startCapturing) : (null === (e2 = this._restoreXHRPatch) || void 0 === e2 || e2.call(this), null === (t2 = this._restoreFetchPatch) || void 0 === t2 || t2.call(this), this._restoreXHRPatch = void 0, this._restoreFetchPatch = void 0);
    }
  };
  var js;
  !function(e2) {
    e2[e2.PENDING = -1] = "PENDING", e2[e2.DENIED = 0] = "DENIED", e2[e2.GRANTED = 1] = "GRANTED";
  }(js || (js = {}));
  var Ws = class {
    constructor(e2) {
      this.instance = e2;
    }
    get config() {
      return this.instance.config;
    }
    get consent() {
      return this.getDnt() ? js.DENIED : this.storedConsent;
    }
    isOptedOut() {
      return this.consent === js.DENIED || this.consent === js.PENDING && this.config.opt_out_capturing_by_default;
    }
    isOptedIn() {
      return !this.isOptedOut();
    }
    optInOut(e2) {
      this.storage.set(this.storageKey, e2 ? 1 : 0, this.config.cookie_expiration, this.config.cross_subdomain_cookie, this.config.secure_cookie);
    }
    reset() {
      this.storage.remove(this.storageKey, this.config.cross_subdomain_cookie);
    }
    get storageKey() {
      var { token: e2, opt_out_capturing_cookie_prefix: t2 } = this.instance.config;
      return (t2 || "__ph_opt_in_out_") + e2;
    }
    get storedConsent() {
      var e2 = this.storage.get(this.storageKey);
      return "1" === e2 ? js.GRANTED : "0" === e2 ? js.DENIED : js.PENDING;
    }
    get storage() {
      if (!this._storage) {
        var e2 = this.config.opt_out_capturing_persistence_type;
        this._storage = "localStorage" === e2 ? at : st;
        var t2 = "localStorage" === e2 ? st : at;
        t2.get(this.storageKey) && (this._storage.get(this.storageKey) || this.optInOut("1" === t2.get(this.storageKey)), t2.remove(this.storageKey, this.config.cross_subdomain_cookie));
      }
      return this._storage;
    }
    getDnt() {
      return !!this.config.respect_dnt && !!ne([null == o ? void 0 : o.doNotTrack, null == o ? void 0 : o.msDoNotTrack, _.doNotTrack], (e2) => m([true, 1, "1", "yes"], e2));
    }
  };
  var Gs = B("[ExceptionAutocapture]");
  var Vs = class {
    constructor(e2) {
      var i2;
      W(this, "originalOnUnhandledRejectionHandler", void 0), W(this, "startCapturing", () => {
        var e3, i3, n2, r2;
        if (t && this.isEnabled && !this.hasHandlers && !this.isCapturing) {
          var s2 = null === (e3 = _.__PosthogExtensions__) || void 0 === e3 || null === (i3 = e3.errorWrappingFunctions) || void 0 === i3 ? void 0 : i3.wrapOnError, o2 = null === (n2 = _.__PosthogExtensions__) || void 0 === n2 || null === (r2 = n2.errorWrappingFunctions) || void 0 === r2 ? void 0 : r2.wrapUnhandledRejection;
          if (s2 && o2)
            try {
              this.unwrapOnError = s2(this.captureException.bind(this)), this.unwrapUnhandledRejection = o2(this.captureException.bind(this));
            } catch (e4) {
              Gs.error("failed to start", e4), this.stopCapturing();
            }
          else
            Gs.error("failed to load error wrapping functions - cannot start");
        }
      }), this.instance = e2, this.remoteEnabled = !(null === (i2 = this.instance.persistence) || void 0 === i2 || !i2.props[ue]), this.startIfEnabled();
    }
    get isEnabled() {
      var e2;
      return null !== (e2 = this.remoteEnabled) && void 0 !== e2 && e2;
    }
    get isCapturing() {
      var e2;
      return !(null == t || null === (e2 = t.onerror) || void 0 === e2 || !e2.__POSTHOG_INSTRUMENTED__);
    }
    get hasHandlers() {
      return this.originalOnUnhandledRejectionHandler || this.unwrapOnError;
    }
    startIfEnabled() {
      this.isEnabled && !this.isCapturing && (Gs.info("enabled, starting..."), this.loadScript(this.startCapturing));
    }
    loadScript(e2) {
      var t2, i2;
      this.hasHandlers && e2(), null === (t2 = _.__PosthogExtensions__) || void 0 === t2 || null === (i2 = t2.loadExternalDependency) || void 0 === i2 || i2.call(t2, this.instance, "exception-autocapture", (t3) => {
        if (t3)
          return Gs.error("failed to load script", t3);
        e2();
      });
    }
    stopCapturing() {
      var e2, t2;
      null === (e2 = this.unwrapOnError) || void 0 === e2 || e2.call(this), null === (t2 = this.unwrapUnhandledRejection) || void 0 === t2 || t2.call(this);
    }
    onRemoteConfig(e2) {
      var t2 = e2.autocaptureExceptions;
      this.remoteEnabled = !!t2 || false, this.instance.persistence && this.instance.persistence.register({ [ue]: this.remoteEnabled }), this.startIfEnabled();
    }
    captureException(e2) {
      var t2 = this.instance.requestRouter.endpointFor("ui");
      e2.$exception_personURL = "".concat(t2, "/project/").concat(this.instance.config.token, "/person/").concat(this.instance.get_distinct_id()), this.instance.exceptions.sendExceptionEvent(e2);
    }
  };
  var Js = B("[Web Vitals]");
  var Ys = 9e5;
  var Ks = class {
    constructor(e2) {
      var t2;
      W(this, "_enabledServerSide", false), W(this, "_initialized", false), W(this, "buffer", { url: void 0, metrics: [], firstMetricTimestamp: void 0 }), W(this, "_flushToCapture", () => {
        clearTimeout(this._delayedFlushTimer), 0 !== this.buffer.metrics.length && (this.instance.capture("$web_vitals", this.buffer.metrics.reduce((e3, t3) => j(j({}, e3), {}, { ["$web_vitals_".concat(t3.name, "_event")]: j({}, t3), ["$web_vitals_".concat(t3.name, "_value")]: t3.value }), {})), this.buffer = { url: void 0, metrics: [], firstMetricTimestamp: void 0 });
      }), W(this, "_addToBuffer", (e3) => {
        var t3, i2 = null === (t3 = this.instance.sessionManager) || void 0 === t3 ? void 0 : t3.checkAndGetSessionAndWindowId(true);
        if (R(i2))
          Js.error("Could not read session ID. Dropping metrics!");
        else {
          this.buffer = this.buffer || { url: void 0, metrics: [], firstMetricTimestamp: void 0 };
          var n2 = this._currentURL();
          if (!R(n2))
            if (O(null == e3 ? void 0 : e3.name) || O(null == e3 ? void 0 : e3.value))
              Js.error("Invalid metric received", e3);
            else if (this._maxAllowedValue && e3.value >= this._maxAllowedValue)
              Js.error("Ignoring metric with value >= " + this._maxAllowedValue, e3);
            else
              this.buffer.url !== n2 && (this._flushToCapture(), this._delayedFlushTimer = setTimeout(this._flushToCapture, this.flushToCaptureTimeoutMs)), R(this.buffer.url) && (this.buffer.url = n2), this.buffer.firstMetricTimestamp = R(this.buffer.firstMetricTimestamp) ? Date.now() : this.buffer.firstMetricTimestamp, e3.attribution && e3.attribution.interactionTargetElement && (e3.attribution.interactionTargetElement = void 0), this.buffer.metrics.push(j(j({}, e3), {}, { $current_url: n2, $session_id: i2.sessionId, $window_id: i2.windowId, timestamp: Date.now() })), this.buffer.metrics.length === this.allowedMetrics.length && this._flushToCapture();
        }
      }), W(this, "_startCapturing", () => {
        var e3, t3, i2, n2, r2 = _.__PosthogExtensions__;
        R(r2) || R(r2.postHogWebVitalsCallbacks) || ({ onLCP: e3, onCLS: t3, onFCP: i2, onINP: n2 } = r2.postHogWebVitalsCallbacks), e3 && t3 && i2 && n2 ? (this.allowedMetrics.indexOf("LCP") > -1 && e3(this._addToBuffer.bind(this)), this.allowedMetrics.indexOf("CLS") > -1 && t3(this._addToBuffer.bind(this)), this.allowedMetrics.indexOf("FCP") > -1 && i2(this._addToBuffer.bind(this)), this.allowedMetrics.indexOf("INP") > -1 && n2(this._addToBuffer.bind(this)), this._initialized = true) : Js.error("web vitals callbacks not loaded - not starting");
      }), this.instance = e2, this._enabledServerSide = !(null === (t2 = this.instance.persistence) || void 0 === t2 || !t2.props[ce]), this.startIfEnabled();
    }
    get allowedMetrics() {
      var e2, t2, i2 = C(this.instance.config.capture_performance) ? null === (e2 = this.instance.config.capture_performance) || void 0 === e2 ? void 0 : e2.web_vitals_allowed_metrics : void 0;
      return R(i2) ? (null === (t2 = this.instance.persistence) || void 0 === t2 ? void 0 : t2.props[he]) || ["CLS", "FCP", "INP", "LCP"] : i2;
    }
    get flushToCaptureTimeoutMs() {
      return (C(this.instance.config.capture_performance) ? this.instance.config.capture_performance.web_vitals_delayed_flush_ms : void 0) || 5e3;
    }
    get _maxAllowedValue() {
      var e2 = C(this.instance.config.capture_performance) && L(this.instance.config.capture_performance.__web_vitals_max_value) ? this.instance.config.capture_performance.__web_vitals_max_value : Ys;
      return 0 < e2 && e2 <= 6e4 ? Ys : e2;
    }
    get isEnabled() {
      var e2 = C(this.instance.config.capture_performance) ? this.instance.config.capture_performance.web_vitals : void 0;
      return M(e2) ? e2 : this._enabledServerSide;
    }
    startIfEnabled() {
      this.isEnabled && !this._initialized && (Js.info("enabled, starting..."), this.loadScript(this._startCapturing));
    }
    onRemoteConfig(e2) {
      var t2 = C(e2.capturePerformance) && !!e2.capturePerformance.web_vitals, i2 = C(e2.capturePerformance) ? e2.capturePerformance.web_vitals_allowed_metrics : void 0;
      this.instance.persistence && (this.instance.persistence.register({ [ce]: t2 }), this.instance.persistence.register({ [he]: i2 })), this._enabledServerSide = t2, this.startIfEnabled();
    }
    loadScript(e2) {
      var t2, i2, n2;
      null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.postHogWebVitalsCallbacks && e2(), null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (n2 = i2.loadExternalDependency) || void 0 === n2 || n2.call(i2, this.instance, "web-vitals", (t3) => {
        t3 ? Js.error("failed to load script", t3) : e2();
      });
    }
    _currentURL() {
      var e2 = t ? t.location.href : void 0;
      return e2 || Js.error("Could not determine current URL"), e2;
    }
  };
  var Xs = { icontains: (e2, i2) => !!t && i2.href.toLowerCase().indexOf(e2.toLowerCase()) > -1, not_icontains: (e2, i2) => !!t && -1 === i2.href.toLowerCase().indexOf(e2.toLowerCase()), regex: (e2, i2) => !!t && gt(i2.href, e2), not_regex: (e2, i2) => !!t && !gt(i2.href, e2), exact: (e2, t2) => t2.href === e2, is_not: (e2, t2) => t2.href !== e2 };
  var Qs = class {
    constructor(e2) {
      var t2 = this;
      W(this, "getWebExperimentsAndEvaluateDisplayLogic", function() {
        var e3 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
        t2.getWebExperiments((e4) => {
          Qs.logInfo("retrieved web experiments from the server"), t2._flagToExperiments = /* @__PURE__ */ new Map(), e4.forEach((e5) => {
            if (e5.feature_flag_key) {
              var i2;
              if (t2._flagToExperiments)
                Qs.logInfo("setting flag key ", e5.feature_flag_key, " to web experiment ", e5), null === (i2 = t2._flagToExperiments) || void 0 === i2 || i2.set(e5.feature_flag_key, e5);
              var n2 = t2.instance.getFeatureFlag(e5.feature_flag_key);
              F(n2) && e5.variants[n2] && t2.applyTransforms(e5.name, n2, e5.variants[n2].transforms);
            } else if (e5.variants)
              for (var r2 in e5.variants) {
                var s2 = e5.variants[r2];
                Qs.matchesTestVariant(s2) && t2.applyTransforms(e5.name, r2, s2.transforms);
              }
          });
        }, e3);
      }), this.instance = e2, this.instance.onFeatureFlags((e3) => {
        this.onFeatureFlags(e3);
      });
    }
    onFeatureFlags(e2) {
      if (this._is_bot())
        Qs.logInfo("Refusing to render web experiment since the viewer is a likely bot");
      else if (!this.instance.config.disable_web_experiments) {
        if (O(this._flagToExperiments))
          return this._flagToExperiments = /* @__PURE__ */ new Map(), this.loadIfEnabled(), void this.previewWebExperiment();
        Qs.logInfo("applying feature flags", e2), e2.forEach((e3) => {
          var t2;
          if (this._flagToExperiments && null !== (t2 = this._flagToExperiments) && void 0 !== t2 && t2.has(e3)) {
            var i2, n2 = this.instance.getFeatureFlag(e3), r2 = null === (i2 = this._flagToExperiments) || void 0 === i2 ? void 0 : i2.get(e3);
            n2 && null != r2 && r2.variants[n2] && this.applyTransforms(r2.name, n2, r2.variants[n2].transforms);
          }
        });
      }
    }
    previewWebExperiment() {
      var e2 = Qs.getWindowLocation();
      if (null != e2 && e2.search) {
        var t2 = mt(null == e2 ? void 0 : e2.search, "__experiment_id"), i2 = mt(null == e2 ? void 0 : e2.search, "__experiment_variant");
        t2 && i2 && (Qs.logInfo("previewing web experiments ".concat(t2, " && ").concat(i2)), this.getWebExperiments((e3) => {
          this.showPreviewWebExperiment(parseInt(t2), i2, e3);
        }, false, true));
      }
    }
    loadIfEnabled() {
      this.instance.config.disable_web_experiments || this.getWebExperimentsAndEvaluateDisplayLogic();
    }
    getWebExperiments(e2, t2, i2) {
      if (this.instance.config.disable_web_experiments && !i2)
        return e2([]);
      var n2 = this.instance.get_property("$web_experiments");
      if (n2 && !t2)
        return e2(n2);
      this.instance._send_request({ url: this.instance.requestRouter.endpointFor("api", "/api/web_experiments/?token=".concat(this.instance.config.token)), method: "GET", callback: (t3) => {
        if (200 !== t3.statusCode || !t3.json)
          return e2([]);
        var i3 = t3.json.experiments || [];
        return e2(i3);
      } });
    }
    showPreviewWebExperiment(e2, t2, i2) {
      var n2 = i2.filter((t3) => t3.id === e2);
      n2 && n2.length > 0 && (Qs.logInfo("Previewing web experiment [".concat(n2[0].name, "] with variant [").concat(t2, "]")), this.applyTransforms(n2[0].name, t2, n2[0].variants[t2].transforms, true));
    }
    static matchesTestVariant(e2) {
      return !O(e2.conditions) && (Qs.matchUrlConditions(e2) && Qs.matchUTMConditions(e2));
    }
    static matchUrlConditions(e2) {
      var t2;
      if (O(e2.conditions) || O(null === (t2 = e2.conditions) || void 0 === t2 ? void 0 : t2.url))
        return true;
      var i2, n2, r2, s2 = Qs.getWindowLocation();
      return !!s2 && (null === (i2 = e2.conditions) || void 0 === i2 || !i2.url || Xs[null !== (n2 = null === (r2 = e2.conditions) || void 0 === r2 ? void 0 : r2.urlMatchType) && void 0 !== n2 ? n2 : "icontains"](e2.conditions.url, s2));
    }
    static getWindowLocation() {
      return null == t ? void 0 : t.location;
    }
    static matchUTMConditions(e2) {
      var t2;
      if (O(e2.conditions) || O(null === (t2 = e2.conditions) || void 0 === t2 ? void 0 : t2.utm))
        return true;
      var i2 = fi.campaignParams();
      if (i2.utm_source) {
        var n2, r2, s2, o2, a2, l2, u2, c2, d2, h2, _2, p2, v2, g2, f, m2, b2 = null === (n2 = e2.conditions) || void 0 === n2 || null === (r2 = n2.utm) || void 0 === r2 || !r2.utm_campaign || (null === (s2 = e2.conditions) || void 0 === s2 || null === (o2 = s2.utm) || void 0 === o2 ? void 0 : o2.utm_campaign) == i2.utm_campaign, y2 = null === (a2 = e2.conditions) || void 0 === a2 || null === (l2 = a2.utm) || void 0 === l2 || !l2.utm_source || (null === (u2 = e2.conditions) || void 0 === u2 || null === (c2 = u2.utm) || void 0 === c2 ? void 0 : c2.utm_source) == i2.utm_source, w2 = null === (d2 = e2.conditions) || void 0 === d2 || null === (h2 = d2.utm) || void 0 === h2 || !h2.utm_medium || (null === (_2 = e2.conditions) || void 0 === _2 || null === (p2 = _2.utm) || void 0 === p2 ? void 0 : p2.utm_medium) == i2.utm_medium, S2 = null === (v2 = e2.conditions) || void 0 === v2 || null === (g2 = v2.utm) || void 0 === g2 || !g2.utm_term || (null === (f = e2.conditions) || void 0 === f || null === (m2 = f.utm) || void 0 === m2 ? void 0 : m2.utm_term) == i2.utm_term;
        return b2 && w2 && S2 && y2;
      }
      return false;
    }
    static logInfo(e2) {
      for (var t2 = arguments.length, i2 = new Array(t2 > 1 ? t2 - 1 : 0), n2 = 1; n2 < t2; n2++)
        i2[n2 - 1] = arguments[n2];
      q.info("[WebExperiments] ".concat(e2), i2);
    }
    applyTransforms(e2, t2, i2, n2) {
      var r2;
      this._is_bot() ? Qs.logInfo("Refusing to render web experiment since the viewer is a likely bot") : "control" !== t2 ? i2.forEach((i3) => {
        if (i3.selector) {
          var r3;
          Qs.logInfo("applying transform of variant ".concat(t2, " for experiment ").concat(e2, " "), i3);
          var s2, o2 = 0, a2 = null === (r3 = document) || void 0 === r3 ? void 0 : r3.querySelectorAll(i3.selector);
          if (null == a2 || a2.forEach((e3) => {
            var t3 = e3;
            o2 += 1, i3.attributes && i3.attributes.forEach((e4) => {
              switch (e4.name) {
                case "text":
                  t3.innerText = e4.value;
                  break;
                case "html":
                  t3.innerHTML = e4.value;
                  break;
                case "cssClass":
                  t3.className = e4.value;
                  break;
                default:
                  t3.setAttribute(e4.name, e4.value);
              }
            }), i3.text && (t3.innerText = i3.text), i3.html && (t3.parentElement ? t3.parentElement.innerHTML = i3.html : t3.innerHTML = i3.html), i3.css && t3.setAttribute("style", i3.css);
          }), this.instance && this.instance.capture)
            this.instance.capture("$web_experiment_applied", { $web_experiment_name: e2, $web_experiment_variant: t2, $web_experiment_preview: n2, $web_experiment_document_url: null === (s2 = Qs.getWindowLocation()) || void 0 === s2 ? void 0 : s2.href, $web_experiment_elements_modified: o2 });
        }
      }) : (Qs.logInfo("Control variants leave the page unmodified."), this.instance && this.instance.capture && this.instance.capture("$web_experiment_applied", { $web_experiment_name: e2, $web_experiment_preview: n2, $web_experiment_variant: t2, $web_experiment_document_url: null === (r2 = Qs.getWindowLocation()) || void 0 === r2 ? void 0 : r2.href, $web_experiment_elements_modified: 0 }));
    }
    _is_bot() {
      return o && this.instance ? Is(o, this.instance.config.custom_blocked_useragents) : void 0;
    }
  };
  var Zs = class {
    constructor(e2) {
      this.instance = e2;
    }
    sendExceptionEvent(e2) {
      this.instance.capture("$exception", e2, { _noTruncate: true, _batchKey: "exceptionEvent" });
    }
  };
  var eo = ["$set_once", "$set"];
  var to = B("[SiteApps]");
  var io = class {
    constructor(e2) {
      this.instance = e2, this.bufferedInvocations = [], this.apps = {};
    }
    get isEnabled() {
      return !!this.instance.config.opt_in_site_apps;
    }
    eventCollector(e2, t2) {
      if (t2) {
        var i2 = this.globalsForEvent(t2);
        this.bufferedInvocations.push(i2), this.bufferedInvocations.length > 1e3 && (this.bufferedInvocations = this.bufferedInvocations.slice(10));
      }
    }
    get siteAppLoaders() {
      var e2, t2;
      return null === (e2 = _._POSTHOG_REMOTE_CONFIG) || void 0 === e2 || null === (t2 = e2[this.instance.config.token]) || void 0 === t2 ? void 0 : t2.siteApps;
    }
    init() {
      if (this.isEnabled) {
        var e2 = this.instance._addCaptureHook(this.eventCollector.bind(this));
        this.stopBuffering = () => {
          e2(), this.bufferedInvocations = [], this.stopBuffering = void 0;
        };
      }
    }
    globalsForEvent(e2) {
      var t2, i2, n2, r2, s2, o2, a2;
      if (!e2)
        throw new Error("Event payload is required");
      var l2 = {}, u2 = this.instance.get_property("$groups") || [], c2 = this.instance.get_property("$stored_group_properties") || {};
      for (var [d2, h2] of Object.entries(c2))
        l2[d2] = { id: u2[d2], type: d2, properties: h2 };
      var { $set_once: _2, $set: p2 } = e2;
      return { event: j(j({}, G(e2, eo)), {}, { properties: j(j(j({}, e2.properties), p2 ? { $set: j(j({}, null !== (t2 = null === (i2 = e2.properties) || void 0 === i2 ? void 0 : i2.$set) && void 0 !== t2 ? t2 : {}), p2) } : {}), _2 ? { $set_once: j(j({}, null !== (n2 = null === (r2 = e2.properties) || void 0 === r2 ? void 0 : r2.$set_once) && void 0 !== n2 ? n2 : {}), _2) } : {}), elements_chain: null !== (s2 = null === (o2 = e2.properties) || void 0 === o2 ? void 0 : o2.$elements_chain) && void 0 !== s2 ? s2 : "", distinct_id: null === (a2 = e2.properties) || void 0 === a2 ? void 0 : a2.distinct_id }), person: { properties: this.instance.get_property("$stored_person_properties") }, groups: l2 };
    }
    setupSiteApp(e2) {
      var t2 = { id: e2.id, loaded: false, errored: false };
      this.apps[e2.id] = t2;
      var i2 = (i3) => {
        var n3;
        for (var r2 of (this.apps[e2.id].errored = !i3, this.apps[e2.id].loaded = true, to.info("Site app with id ".concat(e2.id, " ").concat(i3 ? "loaded" : "errored")), i3 && this.bufferedInvocations.length && (to.info("Processing ".concat(this.bufferedInvocations.length, " events for site app with id ").concat(e2.id)), this.bufferedInvocations.forEach((e3) => {
          var i4;
          return null === (i4 = t2.processEvent) || void 0 === i4 ? void 0 : i4.call(t2, e3);
        })), Object.values(this.apps)))
          if (!r2.loaded)
            return;
        null === (n3 = this.stopBuffering) || void 0 === n3 || n3.call(this);
      };
      try {
        var { processEvent: n2 } = e2.init({ posthog: this.instance, callback: (e3) => {
          i2(e3);
        } });
        n2 && (t2.processEvent = n2);
      } catch (t3) {
        to.error("Error while initializing PostHog app with config id ".concat(e2.id), t3), i2(false);
      }
    }
    onCapturedEvent(e2) {
      if (0 !== Object.keys(this.apps).length) {
        var t2 = this.globalsForEvent(e2);
        for (var i2 of Object.values(this.apps))
          try {
            var n2;
            null === (n2 = i2.processEvent) || void 0 === n2 || n2.call(i2, t2);
          } catch (t3) {
            to.error("Error while processing event ".concat(e2.event, " for site app ").concat(i2.id), t3);
          }
      }
    }
    onRemoteConfig(e2) {
      var t2, i2, n2, r2 = this;
      if (null !== (t2 = this.siteAppLoaders) && void 0 !== t2 && t2.length) {
        if (!this.isEnabled)
          return void to.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
        for (var s2 of this.siteAppLoaders)
          this.setupSiteApp(s2);
        this.instance.on("eventCaptured", (e3) => this.onCapturedEvent(e3));
      } else if (null === (i2 = this.stopBuffering) || void 0 === i2 || i2.call(this), null !== (n2 = e2.siteApps) && void 0 !== n2 && n2.length)
        if (this.isEnabled) {
          var o2 = function(e3, t3) {
            var i3, n3;
            _["__$$ph_site_app_".concat(e3)] = r2.instance, null === (i3 = _.__PosthogExtensions__) || void 0 === i3 || null === (n3 = i3.loadSiteApp) || void 0 === n3 || n3.call(i3, r2.instance, t3, (t4) => {
              if (t4)
                return to.error("Error while initializing PostHog app with config id ".concat(e3), t4);
            });
          };
          for (var { id: a2, url: l2 } of e2.siteApps)
            o2(a2, l2);
        } else
          to.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
    }
  };
  var no = {};
  var ro = () => {
  };
  var so = "posthog";
  var oo = !dr && -1 === (null == h ? void 0 : h.indexOf("MSIE")) && -1 === (null == h ? void 0 : h.indexOf("Mozilla"));
  var ao = () => {
    var e2, i2, n2;
    return { api_host: "https://us.i.posthog.com", ui_host: null, token: "", autocapture: true, rageclick: true, cross_subdomain_cookie: (i2 = null == a ? void 0 : a.location, n2 = null == i2 ? void 0 : i2.hostname, !!F(n2) && "herokuapp.com" !== n2.split(".").slice(-2).join(".")), persistence: "localStorage+cookie", persistence_name: "", loaded: ro, store_google: true, custom_campaign_params: [], custom_blocked_useragents: [], save_referrer: true, capture_pageview: true, capture_pageleave: "if_capture_pageview", debug: l && F(null == l ? void 0 : l.search) && -1 !== l.search.indexOf("__posthog_debug=true") || false, verbose: false, cookie_expiration: 365, upgrade: false, disable_session_recording: false, disable_persistence: false, disable_web_experiments: true, disable_surveys: false, enable_recording_console_log: void 0, secure_cookie: "https:" === (null == t || null === (e2 = t.location) || void 0 === e2 ? void 0 : e2.protocol), ip: true, opt_out_capturing_by_default: false, opt_out_persistence_by_default: false, opt_out_useragent_filter: false, opt_out_capturing_persistence_type: "localStorage", opt_out_capturing_cookie_prefix: null, opt_in_site_apps: false, property_denylist: [], respect_dnt: false, sanitize_properties: null, request_headers: {}, inapp_protocol: "//", inapp_link_new_window: false, request_batching: true, properties_string_max_length: 65535, session_recording: {}, mask_all_element_attributes: false, mask_all_text: false, advanced_disable_decide: false, advanced_disable_feature_flags: false, advanced_disable_feature_flags_on_first_load: false, advanced_disable_toolbar_metrics: false, feature_flag_request_timeout_ms: 3e3, on_request_error: (e3) => {
      var t2 = "Bad HTTP status: " + e3.statusCode + " " + e3.text;
      q.error(t2);
    }, get_device_id: (e3) => e3, _onCapture: ro, capture_performance: void 0, name: "posthog", bootstrap: {}, disable_compression: false, session_idle_timeout_seconds: 1800, person_profiles: "identified_only", __add_tracing_headers: false, before_send: void 0 };
  };
  var lo = (e2) => {
    var t2 = {};
    R(e2.process_person) || (t2.person_profiles = e2.process_person), R(e2.xhr_headers) || (t2.request_headers = e2.xhr_headers), R(e2.cookie_name) || (t2.persistence_name = e2.cookie_name), R(e2.disable_cookie) || (t2.disable_persistence = e2.disable_cookie);
    var i2 = K({}, t2, e2);
    return x(e2.property_blacklist) && (R(e2.property_denylist) ? i2.property_denylist = e2.property_blacklist : x(e2.property_denylist) ? i2.property_denylist = [...e2.property_blacklist, ...e2.property_denylist] : q.error("Invalid value for property_denylist config: " + e2.property_denylist)), i2;
  };
  var uo = class {
    constructor() {
      W(this, "__forceAllowLocalhost", false);
    }
    get _forceAllowLocalhost() {
      return this.__forceAllowLocalhost;
    }
    set _forceAllowLocalhost(e2) {
      q.error("WebPerformanceObserver is deprecated and has no impact on network capture. Use `_forceAllowLocalhostNetworkCapture` on `posthog.sessionRecording`"), this.__forceAllowLocalhost = e2;
    }
  };
  var co = class {
    get decideEndpointWasHit() {
      var e2, t2;
      return null !== (e2 = null === (t2 = this.featureFlags) || void 0 === t2 ? void 0 : t2.hasLoadedFlags) && void 0 !== e2 && e2;
    }
    constructor() {
      W(this, "webPerformance", new uo()), W(this, "version", p.LIB_VERSION), W(this, "_internalEventEmitter", new Or()), this.config = ao(), this.SentryIntegration = Ir, this.sentryIntegration = (e2) => function(e3, t2) {
        var i2 = xr(e3, t2);
        return { name: kr, processEvent: (e4) => i2(e4) };
      }(this, e2), this.__request_queue = [], this.__loaded = false, this.analyticsDefaultEndpoint = "/e/", this._initialPageviewCaptured = false, this._initialPersonProfilesConfig = null, this.featureFlags = new Ge(this), this.toolbar = new lr(this), this.scrollManager = new Ms(this), this.pageViewManager = new $r(this), this.surveys = new bs(this), this.experiments = new Qs(this), this.exceptions = new Zs(this), this.rateLimiter = new ws(this), this.requestRouter = new Er(this), this.consent = new Ws(this), this.people = { set: (e2, t2, i2) => {
        var n2 = F(e2) ? { [e2]: t2 } : e2;
        this.setPersonProperties(n2), null == i2 || i2({});
      }, set_once: (e2, t2, i2) => {
        var n2 = F(e2) ? { [e2]: t2 } : e2;
        this.setPersonProperties(void 0, n2), null == i2 || i2({});
      } }, this.on("eventCaptured", (e2) => q.info('send "'.concat(null == e2 ? void 0 : e2.event, '"'), e2));
    }
    init(e2, t2, i2) {
      if (i2 && i2 !== so) {
        var n2, r2 = null !== (n2 = no[i2]) && void 0 !== n2 ? n2 : new co();
        return r2._init(e2, t2, i2), no[i2] = r2, no[so][i2] = r2, r2;
      }
      return this._init(e2, t2, i2);
    }
    _init(i2) {
      var n2, r2, s2, o2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, a2 = arguments.length > 2 ? arguments[2] : void 0;
      if (R(i2) || T(i2))
        return q.critical("PostHog was initialized without a token. This likely indicates a misconfiguration. Please check the first argument passed to posthog.init()"), this;
      if (this.__loaded)
        return q.warn("You have already initialized PostHog! Re-initializing is a no-op"), this;
      this.__loaded = true, this.config = {}, this._triggered_notifs = [], o2.person_profiles && (this._initialPersonProfilesConfig = o2.person_profiles), this.set_config(K({}, ao(), lo(o2), { name: a2, token: i2 })), this.config.on_xhr_error && q.error("on_xhr_error is deprecated. Use on_request_error instead"), this.compression = o2.disable_compression ? void 0 : e.GZipJS, this.persistence = new bi(this.config), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new bi(j(j({}, this.config), {}, { persistence: "sessionStorage" }));
      var l2 = j({}, this.persistence.props), u2 = j({}, this.sessionPersistence.props);
      if (this._requestQueue = new ur((e2) => this._send_retriable_request(e2)), this._retryQueue = new mr(this), this.__request_queue = [], this.config.__preview_experimental_cookieless_mode || (this.sessionManager = new wr(this), this.sessionPropsManager = new Es(this.sessionManager, this.persistence)), new zs(this).startIfEnabledOrStop(), this.siteApps = new io(this), null === (n2 = this.siteApps) || void 0 === n2 || n2.init(), this.config.__preview_experimental_cookieless_mode || (this.sessionRecording = new ir(this), this.sessionRecording.startIfEnabledOrStop()), this.config.disable_scroll_properties || this.scrollManager.startMeasuringScrollPosition(), this.autocapture = new Hs(this), this.autocapture.startIfEnabled(), this.surveys.loadIfEnabled(), this.heatmaps = new Ls(this), this.heatmaps.startIfEnabled(), this.webVitalsAutocapture = new Ks(this), this.exceptionObserver = new Vs(this), this.exceptionObserver.startIfEnabled(), this.deadClicksAutocapture = new Ts(this, Fs), this.deadClicksAutocapture.startIfEnabled(), p.DEBUG = p.DEBUG || this.config.debug, p.DEBUG && q.info("Starting in debug mode", { this: this, config: o2, thisC: j({}, this.config), p: l2, s: u2 }), this._sync_opt_out_with_persistence(), void 0 !== (null === (r2 = o2.bootstrap) || void 0 === r2 ? void 0 : r2.distinctID)) {
        var c2, d2, h2 = this.config.get_device_id(Ze()), _2 = null !== (c2 = o2.bootstrap) && void 0 !== c2 && c2.isIdentifiedID ? h2 : o2.bootstrap.distinctID;
        this.persistence.set_property(Te, null !== (d2 = o2.bootstrap) && void 0 !== d2 && d2.isIdentifiedID ? "identified" : "anonymous"), this.register({ distinct_id: o2.bootstrap.distinctID, $device_id: _2 });
      }
      if (this._hasBootstrappedFeatureFlags()) {
        var v2, g2, f = Object.keys((null === (v2 = o2.bootstrap) || void 0 === v2 ? void 0 : v2.featureFlags) || {}).filter((e2) => {
          var t2, i3;
          return !(null === (t2 = o2.bootstrap) || void 0 === t2 || null === (i3 = t2.featureFlags) || void 0 === i3 || !i3[e2]);
        }).reduce((e2, t2) => {
          var i3, n3;
          return e2[t2] = (null === (i3 = o2.bootstrap) || void 0 === i3 || null === (n3 = i3.featureFlags) || void 0 === n3 ? void 0 : n3[t2]) || false, e2;
        }, {}), m2 = Object.keys((null === (g2 = o2.bootstrap) || void 0 === g2 ? void 0 : g2.featureFlagPayloads) || {}).filter((e2) => f[e2]).reduce((e2, t2) => {
          var i3, n3, r3, s3;
          null !== (i3 = o2.bootstrap) && void 0 !== i3 && null !== (n3 = i3.featureFlagPayloads) && void 0 !== n3 && n3[t2] && (e2[t2] = null === (r3 = o2.bootstrap) || void 0 === r3 || null === (s3 = r3.featureFlagPayloads) || void 0 === s3 ? void 0 : s3[t2]);
          return e2;
        }, {});
        this.featureFlags.receivedFeatureFlags({ featureFlags: f, featureFlagPayloads: m2 });
      }
      if (this.config.__preview_experimental_cookieless_mode)
        this.register_once({ distinct_id: qe, $device_id: null }, "");
      else if (!this.get_distinct_id()) {
        var b2 = this.config.get_device_id(Ze());
        this.register_once({ distinct_id: b2, $device_id: b2 }, ""), this.persistence.set_property(Te, "anonymous");
      }
      return null == t || null === (s2 = t.addEventListener) || void 0 === s2 || s2.call(t, "onpagehide" in self ? "pagehide" : "unload", this._handle_unload.bind(this)), this.toolbar.maybeLoadToolbar(), o2.segment ? Tr(this, () => this._loaded()) : this._loaded(), I(this.config._onCapture) && this.config._onCapture !== ro && (q.warn("onCapture is deprecated. Please use `before_send` instead"), this.on("eventCaptured", (e2) => this.config._onCapture(e2.event, e2))), this;
    }
    _onRemoteConfig(t2) {
      var i2, n2, r2, s2, o2, l2, u2, c2, d2;
      if (!a || !a.body)
        return q.info("document not ready yet, trying again in 500 milliseconds..."), void setTimeout(() => {
          this._onRemoteConfig(t2);
        }, 500);
      this.compression = void 0, t2.supportedCompression && !this.config.disable_compression && (this.compression = m(t2.supportedCompression, e.GZipJS) ? e.GZipJS : m(t2.supportedCompression, e.Base64) ? e.Base64 : void 0), null !== (i2 = t2.analytics) && void 0 !== i2 && i2.endpoint && (this.analyticsDefaultEndpoint = t2.analytics.endpoint), this.set_config({ person_profiles: this._initialPersonProfilesConfig ? this._initialPersonProfilesConfig : t2.defaultIdentifiedOnly ? "identified_only" : "always" }), null === (n2 = this.siteApps) || void 0 === n2 || n2.onRemoteConfig(t2), null === (r2 = this.sessionRecording) || void 0 === r2 || r2.onRemoteConfig(t2), null === (s2 = this.autocapture) || void 0 === s2 || s2.onRemoteConfig(t2), null === (o2 = this.heatmaps) || void 0 === o2 || o2.onRemoteConfig(t2), null === (l2 = this.surveys) || void 0 === l2 || l2.onRemoteConfig(t2), null === (u2 = this.webVitalsAutocapture) || void 0 === u2 || u2.onRemoteConfig(t2), null === (c2 = this.exceptionObserver) || void 0 === c2 || c2.onRemoteConfig(t2), null === (d2 = this.deadClicksAutocapture) || void 0 === d2 || d2.onRemoteConfig(t2);
    }
    _loaded() {
      try {
        this.config.loaded(this);
      } catch (e2) {
        q.critical("`loaded` function failed", e2);
      }
      this._start_queue_if_opted_in(), this.config.capture_pageview && setTimeout(() => {
        this.consent.isOptedIn() && this._captureInitialPageview();
      }, 1), new rr(this).load(), this.featureFlags.decide();
    }
    _start_queue_if_opted_in() {
      var e2;
      this.has_opted_out_capturing() || this.config.request_batching && (null === (e2 = this._requestQueue) || void 0 === e2 || e2.enable());
    }
    _dom_loaded() {
      this.has_opted_out_capturing() || J(this.__request_queue, (e2) => this._send_retriable_request(e2)), this.__request_queue = [], this._start_queue_if_opted_in();
    }
    _handle_unload() {
      var e2, t2;
      this.config.request_batching ? (this._shouldCapturePageleave() && this.capture("$pageleave"), null === (e2 = this._requestQueue) || void 0 === e2 || e2.unload(), null === (t2 = this._retryQueue) || void 0 === t2 || t2.unload()) : this._shouldCapturePageleave() && this.capture("$pageleave", null, { transport: "sendBeacon" });
    }
    _send_request(e2) {
      this.__loaded && (oo ? this.__request_queue.push(e2) : this.rateLimiter.isServerRateLimited(e2.batchKey) || (e2.transport = e2.transport || this.config.api_transport, e2.url = _r(e2.url, { ip: this.config.ip ? 1 : 0 }), e2.headers = j({}, this.config.request_headers), e2.compression = "best-available" === e2.compression ? this.compression : e2.compression, e2.fetchOptions = e2.fetchOptions || this.config.fetch_options, ((e3) => {
        var t2, i2, n2, r2 = j({}, e3);
        r2.timeout = r2.timeout || 6e4, r2.url = _r(r2.url, { _: new Date().getTime().toString(), ver: p.LIB_VERSION, compression: r2.compression });
        var s2 = null !== (t2 = r2.transport) && void 0 !== t2 ? t2 : "fetch", o2 = null !== (i2 = null === (n2 = ne(gr, (e4) => e4.transport === s2)) || void 0 === n2 ? void 0 : n2.method) && void 0 !== i2 ? i2 : gr[0].method;
        if (!o2)
          throw new Error("No available transport method");
        o2(r2);
      })(j(j({}, e2), {}, { callback: (t2) => {
        var i2, n2, r2;
        (this.rateLimiter.checkForLimiting(t2), t2.statusCode >= 400) && (null === (n2 = (r2 = this.config).on_request_error) || void 0 === n2 || n2.call(r2, t2));
        null === (i2 = e2.callback) || void 0 === i2 || i2.call(e2, t2);
      } }))));
    }
    _send_retriable_request(e2) {
      this._retryQueue ? this._retryQueue.retriableRequest(e2) : this._send_request(e2);
    }
    _execute_array(e2) {
      var t2, i2 = [], n2 = [], r2 = [];
      J(e2, (e3) => {
        e3 && (t2 = e3[0], x(t2) ? r2.push(e3) : I(e3) ? e3.call(this) : x(e3) && "alias" === t2 ? i2.push(e3) : x(e3) && -1 !== t2.indexOf("capture") && I(this[t2]) ? r2.push(e3) : n2.push(e3));
      });
      var s2 = function(e3, t3) {
        J(e3, function(e4) {
          if (x(e4[0])) {
            var i3 = t3;
            Y(e4, function(e5) {
              i3 = i3[e5[0]].apply(i3, e5.slice(1));
            });
          } else
            this[e4[0]].apply(this, e4.slice(1));
        }, t3);
      };
      s2(i2, this), s2(n2, this), s2(r2, this);
    }
    _hasBootstrappedFeatureFlags() {
      var e2, t2;
      return (null === (e2 = this.config.bootstrap) || void 0 === e2 ? void 0 : e2.featureFlags) && Object.keys(null === (t2 = this.config.bootstrap) || void 0 === t2 ? void 0 : t2.featureFlags).length > 0 || false;
    }
    push(e2) {
      this._execute_array([e2]);
    }
    capture(e2, t2, i2) {
      var n2;
      if (this.__loaded && this.persistence && this.sessionPersistence && this._requestQueue) {
        if (!this.consent.isOptedOut())
          if (!R(e2) && F(e2)) {
            if (this.config.opt_out_useragent_filter || !this._is_bot()) {
              var r2 = null != i2 && i2.skip_client_rate_limiting ? void 0 : this.rateLimiter.clientRateLimitContext();
              if (null == r2 || !r2.isRateLimited) {
                this.sessionPersistence.update_search_keyword(), this.config.store_google && this.sessionPersistence.update_campaign_params(), this.config.save_referrer && this.sessionPersistence.update_referrer_info(), (this.config.store_google || this.config.save_referrer) && this.persistence.set_initial_person_info();
                var s2 = new Date(), o2 = (null == i2 ? void 0 : i2.timestamp) || s2, a2 = { uuid: Ze(), event: e2, properties: this._calculate_event_properties(e2, t2 || {}, o2) };
                r2 && (a2.properties.$lib_rate_limit_remaining_tokens = r2.remainingTokens), (null == i2 ? void 0 : i2.$set) && (a2.$set = null == i2 ? void 0 : i2.$set);
                var l2 = this._calculate_set_once_properties(null == i2 ? void 0 : i2.$set_once);
                l2 && (a2.$set_once = l2), (a2 = te(a2, null != i2 && i2._noTruncate ? null : this.config.properties_string_max_length)).timestamp = o2, R(null == i2 ? void 0 : i2.timestamp) || (a2.properties.$event_time_override_provided = true, a2.properties.$event_time_override_system_time = s2);
                var u2 = j(j({}, a2.properties.$set), a2.$set);
                if (P(u2) || this.setPersonPropertiesForFlags(u2), !O(this.config.before_send)) {
                  var c2 = this._runBeforeSend(a2);
                  if (!c2)
                    return;
                  a2 = c2;
                }
                this._internalEventEmitter.emit("eventCaptured", a2);
                var d2 = { method: "POST", url: null !== (n2 = null == i2 ? void 0 : i2._url) && void 0 !== n2 ? n2 : this.requestRouter.endpointFor("api", this.analyticsDefaultEndpoint), data: a2, compression: "best-available", batchKey: null == i2 ? void 0 : i2._batchKey };
                return !this.config.request_batching || i2 && (null == i2 || !i2._batchKey) || null != i2 && i2.send_instantly ? this._send_retriable_request(d2) : this._requestQueue.enqueue(d2), a2;
              }
              q.critical("This capture call is ignored due to client rate limiting.");
            }
          } else
            q.error("No event name provided to posthog.capture");
      } else
        q.uninitializedWarning("posthog.capture");
    }
    _addCaptureHook(e2) {
      return this.on("eventCaptured", (t2) => e2(t2.event, t2));
    }
    _calculate_event_properties(e2, t2, i2) {
      if (i2 = i2 || new Date(), !this.persistence || !this.sessionPersistence)
        return t2;
      var n2 = this.persistence.remove_event_timer(e2), r2 = j({}, t2);
      if (r2.token = this.config.token, this.config.__preview_experimental_cookieless_mode && (r2.$cklsh_mode = true), "$snapshot" === e2) {
        var s2 = j(j({}, this.persistence.properties()), this.sessionPersistence.properties());
        return r2.distinct_id = s2.distinct_id, (!F(r2.distinct_id) && !L(r2.distinct_id) || T(r2.distinct_id)) && q.error("Invalid distinct_id for replay event. This indicates a bug in your implementation"), r2;
      }
      var o2 = fi.properties();
      if (this.sessionManager) {
        var { sessionId: l2, windowId: u2 } = this.sessionManager.checkAndGetSessionAndWindowId();
        r2.$session_id = l2, r2.$window_id = u2;
      }
      if (this.sessionRecording && (r2.$recording_status = this.sessionRecording.status), this.requestRouter.region === br.CUSTOM && (r2.$lib_custom_api_host = this.config.api_host), this.sessionPropsManager && this.config.__preview_send_client_session_params && ("$pageview" === e2 || "$pageleave" === e2 || "$autocapture" === e2)) {
        var c2 = this.sessionPropsManager.getSessionProps();
        r2 = K(r2, c2);
      }
      if (!this.config.disable_scroll_properties) {
        var d2 = {};
        "$pageview" === e2 ? d2 = this.pageViewManager.doPageView(i2) : "$pageleave" === e2 && (d2 = this.pageViewManager.doPageLeave(i2)), r2 = K(r2, d2);
      }
      if ("$pageview" === e2 && a && (r2.title = a.title), !R(n2)) {
        var _2 = i2.getTime() - n2;
        r2.$duration = parseFloat((_2 / 1e3).toFixed(3));
      }
      h && this.config.opt_out_useragent_filter && (r2.$browser_type = this._is_bot() ? "bot" : "browser"), (r2 = K({}, o2, this.persistence.properties(), this.sessionPersistence.properties(), r2)).$is_identified = this._isIdentified(), x(this.config.property_denylist) ? Y(this.config.property_denylist, function(e3) {
        delete r2[e3];
      }) : q.error("Invalid value for property_denylist config: " + this.config.property_denylist + " or property_blacklist config: " + this.config.property_blacklist);
      var p2 = this.config.sanitize_properties;
      p2 && (r2 = p2(r2, e2));
      var v2 = this._hasPersonProcessing();
      return r2.$process_person_profile = v2, v2 && this._requirePersonProcessing("_calculate_event_properties"), r2;
    }
    _calculate_set_once_properties(e2) {
      if (!this.persistence || !this._hasPersonProcessing())
        return e2;
      var t2 = K({}, this.persistence.get_initial_props(), e2 || {}), i2 = this.config.sanitize_properties;
      return i2 && (t2 = i2(t2, "$set_once")), P(t2) ? void 0 : t2;
    }
    register(e2, t2) {
      var i2;
      null === (i2 = this.persistence) || void 0 === i2 || i2.register(e2, t2);
    }
    register_once(e2, t2, i2) {
      var n2;
      null === (n2 = this.persistence) || void 0 === n2 || n2.register_once(e2, t2, i2);
    }
    register_for_session(e2) {
      var t2;
      null === (t2 = this.sessionPersistence) || void 0 === t2 || t2.register(e2);
    }
    unregister(e2) {
      var t2;
      null === (t2 = this.persistence) || void 0 === t2 || t2.unregister(e2);
    }
    unregister_for_session(e2) {
      var t2;
      null === (t2 = this.sessionPersistence) || void 0 === t2 || t2.unregister(e2);
    }
    _register_single(e2, t2) {
      this.register({ [e2]: t2 });
    }
    getFeatureFlag(e2, t2) {
      return this.featureFlags.getFeatureFlag(e2, t2);
    }
    getFeatureFlagPayload(e2) {
      var t2 = this.featureFlags.getFeatureFlagPayload(e2);
      try {
        return JSON.parse(t2);
      } catch (e3) {
        return t2;
      }
    }
    isFeatureEnabled(e2, t2) {
      return this.featureFlags.isFeatureEnabled(e2, t2);
    }
    reloadFeatureFlags() {
      this.featureFlags.reloadFeatureFlags();
    }
    updateEarlyAccessFeatureEnrollment(e2, t2) {
      this.featureFlags.updateEarlyAccessFeatureEnrollment(e2, t2);
    }
    getEarlyAccessFeatures(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
      return this.featureFlags.getEarlyAccessFeatures(e2, t2);
    }
    on(e2, t2) {
      return this._internalEventEmitter.on(e2, t2);
    }
    onFeatureFlags(e2) {
      return this.featureFlags.onFeatureFlags(e2);
    }
    onSessionId(e2) {
      var t2, i2;
      return null !== (t2 = null === (i2 = this.sessionManager) || void 0 === i2 ? void 0 : i2.onSessionId(e2)) && void 0 !== t2 ? t2 : () => {
      };
    }
    getSurveys(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
      this.surveys.getSurveys(e2, t2);
    }
    getActiveMatchingSurveys(e2) {
      var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
      this.surveys.getActiveMatchingSurveys(e2, t2);
    }
    renderSurvey(e2, t2) {
      this.surveys.renderSurvey(e2, t2);
    }
    canRenderSurvey(e2) {
      this.surveys.canRenderSurvey(e2);
    }
    getNextSurveyStep(e2, t2, i2) {
      return this.surveys.getNextSurveyStep(e2, t2, i2);
    }
    identify(e2, t2, i2) {
      if (!this.__loaded || !this.persistence)
        return q.uninitializedWarning("posthog.identify");
      if (L(e2) && (e2 = e2.toString(), q.warn("The first argument to posthog.identify was a number, but it should be a string. It has been converted to a string.")), e2) {
        if (["distinct_id", "distinctid"].includes(e2.toLowerCase()))
          q.critical('The string "'.concat(e2, '" was set in posthog.identify which indicates an error. This ID should be unique to the user and not a hardcoded string.'));
        else if (this._requirePersonProcessing("posthog.identify")) {
          var n2 = this.get_distinct_id();
          if (this.register({ $user_id: e2 }), !this.get_property("$device_id")) {
            var r2 = n2;
            this.register_once({ $had_persisted_distinct_id: true, $device_id: r2 }, "");
          }
          e2 !== n2 && e2 !== this.get_property(se) && (this.unregister(se), this.register({ distinct_id: e2 }));
          var s2 = "anonymous" === (this.persistence.get_property(Te) || "anonymous");
          e2 !== n2 && s2 ? (this.persistence.set_property(Te, "identified"), this.setPersonPropertiesForFlags(t2 || {}, false), this.capture("$identify", { distinct_id: e2, $anon_distinct_id: n2 }, { $set: t2 || {}, $set_once: i2 || {} }), this.featureFlags.setAnonymousDistinctId(n2)) : (t2 || i2) && this.setPersonProperties(t2, i2), e2 !== n2 && (this.reloadFeatureFlags(), this.unregister(Fe));
        }
      } else
        q.error("Unique user id has not been set in posthog.identify");
    }
    setPersonProperties(e2, t2) {
      (e2 || t2) && this._requirePersonProcessing("posthog.setPersonProperties") && (this.setPersonPropertiesForFlags(e2 || {}), this.capture("$set", { $set: e2 || {}, $set_once: t2 || {} }));
    }
    group(e2, t2, i2) {
      if (e2 && t2) {
        if (this._requirePersonProcessing("posthog.group")) {
          var n2 = this.getGroups();
          n2[e2] !== t2 && this.resetGroupPropertiesForFlags(e2), this.register({ $groups: j(j({}, n2), {}, { [e2]: t2 }) }), i2 && (this.capture("$groupidentify", { $group_type: e2, $group_key: t2, $group_set: i2 }), this.setGroupPropertiesForFlags({ [e2]: i2 })), n2[e2] === t2 || i2 || this.reloadFeatureFlags();
        }
      } else
        q.error("posthog.group requires a group type and group key");
    }
    resetGroups() {
      this.register({ $groups: {} }), this.resetGroupPropertiesForFlags(), this.reloadFeatureFlags();
    }
    setPersonPropertiesForFlags(e2) {
      var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
      this.featureFlags.setPersonPropertiesForFlags(e2, t2);
    }
    resetPersonPropertiesForFlags() {
      this.featureFlags.resetPersonPropertiesForFlags();
    }
    setGroupPropertiesForFlags(e2) {
      var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
      this._requirePersonProcessing("posthog.setGroupPropertiesForFlags") && this.featureFlags.setGroupPropertiesForFlags(e2, t2);
    }
    resetGroupPropertiesForFlags(e2) {
      this.featureFlags.resetGroupPropertiesForFlags(e2);
    }
    reset(e2) {
      var t2, i2, n2, r2, s2;
      if (q.info("reset"), !this.__loaded)
        return q.uninitializedWarning("posthog.reset");
      var o2 = this.get_property("$device_id");
      if (this.consent.reset(), null === (t2 = this.persistence) || void 0 === t2 || t2.clear(), null === (i2 = this.sessionPersistence) || void 0 === i2 || i2.clear(), null === (n2 = this.surveys) || void 0 === n2 || n2.reset(), null === (r2 = this.persistence) || void 0 === r2 || r2.set_property(Te, "anonymous"), null === (s2 = this.sessionManager) || void 0 === s2 || s2.resetSessionId(), this.config.__preview_experimental_cookieless_mode)
        this.register_once({ distinct_id: qe, $device_id: null }, "");
      else {
        var a2 = this.config.get_device_id(Ze());
        this.register_once({ distinct_id: a2, $device_id: e2 ? a2 : o2 }, "");
      }
    }
    get_distinct_id() {
      return this.get_property("distinct_id");
    }
    getGroups() {
      return this.get_property("$groups") || {};
    }
    get_session_id() {
      var e2, t2;
      return null !== (e2 = null === (t2 = this.sessionManager) || void 0 === t2 ? void 0 : t2.checkAndGetSessionAndWindowId(true).sessionId) && void 0 !== e2 ? e2 : "";
    }
    get_session_replay_url(e2) {
      if (!this.sessionManager)
        return "";
      var { sessionId: t2, sessionStartTimestamp: i2 } = this.sessionManager.checkAndGetSessionAndWindowId(true), n2 = this.requestRouter.endpointFor("ui", "/project/".concat(this.config.token, "/replay/").concat(t2));
      if (null != e2 && e2.withTimestamp && i2) {
        var r2, s2 = null !== (r2 = e2.timestampLookBack) && void 0 !== r2 ? r2 : 10;
        if (!i2)
          return n2;
        var o2 = Math.max(Math.floor((new Date().getTime() - i2) / 1e3) - s2, 0);
        n2 += "?t=".concat(o2);
      }
      return n2;
    }
    alias(e2, t2) {
      return e2 === this.get_property(re) ? (q.critical("Attempting to create alias for existing People user - aborting."), -2) : this._requirePersonProcessing("posthog.alias") ? (R(t2) && (t2 = this.get_distinct_id()), e2 !== t2 ? (this._register_single(se, e2), this.capture("$create_alias", { alias: e2, distinct_id: t2 })) : (q.warn("alias matches current distinct_id - skipping api call."), this.identify(e2), -1)) : void 0;
    }
    set_config(e2) {
      var t2, i2, n2, r2, s2 = j({}, this.config);
      C(e2) && (K(this.config, lo(e2)), null === (t2 = this.persistence) || void 0 === t2 || t2.update_config(this.config, s2), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new bi(j(j({}, this.config), {}, { persistence: "sessionStorage" })), at.is_supported() && "true" === at.get("ph_debug") && (this.config.debug = true), this.config.debug && (p.DEBUG = true, q.info("set_config", { config: e2, oldConfig: s2, newConfig: j({}, this.config) })), null === (i2 = this.sessionRecording) || void 0 === i2 || i2.startIfEnabledOrStop(), null === (n2 = this.autocapture) || void 0 === n2 || n2.startIfEnabled(), null === (r2 = this.heatmaps) || void 0 === r2 || r2.startIfEnabled(), this.surveys.loadIfEnabled(), this._sync_opt_out_with_persistence());
    }
    startSessionRecording(e2) {
      var t2 = true === e2, i2 = { sampling: t2 || !(null == e2 || !e2.sampling), linked_flag: t2 || !(null == e2 || !e2.linked_flag), url_trigger: t2 || !(null == e2 || !e2.url_trigger), event_trigger: t2 || !(null == e2 || !e2.event_trigger) };
      if (Object.values(i2).some(Boolean)) {
        var n2, r2, s2, o2, a2;
        if (null === (n2 = this.sessionManager) || void 0 === n2 || n2.checkAndGetSessionAndWindowId(), i2.sampling)
          null === (r2 = this.sessionRecording) || void 0 === r2 || r2.overrideSampling();
        if (i2.linked_flag)
          null === (s2 = this.sessionRecording) || void 0 === s2 || s2.overrideLinkedFlag();
        if (i2.url_trigger)
          null === (o2 = this.sessionRecording) || void 0 === o2 || o2.overrideTrigger("url");
        if (i2.event_trigger)
          null === (a2 = this.sessionRecording) || void 0 === a2 || a2.overrideTrigger("event");
      }
      this.set_config({ disable_session_recording: false });
    }
    stopSessionRecording() {
      this.set_config({ disable_session_recording: true });
    }
    sessionRecordingStarted() {
      var e2;
      return !(null === (e2 = this.sessionRecording) || void 0 === e2 || !e2.started);
    }
    captureException(e2, t2) {
      var i2, n2 = new Error("PostHog syntheticException"), r2 = I(null === (i2 = _.__PosthogExtensions__) || void 0 === i2 ? void 0 : i2.parseErrorAsProperties) ? _.__PosthogExtensions__.parseErrorAsProperties([e2.message, void 0, void 0, void 0, e2], { syntheticException: n2 }) : j({ $exception_level: "error", $exception_list: [{ type: e2.name, value: e2.message, mechanism: { handled: true, synthetic: false } }] }, t2);
      this.exceptions.sendExceptionEvent(r2);
    }
    loadToolbar(e2) {
      return this.toolbar.loadToolbar(e2);
    }
    get_property(e2) {
      var t2;
      return null === (t2 = this.persistence) || void 0 === t2 ? void 0 : t2.props[e2];
    }
    getSessionProperty(e2) {
      var t2;
      return null === (t2 = this.sessionPersistence) || void 0 === t2 ? void 0 : t2.props[e2];
    }
    toString() {
      var e2, t2 = null !== (e2 = this.config.name) && void 0 !== e2 ? e2 : so;
      return t2 !== so && (t2 = so + "." + t2), t2;
    }
    _isIdentified() {
      var e2, t2;
      return "identified" === (null === (e2 = this.persistence) || void 0 === e2 ? void 0 : e2.get_property(Te)) || "identified" === (null === (t2 = this.sessionPersistence) || void 0 === t2 ? void 0 : t2.get_property(Te));
    }
    _hasPersonProcessing() {
      var e2, t2, i2, n2;
      return !("never" === this.config.person_profiles || "identified_only" === this.config.person_profiles && !this._isIdentified() && P(this.getGroups()) && (null === (e2 = this.persistence) || void 0 === e2 || null === (t2 = e2.props) || void 0 === t2 || !t2[se]) && (null === (i2 = this.persistence) || void 0 === i2 || null === (n2 = i2.props) || void 0 === n2 || !n2[De]));
    }
    _shouldCapturePageleave() {
      return true === this.config.capture_pageleave || "if_capture_pageview" === this.config.capture_pageleave && this.config.capture_pageview;
    }
    createPersonProfile() {
      this._hasPersonProcessing() || this._requirePersonProcessing("posthog.createPersonProfile") && this.setPersonProperties({}, {});
    }
    _requirePersonProcessing(e2) {
      return "never" === this.config.person_profiles ? (q.error(e2 + ' was called, but process_person is set to "never". This call will be ignored.'), false) : (this._register_single(De, true), true);
    }
    _sync_opt_out_with_persistence() {
      var e2, t2, i2, n2, r2 = this.consent.isOptedOut(), s2 = this.config.opt_out_persistence_by_default, o2 = this.config.disable_persistence || r2 && !!s2;
      (null === (e2 = this.persistence) || void 0 === e2 ? void 0 : e2.disabled) !== o2 && (null === (i2 = this.persistence) || void 0 === i2 || i2.set_disabled(o2));
      (null === (t2 = this.sessionPersistence) || void 0 === t2 ? void 0 : t2.disabled) !== o2 && (null === (n2 = this.sessionPersistence) || void 0 === n2 || n2.set_disabled(o2));
    }
    opt_in_capturing(e2) {
      var t2;
      (this.consent.optInOut(true), this._sync_opt_out_with_persistence(), R(null == e2 ? void 0 : e2.captureEventName) || null != e2 && e2.captureEventName) && this.capture(null !== (t2 = null == e2 ? void 0 : e2.captureEventName) && void 0 !== t2 ? t2 : "$opt_in", null == e2 ? void 0 : e2.captureProperties, { send_instantly: true });
      this.config.capture_pageview && this._captureInitialPageview();
    }
    opt_out_capturing() {
      this.consent.optInOut(false), this._sync_opt_out_with_persistence();
    }
    has_opted_in_capturing() {
      return this.consent.isOptedIn();
    }
    has_opted_out_capturing() {
      return this.consent.isOptedOut();
    }
    clear_opt_in_out_capturing() {
      this.consent.reset(), this._sync_opt_out_with_persistence();
    }
    _is_bot() {
      return o ? Is(o, this.config.custom_blocked_useragents) : void 0;
    }
    _captureInitialPageview() {
      a && !this._initialPageviewCaptured && (this._initialPageviewCaptured = true, this.capture("$pageview", { title: a.title }, { send_instantly: true }));
    }
    debug(e2) {
      false === e2 ? (null == t || t.console.log("You've disabled debug mode."), localStorage && localStorage.removeItem("ph_debug"), this.set_config({ debug: false })) : (null == t || t.console.log("You're now in debug mode. All calls to PostHog will be logged in your console.\nYou can disable this with `posthog.debug(false)`."), localStorage && localStorage.setItem("ph_debug", "true"), this.set_config({ debug: true }));
    }
    _runBeforeSend(e2) {
      if (O(this.config.before_send))
        return e2;
      var t2 = x(this.config.before_send) ? this.config.before_send : [this.config.before_send], i2 = e2;
      for (var n2 of t2) {
        if (i2 = n2(i2), O(i2)) {
          var r2 = "Event '".concat(e2.event, "' was rejected in beforeSend function");
          return D(e2.event) ? q.warn("".concat(r2, ". This can cause unexpected behavior.")) : q.info(r2), null;
        }
        i2.properties && !P(i2.properties) || q.warn("Event '".concat(e2.event, "' has no properties after beforeSend function, this is likely an error."));
      }
      return i2;
    }
  };
  !function(e2, t2) {
    for (var i2 = 0; i2 < t2.length; i2++)
      e2.prototype[t2[i2]] = Z(e2.prototype[t2[i2]]);
  }(co, ["identify"]);
  var ho;
  var _o = (ho = no[so] = new co(), function() {
    function e2() {
      e2.done || (e2.done = true, oo = false, Y(no, function(e3) {
        e3._dom_loaded();
      }));
    }
    null != a && a.addEventListener && ("complete" === a.readyState ? e2() : a.addEventListener("DOMContentLoaded", e2, false)), t && ie(t, "load", e2, true);
  }(), ho);

  // src/utils/PostHog.ts
  function Load() {
    _o.init(
      "phc_eHG65ArGON6CfDtepgtXeE2bXNU1CPmiUYlNpxSUYBd",
      {
        api_host: "https://eu.i.posthog.com",
        person_profiles: "always"
      }
    );
  }
  function OnNavigate(location2) {
  }
  var PostHog = {
    Load,
    OnNavigate
  };
  var PostHog_default = PostHog;

  // src/utils/sleep.ts
  async function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
  }
  var sleep_default = sleep;

  // src/app.tsx
  async function main() {
    await Platform_default.OnSpotifyReady;
    if (!storage_default.get("show_topbar_notifications")) {
      storage_default.set("show_topbar_notifications", "true");
    }
    if (!storage_default.get("lyrics_spacing")) {
      storage_default.set("lyrics_spacing", "Medium");
    }
    if (storage_default.get("lyrics_spacing")) {
      if (storage_default.get("lyrics_spacing") === "None") {
        document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "0");
      }
      if (storage_default.get("lyrics_spacing") === "Small") {
        document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "0.5cqw 0");
      }
      if (storage_default.get("lyrics_spacing") === "Medium") {
        document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "1cqw 0");
      }
      if (storage_default.get("lyrics_spacing") === "Large") {
        document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "1.5cqw 0");
      }
      if (storage_default.get("lyrics_spacing") === "Extra Large") {
        document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "2cqw 0");
      }
    }
    PostHog_default.Load();
    setSettingsMenu();
    const OldStyleFont = storage_default.get("old-style-font");
    if (OldStyleFont != "true") {
      LoadFonts();
    }
    {
      const scripts = [];
      const GetFullUrl = (target) => `https://cdn.jsdelivr.net/gh/hudzax/amai-lyrics/dist/${target}`;
      const AddScript = (scriptFileName) => {
        const script = document.createElement("script");
        script.async = false;
        script.src = GetFullUrl(scriptFileName);
        console.log("Adding Script:", script.src);
        script.onerror = () => {
          sleep_default(2).then(() => {
            window._spicy_lyrics?.func_main?._deappend_scripts();
            window._spicy_lyrics?.func_main?._add_script(scriptFileName);
            window._spicy_lyrics?.func_main?._append_scripts();
          });
        };
        scripts.push(script);
      };
      Global_default.SetScope("func_main._add_script", AddScript);
      AddScript("spicy-hasher.js");
      AddScript("pako.min.js");
      AddScript("vibrant.min.js");
      const AppendScripts = () => {
        for (const script of scripts) {
          document.head.appendChild(script);
        }
      };
      const DeappendScripts = () => {
        for (const script of scripts) {
          document.head.removeChild(script);
        }
      };
      Global_default.SetScope("func_main._append_scripts", AppendScripts);
      Global_default.SetScope("func_main._deappend_scripts", DeappendScripts);
      AppendScripts();
    }
    const skeletonStyle = document.createElement("style");
    skeletonStyle.innerHTML = `
        <!-- This style is here to prevent the @keyframes removal in the CSS. I still don't know why that's happening. -->
        <!-- This is a part of Spicy Lyrics -->
        <style>
            @keyframes skeleton {
                to {
                    background-position-x: 0
                }
            }
        </style>
  `;
    document.head.appendChild(skeletonStyle);
    let buttonRegistered = false;
    const button = new Spicetify.Playbar.Button(
      "Amai Lyrics",
      Icons.LyricsPage,
      (self2) => {
        if (!self2.active) {
          Session_default.Navigate({ pathname: "/SpicyLyrics" });
        } else {
          Session_default.GoBack();
        }
      },
      false,
      false
    );
    Global_default.Event.listen("pagecontainer:available", () => {
      if (!buttonRegistered) {
        button.register();
        buttonRegistered = true;
      }
    });
    const Hometinue = async () => {
      Defaults_default.SpicyLyricsVersion = window._spicy_lyrics_metadata?.LoadedVersion ?? "2.4.0";
      Whentil_default.When(() => Spicetify.Platform.PlaybackAPI, () => {
        requestPositionSync();
      });
      let lastImgUrl;
      const lowQMode = storage_default.get("lowQMode");
      const lowQModeEnabled = lowQMode && lowQMode === "true";
      function applyDynamicBackgroundToNowPlayingBar(coverUrl) {
        if (lowQModeEnabled)
          return;
        const nowPlayingBar = document.querySelector(".Root__right-sidebar aside.NowPlayingView");
        try {
          if (nowPlayingBar == null) {
            lastImgUrl = null;
            return;
          }
          ;
          if (coverUrl === lastImgUrl)
            return;
          const dynamicBackground = document.createElement("div");
          dynamicBackground.classList.add("spicy-dynamic-bg");
          if (lowQModeEnabled) {
          } else {
            dynamicBackground.innerHTML = `
            <img class="Front" src="${coverUrl}" />
            <img class="Back" src="${coverUrl}" />
            <img class="BackCenter" src="${coverUrl}" />
          `;
          }
          nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");
          if (nowPlayingBar?.querySelector(".spicy-dynamic-bg")) {
            nowPlayingBar.querySelector(".spicy-dynamic-bg").remove();
          }
          nowPlayingBar.appendChild(dynamicBackground);
          lastImgUrl = coverUrl;
        } catch (error) {
          console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error);
        }
      }
      new IntervalManager(1, () => {
        applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
      }).Start();
      Spicetify.Player.addEventListener("songchange", onSongChange);
      Spicetify.Player.addEventListener("songchange", async (event) => {
        fetchLyrics(event?.data?.item?.uri).then(ApplyLyrics);
        {
          const lowQMode2 = storage_default.get("lowQMode");
          const lowQModeEnabled2 = lowQMode2 && lowQMode2 === "true";
          if (lowQModeEnabled2) {
            const CurrentSongArtist = event.data?.item.artists[0].uri;
            const CurrentSongUri = event.data?.item.uri;
            try {
              await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
            } catch (error) {
              console.error("Error happened while trying to prefetch the Low Quality Mode Dynamic Background", error);
            }
          }
        }
      });
      let songChangeLoopRan = 0;
      const songChangeLoopMax = 5;
      async function onSongChange(event) {
        let currentUri = event?.data?.item?.uri;
        if (!currentUri) {
          currentUri = Spicetify.Player.data?.item?.uri;
          if (!currentUri) {
            if (songChangeLoopRan >= songChangeLoopMax) {
              return;
            }
            onSongChange(event);
            songChangeLoopRan++;
            return;
          }
        }
        ;
        const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";
        if (IsSomethingElseThanTrack) {
          button.deregister();
          buttonRegistered = false;
        } else {
          if (!buttonRegistered) {
            button.register();
            buttonRegistered = true;
          }
        }
        if (!IsSomethingElseThanTrack) {
          await SpotifyPlayer.Track.GetTrackInfo();
          if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar"))
            UpdateNowBar();
        }
        applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
        songChangeLoopRan = 0;
        if (!document.querySelector("#SpicyLyricsPage .LyricsContainer"))
          return;
        ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .ContentBox"));
      }
      {
        fetchLyrics(Spicetify.Player.data.item.uri).then(ApplyLyrics);
        {
          const lowQMode2 = storage_default.get("lowQMode");
          const lowQModeEnabled2 = lowQMode2 && lowQMode2 === "true";
          if (lowQModeEnabled2) {
            const CurrentSongArtist = Spicetify.Player.data?.item.artists[0].uri;
            const CurrentSongUri = Spicetify.Player.data?.item.uri;
            try {
              await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
            } catch (error) {
              console.error("Error happened while trying to prefetch the Low Quality Mode Dynamic Background", error);
            }
          }
        }
      }
      window.addEventListener("online", async () => {
        storage_default.set("lastFetchedUri", null);
        fetchLyrics(Spicetify.Player.data?.item.uri).then(ApplyLyrics);
      });
      new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine(ScrollSimplebar)).Start();
      let lastLocation = null;
      function loadPage(location2) {
        if (location2.pathname === "/SpicyLyrics") {
          PageView_default.Open();
          button.active = true;
        } else {
          if (lastLocation?.pathname === "/SpicyLyrics") {
            PageView_default.Destroy();
            button.active = false;
          }
        }
        lastLocation = location2;
      }
      Spicetify.Platform.History.listen(loadPage);
      if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
        Global_default.Event.listen("pagecontainer:available", () => {
          loadPage(Spicetify.Platform.History.location);
          button.active = true;
        });
      }
      button.tippy.setContent("Amai Lyrics");
      Spicetify.Player.addEventListener("onplaypause", (e2) => {
        SpotifyPlayer.IsPlaying = !e2?.data?.isPaused;
        Global_default.Event.evoke("playback:playpause", e2);
      });
      {
        let lastLoopType = null;
        const LoopInt = new IntervalManager(Infinity, () => {
          const LoopState = Spicetify.Player.getRepeat();
          const LoopType = LoopState === 1 ? "context" : LoopState === 2 ? "track" : "none";
          SpotifyPlayer.LoopType = LoopType;
          if (lastLoopType !== LoopType) {
            Global_default.Event.evoke("playback:loop", LoopType);
          }
          lastLoopType = LoopType;
        }).Start();
      }
      {
        let lastShuffleType = null;
        const ShuffleInt = new IntervalManager(Infinity, () => {
          const ShuffleType = Spicetify.Player.origin._state.smartShuffle ? "smart" : Spicetify.Player.origin._state.shuffle ? "normal" : "none";
          SpotifyPlayer.ShuffleType = ShuffleType;
          if (lastShuffleType !== ShuffleType) {
            Global_default.Event.evoke("playback:shuffle", ShuffleType);
          }
          lastShuffleType = ShuffleType;
        }).Start();
      }
      {
        let lastPosition = 0;
        const PositionInt = new IntervalManager(0.5, () => {
          const pos = SpotifyPlayer.GetTrackPosition();
          if (pos !== lastPosition) {
            Global_default.Event.evoke("playback:position", pos);
          }
          lastPosition = pos;
        }).Start();
      }
      SpotifyPlayer.IsPlaying = IsPlaying();
      {
        Spicetify.Player.addEventListener("onplaypause", (e2) => Global_default.Event.evoke("playback:playpause", e2));
        Spicetify.Player.addEventListener("onprogress", (e2) => Global_default.Event.evoke("playback:progress", e2));
        Spicetify.Player.addEventListener("songchange", (e2) => Global_default.Event.evoke("playback:songchange", e2));
        Whentil_default.When(() => document.querySelector(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"), () => {
          Global_default.Event.evoke("pagecontainer:available", document.querySelector(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"));
        });
        Spicetify.Platform.History.listen(Session_default.RecordNavigation);
        Session_default.RecordNavigation(Spicetify.Platform.History.location);
        Global_default.Event.listen("session:navigation", (data) => {
          if (data.pathname === "/SpicyLyrics/Update") {
            storage_default.set("previous-version", Defaults_default.SpicyLyricsVersion);
            window._spicy_lyrics_metadata = {};
            Session_default.GoBack();
            window.location.reload();
          }
        });
        async function CheckForUpdates_Intervaled() {
          await CheckForUpdates();
          setTimeout(CheckForUpdates_Intervaled, 6e4);
        }
      }
    };
    Whentil_default.When(() => Spicetify.Player.data.item.type, () => {
      const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";
      if (IsSomethingElseThanTrack) {
        button.deregister();
        buttonRegistered = false;
      } else {
        if (!buttonRegistered) {
          button.register();
          buttonRegistered = true;
        }
      }
    });
    Whentil_default.When(() => SpicyHasher && pako && Vibrant, Hometinue);
  }
  var app_default = main;

  // C:/Users/Hathaway/AppData/Local/Temp/spicetify-creator/index.jsx
  (async () => {
    await app_default();
  })();
})();
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
(async () => {
    if (!document.getElementById(`amaiDlyrics`)) {
      var el = document.createElement('style');
      el.id = `amaiDlyrics`;
      el.textContent = (String.raw`
  /* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3b187/DotLoader.css */
#DotLoader {
  width: 15px;
  aspect-ratio: 1;
  border-radius: 50%;
  animation: l5 1s infinite linear alternate;
}
@keyframes l5 {
  0% {
    box-shadow: 20px 0 #FFF, -20px 0 #ffffff22;
    background: #FFF;
  }
  33% {
    box-shadow: 20px 0 #FFF, -20px 0 #ffffff22;
    background: #ffffff22;
  }
  66% {
    box-shadow: 20px 0 #ffffff22, -20px 0 #FFF;
    background: #ffffff22;
  }
  100% {
    box-shadow: 20px 0 #ffffff22, -20px 0 #FFF;
    background: #FFF;
  }
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3abb0/default.css */
:root {
  --bg-rotation-degree: 258deg;
}
.main-nowPlayingView-contextItemInfo::before {
  display: none;
}
#SpicyLyricsPage {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
  container-type: size;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  font-weight: 700;
  z-index: 99;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
#SpicyLyricsPage.UseSpicyFont {
  font-family: SpicyLyrics;
}
[font=Vazirmatn] {
  font-family: "VazirmatnRegular", sans-serif;
}
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child,
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child-spacer,
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child,
body:has(#SpicyLyricsPage) .main-view-container__scroll-node-child-spacer {
  display: none;
}
#SpicyLyricsPage .ViewControls {
  container-type: size;
  display: flex;
  gap: 8px;
  height: 5cqh;
  justify-content: center;
  opacity: .5;
  transition: opacity .2s, bottom .5s;
  z-index: 101;
  --ViewControlSize: 100cqh;
}
#SpicyLyricsPage:not(.Fullscreen) .ViewControls {
  position: absolute;
  width: 100cqw;
  bottom: -8cqh;
  --PageHoverOffset: -2.2cqh;
  --ControlsHoverOffset: 1.5cqh;
}
#SpicyLyricsPage .ViewControls .ViewControl {
  --ViewControlHeight: var(--ViewControlSize, 100cqh);
  aspect-ratio: 1;
  background: rgba(21, 22, 23, .72);
  border: none;
  border-radius: 100rem;
  display: flex;
  height: var(--ViewControlHeight);
  width: var(--ViewControlHeight);
  -webkit-app-region: no-drag;
  align-items: center;
  color: hsla(0, 0%, 100%, .7);
  justify-content: center;
  text-align: center;
  -webkit-box-align: center;
  -webkit-box-pack: center;
}
#SpicyLyricsPage .ViewControls .ViewControl svg {
  fill: currentColor;
}
#SpicyLyricsPage:not(.Fullscreen) .ViewControls:hover {
  opacity: 1 !important;
  bottom: var(--ControlsHoverOffset) !important;
}
#SpicyLyricsPage:not(.Fullscreen):hover .ViewControls {
  opacity: .5;
  bottom: var(--PageHoverOffset);
}
#SpicyLyricsPage .ViewControls button {
  cursor: pointer;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) {
  --background-tint: color-mix(in srgb,rgb(var(--spice-rgb-selected-row)) 7%,transparent);
  --spice-card: var(--background-tint);
  --background-tinted-base: var(--background-tint) ;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-content {
  background: transparent;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-contextItemInfo:before {
  display: none;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg div[data-overlayscrollbars-viewport],
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg div[data-overlayscrollbars-viewport] > div {
  background: transparent;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg .main-nowPlayingView-coverArtContainer div:has(video):after,
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg .main-nowPlayingView-coverArtContainer div:has(video):before {
  display: none;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .spicy-dynamic-bg .main-trackInfo-artists {
  filter: brightness(1.15);
  opacity: .75;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-coverArt {
  box-shadow: 0 9px 20px 0 rgba(0, 0, 0, .271);
  opacity: .95;
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-section {
  background-color: var(--background-tinted-base);
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) button[type=button] {
  background-color: var(--background-tinted-base);
  color: hsla(0, 0%, 100%, .8);
}
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) button[type=button] .Button-sm-buttonSecondary-isUsingKeyboard-useBrowserDefaultFocusStyle,
.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) button[type=button] .Button-sm-buttonSecondary-useBrowserDefaultFocusStyle {
  border: 1px solid hsla(0, 0%, 100%, .5);
}
#SpicyLyricsPageSvg {
  fill: currentColor;
  transform: translateY(2px);
}
button:has(#SpicyLyricsPageSvg):after {
  transform: translateX(-370%) translateY(-40%) !important;
}
.Root__main-view:has(#SpicyLyricsPage),
.Root__main-view:has(#SpicyLyricsPage) .KL8t9WB65UfUEPuTFAhO,
.Root__main-view:has(#SpicyLyricsPage) .main-content-view,
.Root__main-view:has(#SpicyLyricsPage) .main-view-container,
.Root__main-view:has(#SpicyLyricsPage) .main-view-container__scroll-node,
.Root__main-view:has(#SpicyLyricsPage) .main-view-container .div[data-overlayscrollbars-viewport] {
  height: 100% !important;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3ae81/Simplebar.css */
#SpicyLyricsPage [data-simplebar] {
  position: relative;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
}
#SpicyLyricsPage .simplebar-wrapper {
  overflow: hidden;
  width: inherit;
  height: inherit;
  max-width: inherit;
  max-height: inherit;
}
#SpicyLyricsPage .simplebar-mask {
  direction: inherit;
  position: absolute;
  overflow: hidden;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  width: auto !important;
  height: auto !important;
  z-index: 0;
}
#SpicyLyricsPage .simplebar-offset {
  direction: inherit !important;
  box-sizing: inherit !important;
  resize: none !important;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 0;
  margin: 0;
  -webkit-overflow-scrolling: touch;
}
#SpicyLyricsPage .simplebar-content-wrapper {
  direction: inherit;
  box-sizing: border-box !important;
  position: relative;
  display: block;
  height: 100%;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
#SpicyLyricsPage .simplebar-content-wrapper::-webkit-scrollbar,
#SpicyLyricsPage .simplebar-hide-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
#SpicyLyricsPage .simplebar-content:before,
#SpicyLyricsPage .simplebar-content:after {
  content: " ";
  display: table;
}
#SpicyLyricsPage .simplebar-placeholder {
  max-height: 100%;
  max-width: 100%;
  width: 100%;
  pointer-events: none;
}
#SpicyLyricsPage .simplebar-height-auto-observer-wrapper {
  box-sizing: inherit !important;
  height: 100%;
  width: 100%;
  max-width: 1px;
  position: relative;
  float: left;
  max-height: 1px;
  overflow: hidden;
  z-index: -1;
  padding: 0;
  margin: 0;
  pointer-events: none;
  flex-grow: inherit;
  flex-shrink: 0;
  flex-basis: 0;
}
#SpicyLyricsPage .simplebar-height-auto-observer {
  box-sizing: inherit;
  display: block;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  height: 1000%;
  width: 1000%;
  min-height: 1px;
  min-width: 1px;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}
#SpicyLyricsPage .simplebar-track {
  z-index: 1;
  position: absolute;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}
#SpicyLyricsPage [data-simplebar].simplebar-dragging {
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
#SpicyLyricsPage [data-simplebar].simplebar-dragging .simplebar-content {
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
#SpicyLyricsPage [data-simplebar].simplebar-dragging .simplebar-track {
  pointer-events: all;
}
#SpicyLyricsPage .simplebar-scrollbar {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 10px;
}
.simplebar-scrollbar:before {
  position: absolute;
  content: "";
  background: var(--Simplebar-Scrollbar-Color) !important;
  border-radius: 7px;
  left: 2px;
  right: 2px;
  opacity: 0;
  transition: opacity 0.2s 0.5s linear;
}
#SpicyLyricsPage .simplebar-scrollbar.simplebar-visible:before {
  opacity: 0.5 !important;
  transition-delay: 0s !important;
  transition-duration: 0s !important;
}
#SpicyLyricsPage .simplebar-track.simplebar-vertical {
  top: 0;
  width: 11px;
}
#SpicyLyricsPage .simplebar-scrollbar:before {
  top: 2px;
  bottom: 2px;
  left: 2px;
  right: 2px;
}
#SpicyLyricsPage .simplebar-track.simplebar-horizontal {
  left: 0;
  height: 11px;
}
#SpicyLyricsPage .simplebar-track.simplebar-horizontal .simplebar-scrollbar {
  right: auto;
  left: 0;
  top: 0;
  bottom: 0;
  min-height: 0;
  min-width: 10px;
  width: auto;
}
#SpicyLyricsPage [data-simplebar-direction=rtl] .simplebar-track.simplebar-vertical {
  right: auto;
  left: 0;
}
#SpicyLyricsPage .simplebar-dummy-scrollbar-size {
  direction: rtl;
  position: fixed;
  opacity: 0;
  visibility: hidden;
  height: 500px;
  width: 500px;
  overflow-y: hidden;
  overflow-x: scroll;
  -ms-overflow-style: scrollbar !important;
}
#SpicyLyricsPage .simplebar-dummy-scrollbar-size > div {
  width: 200%;
  height: 200%;
  margin: 10px 0;
}
#SpicyLyricsPage .ScrollbarScrollable .simplebar-track {
  transition: opacity 0.2s linear;
  opacity: 1;
}
#SpicyLyricsPage .ScrollbarScrollable .simplebar-track.simplebar-vertical {
  right: 5px;
}
#SpicyLyricsPage .ScrollbarScrollable .simplebar-track.simplebar-horizontal {
  bottom: 5px;
}
#SpicyLyricsPage .ScrollbarScrollable.hide-scrollbar .simplebar-track {
  opacity: 0;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3aef2/ContentBox.css */
.Skeletoned {
  --BorderRadius: .5cqw;
  --ValueStop1: 40%;
  --ValueStop2: 50%;
  --ValueStop3: 60%;
  --ColorStop1: hsla(0, 0%, 93%, .25);
  --ColorStop2: hsla(0, 0%, 98%, .45);
  --ColorStop3: hsla(0, 0%, 93%, .25);
  animation: skeleton 1s linear infinite;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  background: linear-gradient(-45deg, var(--ColorStop1) var(--ValueStop1), var(--ColorStop2) var(--ValueStop2), var(--ColorStop3) var(--ValueStop3));
  background-position-x: 100%;
  background-size: 500%;
  border-radius: var(--BorderRadius);
}
.Skeletoned * {
  display: none;
}
@keyframes skeleton {
  to {
    background-position-x: 0;
  }
}
#SpicyLyricsPage .ContentBox {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  --default-font-size: clamp(0.5rem, calc(1cqw* 3), 2.1rem);
}
#SpicyLyricsPage .ContentBox .NowBar {
  --title-height: 5cqh;
  display: flex;
  position: absolute;
  inset: 0;
  align-items: center;
  justify-content: center;
  height: 100cqh;
  z-index: -1;
  margin: 0 3cqw 0 11cqw;
  transition: opacity 0.2s ease-in-out;
  opacity: 0;
}
#SpicyLyricsPage .ContentBox .NowBar.RightSide {
  margin: 0 11cqw 0 3cqw;
}
#SpicyLyricsPage .ContentBox .NowBar.Active {
  position: relative;
  opacity: 1;
  z-index: 1;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 27cqw;
  height: 27cqw;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox {
  width: 30cqw;
  height: 30cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage {
  --ArtworkBrightness: 1;
  --ArtworkBlur: 0px;
  border-radius: 1cqh;
  width: 100%;
  height: 100%;
  box-shadow: 0 9px 20px 0 rgba(0, 0, 0, .271);
  opacity: .95;
  filter: brightness(var(--ArtworkBrightness)) blur(var(--ArtworkBlur));
  transition: opacity, scale .1s cubic-bezier(.24, .01, .97, 1.41);
  cursor: grab;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent {
  cursor: grab;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent .AlbumData {
  font-size: calc(var(--default-font-size) * 0.95);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 99;
  opacity: 1;
  color: white;
  margin-top: 15.5cqh;
  overflow: hidden;
  width: 22cqw;
  box-sizing: border-box;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent .AlbumData span {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  text-align: center;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 2cqh;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName {
  font-weight: 900;
  font-size: var(--default-font-size);
  color: white;
  text-align: center;
  opacity: .95;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 24cqw;
  display: inline-block;
  text-align: center;
  line-height: var(--title-height);
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists {
  font-size: calc(var(--default-font-size)* 0.65);
  line-height: calc(var(--title-height) * 0.5);
  font-weight: 400;
  color: white;
  opacity: .7;
  animation: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 23cqw;
  display: inline-block;
  text-align: center;
}
#SpicyLyricsPage .ContentBox .NowBar:is(.Active.LeftSide) + .LyricsContainer .loaderContainer {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 20%);
}
#SpicyLyricsPage .ContentBox .NowBar:is(.Active.RightSide) + .LyricsContainer .loaderContainer {
  background: linear-gradient(270deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 20%);
}
#SpicyLyricsPage .ContentBox.LyricsHidden .NowBar {
  margin: 0 !important;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox.Skeletoned {
  width: 27cqw;
  height: 27cqw;
  --BorderRadius: 1cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox.Skeletoned {
  width: 30cqw;
  height: 30cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox.Skeletoned .MediaImage {
  display: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName.Skeletoned {
  width: 14cqw;
  height: 4.5cqh;
  --BorderRadius: .25cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox.Skeletoned * {
  display: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .SongName.Skeletoned span {
  display: none;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists.Skeletoned {
  width: 12cqw;
  height: 3.5cqh;
  margin: 1.5cqh 0;
  --BorderRadius: .25cqw;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .Metadata .Artists.Skeletoned span {
  display: none;
}
#SpicyLyricsPage .ContentBox .DropZone.RightSide {
  order: 4;
}
#SpicyLyricsPage .ContentBox .DropZone.LeftSide {
  order: 0;
}
#SpicyLyricsPage .ContentBox .NowBar.LeftSide {
  order: 1;
}
#SpicyLyricsPage .ContentBox .LyricsContainer {
  order: 2;
}
#SpicyLyricsPage .ContentBox .NowBar.RightSide {
  order: 3;
}
#SpicyLyricsPage:has(.ContentBox .NowBar.Active.RightSide) .ScrollbarScrollable .simplebar-track.simplebar-vertical {
  left: 5px;
  right: 0;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox .MediaContent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99;
  display: flex;
  align-items: center;
  flex-direction: column;
  opacity: 0;
  transition: opacity .2s;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .Header .MediaBox:hover .MediaContent {
  opacity: .85;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent {
  display: none;
}
#SpicyLyricsPage .ContentBox .DropZone {
  width: 200cqw;
  height: 100cqh;
  position: absolute;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.25s ease-in-out;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
#SpicyLyricsPage .ContentBox .DropZone span {
  color: black;
  font-size: var(--default-font-size);
  text-align: center;
}
#SpicyLyricsPage .ContentBox .DropZone.Hidden {
  display: none !important;
}
#SpicyLyricsPage.SomethingDragging .ContentBox .LyricsContainer {
  display: none;
}
#SpicyLyricsPage.SomethingDragging .ContentBox .DropZone {
  position: relative;
  z-index: 99999;
  opacity: .2;
}
#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage.Dragging {
  opacity: .6;
}
#SpicyLyricsPage.SomethingDragging .ContentBox .DropZone.DraggingOver {
  opacity: .5;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 5cqh;
  padding: 0 10cqh 0;
  position: absolute;
  bottom: 7.2cqh;
  z-index: 2;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.TrackSkip.PrevTrack {
  rotate: 180deg;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl {
  aspect-ratio: 1;
  display: flex;
  fill: #fff;
  align-items: center;
  cursor: pointer;
  justify-content: center;
  transition: opacity .175s cubic-bezier(.37, 0, .63, 1), filter .175s ease-out;
  --ShrinkScale: 0.9;
  --ShrinkDelta: calc(1 - var(--ShrinkScale));
  height: 4cqh;
  width: 4cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl svg {
  transition: filter .175s ease-out;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.ShuffleToggle,
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.LoopToggle {
  height: 2cqh;
  width: 2cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.PlayStateToggle.Playing {
  height: 3.8cqh;
  width: 3.8cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.PlayStateToggle.Paused {
  height: 4.4cqh;
  width: 4.4cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl:not(.Pressed) {
  animation: pressAnimation .6s;
  animation-fill-mode: forwards;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .ViewControls {
  opacity: 1 !important;
  position: relative;
  width: 100%;
  margin-bottom: 2cqh;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.Pressed {
  transform: scale(var(--ShrinkScale));
  transition: opacity transform .175s cubic-bezier(.37, 0, .63, 1);
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls:hover .PlaybackControl:not(:hover) {
  opacity: .5;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl:hover {
  opacity: 1 !important;
}
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.ShuffleToggle.Enabled,
#SpicyLyricsPage.Fullscreen .ContentBox .NowBar .CenteredView .Header .MediaBox .MediaContent .PlaybackControls .PlaybackControl.LoopToggle.Enabled {
  filter: brightness(2.75);
}
@keyframes pressAnimation {
  0% {
    transform: scale(calc(1 - var(--ShrinkDelta)*1));
  }
  16% {
    transform: scale(calc(1 - var(--ShrinkDelta)*-.32));
  }
  28% {
    transform: scale(calc(1 - var(--ShrinkDelta)*.13));
  }
  44% {
    transform: scale(calc(1 - var(--ShrinkDelta)*-.05));
  }
  59% {
    transform: scale(calc(1 - var(--ShrinkDelta)*.02));
  }
  73% {
    transform: scale(calc(1 - var(--ShrinkDelta)*-.01));
  }
  88% {
    transform: scale(calc(1 - var(--ShrinkDelta)*0));
  }
  to {
    transform: scale(calc(1 - var(--ShrinkDelta)*0));
  }
}
#SpicyLyricsPage .Timeline {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 1.7cqw 2cqw;
  gap: .6cqw;
  position: absolute;
  bottom: 0;
}
#SpicyLyricsPage .Timeline .SliderBar {
  --TraveledColor: hsla(0,0%,100%,.9);
  --RemainingColor: hsla(0,0%,100%,.38);
  --SliderProgress: 0.6;
  background: linear-gradient(90deg, var(--TraveledColor) 0, var(--TraveledColor) calc(100%*var(--SliderProgress)), var(--RemainingColor) calc(100%*var(--SliderProgress)), var(--RemainingColor));
  border-radius: 100cqw;
  container-type: size;
  flex-grow: 1;
  position: relative;
  width: auto;
  height: .65cqh;
  cursor: pointer;
}
#SpicyLyricsPage .Timeline .SliderBar .Handle {
  aspect-ratio: 1;
  background: #fff;
  border-radius: 100cqw;
  display: block;
  height: 185cqh;
  left: calc(100cqw*var(--SliderProgress));
  position: absolute;
  top: 54cqh;
  transform: translate(-50%, -50%);
}
#SpicyLyricsPage .NotificationContainer {
  display: none;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100%;
  height: 7cqh;
  padding: 2cqh 4cqh;
}
#SpicyLyricsPage .NotificationContainer.Danger {
  background: rgba(255, 118, 118, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Information {
  background: rgba(158, 158, 255, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Success {
  background: rgba(148, 255, 148, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Warning {
  background: rgba(255, 208, 19, 0.5);
}
#SpicyLyricsPage .NotificationContainer.Visible {
  display: flex;
}
#SpicyLyricsPage .NotificationContainer .NotificationIcon {
  aspect-ratio: 1;
  width: 4cqh;
  height: 4cqh;
  display: flex;
  align-items: center;
  justify-content: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationIcon svg {
  aspect-ratio: 1;
  width: 3cqh;
  height: 3cqh;
}
#SpicyLyricsPage .NotificationContainer.Danger .NotificationIcon svg {
  fill: #ff0000;
}
#SpicyLyricsPage .NotificationContainer.Information .NotificationIcon svg {
  fill: #2a2aff;
}
#SpicyLyricsPage .NotificationContainer.Success .NotificationIcon svg {
  fill: #00ff00;
}
#SpicyLyricsPage .NotificationContainer.Warning .NotificationIcon svg {
  fill: #ffaa00;
}
#SpicyLyricsPage .NotificationContainer .NotificationText {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 1cqh;
}
#SpicyLyricsPage .NotificationContainer .NotificationText .NotificationTitle {
  font-size: calc(var(--default-font-size) * 0.8);
  font-weight: 900;
  color: rgb(255, 255, 255);
  text-align: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationText .NotificationDescription {
  font-size: calc(var(--default-font-size) * 0.4);
  font-weight: 400;
  color: rgb(206, 206, 206);
  text-align: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationCloseButton {
  color: rgb(255, 255, 255);
  font-size: calc(var(--default-font-size) * 0.3);
  cursor: pointer;
  width: 4cqh;
  height: 4cqh;
  display: flex;
  align-items: center;
  justify-content: center;
}
#SpicyLyricsPage .NotificationContainer .NotificationCloseButton.Disabled {
  opacity: 0;
  z-index: -1;
  pointer-events: none;
  cursor: default;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3af93/spicy-dynamic-bg.css */
.spicy-dynamic-bg {
  filter: saturate(1.5) brightness(.8);
  height: 100%;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
}
.spicy-dynamic-bg .Back,
.spicy-dynamic-bg .BackCenter,
.spicy-dynamic-bg .Front {
  --PlaceholderHueShift: 0deg;
  animation: bgAnim 45s linear infinite;
  border-radius: 100em;
  position: absolute;
  width: 200%;
  filter: blur(15px);
}
#SpicyLyricsPage.Fullscreen .spicy-dynamic-bg:not(.lowqmode) {
  max-height: 60%;
  max-width: 20%;
  scale: 500% 170%;
}
.spicy-dynamic-bg .Back:not(.NoEffect),
.spicy-dynamic-bg .BackCenter:not(.NoEffect),
.spicy-dynamic-bg .Front:not(.NoEffect) {
  filter: hue-rotate(var(--PlaceholderHueShift)) blur(40px);
}
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg .Back:not(.NoEffect),
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg .BackCenter:not(.NoEffect),
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg .Front:not(.NoEffect) {
  filter: hue-rotate(var(--PlaceholderHueShift)) blur(30px);
}
.spicy-dynamic-bg .Front {
  right: 0;
  top: 0;
  z-index: 2;
}
.spicy-dynamic-bg .Back {
  animation-direction: reverse;
  bottom: 0;
  left: 0;
  z-index: 1;
}
.spicy-dynamic-bg .BackCenter {
  animation-direction: reverse;
  right: -50%;
  top: -20%;
  width: 300%;
  z-index: 0;
}
.spicy-dynamic-bg-in-this {
  overflow: hidden;
  position: relative;
}
.spicy-dynamic-bg-in-this:is(aside) .spicy-dynamic-bg {
  filter: saturate(2) brightness(0.7);
  max-height: 100%;
  max-width: 100%;
}
.spicy-dynamic-bg-in-this:is(aside) video {
  filter: opacity(0.75) brightness(0.5);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 90%);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 90%);
}
.main-nowPlayingView-coverArtContainer div:has(video)::before,
.main-nowPlayingView-coverArtContainer div:has(video)::after {
  display: none;
}
.spicy-dynamic-bg-in-this:is(aside) .AAdBM1nhG73supMfnYX7 {
  z-index: 1;
  position: relative;
}
#SpicyLyricsPage .spicy-dynamic-bg:not(.lowqmode) {
  max-height: 55%;
  max-width: 35%;
  scale: 290% 185%;
  transform-origin: left top;
}
#SpicyLyricsPage .spicy-dynamic-bg {
  filter: saturate(2.5) brightness(.65);
}
#SpicyLyricsPage .spicy-dynamic-bg:is(.lowqmode) {
  -o-object-fit: cover;
  object-fit: cover;
  filter: brightness(.55) blur(9px) saturate(1.05);
  scale: 1.05;
}
@keyframes bgAnim {
  0% {
    transform: rotate(var(--bg-rotation-degree));
  }
  to {
    transform: rotate(calc(var(--bg-rotation-degree) + 1turn));
  }
}
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg .Front,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg .Back,
body:has(#SpicyLyricsPage.Fullscreen) .Root__right-sidebar aside:is(.NowPlayingView, .spicy-dynamic-bg-in-this) .spicy-dynamic-bg .BackCenter {
  display: none;
  animation: none;
  filter: none;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3aff4/main.css */
#SpicyLyricsPage .LyricsContainer {
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}
#SpicyLyricsPage .LyricsContainer.Hidden {
  display: none;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent {
  --TextGlowDef: rgba(255,255,255,0.15) 0px 0px 6px;
  --ActiveTextGlowDef: rgba(255,255,255,0.4) 0px 0px 14px;
  --StrongTextGlowDef: rgba(255,255,255,0.68) 0px 0px 16.4px;
  --StrongerTextGlowDef: rgba(255,255,255,0.74) 0px 0px 16px;
  --DefaultLyricsSize: clamp(1.5rem,calc(1cqw* 7), 2rem);
  --DefaultLyricsSize-Small: clamp(1.1rem,calc(1cqw* 6), 1.5rem);
  --Simplebar-Scrollbar-Color: rgba(255, 255, 255, 0.6);
  overflow-x: hidden !important;
  overflow-y: auto !important;
  height: 100cqh;
  width: 100%;
  font-size: var(--DefaultLyricsSize);
  font-weight: 900;
  transition:
    opacity,
    transform,
    scale 0.2s linear;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  z-index: 9;
  --ImageMask: linear-gradient( 180deg, transparent 0, var(--spice-sidebar) 16px, var(--spice-sidebar) calc(100% - 64px), transparent calc(100% - 16px), transparent );
  --webkit-mask-image: var(--ImageMask);
  -webkit-mask-image: var(--ImageMask);
  mask-image: var(--ImageMask);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .BottomSpacer {
  display: block;
  height: 50cqh;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .TopSpacer {
  display: block;
  height: 25cqh;
}
#SpicyLyricsPage .ContentBox .NowBar:not(.Active) + .LyricsContainer .LyricsContent .simplebar-content-wrapper {
  padding: 0 18cqw;
}
#SpicyLyricsPage .ContentBox .NowBar.Active:is(.LeftSide) + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 0 8cqw 0 2cqw !important;
}
#SpicyLyricsPage .ContentBox .NowBar.Active:is(.RightSide) + .LyricsContainer .LyricsContent .simplebar-content-wrapper .simplebar-content {
  padding: 0 2cqw 0 8cqw !important;
}
header.main-topBar-container .FuriganaInfo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(247, 247, 247, 0.5);
  padding: 8px;
  text-align: center;
  font-size: 13px;
  color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-decoration: none;
}
.simplebar-content .line {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.line-furigana {
  font-size: var(--DefaultLyricsSize-Small);
  margin-top: -0.25rem;
}
#spicy-lyrics-settings button,
#spicy-lyrics-dev-settings button,
#amai-info button {
  --encore-control-size-smaller: 32px;
  --encore-spacing-tighter-4: 4px;
  --encore-spacing-base: 16px;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  background-color: transparent;
  border-radius: var(--encore-button-corner-radius,9999px);
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  text-transform: none;
  touch-action: manipulation;
  transition-duration: 33ms;
  transition-property:
    background-color,
    border-color,
    color,
    box-shadow,
    filter,
    transform;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  vertical-align: middle;
  transform: translate3d(0px, 0px, 0px);
  border: 1px solid var(--essential-subdued,#818181);
  color: var(--text-base,#000000);
  min-inline-size: 0px;
  min-block-size: var(--encore-control-size-smaller,32px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--encore-control-size-smaller);
  padding-block: var(--encore-spacing-tighter-4);
  padding-inline: var(--encore-spacing-base);
}
#spicy-lyrics-settings button:hover,
#spicy-lyrics-dev-settings button:hover,
#amai-info button:hover {
  transform: scale(1.04);
  border: 1px solid var(--essential-base,#000000);
}
#spicy-lyrics-settings button:active,
#spicy-lyrics-dev-settings button:active,
#amai-info button:active {
  opacity: 0.7;
  outline: none;
  transform: scale(1);
  border: 1px solid var(--essential-subdued,#818181);
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3b045/Mixed.css */
#SpicyLyricsPage .lyricsParent .LyricsContent.lowqmode .line {
  --BlurAmount: 0px !important;
  filter: none !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  --font-size: var(--DefaultLyricsSize);
  display: flex;
  flex-wrap: wrap;
  transition: opacity .1s cubic-bezier(0.61, 1, 0.88, 1);
  font-size: var(--font-size);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  cursor: pointer;
  font-weight: 900;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  position: relative;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter {
  --gradient-position: -20%;
  --gradient-alpha: 0.85;
  --gradient-alpha-end: 0.5;
  --gradient-degrees: 90deg;
  --gradient-offset: 0%;
  background-image: linear-gradient(var(--gradient-degrees), rgba(255, 255, 255, var(--gradient-alpha)) var(--gradient-position), rgba(255, 255, 255, var(--gradient-alpha-end)) calc(var(--gradient-position) + 20% + var(--gradient-offset)));
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line {
  --BlurAmount: 0px;
  --DefaultLyricsScale: 0.95;
  --DefaultEmphasisLyricsScale: 0.95;
  --DefaultLineScale: 1;
  --Vocal-NotSung-opacity: 0.51;
  --Vocal-Active-opacity: 1;
  --Vocal-Sung-opacity: 0.497;
  --Vocal-Hover-opacity: 1;
  --gradient-degrees: 180deg !important;
  --gradient-alpha-end: 0.35 !important;
  letter-spacing: 0;
  line-height: 1.1818181818;
  direction: ltr;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.rtl {
  direction: rtl !important;
  transform-origin: right center !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:not(.HideLineBlur) .line {
  filter: blur(var(--BlurAmount));
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word {
  transform-origin: center center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word.PartOfWord + :is(.word, .letterGroup) {
  transform-origin: left center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word.PartOfWord {
  transform-origin: right center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .dotGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  --text-shadow-blur-radius: 4px;
  --text-shadow-opacity: 0%;
  --TextShadowDefinition: 0 0 var(--text-shadow-blur-radius) rgba(255,255,255,var(--text-shadow-opacity));
  will-change:
    --gradient-percentage,
    transform,
    opacity,
    text-shadow,
    scale;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:not(.musical-line) .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  display: inline-block;
  --DefaultTransitionDuration: var(--content-duration, 0.15s);
  --TransitionDuration: var(--DefaultTransitionDuration);
  --TransitionDefinition: all var(--TransitionDuration) cubic-bezier(0.61, 1, 0.88, 1);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letterGroup {
  text-shadow: var(--TextShadowDefinition);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:is(.Active, .Sung) .letterGroup {
  transition: var(--TransitionDefinition);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .letterGroup .letter {
  --gradient-alpha: 0.6;
  --gradient-alpha-end: 0.3;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.OppositeAligned {
  justify-content: flex-end;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung {
  opacity: var(--Vocal-Sung-opacity);
  --gradient-position: 100% !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung {
  scale: var(--DefaultLineScale);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung {
  opacity: var(--Vocal-NotSung-opacity);
  --gradient-position: -20% !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung:hover,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung:hover .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung:hover .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung:hover,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung:hover .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung:hover .letter {
  text-shadow: none;
  opacity: var(--Vocal-Hover-opacity, 1) !important;
  filter: none;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word:not(.PartOfWord, .dot, .LastWordInLine)::after,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup:not(.PartOfWord, .dot, .LastWordInLine)::after {
  content: "";
  margin-right: .3ch;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letter {
  --text-shadow-blur-radius: 4px !important;
  --text-shadow-opacity: 0% !important;
  --gradient-position: -20% !important;
  --TransitionDuration: var(--DefaultTransitionDuration) !important;
  scale: var(--DefaultLyricsScale) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .word {
  transform: translateY(calc(var(--DefaultLyricsSize) * 0.01)) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letterGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letter {
  transform: translateY(calc(var(--DefaultLyricsSize) * 0.02)) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letter,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.NotSung .letterGroup {
  scale: var(--DefaultEmphasisLyricsScale);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  transition: all 0.24s cubic-bezier(0.61, 1, 0.88, 1);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .word-group {
  display: inline-flex;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung .letter {
  --gradient-position: 100% !important;
  --text-shadow-blur-radius: 4px !important;
  --text-shadow-opacity: 0% !important;
  --TransitionDuration: var(--DefaultTransitionDuration) !important;
  text-shadow: var(--TextShadowDefinition) !important;
  transform: translateY(0) !important;
  scale: 1 !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Sung .letterGroup {
  transform: translateY(0) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line .letterGroup {
  display: inline-flex;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .letterGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line .letterGroup .letter {
  --font-size: calc(var(--DefaultLyricsSize)*0.75);
  font-size: var(--font-size);
  font-family: SpicyLyrics;
  font-weight: 500;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line {
  transition: scale 0.25s ease-in-out, position 0.25s ease-in-out;
  position: absolute;
  transform-origin: center center;
  margin: 0;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line.Active {
  position: relative;
  margin: -1.38cqw 0;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line.musical-line.Active {
  margin: -0.8cqw 0 !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line .dotGroup {
  scale: 0;
  transition: all 0.25s ease-in-out;
  transform-origin: center center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line.Active .dotGroup {
  scale: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.bg-line {
  margin: -1.3cqw 0 1.5cqw !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line .dotGroup {
  --dot-gap: clamp(0.005rem, 1.7cqw, 0.2rem);
  display: flex;
  flex-direction: row;
  gap: var(--dot-gap);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.musical-line .dotGroup .dot {
  --font-size: calc(var(--DefaultLyricsSize)*1.3);
  --opacity-size: .2;
  border-radius: 50%;
  transition: all ease-in 0.3s;
  scale: 0.75;
  font-size: var(--font-size);
  opacity: var(--opacity-size);
  --gradient-position: 100%;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active {
  opacity: 1;
  filter: none;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active .word,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active .letterGroup,
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.Active .letterGroup .letter {
  opacity: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line.static {
  cursor: default;
  --gradient-position: 100%;
  --gradient-alpha: 1;
  --gradient-alpha-end: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent.offline {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .line:not(.musical-line),
#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits {
  margin: var(--SpicyLyrics-LineSpacing, 1cqw 0);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits {
  --font-size: calc(var(--DefaultLyricsSize)*0.47);
  font-size: var(--font-size);
  opacity: 0.65;
  margin-top: 7cqh !important;
  scale: 1;
  transition: opacity 0.8s ease-in-out;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits.Active {
  opacity: 1;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line {
  transform-origin: left center;
  transition: scale .2s cubic-bezier(.37, 0, .63, 1), opacity .2s cubic-bezier(.37, 0, .63, 1);
  margin: 1.5cqw 0;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line.OppositeAligned {
  transform-origin: right center;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Line] .line.Active {
  scale: 1.05;
  text-shadow: var(--ActiveTextGlowDef) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Static] {
  --DefaultLyricsSize: clamp(0.8rem,calc(1cqw* 5), 2.5rem);
}
#SpicyLyricsPage .LyricsContainer .LyricsContent[data-lyrics-type=Static] .line {
  font-weight: 500;
}
#SpicyLyricsPage.Podcast .LyricsContainer .LyricsContent .line.NotSung .word,
#SpicyLyricsPage.Podcast .LyricsContainer .LyricsContent .line.Sung .word {
  scale: 1 !important;
  transform: translateY(calc(var(--DefaultLyricsSize) * 0)) !important;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned) .line.OppositeAligned:not(.rtl) {
  padding-left: 15cqw;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned) .line:not(.OppositeAligned, .rtl) {
  padding-right: 15cqw;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned.rtl) .line.OppositeAligned {
  padding-right: 15cqw;
}
#SpicyLyricsPage .LyricsContainer .LyricsContent:has(.OppositeAligned.rtl) .line:not(.OppositeAligned) {
  padding-left: 15cqw;
}

/* C:/Users/Hathaway/AppData/Local/Temp/tmp-19536-xCuc3cXh3n0p/195df3e3b0a6/LoaderContainer.css */
#SpicyLyricsPage .LyricsContainer .loaderContainer {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: -1;
  opacity: 0;
  transition: all 0.4s ease-in-out;
}
#SpicyLyricsPage .LyricsContainer .loaderContainer.active {
  position: relative;
  opacity: 1;
  z-index: 9;
}
#SpicyLyricsPage .LyricsContainer .loaderContainer:is(.active) + .LyricsContent {
  display: none;
}

      `).trim();
      document.head.appendChild(el);
    }
  })()
      })();