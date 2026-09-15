import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import fastdom from 'fastdom';
import { refreshLyrics } from '../../utils/Lyrics/fetchLyrics';
import { openYouTubeSearch } from '../../utils/externalNavigation';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { openAmaiSettingsModal } from './SettingsModal';

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

    // Synchronous hide: click feedback shouldn't wait a frame, and a single
    // classList write doesn't need batching.
    refreshButton.classList.add('hidden');

    try {
      // Refresh seam owns cache eviction, snapshot clear, and forced
      // refetch — callers never split the URI or touch cache/storage.
      await refreshLyrics(currentUri);
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
    if (!openYouTubeSearch(`${artistNames} ${songName} music video`)) {
      Spicetify.showNotification('Unable to open YouTube search', false, 2000);
    }
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
    openAmaiSettingsModal();
  };

  settingsButton.addEventListener('click', clickHandler);
  maid?.Give(() => settingsButton.removeEventListener('click', clickHandler));
}

export function showRefreshButton() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (refreshButton) {
    fastdom.mutate(() => {
      refreshButton.classList.remove('hidden');
    });
  }
}

export function hideRefreshButton() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    PageViewSelectors.RefreshLyricsButton,
  );
  if (refreshButton) {
    fastdom.mutate(() => {
      refreshButton.classList.add('hidden');
    });
  }
}
