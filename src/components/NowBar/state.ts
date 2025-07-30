import { ComponentInstance, ProgressBarState } from './types';

// Track instances of components for cleanup and state management
export let ActivePlaybackControlsInstance: ComponentInstance | null = null;
export const progressBarState: ProgressBarState = {
  lastKnownPosition: 0,
  lastUpdateTime: 0,
};
export let ActiveSetupSongProgressBarInstance: ComponentInstance | null = null;

export function setActivePlaybackControlsInstance(instance: ComponentInstance | null) {
  ActivePlaybackControlsInstance = instance;
}

export function setActiveSetupSongProgressBarInstance(instance: ComponentInstance | null) {
  ActiveSetupSongProgressBarInstance = instance;
}
