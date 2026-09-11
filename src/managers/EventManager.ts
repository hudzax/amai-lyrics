import { SpotifyPlayer } from '../components/Global/SpotifyPlayer';
import { IntervalManager } from '../utils/IntervalManager';
import { reanchorPosition, requestPositionSync } from '../utils/Gets/GetProgress';
import { deriveLoopType, deriveShuffleType } from '../utils/playerState';
import Global from '../components/Global/Global';
import Session from '../components/Global/Session';
import Whentil from '../utils/Whentil';
import lifecycle from '../utils/lifecycle';
import Fullscreen from '../components/Utils/Fullscreen';
import { IsPlaying as GetIsPlayingLive } from '../utils/Addons';

export class EventManager {
  private static safeGetRepeat(): number {
    try {
      if (typeof Spicetify?.Player?.getRepeat === 'function') {
        const v = Spicetify.Player.getRepeat() as unknown;
        if (typeof v === 'number' && Number.isFinite(v)) return v;
      }
    } catch {
      // fall through
    }
    try {
      const v = (Spicetify?.Player?.data as { repeat?: unknown } | undefined)?.repeat;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    } catch {
      // ignore
    }
    return 0;
  }

  private static safeGetShuffle(): { shuffle: boolean; smartShuffle: boolean } {
    try {
      // SAFETY: origin._state is untyped runtime state; booleans validated before use
      const st = (Spicetify?.Player as unknown as { origin?: { _state?: Record<string, unknown> } })
        ?.origin?._state;
      if (st && typeof st === 'object') {
        const shuffle = st['shuffle'];
        const smartShuffle = st['smartShuffle'];
        return {
          shuffle: shuffle === true,
          smartShuffle: smartShuffle === true,
        };
      }
    } catch {
      // fall through
    }
    try {
      const data = Spicetify?.Player?.data as { shuffle?: unknown } | undefined;
      return { shuffle: data?.shuffle === true, smartShuffle: false };
    } catch {
      return { shuffle: false, smartShuffle: false };
    }
  }

  private static resolveIsPaused(e: unknown): boolean | null {
    try {
      const evt = e as { data?: { isPaused?: unknown }; isPaused?: unknown } | null | undefined;
      const fromData = evt?.data?.isPaused;
      if (typeof fromData === 'boolean') return fromData;
      const direct = evt?.isPaused;
      if (typeof direct === 'boolean') return direct;
    } catch {
      // fall through to live query
    }
    // Payload shape changed after a client update — fall back to live state.
    try {
      if (typeof Spicetify?.Player?.isPlaying === 'function') {
        return !Spicetify.Player.isPlaying();
      }
    } catch {
      // ignore
    }
    try {
      const paused = (Spicetify?.Player?.data as { isPaused?: unknown } | undefined)?.isPaused;
      if (typeof paused === 'boolean') return paused;
    } catch {
      // ignore
    }
    return null;
  }

  // Stored handler references so they can be removed on teardown.
  private static onPlayPause = (e: { data?: { isPaused?: boolean } }) => {
    const isPaused = EventManager.resolveIsPaused(e);
    if (isPaused !== null) {
      SpotifyPlayer.IsPlaying = !isPaused;
    } else {
      // Unknown payload and unreadable live state — keep last known value.
      try {
        SpotifyPlayer.IsPlaying = GetIsPlayingLive();
      } catch {
        // keep existing value
      }
    }
    // Resuming after a pause: the position anchor was frozen during the pause, so
    // GetProgress() would otherwise keep adding the elapsed pause duration to the
    // stale anchor. Re-anchor locally and instantly (race-free) to the platform's
    // current position, then trigger an exact RPC sync to refine it.
    if (isPaused === false) {
      try {
        reanchorPosition();
      } catch {
        // ignore
      }
      try {
        requestPositionSync();
      } catch {
        // ignore
      }
    }
    Global.Event.evoke('playback:playpause', e);
  };

  private static onProgress = (e: unknown) => {
    Global.Event.evoke('playback:progress', e);
  };

  private static onSongChange = (e: unknown) => {
    Global.Event.evoke('playback:songchange', e);
    EventManager.updatePlayerStatesOnSongChange();
  };

  private static onRepeatModeChanged = () => {
    const LoopType = deriveLoopType(EventManager.safeGetRepeat());
    if (SpotifyPlayer.LoopType !== LoopType) {
      SpotifyPlayer.LoopType = LoopType;
      Global.Event.evoke('playback:loop', LoopType);
    }
  };

  private static onShuffleChanged = () => {
    const { shuffle, smartShuffle } = EventManager.safeGetShuffle();
    const ShuffleType = deriveShuffleType(shuffle, smartShuffle);
    if (SpotifyPlayer.ShuffleType !== ShuffleType) {
      SpotifyPlayer.ShuffleType = ShuffleType;
      Global.Event.evoke('playback:shuffle', ShuffleType);
    }
  };

  public static initialize() {
    this.setupPlayerStateEvents();
    this.setupNavigationEvents();
    this.setupPlayerEvents();
  }

  private static setupPlayerStateEvents() {
    // Initialize LoopType and ShuffleType once at the start
    SpotifyPlayer.LoopType = deriveLoopType(EventManager.safeGetRepeat());
    Global.Event.evoke('playback:loop', SpotifyPlayer.LoopType);

    const { shuffle, smartShuffle } = EventManager.safeGetShuffle();
    SpotifyPlayer.ShuffleType = deriveShuffleType(shuffle, smartShuffle);
    Global.Event.evoke('playback:shuffle', SpotifyPlayer.ShuffleType);

    // Position tracking - only needed for fullscreen progress bar. Skip tick entirely
    // when fullscreen is closed so we don't wake the main thread every 500ms for nothing
    // (the synced GetProgress loop still provides positions for lyrics/playbar when needed).
    let lastPosition = 0;
    const positionInterval = new IntervalManager(0.5, () => {
      if (!Fullscreen.IsOpen) return;
      const pos = SpotifyPlayer.GetTrackPosition();
      if (pos !== lastPosition) {
        Global.Event.evoke('playback:position', pos);
      }
      lastPosition = pos;
    });
    positionInterval.Start();
    lifecycle.trackInterval(positionInterval);
  }

  private static setupPlayerEvents() {
    lifecycle.trackPlayerEvent('onplaypause', EventManager.onPlayPause);
    lifecycle.trackPlayerEvent('onprogress', EventManager.onProgress);
    lifecycle.trackPlayerEvent('songchange', EventManager.onSongChange);
    lifecycle.trackPlayerEvent('repeat_mode_changed', EventManager.onRepeatModeChanged);
    lifecycle.trackPlayerEvent('shuffle_changed', EventManager.onShuffleChanged);
  }

  private static updatePlayerStatesOnSongChange() {
    // Update loop and shuffle states on song change as they can be part of context
    const newLoopType = deriveLoopType(EventManager.safeGetRepeat());
    if (SpotifyPlayer.LoopType !== newLoopType) {
      SpotifyPlayer.LoopType = newLoopType;
      Global.Event.evoke('playback:loop', newLoopType);
    }

    const { shuffle, smartShuffle } = EventManager.safeGetShuffle();
    const newShuffleType = deriveShuffleType(shuffle, smartShuffle);
    if (SpotifyPlayer.ShuffleType !== newShuffleType) {
      SpotifyPlayer.ShuffleType = newShuffleType;
      Global.Event.evoke('playback:shuffle', newShuffleType);
    }
  }

  private static setupNavigationEvents() {
    const pageContainerWhen = Whentil.When(
      () =>
        document.querySelector(
          '.Root__main-view .main-view-container div[data-overlayscrollbars-viewport]',
        ),
      () => {
        Global.Event.evoke(
          'pagecontainer:available',
          document.querySelector(
            '.Root__main-view .main-view-container div[data-overlayscrollbars-viewport]',
          ),
        );
      },
    );
    lifecycle.trackWhentil(pageContainerWhen);

    const unsubscribe = Spicetify.Platform.History.listen(Session.RecordNavigation);
    lifecycle.trackHistory(unsubscribe);
    Session.RecordNavigation(Spicetify.Platform.History.location);
  }
}
