import { SongProgressBar } from '../../utils/Lyrics/SongProgressBar';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';

/** Internal NowBar renderer: no clock, shared state, or global subscriptions. */
export function createProgressBar() {
  const model = new SongProgressBar();
  const element = document.createElement('div');
  element.className = 'Timeline';
  const positionText = document.createElement('span');
  positionText.className = 'Time Position';
  const slider = document.createElement('div');
  slider.className = 'SliderBar';
  const handle = document.createElement('div');
  handle.className = 'Handle';
  slider.appendChild(handle);
  const durationText = document.createElement('span');
  durationText.className = 'Time Duration';
  element.append(positionText, slider, durationText);
  let destroyed = false;

  // The nowbar tick runs at 10 Hz, but the formatted position advances at most
  // once a second and the duration essentially never. Assigning textContent
  // invalidates the node even when the string is identical, so each write is
  // compared against the last value this closure put there. The model is still
  // updated every tick — it is plain arithmetic, and the guards read from it.
  let lastProgress: number | null = null;
  let lastPositionText: string | null = null;
  let lastDurationText: string | null = null;

  const render = (position: number) => {
    if (destroyed || !Number.isFinite(position)) return;
    model.Update({
      duration: SpotifyPlayer.GetTrackDuration() ?? 0,
      position: Math.max(0, position),
    });
    const progress = model.GetProgressPercentage();
    if (progress !== lastProgress) {
      lastProgress = progress;
      slider.style.setProperty('--SliderProgress', String(progress));
    }
    const positionLabel = model.GetFormattedPosition();
    if (positionLabel !== lastPositionText) {
      lastPositionText = positionLabel;
      positionText.textContent = positionLabel;
    }
    const durationLabel = model.GetFormattedDuration();
    if (durationLabel !== lastDurationText) {
      lastDurationText = durationLabel;
      durationText.textContent = durationLabel;
    }
  };
  const seek = (event: MouseEvent) => {
    if (destroyed || !element.isConnected || slider.getBoundingClientRect().width <= 0) return;
    const position = model.CalculatePositionFromClick({ sliderBar: slider, event });
    if (!Number.isFinite(position)) return;
    SpotifyPlayer.Seek(position);
    render(position);
  };
  slider.addEventListener('click', seek);

  return {
    element,
    render,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      slider.removeEventListener('click', seek);
      model.Destroy();
      element.remove();
    },
  };
}
