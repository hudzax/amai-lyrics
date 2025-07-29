import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import fastdom from '../../utils/fastdom';
import storage from '../../utils/storage';
import { removeLyricsFromCache } from '../../utils/Lyrics/cache';
import fetchLyrics from '../../utils/Lyrics/fetchLyrics';
import ApplyLyrics from '../../utils/Lyrics/Global/Applyer';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';

export function setupActionButtons(maid: Maid | null) {
    setupRefreshButton(maid);
    setupReleaseLogsButton(maid);
    setupWatchMusicVideoButton(maid);
}

function setupRefreshButton(maid: Maid | null) {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (!refreshButton) return;

  const clickHandler = async () => {
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (!currentUri) {
      Spicetify.showNotification('No track playing', false, 1000);
      return;
    }

    await fastdom.write(() => {
      refreshButton.classList.add('hidden');
    });

    try {
      const trackId = currentUri.split(':')[2];
      removeLyricsFromCache(trackId);
      storage.set('currentLyricsData', null);
      const lyrics = await fetchLyrics(currentUri);
      ApplyLyrics(lyrics);
    } catch (error) {
      console.error('Error refreshing lyrics:', error);
      Spicetify.showNotification('Error refreshing lyrics', false, 2000);
    }
  };

  refreshButton.addEventListener('click', clickHandler);
  maid?.Give(() => refreshButton.removeEventListener('click', clickHandler));
}

function setupWatchMusicVideoButton(maid: Maid | null) {
  const watchMusicVideoButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.WatchMusicVideoButton,
  );
  if (!watchMusicVideoButton) return;

  const clickHandler = async () => {
    const songName = await SpotifyPlayer.GetSongName();
    const artists = await SpotifyPlayer.GetArtists();

    if (!songName || !artists || artists.length === 0) {
      Spicetify.showNotification('No track playing or artist information available', false, 1000);
      return;
    }

    const artistNames = SpotifyPlayer.JoinArtists(artists);
    const searchQuery = encodeURIComponent(`${artistNames} ${songName} music video`);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

    window.open(youtubeUrl, '_blank');
  };

  watchMusicVideoButton.addEventListener('click', clickHandler);
  maid?.Give(() => watchMusicVideoButton.removeEventListener('click', clickHandler));
}

function setupReleaseLogsButton(maid: Maid | null) {
  const releaseLogsButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.ReleaseLogsButton,
  );
  if (!releaseLogsButton) return;

  const clickHandler = () => {
    window.open('https://github.com/hudzax/amai-lyrics/releases', '_blank');
  };

  releaseLogsButton.addEventListener('click', clickHandler);
  maid?.Give(() => releaseLogsButton.removeEventListener('click', clickHandler));
}

export function showRefreshButton() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (refreshButton) {
    fastdom.write(() => {
      refreshButton.classList.remove('hidden');
    });
  }
}

export function hideRefreshButton() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (refreshButton) {
    fastdom.write(() => {
      refreshButton.classList.add('hidden');
    });
  }
}
