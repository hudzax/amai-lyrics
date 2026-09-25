export function ApplyLyricsCredits(data: { songWriters?: string[] }) {
  const LyricsContainer = document.querySelector('#AmaiLyricsPage .LyricsContainer .LyricsContent');
  if (!data?.songWriters) return;
  const CreditsElement = document.createElement('div');
  CreditsElement.classList.add('Credits');

  const SongWriters = data.songWriters.join(', ');
  CreditsElement.textContent = `Credits: ${SongWriters}`;
  LyricsContainer.appendChild(CreditsElement);
}
