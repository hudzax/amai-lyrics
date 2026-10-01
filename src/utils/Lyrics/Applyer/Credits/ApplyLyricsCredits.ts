export function ApplyLyricsCredits(data: { songWriters?: string[] }) {
  const LyricsContainer = document.querySelector('#AmaiLyricsPage .LyricsContainer .LyricsContent');
  // Missing page container means nothing to append into — skip rather than crash.
  if (!data?.songWriters || !LyricsContainer) return;
  const CreditsElement = document.createElement('div');
  CreditsElement.classList.add('Credits');

  const SongWriters = data.songWriters.join(', ');
  CreditsElement.textContent = `Credits: ${SongWriters}`;
  LyricsContainer.appendChild(CreditsElement);
}
