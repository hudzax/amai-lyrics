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

function setupEventListeners(button) {
  // Set up listener to automatically update button registration when track type changes
  Whentil.When(
    () => Spicetify.Player.data.item?.type,
    () => updateButtonRegistration(button)
  );
}

/**
 * Apply optimized dynamic background to the now playing bar
 * Uses dual-image crossfade approach for smooth transitions
 */
function applyDynamicBackgroundToNowPlayingBar(coverUrl, cached) {
  if (!coverUrl) return;
  
  // Convert Spotify URI to proper URL if needed
  if (coverUrl.startsWith('spotify:image:')) {
    const imageId = coverUrl.replace('spotify:image:', '');
    coverUrl = `https://i.scdn.co/image/${imageId}`;
  }

  try {
    // Quick check for cached values to avoid unnecessary work
    if (coverUrl === cached.lastImgUrl && cached.dynamicBg) return;

    fastdom.readThenWrite(
      // Read phase
      () => {
        // Find the now playing bar if not cached
        if (!cached.nowPlayingBar) {
          cached.nowPlayingBar = document.querySelector(
            ".Root__right-sidebar aside.NowPlayingView"
          );
        }
        
        return {
          nowPlayingBar: cached.nowPlayingBar,
          hasDynamicBg: !!cached.dynamicBg,
          // If we already have a dynamic background, get the image elements
          images: cached.dynamicBg ? {
            imgA: cached.dynamicBg.querySelector('#bg-img-a'),
            imgB: cached.dynamicBg.querySelector('#bg-img-b')
          } : null
        };
      },
      // Write phase
      ({ nowPlayingBar, hasDynamicBg, images }) => {
        if (!nowPlayingBar) {
          cached.lastImgUrl = null;
          cached.dynamicBg = null;
          return;
        }

        // Set random CSS variables for variety
        const rotationPrimary = Math.floor(Math.random() * 360);
        const rotationSecondary = Math.floor(Math.random() * 360);
        document.documentElement.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
        document.documentElement.style.setProperty('--bg-rotation-secondary', `${rotationSecondary}deg`);
        
        const scalePrimary = 0.9 + Math.random() * 0.3;
        const scaleSecondary = 0.9 + Math.random() * 0.3;
        document.documentElement.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
        document.documentElement.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);
        
        const hueShift = Math.floor(Math.random() * 30);
        document.documentElement.style.setProperty('--bg-hue-shift', `${hueShift}deg`);

        if (!hasDynamicBg) {
          // Create new dynamic background container
          const dynamicBackground = document.createElement("div");
          dynamicBackground.className = "sweet-dynamic-bg";
          dynamicBackground.setAttribute('current-img', coverUrl);

          // Create placeholder
          const placeholder = document.createElement("div");
          placeholder.className = "placeholder";
          dynamicBackground.appendChild(placeholder);

          // Create image A (active)
          const imgA = document.createElement("img");
          imgA.id = "bg-img-a";
          imgA.className = "bg-image primary active";
          imgA.decoding = "async";
          imgA.loading = "eager";
          imgA.src = coverUrl;
          dynamicBackground.appendChild(imgA);

          // Create image B (inactive)
          const imgB = document.createElement("img");
          imgB.id = "bg-img-b";
          imgB.className = "bg-image secondary";
          imgB.decoding = "async";
          imgB.loading = "lazy";
          dynamicBackground.appendChild(imgB);

          // Add container to DOM
          nowPlayingBar.classList.add("sweet-dynamic-bg-in-this");
          nowPlayingBar.appendChild(dynamicBackground);

          // Mark as loaded after image loads
          imgA.onload = () => {
            requestAnimationFrame(() => {
              dynamicBackground.classList.add("sweet-dynamic-bg-loaded");
            });
          };

          cached.dynamicBg = dynamicBackground;
        } else if (images) {
          // Update existing background
          const { imgA, imgB } = images;
          const activeImg = imgA.classList.contains('active') ? imgA : imgB;
          const inactiveImg = activeImg === imgA ? imgB : imgA;

          // Update the inactive image source
          inactiveImg.src = coverUrl;

          // Once inactive image loads, start crossfade
          inactiveImg.onload = () => {
            requestAnimationFrame(() => {
              // Swap active classes
              activeImg.classList.remove('active');
              inactiveImg.classList.add('active');
              
              // Update container attribute
              cached.dynamicBg.setAttribute('current-img', coverUrl);
            });
          };
        }

        cached.lastImgUrl = coverUrl;
      }
    );
  } catch (error) {
    console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error);
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
    // Set up event listener for play/pause that updates the IsPlaying state and broadcasts the event
    Spicetify.Player.addEventListener("onplaypause", (e) => {
      SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
      Global.Event.evoke("playback:playpause", e);
    });
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

// setupSmartPreloading function has been removed

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
