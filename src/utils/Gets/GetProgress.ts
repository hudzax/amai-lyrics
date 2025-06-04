import Global from '../../components/Global/Global';
import { SpotifyPlayer } from '../../components/Global/SpotifyPlayer';

const syncTimings = [0.05, 0.1, 0.15, 0.75];
let canSyncNonLocalTimestamp = Spicetify.Player.isPlaying()
  ? syncTimings.length
  : 0;

// Reusable synced position object to reduce allocations
const syncedPosition: {
  StartedSyncAt: number;
  Position: number;
} = {
  StartedSyncAt: 0,
  Position: 0,
};

async function getLocalPosition(startedAt: number, SpotifyPlatform: any) {
  const { position } =
    await SpotifyPlatform.PlayerAPI._contextPlayer.getPositionState({});
  return {
    StartedSyncAt: startedAt,
    Position: Number(position),
  };
}

async function getNonLocalPosition(startedAt: number, SpotifyPlatform: any) {
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

export async function requestPositionSync(): Promise<void> {
  try {
    const SpotifyPlatform = Spicetify.Platform;
    const startedAt = performance.now();
    const isLocallyPlaying = SpotifyPlatform.PlaybackAPI._isLocal;

    // Decide delay *before* async call for consistency
    const delay =
      !Spicetify.Player.isPlaying() || canSyncNonLocalTimestamp === 0
        ? 1 / 60
        : isLocallyPlaying
        ? 1 / 60
        : syncTimings[syncTimings.length - canSyncNonLocalTimestamp];

    let pos: { StartedSyncAt: any; Position: any; };
    if (isLocallyPlaying) {
      pos = await getLocalPosition(startedAt, SpotifyPlatform);
    } else {
      pos = await getNonLocalPosition(startedAt, SpotifyPlatform);
    }

    // Update the existing object to reduce allocations
    syncedPosition.StartedSyncAt = pos.StartedSyncAt;
    syncedPosition.Position = pos.Position;

    setTimeout(requestPositionSync, delay * 1000);
  } catch (error) {
    console.error('Sync Position: Fail, More Details:', error);
  }
}

// Function to get the current progress
export default function GetProgress() {
  // Fast path: no sync data, fallback
  if (!syncedPosition.StartedSyncAt && !syncedPosition.Position) {
    if (SpotifyPlayer?._DEPRECATED_?.GetTrackPosition) {
      return SpotifyPlayer._DEPRECATED_.GetTrackPosition();
    }
    console.warn('[GetProgress] Synced Position: Skip, Returning 0');
    return 0;
  }

  const platform = Spicetify.Platform;
  const isPlaying = Spicetify.Player.isPlaying();
  const isLocal = platform.PlaybackAPI._isLocal;

  const startedAt = syncedPosition.StartedSyncAt;
  const basePosition = syncedPosition.Position;
  const delta = performance.now() - startedAt;

  if (!isPlaying) {
    return platform.PlayerAPI._state.positionAsOfTimestamp;
  }

  const calculated = basePosition + delta;
  return isLocal
    ? calculated
    : calculated + Global.NonLocalTimeOffset;
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
