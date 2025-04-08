/**
 * Amai Lyrics - Lyrics fetching and processing module
 *
 * This module handles fetching, processing, and displaying lyrics for Spotify tracks.
 * It supports multiple languages, translations, and phonetic transcriptions.
 */

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

// ==============================
// Types
// ==============================

/**
 * Represents a syllable in lyrics
 */
interface Syllable {
  Text: string;
  StartTime?: number;
  EndTime?: number;
}

/**
 * Represents a line or section of lyrics
 */
interface LyricsLine {
  Type?: string;
  OppositeAligned?: boolean;
  Text: string;
  StartTime?: number;
  EndTime?: number;
  Translation?: string;
  Lead?: {
    StartTime: number;
    EndTime: number;
    Syllables: Syllable[];
  };
}

/**
 * Represents the structure of lyrics data
 */
interface LyricsData {
  id?: string;
  Type: string;
  Content?: LyricsLine[];
  Lines?: LyricsLine[];
  Raw?: string[];
  Info?: string;
  status?: string;
  expiresAt?: number;
  fromCache?: boolean;
}

/**
 * Configuration for Gemini API
 */
interface GeminiConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseModalities: any[];
  responseMimeType: string;
  responseSchema: any;
  systemInstruction: string;
}

/**
 * Response from lyrics API
 */
interface LyricsResponse {
  response: any;
  status: number;
}

// ==============================
// Constants
// ==============================

// Regular expressions for language detection
const JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\uf900-\ufaff]/;
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

// Cache expiration time: 7 days in milliseconds
const CACHE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7;

// Timing offset for lyrics synchronization
const LYRICS_TIMING_OFFSET = 0.55;

// ==============================
// Cache Setup
// ==============================

export const lyricsCache = new SpikyCache({
  name: 'Cache_Lyrics',
});

// ==============================
// Main Export Function
// ==============================

/**
 * Main function to fetch lyrics for a given Spotify track URI
 *
 * @param uri - Spotify track URI
 * @returns Processed lyrics data or error message
 */
export default async function fetchLyrics(
  uri: string,
): Promise<LyricsData | string> {
  // Reset UI and prepare for new lyrics
  resetLyricsUI();
  ClearLyricsPageContainer();
  document
    .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
    ?.classList.remove('LyricsHidden');

  // Extract track ID from URI
  const trackId = uri.split(':')[2];

  // Try to get lyrics from local storage first
  const localLyrics = await getLyricsFromLocalStorage(trackId);
  if (localLyrics) return localLyrics;

  // Then try from cache
  const cachedLyrics = await getLyricsFromCache(trackId);
  if (cachedLyrics) return cachedLyrics;

  // Prevent multiple simultaneous fetches
  const currFetching = storage.get('currentlyFetching');
  if (currFetching === 'true') {
    Spicetify.showNotification('Currently fetching, please wait..');
    return 'Currently fetching lyrics';
  }

  // Mark as fetching and update UI
  storage.set('currentlyFetching', 'true');

  // Show loading indicator and fetch from API
  ShowLoaderContainer();
  return await fetchLyricsFromAPI(trackId);
}

// ==============================
// Lyrics Fetching Functions
// ==============================

/**
 * Fetches lyrics from Spotify API and processes them
 *
 * @param trackId - Spotify track ID
 * @returns Processed lyrics data or error message
 */
async function fetchLyricsFromAPI(
  trackId: string,
): Promise<LyricsData | string> {
  try {
    Spicetify.showNotification('Fetching lyrics..', false, 1000);

    // Get Spotify access token for API request
    const spotifyAccessToken = await Platform.GetSpotifyAccessToken();

    // Fetch lyrics from API
    const getLyricsResult = await getLyrics(trackId, {
      Authorization: `Bearer ${spotifyAccessToken}`,
    });

    let lyricsJson = getLyricsResult.response;
    const status = getLyricsResult.status;

    // Handle invalid response format
    if (
      !lyricsJson ||
      (typeof lyricsJson === 'object' && !('id' in lyricsJson))
    ) {
      lyricsJson = '';
    }

    // Handle error status codes
    if (status !== 200) {
      return handleErrorStatus(status);
    }

    // Handle empty responses
    if (lyricsJson === null) return await noLyricsMessage(trackId);
    if (lyricsJson === '') return await noLyricsMessage(trackId);

    // Process the lyrics for display and AI enhancement
    return await processAndEnhanceLyrics(trackId, lyricsJson);
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    storage.set('currentlyFetching', 'false');
    ClearLyricsPageContainer();
    return await noLyricsMessage();
  }
}

/**
 * Handles API error status codes
 *
 * @param status - HTTP status code
 * @returns Error message
 */
async function handleErrorStatus(status: number): Promise<string> {
  if (status === 401) {
    storage.set('currentlyFetching', 'false');
    return await noLyricsMessage();
  }

  ClearLyricsPageContainer();
  return await noLyricsMessage();
}

/**
 * Processes and enhances lyrics with AI features
 *
 * @param trackId - Spotify track ID
 * @param lyricsJson - Raw lyrics data from API
 * @returns Enhanced lyrics data
 */
async function processAndEnhanceLyrics(
  trackId: string,
  lyricsJson: any,
): Promise<LyricsData> {
  // Prepare lyrics for Gemini processing
  const { lyricsJson: preparedLyricsJson, lyricsOnly } =
    await prepareLyricsForGemini(lyricsJson);

  // Detect languages in lyrics
  const { hasKanji, hasKorean } = detectLanguages(preparedLyricsJson);

  // Clone prepared lyrics for phonetic processing to avoid mutation conflicts
  const phoneticLyricsJson = JSON.parse(JSON.stringify(preparedLyricsJson));

  // Process lyrics in parallel: phonetics and translations
  const [processedLyricsJson, translations] = await Promise.all([
    getPhoneticLyrics(phoneticLyricsJson, hasKanji, hasKorean, lyricsOnly),
    fetchTranslationsWithGemini(preparedLyricsJson, lyricsOnly),
  ]);

  // Attach translations to phonetic-processed lyrics
  attachTranslations(processedLyricsJson, translations);

  // Cache the results
  await cacheLyrics(trackId, processedLyricsJson);

  // Save processed lyrics and update UI
  storage.set('currentlyFetching', 'false');
  // Check if current song match with lyrics
  if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
    // Notify user
    Spicetify.showNotification('Completed', false, 1000);
    Defaults.CurrentLyricsType = processedLyricsJson.Type;
    storage.set('currentLyricsData', JSON.stringify(processedLyricsJson));
    HideLoaderContainer();
    ClearLyricsPageContainer();
  }

  return { ...processedLyricsJson, fromCache: false };
}

/**
 * Detects Japanese and Korean characters in lyrics
 *
 * @param lyricsJson - Lyrics data
 * @returns Object with language detection flags
 */
function detectLanguages(lyricsJson: LyricsData): {
  hasKanji: boolean;
  hasKorean: boolean;
} {
  // Check for Japanese characters
  const hasKanji =
    lyricsJson.Content?.some((item) =>
      item.Lead?.Syllables?.some((syl) => JAPANESE_REGEX.test(syl.Text)),
    ) ||
    lyricsJson.Content?.some((item) => JAPANESE_REGEX.test(item.Text)) ||
    lyricsJson.Lines?.some((item) => JAPANESE_REGEX.test(item.Text)) ||
    false;

  // Check for Korean characters
  const hasKorean =
    lyricsJson.Content?.some((item) =>
      item.Lead?.Syllables?.some((syl) => KOREAN_REGEX.test(syl.Text)),
    ) ||
    lyricsJson.Content?.some((item) => KOREAN_REGEX.test(item.Text)) ||
    lyricsJson.Lines?.some((item) => KOREAN_REGEX.test(item.Text)) ||
    false;

  return { hasKanji, hasKorean };
}

/**
 * Attaches translations to lyrics lines
 *
 * @param lyricsJson - Lyrics data
 * @param translations - Array of translated lines
 */
function attachTranslations(
  lyricsJson: LyricsData,
  translations: string[],
): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content.forEach((line, idx) => {
      line.Translation = translations[idx] || '';
    });
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines.forEach((line, idx) => {
      line.Translation = translations[idx] || '';
    });
  }
}

/**
 * Caches processed lyrics for future use
 *
 * @param trackId - Spotify track ID
 * @param lyricsJson - Processed lyrics data
 */
async function cacheLyrics(
  trackId: string,
  lyricsJson: LyricsData,
): Promise<void> {
  if (!lyricsCache) return;

  const expiresAt = new Date().getTime() + CACHE_EXPIRATION_TIME;
  try {
    await lyricsCache.set(trackId, {
      ...lyricsJson,
      expiresAt,
    });
  } catch (error) {
    console.error('Error saving lyrics to cache:', error);
  }
}

// ==============================
// Lyrics Processing Functions
// ==============================

/**
 * Gets phonetic lyrics based on detected language
 *
 * @param lyricsJson - Lyrics data
 * @param hasKanji - Whether Japanese characters are detected
 * @param hasKorean - Whether Korean characters are detected
 * @param lyricsOnly - Array of lyrics text only
 * @returns Processed lyrics with phonetics
 */
async function getPhoneticLyrics(
  lyricsJson: LyricsData,
  hasKanji: boolean,
  hasKorean: boolean,
  lyricsOnly: string[],
): Promise<LyricsData> {
  if (hasKanji) {
    // For Japanese, use either romaji or furigana based on settings
    if (storage.get('enable_romaji') === 'true') {
      return await generateRomaji(lyricsJson, lyricsOnly);
    } else {
      return await generateFurigana(lyricsJson, lyricsOnly);
    }
  } else if (hasKorean) {
    // For Korean, use romaja
    return await generateRomaja(lyricsJson, lyricsOnly);
  } else {
    // For other languages, return as is
    return lyricsJson;
  }
}

/**
 * Prepares lyrics for Gemini AI processing
 *
 * @param lyricsJson - Raw lyrics data
 * @returns Prepared lyrics and text-only array
 */
async function prepareLyricsForGemini(
  lyricsJson: any,
): Promise<{ lyricsJson: LyricsData; lyricsOnly: string[] }> {
  // Convert Syllable to Line if needed
  if (lyricsJson.Type === 'Syllable') {
    lyricsJson.Type = 'Line';
    lyricsJson.Content = await convertLyrics(lyricsJson.Content);
  }

  // Extract lyrics from Line and Static types
  const lyricsOnly = await extractLyrics(lyricsJson);

  if (lyricsOnly.length > 0) {
    lyricsJson.Raw = lyricsOnly;
  }

  return { lyricsJson, lyricsOnly };
}

/**
 * Fetches translations using Gemini AI
 *
 * @param lyricsJson - Lyrics data
 * @param lyricsOnly - Array of lyrics text only
 * @returns Array of translated lines
 */
async function fetchTranslationsWithGemini(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<string[]> {
  // Check if translations are disabled
  if (storage.get('disable_translation') === 'true') {
    console.log('Amai Lyrics: Translation disabled');
    return lyricsOnly.map(() => '');
  }

  try {
    console.log('[Amai Lyrics] Translation fetch started');

    // Check for API key
    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
    if (!geminiApiKey || geminiApiKey === '') {
      console.error('Amai Lyrics: Gemini API Key missing for translation');
      return lyricsOnly.map(() => '');
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Configure generation parameters
    const generationConfig = createGeminiConfig(
      Defaults.systemInstruction,
      0.85,
    );

    // Get target language from settings or defaults
    const targetLang =
      storage.get('translation_language')?.toString() ||
      Defaults.translationLanguage;

    // Create translation prompt
    const prompt = createTranslationPrompt(targetLang);

    // Send request to Gemini
    const response = await ai.models.generateContent({
      config: generationConfig,
      model: 'gemini-2.0-flash',
      contents: `${prompt}${JSON.stringify(lyricsOnly)}`,
    });

    // Parse and return translations
    try {
      const translations = JSON.parse(response.text.replace(/\\n/g, ''));
      return translations.lines || lyricsOnly.map(() => '');
    } catch (parseError) {
      console.error(
        'Amai Lyrics: Error parsing translation response',
        parseError,
      );
      return lyricsOnly.map(() => '');
    }
  } catch (error) {
    console.error('Amai Lyrics: Translation fetch error', error);
    return [];
  }
}

/**
 * Creates a translation prompt for Gemini
 *
 * @param targetLang - Target language for translation
 * @returns Formatted prompt string
 */
function createTranslationPrompt(targetLang: string): string {
  return (
    Defaults.translationPrompt.replace(/{language}/g, targetLang) +
    ` Translate the following lyrics into ${targetLang}:\n`
  );
}

/**
 * Creates Gemini API configuration
 *
 * @param systemInstruction - System instruction for Gemini
 * @param temperature - Temperature parameter for generation
 * @returns Gemini configuration object
 */
function createGeminiConfig(
  systemInstruction: string,
  temperature: number,
): GeminiConfig {
  return {
    temperature,
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
    systemInstruction,
  };
}

/**
 * Generates furigana for Japanese lyrics
 *
 * @param lyricsJson - Lyrics data
 * @param lyricsOnly - Array of lyrics text only
 * @returns Processed lyrics with furigana
 */
async function generateFurigana(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsWithPrompt(
    lyricsJson,
    lyricsOnly,
    Defaults.furiganaPrompt,
  );
}

/**
 * Generates romaja for Korean lyrics
 *
 * @param lyricsJson - Lyrics data
 * @param lyricsOnly - Array of lyrics text only
 * @returns Processed lyrics with romaja
 */
async function generateRomaja(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsWithPrompt(
    lyricsJson,
    lyricsOnly,
    Defaults.romajaPrompt,
  );
}

/**
 * Generates romaji for Japanese lyrics
 *
 * @param lyricsJson - Lyrics data
 * @param lyricsOnly - Array of lyrics text only
 * @returns Processed lyrics with romaji
 */
async function generateRomaji(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
): Promise<LyricsData> {
  return await generateLyricsWithPrompt(
    lyricsJson,
    lyricsOnly,
    Defaults.romajiPrompt,
  );
}

/**
 * Generic function to generate lyrics with a specific prompt
 *
 * @param lyricsJson - Lyrics data
 * @param lyricsOnly - Array of lyrics text only
 * @param prompt - Prompt for Gemini
 * @returns Processed lyrics
 */
async function generateLyricsWithPrompt(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
  prompt: string,
): Promise<LyricsData> {
  // Check for API key
  if (!(await checkGeminiAPIKey(lyricsJson))) {
    return lyricsJson;
  }

  // Process lyrics with Gemini
  return await processLyricsWithGemini(
    lyricsJson,
    lyricsOnly,
    Defaults.systemInstruction,
    prompt,
  );
}

/**
 * Checks if Gemini API key is available
 *
 * @param lyricsJson - Lyrics data
 * @returns Whether API key is available
 */
async function checkGeminiAPIKey(lyricsJson: LyricsData): Promise<boolean> {
  const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();
  if (!geminiApiKey || geminiApiKey === '') {
    console.error('Amai Lyrics: Gemini API Key missing');
    lyricsJson.Info =
      'Amai Lyrics: Gemini API Key missing. Click here to add your own API key.';
    return false;
  }
  return true;
}

/**
 * Processes lyrics with Gemini AI
 *
 * @param lyricsJson - Lyrics data
 * @param lyricsOnly - Array of lyrics text only
 * @param systemInstruction - System instruction for Gemini
 * @param prompt - Prompt for Gemini
 * @returns Processed lyrics
 */
async function processLyricsWithGemini(
  lyricsJson: LyricsData,
  lyricsOnly: string[],
  systemInstruction: string,
  prompt: string,
): Promise<LyricsData> {
  try {
    // Get API key
    const geminiApiKey = storage.get('GEMINI_API_KEY')?.toString();

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Configure generation parameters
    const generationConfig = createGeminiConfig(systemInstruction, 0.258);

    // Process lyrics if available
    if (lyricsOnly.length > 0) {
      // Send request to Gemini
      const response = await ai.models.generateContent({
        config: generationConfig,
        model: 'gemini-2.0-flash',
        contents: `${prompt} Here are the lyrics:\n${JSON.stringify(
          lyricsOnly,
        )}`,
      });

      // Parse response
      try {
        const lyrics = JSON.parse(response.text.replace(/\\n/g, ''));

        // Update lyrics text based on type
        if (lyrics && lyrics.lines && Array.isArray(lyrics.lines)) {
          updateLyricsText(lyricsJson, lyrics.lines);
        } else {
          console.error('Amai Lyrics: Invalid response format', lyrics);
        }
      } catch (parseError) {
        console.error('Amai Lyrics: Error parsing response', parseError);
      }
    }
  } catch (error) {
    console.error('Amai Lyrics:', error);
    lyricsJson.Info =
      'Amai Lyrics: Fetch Error. Please double check your API key. Click here to open settings page.';
  }
  return lyricsJson;
}

/**
 * Updates lyrics text with processed text
 *
 * @param lyricsJson - Lyrics data
 * @param lines - Processed lines
 */
function updateLyricsText(lyricsJson: LyricsData, lines: string[]): void {
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    lyricsJson.Content = lyricsJson.Content.map((item, index) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  } else if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines = lyricsJson.Lines.map((item, index) => ({
      ...item,
      Text: lines[index] || item.Text,
    }));
  }
}

/**
 * Extracts plain text lyrics from structured data
 *
 * @param lyricsJson - Lyrics data
 * @returns Array of lyrics text only
 */
async function extractLyrics(lyricsJson: LyricsData): Promise<string[]> {
  // Helper function to clean up lyrics text
  const removeEmptyLinesAndCharacters = (items: LyricsLine[]): LyricsLine[] => {
    // Filter out empty lines
    items = items.filter((item) => item.Text?.trim() !== '');

    // Clean up text
    items = items.map((item) => {
      if (item.Text) {
        // Remove specific characters and normalize
        item.Text = item.Text.replace(/[「」",.!]/g, '');
        item.Text = item.Text.normalize('NFKC');
      }
      return item;
    });

    return items;
  };

  // Process Line type lyrics
  if (lyricsJson.Type === 'Line' && lyricsJson.Content) {
    // Adjust timing
    lyricsJson.Content = lyricsJson.Content.map((item) => ({
      ...item,
      StartTime: Math.max(0, (item.StartTime || 0) - LYRICS_TIMING_OFFSET),
    }));

    // Clean up and extract text
    lyricsJson.Content = removeEmptyLinesAndCharacters(lyricsJson.Content);
    return lyricsJson.Content.map((item) => item.Text);
  }

  // Process Static type lyrics
  if (lyricsJson.Type === 'Static' && lyricsJson.Lines) {
    lyricsJson.Lines = removeEmptyLinesAndCharacters(lyricsJson.Lines);
    return lyricsJson.Lines.map((item) => item.Text);
  }

  return [];
}

// ==============================
// Cache and Storage Functions
// ==============================

/**
 * Gets lyrics from cache
 *
 * @param trackId - Spotify track ID
 * @returns Cached lyrics or null
 */
async function getLyricsFromCache(
  trackId: string,
): Promise<LyricsData | string | null> {
  if (!lyricsCache) return null;

  try {
    // Get lyrics from cache
    const lyricsFromCache = await lyricsCache.get(trackId);
    if (!lyricsFromCache) return null;

    // Check if cache has expired
    if (lyricsFromCache.expiresAt < new Date().getTime()) {
      await lyricsCache.remove(trackId);
      return null;
    }

    // Handle no lyrics case
    if (lyricsFromCache.status === 'NO_LYRICS') {
      return await noLyricsMessage();
    }

    // Update UI and state
    storage.set('currentLyricsData', JSON.stringify(lyricsFromCache));
    HideLoaderContainer();
    ClearLyricsPageContainer();
    Defaults.CurrentLyricsType = lyricsFromCache.Type;

    return { ...lyricsFromCache, fromCache: true };
  } catch (error) {
    // Handle errors
    ClearLyricsPageContainer();
    console.log('Error parsing saved lyrics data:', error);
    return await noLyricsMessage();
  }
}

/**
 * Gets lyrics from local storage
 *
 * @param trackId - Spotify track ID
 * @returns Stored lyrics or null
 */
async function getLyricsFromLocalStorage(
  trackId: string,
): Promise<LyricsData | string | null> {
  const savedLyricsData = storage.get('currentLyricsData')?.toString();
  if (!savedLyricsData) return null;

  try {
    // Check for no lyrics case
    if (savedLyricsData.includes('NO_LYRICS')) {
      const split = savedLyricsData.split(':');
      const id = split[1];
      if (id === trackId) {
        return await noLyricsMessage();
      }
    } else {
      // Parse and check lyrics data
      const lyricsData = JSON.parse(savedLyricsData);
      if (lyricsData?.id === trackId) {
        // Update UI and state
        HideLoaderContainer();
        ClearLyricsPageContainer();
        Defaults.CurrentLyricsType = lyricsData.Type;
        return lyricsData;
      }
    }
  } catch (error) {
    // Handle errors
    console.error('Error parsing saved lyrics data:', error);
    HideLoaderContainer();
    ClearLyricsPageContainer();
  }

  return null;
}

// ==============================
// UI Functions
// ==============================

/**
 * Resets the lyrics UI
 */
function resetLyricsUI(): void {
  // Remove offline class if present
  const lyricsContent = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (lyricsContent?.classList.contains('offline')) {
    lyricsContent.classList.remove('offline');
  }

  // Show lyrics container
  document
    .querySelector('#SpicyLyricsPage .ContentBox .LyricsContainer')
    ?.classList.remove('Hidden');

  // Append view controls if not in fullscreen
  if (!Fullscreen.IsOpen) PageView.AppendViewControls(true);
}

/**
 * Shows a message when no lyrics are available
 *
 * @param cache - Whether to cache the result
 * @param localStorage - Whether to store in local storage
 * @returns Status code
 */
async function noLyricsMessage(trackId?: string): Promise<string> {
  try {
    // Update state
    storage.set('currentlyFetching', 'false');
    if (Spicetify.Player.data.item.uri?.split(':')[2] === trackId) {
      // Show notification
      Spicetify.showNotification('Lyrics unavailable', false, 1000);
      HideLoaderContainer();
      Defaults.CurrentLyricsType = 'None';
      // Update UI
      document
        .querySelector<HTMLElement>(
          '#SpicyLyricsPage .ContentBox .LyricsContainer',
        )
        ?.classList.add('Hidden');
      document
        .querySelector<HTMLElement>('#SpicyLyricsPage .ContentBox')
        ?.classList.add('LyricsHidden');
      // Show now bar
      OpenNowBar();
      DeregisterNowBarBtn();
    }
  } catch (error) {
    console.error('Amai Lyrics: Error showing no lyrics message', error);
    // Ensure we at least set the fetching state to false
    storage.set('currentlyFetching', 'false');
  }

  return '1';
}

// Loader timeout reference
let ContainerShowLoaderTimeout: number | null = null;

/**
 * Shows the loader container
 */
function ShowLoaderContainer(): void {
  const loaderContainer = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .loaderContainer',
  );
  if (loaderContainer) {
    ContainerShowLoaderTimeout = window.setTimeout(
      () => loaderContainer.classList.add('active'),
      1000,
    );
  }
}

/**
 * Hides the loader container
 */
function HideLoaderContainer(): void {
  const loaderContainer = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .loaderContainer',
  );
  if (loaderContainer) {
    // Clear timeout if exists
    if (ContainerShowLoaderTimeout) {
      clearTimeout(ContainerShowLoaderTimeout);
      ContainerShowLoaderTimeout = null;
    }
    // Remove active class
    loaderContainer.classList.remove('active');
  }
}

/**
 * Clears the lyrics container
 */
function ClearLyricsPageContainer(): void {
  const lyricsContent = document.querySelector(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (lyricsContent) {
    lyricsContent.innerHTML = '';
  }
}

// ==============================
// Lyrics Conversion Functions
// ==============================

/**
 * Converts syllable-based lyrics to line-based format
 *
 * @param data - Syllable-based lyrics data
 * @returns Line-based lyrics data
 */
function convertLyrics(data: any[]): LyricsLine[] {
  console.log('Converting Syllable to Line type');

  return data.map((item) => {
    // Process lead text
    let leadText = '';
    let prevIsJapanese = null;

    // Check if Lead and Syllables exist
    if (
      !item.Lead ||
      !item.Lead.Syllables ||
      !Array.isArray(item.Lead.Syllables)
    ) {
      console.error('Amai Lyrics: Invalid lyrics structure', item);
      return {
        Type: item.Type,
        OppositeAligned: item.OppositeAligned,
        Text: '',
        StartTime: 0,
        EndTime: 0,
      };
    }

    item.Lead.Syllables.forEach((syl: Syllable) => {
      const currentIsJapanese = JAPANESE_REGEX.test(syl.Text);

      if (currentIsJapanese) {
        // Handle Japanese text spacing
        if (prevIsJapanese === false && leadText) {
          leadText += ' ';
        }
        leadText += syl.Text;
      } else {
        // Handle non-Japanese text spacing
        leadText += (leadText ? ' ' : '') + syl.Text;
      }

      prevIsJapanese = currentIsJapanese;
    });

    // Initialize timing and full text
    let startTime = item.Lead.StartTime;
    let endTime = item.Lead.EndTime;
    let fullText = leadText;

    // Process background text if available
    if (item.Background && Array.isArray(item.Background)) {
      const bgTexts = item.Background.map((bg) => {
        // Update timing based on background
        if (typeof bg.StartTime === 'number') {
          startTime = Math.min(startTime, bg.StartTime);
        }
        if (typeof bg.EndTime === 'number') {
          endTime = Math.max(endTime, bg.EndTime);
        }

        // Process background text
        let bgText = '';
        let prevIsJapanese = null;

        // Check if Syllables exist
        if (!bg.Syllables || !Array.isArray(bg.Syllables)) {
          return '';
        }

        bg.Syllables.forEach((syl: Syllable) => {
          const currentIsJapanese = JAPANESE_REGEX.test(syl.Text);

          if (currentIsJapanese) {
            // Handle Japanese text spacing
            if (prevIsJapanese === false && bgText) {
              bgText += ' ';
            }
            bgText += syl.Text;
          } else {
            // Handle non-Japanese text spacing
            bgText += (bgText ? ' ' : '') + syl.Text;
          }

          prevIsJapanese = currentIsJapanese;
        });

        return bgText;
      });

      // Combine lead and background text
      fullText += ' (' + bgTexts.join(' ') + ')';
    }

    // Return formatted line
    return {
      Type: item.Type,
      OppositeAligned: item.OppositeAligned,
      Text: fullText,
      StartTime: startTime,
      EndTime: endTime,
    };
  });
}
