function IsPlaying() {
  const state = Spicetify?.Player?.data?.isPaused;
  return !state;
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
