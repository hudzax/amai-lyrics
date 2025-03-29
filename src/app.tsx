import fetchLyrics from "./utils/Lyrics/fetchLyrics";
import { ScrollingIntervalTime } from "./utils/Lyrics/lyrics";
import storage from "./utils/storage";
import { setSettingsMenu } from "./utils/settings";
import PageView from "./components/Pages/PageView";
import { Icons } from "./components/Styling/Icons";
import ApplyDynamicBackground, { LowQMode_SetDynamicBackground } from "./components/DynamicBG/dynamicBackground";
import LoadFonts from "./components/Styling/Fonts";
import { IntervalManager } from "./utils/IntervalManager";
import { SpotifyPlayer } from "./components/Global/SpotifyPlayer";
import { IsPlaying } from "./utils/Addons";
import { ScrollToActiveLine } from "./utils/Scrolling/ScrollToActiveLine";
import { ScrollSimplebar } from "./utils/Scrolling/Simplebar/ScrollSimplebar";
import ApplyLyrics from "./utils/Lyrics/Global/Applyer";
import { UpdateNowBar } from "./components/Utils/NowBar";
import { requestPositionSync } from "./utils/Gets/GetProgress";
import "./components/PlaylistBGs/main";
// Currently Unused: import hasLyrics from "./functions/hasLyrics";

// CSS Imports
import "./css/default.css";
import "./css/Simplebar.css";
import "./css/ContentBox.css";
import "./css/DynamicBG/spicy-dynamic-bg.css"
import "./css/Lyrics/main.css"
import "./css/Lyrics/Mixed.css"
import "./css/Loaders/LoaderContainer.css"

import Global from "./components/Global/Global";
import Platform from "./components/Global/Platform";
import Whentil from "./utils/Whentil";
import Session from "./components/Global/Session";
import Defaults from "./components/Global/Defaults";
import sleep from "./utils/sleep";

async function main() {
  await Platform.OnSpotifyReady;

  if (!storage.get("show_topbar_notifications")) {
    storage.set("show_topbar_notifications", "false")
  }

  if (!storage.get("lyrics_spacing")) {
    storage.set("lyrics_spacing", "Medium");
  }

  // Cache the HTML element and set line spacing using a lookup map
  const htmlElement = document.documentElement;
  const spacingMap = {
    "None": "0",
    "Small": "0.5cqw 0",
    "Medium": "1cqw 0",
    "Large": "1.5cqw 0",
    "Extra Large": "2cqw 0"
  };
  const lyricsSpacing = storage.get("lyrics_spacing");
  if (spacingMap[lyricsSpacing]) {
    htmlElement.style.setProperty("--SpicyLyrics-LineSpacing", spacingMap[lyricsSpacing]);
  }
  
  // Lets set out the Settings Menu
  setSettingsMenu();

  const OldStyleFont = storage.get("old-style-font");
  if (OldStyleFont != "true") {
    LoadFonts();
  }

  // Lets import the required Scripts from our CDN
  {
    const scripts: HTMLScriptElement[] = [];
    const GetFullUrl = (target: string) => `https://cdn.jsdelivr.net/gh/hudzax/amai-lyrics/dist/${target}`;
    
    const AddScript = (scriptFileName: string) => {
      const script = document.createElement("script");
      script.async = false;
      script.src = GetFullUrl(scriptFileName);
      console.log("Adding Script:", script.src);
      script.onerror = () => {
        sleep(2).then(() => {
          window._spicy_lyrics?.func_main?._deappend_scripts();
          window._spicy_lyrics?.func_main?._add_script(scriptFileName);
          window._spicy_lyrics?.func_main?._append_scripts();
        })
      };
      scripts.push(script);
    }

    Global.SetScope("func_main._add_script", AddScript);

    // spicy-hasher.js
    AddScript("spicy-hasher.js");

    // pako.min.js
    AddScript("pako.min.js");

    // vibrant.min.js
    AddScript("vibrant.min.js");

    // Lets apply our Scripts
    const AppendScripts = () => {
      for (const script of scripts) {
        document.head.appendChild(script);
      }
    }
    const DeappendScripts = () => {
      for (const script of scripts) {
        document.head.removeChild(script);
      }
    }

    Global.SetScope("func_main._append_scripts", AppendScripts)
    Global.SetScope("func_main._deappend_scripts", DeappendScripts)
    AppendScripts();
  }

  const skeletonStyle = document.createElement("style");
  skeletonStyle.innerHTML = `
        <!-- This style is here to prevent the @keyframes removal in the CSS. I still don't know why that's happening. -->
        <!-- This is a part of Spicy Lyrics -->
        <style>
            @keyframes skeleton {
                to {
                    background-position-x: 0
                }
            }
        </style>
  `
  document.head.appendChild(skeletonStyle);
  

  let buttonRegistered = false;

  const button = new Spicetify.Playbar.Button(
    "Amai Lyrics",
    Icons.LyricsPage,
    (self) => {
        if (!self.active) {
          Session.Navigate({ pathname: "/SpicyLyrics" });
          //self.active = true;
        } else {
          Session.GoBack();
          //self.active = false;
        }
    },
    false, // Whether the button is disabled.
    false, // Whether the button is active.
  );

  Global.Event.listen("pagecontainer:available", () => {
    if (!buttonRegistered) {
      button.register();
      buttonRegistered = true;
    }
  })

  const Hometinue = async () => {
    // Because somethimes the "syncedPositon" was unavailable, I'm putting this check here that checks if the Spicetify?.Platform?.PlaybackAPI is available (which is then used in SpotifyPlayer.GetTrackPosition())
    Whentil.When(() => Spicetify.Platform.PlaybackAPI, () => {
      requestPositionSync();
    })

    // Lets set out Dynamic Background (spicy-dynamic-bg) to the now playing bar
    let lastImgUrl;

    /* Spicetify.Player.addEventListener("songchange", (event) => {
        const cover = event.data.item.metadata.image_url;
        applyDynamicBackgroundToNowPlayingBar(cover)
    }); */

    // Cache lowQMode flag once instead of multiple storage.get calls
    const lowQModeEnabled = storage.get("lowQMode") === "true";

    function applyDynamicBackgroundToNowPlayingBar(coverUrl: string) {
      if (lowQModeEnabled) return;
      const nowPlayingBar = document.querySelector<HTMLElement>(".Root__right-sidebar aside.NowPlayingView");

      try {
        if (nowPlayingBar == null) {
          lastImgUrl = null;
          return;
        };
        if (coverUrl === lastImgUrl) return;

        const dynamicBackground = document.createElement("div");
        dynamicBackground.classList.add("spicy-dynamic-bg");

        if (lowQModeEnabled) {
          /* CSSFilter({ blur: "20px" }, coverUrl).then(url => {
            dynamicBackground.innerHTML = `
                <img class="Front NoEffect" src="${url}" />
                <img class="Back NoEffect" src="${url}" />
                <img class="BackCenter NoEffect" src="${url}" />
            `
          }) */
        } else {
          dynamicBackground.innerHTML = `
            <img class="Front" src="${coverUrl}" />
            <img class="Back" src="${coverUrl}" />
            <img class="BackCenter" src="${coverUrl}" />
          `
        }
    
        nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");

        if (nowPlayingBar?.querySelector(".spicy-dynamic-bg")) {
          nowPlayingBar.querySelector(".spicy-dynamic-bg").remove();
        }
    
        nowPlayingBar.appendChild(dynamicBackground);

        lastImgUrl = coverUrl;
        //NOWPLAYINGBAR_DYNAMIC_BG_UPDATE_TIME = Date.now();
      } catch (error) {
        console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error) 
      }
    }

    /* function NOWPLAYINGBAR_DYNAMIC_BG() {
      if (Date.now() - NOWPLAYINGBAR_DYNAMIC_BG_UPDATE_TIME > NOWPLAYINGBAR_DYNAMIC_BG_THROTTLE_TIME) {
        applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
      }
    
      requestAnimationFrame(NOWPLAYINGBAR_DYNAMIC_BG)
    }

    NOWPLAYINGBAR_DYNAMIC_BG(); */

    new IntervalManager(1, () => {
      applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
    }).Start();

    Spicetify.Player.addEventListener("songchange", onSongChange);
    Spicetify.Player.addEventListener("songchange", async (event) => {
      fetchLyrics(event?.data?.item?.uri).then(ApplyLyrics);
      // Artist Header Image Prefetch (For a Faster Experience)
      if (lowQModeEnabled) {
        const CurrentSongArtist = event.data?.item.artists[0].uri;
        const CurrentSongUri = event.data?.item.uri;
        try {
          await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
        } catch (error) {
          console.error("Error prefetching Low Quality Mode Dynamic Background", error)
        }
      }
    })

    let songChangeLoopRan = 0;
    const songChangeLoopMax = 5;
    async function onSongChange(event) {
      let currentUri = event?.data?.item?.uri;
      if (!currentUri) {
        currentUri = Spicetify.Player.data?.item?.uri;
        if (!currentUri) {
          if (songChangeLoopRan >= songChangeLoopMax) {
            return;
          }
          onSongChange(event);
          songChangeLoopRan++;
          return;
        }
      };

      /* SpotifyPlayer.IsPodcast = event.data.item.type === "episode";
      if (document.querySelector("#SpicyLyricsPage")) {
        if (SpotifyPlayer.IsPodcast) {
          document.querySelector("#SpicyLyricsPage").classList.add("Podcast");
        } else {
          document.querySelector("#SpicyLyricsPage").classList.remove("Podcast");
        }
      }; */

      const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";

      if (IsSomethingElseThanTrack) {
        button.deregister();
        buttonRegistered = false;
      } else {
        if (!buttonRegistered) {
          button.register();
          buttonRegistered = true;
        }
      }

      if (!IsSomethingElseThanTrack) {
        // Prefetch Track Data
        await SpotifyPlayer.Track.GetTrackInfo();
        if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar")) UpdateNowBar();
      }

      applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url)
      songChangeLoopRan = 0;

      if (!document.querySelector("#SpicyLyricsPage .LyricsContainer")) return;
      ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .ContentBox"))
    }

    {
      fetchLyrics(Spicetify.Player.data.item.uri).then(ApplyLyrics);
    
      // Artist Header Image Prefetch (For a Faster Experience)
      {
        const lowQMode = storage.get("lowQMode");
        const lowQModeEnabled = lowQMode && lowQMode === "true";
        if (lowQModeEnabled) {
          const CurrentSongArtist = Spicetify.Player.data?.item.artists[0].uri;
          const CurrentSongUri = Spicetify.Player.data?.item.uri;
            try {
                await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
            } catch (error) {
                console.error("Error happened while trying to prefetch the Low Quality Mode Dynamic Background", error)
            }
        }
      }
    }


    /* Timeout(3, async () => {
      await checkIfLyrics(Spicetify.Player.data?.item.uri);
    }) */

    window.addEventListener("online", async () => {

      storage.set("lastFetchedUri", null);

      //await checkIfLyrics(Spicetify.Player.data?.item.uri);

      //button.disabled = false;

      fetchLyrics(Spicetify.Player.data?.item.uri).then(ApplyLyrics);
    });

    new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine(ScrollSimplebar)).Start();


    let lastLocation = null;

    function loadPage(location) {
      if (location.pathname === "/SpicyLyrics") {
        PageView.Open();
        button.active = true;
      } else {
        if (lastLocation?.pathname === "/SpicyLyrics") {
          PageView.Destroy();
          button.active = false;
        }
      }
      lastLocation = location;
    }

    Spicetify.Platform.History.listen(loadPage)
    
    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
      Global.Event.listen("pagecontainer:available", () => {
        loadPage(Spicetify.Platform.History.location);
        button.active = true;
      })
    }

    button.tippy.setContent("Amai Lyrics");

    Spicetify.Player.addEventListener("onplaypause", (e) => {
      SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
      Global.Event.evoke("playback:playpause", e);
    })

    {
      let lastLoopType = null;
      const LoopInt = new IntervalManager(0.2, () => {
        const LoopState = Spicetify.Player.getRepeat();
        const LoopType = LoopState === 1 ? "context" : LoopState === 2 ? "track" : "none";
        SpotifyPlayer.LoopType = LoopType;
        if (lastLoopType !== LoopType) {
          Global.Event.evoke("playback:loop", LoopType);
        }
        lastLoopType = LoopType;
      }).Start();
    }

    {
      let lastShuffleType = null;
      const ShuffleInt = new IntervalManager(0.2, () => {
        const ShuffleType = (Spicetify.Player.origin._state.smartShuffle ? "smart" : (Spicetify.Player.origin._state.shuffle ? "normal" : "none"));
        SpotifyPlayer.ShuffleType = ShuffleType;
        if (lastShuffleType !== ShuffleType) {
          Global.Event.evoke("playback:shuffle", ShuffleType);
        }
        lastShuffleType = ShuffleType;
      }).Start();
    }
    
    {
      let lastPosition = 0;
      const PositionInt = new IntervalManager(0.5, () => {
        const pos = SpotifyPlayer.GetTrackPosition();
        if (pos !== lastPosition) {
          Global.Event.evoke("playback:position", pos);
        }
        lastPosition = pos;
      }).Start();
    }

    SpotifyPlayer.IsPlaying = IsPlaying();

    // Events
    {
      Spicetify.Player.addEventListener("onplaypause", (e) => Global.Event.evoke("playback:playpause", e));
      Spicetify.Player.addEventListener("onprogress", (e) => Global.Event.evoke("playback:progress", e));
      Spicetify.Player.addEventListener("songchange", (e) => Global.Event.evoke("playback:songchange", e));

      Whentil.When(() => document.querySelector<HTMLElement>(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"), () => {
        Global.Event.evoke("pagecontainer:available", document.querySelector<HTMLElement>(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"))
      })

      Spicetify.Platform.History.listen(Session.RecordNavigation);
      Session.RecordNavigation(Spicetify.Platform.History.location);
    }
  }

  Whentil.When(() => Spicetify.Player.data.item.type, () => {
    const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";

    if (IsSomethingElseThanTrack) {
      button.deregister();
      buttonRegistered = false;
    } else {
      if (!buttonRegistered) {
        button.register();
        buttonRegistered = true;
      }
    }
  })


  Whentil.When(() => (
    SpicyHasher &&
    pako &&
    Vibrant
  ), Hometinue);


  
  /* setTimeout(() => {
    // Simulate the loaded version in Development. 
    // If you see this code be uncommented in the "main" Github branch, if you can IMMEDIATELY submit a new Issue on Github. This is supposed to only be here during development and not production.
    window._spicy_lyrics_metadata = {
      LoadedVersion: "0.0.0"
    };
    window._spicy_lyrics_metadata.LoadedVersion = "2.1.0"
  }, 0) */

}

/* 

// Add this into the code after build.

let ImporterMaid;

// ... code ...

ImporterMaid = new Maid(); // Do this when you find atleast one maid in the compiled code after it.

// ... code ...

export const UpdateNotice = {
	Type: "Notification",
	Name: "Spicy Lyrics"
}

export { ImporterMaid }

And then Minimize it.

(Reccomened: https://codebeautify.org/minify-js)

*/

export default main;
