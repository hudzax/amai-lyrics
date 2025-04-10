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
      dynamicBackground.innerHTML = `
        <img class="Front" src="${coverUrl}" />
        <img class="Back" src="${coverUrl}" />
        <img class="BackCenter" src="${coverUrl}" />
      `;
      nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");
      nowPlayingBar.appendChild(dynamicBackground);
      cached.dynamicBg = dynamicBackground;
    } else {
      const imgs = cached.dynamicBg.querySelectorAll("img");
      imgs.forEach((img) => {
        img.src = coverUrl;
      });
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

async function main() {
  // Inject Google Fonts dynamically
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Vazirmatn&display=swap"; // Replace with your desired Google Fonts URL
  document.head.appendChild(fontLink);

  await Promise.all([
    initializePlatformAndSettings()
  ]);

  const button = setupUI();
  setupEventListeners(button);
  setupDynamicBackground(button);
}

export default main;
