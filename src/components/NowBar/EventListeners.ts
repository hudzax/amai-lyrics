import Global from '../Global/Global';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { Icons } from '../Styling/Icons';
import Fullscreen from '../Utils/Fullscreen';
import {
  ActivePlaybackControlsInstance,
  ActiveSetupSongProgressBarInstance,
  progressBarState,
  setActivePlaybackControlsInstance,
  setActiveSetupSongProgressBarInstance,
} from './state';
import { PlaybackPlayPauseEvent } from './types';

/**
 * Set up all event listeners for playback events
 */
export function setupEventListeners() {
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
}

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

/**
 * Cleans up all active component instances and removes elements from the DOM
 */
export function CleanUpActiveComponents() {
  // Clean up playback controls
  if (ActivePlaybackControlsInstance) {
    ActivePlaybackControlsInstance.CleanUp();
    setActivePlaybackControlsInstance(null);
  }

  // Clean up song progress bar
  if (ActiveSetupSongProgressBarInstance) {
    ActiveSetupSongProgressBarInstance.CleanUp();
    setActiveSetupSongProgressBarInstance(null);
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
