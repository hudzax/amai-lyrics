import fetchLyrics from '../../utils/Lyrics/fetchLyrics';
import storage from '../../utils/storage';
import '../../css/Loaders/DotLoader.css';
import {
  addLinesEvListener,
  removeLinesEvListener,
} from '../../utils/Lyrics/lyrics';
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

export const Tooltips = {
  Close: null,
  Kofi: null,
  FullscreenToggle: null,
  LyricsToggle: null,
};

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
                                   draggable="true" />
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

  let contentBox: HTMLElement | null = null;
  await fastdom.read(() => {
    contentBox = document.querySelector('#SpicyLyricsPage .ContentBox');
  });
  ApplyDynamicBackground(contentBox);

  // Load artwork images asynchronously
  let mediaImage: HTMLImageElement | null = null;
  await fastdom.read(() => {
    mediaImage = document.querySelector(
      '#SpicyLyricsPage .MediaImage',
    ) as HTMLImageElement;
  });

  if (mediaImage) {
    // Set up image loading and high-res switching
    setupImageLoading(mediaImage);

    // Load initial content
    UpdatePageContent();
  }

  addLinesEvListener();

  {
    if (!Spicetify.Player.data?.item?.uri) return; // Exit if `uri` is not available
    const currentUri = Spicetify.Player.data.item.uri;

    fetchLyrics(currentUri).then(ApplyLyrics);
  }

  Session_OpenNowBar();

  Session_NowBar_SetSide();

  AppendViewControls();
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
  PageView.IsOpened = false;
}

async function AppendViewControls(ReAppend: boolean = false) {
  let elem: HTMLElement | null = null;
  await fastdom.read(() => {
    elem = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .ContentBox .ViewControls',
    );
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
        contentBoxElem = document.querySelector<HTMLElement>(
          '#SpicyLyricsPage .ContentBox',
        );
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
      content: `Close Page`,
    });

    closeButton?.addEventListener('click', () => Session.GoBack());

    // Fullscreen Button
    const fullscreenBtn = elem.querySelector('#FullscreenToggle');

    Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
      ...Spicetify.TippyProps,
      content: `Toggle Fullscreen`,
    });

    fullscreenBtn?.addEventListener('click', () => Fullscreen.Toggle());
  }
}

export async function SpicyLyrics_Notification({
  icon,
  metadata: { title, description },
  type,
  closeBtn,
}: {
  icon: string;
  metadata: {
    title: string;
    description: string;
  };
  type?: 'Danger' | 'Information' | 'Success' | 'Warning';
  closeBtn?: boolean;
}) {
  const nonFunctionalReturnObject = {
    cleanup: () => {},
    close: () => {},
    open: () => {},
  };
  if (!PageView.IsOpened) return nonFunctionalReturnObject;

  let NotificationContainer: HTMLElement | null = null;
  let Title: HTMLElement | null = null;
  let Description: HTMLElement | null = null;
  let Icon: HTMLElement | null = null;
  let CloseButton: HTMLElement | null = null;

  await fastdom.read(() => {
    NotificationContainer = document.querySelector(
      '#SpicyLyricsPage .NotificationContainer',
    );
    if (!NotificationContainer) return;
    Title = NotificationContainer.querySelector(
      '.NotificationText .NotificationTitle',
    );
    Description = NotificationContainer.querySelector(
      '.NotificationText .NotificationDescription',
    );
    Icon = NotificationContainer.querySelector('.NotificationIcon');
    CloseButton = NotificationContainer.querySelector(
      '.NotificationCloseButton',
    );
  });

  if (!NotificationContainer) return nonFunctionalReturnObject;

  await fastdom.write(() => {
    if (Title && title) {
      Title.textContent = title;
    }
    if (Description && description) {
      Description.textContent = description;
    }
    if (Icon && icon) {
      Icon.innerHTML = icon;
    }
  });

  const closeBtnHandler = () => {
    fastdom.write(() => {
      NotificationContainer!.classList.remove('Visible');
      if (Title) {
        Title.textContent = '';
      }
      if (Description) {
        Description.textContent = '';
      }
      if (Icon) {
        Icon.innerHTML = '';
      }
      if (CloseButton) {
        CloseButton.classList.remove('Disabled');
      }
    });
  };

  await fastdom.write(() => {
    NotificationContainer!.classList.add(type ?? 'Information');
  });

  const closeBtnA = closeBtn ?? true;

  if (CloseButton) {
    if (!closeBtnA) {
      await fastdom.write(() => {
        CloseButton!.classList.add('Disabled');
      });
    } else {
      CloseButton.addEventListener('click', closeBtnHandler);
    }
  }

  return {
    cleanup: () => {
      if (closeBtnA && CloseButton) {
        CloseButton.removeEventListener('click', closeBtnHandler);
      }
      fastdom.write(() => {
        NotificationContainer!.classList.remove('Visible');
        NotificationContainer!.classList.remove(type ?? 'Information');
        if (Title) {
          Title.textContent = '';
        }
        if (Description) {
          Description.textContent = '';
        }
        if (Icon) {
          Icon.innerHTML = '';
        }
        if (CloseButton) {
          CloseButton.classList.remove('Disabled');
        }
      });
    },
    close: () => {
      fastdom.write(() => {
        NotificationContainer!.classList.remove('Visible');
      });
    },
    open: () => {
      fastdom.write(() => {
        NotificationContainer!.classList.add('Visible');
      });
    },
  };
}

/**
 * Sets up image loading with high-res switching for an image element
 */
function setupImageLoading(imageElement: HTMLImageElement) {
  // Set up the onload handler
  imageElement.onload = () => {
    fastdom.write(() => {
      imageElement.classList.add('loaded');
    });

    // After the initial image loads, load the high-res version
    const highResUrl = imageElement.getAttribute('data-high-res');
    if (highResUrl) {
      // Preload the high-res image
      const highResImage = new Image();
      highResImage.onload = () => {
        // Only swap to high-res after it's fully loaded
        fastdom.write(() => {
          imageElement.src = highResUrl;
        });
      };
      highResImage.src = highResUrl;
    }
  };
}

/**
 * Updates the page content when the track changes
 * This ensures the artwork and metadata stay in sync with the current track
 */
async function UpdatePageContent() {
  if (!PageView.IsOpened) return;

  let mediaImage: HTMLImageElement | null = null;
  await fastdom.read(() => {
    mediaImage = document.querySelector(
      '#SpicyLyricsPage .MediaImage',
    ) as HTMLImageElement;
  });

  if (mediaImage) {
    // Reset loaded state
    await fastdom.write(() => {
      mediaImage!.classList.remove('loaded');
    });

    // Load song name
    SpotifyPlayer.GetSongName().then(async (songName) => {
      let songNameElem: HTMLElement | null = null;
      await fastdom.read(() => {
        songNameElem = document.querySelector(
          '#SpicyLyricsPage .SongName span',
        );
      });
      if (songNameElem) {
        await fastdom.write(() => {
          songNameElem!.textContent = songName;
        });
      }
    });

    // Load artists
    SpotifyPlayer.GetArtists().then(async (artists) => {
      let artistsElem: HTMLElement | null = null;
      await fastdom.read(() => {
        artistsElem = document.querySelector('#SpicyLyricsPage .Artists span');
      });
      if (artistsElem) {
        await fastdom.write(() => {
          artistsElem!.textContent = SpotifyPlayer.JoinArtists(artists);
        });
      }
    });

    // Load artwork images
    Promise.all([
      SpotifyPlayer.Artwork.Get('l'),
      SpotifyPlayer.Artwork.Get('xl'),
    ])
      .then(async ([standardUrl, highResUrl]) => {
        // Set the standard resolution image
        if (standardUrl) {
          await fastdom.write(() => {
            mediaImage!.src = standardUrl;
          });
        }

        // Store high-res URL for later loading
        if (highResUrl) {
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

export default PageView;
