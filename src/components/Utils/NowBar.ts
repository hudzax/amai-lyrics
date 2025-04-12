import { SongProgressBar } from './../../utils/Lyrics/SongProgressBar';
import storage from '../../utils/storage';
import Whentil from '../../utils/Whentil';
import Global from '../Global/Global';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { Tooltips } from '../Pages/PageView';
import { Icons } from '../Styling/Icons';
import Fullscreen from './Fullscreen';

let ActivePlaybackControlsInstance = null;
const ActiveSongProgressBarInstance_Map = new Map();
let ActiveSetupSongProgressBarInstance = null;

/* const ActiveMarquees = new Map();

/**
 * Accurately measures the width of text content
 * @param text The text to measure
 * @param font Optional font specification
 * @returns Width of the text in pixels
 * 
function measureTextWidth(text: string, font?: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    // Use computed font from the document or specified font
    if (!font) {
        font = window.getComputedStyle(document.body).font;
    }
    
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

function ApplyMarquee(baseWidth, elementWidth, name) {
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes marquee_${name} {
             0%, 10% {
                transform: translateX(0);
            }
            45%, 55% {
                transform: translateX(calc(-${baseWidth} - calc(${elementWidth} + calc(${baseWidth} / 1.5))));
            }
            90%, 100% {
                transform: translateX(0);
            }
        }
    `;
    style.id = `spicy-lyrics-marquee_${name}`;
    document.head.appendChild(style);
    ActiveMarquees.set(name, style);
    return {
        cleanup: () => {
            style.remove();
            ActiveMarquees.delete(name);
        },
        getElement: () => style,
        getName: () => name,
        getComputedName: () => `marquee_${name}`,
    };
} */

function OpenNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  // return;
  if (!NowBar) return;
  UpdateNowBar(true);
  NowBar.classList.add('Active');
  storage.set('IsNowBarOpen', 'true');

  if (Fullscreen.IsOpen) {
    const MediaBox = document.querySelector(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
    );

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

          /* AppendQueue.forEach((element) => {
                        if (element.classList.contains("marqueeify")) {
                            const childMarquee = element.querySelector("span");
                            if (!childMarquee) return;
                            
                            // Use text measurement instead of element width
                            const textWidth = measureTextWidth(childMarquee.textContent || "");
                            
                            // Only apply marquee if text width is greater than 200px
                            if (textWidth > 200) {
                                const marquee = ApplyMarquee(
                                    element.getAttribute("marquee-base-width") ?? "100%", 
                                    `${textWidth}px`, 
                                    "albumName"
                                );
                                childMarquee.style.animation = `${marquee.getComputedName()} 25s linear infinite`;
                            } else {
                                // Center the text if it doesn't need marquee
                                childMarquee.style.textAlign = "center";
                                childMarquee.style.width = "100%";
                            }
                        }
                    }); */
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

  ArtistsDiv.classList.add('Skeletoned');
  MediaBox.classList.add('Skeletoned');
  SongName.classList.add('Skeletoned');

  const IsNowBarOpen = storage.get('IsNowBarOpen');
  if (IsNowBarOpen == 'false' && !force) return;

  SpotifyPlayer.Artwork.Get('xl').then((artwork) => {
    /* BlobURLMaker(`https://i.scdn.co/image/${artwork.replace("spotify:image:", "")}`).then(
            (processedArtwork) => {
                MediaImage.src = processedArtwork ?? artwork;
                MediaBox.classList.remove("Skeletoned");
            }
        ); */
    MediaImage.src = artwork;
    MediaBox.classList.remove('Skeletoned');
  });

  SpotifyPlayer.GetSongName().then((title) => {
    SongNameSpan.textContent = title;
    SongName.classList.remove('Skeletoned');
  });

  SpotifyPlayer.GetArtists().then((artists) => {
    const JoinedArtists = SpotifyPlayer.JoinArtists(artists);
    ArtistsSpan.textContent = JoinedArtists;
    ArtistsDiv.classList.remove('Skeletoned');
  });

  if (Fullscreen.IsOpen) {
    const NowBarAlbum = NowBar.querySelector<HTMLDivElement>(
      '.Header .MediaBox .AlbumData',
    );
    if (NowBarAlbum) {
      NowBarAlbum.classList.add('Skeletoned');
      const AlbumSpan = NowBarAlbum.querySelector('span');
      AlbumSpan.textContent = SpotifyPlayer.GetAlbumName();
      NowBarAlbum.classList.remove('Skeletoned');
      /* if (!AlbumSpan) return;
            if (ActiveMarquees.has("albumName")) {
                ActiveMarquees.get("albumName").cleanup();
            }
            
            // Use text measurement instead of element width
            const textWidth = measureTextWidth(AlbumSpan.textContent || "");
            
            // Only apply marquee if text width is greater than 200px
            if (textWidth > 200) {
                const marquee = ApplyMarquee(
                    NowBarAlbum.getAttribute("marquee-base-width") ?? "100%", 
                    `${textWidth}px`, 
                    "albumName"
                );
                AlbumSpan.style.animation = `${marquee.getComputedName()} 25s linear infinite`;
            } else {
                // Center the text if it doesn't need marquee
                AlbumSpan.style.animation = "none";
                AlbumSpan.style.textAlign = "center";
                AlbumSpan.style.width = "100%";
            } */
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

Global.Event.listen('playback:playpause', (e) => {
  // console.log("PlayPause", e);
  if (Fullscreen.IsOpen) {
    // console.log("Fullscreen Opened");
    if (ActivePlaybackControlsInstance) {
      // console.log("ActivePlaybackControlsInstance - Exists");
      const PlaybackControls = ActivePlaybackControlsInstance.GetElement();
      const PlayPauseButton =
        PlaybackControls.querySelector('.PlayStateToggle');
      if (e.data.isPaused) {
        // console.log("Paused");
        PlayPauseButton.classList.remove('Playing');
        PlayPauseButton.classList.add('Paused');
        const SVG = PlayPauseButton.querySelector('svg');
        SVG.innerHTML = Icons.Play;
      } else {
        // console.log("Playing");
        PlayPauseButton.classList.remove('Paused');
        PlayPauseButton.classList.add('Playing');
        const SVG = PlayPauseButton.querySelector('svg');
        SVG.innerHTML = Icons.Pause;
      }
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

// Listen for play/pause events to update our interpolation state
Global.Event.listen('playback:playpause', (e) => {
  if (ActiveSetupSongProgressBarInstance) {
    // When playback state changes, we need to reset our interpolation
    const isPaused = e?.data?.isPaused;

    if (isPaused) {
      // If paused, get the exact position and update UI once
      const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;
      ActiveSongProgressBarInstance_Map.set(
        'lastKnownPosition',
        actualPosition,
      );
      ActiveSongProgressBarInstance_Map.set(
        'lastUpdateTime',
        performance.now(),
      );

      const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
        'updateTimelineState_Function',
      );
      if (updateTimelineState) {
        updateTimelineState(actualPosition);
      }
    } else {
      // If playing, reset our tracking variables
      const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;
      ActiveSongProgressBarInstance_Map.set(
        'lastKnownPosition',
        actualPosition,
      );
      ActiveSongProgressBarInstance_Map.set(
        'lastUpdateTime',
        performance.now(),
      );
    }
  }
});

// Listen for position updates
Global.Event.listen('playback:position', (e) => {
  if (ActiveSetupSongProgressBarInstance) {
    // Update our last known position for interpolation
    if (typeof e === 'number') {
      ActiveSongProgressBarInstance_Map.set('lastKnownPosition', e);
      ActiveSongProgressBarInstance_Map.set(
        'lastUpdateTime',
        performance.now(),
      );
    } else if (e && e.data && typeof e.data === 'number') {
      ActiveSongProgressBarInstance_Map.set('lastKnownPosition', e.data);
      ActiveSongProgressBarInstance_Map.set(
        'lastUpdateTime',
        performance.now(),
      );
    }

    // Only update the UI if we're not in the middle of interpolation
    const lastInterpolationUpdate =
      ActiveSongProgressBarInstance_Map.get('lastInterpolationUpdate') || 0;
    if (performance.now() - lastInterpolationUpdate > 500) {
      const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
        'updateTimelineState_Function',
      );
      if (updateTimelineState) {
        updateTimelineState(e);
      }
    }
  }
});

// Listen for progress updates from Spicetify
Global.Event.listen('playback:progress', (e) => {
  if (ActiveSetupSongProgressBarInstance) {
    // Update our last known position for interpolation
    if (typeof e === 'number') {
      ActiveSongProgressBarInstance_Map.set('lastKnownPosition', e);
      ActiveSongProgressBarInstance_Map.set(
        'lastUpdateTime',
        performance.now(),
      );
    } else if (e && e.data && typeof e.data === 'number') {
      ActiveSongProgressBarInstance_Map.set('lastKnownPosition', e.data);
      ActiveSongProgressBarInstance_Map.set(
        'lastUpdateTime',
        performance.now(),
      );
    }

    // Only update the UI if we're not in the middle of interpolation
    const lastInterpolationUpdate =
      ActiveSongProgressBarInstance_Map.get('lastInterpolationUpdate') || 0;
    if (performance.now() - lastInterpolationUpdate > 500) {
      const updateTimelineState = ActiveSongProgressBarInstance_Map.get(
        'updateTimelineState_Function',
      );
      if (updateTimelineState) {
        updateTimelineState(e);
      }
    }
  }
});

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
