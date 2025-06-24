import { SongProgressBar } from '../../utils/Lyrics/SongProgressBar';
import storage from '../../utils/storage';
import Whentil from '../../utils/Whentil';
import Global from '../Global/Global';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { Icons } from '../Styling/Icons';
import Fullscreen from './Fullscreen';

/**
 * NowBar component for displaying and controlling the current playback
 * Manages playback controls, progress bar, and UI state
 */

// Define types for better type safety
interface ComponentInstance {
  Apply: () => void;
  CleanUp: () => void;
  GetElement: () => HTMLElement;
}

// Define custom types for elements with added properties
interface DraggableElement extends HTMLElement {
  _dragEventsAdded?: boolean;
}

interface DroppableElement extends Element {
  _dropEventsAdded?: boolean;
}

// Define types for event handlers
interface EventHandlerMap {
  pressHandlers: Map<Element, EventListener>;
  releaseHandlers: Map<Element, EventListener>;
  clickHandlers: Map<Element, EventListener>;
}

// Define types for progress bar state
interface ProgressBarState {
  lastKnownPosition: number;
  lastUpdateTime: number;
  lastInterpolationUpdate?: number;
  updateInterval?: ReturnType<typeof setInterval>;
  updateTimelineState_Function?: (position?: number | null) => void;
  SongProgressBar_ClassInstance?: SongProgressBar;
  TimeLineElement?: HTMLElement;
}

// Track instances of components for cleanup and state management
let ActivePlaybackControlsInstance: ComponentInstance | null = null;
const progressBarState: ProgressBarState = {
  lastKnownPosition: 0,
  lastUpdateTime: 0,
};
let ActiveSetupSongProgressBarInstance: ComponentInstance | null = null;

// Note: Marquee functionality has been removed as it's not currently used
// If text scrolling is needed in the future, consider using CSS animations or a library

/**
 * Opens the NowBar and initializes its components
 * Sets up playback controls and progress bar in fullscreen mode
 */
function OpenNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  UpdateNowBar(true);
  if (!NowBar.classList.contains('Active')) NowBar.classList.add('Active');
  storage.set('IsNowBarOpen', 'true');

  if (Fullscreen.IsOpen) {
    // Cache MediaBox for repeated use
    const MediaBox = document.querySelector(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
    );
    if (!MediaBox) return;

    // Remove only if present, avoid unnecessary DOM ops
    const existingAlbumData = MediaBox.querySelector('.AlbumData');
    if (existingAlbumData) MediaBox.removeChild(existingAlbumData);

    const existingPlaybackControls = MediaBox.querySelector('.PlaybackControls');
    if (existingPlaybackControls) MediaBox.removeChild(existingPlaybackControls);

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

      /**
       * Creates and sets up playback controls with event handlers
       * @returns ComponentInstance with methods to apply, clean up, and get the element
       */
      const SetupPlaybackControls = (): ComponentInstance => {
        // Create the controls element with initial HTML
        const ControlsElement = createControlsElement();

        // Set up initial state for loop and shuffle
        setupInitialControlState(ControlsElement);

        // Set up all event handlers
        const eventHandlers = setupEventHandlers(ControlsElement);

        return {
          Apply: () => {
            AppendQueue.push(ControlsElement);
          },
          CleanUp: () => cleanupEventHandlers(ControlsElement, eventHandlers),
          GetElement: () => ControlsElement,
        };
      };

      /**
       * Creates the playback controls element with initial HTML
       */
      function createControlsElement(): HTMLElement {
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
            ${SpotifyPlayer.LoopType === 'track' ? Icons.LoopTrack : Icons.Loop}
          </div>
        `;
        return ControlsElement;
      }

      /**
       * Sets up initial visual state for loop and shuffle controls
       */
      function setupInitialControlState(element: HTMLElement): void {
        // Set up loop state
        if (SpotifyPlayer.LoopType !== 'none') {
          const loopToggle = element.querySelector('.LoopToggle');
          const loopSvg = element.querySelector<HTMLElement>('.LoopToggle svg');

          if (loopToggle) loopToggle.classList.add('Enabled');
          if (loopSvg) loopSvg.style.filter = 'drop-shadow(0 0 5px white)';
        }

        // Set up shuffle state
        if (SpotifyPlayer.ShuffleType !== 'none') {
          const shuffleToggle = element.querySelector('.ShuffleToggle');
          const shuffleSvg = element.querySelector<HTMLElement>('.ShuffleToggle svg');

          if (shuffleToggle) shuffleToggle.classList.add('Enabled');
          if (shuffleSvg) shuffleSvg.style.filter = 'drop-shadow(0 0 5px white)';
        }
      }

      /**
       * Sets up all event handlers for the playback controls
       */
      function setupEventHandlers(element: HTMLElement): EventHandlerMap {
        const eventHandlers: EventHandlerMap = {
          pressHandlers: new Map(),
          releaseHandlers: new Map(),
          clickHandlers: new Map(),
        };

        // Set up press/release handlers for all controls
        setupPressReleaseHandlers(element, eventHandlers);

        // Set up click handlers for specific controls
        setupClickHandlers(element, eventHandlers);

        return eventHandlers;
      }

      /**
       * Sets up press/release handlers for visual feedback
       */
      function setupPressReleaseHandlers(
        element: HTMLElement,
        eventHandlers: EventHandlerMap,
      ): void {
        const playbackControls = element.querySelectorAll('.PlaybackControl');

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
      }

      /**
       * Sets up click handlers for specific playback controls
       */
      function setupClickHandlers(element: HTMLElement, eventHandlers: EventHandlerMap): void {
        // Get control elements
        const PlayPauseControl = element.querySelector('.PlayStateToggle');
        const PrevTrackControl = element.querySelector('.PrevTrack');
        const NextTrackControl = element.querySelector('.NextTrack');
        const ShuffleControl = element.querySelector('.ShuffleToggle');
        const LoopControl = element.querySelector('.LoopToggle');

        if (
          !PlayPauseControl ||
          !PrevTrackControl ||
          !NextTrackControl ||
          !ShuffleControl ||
          !LoopControl
        ) {
          console.error('Missing required control elements');
          return;
        }

        // Create handlers
        const playPauseHandler = createPlayPauseHandler(PlayPauseControl);
        const prevTrackHandler = () => SpotifyPlayer.Skip.Prev();
        const nextTrackHandler = () => SpotifyPlayer.Skip.Next();
        const shuffleHandler = createShuffleHandler(ShuffleControl);
        const loopHandler = createLoopHandler(LoopControl);

        // Store handlers
        eventHandlers.clickHandlers.set(PlayPauseControl, playPauseHandler);
        eventHandlers.clickHandlers.set(PrevTrackControl, prevTrackHandler);
        eventHandlers.clickHandlers.set(NextTrackControl, nextTrackHandler);
        eventHandlers.clickHandlers.set(ShuffleControl, shuffleHandler);
        eventHandlers.clickHandlers.set(LoopControl, loopHandler);

        // Add event listeners
        PlayPauseControl.addEventListener('click', playPauseHandler);
        PrevTrackControl.addEventListener('click', prevTrackHandler);
        NextTrackControl.addEventListener('click', nextTrackHandler);
        ShuffleControl.addEventListener('click', shuffleHandler);
        LoopControl.addEventListener('click', loopHandler);
      }

      /**
       * Creates a handler for play/pause button clicks
       */
      function createPlayPauseHandler(control: Element): EventListener {
        return () => {
          const playSvg = control.querySelector('svg');

          if (SpotifyPlayer.IsPlaying) {
            // Update state immediately before API call
            SpotifyPlayer.IsPlaying = false;
            SpotifyPlayer.Pause();

            // Immediately update UI to reflect the change
            control.classList.remove('Playing');
            control.classList.add('Paused');
            if (playSvg) {
              playSvg.innerHTML = Icons.Play;
            }
          } else {
            // Update state immediately before API call
            SpotifyPlayer.IsPlaying = true;
            SpotifyPlayer.Play();

            // Immediately update UI to reflect the change
            control.classList.remove('Paused');
            control.classList.add('Playing');
            if (playSvg) {
              playSvg.innerHTML = Icons.Pause;
            }
          }
        };
      }

      /**
       * Creates a handler for shuffle button clicks
       */
      function createShuffleHandler(control: Element): EventListener {
        return () => {
          const shuffleSvg = control.querySelector('svg');

          if (SpotifyPlayer.ShuffleType === 'none') {
            SpotifyPlayer.ShuffleType = 'normal';
            control.classList.add('Enabled');

            if (shuffleSvg instanceof HTMLElement) {
              shuffleSvg.style.filter = 'drop-shadow(0 0 5px white)';
            }
            Spicetify.Player.setShuffle(true);
          } else if (SpotifyPlayer.ShuffleType === 'normal') {
            SpotifyPlayer.ShuffleType = 'none';
            control.classList.remove('Enabled');

            if (shuffleSvg instanceof HTMLElement) {
              shuffleSvg.style.filter = '';
            }
            Spicetify.Player.setShuffle(false);
          }
        };
      }

      /**
       * Creates a handler for loop button clicks
       */
      function createLoopHandler(control: Element): EventListener {
        return () => {
          const loopSvg = control.querySelector('svg');
          if (!loopSvg) return;

          if (SpotifyPlayer.LoopType === 'none') {
            // Change to context repeat
            SpotifyPlayer.LoopType = 'context';
            Spicetify.Player.setRepeat(1);

            // Update UI
            control.classList.add('Enabled');
            if (loopSvg instanceof HTMLElement) {
              loopSvg.innerHTML = Icons.Loop;
              loopSvg.style.filter = 'drop-shadow(0 0 5px white)';
            }
          } else if (SpotifyPlayer.LoopType === 'context') {
            // Change to track repeat
            SpotifyPlayer.LoopType = 'track';
            Spicetify.Player.setRepeat(2);

            // Update UI
            if (loopSvg instanceof HTMLElement) {
              loopSvg.innerHTML = Icons.LoopTrack;
              loopSvg.style.filter = 'drop-shadow(0 0 5px white)';
            }
          } else if (SpotifyPlayer.LoopType === 'track') {
            // Change to no repeat
            SpotifyPlayer.LoopType = 'none';
            Spicetify.Player.setRepeat(0);

            // Update UI
            control.classList.remove('Enabled');
            if (loopSvg instanceof HTMLElement) {
              loopSvg.innerHTML = Icons.Loop;
              loopSvg.style.filter = '';
            }
          }
        };
      }

      /**
       * Cleans up all event handlers and removes the element from DOM if needed
       */
      function cleanupEventHandlers(element: HTMLElement, eventHandlers: EventHandlerMap): void {
        const playbackControls = element.querySelectorAll('.PlaybackControl');
        const PlayPauseControl = element.querySelector('.PlayStateToggle');
        const PrevTrackControl = element.querySelector('.PrevTrack');
        const NextTrackControl = element.querySelector('.NextTrack');
        const ShuffleControl = element.querySelector('.ShuffleToggle');
        const LoopControl = element.querySelector('.LoopToggle');

        // Remove press/release handlers
        playbackControls.forEach((control) => {
          const pressHandler = eventHandlers.pressHandlers.get(control);
          const releaseHandler = eventHandlers.releaseHandlers.get(control);

          if (pressHandler) {
            control.removeEventListener('mousedown', pressHandler);
            control.removeEventListener('touchstart', pressHandler);
          }

          if (releaseHandler) {
            control.removeEventListener('mouseup', releaseHandler);
            control.removeEventListener('mouseleave', releaseHandler);
            control.removeEventListener('touchend', releaseHandler);
          }
        });

        // Remove click handlers
        if (PlayPauseControl) {
          const handler = eventHandlers.clickHandlers.get(PlayPauseControl);
          if (handler) PlayPauseControl.removeEventListener('click', handler);
        }

        if (PrevTrackControl) {
          const handler = eventHandlers.clickHandlers.get(PrevTrackControl);
          if (handler) PrevTrackControl.removeEventListener('click', handler);
        }

        if (NextTrackControl) {
          const handler = eventHandlers.clickHandlers.get(NextTrackControl);
          if (handler) NextTrackControl.removeEventListener('click', handler);
        }

        if (ShuffleControl) {
          const handler = eventHandlers.clickHandlers.get(ShuffleControl);
          if (handler) ShuffleControl.removeEventListener('click', handler);
        }

        if (LoopControl) {
          const handler = eventHandlers.clickHandlers.get(LoopControl);
          if (handler) LoopControl.removeEventListener('click', handler);
        }

        // Clear the maps
        eventHandlers.pressHandlers.clear();
        eventHandlers.releaseHandlers.clear();
        eventHandlers.clickHandlers.clear();

        // Remove the controls element from DOM if it exists
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }

      /**
       * Creates and sets up the song progress bar with event handlers and update interval
       * @returns ComponentInstance with methods to apply, clean up, and get the element
       */
      const SetupSongProgressBar = (): ComponentInstance => {
        // Create and initialize the progress bar
        const { songProgressBar, timelineElement, sliderBar } = createProgressBarElements();

        if (!sliderBar) {
          console.error('Could not find SliderBar element');
          return null;
        }

        // Create the update function
        const updateTimelineState = createUpdateFunction(
          songProgressBar,
          timelineElement,
          sliderBar,
        );

        // Set up click handler for seeking
        const sliderBarHandler = createSliderClickHandler(
          songProgressBar,
          sliderBar,
          timelineElement,
        );
        sliderBar.addEventListener('click', sliderBarHandler);

        // Run initial update
        updateTimelineState();

        // Initialize tracking variables
        initializeTrackingVariables();

        // Set up update interval
        const updateInterval = setupUpdateInterval(updateTimelineState);

        // Store references for later use
        progressBarState.SongProgressBar_ClassInstance = songProgressBar;
        progressBarState.TimeLineElement = timelineElement;
        progressBarState.updateTimelineState_Function = updateTimelineState;
        progressBarState.updateInterval = updateInterval;

        return {
          Apply: () => {
            AppendQueue.push(timelineElement);
          },
          GetElement: () => timelineElement,
          CleanUp: () => cleanupProgressBar(sliderBar, sliderBarHandler),
        };
      };

      /**
       * Creates and initializes the progress bar elements
       */
      function createProgressBarElements() {
        // Create the SongProgressBar instance
        const songProgressBar = new SongProgressBar();

        // Update initial values
        songProgressBar.Update({
          duration: SpotifyPlayer.GetTrackDuration() ?? 0,
          position: SpotifyPlayer.GetTrackPosition() ?? 0,
        });

        // Create the timeline element
        const timelineElement = document.createElement('div');
        timelineElement.classList.add('Timeline');
        timelineElement.innerHTML = `
          <span class="Time Position">${songProgressBar.GetFormattedPosition() ?? '0:00'}</span>
          <div class="SliderBar" style="--SliderProgress: ${
            songProgressBar.GetProgressPercentage() ?? 0
          }">
            <div class="Handle"></div>
          </div>
          <span class="Time Duration">${songProgressBar.GetFormattedDuration() ?? '0:00'}</span>
        `;

        // Get the slider bar element
        const sliderBar = timelineElement.querySelector<HTMLElement>('.SliderBar');

        return { songProgressBar, timelineElement, sliderBar };
      }

      /**
       * Creates a function to update the timeline state
       */
      function createUpdateFunction(
        songProgressBar: SongProgressBar,
        timelineElement: HTMLElement,
        sliderBar: HTMLElement,
      ) {
        return (e: number | { data?: number } | null = null) => {
          const positionElement = timelineElement.querySelector<HTMLElement>('.Time.Position');
          const durationElement = timelineElement.querySelector<HTMLElement>('.Time.Duration');

          if (!positionElement || !durationElement || !sliderBar) {
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

          // Get formatted values
          const sliderPercentage = songProgressBar.GetProgressPercentage();
          const formattedPosition = songProgressBar.GetFormattedPosition();
          const formattedDuration = songProgressBar.GetFormattedDuration();

          // Update the UI
          sliderBar.style.setProperty('--SliderProgress', sliderPercentage.toString());
          durationElement.textContent = formattedDuration;
          positionElement.textContent = formattedPosition;
        };
      }

      /**
       * Creates a click handler for the slider bar to seek to a position
       */
      function createSliderClickHandler(
        songProgressBar: SongProgressBar,
        sliderBar: HTMLElement,
        timelineElement: HTMLElement,
      ) {
        return (event: MouseEvent) => {
          // Only process clicks when in fullscreen mode
          if (!Fullscreen.IsOpen) return;

          // Calculate position from click
          const positionMs = songProgressBar.CalculatePositionFromClick({
            sliderBar: sliderBar,
            event: event,
          });

          // Use the calculated position (in milliseconds)
          if (typeof SpotifyPlayer !== 'undefined' && SpotifyPlayer.Seek) {
            SpotifyPlayer.Seek(positionMs);

            // Update tracking variables
            progressBarState.lastKnownPosition = positionMs;
            progressBarState.lastUpdateTime = performance.now();

            // Update the UI to reflect the new position
            songProgressBar.Update({
              duration: SpotifyPlayer.GetTrackDuration() ?? 0,
              position: positionMs,
            });

            // Update UI elements
            const sliderPercentage = songProgressBar.GetProgressPercentage();
            const formattedPosition = songProgressBar.GetFormattedPosition();

            sliderBar.style.setProperty('--SliderProgress', sliderPercentage.toString());

            const positionElement = timelineElement.querySelector<HTMLElement>('.Time.Position');
            if (positionElement) {
              positionElement.textContent = formattedPosition;
            }
          }
        };
      }

      /**
       * Initializes tracking variables for position interpolation
       */
      function initializeTrackingVariables() {
        progressBarState.lastKnownPosition = SpotifyPlayer.GetTrackPosition() || 0;
        progressBarState.lastUpdateTime = performance.now();
      }

      /**
       * Sets up the update interval for smooth progress bar updates
       */
      function setupUpdateInterval(updateTimelineState: (position?: number) => void) {
        return setInterval(() => {
          if (SpotifyPlayer.IsPlaying) {
            // Get stored values
            const { lastKnownPosition, lastUpdateTime } = progressBarState;

            // Calculate elapsed time
            const now = performance.now();
            const elapsed = now - (lastUpdateTime || now);

            // Update strategy: get actual position occasionally, interpolate most of the time
            if (elapsed > 3000) {
              // Every 3 seconds, get actual position from API
              const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;
              progressBarState.lastKnownPosition = actualPosition;
              progressBarState.lastUpdateTime = now;
              updateTimelineState(actualPosition);
            } else {
              // Otherwise, interpolate position based on elapsed time
              const interpolatedPosition = (lastKnownPosition || 0) + elapsed;
              progressBarState.lastInterpolationUpdate = now;
              updateTimelineState(interpolatedPosition);
            }
          }
        }, 100); // Update frequently for smooth animation
      }

      /**
       * Cleans up the progress bar resources
       */
      function cleanupProgressBar(sliderBar: HTMLElement, sliderBarHandler: EventListener) {
        // Remove event listeners
        if (sliderBar) {
          sliderBar.removeEventListener('click', sliderBarHandler);
        }

        // Clear the update interval
        const { updateInterval, SongProgressBar_ClassInstance, TimeLineElement } = progressBarState;
        if (updateInterval) {
          clearInterval(updateInterval);
        }

        // Clean up the progress bar instance
        if (SongProgressBar_ClassInstance) {
          SongProgressBar_ClassInstance.Destroy();
        }

        // Remove the timeline element from DOM if attached
        if (TimeLineElement && TimeLineElement.parentNode) {
          TimeLineElement.parentNode.removeChild(TimeLineElement);
        }

        // Reset state
        Object.keys(progressBarState).forEach((key) => {
          delete progressBarState[key];
        });

        // Initialize with empty values
        progressBarState.lastKnownPosition = 0;
        progressBarState.lastUpdateTime = 0;
      }

      // Set up playback controls
      ActivePlaybackControlsInstance = SetupPlaybackControls();
      ActivePlaybackControlsInstance.Apply();

      // Set up song progress bar
      ActiveSetupSongProgressBarInstance = SetupSongProgressBar();
      if (ActiveSetupSongProgressBarInstance) {
        ActiveSetupSongProgressBarInstance.Apply();
      }

      // Use a more reliable approach to add elements
      Whentil.When(
        () => document.querySelector('#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls'),
        () => {
          // Ensure there's no duplicate elements before appending
          const viewControls = MediaBox.querySelector('.ViewControls');

          // Create a temporary fragment to avoid multiple reflows
          const fragment = document.createDocumentFragment();
          AppendQueue.forEach((element) => {
            fragment.appendChild(element);
          });

          // Only update DOM if fragment has children
          if (fragment.childNodes.length > 0) {
            MediaBox.innerHTML = '';
            if (viewControls) MediaBox.appendChild(viewControls);
            MediaBox.appendChild(fragment);
          }
        },
      );
    }
  }

  // Cache DragBox and dropZones for reuse
  const DragBox = Fullscreen.IsOpen
    ? document.querySelector('#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent')
    : document.querySelector('#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage');
  if (!DragBox) return;

  const dropZones = document.querySelectorAll<DroppableElement>(
    '#SpicyLyricsPage .ContentBox .DropZone',
  );

  // Use a flag to prevent duplicate event listeners
  if (!(DragBox as DraggableElement)._dragEventsAdded) {
    DragBox.addEventListener('dragstart', () => {
      setTimeout(() => {
        document.querySelector('#SpicyLyricsPage').classList.add('SomethingDragging');
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
      document.querySelector('#SpicyLyricsPage').classList.remove('SomethingDragging');
      dropZones.forEach((zone) => zone.classList.remove('Hidden'));
      DragBox.classList.remove('Dragging');
    });

    (DragBox as DraggableElement)._dragEventsAdded = true;
  }

  dropZones.forEach((zone) => {
    // Prevent duplicate listeners
    if (!(zone as DroppableElement)._dropEventsAdded) {
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

        const currentClass = NowBar.classList.contains('LeftSide') ? 'LeftSide' : 'RightSide';

        const newClass = zone.classList.contains('RightSide') ? 'RightSide' : 'LeftSide';

        if (currentClass !== newClass) {
          NowBar.classList.remove(currentClass);
          NowBar.classList.add(newClass);
          const side = zone.classList.contains('RightSide') ? 'right' : 'left';
          storage.set('NowBarSide', side);
        }
      });

      (zone as DroppableElement)._dropEventsAdded = true;
    }
  });
}

/**
 * Cleans up all active component instances and removes elements from the DOM
 */
function CleanUpActiveComponents() {
  // Clean up playback controls
  if (ActivePlaybackControlsInstance) {
    ActivePlaybackControlsInstance.CleanUp();
    ActivePlaybackControlsInstance = null;
  }

  // Clean up song progress bar
  if (ActiveSetupSongProgressBarInstance) {
    ActiveSetupSongProgressBarInstance.CleanUp();
    ActiveSetupSongProgressBarInstance = null;
  }

  // Reset progress bar state
  Object.keys(progressBarState).forEach((key) => {
    if (key !== 'lastKnownPosition' && key !== 'lastUpdateTime') {
      delete progressBarState[key];
    }
  });

  // Initialize with empty values
  progressBarState.lastKnownPosition = 0;
  progressBarState.lastUpdateTime = 0;

  // Remove any leftover elements from the DOM
  removeLeftoverElements();
}

/**
 * Removes any leftover UI elements from the DOM
 */
function removeLeftoverElements() {
  const MediaBox = document.querySelector(
    '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
  );

  if (MediaBox) {
    // Remove album data
    const albumData = MediaBox.querySelector('.AlbumData');
    if (albumData) MediaBox.removeChild(albumData);

    // Remove playback controls
    const playbackControls = MediaBox.querySelector('.PlaybackControls');
    if (playbackControls) MediaBox.removeChild(playbackControls);

    // Remove song progress bar
    const songProgressBar = MediaBox.querySelector('.SongProgressBar');
    if (songProgressBar) MediaBox.removeChild(songProgressBar);
  }
}

/**
 * Closes the NowBar and cleans up its components
 */
function CloseNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  NowBar.classList.remove('Active');
  storage.set('IsNowBarOpen', 'false');
  CleanUpActiveComponents();
}

/**
 * Restores the NowBar to its previous state (open or closed) from session storage
 */
function Session_OpenNowBar() {
  OpenNowBar();
  // const IsNowBarOpen = storage.get('IsNowBarOpen');
  // if (IsNowBarOpen === 'true') {
  //   OpenNowBar();
  // } else {
  //   CloseNowBar();
  // }
}

/**
 * Updates the NowBar content with current track information
 * @param force - If true, updates even if the NowBar is closed
 */
function UpdateNowBar(force = false) {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  // Cache elements for repeated use
  const ArtistsDiv = NowBar.querySelector('.Header .Metadata .Artists');
  const ArtistsSpan = NowBar.querySelector('.Header .Metadata .Artists span');
  const MediaImage = NowBar.querySelector<HTMLImageElement>('.Header .MediaBox .MediaImage');
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
        if (MediaImage.src !== artwork) {
          MediaImage.src = artwork;
        }
        MediaBox.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to load artwork:', err);
      });
  }

  // Only update text if changed
  if (SongNameSpan && SongName) {
    SpotifyPlayer.GetSongName()
      .then((title) => {
        if (SongNameSpan.textContent !== title) {
          SongNameSpan.textContent = title;
        }
        SongName.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to get song name:', err);
      });
  }

  if (ArtistsSpan && ArtistsDiv) {
    SpotifyPlayer.GetArtists()
      .then((artists) => {
        const joined = SpotifyPlayer.JoinArtists(artists);
        if (ArtistsSpan.textContent !== joined) {
          ArtistsSpan.textContent = joined;
        }
        ArtistsDiv.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to get artists:', err);
      });
  }

  if (Fullscreen.IsOpen) {
    const NowBarAlbum = NowBar.querySelector<HTMLDivElement>('.Header .MediaBox .AlbumData');
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

/**
 * Swaps the NowBar between left and right sides of the screen
 */
function NowBar_SwapSides() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  const CurrentSide = storage.get('NowBarSide');
  if (CurrentSide === 'left') {
    // Switch to right side
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  } else if (CurrentSide === 'right') {
    // Switch to left side
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  } else {
    // Default to right side if no side is set
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  }
}

/**
 * Restores the NowBar to its previous side (left or right) from session storage
 */
function Session_NowBar_SetSide() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  const CurrentSide = storage.get('NowBarSide');
  if (CurrentSide === 'left') {
    // Set to left side
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  } else if (CurrentSide === 'right') {
    // Set to right side
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  } else {
    // Default to left side if no side is set
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  }
}

/**
 * Removes the NowBar toggle button and its tooltip
 */
function DeregisterNowBarBtn() {
  // Remove the button from DOM
  const nowBarButton = document.querySelector(
    '#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle',
  );
  if (nowBarButton) {
    nowBarButton.remove();
  }
}

/**
 * Set up all event listeners for playback events
 */

// Handle play/pause events
Global.Event.listen('playback:playpause', (e) => {
  handlePlayPauseEvent(e);
});

// Handle loop state changes
Global.Event.listen('playback:loop', (e: 'none' | 'context' | 'track') => {
  handleLoopEvent(e);
});

// Handle shuffle state changes
Global.Event.listen('playback:shuffle', (e: 'none' | 'normal') => {
  handleShuffleEvent(e);
});

// Handle position and progress updates
Global.Event.listen('playback:position', handlePositionUpdate);
Global.Event.listen('playback:progress', handlePositionUpdate);

// Handle fullscreen exit
Global.Event.listen('fullscreen:exit', () => {
  CleanUpActiveComponents();
});

/**
 * Handles play/pause events by updating UI and progress tracking
 */
function handlePlayPauseEvent(e: PlaybackPlayPauseEvent): void {
  // Only process in fullscreen mode
  if (!Fullscreen.IsOpen) return;

  // Update playback controls UI
  updatePlayPauseUI(e);

  // Update progress bar state
  updateProgressBarState();
}

/**
 * Updates the play/pause button UI based on playback state
 */
interface PlaybackPlayPauseEvent {
  data?: {
    isPaused?: boolean;
  };
}

function updatePlayPauseUI(e: PlaybackPlayPauseEvent): void {
  if (!ActivePlaybackControlsInstance) return;

  const playbackControls = ActivePlaybackControlsInstance.GetElement();
  const playPauseButton = playbackControls?.querySelector('.PlayStateToggle');

  if (!playPauseButton) return;

  const isPaused = e?.data?.isPaused;
  const svg = playPauseButton.querySelector('svg');

  if (isPaused) {
    playPauseButton.classList.remove('Playing');
    playPauseButton.classList.add('Paused');
    if (svg) svg.innerHTML = Icons.Play;
  } else {
    playPauseButton.classList.remove('Paused');
    playPauseButton.classList.add('Playing');
    if (svg) svg.innerHTML = Icons.Pause;
  }
}

/**
 * Updates the progress bar state with current position
 */
function updateProgressBarState(): void {
  if (!ActiveSetupSongProgressBarInstance) return;

  const actualPosition = SpotifyPlayer.GetTrackPosition() || 0;

  // Update tracking variables
  progressBarState.lastKnownPosition = actualPosition;
  progressBarState.lastUpdateTime = performance.now();

  // Update UI
  const updateTimelineState = progressBarState.updateTimelineState_Function;
  if (updateTimelineState) {
    updateTimelineState(actualPosition);
  }
}

/**
 * Handles loop state changes by updating UI
 */
function handleLoopEvent(e: 'none' | 'context' | 'track'): void {
  if (!Fullscreen.IsOpen || !ActivePlaybackControlsInstance) return;

  const playbackControls = ActivePlaybackControlsInstance.GetElement();
  const loopButton = playbackControls.querySelector('.LoopToggle');
  if (!loopButton) return;

  const svg = loopButton.querySelector('svg');
  if (!svg) return;

  // Reset styles first
  svg.style.filter = '';

  // Update icon based on loop state
  svg.innerHTML = e === 'track' ? Icons.LoopTrack : Icons.Loop;

  // Update visual state
  if (e !== 'none') {
    loopButton.classList.add('Enabled');
    svg.style.filter = 'drop-shadow(0 0 5px white)';
  } else {
    loopButton.classList.remove('Enabled');
  }
}

/**
 * Handles shuffle state changes by updating UI
 */
function handleShuffleEvent(e: 'none' | 'normal'): void {
  if (!Fullscreen.IsOpen || !ActivePlaybackControlsInstance) return;

  const playbackControls = ActivePlaybackControlsInstance.GetElement();
  const shuffleButton = playbackControls.querySelector('.ShuffleToggle');
  if (!shuffleButton) return;

  const svg = shuffleButton.querySelector('svg');
  if (!svg) return;

  // Reset styles first
  svg.style.filter = '';

  // Update visual state
  if (e !== 'none') {
    shuffleButton.classList.add('Enabled');
    svg.style.filter = 'drop-shadow(0 0 5px white)';
  } else {
    shuffleButton.classList.remove('Enabled');
  }
}

/**
 * Handles position and progress updates
 * Only processes updates when in fullscreen mode
 */
function handlePositionUpdate(e: number | { data?: number }): void {
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
    // Only update if position actually changed
    if (progressBarState.lastKnownPosition !== position) {
      progressBarState.lastKnownPosition = position;
      progressBarState.lastUpdateTime = performance.now();

      // Only update UI if not in the middle of interpolation
      const lastInterpolationUpdate = progressBarState.lastInterpolationUpdate || 0;
      if (performance.now() - lastInterpolationUpdate > 500) {
        const updateTimelineState = progressBarState.updateTimelineState_Function;
        if (updateTimelineState) {
          updateTimelineState(position);
        }
      }
    }
  }
}

export {
  OpenNowBar,
  CloseNowBar,
  UpdateNowBar,
  Session_OpenNowBar,
  NowBar_SwapSides,
  Session_NowBar_SetSide,
  DeregisterNowBarBtn,
};
