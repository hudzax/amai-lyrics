// Dynamic imports will be used for some modules for performance
import { ScrollingIntervalTime } from "./utils/Lyrics/lyrics";
import storage from "./utils/storage";
import { setSettingsMenu } from "./utils/settings";
import { Icons } from "./components/Styling/Icons";
import { IntervalManager } from "./utils/IntervalManager";
import { SpotifyPlayer } from "./components/Global/SpotifyPlayer";
import { IsPlaying } from "./utils/Addons";
import { ScrollSimplebar } from "./utils/Scrolling/Simplebar/ScrollSimplebar";

// CSS Imports
import "./css/default.css";
import "./css/Simplebar.css";
import "./css/ContentBox.css";
import "./css/DynamicBG/spicy-dynamic-bg.css";
import "./css/Lyrics/main.css";
import "./css/Lyrics/Mixed.css";
import "./css/Loaders/LoaderContainer.css";

import Global from "./components/Global/Global";
import Platform from "./components/Global/Platform";
import Whentil from "./utils/Whentil";
import Session from "./components/Global/Session";
import sleep from "./utils/sleep";

async function initializePlatformAndSettings() {
  await Platform.OnSpotifyReady;

  setSettingsMenu();
}


let buttonRegistered = false;

function setupUI() {
  const skeletonStyle = document.createElement("style");
  skeletonStyle.innerHTML = `
        <style>
            @keyframes skeleton {
                to {
                    background-position-x: 0
                }
            }
        </style>
  `;
  document.head.appendChild(skeletonStyle);

  const button = new Spicetify.Playbar.Button(
    "Amai Lyrics",
    Icons.LyricsPage,
    (self) => {
      if (!self.active) {
        Session.Navigate({ pathname: "/AmaiLyrics" });
      } else {
        Session.GoBack();
      }
    },
    false as any,
    false as any
  );

  return button;
}

function setupEventListeners(button) {
  Whentil.When(
    () => Spicetify.Player.data.item?.type,
    () => {
      const IsSomethingElseThanTrack =
        Spicetify.Player.data.item?.type !== "track";

      if (IsSomethingElseThanTrack) {
        button.deregister();
        buttonRegistered = false;
      } else {
        if (!buttonRegistered) {
          button.register();
          buttonRegistered = true;
        }
      }
    }
  );
}

// Helper to register/deregister the button based on track type
function updateButtonRegistration(button) {
  const IsSomethingElseThanTrack = Spicetify.Player.data.item?.type !== "track";
  if (IsSomethingElseThanTrack) {
    button.deregister();
    buttonRegistered = false;
  } else {
    if (!buttonRegistered) {
      button.register();
      buttonRegistered = true;
    }
  }
}

function applyDynamicBackgroundToNowPlayingBar(coverUrl, cached, lowQModeEnabled) {
  if (lowQModeEnabled) return;
  
  // Preload the cover image to improve future LCP
  preloadCoverImage(coverUrl);

  try {
    if (!cached.nowPlayingBar) {
      cached.nowPlayingBar = document.querySelector(
        ".Root__right-sidebar aside.NowPlayingView"
      );
    }

    const nowPlayingBar = cached.nowPlayingBar;

    if (!nowPlayingBar) {
      cached.lastImgUrl = null;
      cached.dynamicBg = null;
      return;
    }

    if (coverUrl === cached.lastImgUrl && cached.dynamicBg) return;

    if (!cached.dynamicBg) {
      const dynamicBackground = document.createElement("div");
      dynamicBackground.classList.add("spicy-dynamic-bg");
      
      // Create a lightweight placeholder div first
      const placeholderDiv = document.createElement("div");
      placeholderDiv.className = "FrontPlaceholder";
      dynamicBackground.appendChild(placeholderDiv);
      
      // Create Front image with optimized loading strategy
      const frontImg = document.createElement("img");
      frontImg.className = "Front";
      frontImg.loading = "eager"; // Use standard loading attribute
      frontImg.decoding = "async";
      frontImg.src = coverUrl;
      
      // Add to DOM immediately but with opacity 0
      dynamicBackground.appendChild(frontImg);
      
      // When image loads, add the loaded class to trigger transition
      frontImg.onload = () => {
        frontImg.classList.add("loaded");
      };
      
      // Create Back image with lazy loading
      const backImg = document.createElement("img");
      backImg.className = "Back";
      backImg.loading = "lazy";
      backImg.decoding = "async";
      backImg.src = coverUrl;
      dynamicBackground.appendChild(backImg);
      
      // Create BackCenter image with lazy loading
      const backCenterImg = document.createElement("img");
      backCenterImg.className = "BackCenter";
      backCenterImg.loading = "lazy";
      backCenterImg.decoding = "async";
      backCenterImg.src = coverUrl;
      dynamicBackground.appendChild(backCenterImg);
      
      nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");
      nowPlayingBar.appendChild(dynamicBackground);
      cached.dynamicBg = dynamicBackground;
    } else {
      // Simple approach: just update the src of existing images
      const frontImg = cached.dynamicBg.querySelector(".Front");
      if (frontImg) {
        // Remove loaded class temporarily
        frontImg.classList.remove("loaded");
        
        // Update src and re-add loaded class when it loads
        frontImg.src = coverUrl;
        frontImg.onload = () => {
          frontImg.classList.add("loaded");
        };
      }
      
      // Update other images
      const backImg = cached.dynamicBg.querySelector(".Back");
      if (backImg) backImg.src = coverUrl;
      
      const backCenterImg = cached.dynamicBg.querySelector(".BackCenter");
      if (backCenterImg) backCenterImg.src = coverUrl;
    }

    cached.lastImgUrl = coverUrl;
  } catch (error) {
    console.error(
      "Error Applying the Dynamic BG to the NowPlayingBar:",
      error
    );
  }
}

async function initializeAmaiLyrics(button) {
  const [{ requestPositionSync }] = await Promise.all([import("./utils/Gets/GetProgress")]);
  const { default: fetchLyrics } = await import("./utils/Lyrics/fetchLyrics");
  const { default: ApplyLyrics } = await import("./utils/Lyrics/Global/Applyer");
  const { default: ApplyDynamicBackground } = await import("./components/DynamicBG/dynamicBackground");
  const { UpdateNowBar } = await import("./components/Utils/NowBar");
  const { ScrollToActiveLine } = await import("./utils/Scrolling/ScrollToActiveLine");
  const { default: PageView } = await import("./components/Pages/PageView");

  Whentil.When(() => Spicetify.Platform.PlaybackAPI, () => {
    requestPositionSync();
  });

  const lowQModeEnabled = storage.get("lowQMode") === "true";
  const cached = {
    nowPlayingBar: null,
    dynamicBg: null,
    lastImgUrl: null
  };

  new IntervalManager(1, () => {
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    applyDynamicBackgroundToNowPlayingBar(coverUrl, cached, lowQModeEnabled);
  }).Start();

  async function onSongChange(event) {
    let attempts = 0;
    const maxAttempts = 5;
    let currentUri = event?.data?.item?.uri;

    while (!currentUri && attempts < maxAttempts) {
      await sleep(0.1);
      currentUri = Spicetify.Player.data?.item?.uri;
      attempts++;
    }

    if (!currentUri) return;

    // Fetch and apply lyrics on song change
    fetchLyrics(currentUri).then(ApplyLyrics);

    updateButtonRegistration(button);

    if (Spicetify.Player.data.item?.type === "track") {
      await SpotifyPlayer.Track.GetTrackInfo();
      if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar"))
        UpdateNowBar();
    }

    applyDynamicBackgroundToNowPlayingBar(
      Spicetify.Player.data?.item?.metadata?.image_url,
      cached,
      lowQModeEnabled
    );

    if (!document.querySelector("#SpicyLyricsPage .LyricsContainer")) return;
    ApplyDynamicBackground(
      document.querySelector("#SpicyLyricsPage .ContentBox")
    );
  }

  Spicetify.Player.addEventListener("songchange", onSongChange);

  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    fetchLyrics(currentUri).then(ApplyLyrics);
  }

  window.addEventListener("online", async () => {
    storage.set("lastFetchedUri", null);
    const currentUri = Spicetify.Player.data?.item?.uri;
    if (currentUri) {
      fetchLyrics(currentUri).then(ApplyLyrics);
    }
  });

  new IntervalManager(ScrollingIntervalTime, () =>
    ScrollToActiveLine(ScrollSimplebar)
  ).Start();

  let lastLocation = null;

  function loadPage(location) {
    if (location.pathname === "/AmaiLyrics") {
      PageView.Open();
      button.active = true;
    } else {
      if (lastLocation?.pathname === "/AmaiLyrics") {
        PageView.Destroy();
        button.active = false;
      }
    }
    lastLocation = location;
  }

  Spicetify.Platform.History.listen(loadPage);

  if (Spicetify.Platform.History.location.pathname === "/AmaiLyrics") {
    Global.Event.listen("pagecontainer:available", () => {
      loadPage(Spicetify.Platform.History.location);
      button.active = true;
    });
  }

  button.tippy.setContent("Amai Lyrics");

  Spicetify.Player.addEventListener("onplaypause", (e) => {
    SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
    Global.Event.evoke("playback:playpause", e);
  });

  {
    let lastLoopType = null;
    new IntervalManager(0.2, () => {
      const LoopState = Spicetify.Player.getRepeat();
      const LoopType =
        LoopState === 1
          ? "context"
          : LoopState === 2
          ? "track"
          : "none";
      SpotifyPlayer.LoopType = LoopType;
      if (lastLoopType !== LoopType) {
        Global.Event.evoke("playback:loop", LoopType);
      }
      lastLoopType = LoopType;
    }).Start();
  }

  {
    let lastShuffleType = null;
    new IntervalManager(0.2, () => {
      const ShuffleType = Spicetify.Player.origin._state.smartShuffle
        ? "smart"
        : Spicetify.Player.origin._state.shuffle
        ? "normal"
        : "none";
      SpotifyPlayer.ShuffleType = ShuffleType;
      if (lastShuffleType !== ShuffleType) {
        Global.Event.evoke("playback:shuffle", ShuffleType);
      }
      lastShuffleType = ShuffleType;
    }).Start();
  }

  {
    let lastPosition = 0;
    new IntervalManager(0.5, () => {
      const pos = SpotifyPlayer.GetTrackPosition();
      if (pos !== lastPosition) {
        Global.Event.evoke("playback:position", pos);
      }
      lastPosition = pos;
    }).Start();
  }

  SpotifyPlayer.IsPlaying = IsPlaying();

  {
    Spicetify.Player.addEventListener("onplaypause", (e) =>
      Global.Event.evoke("playback:playpause", e)
    );
    Spicetify.Player.addEventListener("onprogress", (e) =>
      Global.Event.evoke("playback:progress", e)
    );
    Spicetify.Player.addEventListener("songchange", (e) =>
      Global.Event.evoke("playback:songchange", e)
    );

    Whentil.When(
      () =>
        document.querySelector(
          ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
        ),
      () => {
        Global.Event.evoke(
          "pagecontainer:available",
          document.querySelector(
            ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
          )
        );
      }
    );

    Spicetify.Platform.History.listen(Session.RecordNavigation);
    Session.RecordNavigation(Spicetify.Platform.History.location);
  }
}

function setupDynamicBackground(button) {
  initializeAmaiLyrics(button);
}

// Cache for recently used album covers
const recentCovers = new Set();
const maxCachedCovers = 5;

/**
 * Simple image preloading without using link preload
 * This avoids the browser warnings while still getting most of the performance benefit
 */
function preloadCoverImage(coverUrl) {
  if (!coverUrl || recentCovers.has(coverUrl)) return;
  
  // Add to recent covers cache
  recentCovers.add(coverUrl);
  
  // Limit cache size
  if (recentCovers.size > maxCachedCovers) {
    const firstItem = recentCovers.values().next().value;
    recentCovers.delete(firstItem);
  }
  
  // Use Image() constructor for preloading instead of link preload
  // This is more reliable and doesn't trigger browser warnings
  const img = new Image();
  img.src = coverUrl;
}

/**
 * Intelligently preloads the next track's image when user behavior suggests
 * they might change tracks soon (e.g., hovering over next button)
 */
function setupSmartPreloading() {
  // Find next track button and add hover listener
  const nextTrackSelector = '.player-controls__right button[aria-label="Next"]';
  
  // Use MutationObserver to detect when the player controls are added to the DOM
  const observer = new MutationObserver((mutations) => {
    const nextButton = document.querySelector(nextTrackSelector);
    if (nextButton && !nextButton.hasAttribute('data-preload-listener')) {
      nextButton.setAttribute('data-preload-listener', 'true');
      
      // When user hovers over next button, try to find and preload the next track's image
      nextButton.addEventListener('mouseenter', () => {
        // Try to find next track in queue
        const nextTrackElement = document.querySelector('.Root__now-playing-bar .next-track');
        if (nextTrackElement) {
          const nextTrackImg = nextTrackElement.querySelector('img');
          if (nextTrackImg && nextTrackImg.src) {
            preloadCoverImage(nextTrackImg.src);
          }
        }
      });
    }
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, { childList: true, subtree: true });
}

async function main() {
  // Inject Google Fonts dynamically
  const fontLink = document.createElement("link");
  fontLink.rel = "preload";
  fontLink.as = "style";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Vazirmatn&display=swap";
  document.head.appendChild(fontLink);

  fontLink.onload = () => {
    fontLink.rel = "stylesheet";
  };

  await Promise.all([
    initializePlatformAndSettings()
  ]);

  const button = setupUI();
  setupEventListeners(button);
  setupDynamicBackground(button);
  setupSmartPreloading();
  
  // Mark dynamic backgrounds as loaded after the page has fully loaded
  // This helps with LCP by delaying the rendering of non-critical elements
  window.addEventListener('load', () => {
    // Use requestIdleCallback to ensure this runs during browser idle time
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        document.querySelectorAll('.spicy-dynamic-bg').forEach(bg => {
          bg.classList.add('spicy-dynamic-bg-loaded');
        });
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        document.querySelectorAll('.spicy-dynamic-bg').forEach(bg => {
          bg.classList.add('spicy-dynamic-bg-loaded');
        });
      }, 1000);
    }
  });
}

export default main;
