/**
 * UI-related functions for Amai Lyrics
 */

import { OpenNowBar, DeregisterNowBarBtn } from '../../components/NowBar/NowBar';
import PageView from '../../components/Pages/PageView';
import Fullscreen from '../../components/Utils/Fullscreen';
import { showRefreshButton } from '../../components/Pages/pageButtons';
import { liveTrackId } from './trackId';
import { clear } from './registry';

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

/**
 * Called on teardown and on page (re)creation, so no orphan timeout survives to
 * hold detached DOM or paint a loader no request is left to hide.
 */
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
  const lyricsContent = document.querySelector('#AmaiLyricsPage .LyricsContainer .LyricsContent');
  if (lyricsContent?.classList.contains('offline')) {
    lyricsContent.classList.remove('offline');
  }

  document
    .querySelector('#AmaiLyricsPage .ContentBox .LyricsContainer')
    ?.classList.remove('Hidden');

  if (!Fullscreen.isPageFullscreen()) PageView.AppendViewControls();
}

/**
 * Runs the negative result's page-visible transitions: empty the container,
 * reset the registry, hide the lyrics area, hand the page to NowBar, and show
 * the refresh button. Builds nothing and returns nothing — the sentinel is the
 * producer's (api, cache, snapshot, the fetch entry), and whether it persists
 * is the publication seam's decision.
 *
 * @param trackId - Spotify track ID (optional). The transitions run only when
 *   the negative is for the track the player is on.
 */
export async function noLyricsMessage(trackId?: string): Promise<void> {
  try {
    const currentId = liveTrackId();
    const isForCurrentTrack = !trackId || currentId === trackId;
    if (isForCurrentTrack) {
      HideLoaderContainer();
      // Empty the container first: it detaches the painted rows without
      // telling the registry. The reset below is what stops the highlight
      // tick from writing statuses into elements no longer in the page, and
      // cancels a scroll in flight towards one.
      ClearLyricsPageContainer();
      clear();
      document
        .querySelector<HTMLElement>('#AmaiLyricsPage .ContentBox .LyricsContainer')
        ?.classList.add('Hidden');
      document
        .querySelector<HTMLElement>('#AmaiLyricsPage .ContentBox')
        ?.classList.add('LyricsHidden');
      OpenNowBar();
      DeregisterNowBarBtn();
      // Show refresh button so user can try again
      showRefreshButton();
    }
  } catch (error) {
    console.error('Amai Lyrics: Error showing no lyrics message', error);
  }
}

/**
 * Shows the loader container
 */
export function ShowLoaderContainer(): void {
  const loaderContainer = document.querySelector(
    '#AmaiLyricsPage .LyricsContainer .loaderContainer',
  );
  if (!loaderContainer) return;
  // A superseded request may have left a pending delayed-show behind. Clear
  // it first: otherwise its callback fires after the current request's Hide
  // and re-adds `.active`, sticking the overlay on top of loaded lyrics.
  const pending = ContainerShowLoaderTimeout ?? uiState.containerShowLoaderTimeout;
  if (pending) {
    clearTimeout(pending);
    syncLoaderTimeout(null);
  }
  if (loaderContainer.classList.contains('active')) return;
  const id = window.setTimeout(() => {
    syncLoaderTimeout(null);
    // Re-query instead of closing over the element found above: the page is
    // recreated on open, so a captured node may be detached by fire time.
    document
      .querySelector('#AmaiLyricsPage .LyricsContainer .loaderContainer')
      ?.classList.add('active');
  }, 1000);
  syncLoaderTimeout(id as unknown as number);
}

/**
 * Hides the loader container
 */
export function HideLoaderContainer(): void {
  // Always drop the pending delayed-show, even when the page isn't mounted:
  // a Show from before a page recreation must never fire onto the new page
  // after the lyrics already landed.
  const pending = ContainerShowLoaderTimeout ?? uiState.containerShowLoaderTimeout;
  if (pending) {
    clearTimeout(pending);
    syncLoaderTimeout(null);
  }
  document
    .querySelector('#AmaiLyricsPage .LyricsContainer .loaderContainer')
    ?.classList.remove('active');
}

/**
 * Clears the lyrics container content
 */
export function ClearLyricsPageContainer(): void {
  const lyricsContent = document.querySelector('#AmaiLyricsPage .LyricsContainer .LyricsContent');
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
      '#AmaiLyricsPage .LyricsContainer .processingIndicator',
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
      '#AmaiLyricsPage .LyricsContainer .processingIndicator',
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
