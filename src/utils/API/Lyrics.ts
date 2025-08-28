import Defaults from '../../components/Global/Defaults';
import SpicyFetch from './SpicyFetch';
import {
  SyllableBasedLyricItem,
  LineBasedLyricItem,
  LyricsLine, // Import LyricsLine
} from '../Lyrics/conversion';

const API_URL = Defaults.lyrics.api.url;

// Define user data interface for better type safety
interface UserData {
  id?: string;
  display_name?: string;
  country?: string;
  product?: string;
  images?: ImageObject[];
}

interface ImageObject {
  url: string;
  height: number | null;
  width: number | null;
}

export interface LyricsResult {
  lyrics?: string;
  Type?: 'Syllable' | 'Line' | 'Static';
  Content?: SyllableBasedLyricItem[] | LineBasedLyricItem[]; // Can be either syllable or line based
  Lines?: LyricsLine[]; // For Line or Static types after processing
  id?: string;
  Raw?: string[];
}

export async function getLyrics(
  id: string,
  headers: Record<string, string> = {},
): Promise<{ response: LyricsResult; status: number }> {
  // Fetch user data
  const userData = await fetchUserData();

  // Request lyrics
  const { data, status } = await fetchLyricsData(id, userData, headers);

  return { response: data, status };
}

/**
 * Fetches the current user's Spotify profile data
 */
async function fetchUserData(): Promise<UserData> {
  try {
    const [data, status] = await SpicyFetch(
      'https://api.spotify.com/v1/me',
      true, // IsExternal
      true, // cache
      false, // cosmos
    );

    return status === 200 ? data : {};
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {};
  }
}

/**
 * Fetches lyrics data from the lyrics API
 */
async function fetchLyricsData(
  id: string,
  userData: UserData,
  headers: Record<string, string>,
): Promise<{ data: LyricsResult; status: number }> {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        id,
        user_id: userData?.id,
        display_name: userData?.display_name,
        country: userData?.country,
        product: userData?.product,
        images: JSON.stringify(userData?.images),
      }),
    });

    const status = res.status;

    if (!res.ok) {
      throw new Error(`Request failed with status ${status}`);
    }

    let data = {};
    try {
      // Check if response body is empty
      const responseBody = await res.text();
      if (responseBody.trim() === '') {
        console.warn('Received empty response body');
        data = {};
      } else {
        // Parse JSON only if response body is not empty
        data = JSON.parse(responseBody);
      }
    } catch (error) {
      console.error('Error parsing response JSON:', error);
    }

    return { data, status };
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    throw error;
  }
}
