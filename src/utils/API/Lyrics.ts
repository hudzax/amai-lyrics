import Defaults from '../../components/Global/Defaults';

const API_URL = Defaults.lyrics.api.url;

export async function getLyrics(
  id: string,
  headers: any = {},
): Promise<{ response: any; status: number }> {
  const res = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ id }),
  });

  const status = res.status;
  if (!res.ok) throw new Error('Request failed');

  let data;
  try {
    data = await res.json();
  } catch (error) {
    data = {};
  }

  return { response: data, status };
}
