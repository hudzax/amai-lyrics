export let IsMouseInLyricsPage = false;

export function LyricsPageMouseEnter() {
  IsMouseInLyricsPage = true;
}

export function LyricsPageMouseLeave() {
  IsMouseInLyricsPage = false;
}

export function SetIsMouseInLyricsPage(value: boolean) {
  IsMouseInLyricsPage = value;
}
