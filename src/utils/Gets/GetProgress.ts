import Global from '../../components/Global/Global';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';

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
let canSyncNonLocalTimestamp = Spicetify.Player.isPlaying() ? syncTimings.length : 0;

// Reusable synced position object to reduce allocations
const syncedPosition: {
  StartedSyncAt: number;
  Position: number;
} = {
  StartedSyncAt: 0,
  Position: 0,
};

async function getLocalPosition(startedAt: number, SpotifyPlatform: SpotifyPlatformType) {
  const { position } = await SpotifyPlatform.PlayerAPI._contextPlayer.getPositionState({});
  return {
    StartedSyncAt: startedAt,
    Position: Number(position),
  };
}

async function getNonLocalPosition(startedAt: number, SpotifyPlatform: SpotifyPlatformType) {
  if (canSyncNonLocalTimestamp > 0) {
    await SpotifyPlatform.PlayerAPI._contextPlayer.resume({});
  }
  canSyncNonLocalTimestamp = Math.max(0, canSyncNonLocalTimestamp - 1);
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
let activePositionClients = 0;
let syncNow = false;
let loopScheduled = false;

/**
 * Registers a consumer of the playback position and returns a release function.
 * The sync loop only runs its (potentially RPC-heavy) anchor refresh while at
 * least one consumer is active; otherwise it idles cheaply. On the first
 * registration of the session it requests an immediate sync so the very first
 * frame uses a fresh anchor.
 */
export function requestPositionTracking(): () => void {
  activePositionClients++;
  if (activePositionClients === 1) {
    syncNow = true;
    scheduleLoop(0);
  }
  return () => {
    activePositionClients = Math.max(0, activePositionClients - 1);
  };
}

function scheduleLoop(delay: number): void {
  if (loopScheduled) return;
  loopScheduled = true;
  window.setTimeout(() => {
    loopScheduled = false;
    void runLoop();
  }, delay);
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

  // Update the existing object to reduce allocations
  syncedPosition.StartedSyncAt = pos.StartedSyncAt;
  syncedPosition.Position = pos.Position;
}

async function runLoop(): Promise<void> {
  try {
    const isPlaying = Spicetify.Player.isPlaying();

    // Only do the (potentially RPC-heavy) anchor sync while something actually
    // needs a fresh position. Otherwise stay idle and do zero RPC work.
    if (isPlaying && (activePositionClients > 0 || syncNow)) {
      syncNow = false;
      await doSync();
    } else {
      syncNow = false;
    }

    const nowPlaying = Spicetify.Player.isPlaying();
    // Paused: stay in a cheap idle poll, no getPositionState/resume calls.
    if (!nowPlaying) {
      scheduleLoop(PAUSED_POLL_MS);
    } else if (activePositionClients > 0) {
      scheduleLoop(ACTIVE_SYNC_MS);
    } else {
      scheduleLoop(IDLE_HEARTBEAT_MS);
    }
  } catch (error) {
    console.error('Sync Position: Fail, More Details:', error);
    // Keep polling on error so we recover as soon as playback state allows.
    scheduleLoop(PAUSED_POLL_MS);
  }
}

export function requestPositionSync(): void {
  scheduleLoop(0);
}

// Per-frame position cache — all per-frame loops (render, scroll, playbar)
// within the same rAF tick share one position value instead of each calling
// GetProgress independently.
let cachedPosition: number | null = null;
let cachedPositionTime = 0;
let cachedIsPlaying: boolean | null = null;
const POSITION_CACHE_TTL = 15; // ms (~1 frame at 60fps)

// Function to get the current progress
export default function GetProgress() {
  const now = performance.now();
  const isPlaying = Spicetify.Player.isPlaying();
  if (
    cachedPosition !== null &&
    cachedIsPlaying === isPlaying &&
    now - cachedPositionTime < POSITION_CACHE_TTL
  ) {
    return cachedPosition;
  }

  // Fast path: no sync data, fallback
  if (!syncedPosition.StartedSyncAt && !syncedPosition.Position) {
    if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
      return SpotifyPlayer._DEPRECATED_.GetTrackPosition();
    }
    console.warn('[GetProgress] Synced Position: Skip, Returning 0');
    return 0;
  }

  const platform = Spicetify.Platform;
  const isLocal = platform.PlaybackAPI._isLocal;

  const startedAt = syncedPosition.StartedSyncAt;
  const basePosition = syncedPosition.Position;
  const delta = performance.now() - startedAt;

  let result: number;
  if (!isPlaying) {
    result = platform.PlayerAPI._state.positionAsOfTimestamp;
  } else {
    const calculated = basePosition + delta;
    result = isLocal ? calculated : calculated + Global.NonLocalTimeOffset;
  }

  cachedPosition = result;
  cachedPositionTime = now;
  cachedIsPlaying = isPlaying;
  return result;
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
