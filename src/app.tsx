// Dynamic imports will be used for some modules for performance
import { ScrollingIntervalTime } from "./utils/Lyrics/lyrics";
import storage from "./utils/storage";
import { setSettingsMenu } from "./utils/settings";
import { Icons } from "./components/Styling/Icons";
import { IntervalManager } from "./utils/IntervalManager";
import { SpotifyPlayer } from "./components/Global/SpotifyPlayer";
import { IsPlaying } from "./utils/Addons";
import { ScrollSimplebar } from "./utils/Scrolling/Simplebar/ScrollSimplebar";
import fastdom from "./utils/fastdom";

// CSS Imports
import "./css/default.css";
import "./css/Simplebar.css";
import "./css/ContentBox.css";
import "./css/DynamicBG/sweet-dynamic-bg.css";
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

/**
 * Apply optimized dynamic background to the now playing bar
 * - Uses fewer DOM elements for better performance
 * - Implements canvas-based blur when supported
 * - Adapts to device capabilities
 */
function applyDynamicBackgroundToNowPlayingBar(coverUrl, cached) {
  if (!coverUrl) return;
  
  // Convert Spotify URI to proper URL if needed
  if (coverUrl.startsWith('spotify:image:')) {
    const imageId = coverUrl.replace('spotify:image:', '');
    coverUrl = `https://i.scdn.co/image/${imageId}`;
  }
  
  // Preload the cover image to improve future LCP
  preloadCoverImage(coverUrl);

  try {
    // Quick check for cached values to avoid unnecessary work
    if (coverUrl === cached.lastImgUrl && cached.dynamicBg) return;

    // Set random rotation degrees for variety
    const rotationPrimary = Math.floor(Math.random() * 360);
    const rotationSecondary = Math.floor(Math.random() * 360);
    document.documentElement.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
    document.documentElement.style.setProperty('--bg-rotation-secondary', `${rotationSecondary}deg`);
    
    // Set random scale variations for more dynamic effect
    const scalePrimary = 0.9 + Math.random() * 0.3; // Between 0.9 and 1.2
    const scaleSecondary = 0.9 + Math.random() * 0.3; // Between 0.9 and 1.2
    document.documentElement.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
    document.documentElement.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);
    
    // Set a random hue shift for variety
    const hueShift = Math.floor(Math.random() * 30);
    document.documentElement.style.setProperty('--bg-hue-shift', `${hueShift}deg`);

    // Use a single read-then-write pattern to avoid nesting and race conditions
    fastdom.readThenWrite(
      // Read phase - get all the elements we need
      () => {
        // Find the now playing bar if not cached
        if (!cached.nowPlayingBar) {
          cached.nowPlayingBar = document.querySelector(
            ".Root__right-sidebar aside.NowPlayingView"
          );
        }
        
        // Return everything we need for the write phase
        return {
          nowPlayingBar: cached.nowPlayingBar,
          hasDynamicBg: !!cached.dynamicBg,
          // If we already have a dynamic background, get the elements we need to update
          elements: cached.dynamicBg ? {
            primaryImg: cached.dynamicBg.querySelector(".primary"),
            secondaryImg: cached.dynamicBg.querySelector(".secondary"),
            canvasBg: cached.dynamicBg.querySelector(".canvas-bg")
          } : null
        };
      },
      // Write phase - create or update the dynamic background
      async ({ nowPlayingBar, hasDynamicBg, elements }) => {
        if (!nowPlayingBar) {
          cached.lastImgUrl = null;
          cached.dynamicBg = null;
          return;
        }

        // Check if we should use canvas for blur effects
        const supportsCanvas = typeof document !== 'undefined' && 
          !!document.createElement('canvas').getContext;
        
        if (!hasDynamicBg) {
          // Create the dynamic background container
          const dynamicBackground = document.createElement("div");
          dynamicBackground.classList.add("sweet-dynamic-bg");

          
          // Create a lightweight placeholder div first
          const placeholderDiv = document.createElement("div");
          placeholderDiv.className = "placeholder";
          dynamicBackground.appendChild(placeholderDiv);
          
          // Create primary image (formerly Front)
          const primaryImg = document.createElement("img");
          primaryImg.className = "primary";
          primaryImg.loading = "eager";
          primaryImg.decoding = "async";
          primaryImg.src = coverUrl;
          
          // Create secondary image (formerly Back)
          const secondaryImg = document.createElement("img");
          secondaryImg.className = "secondary";
          secondaryImg.loading = "lazy";
          secondaryImg.decoding = "async";
          secondaryImg.src = coverUrl;
          
          // Add images to container
          dynamicBackground.appendChild(primaryImg);
          dynamicBackground.appendChild(secondaryImg);
          
          // Add canvas-based blur if supported
          if (supportsCanvas) {
            // Create canvas in a non-blocking way
            setTimeout(() => {
              createBlurredCanvas(coverUrl).then(canvas => {
                // Only append if the container is still in the DOM
                if (dynamicBackground.isConnected) {
                  dynamicBackground.appendChild(canvas);
                }
              });
            }, 100);
          }
          
          // Add the container to the DOM
          nowPlayingBar.classList.add("sweet-dynamic-bg-in-this");
          nowPlayingBar.appendChild(dynamicBackground);
          
          // When primary image loads, add the loaded class to trigger transition
          primaryImg.onload = () => {
            requestAnimationFrame(() => {
              primaryImg.classList.add("loaded");
            });
          };
          
          // Mark container as loaded after a frame
          requestAnimationFrame(() => {
            dynamicBackground.classList.add("sweet-dynamic-bg-loaded");
          });
          
          cached.dynamicBg = dynamicBackground;
        } else if (elements) {
          // Update existing images with a more efficient approach
          const { primaryImg, secondaryImg, canvasBg } = elements;
          
          if (primaryImg) {
            // Preload the image to prevent flickering
            const newImg = new Image();
            newImg.onload = () => {
              requestAnimationFrame(() => {
                // Remove loaded class to start transition
                primaryImg.classList.remove("loaded");
                
                // Update src in the next frame
                requestAnimationFrame(() => {
                  primaryImg.src = coverUrl;
                  
                  // Add loaded class after image has loaded
                  primaryImg.onload = () => {
                    requestAnimationFrame(() => {
                      primaryImg.classList.add("loaded");
                    });
                  };
                });
              });
            };
            newImg.src = coverUrl;
          }
          
          // Update secondary image
          if (secondaryImg) {
            secondaryImg.src = coverUrl;
          }
          
          // Update canvas if supported and not in low quality mode
          if (supportsCanvas) {
            // Remove old canvas
            if (canvasBg) {
              canvasBg.remove();
            }
            
            // Create new canvas in a non-blocking way
            setTimeout(() => {
              createBlurredCanvas(coverUrl).then(canvas => {
                // Only append if the container is still in the DOM
                if (cached.dynamicBg && cached.dynamicBg.isConnected) {
                  cached.dynamicBg.appendChild(canvas);
                }
              });
            }, 100);
          }
        }
        
        cached.lastImgUrl = coverUrl;
      }
    );
  } catch (error) {
    console.error(
      "Error Applying the Dynamic BG to the NowPlayingBar:",
      error
    );
  }
}

/**
 * Creates a canvas-based blurred version of the image for better performance
 * This is more efficient than CSS blur filters on large images
 */
function createBlurredCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'canvas-bg';
    
    // Use a smaller canvas size for better performance
    canvas.width = 256;
    canvas.height = 256;
    
    // Set willReadFrequently to true for better performance with getImageData
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      resolve(canvas); // Return empty canvas if context not available
      return;
    }
    
    // Convert Spotify URI to proper URL if needed
    if (imageUrl.startsWith('spotify:image:')) {
      const imageId = imageUrl.replace('spotify:image:', '');
      imageUrl = `https://i.scdn.co/image/${imageId}`;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for CORS
    
    img.onload = () => {
      try {
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Apply a simple box blur - much more efficient than CSS blur
        for (let i = 0; i < 3; i++) { // Increased to 3 passes for stronger blur
          boxBlur(ctx, canvas, 15); // Increased blur radius for less recognizable images
        }
        
        // Mark as loaded after a frame to ensure smooth transition
        requestAnimationFrame(() => {
          canvas.classList.add('loaded');
          resolve(canvas);
        });
      } catch (error) {
        console.error('Error processing canvas:', error);
        resolve(canvas); // Return canvas even on error
      }
    };
    
    img.onerror = (e) => {
      console.error('Error loading image for canvas:', e);
      resolve(canvas); // Return empty canvas on error
    };
    
    // Set src after setting up event handlers
    img.src = imageUrl;
  });
}

/**
 * Simple and efficient box blur implementation
 * Much more performant than Gaussian blur for our purposes
 */
function boxBlur(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, radius: number) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    let runningTotal = [0, 0, 0];
    
    // Initial sum for the first radius pixels
    for (let x = 0; x < radius; x++) {
      const idx = (y * width + x) * 4;
      runningTotal[0] += pixels[idx];
      runningTotal[1] += pixels[idx + 1];
      runningTotal[2] += pixels[idx + 2];
    }
    
    // Blur horizontally
    for (let x = 0; x < width; x++) {
      // Add the next pixel to the sum
      if (x + radius < width) {
        const idx = (y * width + x + radius) * 4;
        runningTotal[0] += pixels[idx];
        runningTotal[1] += pixels[idx + 1];
        runningTotal[2] += pixels[idx + 2];
      }
      
      // Remove the trailing pixel from the sum
      if (x - radius - 1 >= 0) {
        const idx = (y * width + x - radius - 1) * 4;
        runningTotal[0] -= pixels[idx];
        runningTotal[1] -= pixels[idx + 1];
        runningTotal[2] -= pixels[idx + 2];
      }
      
      // Set the blurred value
      const currentIdx = (y * width + x) * 4;
      const count = Math.min(radius + x + 1, width) - Math.max(x - radius, 0);
      pixels[currentIdx] = runningTotal[0] / count;
      pixels[currentIdx + 1] = runningTotal[1] / count;
      pixels[currentIdx + 2] = runningTotal[2] / count;
    }
  }
  
  // Vertical pass
  for (let x = 0; x < width; x++) {
    let runningTotal = [0, 0, 0];
    
    // Initial sum for the first radius pixels
    for (let y = 0; y < radius; y++) {
      const idx = (y * width + x) * 4;
      runningTotal[0] += pixels[idx];
      runningTotal[1] += pixels[idx + 1];
      runningTotal[2] += pixels[idx + 2];
    }
    
    // Blur vertically
    for (let y = 0; y < height; y++) {
      // Add the next pixel to the sum
      if (y + radius < height) {
        const idx = ((y + radius) * width + x) * 4;
        runningTotal[0] += pixels[idx];
        runningTotal[1] += pixels[idx + 1];
        runningTotal[2] += pixels[idx + 2];
      }
      
      // Remove the trailing pixel from the sum
      if (y - radius - 1 >= 0) {
        const idx = ((y - radius - 1) * width + x) * 4;
        runningTotal[0] -= pixels[idx];
        runningTotal[1] -= pixels[idx + 1];
        runningTotal[2] -= pixels[idx + 2];
      }
      
      // Set the blurred value
      const currentIdx = (y * width + x) * 4;
      const count = Math.min(radius + y + 1, height) - Math.max(y - radius, 0);
      pixels[currentIdx] = runningTotal[0] / count;
      pixels[currentIdx + 1] = runningTotal[1] / count;
      pixels[currentIdx + 2] = runningTotal[2] / count;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
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

  const cached = {
    nowPlayingBar: null,
    dynamicBg: null,
    lastImgUrl: null
  };

  new IntervalManager(1, () => {
    const coverUrl = Spicetify.Player.data?.item?.metadata?.image_url;
    applyDynamicBackgroundToNowPlayingBar(coverUrl, cached);
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
      cached
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
 * - Avoids unnecessary DOM operations that could cause flickering
 */
function preloadCoverImage(coverUrl) {
  if (!coverUrl) return;
  
  const now = Date.now();
  
  // Check if image is already in cache and not expired - this is a memory operation, not DOM
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
    // Add to cache with current timestamp - pure memory operation, no DOM
    imageCache.set(coverUrl, { timestamp: now, loaded: false });
    
    // Use Image() constructor for preloading
    const img = new Image();
    
    // Set decode="async" to hint to the browser that it can decode the image asynchronously
    img.decoding = "async";
    
    img.onload = () => {
      // Mark as successfully loaded in cache - pure memory operation, no DOM
      if (imageCache.has(coverUrl)) {
        const entry = imageCache.get(coverUrl);
        imageCache.set(coverUrl, { ...entry, loaded: true });
      }
    };
    
    // Set src after setting up onload handler
    img.src = coverUrl;
    
    // Clean up cache if it gets too large - pure memory operation, no DOM
    if (imageCache.size > maxCachedCovers) {
      // Don't use fastdom for this since it's just memory operations
      // This avoids unnecessary scheduling and potential race conditions
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries until we're back to max size
      const entriesToRemove = entries.slice(0, entries.length - maxCachedCovers);
      for (const [key] of entriesToRemove) {
        imageCache.delete(key);
      }
    }
  };
  
  // Use requestIdleCallback if available, otherwise use setTimeout with a small delay
  // The small delay helps prevent immediate execution that could cause flickering
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(preloadFunc, { timeout: 1000 });
  } else {
    // Use a 1ms timeout instead of 0 to give the browser a chance to batch operations
    setTimeout(preloadFunc, 1);
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
        document.querySelectorAll('.sweet-dynamic-bg').forEach(bg => {
          bg.classList.add('sweet-dynamic-bg-loaded');
        });
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        document.querySelectorAll('.sweet-dynamic-bg').forEach(bg => {
          bg.classList.add('sweet-dynamic-bg-loaded');
        });
      }, 1000);
    }
  });
}

export default main;
