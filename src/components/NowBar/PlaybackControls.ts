import { Icons } from '../Styling/Icons';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';

/** Owns control rendering and DOM listeners; the NowBar owner delivers observations via refresh. */
export function createPlaybackControls(): {
  element: HTMLElement;
  refresh: () => void;
  destroy: () => void;
} {
  const element = document.createElement('div');
  element.className = 'PlaybackControls';
  // Trusted bundled markup. Skip icons already include their control wrappers.
  element.innerHTML = `
    <div class="PlaybackControl ShuffleToggle"></div>
    ${Icons.PrevTrack}
    <div class="PlaybackControl PlayStateToggle"></div>
    ${Icons.NextTrack}
    <div class="PlaybackControl LoopToggle"></div>
  `;
  const play = element.querySelector<HTMLElement>('.PlayStateToggle')!;
  const shuffle = element.querySelector<HTMLElement>('.ShuffleToggle')!;
  const loop = element.querySelector<HTMLElement>('.LoopToggle')!;
  const controls = element.querySelectorAll<HTMLElement>('.PlaybackControl');
  const disposers: (() => void)[] = [];
  let destroyed = false;

  // Optimism belongs to this view, never to the shared player observations.
  let playing: boolean;
  let loopType: string;
  let shuffleType: string;

  function renderIcon(control: HTMLElement, icon: string, enabled = false): void {
    // Icons are complete SVGs: replace the wrapper's content, not an SVG's innerHTML.
    control.innerHTML = icon;
    control.querySelector('svg')!.style.filter = enabled ? 'drop-shadow(0 0 5px white)' : '';
  }

  function render(): void {
    play.classList.toggle('Playing', playing);
    play.classList.toggle('Paused', !playing);
    shuffle.classList.toggle('Enabled', shuffleType !== 'none');
    loop.classList.toggle('Enabled', loopType !== 'none');
    renderIcon(play, playing ? Icons.Pause : Icons.Play);
    renderIcon(shuffle, Icons.Shuffle, shuffleType !== 'none');
    renderIcon(loop, loopType === 'track' ? Icons.LoopTrack : Icons.Loop, loopType !== 'none');
  }

  function refresh(): void {
    if (destroyed) return;
    playing = SpotifyPlayer.IsPlaying;
    loopType = SpotifyPlayer.LoopType;
    shuffleType = SpotifyPlayer.ShuffleType;
    render();
  }

  function listen(control: Element, type: string, handler: EventListener): void {
    control.addEventListener(type, handler);
    disposers.push(() => control.removeEventListener(type, handler));
  }

  controls.forEach((control) => {
    const press = () => control.classList.add('Pressed');
    const release = () => control.classList.remove('Pressed');
    for (const type of ['mousedown', 'touchstart']) listen(control, type, press);
    for (const type of ['mouseup', 'mouseleave', 'touchend']) listen(control, type, release);
  });

  listen(play, 'click', () => {
    playing = !playing;
    render();
    if (playing) SpotifyPlayer.Play();
    else SpotifyPlayer.Pause();
  });
  listen(shuffle, 'click', () => {
    shuffleType = shuffleType === 'none' ? 'normal' : 'none';
    render();
    Spicetify.Player.setShuffle(shuffleType !== 'none');
  });
  listen(loop, 'click', () => {
    loopType = loopType === 'none' ? 'context' : loopType === 'context' ? 'track' : 'none';
    render();
    Spicetify.Player.setRepeat(loopType === 'context' ? 1 : loopType === 'track' ? 2 : 0);
  });
  listen(element.querySelector('.PrevTrack')!, 'click', () => SpotifyPlayer.Skip.Prev());
  listen(element.querySelector('.NextTrack')!, 'click', () => SpotifyPlayer.Skip.Next());

  refresh();
  return {
    element,
    refresh,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      disposers.splice(0).forEach((dispose) => dispose());
      controls.forEach((control) => control.classList.remove('Pressed'));
      element.remove();
    },
  };
}
