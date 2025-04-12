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
  if (lowQModeEnabled || !coverUrl) return;
  
  // Preload the cover image to improve future LCP
  preloadCoverImage(coverUrl);

  try {
    // Quick check for cached values to avoid unnecessary work
    if (coverUrl === cached.lastImgUrl && cached.dynamicBg) return;

    // Find the now playing bar if not cached
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

    // Use requestAnimationFrame for DOM updates to avoid blocking the main thread
    requestAnimationFrame(() => {
      if (!cached.dynamicBg) {
        // Create the dynamic background container
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
          // Use another rAF to ensure this happens in a separate frame
          requestAnimationFrame(() => {
            frontImg.classList.add("loaded");
          });
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
        // Update existing images more efficiently
        const frontImg = cached.dynamicBg.querySelector(".Front");
        if (frontImg) {
          // Use image.onload to handle transitions
          const newImg = new Image();
          newImg.onload = () => {
            requestAnimationFrame(() => {
              frontImg.src = coverUrl;
              frontImg.classList.add("loaded");
            });
          };
          frontImg.classList.remove("loaded");
          newImg.src = coverUrl;
        }
        
        // Update other images in the background with a slight delay
        // to prioritize the front image update
        setTimeout(() => {
          const backImg = cached.dynamicBg.querySelector(".Back");
          if (backImg) backImg.src = coverUrl;
          
          const backCenterImg = cached.dynamicBg.querySelector(".BackCenter");
          if (backCenterImg) backCenterImg.src = coverUrl;
        }, 50); // Small delay to prioritize main thread work
      }

      cached.lastImgUrl = coverUrl;
    });
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

    // Fetch and apply lyrics on song change (already non-blocking)
    fetchLyrics(currentUri).then(ApplyLyrics);

    // Update button registration (synchronous but fast)
    updateButtonRegistration(button);

    // Start track info fetching but don't await it here
    const trackInfoPromise = Spicetify.Player.data.item?.type === "track" 
      ? SpotifyPlayer.Track.GetTrackInfo() 
      : Promise.resolve(null);
    
    // Apply background immediately with current data
    applyDynamicBackgroundToNowPlayingBar(
      Spicetify.Player.data?.item?.metadata?.image_url,
      cached,
      lowQModeEnabled
    );

    // Handle UI updates that depend on track info in a non-blocking way
    trackInfoPromise.then(() => {
      if (Spicetify.Player.data.item?.type === "track") {
        if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar")) {
          UpdateNowBar();
        }
      }

      if (document.querySelector("#SpicyLyricsPage .LyricsContainer")) {
        // Update the page content (artwork, song name, artists)
        PageView.UpdatePageContent();
        
        // Apply dynamic background
        ApplyDynamicBackground(
          document.querySelector("#SpicyLyricsPage .ContentBox")
        );
      }
    }).catch(err => {
      console.error("Error processing track info:", err);
    });
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

// Cache for recently used album covers with timestamps
const imageCache = new Map();
const maxCachedCovers = 10;
const cacheExpiryTime = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced image preloading with better caching
 * - Uses a Map instead of Set for better performance with large caches
 * - Includes timestamp to expire old entries
 * - Uses requestIdleCallback when available for non-blocking preloading
 */
function preloadCoverImage(coverUrl) {
  if (!coverUrl) return;
  
  const now = Date.now();
  
  // Check if image is already in cache and not expired
  if (imageCache.has(coverUrl)) {
    const cacheEntry = imageCache.get(coverUrl);
    if (now - cacheEntry.timestamp < cacheExpiryTime) {
      // Update timestamp to keep frequently used images in cache longer
      imageCache.set(coverUrl, { timestamp: now, loaded: cacheEntry.loaded });
      return;
    }
  }
  
  // Schedule preloading during idle time if supported
  const preloadFunc = () => {
    // Use Image() constructor for preloading
    const img = new Image();
    img.onload = () => {
      // Mark as successfully loaded in cache
      if (imageCache.has(coverUrl)) {
        const entry = imageCache.get(coverUrl);
        imageCache.set(coverUrl, { ...entry, loaded: true });
      }
    };
    img.src = coverUrl;
    
    // Add to cache with current timestamp
    imageCache.set(coverUrl, { timestamp: now, loaded: false });
    
    // Clean up cache if it gets too large
    if (imageCache.size > maxCachedCovers) {
      // Find and remove oldest entries
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries until we're back to max size
      const entriesToRemove = entries.slice(0, entries.length - maxCachedCovers);
      for (const [key] of entriesToRemove) {
        imageCache.delete(key);
      }
    }
  };
  
  // Use requestIdleCallback if available, otherwise use setTimeout with 0 delay
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(preloadFunc, { timeout: 1000 });
  } else {
    setTimeout(preloadFunc, 0);
  }
}

/**
 * Intelligently preloads the next track's image when user behavior suggests
 * they might change tracks soon (e.g., hovering over next button)
 * 
 * Optimized to:
 * - Use passive event listeners
 * - Throttle DOM queries
 * - Preload images more intelligently
 * - Reduce observer scope
 */
function setupSmartPreloading() {
  // Cache DOM elements to avoid repeated queries
  let nextButton = null;
  let nextTrackImg = null;
  let lastNextTrackSrc = null;
  
  // Throttle variables
  let lastPreloadCheck = 0;
  const preloadCheckInterval = 5000; // 5 seconds
  const endOfTrackThreshold = 15000; // 15 seconds
  
  // Find and attach listeners to the next button
  function setupNextButtonListener() {
    const nextTrackSelector = '.player-controls__right button[aria-label="Next"]';
    nextButton = document.querySelector(nextTrackSelector);
    
    if (nextButton && !nextButton.hasAttribute('data-preload-listener')) {
      nextButton.setAttribute('data-preload-listener', 'true');
      
      // Use passive event listener for better performance
      nextButton.addEventListener('mouseenter', () => {
        findAndPreloadNextTrack();
      }, { passive: true });
    }
  }
  
  // Find and preload the next track image
  function findAndPreloadNextTrack() {
    // Use requestIdleCallback to avoid blocking UI
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => performNextTrackLookup(), { timeout: 500 });
    } else {
      setTimeout(performNextTrackLookup, 0);
    }
  }
  
  function performNextTrackLookup() {
    const nextTrackElement = document.querySelector('.Root__now-playing-bar .next-track');
    if (!nextTrackElement) return;
    
    const imgElement = nextTrackElement.querySelector('img');
    if (!imgElement || !imgElement.src) return;
    
    // Only update cache if the image has changed
    if (imgElement.src !== lastNextTrackSrc) {
      nextTrackImg = imgElement;
      lastNextTrackSrc = imgElement.src;
      preloadCoverImage(imgElement.src);
    }
  }
  
  // Use a more targeted MutationObserver to reduce overhead
  const playerControlsObserver = new MutationObserver((mutations) => {
    if (!nextButton) {
      setupNextButtonListener();
    }
  });
  
  // Start observing only the player controls area instead of the entire body
  const playerControls = document.querySelector('.player-controls__buttons') || document.body;
  playerControlsObserver.observe(playerControls, { 
    childList: true, 
    subtree: true,
    attributes: false,
    characterData: false
  });
  
  // Initial setup attempt
  setupNextButtonListener();
  
  // Preload next track when approaching the end of the current track
  new IntervalManager(1, () => {
    const now = Date.now();
    if (now - lastPreloadCheck < preloadCheckInterval) return;
    lastPreloadCheck = now;
    
    // Check if we're near the end of the track
    const position = SpotifyPlayer.GetTrackPosition();
    const duration = SpotifyPlayer.GetTrackDuration();
    
    if (duration > 0 && position > 0 && (duration - position) < endOfTrackThreshold) {
      findAndPreloadNextTrack();
      
      // Also try to preload the album art for the current track at higher quality
      // This helps with the transition to the lyrics page
      const currentCoverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
      if (currentCoverUrl) {
        preloadCoverImage(currentCoverUrl);
      }
    }
  }).Start();
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
