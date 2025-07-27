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
  PageRoot = document.querySelector<HTMLElement>(
    '.Root__main-view .main-view-container div[data-overlayscrollbars-viewport]',
  );
});

async function OpenPage() {
  if (PageView.IsOpened) return;

  // Create fresh maid instance for this page session
  maid = new Maid();

  let elem: HTMLDivElement;
  await fastdom.write(() => {
    elem = document.createElement('div');
    elem.id = 'SpicyLyricsPage';
    elem.innerHTML = `
          <div class="NotificationContainer">
              <div class="NotificationIcon"></div>
              <div class="NotificationText">
                  <div class="NotificationTitle"></div>
                  <div class="NotificationDescription"></div>
              </div>
              <div class="NotificationCloseButton">X</div>
          </div>
          <div class="ContentBox">
              <div class="NowBar">
                  <div class="CenteredView">
                      <div class="Header">
                          <div class="MediaBox">
                              <div class="MediaContent" draggable="true"></div>
                              <div class="MediaImagePlaceholder"></div>
                              <img class="MediaImage" 
                                   src="" 
                                   data-high-res=""
                                   fetchpriority="high"
                                   loading="eager"
                                   decoding="sync"
                                   draggable="true"  alt=""/>
                          </div>
                          <div class="Metadata">
                              <div class="SongName">
                                  <span></span>
                              </div>
                              <div class="Artists">
                                  <span></span>
                              </div>
                          </div>
                      </div>
                      <div class="AmaiPageButtonContainer">
                        <button id="RefreshLyrics" class="AmaiPageButton">
                            Reload Current Lyrics
                        </button>  
                        <button id="WatchMusicVideoButton" class="AmaiPageButton">
                            Watch Music Video
                        </button>
                        <button id="ReleaseLogsButton" class="AmaiPageButton">
                            Open Release Notes
                        </button>
                      </div>
                  </div>
              </div>
              <div class="LyricsContainer">
                  <div class="loaderContainer">
                      <div id="DotLoader"></div>
                  </div>
                  <div class="LyricsContent ScrollbarScrollable"></div>
              </div>
              <div class="ViewControls"></div>
              <div class="DropZone LeftSide">
                  <span>Switch Sides</span>
              </div>
              <div class="DropZone RightSide">
                  <span>Switch Sides</span>
              </div>
          </div>
      `;
    if (PageRoot) PageRoot.appendChild(elem);
  });

  Defaults.LyricsContainerExists = true;

  // Cache selectors for reuse
  let contentBox: HTMLElement | null = null;
  let mediaImage: HTMLImageElement | null = null;
  await fastdom.read(() => {
    contentBox = document.querySelector('#SpicyLyricsPage .ContentBox');
    mediaImage = document.querySelector('#SpicyLyricsPage .MediaImage') as HTMLImageElement;
  });

  // Only apply dynamic background if contentBox exists
  if (contentBox) {
    await ApplyDynamicBackground(contentBox);
  }

  // Set up image loading and high-res switching only once
  if (mediaImage) {
    setupImageLoading(mediaImage);
  }

  // Load initial content after DOM is ready
  await UpdatePageContent();

  // Only fetch lyrics if URI is available, and defer until after DOM is ready
  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    fetchLyrics(currentUri).then(ApplyLyrics);
  }

  Session_OpenNowBar();
  Session_NowBar_SetSide();

  await AppendViewControls();

  // Set up refresh button functionality
  setupRefreshButton();

  // Set up release logs button functionality
  setupReleaseLogsButton();

  // Set up watch music video button functionality
  setupWatchMusicVideoButton();

  PageView.IsOpened = true;
}

async function DestroyPage() {
  if (!PageView.IsOpened) return;
  if (Fullscreen.IsOpen) Fullscreen.Close();
  let spicyLyricsPage: HTMLElement | null = null;
  await fastdom.read(() => {
    spicyLyricsPage = document.querySelector('#SpicyLyricsPage');
  });
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
  let elem: HTMLElement | null = null;
  await fastdom.read(() => {
    elem = document.querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox .ViewControls');
  });
  if (!elem) return;
  await fastdom.write(() => {
    if (ReAppend) elem!.innerHTML = '';
    elem!.innerHTML = `
          <button id="Close" class="ViewControl">${Icons.Close}</button>
          <button id="FullscreenToggle" class="ViewControl">${
            Fullscreen.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen
          }</button>
      `;
  });

  if (Fullscreen.IsOpen) {
    let headerElem: HTMLElement | null = null;
    await fastdom.read(() => {
      headerElem = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header',
      );
    });
    if (headerElem) {
      await fastdom.write(() => {
        TransferElement(elem!, headerElem!, 0);
      });
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    let viewControlsElem: HTMLElement | null = null;
    await fastdom.read(() => {
      viewControlsElem = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls',
      );
    });
    SetupTippy(viewControlsElem);
  } else {
    let headerViewControlsElem: HTMLElement | null = null;
    await fastdom.read(() => {
      headerViewControlsElem = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls',
      );
    });
    if (headerViewControlsElem) {
      let contentBoxElem: HTMLElement | null = null;
      await fastdom.read(() => {
        contentBoxElem = document.querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox');
      });
      if (contentBoxElem) {
        await fastdom.write(() => {
          TransferElement(elem!, contentBoxElem!);
        });
      }
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    SetupTippy(elem);
  }

  function SetupTippy(elem: HTMLElement | null) {
    if (!elem) return;
    const closeButton = elem.querySelector('#Close');

    Tooltips.Close = Spicetify.Tippy(closeButton, {
      ...Spicetify.TippyProps,
      content: `Exit Lyrics Page`,
    });

    const closeClickHandler = () => Session.GoBack();
    closeButton?.addEventListener('click', closeClickHandler);
    // Add the event listener cleanup to the maid
    maid?.Give(() => closeButton?.removeEventListener('click', closeClickHandler));

    // Fullscreen Button
    const fullscreenBtn = elem.querySelector('#FullscreenToggle');

    Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
      ...Spicetify.TippyProps,
      content: `Toggle Fullscreen View`,
    });

    const fullscreenClickHandler = () => Fullscreen.Toggle();
    fullscreenBtn?.addEventListener('click', fullscreenClickHandler);
    // Add the event listener cleanup to the maid
    maid?.Give(() => fullscreenBtn?.removeEventListener('click', fullscreenClickHandler));
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

  let mediaImage: HTMLImageElement | null = null;
  await fastdom.read(() => {
    mediaImage = document.querySelector('#SpicyLyricsPage .MediaImage') as HTMLImageElement;
  });

  if (mediaImage) {
    // Only remove 'loaded' if present
    await fastdom.write(() => {
      if (mediaImage!.classList.contains('loaded')) {
        mediaImage!.classList.remove('loaded');
      }
    });

    // Load song name and update only if changed
    SpotifyPlayer.GetSongName().then(async (songName) => {
      let songNameElem: HTMLElement | null = null;
      await fastdom.read(() => {
        songNameElem = document.querySelector('#SpicyLyricsPage .SongName span');
      });
      if (songNameElem && songNameElem.textContent !== songName) {
        await fastdom.write(() => {
          songNameElem!.textContent = songName;
        });
      }
    });

    // Load artists and update only if changed
    SpotifyPlayer.GetArtists().then(async (artists) => {
      let artistsElem: HTMLElement | null = null;
      await fastdom.read(() => {
        artistsElem = document.querySelector('#SpicyLyricsPage .Artists span');
      });
      const joined = SpotifyPlayer.JoinArtists(artists);
      if (artistsElem && artistsElem.textContent !== joined) {
        await fastdom.write(() => {
          artistsElem!.textContent = joined;
        });
      }
    });

    // Load artwork images, only update if URLs differ
    Promise.all([SpotifyPlayer.Artwork.Get('l'), SpotifyPlayer.Artwork.Get('xl')])
      .then(async ([standardUrl, highResUrl]) => {
        if (standardUrl && mediaImage!.src !== standardUrl) {
          await fastdom.write(() => {
            mediaImage!.src = standardUrl;
          });
        }
        if (highResUrl && mediaImage!.getAttribute('data-high-res') !== highResUrl) {
          await fastdom.write(() => {
            mediaImage!.setAttribute('data-high-res', highResUrl);
          });
        }
      })
      .catch((error) => {
        console.error('Failed to load artwork:', error);
      });
  }
}

/**
 * Sets up the refresh button functionality
 */
function setupRefreshButton() {
  const refreshButton = document.querySelector('#RefreshLyrics');
  if (!refreshButton) return;

  const clickHandler = async () => {
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (!currentUri) {
      Spicetify.showNotification('No track playing', false, 1000);
      return;
    }

    // Hide refresh button during fetch
    await fastdom.write(() => {
      refreshButton.classList.add('hidden');
    });

    try {
      // Clear current lyrics cache
      const trackId = currentUri.split(':')[2];
      removeLyricsFromCache(trackId);
      storage.set('currentLyricsData', null);
      // Fetch and apply lyrics
      const lyrics = await fetchLyrics(currentUri);
      ApplyLyrics(lyrics);
    } catch (error) {
      console.error('Error refreshing lyrics:', error);
      Spicetify.showNotification('Error refreshing lyrics', false, 2000);
    }
  };

  refreshButton.addEventListener('click', clickHandler);
  // Add the event listener cleanup to the maid
  maid?.Give(() => refreshButton.removeEventListener('click', clickHandler));
}

/**
 * Sets up the watch music video button functionality
 */
function setupWatchMusicVideoButton() {
  const watchMusicVideoButton = document.querySelector('#WatchMusicVideoButton');
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
  const releaseLogsButton = document.querySelector('#ReleaseLogsButton');
  if (!releaseLogsButton) return;

  const clickHandler = () => {
    window.open('https://github.com/hudzax/amai-lyrics/releases', '_blank');
  };

  releaseLogsButton.addEventListener('click', clickHandler);
  // Add the event listener cleanup to the maid
  maid?.Give(() => releaseLogsButton.removeEventListener('click', clickHandler));
}

/**
 * Shows the refresh button
 */
export function showRefreshButton() {
  const refreshButton = document.querySelector('#RefreshLyrics');
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
  const refreshButton = document.querySelector('#RefreshLyrics');
  if (refreshButton) {
    fastdom.write(() => {
      refreshButton.classList.add('hidden');
    });
  }
}

export default PageView;
