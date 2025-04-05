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
  resetLyricsUI();

  const currFetching = storage.get('currentlyFetching');
  if (currFetching == 'true') return;

  storage.set('currentlyFetching', 'true');
  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
    ?.classList.remove('LyricsHidden');

  ClearLyricsPageContainer();

  const trackId = uri.split(':')[2];
  const localLyrics = await getLyricsFromLocalStorage(trackId);
  if (localLyrics) return localLyrics;
  const cachedLyrics = await getLyricsFromCache(trackId);
  if (cachedLyrics) return cachedLyrics;

  ShowLoaderContainer();

  return await fetchLyricsFromAPI(trackId);
}

async function fetchLyricsFromAPI(trackId: string) {
  try {
    Spicetify.showNotification('Fetching lyrics..', false, 1000);
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

    const hasKanji =
      lyricsJson.Content?.some((item) =>
        item.Lead?.Syllables?.some((syl) => /[\u4E00-\u9FFF]/.test(syl.Text)),
      ) ||
      lyricsJson.Content?.some((item) => /[\u4E00-\u9FFF]/.test(item.Text)) ||
      lyricsJson.Lines?.some((item) => /[\u4E00-\u9FFF]/.test(item.Text)) ||
      false;

    const hasKorean =
      lyricsJson.Content?.some((item) =>
        item.Lead?.Syllables?.some((syl) => /[\uAC00-\uD7AF]/.test(syl.Text)),
      ) ||
      lyricsJson.Content?.some((item) => /[\uAC00-\uD7AF]/.test(item.Text)) ||
      lyricsJson.Lines?.some((item) => /[\uAC00-\uD7AF]/.test(item.Text)) ||
      false;

    if (hasKanji) {
      if (storage.get('enable_romaji') === 'true') {
        lyricsJson = await generateRomaji(lyricsJson);
      } else {
        lyricsJson = await generateFurigana(lyricsJson);
      }
    } else if (hasKorean) {
      lyricsJson = await generateRomaja(lyricsJson);
    }

    console.log('DEBUG result', lyricsJson);
    storage.set('currentLyricsData', JSON.stringify(lyricsJson));
    storage.set('currentlyFetching', 'false');

    HideLoaderContainer();
    ClearLyricsPageContainer();

    if (lyricsCache) {
      const expiresAt = new Date().getTime() + 1000 * 60 * 60 * 24 * 7;
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
    Spicetify.showNotification('Completed', false, 1000);
    return { ...lyricsJson, fromCache: false };
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    storage.set('currentlyFetching', 'false');
    ClearLyricsPageContainer();
    return await noLyricsMessage(false, true);
  }
}

async function generateFurigana(lyricsJson) {
  return await generateLyricsWithPrompt(lyricsJson, Defaults.furiganaPrompt);
}

async function generateRomaja(lyricsJson) {
  return await generateLyricsWithPrompt(lyricsJson, Defaults.romajaPrompt);
}

async function generateRomaji(lyricsJson) {
  return await generateLyricsWithPrompt(lyricsJson, Defaults.romajiPrompt);
}

async function generateLyricsWithPrompt(lyricsJson, prompt) {
  if (!(await checkGeminiAPIKey(lyricsJson))) {
    return lyricsJson;
  }

  lyricsJson = await processLyricsWithGemini(
    lyricsJson,
    Defaults.systemInstruction,
    prompt,
  );

  return lyricsJson;
}

async function checkGeminiAPIKey(lyricsJson: any): Promise<boolean> {
  const GEMINI_API_KEY = storage.get('GEMINI_API_KEY')?.toString();
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.error('Amai Lyrics: Gemini API Key missing');
    lyricsJson.Info =
      'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';
    return false;
  }
  return true;
}

async function processLyricsWithGemini(
  lyricsJson: any,
  systemInstruction: string,
  prompt: string,
) {
  try {
    console.log('SI:', systemInstruction);
    console.log('Prompt:', prompt);
    console.log('Amai Lyrics: Gemini API Key present');
    const GEMINI_API_KEY = storage.get('GEMINI_API_KEY')?.toString();
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const generationConfig = {
      temperature: 0.258,
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
      } as any,
      systemInstruction: `${systemInstruction}`,
    };

    console.log('Amai Lyrics:', 'Fetch Begin');

    // Convert Syllable to Line
    if (lyricsJson.Type === 'Syllable') {
      lyricsJson.Type = 'Line';
      lyricsJson.Content = await convertLyrics(lyricsJson.Content);
    }

    // Extract lyrics from Line and Static types
    let lyricsOnly = await extractLyrics(lyricsJson);

    // if lyrics not empty
    if (lyricsOnly.length > 0) {
      lyricsJson.Raw = lyricsOnly;

      // Send lyrics to Gemini
      const response = await ai.models.generateContent({
        config: generationConfig,
        model: 'gemini-2.0-flash',
        contents: `${prompt} Here are the lyrics:\n${JSON.stringify(
          lyricsOnly,
        )}`,
      });
      // console.log(response.text);

      // Remove newline characters from the response
      let lyrics = JSON.parse(response.text.replace(/\\n/g, ''));

      if (lyricsJson.Type === 'Line') {
        lyricsJson.Content = lyricsJson.Content.map(
          (item: any, index: number) => ({
            ...item,
            Text: lyrics.lines[index],
          }),
        );
      } else if (lyricsJson.Type === 'Static') {
        lyricsJson.Lines = lyricsJson.Lines.map((item: any, index: number) => ({
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
  return lyricsJson;
}

async function extractLyrics(lyricsJson) {
  const removeEmptyLinesAndCharacters = (items) => {
    // Remove empty lines
    items = items.filter((item) => item.Text.trim() !== '');
    // Normalize and remove any issues from lyrics lines
    items = items.map((item) => {
      // Remove unwanted characters and normalize
      item.Text = item.Text.replace(/[「」]/g, '');
      item.Text = item.Text.normalize('NFKC');
      return item;
    });
    return items;
  };

  if (lyricsJson.Type === 'Line') {
    // Adjust start time to show line a little bit earlier
    const offset = 0.55;
    lyricsJson.Content = lyricsJson.Content.map((item) => ({
      ...item,
      StartTime: Math.max(0, item.StartTime - offset),
    }));

    lyricsJson.Content = removeEmptyLinesAndCharacters(lyricsJson.Content);
    return lyricsJson.Content.map((item) => item.Text);
  }

  if (lyricsJson.Type === 'Static') {
    lyricsJson.Lines = removeEmptyLinesAndCharacters(lyricsJson.Lines);
    return lyricsJson.Lines.map((item) => item.Text);
  }
}

async function getLyricsFromCache(trackId: string) {
  if (!lyricsCache) return null;

  try {
    const lyricsFromCache = await lyricsCache.get(trackId);
    if (!lyricsFromCache) return null;

    if (lyricsFromCache.expiresAt < new Date().getTime()) {
      await lyricsCache.remove(trackId);
      return null;
    }

    if (lyricsFromCache.status === 'NO_LYRICS') {
      return await noLyricsMessage(false, true);
    }

    storage.set('currentLyricsData', JSON.stringify(lyricsFromCache));
    storage.set('currentlyFetching', 'false');
    HideLoaderContainer();
    ClearLyricsPageContainer();
    Defaults.CurrentLyricsType = lyricsFromCache.Type;
    return { ...lyricsFromCache, fromCache: true };
  } catch (error) {
    ClearLyricsPageContainer();
    console.log('Error parsing saved lyrics data:', error);
    return await noLyricsMessage(false, true);
  }
}

async function getLyricsFromLocalStorage(trackId: string) {
  const savedLyricsData = storage.get('currentLyricsData')?.toString();

  if (!savedLyricsData) return null;

  try {
    if (savedLyricsData.includes('NO_LYRICS')) {
      const split = savedLyricsData.split(':');
      const id = split[1];
      if (id === trackId) {
        return await noLyricsMessage(false, true);
      }
    } else {
      const lyricsData = JSON.parse(savedLyricsData);
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

  return null;
}

function resetLyricsUI() {
  const lyricsContent = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (lyricsContent?.classList.contains('offline')) {
    lyricsContent.classList.remove('offline');
  }

  document
    .querySelector('#SpicyLyricsPage .ContentBox .LyricsContainer')
    ?.classList.remove('Hidden');

  if (!Fullscreen.IsOpen) PageView.AppendViewControls(true);

  // const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== 'track';
  // if (IsSomethingElseThanTrack) {
  //   return NotTrackMessage();
  // }

  //ShowLoaderContainer();
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
  Spicetify.showNotification('Lyrics unavailable', false, 1000);

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
