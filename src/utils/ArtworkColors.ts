/**
 * Artwork Colors — Extracts dominant colors from album artwork for use in
 * dynamic text coloring and animations.
 *
 * Uses `fetch()` → Blob → `createImageBitmap()` → canvas to work around CORS
 * restrictions that would block `crossOrigin: 'anonymous'` canvas readback on
 * Spotify's image CDN.
 */

const BITMAP_SIZE = 40; // tiny decode size — way faster and still accurate
const QUANTIZE_BITS = 5; // 2^5 = 32 levels per channel → ~32K buckets
const RESULT_COUNT = 5; // how many dominant colors to return
const MIN_SATURATION = 30; // skip grey-ish pixels (0-255)
const MIN_LIGHTNESS = 35; // skip very dark pixels
const MAX_LIGHTNESS = 235; // skip very bright pixels

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts an RGB value to a hex color string.
 */
function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Quantizes a colour channel to a smaller number of bits.
 */
function quantize(value: number, bits: number): number {
  return (value >> (8 - bits)) << (8 - bits);
}

/**
 * Computes a rough "perceived lightness" (sRGB luminance weights).
 */
function luminance({ r, g, b }: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes a rough saturation estimate (max - min / max).
 */
function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return ((max - min) / max) * 255;
}

/**
 * Returns a simple bucket key for a quantized color.
 */
function bucketKey({ r, g, b }: RGB): string {
  return `${r},${g},${b}`;
}

/**
 * Given raw RGBA pixel data (from a small canvas), count the frequency of
 * each quantized colour and return the top RESULT_COUNT as hex strings.
 */
function quantizePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  loose: boolean,
): string[] {
  const bucketMap = new Map<string, { rgb: RGB; count: number }>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      const rgb: RGB = { r, g, b };
      const lum = luminance(rgb);

      if (loose) {
        // Only skip near-black and near-white
        if (lum < 15 || lum > 245) continue;
      } else {
        const sat = saturation(rgb);
        // Skip too-dark, too-bright, or too-grey pixels
        if (lum < MIN_LIGHTNESS || lum > MAX_LIGHTNESS || sat < MIN_SATURATION) {
          continue;
        }
      }

      const q: RGB = {
        r: quantize(r, QUANTIZE_BITS),
        g: quantize(g, QUANTIZE_BITS),
        b: quantize(b, QUANTIZE_BITS),
      };

      const key = bucketKey(q);
      const entry = bucketMap.get(key);
      if (entry) {
        entry.count++;
      } else {
        bucketMap.set(key, { rgb: q, count: 1 });
      }
    }
  }

  // Sort by frequency descending, take top results
  return [...bucketMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, RESULT_COUNT)
    .map(([, entry]) => rgbToHex(entry.rgb));
}

/**
 * Reads pixel data from an ImageBitmap by drawing it onto a tiny canvas.
 */
function readBitmapPixels(
  bitmap: ImageBitmap,
): { data: Uint8ClampedArray; width: number; height: number } | null {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(bitmap, 0, 0);

  try {
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return { data: imageData.data, width: bitmap.width, height: bitmap.height };
  } catch {
    return null;
  }
}

// Bounded LRU cache — artwork color extraction is fairly heavy (fetch + decode
// + canvas read). Without caching, the same album fetched via playbar + NowBar
// + dynamic-background would be decoded 3× per skip.
const ARTWORK_COLOR_CACHE_MAX = 30;
const artworkColorCache = new Map<string, string[]>();
// Promise cache to dedup concurrent fetches for the same URL (e.g. playbar +
// dynamic BG requesting same artwork in same tick).
const artworkColorPromiseCache = new Map<string, Promise<string[]>>();

/**
 * Extracts dominant colors from an artwork image URL.
 *
 * Fetches the image as a Blob with explicit `mode: 'cors'`, decodes it at a
 * tiny size (40×40) via `createImageBitmap`, then reads RGBA data from a
 * same-origin canvas (the Blob URL is treated as same-origin so there are no
 * CORS taint issues). Results are LRU-cached so repeated requests for the
 * same URL are instant and allocation-free.
 *
 * @param imageUrl - HTTP(S) URL of the album/artwork image
 * @returns Promise resolving to an array of hex colour strings (e.g. "#aabbcc")
 */
export async function extractArtworkColors(imageUrl: string): Promise<string[]> {
  const cached = artworkColorCache.get(imageUrl);
  if (cached) {
    // Promote for LRU ordering
    artworkColorCache.delete(imageUrl);
    artworkColorCache.set(imageUrl, cached);
    return cached;
  }
  const pending = artworkColorPromiseCache.get(imageUrl);
  if (pending) return pending;

  const promise = (async (): Promise<string[]> => {
    let blob: Blob;
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) return [];
      blob = await response.blob();
    } catch {
      // Fetch or CORS failed
      return [];
    }

    // Decode at a tiny size for speed
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(blob, {
        resizeWidth: BITMAP_SIZE,
        resizeHeight: BITMAP_SIZE,
        resizeQuality: 'pixelated',
      });
    } catch {
      return [];
    }

    const result = readBitmapPixels(bitmap);
    bitmap.close(); // free memory
    if (!result) return [];

    const { data, width, height } = result;

    // Primary pass — strict filtering
    let colors = quantizePixels(data, width, height, false);

    // If we didn't get enough colours, retry with loose filtering
    if (colors.length < 2) {
      colors = quantizePixels(data, width, height, true);
    }

    // Cache result (LRU eviction)
    artworkColorCache.set(imageUrl, colors);
    if (artworkColorCache.size > ARTWORK_COLOR_CACHE_MAX) {
      const oldest = artworkColorCache.keys().next().value as string | undefined;
      if (oldest !== undefined) artworkColorCache.delete(oldest);
    }

    return colors;
  })();

  artworkColorPromiseCache.set(imageUrl, promise);
  // Clean up dedup entry once settled so failures don't stick forever
  promise.then(
    () => artworkColorPromiseCache.delete(imageUrl),
    () => artworkColorPromiseCache.delete(imageUrl),
  );
  return promise;
}

/**
 * Converts a hex colour string to an "r, g, b" string for use in gradients.
 */
export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Perceived sRGB luminance of a hex colour (0-255 scale).
 */
export function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Lightens a hex colour by mixing it with white until its perceived luminance
 * reaches `minLum`.  Returns the adjusted hex string.
 */
export function liftToLuminance(hex: string, minLum: number): string {
  if (hexLuminance(hex) >= minLum) return hex;

  const clean = hex.replace('#', '');
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);

  // Linearly interpolate toward white (255,255,255) until luminance is adequate
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const nr = Math.round(r + (255 - r) * t);
    const ng = Math.round(g + (255 - g) * t);
    const nb = Math.round(b + (255 - b) * t);
    if (
      hexLuminance(
        `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`,
      ) >= minLum
    ) {
      r = nr;
      g = ng;
      b = nb;
      break;
    }
  }

  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// Page-wide accent publishing
//
// Publishes the current artwork's dominant colours as --amai-accent-1..5 (plus
// --amai-accent-rgb for rgba() usages) on <html>, so every surface (lyrics
// glow, buttons, loaders) can pick up the album's palette. Colours are
// luminance-lifted for readability on dark surfaces, matching the playbar's
// behavior. Custom properties are written at most once per song change —
// never per frame — so consuming them in CSS is compositing-safe.
// ---------------------------------------------------------------------------

const ACCENT_LIFT_MIN_LUMINANCE = 140; // same readability floor as the playbar
const ACCENT_COUNT = 5;

let lastAccentArtworkUrl: string | null = null;

/**
 * Extracts colours for the given artwork URL and publishes them as
 * `--amai-accent-*` custom properties on `document.documentElement`.
 * Passing an empty/null URL clears the accents, falling back to the
 * Spotify-green defaults declared in `tokens.css`.
 */
export async function publishArtworkAccents(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) {
    lastAccentArtworkUrl = null;
    applyArtworkAccents([]);
    return;
  }

  // Resolve spotify:image: URIs the same way the playbar/dynamic bg do
  let url = imageUrl;
  if (url.startsWith('spotify:image:')) {
    url = `https://i.scdn.co/image/${url.replace('spotify:image:', '')}`;
  }

  // Already published for this artwork — extraction is cached anyway, but the
  // guard keeps repeat songchange events allocation-free.
  if (url === lastAccentArtworkUrl) return;
  lastAccentArtworkUrl = url;

  const colors = await extractArtworkColors(url);
  applyArtworkAccents(colors);
}

/**
 * Writes the accent custom properties (or removes them when no colours are
 * available, letting the CSS defaults apply).
 */
export function applyArtworkAccents(colors: string[]): void {
  const rootStyle = document.documentElement.style;

  if (!colors.length) {
    for (let i = 1; i <= ACCENT_COUNT; i++) {
      rootStyle.removeProperty(`--amai-accent-${i}`);
    }
    rootStyle.removeProperty('--amai-accent-rgb');
    return;
  }

  // Boost dim colours so accents stay readable against dark surfaces.
  const lifted = colors.map((c) => liftToLuminance(c, ACCENT_LIFT_MIN_LUMINANCE));

  // Pad with repeats if fewer than 5 colours were extracted
  const padded = [...lifted];
  while (padded.length < ACCENT_COUNT) {
    padded.push(padded[padded.length % padded.length]);
  }

  for (let i = 0; i < ACCENT_COUNT; i++) {
    rootStyle.setProperty(`--amai-accent-${i + 1}`, padded[i]);
  }
  rootStyle.setProperty('--amai-accent-rgb', hexToRgb(padded[0]));
}

export default extractArtworkColors;
