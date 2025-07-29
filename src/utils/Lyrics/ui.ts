/**
 * UI-related functions for Amai Lyrics
 */

import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import { OpenNowBar, DeregisterNowBarBtn } from '../../components/Utils/NowBar';
import PageView from '../../components/Pages/PageView';
import Fullscreen from '../../components/Utils/Fullscreen';
import { showRefreshButton } from '../../components/Pages/pageButtons';

let ContainerShowLoaderTimeout: number | null = null;

/**
 * Resets the lyrics UI
 */
export function resetLyricsUI(): void {
  const lyricsContent = document.querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent');
  if (lyricsContent?.classList.contains('offline')) {
    lyricsContent.classList.remove('offline');
  }

  document
    .querySelector('#SpicyLyricsPage .ContentBox .LyricsContainer')
    ?.classList.remove('Hidden');

  if (!Fullscreen.IsOpen) PageView.AppendViewControls();
}

/**
 * Shows a message when no lyrics are available
 *
 * @param trackId - Spotify track ID (optional)
 * @returns Status code string
 */
export async function noLyricsMessage(trackId?: string): Promise<string> {
  try {
    storage.set('currentlyFetching', 'false');
    if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
      Spicetify.showNotification('Lyrics unavailable', false, 1000);
      HideLoaderContainer();
      Defaults.CurrentLyricsType = 'None';
      document
        .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox .LyricsContainer')
        ?.classList.add('Hidden');
      document
        .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
        ?.classList.add('LyricsHidden');
      OpenNowBar();
      DeregisterNowBarBtn();
      // Show refresh button so user can try again
      showRefreshButton();
    }
  } catch (error) {
    console.error('Amai Lyrics: Error showing no lyrics message', error);
    storage.set('currentlyFetching', 'false');
  }

  return '1';
}

/**
 * Shows the loader container
 */
export function ShowLoaderContainer(): void {
  const loaderContainer = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .loaderContainer',
  );
  if (loaderContainer) {
    ContainerShowLoaderTimeout = window.setTimeout(
      () => loaderContainer.classList.add('active'),
      1000,
    );
  }
}

/**
 * Hides the loader container
 */
export function HideLoaderContainer(): void {
  const loaderContainer = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .loaderContainer',
  );
  if (loaderContainer) {
    if (ContainerShowLoaderTimeout) {
      clearTimeout(ContainerShowLoaderTimeout);
      ContainerShowLoaderTimeout = null;
    }
    loaderContainer.classList.remove('active');
  }
}

/**
 * Clears the lyrics container content
 */
export function ClearLyricsPageContainer(): void {
  const lyricsContent = document.querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent');
  if (lyricsContent) {
    lyricsContent.innerHTML = '';
  }
}
