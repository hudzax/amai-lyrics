export function ApplyLyricsCredits(data: { SongWriters?: string[] }) {
  const LyricsContainer = document.querySelector('#AmaiLyricsPage .LyricsContainer .LyricsContent');
  if (!data?.SongWriters) return;
  const CreditsElement = document.createElement('div');
  CreditsElement.classList.add('Credits');

  const SongWriters = data.SongWriters.join(', ');
  CreditsElement.textContent = `Credits: ${SongWriters}`;
  LyricsContainer.appendChild(CreditsElement);
}
