import { SongProgressBar } from '../../utils/Lyrics/SongProgressBar';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import Fullscreen from '../Utils/Fullscreen';
import { progressBarState } from './state';
import { ComponentInstance } from './types';

/**
 * Creates and sets up the song progress bar with event handlers and update interval
 * @returns ComponentInstance with methods to apply, clean up, and get the element
 */
export const SetupSongProgressBar = (AppendQueue: HTMLElement[]): ComponentInstance => {
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
