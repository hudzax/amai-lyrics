import { SpotifyPlayer } from '../components/Global/SpotifyPlayer';
import { IntervalManager } from '../utils/IntervalManager';
import Global from '../components/Global/Global';
import Session from '../components/Global/Session';
import Whentil from '../utils/Whentil';
import lifecycle from '../utils/lifecycle';

export class EventManager {
  private static button: Spicetify.Playbar.Button;

  // Stored handler references so they can be removed on teardown.
  private static onPlayPause = (e: { data?: { isPaused?: boolean } }) => {
    SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
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
    const LoopState = Spicetify.Player.getRepeat();
    const LoopType = LoopState === 1 ? 'context' : LoopState === 2 ? 'track' : 'none';
    if (SpotifyPlayer.LoopType !== LoopType) {
      SpotifyPlayer.LoopType = LoopType;
      Global.Event.evoke('playback:loop', LoopType);
    }
  };

  private static onShuffleChanged = () => {
    const shuffleState = Spicetify.Player.origin._state.shuffle;
    const smartShuffleState = Spicetify.Player.origin._state.smartShuffle;
    const ShuffleType = smartShuffleState ? 'smart' : shuffleState ? 'normal' : 'none';
    if (SpotifyPlayer.ShuffleType !== ShuffleType) {
      SpotifyPlayer.ShuffleType = ShuffleType;
      Global.Event.evoke('playback:shuffle', ShuffleType);
    }
  };

  public static initialize(button: Spicetify.Playbar.Button) {
    this.button = button;
    this.setupPlayerStateEvents();
    this.setupNavigationEvents();
    this.setupPlayerEvents();
  }

  private static setupPlayerStateEvents() {
    // Initialize LoopType and ShuffleType once at the start
    const initialLoopState = Spicetify.Player.getRepeat();
    SpotifyPlayer.LoopType =
      initialLoopState === 1 ? 'context' : initialLoopState === 2 ? 'track' : 'none';
    Global.Event.evoke('playback:loop', SpotifyPlayer.LoopType);

    const initialShuffleState = Spicetify.Player.origin._state.shuffle;
    const initialSmartShuffleState = Spicetify.Player.origin._state.smartShuffle;
    SpotifyPlayer.ShuffleType = initialSmartShuffleState
      ? 'smart'
      : initialShuffleState
        ? 'normal'
        : 'none';
    Global.Event.evoke('playback:shuffle', SpotifyPlayer.ShuffleType);

    // Position tracking
    let lastPosition = 0;
    const positionInterval = new IntervalManager(0.5, () => {
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
    const currentLoopState = Spicetify.Player.getRepeat();
    const newLoopType =
      currentLoopState === 1 ? 'context' : currentLoopState === 2 ? 'track' : 'none';
    if (SpotifyPlayer.LoopType !== newLoopType) {
      SpotifyPlayer.LoopType = newLoopType;
      Global.Event.evoke('playback:loop', newLoopType);
    }

    const currentShuffleState = Spicetify.Player.origin._state.shuffle;
    const currentSmartShuffleState = Spicetify.Player.origin._state.smartShuffle;
    const newShuffleType = currentSmartShuffleState
      ? 'smart'
      : currentShuffleState
        ? 'normal'
        : 'none';
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
