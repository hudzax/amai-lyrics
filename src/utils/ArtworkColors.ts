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

/**
 * Extracts dominant colors from an artwork image URL.
 *
 * Fetches the image as a Blob with explicit `mode: 'cors'`, decodes it at a
 * tiny size (40×40) via `createImageBitmap`, then reads RGBA data from a
 * same-origin canvas (the Blob URL is treated as same-origin so there are no
 * CORS taint issues).
 *
 * @param imageUrl - HTTP(S) URL of the album/artwork image
 * @returns Promise resolving to an array of hex colour strings (e.g. "#aabbcc")
 */
export async function extractArtworkColors(imageUrl: string): Promise<string[]> {
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

  return colors;
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

export default extractArtworkColors;
