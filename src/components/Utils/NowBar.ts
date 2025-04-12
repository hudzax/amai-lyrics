import { SongProgressBar } from './../../utils/Lyrics/SongProgressBar';
import storage from '../../utils/storage';
import Whentil from '../../utils/Whentil';
import Global from '../Global/Global';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { Tooltips } from '../Pages/PageView';
import { Icons } from '../Styling/Icons';
import Fullscreen from './Fullscreen';

/**
 * NowBar component for displaying and controlling the current playback
 * Manages playback controls, progress bar, and UI state
 */

// Define types for better type safety
interface PlaybackControlsInstance {
  Apply: () => void;
  CleanUp: () => void;
  GetElement: () => HTMLElement;
}

interface SongProgressBarInstance {
  Apply: () => void;
  CleanUp: () => void;
  GetElement: () => HTMLElement;
}

// Track instances of components for cleanup and state management
let ActivePlaybackControlsInstance: PlaybackControlsInstance | null = null;
const ActiveSongProgressBarInstance_Map = new Map<string, any>();
let ActiveSetupSongProgressBarInstance: SongProgressBarInstance | null = null;

// Note: Marquee functionality has been removed as it's not currently used
// If text scrolling is needed in the future, consider using CSS animations or a library

function OpenNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  UpdateNowBar(true);
  NowBar.classList.add('Active');
  storage.set('IsNowBarOpen', 'true');

  if (Fullscreen.IsOpen) {
    const MediaBox = document.querySelector(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
    );

    if (!MediaBox) return;

    // Clear any existing controls before adding new ones
    const existingAlbumData = MediaBox.querySelector('.AlbumData');
    if (existingAlbumData) {
      MediaBox.removeChild(existingAlbumData);
    }

    const existingPlaybackControls =
      MediaBox.querySelector('.PlaybackControls');
    if (existingPlaybackControls) {
      MediaBox.removeChild(existingPlaybackControls);
    }

    // Let's Apply more data into the fullscreen mode.
    {
      const AppendQueue = [];
      {
        const AlbumNameElement = document.createElement('div');
        AlbumNameElement.classList.add('AlbumData');
        AlbumNameElement.innerHTML = `<span>${SpotifyPlayer.GetAlbumName()}</span>`;
        /* AlbumNameElement.classList.add("marqueeify");
                AlbumNameElement.setAttribute("marquee-base-width", "22cqw"); */
        AppendQueue.push(AlbumNameElement);
      }

      const SetupPlaybackControls = () => {
        const ControlsElement = document.createElement('div');
        ControlsElement.classList.add('PlaybackControls');
        ControlsElement.innerHTML = `
                    <div class="PlaybackControl ShuffleToggle">
                        ${Icons.Shuffle} 
                    </div>
                    ${Icons.PrevTrack}
                    <div class="PlaybackControl PlayStateToggle ${
                      SpotifyPlayer.IsPlaying ? 'Playing' : 'Paused'
                    }">
                        ${SpotifyPlayer.IsPlaying ? Icons.Pause : Icons.Play}
                    </div>
                    ${Icons.NextTrack}
                    <div class="PlaybackControl LoopToggle">
                        ${
                          SpotifyPlayer.LoopType === 'track'
                            ? Icons.LoopTrack
                            : Icons.Loop
                        }
                    </div>
                `;

        if (SpotifyPlayer.LoopType !== 'none') {
          ControlsElement.querySelector('.LoopToggle').classList.add('Enabled');
          ControlsElement.querySelector<HTMLElement>(
            '.LoopToggle svg',
          ).style.filter = 'drop-shadow(0 0 5px white)';
        }

        if (SpotifyPlayer.ShuffleType !== 'none') {
          ControlsElement.querySelector('.ShuffleToggle').classList.add(
            'Enabled',
          );
          ControlsElement.querySelector<HTMLElement>(
            '.ShuffleToggle svg',
          ).style.filter = 'drop-shadow(0 0 5px white)';
        }

        // Store event handlers so they can be removed later
        const eventHandlers = {
          pressHandlers: new Map(),
          releaseHandlers: new Map(),
          clickHandlers: new Map(),
        };

        // Find all playback controls
        const playbackControls =
          ControlsElement.querySelectorAll('.PlaybackControl');

        // Add event listeners to each control with named functions
        playbackControls.forEach((control) => {
          // Create handlers for this specific control
          const pressHandler = () => {
            control.classList.add('Pressed');
          };

          const releaseHandler = () => {
            control.classList.remove('Pressed');
          };

          // Store handlers in the Map with the control as the key
          eventHandlers.pressHandlers.set(control, pressHandler);
          eventHandlers.releaseHandlers.set(control, releaseHandler);

          // Add event listeners
          control.addEventListener('mousedown', pressHandler);
          control.addEventListener('touchstart', pressHandler);

          control.addEventListener('mouseup', releaseHandler);
          control.addEventListener('mouseleave', releaseHandler);
          control.addEventListener('touchend', releaseHandler);
        });

        const PlayPauseControl =
          ControlsElement.querySelector('.PlayStateToggle');
        const PrevTrackControl = ControlsElement.querySelector('.PrevTrack');
        const NextTrackControl = ControlsElement.querySelector('.NextTrack');
        const ShuffleControl = ControlsElement.querySelector('.ShuffleToggle');
        const LoopControl = ControlsElement.querySelector('.LoopToggle');

        // Create named handlers for click events
        const playPauseHandler = () => {
          const playSvg = PlayPauseControl.querySelector('svg');

          if (SpotifyPlayer.IsPlaying) {
            // Update state immediately before API call
            SpotifyPlayer.IsPlaying = false;
            SpotifyPlayer.Pause();

            // Immediately update UI to reflect the change
            PlayPauseControl.classList.remove('Playing');
            PlayPauseControl.classList.add('Paused');
            if (playSvg) {
              playSvg.innerHTML = Icons.Play;
            }
          } else {
            // Update state immediately before API call
            SpotifyPlayer.IsPlaying = true;
            SpotifyPlayer.Play();

            // Immediately update UI to reflect the change
            PlayPauseControl.classList.remove('Paused');
            PlayPauseControl.classList.add('Playing');
            if (playSvg) {
              playSvg.innerHTML = Icons.Pause;
            }
          }
        };

        const prevTrackHandler = () => {
          SpotifyPlayer.Skip.Prev();
        };

        const nextTrackHandler = () => {
          SpotifyPlayer.Skip.Next();
        };

        const shuffleHandler = () => {
          if (SpotifyPlayer.ShuffleType === 'none') {
            SpotifyPlayer.ShuffleType = 'normal';
            ShuffleControl.classList.add('Enabled');
            // Add visual feedback with drop shadow
            const shuffleSvg = ShuffleControl.querySelector('svg');
            if (shuffleSvg) {
              shuffleSvg.style.filter = 'drop-shadow(0 0 5px white)';
            }
            Spicetify.Player.setShuffle(true);
          } else if (SpotifyPlayer.ShuffleType === 'normal') {
            SpotifyPlayer.ShuffleType = 'none';
            ShuffleControl.classList.remove('Enabled');
            // Remove visual feedback
            const shuffleSvg = ShuffleControl.querySelector('svg');
            if (shuffleSvg) {
              shuffleSvg.style.filter = '';
            }
            Spicetify.Player.setShuffle(false);
          }
        };

        const loopHandler = () => {
          const loopSvg = LoopControl.querySelector('svg');

          if (SpotifyPlayer.LoopType === 'none') {
            // Change to context repeat
            SpotifyPlayer.LoopType = 'context';
            Spicetify.Player.setRepeat(1);

            // Update UI
            LoopControl.classList.add('Enabled');
            if (loopSvg) {
              loopSvg.innerHTML = Icons.Loop;
              loopSvg.style.filter = 'drop-shadow(0 0 5px white)';
            }
          } else if (SpotifyPlayer.LoopType === 'context') {
            // Change to track repeat
            SpotifyPlayer.LoopType = 'track';
            Spicetify.Player.setRepeat(2);

            // Update UI
            if (loopSvg) {
              loopSvg.innerHTML = Icons.LoopTrack;
              loopSvg.style.filter = 'drop-shadow(0 0 5px white)';
            }
          } else if (SpotifyPlayer.LoopType === 'track') {
            // Change to no repeat
            SpotifyPlayer.LoopType = 'none';
            Spicetify.Player.setRepeat(0);

            // Update UI
            LoopControl.classList.remove('Enabled');
            if (loopSvg) {
              loopSvg.innerHTML = Icons.Loop;
              loopSvg.style.filter = '';
            }
          }
        };

        // Store click handlers
        eventHandlers.clickHandlers.set(PlayPauseControl, playPauseHandler);
        eventHandlers.clickHandlers.set(PrevTrackControl, prevTrackHandler);
        eventHandlers.clickHandlers.set(NextTrackControl, nextTrackHandler);
        eventHandlers.clickHandlers.set(ShuffleControl, shuffleHandler);
        eventHandlers.clickHandlers.set(LoopControl, loopHandler);

        // Add click event listeners
        PlayPauseControl.addEventListener('click', playPauseHandler);
        PrevTrackControl.addEventListener('click', prevTrackHandler);
        NextTrackControl.addEventListener('click', nextTrackHandler);
        ShuffleControl.addEventListener('click', shuffleHandler);
        LoopControl.addEventListener('click', loopHandler);

        // Create and return a cleanup function
        const cleanup = () => {
          // Remove press/release handlers
          playbackControls.forEach((control) => {
            const pressHandler = eventHandlers.pressHandlers.get(control);
            const releaseHandler = eventHandlers.releaseHandlers.get(control);

            control.removeEventListener('mousedown', pressHandler);
            control.removeEventListener('touchstart', pressHandler);

            control.removeEventListener('mouseup', releaseHandler);
            control.removeEventListener('mouseleave', releaseHandler);
            control.removeEventListener('touchend', releaseHandler);
          });

          // Remove click handlers
          PlayPauseControl.removeEventListener(
            'click',
            eventHandlers.clickHandlers.get(PlayPauseControl),
          );
          PrevTrackControl.removeEventListener(
            'click',
            eventHandlers.clickHandlers.get(PrevTrackControl),
          );
          NextTrackControl.removeEventListener(
            'click',
            eventHandlers.clickHandlers.get(NextTrackControl),
          );
          ShuffleControl.removeEventListener(
            'click',
            eventHandlers.clickHandlers.get(ShuffleControl),
          );
          LoopControl.removeEventListener(
            'click',
            eventHandlers.clickHandlers.get(LoopControl),
          );

          // Clear the maps
          eventHandlers.pressHandlers.clear();
          eventHandlers.releaseHandlers.clear();
          eventHandlers.clickHandlers.clear();

          // Remove the controls element from DOM if it exists
          if (ControlsElement.parentNode) {
            ControlsElement.parentNode.removeChild(ControlsElement);
          }
        };

        return {
          Apply: () => {
            AppendQueue.push(ControlsElement);
          },
          CleanUp: cleanup,
          GetElement: () => ControlsElement,
        };
      };

      const SetupSongProgressBar = () => {
        const songProgressBar = new SongProgressBar();
        ActiveSongProgressBarInstance_Map.set(
          'SongProgressBar_ClassInstance',
          songProgressBar,
        );

        // Update initial values
        songProgressBar.Update({
          duration: SpotifyPlayer.GetTrackDuration() ?? 0,
          position: SpotifyPlayer.GetTrackPosition() ?? 0,
        });

        const TimelineElem = document.createElement('div');
        ActiveSongProgressBarInstance_Map.set('TimeLineElement', TimelineElem);
        TimelineElem.classList.add('Timeline');
        TimelineElem.innerHTML = `
                    <span class="Time Position">${
                      songProgressBar.GetFormattedPosition() ?? '0:00'
                    }</span>
                    <div class="SliderBar" style="--SliderProgress: ${
                      songProgressBar.GetProgressPercentage() ?? 0
                    }">
                        <div class="Handle"></div>
                    </div>
                    <span class="Time Duration">${
                      songProgressBar.GetFormattedDuration() ?? '0:00'
                    }</span>
                `;

        const SliderBar = TimelineElem.querySelector<HTMLElement>('.SliderBar');
        if (!SliderBar) {
          console.error('Could not find SliderBar element');
          return null;
        }

        const updateTimelineState = (e = null) => {
          const PositionElem =
            TimelineElem.querySelector<HTMLElement>('.Time.Position');
          const DurationElem =
            TimelineElem.querySelector<HTMLElement>('.Time.Duration');

          if (!PositionElem || !DurationElem || !SliderBar) {
            console.error('Missing required elements for timeline update');
            return;
          }

          // Get the current position - handle different input types
          let currentPosition;
          if (e === null) {
            // Normal update - get current position
            currentPosition = SpotifyPlayer.GetTrackPosition();
          } else if (typeof e === 'number') {
            // Direct position value passed
            currentPosition = e;
          } else if (e && e.data && typeof e.data === 'number') {
            // Event from Spicetify with position in data
            currentPosition = e.data;
          } else {
            // Fallback
            currentPosition = SpotifyPlayer.GetTrackPosition();
          }

          // Update the progress bar state
          songProgressBar.Update({
            duration: SpotifyPlayer.GetTrackDuration() ?? 0,
            position: currentPosition ?? 0,
          });

          const sliderPercentage = songProgressBar.GetProgressPercentage();
          const formattedPosition = songProgressBar.GetFormattedPosition();
          const formattedDuration = songProgressBar.GetFormattedDuration();

          // Update the UI
          SliderBar.style.setProperty(
            '--SliderProgress',
            sliderPercentage.toString(),
          );
          DurationElem.textContent = formattedDuration;
          PositionElem.textContent = formattedPosition;
        };

        const sliderBarHandler = (event: MouseEvent) => {
          // Only process clicks when in fullscreen mode
          if (!Fullscreen.IsOpen) return;

          // Direct use of the SliderBar element for click calculation
          const positionMs = songProgressBar.CalculatePositionFromClick({
            sliderBar: SliderBar,
            event: event,
          });

          // Use the calculated position (in milliseconds)
          if (typeof SpotifyPlayer !== 'undefined' && SpotifyPlayer.Seek) {
            SpotifyPlayer.Seek(positionMs);

            // Update our tracking variables for interpolation
            ActiveSongProgressBarInstance_Map.set(
              'lastKnownPosition',
              positionMs,
            );
            ActiveSongProgressBarInstance_Map.set(
              'lastUpdateTime',
              performance.now(),
            );

            // Immediately update the UI to reflect the new position
            songProgressBar.Update({
              duration: SpotifyPlayer.GetTrackDuration() ?? 0,
              position: positionMs,
            });

            // Update the UI elements
            const sliderPercentage = songProgressBar.GetProgressPercentage();
            const formattedPosition = songProgressBar.GetFormattedPosition();

            SliderBar.style.setProperty(
              '--SliderProgress',
              sliderPercentage.toString(),
            );

            const PositionElem =
              TimelineElem.querySelector<HTMLElement>('.Time.Position');
            if (PositionElem) {
              PositionElem.textContent = formattedPosition;
            }
          }
        };

        SliderBar.addEventListener('click', sliderBarHandler);

        // Run initial update
        updateTimelineState();

        // Initialize our tracking variables
        const initialPosition = SpotifyPlayer.GetTrackPosition() || 0;
        ActiveSongProgressBarInstance_Map.set(
          'lastKnownPosition',
          initialPosition,
        );
        ActiveSongProgressBarInstance_Map.set(
          'lastUpdateTime',
          performance.now(),
        );

        // Set up an interval to update the progress bar regularly with interpolation
        const updateInterval = setInterval(() => {
          if (SpotifyPlayer.IsPlaying) {
            // Get the stored values
            const lastKnownPosition =
              ActiveSongProgressBarInstance_Map.get('lastKnownPosition') || 0;
            const lastUpdateTime =
              ActiveSongProgressBarInstance_Map.get('lastUpdateTime') ||
              performance.now();

            // Calculate interpolated position based on elapsed time since last update
            const now = performance.now();
            const elapsed = now - lastUpdateTime;

            // Only get the actual position from API occasionally to avoid stuttering
            // Most of the time, calculate it based on elapsed time
            if (elapsed > 3000) {
              // Every 3 seconds, get the actual position from the API
              const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;
              ActiveSongProgressBarInstance_Map.set(
                'lastKnownPosition',
                actualPosition,
              );
              ActiveSongProgressBarInstance_Map.set('lastUpdateTime', now);
              updateTimelineState(actualPosition);
            } else {
              // Otherwise, interpolate the position based on elapsed time
              const interpolatedPosition = lastKnownPosition + elapsed;
              ActiveSongProgressBarInstance_Map.set(
                'lastInterpolationUpdate',
                now,
              );
              updateTimelineState(interpolatedPosition);
            }
          }
        }, 100); // Update very frequently for smoother animation

        ActiveSongProgressBarInstance_Map.set(
          'updateTimelineState_Function',
          updateTimelineState,
        );

        // Store the interval ID for cleanup
        ActiveSongProgressBarInstance_Map.set('updateInterval', updateInterval);

        const cleanup = () => {
          // Remove event listeners
          if (SliderBar) {
            SliderBar.removeEventListener('click', sliderBarHandler);
          }

          // Clear the update interval
          const updateInterval =
            ActiveSongProgressBarInstance_Map.get('updateInterval');
          if (updateInterval) {
            clearInterval(updateInterval);
          }

          // Clean up the progress bar instance
          const progressBar = ActiveSongProgressBarInstance_Map.get(
            'SongProgressBar_ClassInstance',
          );
          if (progressBar) {
            progressBar.Destroy();
          }

          // Remove the timeline element from DOM if it's attached
          if (TimelineElem.parentNode) {
            TimelineElem.parentNode.removeChild(TimelineElem);
          }

          // Clear the map
          ActiveSongProgressBarInstance_Map.clear();
        };

        return {
          Apply: () => {
            AppendQueue.push(TimelineElem);
          },
          GetElement: () => TimelineElem,
          CleanUp: cleanup,
        };
      };

      ActivePlaybackControlsInstance = SetupPlaybackControls();
      ActivePlaybackControlsInstance.Apply();

      ActiveSetupSongProgressBarInstance = SetupSongProgressBar();
      ActiveSetupSongProgressBarInstance.Apply();

      // Use a more reliable approach to add elements
      Whentil.When(
        () =>
          document.querySelector(
            '#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls',
          ),
        () => {
          // Ensure there's no duplicate elements before appending
          const viewControls = MediaBox.querySelector('.ViewControls');

          // Create a temporary fragment to avoid multiple reflows
          const fragment = document.createDocumentFragment();
          AppendQueue.forEach((element) => {
            fragment.appendChild(element);
          });

          // Ensure proper order - first view controls, then our custom elements
          MediaBox.innerHTML = '';
          if (viewControls) MediaBox.appendChild(viewControls);
          MediaBox.appendChild(fragment);
        },
      );
    }
  }

  const DragBox = Fullscreen.IsOpen
    ? document.querySelector(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
      )
    : document.querySelector(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
      );

  if (!DragBox) return;

  const dropZones = document.querySelectorAll(
    '#SpicyLyricsPage .ContentBox .DropZone',
  );

  DragBox.addEventListener('dragstart', (e) => {
    setTimeout(() => {
      document
        .querySelector('#SpicyLyricsPage')
        .classList.add('SomethingDragging');
      if (NowBar.classList.contains('LeftSide')) {
        dropZones.forEach((zone) => {
          if (zone.classList.contains('LeftSide')) {
            zone.classList.add('Hidden');
          } else {
            zone.classList.remove('Hidden');
          }
        });
      } else if (NowBar.classList.contains('RightSide')) {
        dropZones.forEach((zone) => {
          if (zone.classList.contains('RightSide')) {
            zone.classList.add('Hidden');
          } else {
            zone.classList.remove('Hidden');
          }
        });
      }
      DragBox.classList.add('Dragging');
    }, 0);
  });

  DragBox.addEventListener('dragend', () => {
    document
      .querySelector('#SpicyLyricsPage')
      .classList.remove('SomethingDragging');
    dropZones.forEach((zone) => zone.classList.remove('Hidden'));
    DragBox.classList.remove('Dragging');
  });

  dropZones.forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('DraggingOver');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('DraggingOver');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('DraggingOver');

      const currentClass = NowBar.classList.contains('LeftSide')
        ? 'LeftSide'
        : 'RightSide';

      const newClass = zone.classList.contains('RightSide')
        ? 'RightSide'
        : 'LeftSide';

      NowBar.classList.remove(currentClass);
      NowBar.classList.add(newClass);

      const side = zone.classList.contains('RightSide') ? 'right' : 'left';

      storage.set('NowBarSide', side);
    });
  });
}

function CleanUpActiveComponents() {
  // // console.log("Started CleanUpActiveComponents Process");
  if (ActivePlaybackControlsInstance) {
    ActivePlaybackControlsInstance?.CleanUp();
    ActivePlaybackControlsInstance = null;
    // // console.log("Cleaned up PlaybackControls instance");
  }

  if (ActiveSetupSongProgressBarInstance) {
    ActiveSetupSongProgressBarInstance?.CleanUp();
    ActiveSetupSongProgressBarInstance = null;
    // // console.log("Cleaned up SongProgressBar instance");
  }

  if (ActiveSongProgressBarInstance_Map.size > 0) {
    ActiveSongProgressBarInstance_Map?.clear();
    // // console.log("Cleared SongProgressBar instance map");
  }

  // Also remove any leftover elements
  const MediaBox = document.querySelector(
    '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
  );

  if (MediaBox) {
    const albumData = MediaBox.querySelector('.AlbumData');
    if (albumData) MediaBox.removeChild(albumData);

    const playbackControls = MediaBox.querySelector('.PlaybackControls');
    if (playbackControls) MediaBox.removeChild(playbackControls);

    const songProgressBar = MediaBox.querySelector('.SongProgressBar');
    if (songProgressBar) MediaBox.removeChild(songProgressBar);

    // // console.log("Cleared elements from DOM");
  }

  // // console.log("Finished CleanUpActiveComponents Process");
}

function CloseNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  NowBar.classList.remove('Active');
  storage.set('IsNowBarOpen', 'false');
  CleanUpActiveComponents();
}

function ToggleNowBar() {
  const IsNowBarOpen = storage.get('IsNowBarOpen');
  if (IsNowBarOpen === 'true') {
    CloseNowBar();
  } else {
    OpenNowBar();
  }
}

function Session_OpenNowBar() {
  const IsNowBarOpen = storage.get('IsNowBarOpen');
  if (IsNowBarOpen === 'true') {
    OpenNowBar();
  } else {
    CloseNowBar();
  }
}

function UpdateNowBar(force = false) {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  const ArtistsDiv = NowBar.querySelector('.Header .Metadata .Artists');
  const ArtistsSpan = NowBar.querySelector('.Header .Metadata .Artists span');
  const MediaImage = NowBar.querySelector<HTMLImageElement>(
    '.Header .MediaBox .MediaImage',
  );
  const SongNameSpan = NowBar.querySelector('.Header .Metadata .SongName span');
  const MediaBox = NowBar.querySelector('.Header .MediaBox');
  const SongName = NowBar.querySelector('.Header .Metadata .SongName');

  // Add null checks before accessing DOM elements
  if (!ArtistsDiv || !MediaBox || !SongName) {
    console.error('Required elements not found in UpdateNowBar');
    return;
  }

  ArtistsDiv.classList.add('Skeletoned');
  MediaBox.classList.add('Skeletoned');
  SongName.classList.add('Skeletoned');

  const IsNowBarOpen = storage.get('IsNowBarOpen');
  if (IsNowBarOpen == 'false' && !force) return;

  // Set artwork image
  if (MediaImage) {
    SpotifyPlayer.Artwork.Get('xl')
      .then((artwork) => {
        MediaImage.src = artwork;
        MediaBox.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to load artwork:', err);
      });
  }

  // Update song name
  if (SongNameSpan && SongName) {
    SpotifyPlayer.GetSongName()
      .then((title) => {
        SongNameSpan.textContent = title;
        SongName.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to get song name:', err);
      });
  }

  // Update artists
  if (ArtistsSpan && ArtistsDiv) {
    SpotifyPlayer.GetArtists()
      .then((artists) => {
        const JoinedArtists = SpotifyPlayer.JoinArtists(artists);
        ArtistsSpan.textContent = JoinedArtists;
        ArtistsDiv.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to get artists:', err);
      });
  }

  if (Fullscreen.IsOpen) {
    const NowBarAlbum = NowBar.querySelector<HTMLDivElement>(
      '.Header .MediaBox .AlbumData',
    );
    if (NowBarAlbum) {
      NowBarAlbum.classList.add('Skeletoned');
      const AlbumSpan = NowBarAlbum.querySelector('span');
      if (AlbumSpan) {
        AlbumSpan.textContent = SpotifyPlayer.GetAlbumName();
      }
      NowBarAlbum.classList.remove('Skeletoned');
    }
  }
}

function NowBar_SwapSides() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  const CurrentSide = storage.get('NowBarSide');
  if (CurrentSide === 'left') {
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  } else if (CurrentSide === 'right') {
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  } else {
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  }
}

function Session_NowBar_SetSide() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  const CurrentSide = storage.get('NowBarSide');
  if (CurrentSide === 'left') {
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  } else if (CurrentSide === 'right') {
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  } else {
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  }
}

function DeregisterNowBarBtn() {
  Tooltips.NowBarToggle?.destroy();
  Tooltips.NowBarToggle = null;
  const nowBarButton = document.querySelector(
    '#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle',
  );
  nowBarButton?.remove();
}

// Combined event listener for playback:playpause that handles both UI updates and interpolation state
Global.Event.listen('playback:playpause', (e) => {
  // Handle UI updates for fullscreen mode
  if (Fullscreen.IsOpen && ActivePlaybackControlsInstance) {
    const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
    const PlayPauseButton = PlaybackControls?.querySelector('.PlayStateToggle');

    if (PlayPauseButton) {
      const isPaused = e?.data?.isPaused;
      if (isPaused) {
        PlayPauseButton.classList.remove('Playing');
        PlayPauseButton.classList.add('Paused');
        const SVG = PlayPauseButton.querySelector('svg');
        if (SVG) SVG.innerHTML = Icons.Play;
      } else {
        PlayPauseButton.classList.remove('Paused');
        PlayPauseButton.classList.add('Playing');
        const SVG = PlayPauseButton.querySelector('svg');
        if (SVG) SVG.innerHTML = Icons.Pause;
      }
    }
  }

  // Handle progress bar interpolation state - only update if in fullscreen mode
  if (Fullscreen.IsOpen && ActiveSetupSongProgressBarInstance) {
    const isPaused = e?.data?.isPaused;
    const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;

    // Update our tracking variables
    ActiveSongProgressBarInstance_Map.set('lastKnownPosition', actualPosition);
    ActiveSongProgressBarInstance_Map.set('lastUpdateTime', performance.now());

    // Update UI if needed
    const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
      'updateTimelineState_Function',
    );
    if (updateTimelineState) {
      updateTimelineState(actualPosition);
    }
  }
});

Global.Event.listen('playback:loop', (e) => {
  // console.log("Loop", e);
  if (Fullscreen.IsOpen) {
    // console.log("Fullscreen Opened");
    if (ActivePlaybackControlsInstance) {
      // console.log("ActivePlaybackControlsInstance - Exists");
      const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
      const LoopButton = PlaybackControls.querySelector('.LoopToggle');
      const SVG = LoopButton.querySelector('svg');

      // First reset any inline styles
      SVG.style.filter = '';

      // Update loop icon
      if (e === 'track') {
        SVG.innerHTML = Icons.LoopTrack;
      } else {
        SVG.innerHTML = Icons.Loop;
      }

      // Toggle class for brightness
      if (e !== 'none') {
        LoopButton.classList.add('Enabled');
        // Apply drop-shadow directly via style
        SVG.style.filter = 'drop-shadow(0 0 5px white)';
      } else {
        LoopButton.classList.remove('Enabled');
      }
    }
  }
});

Global.Event.listen('playback:shuffle', (e) => {
  // console.log("Shuffle", e);
  if (Fullscreen.IsOpen) {
    // console.log("Fullscreen Opened");
    if (ActivePlaybackControlsInstance) {
      // console.log("ActivePlaybackControlsInstance - Exists");
      const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
      const ShuffleButton = PlaybackControls.querySelector('.ShuffleToggle');
      const SVG = ShuffleButton.querySelector('svg');

      // First reset any inline styles
      SVG.style.filter = '';

      // Toggle class for brightness
      if (e !== 'none') {
        ShuffleButton.classList.add('Enabled');
        // Apply drop-shadow directly via style
        SVG.style.filter = 'drop-shadow(0 0 5px white)';
      } else {
        ShuffleButton.classList.remove('Enabled');
      }
    }
  }
});

// The playback:playpause event listener has been combined with the one above

/**
 * Helper function to handle position and progress updates
 * Extracts common code from position and progress event handlers
 * Only processes updates when in fullscreen mode
 */
function handlePositionUpdate(e: any) {
  // Only process updates if in fullscreen mode and progress bar is active
  if (!Fullscreen.IsOpen || !ActiveSetupSongProgressBarInstance) return;

  // Extract position value from different event formats
  let position: number | null = null;
  if (typeof e === 'number') {
    position = e;
  } else if (e && e.data && typeof e.data === 'number') {
    position = e.data;
  }

  if (position !== null) {
    // Update our tracking variables
    ActiveSongProgressBarInstance_Map.set('lastKnownPosition', position);
    ActiveSongProgressBarInstance_Map.set('lastUpdateTime', performance.now());

    // Only update the UI if we're not in the middle of interpolation
    const lastInterpolationUpdate =
      ActiveSongProgressBarInstance_Map.get('lastInterpolationUpdate') || 0;
    if (performance.now() - lastInterpolationUpdate > 500) {
      const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
        'updateTimelineState_Function',
      );
      if (updateTimelineState) {
        updateTimelineState(position);
      }
    }
  }
}

// Listen for position updates
Global.Event.listen('playback:position', handlePositionUpdate);

// Listen for progress updates from Spicetify
Global.Event.listen('playback:progress', handlePositionUpdate);

Global.Event.listen('fullscreen:exit', () => {
  CleanUpActiveComponents();
});

export {
  OpenNowBar,
  CloseNowBar,
  ToggleNowBar,
  UpdateNowBar,
  Session_OpenNowBar,
  NowBar_SwapSides,
  Session_NowBar_SetSide,
  DeregisterNowBarBtn,
};
