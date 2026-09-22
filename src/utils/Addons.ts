import { resolveIsPlaying } from './Gets/GetProgress';

function IsPlaying(): boolean {
  // Legacy alias over the PlaybackTime seam: the live play-state read lives in
  // GetProgress.resolveIsPlaying (public API with memory fallback). Kept as a
  // named entry so the init path keeps crossing a stable interface.
  return resolveIsPlaying();
}

function TOP_ApplyLyricsSpacer(Container: HTMLElement) {
  const div = document.createElement('div');
  div.classList.add('TopSpacer');
  Container.appendChild(div);
}

function BOTTOM_ApplyLyricsSpacer(Container: HTMLElement) {
  const div = document.createElement('div');
  div.classList.add('BottomSpacer');
  Container.appendChild(div);
}

export const ArabicPersianRegex = /[\u0600-\u06FF]/;

export { IsPlaying, TOP_ApplyLyricsSpacer, BOTTOM_ApplyLyricsSpacer };
