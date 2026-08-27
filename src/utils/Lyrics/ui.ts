/**
 * UI-related functions for Amai Lyrics
 */

import Defaults from '../../components/Global/Defaults';
import { OpenNowBar, DeregisterNowBarBtn } from '../../components/Utils/NowBar';
import PageView from '../../components/Pages/PageView';
import Fullscreen from '../../components/Utils/Fullscreen';
import { showRefreshButton } from '../../components/Pages/pageButtons';

// Window-persisted so hot-reload doesn't orphan timeout holding detached DOM.
const windowRef = window as unknown as {
  __amaiLyricsUiState?: { containerShowLoaderTimeout: number | null };
};
const uiState = (windowRef.__amaiLyricsUiState ??= { containerShowLoaderTimeout: null });

// Keep module variable in sync with window state for backward compat
let ContainerShowLoaderTimeout: number | null = uiState.containerShowLoaderTimeout;

function syncLoaderTimeout(value: number | null): void {
  ContainerShowLoaderTimeout = value;
  uiState.containerShowLoaderTimeout = value;
}

/** Called on teardown to avoid orphan timeout holding detached DOM. */
export function clearLyricsUiTimeouts(): void {
  // Check both module var and window state (covers timeout set by previous injection)
  const timeoutId = ContainerShowLoaderTimeout ?? uiState.containerShowLoaderTimeout;
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    syncLoaderTimeout(null);
  }
  if (window.ProcessingIndicatorTimeout) {
    clearTimeout(window.ProcessingIndicatorTimeout);
    window.ProcessingIndicatorTimeout = null;
  }
}

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

export interface NoLyricsResult {
  status: 'NO_LYRICS';
  id?: string;
}

/**
 * Shows a message when no lyrics are available
 *
 * @param trackId - Spotify track ID (optional)
 * @returns Typed sentinel instead of magic string
 */
export async function noLyricsMessage(trackId?: string): Promise<NoLyricsResult> {
  try {
    const currentId = Spicetify.Player.data?.item?.uri?.split(':')[2];
    const isForCurrentTrack = !trackId || currentId === trackId;
    if (isForCurrentTrack) {
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
      // Persist sentinel so subsequent localStorage checks and Fullscreen
      // detection know this track has no lyrics (without this, they see
      // stale lyrics from previous track).
      if (trackId) {
        try {
          const { default: storage } = await import('../storage');
          storage.set('currentLyricsData', JSON.stringify({ status: 'NO_LYRICS', id: trackId }));
        } catch {
          /* ignore storage failure */
        }
      }
    }
  } catch (error) {
    console.error('Amai Lyrics: Error showing no lyrics message', error);
  }

  return { status: 'NO_LYRICS', id: trackId };
}

/**
 * Shows the loader container
 */
export function ShowLoaderContainer(): void {
  const loaderContainer = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .loaderContainer',
  );
  if (loaderContainer) {
    const id = window.setTimeout(() => loaderContainer.classList.add('active'), 1000);
    syncLoaderTimeout(id as unknown as number);
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
    const timeoutId = ContainerShowLoaderTimeout ?? uiState.containerShowLoaderTimeout;
    if (timeoutId) {
      clearTimeout(timeoutId);
      syncLoaderTimeout(null);
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

/**
 * Shows the processing indicator for phonetic/translation processing
 */
export function ShowProcessingIndicator(): void {
  try {
    const indicator = document.querySelector(
      '#SpicyLyricsPage .LyricsContainer .processingIndicator',
    );
    if (indicator) {
      // Clear any existing timeout to prevent flickering
      if (window.ProcessingIndicatorTimeout) {
        clearTimeout(window.ProcessingIndicatorTimeout);
        window.ProcessingIndicatorTimeout = null;
      }
      indicator.classList.add('active');
    }
  } catch (error) {
    console.error('Amai Lyrics: Error showing processing indicator', error);
  }
}

/**
 * Hides the processing indicator
 */
export function HideProcessingIndicator(): void {
  try {
    const indicator = document.querySelector(
      '#SpicyLyricsPage .LyricsContainer .processingIndicator',
    );
    if (indicator) {
      indicator.classList.remove('active');
    }
  } catch (error) {
    console.error('Amai Lyrics: Error hiding processing indicator', error);
  }
}

/**
 * Ensures processing indicator is hidden (with timeout fallback)
 * Used as a safety measure to prevent stuck indicators
 */
export function EnsureProcessingIndicatorHidden(): void {
  // Hide immediately if visible
  HideProcessingIndicator();

  // Set timeout to ensure it gets hidden even if something goes wrong
  if (window.ProcessingIndicatorTimeout) {
    clearTimeout(window.ProcessingIndicatorTimeout);
  }
  window.ProcessingIndicatorTimeout = setTimeout(() => {
    HideProcessingIndicator();
    window.ProcessingIndicatorTimeout = null;
  }, 5000); // 5 second safety timeout
}
