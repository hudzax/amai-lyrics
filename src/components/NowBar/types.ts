import { SongProgressBar } from '../../utils/Lyrics/SongProgressBar';

// Define types for better type safety
export interface ComponentInstance {
  Apply: () => void;
  CleanUp: () => void;
  GetElement: () => HTMLElement;
}

// Define custom types for elements with added properties
export interface DraggableElement extends HTMLElement {
  _dragEventsAdded?: boolean;
}

export interface DroppableElement extends Element {
  _dropEventsAdded?: boolean;
}

// Define types for event handlers
export interface EventHandlerMap {
  pressHandlers: Map<Element, EventListener>;
  releaseHandlers: Map<Element, EventListener>;
  clickHandlers: Map<Element, EventListener>;
}

// Define types for progress bar state
export interface ProgressBarState {
  lastKnownPosition: number;
  lastUpdateTime: number;
  lastInterpolationUpdate?: number;
  updateInterval?: ReturnType<typeof setInterval>;
  updateTimelineState_Function?: (position?: number | null) => void;
  SongProgressBar_ClassInstance?: SongProgressBar;
  TimeLineElement?: HTMLElement;
}

export interface PlaybackPlayPauseEvent {
  data?: {
    isPaused?: boolean;
  };
}
