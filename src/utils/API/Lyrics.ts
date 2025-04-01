import Defaults from '../../components/Global/Defaults';
import SpicyFetch from './SpicyFetch';

const API_URL = Defaults.lyrics.api.url;

export async function getLyrics(
  id: string,
  headers: any = {},
): Promise<{ response: any; status: number }> {
  let [userData, status] = await SpicyFetch(
    'https://api.spotify.com/v1/me',
    true,
    true,
    false,
  );
  if (status !== 200) {
    userData = {};
  }
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

  status = res.status;
  if (!res.ok) throw new Error('Request failed');

  let data;
  try {
    data = await res.json();
  } catch (error) {
    data = {};
  }

  return { response: data, status };
}
