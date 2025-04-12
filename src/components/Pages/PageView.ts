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
import {
  Session_NowBar_SetSide,
  Session_OpenNowBar,
  ToggleNowBar,
} from '../Utils/NowBar';
import Fullscreen from '../Utils/Fullscreen';
import TransferElement from '../Utils/TransferElement';
import Session from '../Global/Session';
import { ResetLastLine } from '../../utils/Scrolling/ScrollToActiveLine';

export const Tooltips = {
  Close: null,
  Kofi: null,
  NowBarToggle: null,
  FullscreenToggle: null,
  LyricsToggle: null,
};

const PageView = {
  Open: OpenPage,
  Destroy: DestroyPage,
  AppendViewControls,
  IsOpened: false,
};

export const PageRoot = document.querySelector<HTMLElement>(
  '.Root__main-view .main-view-container div[data-overlayscrollbars-viewport]',
);

function OpenPage() {
  if (PageView.IsOpened) return;
  const elem = document.createElement('div');
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
                                 src="${SpotifyPlayer.Artwork.Get('l')}" 
                                 data-high-res="${SpotifyPlayer.Artwork.Get(
                                   'xl',
                                 )}"
                                 fetchpriority="high"
                                 loading="eager"
                                 decoding="sync"
                                 draggable="true" />
                        </div>
                        <div class="Metadata">
                            <div class="SongName">
                                <span>
                                    ${SpotifyPlayer.GetSongName()}
                                </span>
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

  PageRoot.appendChild(elem);

  const lowQMode = storage.get('lowQMode');
  const lowQModeEnabled = lowQMode && lowQMode === 'true';

  if (lowQModeEnabled) {
    elem
      .querySelector('.LyricsContainer .LyricsContent')
      .classList.add('lowqmode');
  }

  Defaults.LyricsContainerExists = true;

  ApplyDynamicBackground(
    document.querySelector('#SpicyLyricsPage .ContentBox'),
  );

  // Optimize album cover image loading
  const mediaImage = document.querySelector(
    '#SpicyLyricsPage .MediaImage',
  ) as HTMLImageElement;
  if (mediaImage) {
    // Add loaded class when the initial image loads
    mediaImage.onload = () => {
      mediaImage.classList.add('loaded');

      // After the initial image loads, load the high-res version
      const highResUrl = mediaImage.getAttribute('data-high-res');
      if (highResUrl) {
        // Preload the high-res image
        const highResImage = new Image();
        highResImage.onload = () => {
          // Only swap to high-res after it's fully loaded
          requestAnimationFrame(() => {
            mediaImage.src = highResUrl;
          });
        };
        highResImage.src = highResUrl;
      }
    };
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

function DestroyPage() {
  if (!PageView.IsOpened) return;
  if (Fullscreen.IsOpen) Fullscreen.Close();
  if (!document.querySelector('#SpicyLyricsPage')) return;
  document.querySelector('#SpicyLyricsPage')?.remove();
  Defaults.LyricsContainerExists = false;
  removeLinesEvListener();
  Object.values(Tooltips).forEach((a) => a?.destroy());
  ResetLastLine();
  ScrollSimplebar?.unMount();
  PageView.IsOpened = false;
}

function AppendViewControls(ReAppend: boolean = false) {
  const elem = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .ContentBox .ViewControls',
  );
  if (!elem) return;
  if (ReAppend) elem.innerHTML = '';
  elem.innerHTML = `
        <button id="Close" class="ViewControl">${Icons.Close}</button>
        <button id="NowBarToggle" class="ViewControl">${Icons.NowBar}</button>
        <button id="FullscreenToggle" class="ViewControl">${
          Fullscreen.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen
        }</button>
    `;

  if (Fullscreen.IsOpen) {
    TransferElement(
      elem,
      document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header',
      ),
      0,
    );
    Object.values(Tooltips).forEach((a) => a?.destroy());
    SetupTippy(
      document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls',
      ),
    );
  } else {
    if (
      document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls',
      )
    ) {
      TransferElement(
        elem,
        document.querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox'),
      );
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    SetupTippy(elem);
  }

  function SetupTippy(elem: HTMLElement) {
    {
      const closeButton = elem.querySelector('#Close');

      Tooltips.Close = Spicetify.Tippy(closeButton, {
        ...Spicetify.TippyProps,
        content: `Close Page`,
      });

      closeButton.addEventListener('click', () => Session.GoBack());

      // NowBar Toggle Button
      const nowBarButton = elem.querySelector('#NowBarToggle');

      Tooltips.NowBarToggle = Spicetify.Tippy(nowBarButton, {
        ...Spicetify.TippyProps,
        content: `NowBar`,
      });

      nowBarButton.addEventListener('click', () => ToggleNowBar());

      // Fullscreen Button
      const fullscreenBtn = elem.querySelector('#FullscreenToggle');

      Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
        ...Spicetify.TippyProps,
        content: `Toggle Fullscreen`,
      });

      fullscreenBtn.addEventListener('click', () => Fullscreen.Toggle());
    }
  }
}

export function SpicyLyrics_Notification({
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
  const NotificationContainer = document.querySelector(
    '#SpicyLyricsPage .NotificationContainer',
  );
  if (!NotificationContainer) return nonFunctionalReturnObject;
  const Title = NotificationContainer.querySelector(
    '.NotificationText .NotificationTitle',
  );
  const Description = NotificationContainer.querySelector(
    '.NotificationText .NotificationDescription',
  );
  const Icon = NotificationContainer.querySelector('.NotificationIcon');
  const CloseButton = NotificationContainer.querySelector(
    '.NotificationCloseButton',
  );

  if (Title && title) {
    Title.textContent = title;
  }
  if (Description && description) {
    Description.textContent = description;
  }
  if (Icon && icon) {
    Icon.innerHTML = icon;
  }

  const closeBtnHandler = () => {
    NotificationContainer.classList.remove('Visible');
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
  };

  NotificationContainer.classList.add(type ?? 'Information');

  const closeBtnA = closeBtn ?? true;

  if (CloseButton) {
    if (!closeBtnA) {
      CloseButton.classList.add('Disabled');
    } else {
      CloseButton.addEventListener('click', closeBtnHandler);
    }
  }

  return {
    cleanup: () => {
      if (closeBtnA && CloseButton) {
        CloseButton.removeEventListener('click', closeBtnHandler);
      }
      NotificationContainer.classList.remove('Visible');
      NotificationContainer.classList.remove(type ?? 'Information');
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
    },
    close: () => {
      NotificationContainer.classList.remove('Visible');
    },
    open: () => {
      NotificationContainer.classList.add('Visible');
    },
  };
}

export default PageView;
