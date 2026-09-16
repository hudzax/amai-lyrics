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

  const render = (position: number) => {
    if (destroyed || !Number.isFinite(position)) return;
    model.Update({
      duration: SpotifyPlayer.GetTrackDuration() ?? 0,
      position: Math.max(0, position),
    });
    slider.style.setProperty('--SliderProgress', String(model.GetProgressPercentage()));
    positionText.textContent = model.GetFormattedPosition();
    durationText.textContent = model.GetFormattedDuration();
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
