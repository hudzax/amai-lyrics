import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import fastdom from 'fastdom';
import storage from '../../utils/storage';
import { removeLyricsFromCache } from '../../utils/Lyrics/cache';
import fetchLyrics from '../../utils/Lyrics/fetchLyrics';
import ApplyLyrics from '../../utils/Lyrics/Global/Applyer';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';

export function setupActionButtons(maid: Maid | null) {
  setupRefreshButton(maid);
  setupWatchMusicVideoButton(maid);
  setupSettingsButton(maid);
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

    await new Promise<void>((resolve) => {
      fastdom.mutate(() => {
        refreshButton.classList.add('hidden');
        resolve();
      });
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

function setupSettingsButton(maid: Maid | null) {
  const settingsButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.SettingsButton,
  );
  if (!settingsButton) return;

  const clickHandler = () => {
    Spicetify.Platform.History.push('/preferences');
  };

  settingsButton.addEventListener('click', clickHandler);
  maid?.Give(() => settingsButton.removeEventListener('click', clickHandler));
}

export function showRefreshButton() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (refreshButton) {
    new Promise<void>((resolve) => {
      fastdom.mutate(() => {
        refreshButton.classList.remove('hidden');
        resolve();
      });
    });
  }
}

export function hideRefreshButton() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (refreshButton) {
    new Promise<void>((resolve) => {
      fastdom.mutate(() => {
        refreshButton.classList.add('hidden');
        resolve();
      });
    });
  }
}
