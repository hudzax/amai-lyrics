import { SpotifyPlayer } from '../components/Global/SpotifyPlayer';
import { IntervalManager } from '../utils/IntervalManager';
import Global from '../components/Global/Global';
import Session from '../components/Global/Session';
import Whentil from '../utils/Whentil';

export class EventManager {
  private static button: Spicetify.Playbar.Button;

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
    new IntervalManager(0.5, () => {
      const pos = SpotifyPlayer.GetTrackPosition();
      if (pos !== lastPosition) {
        Global.Event.evoke('playback:position', pos);
      }
      lastPosition = pos;
    }).Start();
  }

  private static setupPlayerEvents() {
    // Play/pause events
    Spicetify.Player.addEventListener('onplaypause', (e) => {
      SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
      Global.Event.evoke('playback:playpause', e);
    });

    Spicetify.Player.addEventListener('onprogress', (e) =>
      Global.Event.evoke('playback:progress', e),
    );

    Spicetify.Player.addEventListener('songchange', (e) => {
      Global.Event.evoke('playback:songchange', e);
      this.updatePlayerStatesOnSongChange();
    });

    // Repeat and shuffle event listeners
    Spicetify.Player.addEventListener('repeat_mode_changed', () => {
      const LoopState = Spicetify.Player.getRepeat();
      const LoopType = LoopState === 1 ? 'context' : LoopState === 2 ? 'track' : 'none';
      if (SpotifyPlayer.LoopType !== LoopType) {
        SpotifyPlayer.LoopType = LoopType;
        Global.Event.evoke('playback:loop', LoopType);
      }
    });

    Spicetify.Player.addEventListener('shuffle_changed', () => {
      const shuffleState = Spicetify.Player.origin._state.shuffle;
      const smartShuffleState = Spicetify.Player.origin._state.smartShuffle;
      const ShuffleType = smartShuffleState ? 'smart' : shuffleState ? 'normal' : 'none';
      if (SpotifyPlayer.ShuffleType !== ShuffleType) {
        SpotifyPlayer.ShuffleType = ShuffleType;
        Global.Event.evoke('playback:shuffle', ShuffleType);
      }
    });
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
    Whentil.When(
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

    Spicetify.Platform.History.listen(Session.RecordNavigation);
    Session.RecordNavigation(Spicetify.Platform.History.location);
  }
}
