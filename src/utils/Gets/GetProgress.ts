import Global from '../../components/Global/Global';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import lifecycle from '../lifecycle';
import { extrapolatePosition } from './extrapolatePosition';

interface SpotifyPlatformType {
  PlayerAPI?: {
    _contextPlayer?: {
      getPositionState?: (args: Record<string, never>) => Promise<{ position: number }>;
      resume?: (args: Record<string, never>) => Promise<void>;
    };
    _state?: {
      positionAsOfTimestamp?: number;
      timestamp?: number;
    };
  };
  PlaybackAPI?: {
    _isLocal?: boolean;
  };
}

// Hot-reload safe state: Spicetify re-injects the script and re-evaluates modules,
// creating a *new* copy of every module-scoped variable. Without window persistence,
// the old runLoop keeps polling with stale closures while the new module spawns a
// second loop — doubling RPC/CPU each reload. Backing mutable state on window
// keeps a single shared loop across reloads.
type GetProgressState = {
  canSyncNonLocalTimestamp: number;
  syncedPosition: { StartedSyncAt: number; Position: number };
  activePositionClients: number;
  syncNow: boolean;
  loopScheduled: boolean;
  loopTimeoutId: number | null;
  teardownRequested: boolean;
  cachedPosition: number | null;
  cachedPositionTime: number;
  cachedIsPlaying: boolean | null;
};

// SAFETY: window augmentation for hot-reload persistence; __amaiGetProgressState is our isolated namespace
const windowRef = window as unknown as {
  __amaiGetProgressState?: GetProgressState;
  __amaiGetProgressVisHandlerAttached?: boolean;
  __amaiGetProgressOnProgressAttached?: boolean;
};

function safeInitialPlaying(): boolean {
  try {
    if (typeof Spicetify?.Player?.isPlaying === 'function') {
      return !!Spicetify.Player.isPlaying();
    }
  } catch {
    // fall through to data check
  }
  try {
    const paused = (Spicetify?.Player?.data as { isPaused?: unknown } | undefined)?.isPaused;
    if (typeof paused === 'boolean') return !paused;
  } catch {
    // ignore
  }
  return false;
}

const syncTimings = [0.05, 0.1, 0.15, 0.75];

const state: GetProgressState =
  windowRef.__amaiGetProgressState ??
  (windowRef.__amaiGetProgressState = {
    canSyncNonLocalTimestamp: safeInitialPlaying() ? syncTimings.length : 0,
    syncedPosition: { StartedSyncAt: 0, Position: 0 },
    activePositionClients: 0,
    syncNow: false,
    loopScheduled: false,
    loopTimeoutId: null,
    teardownRequested: false,
    cachedPosition: null,
    cachedPositionTime: 0,
    cachedIsPlaying: null,
  });

// Patch state shape from versions before this fix (hot-reload in the same session).
if (!('loopTimeoutId' in state)) {
  Object.assign(state, { loopTimeoutId: null });
}
if (!('teardownRequested' in state)) {
  Object.assign(state, { teardownRequested: false });
}

// ---------------------------------------------------------------------------
// Defensive readers — every Spicetify internal below has broken at least once
// after a Spotify client update. Each reader returns null instead of throwing
// so GetProgress() can fall through to the next source.
// ---------------------------------------------------------------------------

function safeFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Public, Spicetify-maintained progress (survives internal renames). */
function safeIsPlaying(): boolean {
  try {
    if (typeof Spicetify?.Player?.isPlaying === 'function') {
      return !!Spicetify.Player.isPlaying();
    }
  } catch {
    // fall through
  }
  try {
    const data = Spicetify?.Player?.data as { isPaused?: unknown } | undefined;
    if (data && typeof data.isPaused === 'boolean') return !data.isPaused;
  } catch {
    // ignore
  }
  return false;
}

/** Spicetify.Player.getProgress() — the most stable source across updates. */
function getPublicProgress(): number | null {
  try {
    const fn = Spicetify?.Player?.getProgress as unknown;
    if (typeof fn === 'function') {
      const value = (fn as () => unknown).call(Spicetify.Player);
      const n = safeFiniteNumber(value);
      // Sanity: a track position is never negative or longer than ~10h.
      if (n !== null && n >= 0 && n < 10 * 3600 * 1000) return n;
    }
  } catch {
    // ignore — fall through to state-based sources
  }
  return null;
}

function readPlayerDataPosition(): { pos: number; ts: number | null; paused: boolean } | null {
  try {
    const data = Spicetify?.Player?.data as
      { positionAsOfTimestamp?: unknown; timestamp?: unknown; isPaused?: unknown } | undefined;
    if (!data) return null;
    const pos = safeFiniteNumber(data.positionAsOfTimestamp);
    if (pos === null) return null;
    const ts = safeFiniteNumber(data.timestamp);
    const paused = typeof data.isPaused === 'boolean' ? data.isPaused : !safeIsPlaying();
    return { pos, ts, paused };
  } catch {
    return null;
  }
}

function readOriginPosition(): { pos: number; ts: number | null; paused: boolean } | null {
  try {
    // SAFETY: Player.origin is untyped at runtime; narrowed via optional chaining and record checks
    const originState = (
      Spicetify?.Player as unknown as { origin?: { _state?: Record<string, unknown> } }
    )?.origin?._state;
    if (!originState || typeof originState !== 'object') return null;
    const pos = safeFiniteNumber(originState['positionAsOfTimestamp']);
    if (pos === null) return null;
    const ts = safeFiniteNumber(originState['timestamp']);
    const rawPaused = originState['isPaused'];
    const paused = typeof rawPaused === 'boolean' ? rawPaused : !safeIsPlaying();
    return { pos, ts, paused };
  } catch {
    return null;
  }
}

function readPlatformPosition(): { pos: number; ts: number | null } | null {
  try {
    // SAFETY: Platform internals are untyped; optional chaining keeps renames non-fatal
    const platformState = (
      Spicetify as unknown as { Platform?: { PlayerAPI?: { _state?: Record<string, unknown> } } }
    )?.Platform?.PlayerAPI?._state;
    if (!platformState || typeof platformState !== 'object') return null;
    const pos = safeFiniteNumber(platformState['positionAsOfTimestamp']);
    if (pos === null) return null;
    const ts = safeFiniteNumber(platformState['timestamp']);
    return { pos, ts };
  } catch {
    return null;
  }
}

function readIsLocal(defaultValue = true): boolean {
  try {
    // SAFETY: PlaybackAPI internals are untyped; boolean check keeps renames non-fatal
    const v = (Spicetify as unknown as { Platform?: { PlaybackAPI?: { _isLocal?: unknown } } })
      ?.Platform?.PlaybackAPI?._isLocal;
    if (typeof v === 'boolean') return v;
  } catch {
    // ignore
  }
  return defaultValue;
}

/** Best-effort position from memory-only state (no RPC). Used as fallback. */
function getStateBasedPosition(): number | null {
  const playing = safeIsPlaying();
  const now = Date.now();
  const fromData = readPlayerDataPosition();
  if (fromData) {
    if (fromData.paused || fromData.ts === null) return fromData.pos;
    return extrapolatePosition(fromData.pos, fromData.ts, now);
  }
  const fromOrigin = readOriginPosition();
  if (fromOrigin) {
    if (fromOrigin.paused || fromOrigin.ts === null) return fromOrigin.pos;
    return extrapolatePosition(fromOrigin.pos, fromOrigin.ts, now);
  }
  const fromPlatform = readPlatformPosition();
  if (fromPlatform) {
    if (!playing || fromPlatform.ts === null) return fromPlatform.pos;
    return extrapolatePosition(fromPlatform.pos, fromPlatform.ts, now);
  }
  return null;
}

/** Push a fresh anchor so delta-based math stays consistent with public reads. */
function setAnchor(position: number, startedAtPerfNow?: number): void {
  const startedAt =
    typeof startedAtPerfNow === 'number' && Number.isFinite(startedAtPerfNow)
      ? startedAtPerfNow
      : performance.now();
  state.syncedPosition.StartedSyncAt = startedAt;
  state.syncedPosition.Position = position;
  syncedPosition.StartedSyncAt = startedAt;
  syncedPosition.Position = position;
}

// Event-driven anchor: Spicetify fires `onprogress` ~1Hz while playing with the
// current position. Feeding it into the anchor keeps lyrics moving even if the
// periodic RPC sync breaks after a client update (private API rename, etc.).
function ensureOnProgressAnchor(): void {
  if (windowRef.__amaiGetProgressOnProgressAttached) return;
  windowRef.__amaiGetProgressOnProgressAttached = true;
  try {
    Spicetify.Player.addEventListener('onprogress', ((event: unknown) => {
      try {
        let pos: number | null = null;
        if (typeof event === 'number') {
          pos = safeFiniteNumber(event);
        } else if (event && typeof event === 'object') {
          const data = (event as { data?: unknown }).data;
          pos = safeFiniteNumber(
            typeof data === 'number' ? data : (event as { position?: unknown }).position,
          );
        }
        if (pos !== null && pos >= 0) {
          setAnchor(pos);
          state.cachedPosition = pos;
          state.cachedPositionTime = performance.now();
          state.cachedIsPlaying = safeIsPlaying();
        }
      } catch {
        // never let an anchor update break playback
      }
    }) as never);
  } catch {
    windowRef.__amaiGetProgressOnProgressAttached = false;
  }
}
try {
  ensureOnProgressAnchor();
} catch {
  // Spicetify may not be ready at import time; the sync loop retries via public reads.
}

// Visibility-aware throttling: while hidden (minimized / tray) no position
// consumer can be visible, so we stay at idle heartbeat and skip RPC.
function isDocumentHidden(): boolean {
  try {
    return typeof document !== 'undefined' && document.hidden;
  } catch {
    return false;
  }
}

function ensureVisibilityHandler(): void {
  if (windowRef.__amaiGetProgressVisHandlerAttached) return;
  windowRef.__amaiGetProgressVisHandlerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.activePositionClients > 0) {
      // Wake immediately so lyrics/playbar snap back without 1s delay
      state.syncNow = true;
      scheduleLoop(0);
    }
  });
}
if (typeof document !== 'undefined') ensureVisibilityHandler();

const syncedPosition = state.syncedPosition;

async function getLocalPosition(startedAt: number, SpotifyPlatform: SpotifyPlatformType) {
  const getPositionState = SpotifyPlatform.PlayerAPI?._contextPlayer?.getPositionState;
  if (typeof getPositionState !== 'function') {
    throw new Error('getPositionState unavailable');
  }
  const { position } = await getPositionState.call(SpotifyPlatform.PlayerAPI._contextPlayer, {});
  const n = Number(position);
  if (!Number.isFinite(n)) throw new Error('invalid position from getPositionState');
  return {
    StartedSyncAt: startedAt,
    Position: n,
  };
}

async function getNonLocalPosition(startedAt: number, SpotifyPlatform: SpotifyPlatformType) {
  const contextPlayer = SpotifyPlatform.PlayerAPI?._contextPlayer;
  if (state.canSyncNonLocalTimestamp > 0 && typeof contextPlayer?.resume === 'function') {
    try {
      await contextPlayer.resume.call(contextPlayer, {});
    } catch {
      // resume is best-effort; timestamp sync below is the real source
    }
  }
  state.canSyncNonLocalTimestamp = Math.max(0, state.canSyncNonLocalTimestamp - 1);
  const platformState = SpotifyPlatform.PlayerAPI?._state;
  const positionAsOfTimestamp = safeFiniteNumber(platformState?.positionAsOfTimestamp);
  const timestamp = safeFiniteNumber(platformState?.timestamp);
  if (positionAsOfTimestamp === null) throw new Error('platform position unavailable');
  return {
    StartedSyncAt: startedAt,
    Position: extrapolatePosition(positionAsOfTimestamp, timestamp ?? Date.now(), Date.now()),
  };
}

// While paused the track position is static, but we still need to detect when
// playback resumes so the loop can wake back up. Poll at a low rate and do zero
// RPC/position work in the meantime — GetProgress already falls back to
// `positionAsOfTimestamp` while paused.
const PAUSED_POLL_MS = 500;

// How often to refresh the position anchor while at least one consumer (lyrics
// page, playbar lyrics, fullscreen NowBar) actually needs a position. GetProgress
// computes `base + delta` between syncs, so positions stay smooth at 60fps without
// needing a 60Hz anchor — a few syncs per second is plenty to correct drift.
// (This replaces the old fixed ~60Hz getPositionState/resume loop that ran
// unconditionally for the whole session whenever music was playing.)
const ACTIVE_SYNC_MS = 250;

// When nothing on screen needs a position, do NO RPC at all — just heartbeat
// cheaply so the loop is still alive to notice pause/play transitions and wake
// back up as soon as a consumer registers.
const IDLE_HEARTBEAT_MS = 1000;

// Reference-counted consumers that need an accurate playback position.
// All mutable scheduling flags live on `state` so re-evaluated modules share them.

/**
 * Registers a consumer of the playback position and returns a release function.
 * The sync loop only runs its (potentially RPC-heavy) anchor refresh while at
 * least one consumer is active; otherwise it idles cheaply. On the first
 * registration of the session it requests an immediate sync so the very first
 * frame uses a fresh anchor.
 */
export function requestPositionTracking(): () => void {
  state.activePositionClients++;
  if (state.teardownRequested && state.activePositionClients > 0) {
    state.teardownRequested = false;
  }
  if (state.activePositionClients === 1) {
    state.syncNow = true;
    scheduleLoop(0);
  }
  return () => {
    state.activePositionClients = Math.max(0, state.activePositionClients - 1);
  };
}

function scheduleLoop(delay: number): void {
  if (state.teardownRequested && state.activePositionClients === 0) return;
  if (state.teardownRequested && state.activePositionClients > 0) {
    state.teardownRequested = false;
  }
  if (state.loopScheduled) return;
  state.loopScheduled = true;
  const id = window.setTimeout(() => {
    state.loopScheduled = false;
    state.loopTimeoutId = null;
    void runLoop();
  }, delay);
  state.loopTimeoutId = id;
}

export function destroyGetProgressLoop(): void {
  if (state.loopTimeoutId !== null) {
    clearTimeout(state.loopTimeoutId);
    state.loopTimeoutId = null;
  }
  state.loopScheduled = false;
  state.syncNow = false;
  state.activePositionClients = 0;
  state.teardownRequested = true;
}

async function doSync(): Promise<void> {
  const startedAt = performance.now();
  // Prefer the public API — it is maintained by Spicetify across client
  // updates, unlike the private _contextPlayer RPC below.
  const pub = getPublicProgress();
  if (pub !== null) {
    setAnchor(pub, startedAt);
    return;
  }

  const SpotifyPlatform = Spicetify.Platform as SpotifyPlatformType | undefined;
  const isLocallyPlaying = readIsLocal(true);

  let pos: { StartedSyncAt: number; Position: number };
  if (isLocallyPlaying) {
    if (!SpotifyPlatform) throw new Error('platform unavailable');
    pos = await getLocalPosition(startedAt, SpotifyPlatform);
  } else {
    if (!SpotifyPlatform) throw new Error('platform unavailable');
    pos = await getNonLocalPosition(startedAt, SpotifyPlatform);
  }

  // Update the shared object to reduce allocations and keep hot-reload clones in sync.
  setAnchor(pos.Position, pos.StartedSyncAt);
}

async function runLoop(): Promise<void> {
  try {
    if (state.teardownRequested && state.activePositionClients === 0) return;
    // While hidden (minimized/tray), skip RPC and stay at idle heartbeat.
    if (isDocumentHidden()) {
      state.syncNow = false;
      scheduleLoop(IDLE_HEARTBEAT_MS);
      return;
    }
    const isPlaying = safeIsPlaying();

    // Only do the (potentially RPC-heavy) anchor sync while something actually
    // needs a fresh position. Otherwise stay idle and do zero RPC work.
    if (isPlaying && (state.activePositionClients > 0 || state.syncNow)) {
      state.syncNow = false;
      try {
        await doSync();
      } catch (error) {
        // Private RPC broke (common after Spotify client updates) — fall back
        // to memory-only state so the anchor still advances instead of freezing.
        const fallback = getStateBasedPosition();
        if (fallback !== null) setAnchor(fallback);
        else console.error('Sync Position: Fail, More Details:', error);
      }
    } else {
      state.syncNow = false;
    }

    if (state.teardownRequested && state.activePositionClients === 0) return;

    const nowPlaying = safeIsPlaying();
    // Paused: stay in a cheap idle poll, no getPositionState/resume calls.
    if (!nowPlaying) {
      scheduleLoop(PAUSED_POLL_MS);
    } else if (state.activePositionClients > 0) {
      scheduleLoop(ACTIVE_SYNC_MS);
    } else {
      scheduleLoop(IDLE_HEARTBEAT_MS);
    }
  } catch (error) {
    console.error('Sync Position: Fail, More Details:', error);
    if (state.teardownRequested && state.activePositionClients === 0) return;
    // Keep polling on error so we recover as soon as playback state allows.
    scheduleLoop(PAUSED_POLL_MS);
  }
}

export function requestPositionSync(): void {
  // Mark an immediate sync — without this, a loop wake with zero registered
  // consumers would skip doSync() entirely (see runLoop guard).
  state.syncNow = true;
  scheduleLoop(0);
}

// Re-anchors the synced position to the platform's currently reported position
// using a fresh local timestamp, WITHOUT any RPC. Used right after a position
// discontinuity (pause -> resume, or any seek) so the delta-based GetProgress()
// math is correct on the very next frame instead of drifting until the next
// periodic anchor sync.
//
// Why this is needed for resume: GetProgress() returns
// `syncedPosition.Position + (performance.now() - syncedPosition.StartedSyncAt)`
// while playing. The anchor is frozen while paused, so on resume that delta has
// grown by the entire pause duration. A forced RPC re-sync races with
// Spicetify.Player.isPlaying() flipping to true, so it can be dropped for up to
// the next paused-poll tick. Re-anchoring here is instant and race-free; the
// next scheduled doSync() refines it with an exact position read.
export function reanchorPosition(): void {
  try {
    const pub = getPublicProgress();
    if (pub !== null) {
      setAnchor(pub);
      return;
    }
    const fromData = readPlayerDataPosition();
    if (fromData) {
      const now = Date.now();
      const pos =
        !fromData.paused && fromData.ts !== null
          ? extrapolatePosition(fromData.pos, fromData.ts, now)
          : fromData.pos;
      setAnchor(pos);
      return;
    }
    const fromOrigin = readOriginPosition();
    if (fromOrigin) {
      const now = Date.now();
      const pos =
        !fromOrigin.paused && fromOrigin.ts !== null
          ? extrapolatePosition(fromOrigin.pos, fromOrigin.ts, now)
          : fromOrigin.pos;
      setAnchor(pos);
      return;
    }
    // SAFETY: Spicetify.Platform is injected at runtime and untyped; we narrow optional _state safely
    const platform = Spicetify.Platform as unknown as {
      PlayerAPI?: { _state?: { positionAsOfTimestamp?: number; timestamp?: number } };
    };
    const platformState = platform?.PlayerAPI?._state;
    if (!platformState) return;
    const positionAsOfTimestamp =
      typeof platformState.positionAsOfTimestamp === 'number'
        ? platformState.positionAsOfTimestamp
        : 0;
    const timestamp =
      typeof platformState.timestamp === 'number' ? platformState.timestamp : Date.now();
    setAnchor(extrapolatePosition(positionAsOfTimestamp, timestamp, Date.now()));
  } catch {
    // never throw from a re-anchor — worst case the next periodic sync fixes it
  }
}

// Per-frame position cache — all per-frame loops (render, scroll, playbar)
// within the same rAF tick share one position value instead of each calling
// GetProgress independently. Backed on window so hot-reload shares the entry.
const POSITION_CACHE_TTL = 15; // ms (~1 frame at 60fps)

// Function to get the current progress — never throws, so render loops can
// never be killed by a Spicetify internal rename after a client update.
export default function GetProgress(): number {
  try {
    const now = performance.now();
    let isPlaying = false;
    try {
      isPlaying = safeIsPlaying();
    } catch {
      isPlaying = false;
    }
    if (
      state.cachedPosition !== null &&
      state.cachedIsPlaying === isPlaying &&
      now - state.cachedPositionTime < POSITION_CACHE_TTL
    ) {
      return state.cachedPosition;
    }

    // 1) Public API first — maintained by Spicetify across client updates.
    const pub = getPublicProgress();
    if (pub !== null) {
      // Keep the delta anchor consistent so paused/playing transitions stay exact.
      setAnchor(pub, now);
      state.cachedPosition = pub;
      state.cachedPositionTime = now;
      state.cachedIsPlaying = isPlaying;
      return pub;
    }

    // 2) Delta-extrapolated anchor (refreshed by the sync loop / onprogress).
    if (state.syncedPosition.StartedSyncAt || state.syncedPosition.Position) {
      try {
        const isLocal = readIsLocal(true);
        const startedAt = state.syncedPosition.StartedSyncAt;
        const basePosition = state.syncedPosition.Position;
        let result: number;
        if (!isPlaying) {
          const pausedPos =
            readPlatformPosition()?.pos ?? readPlayerDataPosition()?.pos ?? basePosition;
          result = pausedPos;
        } else {
          const calculated = extrapolatePosition(basePosition, startedAt, performance.now());
          let offset = 0;
          try {
            offset = Global?.NonLocalTimeOffset ?? 0;
          } catch {
            offset = 0;
          }
          result = isLocal ? calculated : calculated + (typeof offset === 'number' ? offset : 0);
        }
        if (Number.isFinite(result) && result >= 0) {
          state.cachedPosition = result;
          state.cachedPositionTime = now;
          state.cachedIsPlaying = isPlaying;
          return result;
        }
      } catch {
        // fall through to state-based fallback
      }
    }

    // 3) Memory-only player state (no anchor needed).
    const stateBased = getStateBasedPosition();
    if (stateBased !== null && Number.isFinite(stateBased) && stateBased >= 0) {
      state.cachedPosition = stateBased;
      state.cachedPositionTime = now;
      state.cachedIsPlaying = isPlaying;
      return stateBased;
    }

    // 4) Legacy fallback (origin._state math).
    try {
      if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
        const legacy = SpotifyPlayer._DEPRECATED_.GetTrackPosition() as unknown;
        const n = safeFiniteNumber(legacy);
        if (n !== null && n >= 0) {
          state.cachedPosition = n;
          state.cachedPositionTime = now;
          state.cachedIsPlaying = isPlaying;
          return n;
        }
      }
    } catch {
      // ignore
    }

    // 5) Last resort: last known good, else 0 — never null/NaN/throw.
    if (state.cachedPosition !== null && Number.isFinite(state.cachedPosition)) {
      return state.cachedPosition;
    }
    return 0;
  } catch {
    try {
      if (state.cachedPosition !== null && Number.isFinite(state.cachedPosition)) {
        return state.cachedPosition;
      }
    } catch {
      // ignore
    }
    return 0;
  }
}

// Register teardown for this instance. Each hot-reload re-evaluates the module
// (fresh closure), so we register unconditionally — lifecycle disposes it on the
// next reload via __amaiLyricsTeardown.
lifecycle.trackCallback(destroyGetProgressLoop);

// DEPRECATED
export function _DEPRECATED___GetProgress(): number {
  try {
    const st = Spicetify?.Player?.origin?._state as
      { positionAsOfTimestamp?: unknown; timestamp?: unknown; isPaused?: unknown } | undefined;
    if (!st) {
      console.error('Spicetify Player state is not available.');
      return 0;
    }

    const { positionAsOfTimestamp, timestamp, isPaused } = st;

    if (positionAsOfTimestamp == null || timestamp == null) {
      console.error('Playback state is incomplete.');
      return 0;
    }
    const pos = safeFiniteNumber(positionAsOfTimestamp);
    const ts = safeFiniteNumber(timestamp);
    if (pos === null || ts === null) return 0;

    const now = Date.now();
    if (isPaused) {
      return pos;
    } else {
      return extrapolatePosition(pos, ts, now);
    }
  } catch {
    return 0;
  }
}
