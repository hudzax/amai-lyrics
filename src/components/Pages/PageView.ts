import fetchLyrics from '../../utils/Lyrics/fetchLyrics';
import '../../css/Loaders/DotLoader.css';
import { removeLinesEvListener } from '../../utils/Lyrics/lyrics';
import ApplyDynamicBackground from '../DynamicBG/dynamicBackground';
import Defaults from '../Global/Defaults';
import { Icons } from '../Styling/Icons';
import { ScrollSimplebar } from '../../utils/Scrolling/Simplebar/ScrollSimplebar';
import ApplyLyrics from '../../utils/Lyrics/Global/Applyer';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { Session_NowBar_SetSide, Session_OpenNowBar } from '../Utils/NowBar';
import Fullscreen from '../Utils/Fullscreen';
import TransferElement from '../Utils/TransferElement';
import Session from '../Global/Session';
import { ResetLastLine } from '../../utils/Scrolling/ScrollToActiveLine';
import fastdom from '../../utils/fastdom';
import storage from '../../utils/storage';
import { removeLyricsFromCache } from '../../utils/Lyrics/cache';
import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import { PageHTML, NowBarHTML } from './PageHTML';

interface ImageElementWithSetup extends HTMLImageElement {
  _setupImageLoading?: boolean;
}

export const Tooltips = {
  Close: null,
  Kofi: null,
  FullscreenToggle: null,
  LyricsToggle: null,
};

// Maid for managing event listeners and cleanup
let maid: Maid | null = null;

const PageView = {
  Open: OpenPage,
  Destroy: DestroyPage,
  AppendViewControls,
  UpdatePageContent,
  IsOpened: false,
};

export let PageRoot: HTMLElement | null = null;
fastdom.read(() => {
  PageRoot = document.querySelector<HTMLElement>(PageViewSelectors.PageRoot);
});

async function OpenPage() {
  if (PageView.IsOpened) return;

  // Create fresh maid instance for this page session
  maid = new Maid();

  await createPageElement();

  Defaults.LyricsContainerExists = true;

  const contentBox = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
  if (contentBox) {
    await ApplyDynamicBackground(contentBox);
  }

  const mediaImage = document.querySelector<HTMLImageElement>(PageViewSelectors.MediaImage);
  if (mediaImage) {
    setupImageLoading(mediaImage);
  }

  await UpdatePageContent();

  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    fetchLyrics(currentUri).then(ApplyLyrics);
  }

  Session_OpenNowBar();
  Session_NowBar_SetSide();

  await AppendViewControls();

  setupRefreshButton();
  setupReleaseLogsButton();
  setupWatchMusicVideoButton();

  PageView.IsOpened = true;
}

async function createPageElement() {
  let elem: HTMLDivElement;
  await fastdom.write(() => {
    elem = document.createElement('div');
    elem.id = 'SpicyLyricsPage';
    elem.innerHTML = PageHTML;
    if (PageRoot) PageRoot.appendChild(elem);
  });

  const nowBar = document.querySelector<HTMLElement>(PageViewSelectors.NowBar);
  if (nowBar) {
    nowBar.innerHTML = NowBarHTML;
  }
}

async function DestroyPage() {
  if (!PageView.IsOpened) return;
  if (Fullscreen.IsOpen) Fullscreen.Close();
  const spicyLyricsPage = document.querySelector<HTMLElement>(PageViewSelectors.SpicyLyricsPage);
  if (!spicyLyricsPage) return;
  await fastdom.write(() => {
    spicyLyricsPage?.remove();
  });
  Defaults.LyricsContainerExists = false;
  removeLinesEvListener();
  Object.values(Tooltips).forEach((a) => a?.destroy());
  ResetLastLine();
  ScrollSimplebar?.unMount();
  // Clean up all event listeners managed by the maid
  maid?.CleanUp();
  maid = null;
  PageView.IsOpened = false;
}

async function AppendViewControls(ReAppend: boolean = false) {
  const elem = document.querySelector<HTMLElement>(PageViewSelectors.ViewControls);
  if (!elem) return;
  await fastdom.write(() => {
    if (ReAppend) elem.innerHTML = '';
    elem.innerHTML = `
          <button id="Close" class="ViewControl">${Icons.Close}</button>
          <button id="FullscreenToggle" class="ViewControl">${
            Fullscreen.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen
          }</button>
      `;
  });

  if (Fullscreen.IsOpen) {
    const headerElem = document.querySelector<HTMLElement>(PageViewSelectors.Header);
    if (headerElem) {
      await fastdom.write(() => {
        TransferElement(elem, headerElem, 0);
      });
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    const viewControlsElem = document.querySelector<HTMLElement>(
      PageViewSelectors.HeaderViewControls,
    );
    SetupTippy(viewControlsElem);
  } else {
    const headerViewControlsElem = document.querySelector<HTMLElement>(
      PageViewSelectors.HeaderViewControls,
    );
    if (headerViewControlsElem) {
      const contentBoxElem = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
      if (contentBoxElem) {
        await fastdom.write(() => {
          TransferElement(elem, contentBoxElem);
        });
      }
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    SetupTippy(elem);
  }

  function SetupTippy(elem: HTMLElement | null) {
    if (!elem) return;
    const closeButton = elem.querySelector<HTMLButtonElement>(PageViewSelectors.CloseButton);

    if (closeButton) {
      Tooltips.Close = Spicetify.Tippy(closeButton, {
        ...Spicetify.TippyProps,
        content: `Exit Lyrics Page`,
      });

      const closeClickHandler = () => Session.GoBack();
      closeButton.addEventListener('click', closeClickHandler);
      maid?.Give(() => closeButton.removeEventListener('click', closeClickHandler));
    }

    const fullscreenBtn = elem.querySelector<HTMLButtonElement>(
      PageViewSelectors.FullscreenToggleButton,
    );

    if (fullscreenBtn) {
      Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
        ...Spicetify.TippyProps,
        content: `Toggle Fullscreen View`,
      });

      const fullscreenClickHandler = () => Fullscreen.Toggle();
      fullscreenBtn.addEventListener('click', fullscreenClickHandler);
      maid?.Give(() => fullscreenBtn.removeEventListener('click', fullscreenClickHandler));
    }
  }
}

/**
 * Sets up image loading with high-res switching for an image element
 */
function setupImageLoading(imageElement: ImageElementWithSetup) {
  // Prevent multiple event bindings
  if (imageElement._setupImageLoading) return;
  imageElement._setupImageLoading = true;

  // Set up the onload handler
  const onloadHandler = () => {
    fastdom.write(() => {
      imageElement.classList.add('loaded');
    });

    // After the initial image loads, load the high-res version
    const highResUrl = imageElement.getAttribute('data-high-res');
    if (highResUrl) {
      // Preload the high-res image
      const highResImage = new Image();
      highResImage.onload = () => {
        fastdom.write(() => {
          if (imageElement.src !== highResUrl) {
            imageElement.src = highResUrl;
          }
        });
      };
      highResImage.src = highResUrl;
    }
  };

  imageElement.onload = onloadHandler;
  // Register cleanup with maid to prevent memory leaks
  maid?.Give(() => {
    imageElement.onload = null;
  });
}

/**
 * Updates the page content when the track changes
 * This ensures the artwork and metadata stay in sync with the current track
 */
async function UpdatePageContent() {
  if (!PageView.IsOpened) return;

  const mediaImage = document.querySelector<HTMLImageElement>(PageViewSelectors.MediaImage);

  if (mediaImage) {
    await fastdom.write(() => {
      if (mediaImage.classList.contains('loaded')) {
        mediaImage.classList.remove('loaded');
      }
    });

    updateSongInfo();
    updateArtwork(mediaImage);
  }
}

async function updateSongInfo() {
  const songNamePromise = SpotifyPlayer.GetSongName();
  const artistsPromise = SpotifyPlayer.GetArtists();

  const [songName, artists] = await Promise.all([songNamePromise, artistsPromise]);

  const songNameElem = document.querySelector<HTMLElement>(PageViewSelectors.SongName);
  if (songNameElem && songNameElem.textContent !== songName) {
    await fastdom.write(() => {
      songNameElem.textContent = songName;
    });
  }

  const artistsElem = document.querySelector<HTMLElement>(PageViewSelectors.Artists);
  const joinedArtists = SpotifyPlayer.JoinArtists(artists);
  if (artistsElem && artistsElem.textContent !== joinedArtists) {
    await fastdom.write(() => {
      artistsElem.textContent = joinedArtists;
    });
  }
}

async function updateArtwork(mediaImage: HTMLImageElement) {
  try {
    const [standardUrl, highResUrl] = await Promise.all([
      SpotifyPlayer.Artwork.Get('l'),
      SpotifyPlayer.Artwork.Get('xl'),
    ]);

    if (standardUrl && mediaImage.src !== standardUrl) {
      await fastdom.write(() => {
        mediaImage.src = standardUrl;
      });
    }
    if (highResUrl && mediaImage.getAttribute('data-high-res') !== highResUrl) {
      await fastdom.write(() => {
        mediaImage.setAttribute('data-high-res', highResUrl);
      });
    }
  } catch (error) {
    console.error('Failed to load artwork:', error);
  }
}

/**
 * Sets up the refresh button functionality
 */
function setupRefreshButton() {
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

/**
 * Sets up the watch music video button functionality
 */
function setupWatchMusicVideoButton() {
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
  // Add the event listener cleanup to the maid
  maid?.Give(() => watchMusicVideoButton.removeEventListener('click', clickHandler));
}

/**
 * Sets up the release logs button functionality
 */
function setupReleaseLogsButton() {
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

/**
 * Shows the refresh button
 */
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

/**
 * Hides the refresh button
 */
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

export default PageView;
