import Animator from '../../utils/Animator';
import { ResetLastLine } from '../../utils/Scrolling/ScrollToActiveLine';
import storage from '../../utils/storage';
import Global from '../Global/Global';
import PageView, { PageRoot } from '../Pages/PageView';
import { DeregisterNowBarBtn, OpenNowBar } from './NowBar';
import TransferElement from './TransferElement';
import lifecycle from '../../utils/lifecycle';

const Fullscreen = {
  Open,
  Close,
  Toggle,
  IsOpen: false,
  handleEscapeKey: function (event) {
    if (event.key === 'Escape' && this.IsOpen) {
      this.Close();
    }
  },
};

// Keep IsOpen in sync with actual fullscreen state. Guarded to avoid
// duplicate listeners on Spicetify watch re-injection (each re-eval would
// otherwise stack another document listener). On hot-reload we remove stale
// handlers that close over the previous Fullscreen object and replace them
// with fresh closures that reference the new module's Fullscreen.
const windowRef = window as unknown as {
  __amaiFullscreenHandlers?: {
    onFullscreenChange: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
  };
};

function ensureGlobalFullscreenListeners(): void {
  // Remove stale handlers from previous injection (they capture old Fullscreen closure).
  const existing = windowRef.__amaiFullscreenHandlers;
  if (existing) {
    document.removeEventListener('fullscreenchange', existing.onFullscreenChange);
    document.removeEventListener('keydown', existing.onKeyDown);
  }

  const onFullscreenChange = () => {
    const wasFullscreen = Fullscreen.IsOpen;
    const isNowFullscreen = !!document.fullscreenElement;

    Fullscreen.IsOpen = isNowFullscreen;

    // If browser exited fullscreen but our state didn't update, call Close()
    if (wasFullscreen && !isNowFullscreen) {
      Fullscreen.Close();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => Fullscreen.handleEscapeKey(e as unknown as KeyboardEvent);

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('keydown', onKeyDown);
  windowRef.__amaiFullscreenHandlers = { onFullscreenChange, onKeyDown };
}

ensureGlobalFullscreenListeners();

export function destroyFullscreenGlobalListeners(): void {
  const h = windowRef.__amaiFullscreenHandlers;
  if (!h) return;
  document.removeEventListener('fullscreenchange', h.onFullscreenChange);
  document.removeEventListener('keydown', h.onKeyDown);
  delete windowRef.__amaiFullscreenHandlers;
  // Destroy hover animators so their rAF loops don't retain closed fullscreen state.
  try {
    MediaBox_Data.Animators.brightness.Destroy();
    MediaBox_Data.Animators.blur.Destroy();
  } catch {
    /* already destroyed */
  }
}

// Register teardown for this instance. The module re-evaluates on every
// hot-reload (fresh closure), and `ensureGlobalFullscreenListeners` above
// already removes the previous instance's stale handlers, so we register
// unconditionally; lifecycle disposes it on the next reload.
lifecycle.trackCallback(destroyFullscreenGlobalListeners);

const MediaBox_Data = {
  Eventified: false,
  Functions: {
    MouseIn: () => {
      if (MediaBox_Data.Animators.brightness.reversed) MediaBox_Data.Animators.brightness.Reverse();
      if (MediaBox_Data.Animators.blur.reversed) MediaBox_Data.Animators.blur.Reverse();
      MediaBox_Data.Animators.brightness.Start();
      MediaBox_Data.Animators.blur.Start();
    },
    MouseOut: () => {
      if (!MediaBox_Data.Animators.brightness.reversed)
        MediaBox_Data.Animators.brightness.Reverse();
      if (!MediaBox_Data.Animators.blur.reversed) MediaBox_Data.Animators.blur.Reverse();
      MediaBox_Data.Animators.brightness.Start();
      MediaBox_Data.Animators.blur.Start();
    },
    Reset: (MediaImage: HTMLElement) => {
      MediaImage.style.removeProperty('--ArtworkBrightness');
      MediaImage.style.removeProperty('--ArtworkBlur');
    },
    Eventify: (MediaImage: HTMLElement) => {
      MediaBox_Data.Animators.brightness.on('progress', (progress) => {
        MediaImage.style.setProperty('--ArtworkBrightness', `${progress}`);
      });
      MediaBox_Data.Animators.blur.on('progress', (progress) => {
        MediaImage.style.setProperty('--ArtworkBlur', `${progress}px`);
      });
      MediaBox_Data.Eventified = true;
    },
  },
  Animators: {
    brightness: new Animator(1, 0.5, 0.25),
    blur: new Animator(0, 0.2, 0.25),
  },
};

function Open() {
  const SpicyPage = document.querySelector<HTMLElement>('.Root__main-view #SpicyLyricsPage');
  const Root = document.body as HTMLElement;

  if (SpicyPage) {
    // First, transfer the element and set up initial state
    TransferElement(SpicyPage, Root);
    SpicyPage.classList.add('Fullscreen');
    Fullscreen.IsOpen = true;

    // Request fullscreen first, then set up UI elements after transition
    if (!document.fullscreenElement) {
      Root.querySelector('#SpicyLyricsPage')
        .requestFullscreen()
        .then(() => {
          // Set up UI controls after fullscreen transition completes
          setupFullscreenUI();
        })
        .catch((err) => {
          // If fullscreen fails, still set up UI (fallback)
          setupFullscreenUI();
          console.error('Fullscreen error:', err);
          Spicetify.showNotification(`Fullscreen failed: ${err.message}`, true, 2000);
        });
    } else {
      // Already in fullscreen, just set up UI
      setupFullscreenUI();
    }

    // Function to set up UI elements after fullscreen transition
    function setupFullscreenUI() {
      // Ensure controls are properly added
      PageView.AppendViewControls();

      // Open the now bar with playback controls
      OpenNowBar();

      ResetLastLine();

      // Set up media box hover effects
      const MediaBox = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox',
      );
      const MediaImage = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
      );

      if (MediaBox && MediaImage) {
        MediaBox_Data.Functions.Eventify(MediaImage);

        // Remove existing listeners first to prevent duplicates
        MediaBox.removeEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
        MediaBox.removeEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);

        MediaBox.addEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
        MediaBox.addEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);
      }

      // Notify other components
      Global.Event.evoke('fullscreen:open', null);
    }
  }
}

function Close() {
  const SpicyPage = document.querySelector<HTMLElement>('#SpicyLyricsPage');

  if (SpicyPage) {
    // First exit browser fullscreen if active
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => {
          // Complete UI restoration after fullscreen exit
          restoreUI();
        })
        .catch((err) => {
          // If exiting fullscreen fails, still restore UI
          console.error('Error exiting fullscreen:', err);
          restoreUI();
        });
    } else {
      // Not in browser fullscreen, just restore UI
      restoreUI();
    }

    // Function to restore UI after exiting fullscreen
    function restoreUI() {
      // Transfer element back to original container
      TransferElement(SpicyPage, PageRoot);
      SpicyPage.classList.remove('Fullscreen');
      Fullscreen.IsOpen = false;

      // Update controls for non-fullscreen mode
      PageView.AppendViewControls();

      // Handle no lyrics case — support both legacy string and new JSON sentinel
      const currentLyrics = storage.get('currentLyricsData');
      let NoLyrics = false;
      if (typeof currentLyrics === 'string' && currentLyrics.includes('NO_LYRICS')) {
        NoLyrics = true;
      } else if (currentLyrics) {
        try {
          const parsed = JSON.parse(currentLyrics as string) as { status?: string };
          NoLyrics = parsed?.status === 'NO_LYRICS';
        } catch {
          /* not JSON */
        }
      }
      if (NoLyrics) {
        OpenNowBar();
        const lyricsContainer = document.querySelector(
          '#SpicyLyricsPage .ContentBox .LyricsContainer',
        );
        if (lyricsContainer) {
          lyricsContainer.classList.add('Hidden');
        }
        DeregisterNowBarBtn();
      }

      ResetLastLine();

      // Clean up media box event listeners
      const MediaBox = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox',
      );
      const MediaImage = document.querySelector<HTMLElement>(
        '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
      );

      if (MediaBox) {
        MediaBox.removeEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
        MediaBox.removeEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);
      }

      if (MediaImage) {
        MediaBox_Data.Functions.Reset(MediaImage);
      }

      // Notify other components
      Global.Event.evoke('fullscreen:exit', null);
    }
  }
}

function Toggle() {
  const SpicyPage = document.querySelector<HTMLElement>('#SpicyLyricsPage');

  if (SpicyPage) {
    // Prevent multiple rapid toggles by checking if a transition is in progress
    if (SpicyPage.classList.contains('fullscreen-transition')) {
      return;
    }

    // Add transition class to prevent multiple toggles
    SpicyPage.classList.add('fullscreen-transition');

    if (Fullscreen.IsOpen) {
      Close();
    } else {
      Open();
    }

    // Remove the transition class after a delay
    setTimeout(() => {
      SpicyPage.classList.remove('fullscreen-transition');
    }, 1000); // 1 second should be enough for most transitions
  }
}

export default Fullscreen;
