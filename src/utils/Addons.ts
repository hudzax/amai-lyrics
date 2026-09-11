function IsPlaying(): boolean {
  // Prefer the maintained public API; fall back to memory state so a client
  // update that changes one source cannot freeze play-state detection.
  try {
    if (typeof Spicetify?.Player?.isPlaying === 'function') {
      return !!Spicetify.Player.isPlaying();
    }
  } catch {
    // fall through to data check
  }
  try {
    const paused = Spicetify?.Player?.data?.isPaused;
    if (typeof paused === 'boolean') return !paused;
  } catch {
    // ignore
  }
  return false;
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
