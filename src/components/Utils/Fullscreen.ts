import Animator from '../../utils/Animator';
import { AutoScroll } from '../../utils/Scrolling/AutoScroll';
import { isPublishedNoLyrics } from '../../utils/Lyrics/snapshot';
import PageView, { PageRoot } from '../Pages/PageView';
import { DeregisterNowBarBtn, OpenNowBar, UpdateNowBar } from '../NowBar/NowBar';
import TransferElement from './TransferElement';
import lifecycle from '../../utils/lifecycle';

const PAGE_SELECTOR = '#AmaiLyricsPage';

/**
 * FullscreenMode: whether the lyrics page is presented fullscreen.
 *
 * The `.Fullscreen` class on `#AmaiLyricsPage` is the single mark of that mode:
 * it is added on entry and survives a refused `requestFullscreen()`, which is
 * why the check stays class-based rather than reading `document.fullscreenElement`
 * (see `resolveAppBgHost`). The native element is read for one thing only —
 * noticing that the browser left fullscreen behind our back.
 *
 * Callers cross this seam through `isPageFullscreen()` (synchronous, for render
 * and teardown paths), `subscribe(cb)` (transition-only — a subscriber that
 * needs the current mode asks for it) and the `enter`/`leave`/`toggle`
 * requests. Nobody reads a flag, writes the class, or re-derives the mode from
 * the DOM.
 */
type ModeSubscriber = (fullscreen: boolean) => void;
const subscribers = new Set<ModeSubscriber>();
/** One leave at a time — see `leave`. */
let leaving = false;

function pageElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(PAGE_SELECTOR);
}

export function isPageFullscreen(): boolean {
  return !!document.querySelector(`${PAGE_SELECTOR}.Fullscreen`);
}

function publish(): void {
  const fullscreen = isPageFullscreen();
  for (const subscriber of [...subscribers]) subscriber(fullscreen);
}

export function subscribe(subscriber: ModeSubscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

// Guarded to avoid duplicate listeners on Spicetify watch re-injection (each
// re-eval would otherwise stack another document listener). On hot-reload we
// remove stale handlers that close over the previous module instance and
// replace them with fresh closures.
const windowRef = window as unknown as {
  __amaiFullscreenHandlers?: {
    onFullscreenChange: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
  };
};

function ensureGlobalFullscreenListeners(): void {
  const existing = windowRef.__amaiFullscreenHandlers;
  if (existing) {
    document.removeEventListener('fullscreenchange', existing.onFullscreenChange);
    document.removeEventListener('keydown', existing.onKeyDown);
  }

  const onFullscreenChange = () => {
    // The browser left fullscreen (Escape or a UA gesture) while the page is
    // still presented fullscreen: restore it.
    if (!document.fullscreenElement && isPageFullscreen()) leave();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isPageFullscreen()) leave();
  };

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

function mediaBoxParts(): { mediaBox: HTMLElement | null; mediaImage: HTMLElement | null } {
  return {
    mediaBox: document.querySelector<HTMLElement>(
      '#AmaiLyricsPage .ContentBox .NowBar .Header .MediaBox',
    ),
    mediaImage: document.querySelector<HTMLElement>(
      '#AmaiLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
    ),
  };
}

function enter(): void {
  const page = document.querySelector<HTMLElement>(`.Root__main-view ${PAGE_SELECTOR}`);
  if (!page) return;

  TransferElement(page, document.body);
  page.classList.add('Fullscreen');
  publish();

  // Request fullscreen first, then set up UI elements after transition
  if (!document.fullscreenElement) {
    document
      .querySelector<HTMLElement>(PAGE_SELECTOR)
      .requestFullscreen()
      .then(() => {
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
    if (!isPageFullscreen() || !page.isConnected) return;
    // Ensure controls are properly added
    PageView.AppendViewControls();

    // Open the now bar with playback controls
    void OpenNowBar();

    AutoScroll.reset();

    // Set up media box hover effects
    const { mediaBox, mediaImage } = mediaBoxParts();
    if (mediaBox && mediaImage) {
      MediaBox_Data.Functions.Eventify(mediaImage);

      // Remove existing listeners first to prevent duplicates
      mediaBox.removeEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
      mediaBox.removeEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);

      mediaBox.addEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
      mediaBox.addEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);
    }
  }
}

function leave(): void {
  // The browser's own exit (fullscreenchange) can arrive while our exit is in
  // flight; that second entry would restore twice and notify twice.
  if (leaving) return;
  leaving = true;
  const page = pageElement();

  if (document.fullscreenElement) {
    document
      .exitFullscreen()
      .then(() => {
        restoreUI();
      })
      .catch((err) => {
        // If exiting fullscreen fails, still restore UI
        console.error('Error exiting fullscreen:', err);
        restoreUI();
      });
  } else {
    restoreUI();
  }

  // Function to restore UI after exiting fullscreen
  function restoreUI() {
    leaving = false;
    // The page may have been destroyed while the exit was in flight: its node
    // is then detached, and re-parenting a detached node would resurrect it.
    // The mode still clears below — a reader must never see it stuck open.
    if (page?.isConnected) {
      TransferElement(page, PageRoot);
      page.classList.remove('Fullscreen');
    }
    publish();

    // Update controls for non-fullscreen mode
    PageView.AppendViewControls();

    // Handle no lyrics case: the LyricsSnapshot seam owns the sentinel
    // rule (typed payload and legacy plain-string form alike). Ungated —
    // restoreUI only ever runs against the live track.
    if (isPublishedNoLyrics()) {
      // Refresh an existing lifetime; never resurrect a destroyed page's NowBar.
      void UpdateNowBar();
      const lyricsContainer = document.querySelector(
        '#AmaiLyricsPage .ContentBox .LyricsContainer',
      );
      if (lyricsContainer) {
        lyricsContainer.classList.add('Hidden');
      }
      DeregisterNowBarBtn();
    }

    AutoScroll.reset();

    // Clean up media box event listeners
    const { mediaBox, mediaImage } = mediaBoxParts();
    if (mediaBox) {
      mediaBox.removeEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
      mediaBox.removeEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);
    }

    if (mediaImage) {
      MediaBox_Data.Functions.Reset(mediaImage);
    }
  }
}

function toggle(): void {
  const page = pageElement();

  if (page) {
    // Prevent multiple rapid toggles by checking if a transition is in progress
    if (page.classList.contains('fullscreen-transition')) {
      return;
    }

    // Add transition class to prevent multiple toggles
    page.classList.add('fullscreen-transition');

    if (isPageFullscreen()) {
      leave();
    } else {
      enter();
    }

    // Remove the transition class after a delay
    setTimeout(() => {
      page.classList.remove('fullscreen-transition');
    }, 1000); // 1 second should be enough for most transitions
  }
}

export default { isPageFullscreen, subscribe, enter, leave, toggle };
