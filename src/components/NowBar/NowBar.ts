import storage from '../../utils/storage';
import Whentil from '../../utils/Whentil';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import Fullscreen from '../Utils/Fullscreen';
import { setupDragAndDrop } from './DragAndDrop';
import { CleanUpActiveComponents, setupEventListeners } from './EventListeners';
import { SetupPlaybackControls } from './PlaybackControls';
import { SetupSongProgressBar } from './ProgressBar';
import {
  ActivePlaybackControlsInstance,
  ActiveSetupSongProgressBarInstance,
  setActivePlaybackControlsInstance,
  setActiveSetupSongProgressBarInstance,
} from './state';

/**
 * Opens the NowBar and initializes its components
 * Sets up playback controls and progress bar in fullscreen mode
 */
function OpenNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  UpdateNowBar(true);
  if (!NowBar.classList.contains('Active')) NowBar.classList.add('Active');
  storage.set('IsNowBarOpen', 'true');

  if (Fullscreen.IsOpen) {
    // Cache MediaBox for repeated use
    const MediaBox = document.querySelector(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent',
    );
    if (!MediaBox) return;

    // Remove only if present, avoid unnecessary DOM ops
    const existingAlbumData = MediaBox.querySelector('.AlbumData');
    if (existingAlbumData) MediaBox.removeChild(existingAlbumData);

    const existingPlaybackControls = MediaBox.querySelector('.PlaybackControls');
    if (existingPlaybackControls) MediaBox.removeChild(existingPlaybackControls);

    // Let's Apply more data into the fullscreen mode.
    {
      const AppendQueue = [];
      {
        const AlbumNameElement = document.createElement('div');
        AlbumNameElement.classList.add('AlbumData');
        AlbumNameElement.innerHTML = `<span>${SpotifyPlayer.GetAlbumName()}</span>`;
        /* AlbumNameElement.classList.add("marqueeify");
                AlbumNameElement.setAttribute("marquee-base-width", "22cqw"); */
        AppendQueue.push(AlbumNameElement);
      }

      // Set up playback controls
      const playbackControlsInstance = SetupPlaybackControls(AppendQueue);
      setActivePlaybackControlsInstance(playbackControlsInstance);
      ActivePlaybackControlsInstance.Apply();

      // Set up song progress bar
      const songProgressBarInstance = SetupSongProgressBar(AppendQueue);
      setActiveSetupSongProgressBarInstance(songProgressBarInstance);
      if (ActiveSetupSongProgressBarInstance) {
        ActiveSetupSongProgressBarInstance.Apply();
      }

      // Use a more reliable approach to add elements
      Whentil.When(
        () => document.querySelector('#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls'),
        () => {
          // Ensure there's no duplicate elements before appending
          const viewControls = MediaBox.querySelector('.ViewControls');

          // Create a temporary fragment to avoid multiple reflows
          const fragment = document.createDocumentFragment();
          AppendQueue.forEach((element) => {
            fragment.appendChild(element);
          });

          // Only update DOM if fragment has children
          if (fragment.childNodes.length > 0) {
            MediaBox.innerHTML = '';
            if (viewControls) MediaBox.appendChild(viewControls);
            MediaBox.appendChild(fragment);
          }
        },
      );
    }
  }

  setupDragAndDrop();
  setupEventListeners();
}

/**
 * Closes the NowBar and cleans up its components
 */
function CloseNowBar() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;
  NowBar.classList.remove('Active');
  storage.set('IsNowBarOpen', 'false');
  CleanUpActiveComponents();
}

/**
 * Restores the NowBar to its previous state (open or closed) from session storage
 */
function Session_OpenNowBar() {
  OpenNowBar();
  // const IsNowBarOpen = storage.get('IsNowBarOpen');
  // if (IsNowBarOpen === 'true') {
  //   OpenNowBar();
  // } else {
  //   CloseNowBar();
  // }
}

/**
 * Updates the NowBar content with current track information
 * @param force - If true, updates even if the NowBar is closed
 */
function UpdateNowBar(force = false) {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  // Cache elements for repeated use
  const ArtistsDiv = NowBar.querySelector('.Header .Metadata .Artists');
  const ArtistsSpan = NowBar.querySelector('.Header .Metadata .Artists span');
  const MediaImage = NowBar.querySelector<HTMLImageElement>('.Header .MediaBox .MediaImage');
  const SongNameSpan = NowBar.querySelector('.Header .Metadata .SongName span');
  const MediaBox = NowBar.querySelector('.Header .MediaBox');
  const SongName = NowBar.querySelector('.Header .Metadata .SongName');

  // Add null checks before accessing DOM elements
  if (!ArtistsDiv || !MediaBox || !SongName) {
    console.error('Required elements not found in UpdateNowBar');
    return;
  }

  ArtistsDiv.classList.add('Skeletoned');
  MediaBox.classList.add('Skeletoned');
  SongName.classList.add('Skeletoned');

  const IsNowBarOpen = storage.get('IsNowBarOpen');
  if (IsNowBarOpen == 'false' && !force) return;

  // Set artwork image
  if (MediaImage) {
    SpotifyPlayer.Artwork.Get('xl')
      .then((artwork) => {
        if (MediaImage.src !== artwork) {
          MediaImage.src = artwork;
        }
        MediaBox.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to load artwork:', err);
      });
  }

  // Only update text if changed
  if (SongNameSpan && SongName) {
    SpotifyPlayer.GetSongName()
      .then((title) => {
        if (SongNameSpan.textContent !== title) {
          SongNameSpan.textContent = title;
        }
        SongName.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to get song name:', err);
      });
  }

  if (ArtistsSpan && ArtistsDiv) {
    SpotifyPlayer.GetArtists()
      .then((artists) => {
        const joined = SpotifyPlayer.JoinArtists(artists);
        if (ArtistsSpan.textContent !== joined) {
          ArtistsSpan.textContent = joined;
        }
        ArtistsDiv.classList.remove('Skeletoned');
      })
      .catch((err) => {
        console.error('Failed to get artists:', err);
      });
  }

  if (Fullscreen.IsOpen) {
    const NowBarAlbum = NowBar.querySelector<HTMLDivElement>('.Header .MediaBox .AlbumData');
    if (NowBarAlbum) {
      NowBarAlbum.classList.add('Skeletoned');
      const AlbumSpan = NowBarAlbum.querySelector('span');
      if (AlbumSpan) {
        AlbumSpan.textContent = SpotifyPlayer.GetAlbumName();
      }
      NowBarAlbum.classList.remove('Skeletoned');
    }
  }
}

/**
 * Swaps the NowBar between left and right sides of the screen
 */
function NowBar_SwapSides() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  const CurrentSide = storage.get('NowBarSide');
  if (CurrentSide === 'left') {
    // Switch to right side
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  } else if (CurrentSide === 'right') {
    // Switch to left side
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  } else {
    // Default to right side if no side is set
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  }
}

/**
 * Restores the NowBar to its previous side (left or right) from session storage
 */
function Session_NowBar_SetSide() {
  const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
  if (!NowBar) return;

  const CurrentSide = storage.get('NowBarSide');
  if (CurrentSide === 'left') {
    // Set to left side
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  } else if (CurrentSide === 'right') {
    // Set to right side
    storage.set('NowBarSide', 'right');
    NowBar.classList.remove('LeftSide');
    NowBar.classList.add('RightSide');
  } else {
    // Default to left side if no side is set
    storage.set('NowBarSide', 'left');
    NowBar.classList.remove('RightSide');
    NowBar.classList.add('LeftSide');
  }
}

/**
 * Removes the NowBar toggle button and its tooltip
 */
function DeregisterNowBarBtn() {
  // Remove the button from DOM
  const nowBarButton = document.querySelector(
    '#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle',
  );
  if (nowBarButton) {
    nowBarButton.remove();
  }
}

export {
  OpenNowBar,
  CloseNowBar,
  UpdateNowBar,
  Session_OpenNowBar,
  NowBar_SwapSides,
  Session_NowBar_SetSide,
  DeregisterNowBarBtn,
};
