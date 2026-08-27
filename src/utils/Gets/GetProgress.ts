import Global from '../../components/Global/Global';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';
import lifecycle from '../lifecycle';

interface SpotifyPlatformType {
  PlayerAPI: {
    _contextPlayer: {
      getPositionState: (args: Record<string, never>) => Promise<{ position: number }>;
      resume: (args: Record<string, never>) => Promise<void>;
    };
    _state: {
      positionAsOfTimestamp: number;
      timestamp: number;
    };
  };
  PlaybackAPI: {
    _isLocal: boolean;
  };
}

const syncTimings = [0.05, 0.1, 0.15, 0.75];

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

const windowRef = window as unknown as {
  __amaiGetProgressState?: GetProgressState;
  __amaiGetProgressLifecycleTracked?: boolean;
};

const state: GetProgressState =
  windowRef.__amaiGetProgressState ??
  (windowRef.__amaiGetProgressState = {
    canSyncNonLocalTimestamp: Spicetify.Player.isPlaying() ? syncTimings.length : 0,
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
if ((state as unknown as { loopTimeoutId?: unknown }).loopTimeoutId === undefined) {
  (state as unknown as { loopTimeoutId: number | null }).loopTimeoutId = null;
}
if ((state as unknown as { teardownRequested?: unknown }).teardownRequested === undefined) {
  (state as unknown as { teardownRequested: boolean }).teardownRequested = false;
}

const syncedPosition = state.syncedPosition;

async function getLocalPosition(startedAt: number, SpotifyPlatform: SpotifyPlatformType) {
  const { position } = await SpotifyPlatform.PlayerAPI._contextPlayer.getPositionState({});
  return {
    StartedSyncAt: startedAt,
    Position: Number(position),
  };
}

async function getNonLocalPosition(startedAt: number, SpotifyPlatform: SpotifyPlatformType) {
  if (state.canSyncNonLocalTimestamp > 0) {
    await SpotifyPlatform.PlayerAPI._contextPlayer.resume({});
  }
  state.canSyncNonLocalTimestamp = Math.max(0, state.canSyncNonLocalTimestamp - 1);
  return {
    StartedSyncAt: startedAt,
    Position:
      SpotifyPlatform.PlayerAPI._state.positionAsOfTimestamp +
      (Date.now() - SpotifyPlatform.PlayerAPI._state.timestamp),
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
  windowRef.__amaiGetProgressLifecycleTracked = false;
}

async function doSync(): Promise<void> {
  const SpotifyPlatform = Spicetify.Platform;
  const startedAt = performance.now();
  const isLocallyPlaying = SpotifyPlatform.PlaybackAPI._isLocal;

  let pos: { StartedSyncAt: number; Position: number };
  if (isLocallyPlaying) {
    pos = await getLocalPosition(startedAt, SpotifyPlatform);
  } else {
    pos = await getNonLocalPosition(startedAt, SpotifyPlatform);
  }

  // Update the shared object to reduce allocations and keep hot-reload clones in sync.
  state.syncedPosition.StartedSyncAt = pos.StartedSyncAt;
  state.syncedPosition.Position = pos.Position;
  // Also sync local alias if state was swapped.
  syncedPosition.StartedSyncAt = pos.StartedSyncAt;
  syncedPosition.Position = pos.Position;
}

async function runLoop(): Promise<void> {
  try {
    if (state.teardownRequested && state.activePositionClients === 0) return;
    const isPlaying = Spicetify.Player.isPlaying();

    // Only do the (potentially RPC-heavy) anchor sync while something actually
    // needs a fresh position. Otherwise stay idle and do zero RPC work.
    if (isPlaying && (state.activePositionClients > 0 || state.syncNow)) {
      state.syncNow = false;
      await doSync();
    } else {
      state.syncNow = false;
    }

    if (state.teardownRequested && state.activePositionClients === 0) return;

    const nowPlaying = Spicetify.Player.isPlaying();
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
  state.syncedPosition.StartedSyncAt = performance.now();
  state.syncedPosition.Position = positionAsOfTimestamp + (Date.now() - timestamp);
  syncedPosition.StartedSyncAt = state.syncedPosition.StartedSyncAt;
  syncedPosition.Position = state.syncedPosition.Position;
}

// Per-frame position cache — all per-frame loops (render, scroll, playbar)
// within the same rAF tick share one position value instead of each calling
// GetProgress independently. Backed on window so hot-reload shares the entry.
const POSITION_CACHE_TTL = 15; // ms (~1 frame at 60fps)

// Function to get the current progress
export default function GetProgress() {
  const now = performance.now();
  const isPlaying = Spicetify.Player.isPlaying();
  if (
    state.cachedPosition !== null &&
    state.cachedIsPlaying === isPlaying &&
    now - state.cachedPositionTime < POSITION_CACHE_TTL
  ) {
    return state.cachedPosition;
  }

  // Fast path: no sync data, fallback
  if (!state.syncedPosition.StartedSyncAt && !state.syncedPosition.Position) {
    if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
      return SpotifyPlayer._DEPRECATED_.GetTrackPosition();
    }
    console.warn('[GetProgress] Synced Position: Skip, Returning 0');
    return 0;
  }

  const platform = Spicetify.Platform;
  const isLocal = platform.PlaybackAPI._isLocal;

  const startedAt = state.syncedPosition.StartedSyncAt;
  const basePosition = state.syncedPosition.Position;
  const delta = performance.now() - startedAt;

  let result: number;
  if (!isPlaying) {
    result = platform.PlayerAPI._state.positionAsOfTimestamp;
  } else {
    const calculated = basePosition + delta;
    result = isLocal ? calculated : calculated + Global.NonLocalTimeOffset;
  }

  state.cachedPosition = result;
  state.cachedPositionTime = now;
  state.cachedIsPlaying = isPlaying;
  return result;
}

// Register teardown exactly once per page-load — window-persisted so hot-reload
// doesn't stack trackers. Previous instance's loop is torn down via __amaiLyricsTeardown.
if (!windowRef.__amaiGetProgressLifecycleTracked) {
  windowRef.__amaiGetProgressLifecycleTracked = true;
  lifecycle.trackCallback(destroyGetProgressLoop);
}

// DEPRECATED
export function _DEPRECATED___GetProgress() {
  const state = Spicetify?.Player?.origin?._state;
  if (!state) {
    console.error('Spicetify Player state is not available.');
    return 0;
  }

  const { positionAsOfTimestamp, timestamp, isPaused } = state;

  if (positionAsOfTimestamp == null || timestamp == null) {
    console.error('Playback state is incomplete.');
    return null;
  }

  const now = Date.now();
  if (isPaused) {
    return positionAsOfTimestamp;
  } else {
    return positionAsOfTimestamp + (now - timestamp);
  }
}
