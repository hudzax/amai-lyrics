import { SpikyCache } from '@hudzax/web-modules/SpikyCache';
import storage from '../storage';
import Defaults from '../../components/Global/Defaults';
import {
  CloseNowBar,
  DeregisterNowBarBtn,
  OpenNowBar,
} from '../../components/Utils/NowBar';
import PageView from '../../components/Pages/PageView';
import Fullscreen from '../../components/Utils/Fullscreen';
import { getLyrics } from '../API/Lyrics';
import Platform from '../../components/Global/Platform';
import { GoogleGenAI } from '@google/genai';

export const lyricsCache = new SpikyCache({
  name: 'Cache_Lyrics',
});

export default async function fetchLyrics(uri: string) {
  if (
    document
      .querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent')
      ?.classList.contains('offline')
  ) {
    document
      .querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent')
      .classList.remove('offline');
  }

  document
    .querySelector('#SpicyLyricsPage .ContentBox .LyricsContainer')
    ?.classList.remove('Hidden');

  if (!Fullscreen.IsOpen) PageView.AppendViewControls(true);

  const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== 'track';
  if (IsSomethingElseThanTrack) {
    return NotTrackMessage();
  }

  //ShowLoaderContainer();

  const currFetching = storage.get('currentlyFetching');
  if (currFetching == 'true') return;

  storage.set('currentlyFetching', 'true');

  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
    ?.classList.remove('LyricsHidden');

  ClearLyricsPageContainer();

  // I'm not sure if this will entirely work, because in my country the Spotify DJ isn't available. So if anybody finds out that this doesn't work, please let me know.
  if (
    Spicetify.Player.data?.item?.type &&
    Spicetify.Player.data?.item?.type === 'unknown' &&
    Spicetify.Player.data?.item?.provider &&
    Spicetify.Player.data?.item?.provider?.startsWith('narration')
  )
    return DJMessage();

  if (
    Spicetify.Player.data?.item?.mediaType &&
    Spicetify.Player.data?.item?.mediaType !== 'audio'
  )
    return NotTrackMessage();

  const trackId = uri.split(':')[2];

  // Check if there's already data in localStorage
  const savedLyricsData = storage.get('currentLyricsData')?.toString();

  if (savedLyricsData) {
    try {
      if (savedLyricsData.includes('NO_LYRICS')) {
        const split = savedLyricsData.split(':');
        const id = split[1];
        if (id === trackId) {
          return await noLyricsMessage(false, true);
        }
      } else {
        const lyricsData = JSON.parse(savedLyricsData);
        // Return the stored lyrics if the ID matches the track ID
        if (lyricsData?.id === trackId) {
          storage.set('currentlyFetching', 'false');
          HideLoaderContainer();
          ClearLyricsPageContainer();
          Defaults.CurrentLyricsType = lyricsData.Type;
          return lyricsData;
        }
      }
    } catch (error) {
      console.error('Error parsing saved lyrics data:', error);
      storage.set('currentlyFetching', 'false');
      HideLoaderContainer();
      ClearLyricsPageContainer();
    }
  }

  // FOR DEBUG PURPOSE ONLY
  // lyricsCache.destroy();

  if (lyricsCache) {
    try {
      const lyricsFromCache = await lyricsCache.get(trackId);
      if (lyricsFromCache) {
        if (
          navigator.onLine &&
          lyricsFromCache?.expiresAt < new Date().getTime()
        ) {
          await lyricsCache.remove(trackId);
        } else {
          if (lyricsFromCache?.status === 'NO_LYRICS') {
            return await noLyricsMessage(false, true);
          }
          storage.set('currentLyricsData', JSON.stringify(lyricsFromCache));
          storage.set('currentlyFetching', 'false');
          HideLoaderContainer();
          ClearLyricsPageContainer();
          Defaults.CurrentLyricsType = lyricsFromCache.Type;
          return { ...lyricsFromCache, fromCache: true };
        }
      }
    } catch (error) {
      ClearLyricsPageContainer();
      console.log('Error parsing saved lyrics data:', error);
      return await noLyricsMessage(false, true);
    }
  }

  if (!navigator.onLine) return urOfflineMessage();

  ShowLoaderContainer();

  // Fetch new lyrics if no match in localStorage
  /* const lyricsApi = storage.get("customLyricsApi") ?? Defaults.LyricsContent.api.url;
    const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.LyricsContent.api.accessToken; */

  try {
    Spicetify.showNotification('Fetching lyrics..', false, 2000);
    const SpotifyAccessToken = await Platform.GetSpotifyAccessToken();

    let status = 0;

    const getLyricsResult = await getLyrics(trackId, {
      Authorization: `Bearer ${SpotifyAccessToken}`,
    });

    let lyricsJson = getLyricsResult.response;
    status = getLyricsResult.status;

    if (
      !lyricsJson ||
      (typeof lyricsJson === 'object' && !('id' in lyricsJson))
    ) {
      lyricsJson = '';
    }

    if (status !== 200) {
      if (status === 500) return await noLyricsMessage(false, true);
      if (status === 401) {
        storage.set('currentlyFetching', 'false');
        //fetchLyrics(uri);
        //window.location.reload();
        return await noLyricsMessage(false, false);
      }
      ClearLyricsPageContainer();
      if (status === 404) {
        return await noLyricsMessage(false, true);
      }
      return await noLyricsMessage(false, true);
    }

    ClearLyricsPageContainer();

    if (lyricsJson === null) return await noLyricsMessage(false, false);
    if (lyricsJson === '') return await noLyricsMessage(false, true);

    console.log('DEBUG raw', lyricsJson);

    // Determine if any line in the lyrics contains Kanji characters (using RegExp.test for a boolean result)
    const hasKanji =
      lyricsJson.Content?.some((item) =>
        item.Lead?.Syllables?.some((syl) => /[\u4E00-\u9FFF]/.test(syl.Text)),
      ) ||
      lyricsJson.Content?.some((item) => /[\u4E00-\u9FFF]/.test(item.Text)) ||
      lyricsJson.Lines?.some((item) => /[\u4E00-\u9FFF]/.test(item.Text)) ||
      false;

    if (hasKanji) {
      lyricsJson = await generateFurigana(lyricsJson);
      console.log('DEBUG result', lyricsJson);
    }

    // Store the new lyrics in localStorage
    storage.set('currentLyricsData', JSON.stringify(lyricsJson));

    storage.set('currentlyFetching', 'false');

    HideLoaderContainer();

    ClearLyricsPageContainer();

    if (lyricsCache) {
      const expiresAt = new Date().getTime() + 1000 * 60 * 60 * 24 * 7; // Expire after 7 days

      try {
        await lyricsCache.set(trackId, {
          ...lyricsJson,
          expiresAt,
        });
      } catch (error) {
        console.error('Error saving lyrics to cache:', error);
      }
    }

    Defaults.CurrentLyricsType = lyricsJson.Type;
    Spicetify.showNotification('Completed', false, 2000);
    return { ...lyricsJson, fromCache: false };
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    storage.set('currentlyFetching', 'false');
    ClearLyricsPageContainer();
    return await noLyricsMessage(false, true);
  }
}

async function generateFurigana(lyricsJson) {
  // storage.set("GEMINI_API_KEY", "");
  // Initialize Gemini API
  const GEMINI_API_KEY = storage.get('GEMINI_API_KEY')?.toString();
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.error('Amai Lyrics: Gemini API Key missing');
    // Add info message to lyrics
    lyricsJson.Info =
      'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';
  } else {
    try {
      console.log('Amai Lyrics: Gemini API Key present');
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const generationConfig = {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: [],
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            lines: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      };

      console.log('Amai Lyrics:', 'Fetch Begin');

      // Convert Syllable to Line
      if (lyricsJson.Type === 'Syllable') {
        lyricsJson.Type = 'Line';
        lyricsJson.Content = await convertLyrics(lyricsJson.Content);
      }

      // console.log('DEBUG', lyricsJson.Content);

      // Extract lyrics from Line and Static types
      let lyricsOnly = [];
      if (lyricsJson.Type === 'Line') {
        // Adjust start time to show line a little bit earlier
        const offset = 0.55;
        lyricsJson.Content = lyricsJson.Content.map((item) => ({
          ...item,
          StartTime: Math.max(0, item.StartTime - offset),
        }));
        lyricsOnly = lyricsJson.Content.map((item) => item.Text);
      }
      if (lyricsJson.Type === 'Static')
        lyricsOnly = lyricsJson.Lines.map((item) => item.Text);

      // if lyrics not empty
      if (lyricsOnly.length > 0) {
        // Store raw lyrics for translation
        lyricsJson.Raw = lyricsOnly;

        // Send lyrics to Gemini
        const response = await ai.models.generateContent({
          config: generationConfig,
          model: 'gemini-2.0-flash',
          contents: `You are the expert in Japanese language, specializing in kanji readings and song lyrics. Follow these instructions carefully: For each words in the following lyrics, identify all kanji characters then add their furigana within curly braces, following standard Japanese orthography. Follow this examples: 願い should be written as 願{ねが}い, 可愛い should be written as 可愛{かわい}い, 5人 should be written as 5人{にん}, 明後日 should be written as 明後日{あさって}, 神様 should be written as 神様{かみさま}, 聞き should be written as 聞{き}き etc. Use context-appropriate readings for each kanji based on standard Japanese usage. Here are the lyrics: ${JSON.stringify(
            lyricsOnly,
          )}`,
        });
        // console.log(response.text);

        // Remove newline characters from the response
        let lyrics = JSON.parse(response.text.replace(/\n/g, ''));

        if (lyricsJson.Type === 'Line') {
          lyricsJson.Content = lyricsJson.Content.map((item, index) => ({
            ...item,
            Text: lyrics.lines[index],
          }));
        } else if (lyricsJson.Type === 'Static') {
          lyricsJson.Lines = lyricsJson.Lines.map((item, index) => ({
            ...item,
            Text: lyrics.lines[index],
          }));
        }
      }
    } catch (error) {
      console.error('Amai Lyrics:', error);
      // Add info message to lyrics
      lyricsJson.Info =
        'Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.';
    }
  }

  return lyricsJson;
}

function convertLyrics(data) {
  console.log('DEBUG', 'Converting Syllable to Line type');
  return data.map((item) => {
    // Join words: add a space if switching from non-Japanese to Japanese syllables
    let leadText = '';
    let prevIsJapanese: boolean | null = null;
    item.Lead.Syllables.forEach((syl: { Text: string }) => {
      const currentIsJapanese =
        /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/.test(syl.Text);
      if (currentIsJapanese) {
        if (prevIsJapanese === false && leadText) {
          leadText += ' ';
        }
        leadText += syl.Text;
      } else {
        // For non-Japanese, add a space before appending if leadText isn't empty
        leadText += (leadText ? ' ' : '') + syl.Text;
      }
      prevIsJapanese = currentIsJapanese;
    });
    let startTime = item.Lead.StartTime;
    let endTime = item.Lead.EndTime;
    let fullText = leadText;

    // If there is a Background array, process each background part:
    if (item.Background && Array.isArray(item.Background)) {
      const bgTexts = item.Background.map((bg) => {
        // Update start and end times if needed:
        startTime = Math.min(startTime, bg.StartTime);
        endTime = Math.max(endTime, bg.EndTime);

        let bgText = '';
        let prevIsJapanese: boolean | null = null;
        bg.Syllables.forEach((syl: { Text: string }) => {
          const currentIsJapanese =
            /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/.test(
              syl.Text,
            );
          if (currentIsJapanese) {
            if (prevIsJapanese === false && bgText) {
              bgText += ' ';
            }
            bgText += syl.Text;
          } else {
            bgText += (bgText ? ' ' : '') + syl.Text;
          }
          prevIsJapanese = currentIsJapanese;
        });
        return bgText;
      });
      // Append background texts joined like the lead text
      fullText += ' (' + bgTexts.join(' ') + ')';
    }

    // console.log('DEBUG', fullText);
    return {
      Type: item.Type,
      OppositeAligned: item.OppositeAligned,
      Text: fullText,
      StartTime: startTime,
      EndTime: endTime,
    };
  });
}

async function noLyricsMessage(Cache = true, LocalStorage = true) {
  Spicetify.showNotification('Lyrics unavailable', false, 2000);

  LocalStorage
    ? storage.set(
        'currentLyricsData',
        `NO_LYRICS:${Spicetify.Player.data.item.uri.split(':')[2]}`,
      )
    : null;

  if (lyricsCache && Cache) {
    const expiresAt = new Date().getTime() + 1000 * 60 * 60 * 24 * 7; // Expire after 7 days

    try {
      await lyricsCache.set(Spicetify.Player.data.item.uri.split(':')[2], {
        status: `NO_LYRICS`,
        expiresAt,
      });
    } catch (error) {
      console.error('Error saving lyrics to cache:', error);
    }
  }

  storage.set('currentlyFetching', 'false');

  HideLoaderContainer();

  Defaults.CurrentLyricsType = 'None';

  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox .LyricsContainer')
    ?.classList.add('Hidden');
  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
    ?.classList.add('LyricsHidden');

  OpenNowBar();

  DeregisterNowBarBtn();

  return '1';
}

function urOfflineMessage() {
  const Message = {
    Type: 'Static',
    alternative_api: false,
    offline: true,
    Lines: [
      {
        Text: "You're offline",
      },
      {
        Text: '',
      },
      {
        Text: "[DEF=font_size:small]This extension works only if you're online.",
      },
    ],
  };

  storage.set('currentlyFetching', 'false');

  HideLoaderContainer();

  ClearLyricsPageContainer();

  Defaults.CurrentLyricsType = Message.Type;

  return Message;
}

function DJMessage() {
  const Message = {
    Type: 'Static',
    alternative_api: false,
    styles: {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'flex-direction': 'column',
    },
    Lines: [
      {
        Text: 'DJ Mode is On',
      },
      {
        Text: '',
      },
      {
        Text: '[DEF=font_size:small]If you want to load lyrics, please select a Song.',
      },
    ],
  };

  storage.set('currentlyFetching', 'false');

  HideLoaderContainer();

  ClearLyricsPageContainer();

  Defaults.CurrentLyricsType = Message.Type;

  return Message;
}

function NotTrackMessage() {
  const Message = {
    Type: 'Static',
    styles: {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'flex-direction': 'column',
    },
    Lines: [
      {
        Text: "[DEF=font_size:small]You're playing an unsupported Content Type",
      },
    ],
  };

  storage.set('currentlyFetching', 'false');

  HideLoaderContainer();

  ClearLyricsPageContainer();
  CloseNowBar();

  Defaults.CurrentLyricsType = Message.Type;

  return Message;
}

let ContainerShowLoaderTimeout;

function ShowLoaderContainer() {
  if (
    document.querySelector('#SpicyLyricsPage .LyricsContainer .loaderContainer')
  ) {
    ContainerShowLoaderTimeout = setTimeout(
      () =>
        document
          .querySelector('#SpicyLyricsPage .LyricsContainer .loaderContainer')
          .classList.add('active'),
      1000,
    );
  }
}

function HideLoaderContainer() {
  if (
    document.querySelector('#SpicyLyricsPage .LyricsContainer .loaderContainer')
  ) {
    if (ContainerShowLoaderTimeout) {
      clearTimeout(ContainerShowLoaderTimeout);
      ContainerShowLoaderTimeout = null;
    }
    document
      .querySelector('#SpicyLyricsPage .LyricsContainer .loaderContainer')
      .classList.remove('active');
  }
}

function ClearLyricsPageContainer() {
  if (
    document.querySelector('#SpicyLyricsPage .LyricsContainer .LyricsContent')
  ) {
    document.querySelector(
      '#SpicyLyricsPage .LyricsContainer .LyricsContent',
    ).innerHTML = '';
  }
}
