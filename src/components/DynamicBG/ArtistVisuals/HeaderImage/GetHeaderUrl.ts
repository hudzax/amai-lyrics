type HeaderSource = { url: string };
type HeaderImage = { sources: HeaderSource[] };
type Visuals = { headerImage?: HeaderImage };
type DataType = { Visuals?: Visuals };

export default function GetHeaderUrl(
  data: DataType | string | undefined,
): string | null {
  if (!data)
    return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
  const obj: DataType = typeof data === 'object' ? data : JSON.parse(data);
  const HeaderImage = obj?.Visuals?.headerImage?.sources[0]?.url;
  if (!HeaderImage)
    return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
  return `spotify:image:${HeaderImage.replace('https://i.scdn.co/image/', '')}`;
}
