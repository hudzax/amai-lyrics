import { Icons } from '../Styling/Icons';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { ComponentInstance, EventHandlerMap } from './types';

/**
 * Creates and sets up playback controls with event handlers
 * @returns ComponentInstance with methods to apply, clean up, and get the element
 */
export const SetupPlaybackControls = (AppendQueue: HTMLElement[]): ComponentInstance => {
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
