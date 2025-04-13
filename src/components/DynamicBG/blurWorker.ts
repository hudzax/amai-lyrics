/**
 * Web Worker for box blur on image data.
 * Receives: { imageData: ImageData, passes: number, radius: number }
 * Posts: { imageData: ImageData }
 */

// Box blur implementation (same as main thread, but for worker)
function boxBlur(
  imageData: ImageData,
  radius: number,
  passes: number,
): ImageData {
  const { data, width, height } = imageData;
  const pixels = new Uint8ClampedArray(data);
  const temp = new Uint8ClampedArray(data.length);

  for (let pass = 0; pass < passes; pass++) {
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let count = 0;
      for (let x = -radius; x <= radius; x++) {
        const idx = (y * width + Math.max(0, Math.min(width - 1, x))) * 4;
        r += pixels[idx];
        g += pixels[idx + 1];
        b += pixels[idx + 2];
        a += pixels[idx + 3];
        count++;
      }
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * 4;
        temp[outIdx] = r / count;
        temp[outIdx + 1] = g / count;
        temp[outIdx + 2] = b / count;
        temp[outIdx + 3] = a / count;

        // Slide window
        const removeIdx = (y * width + Math.max(0, x - radius)) * 4;
        const addIdx = (y * width + Math.min(width - 1, x + radius + 1)) * 4;
        r += pixels[addIdx] - pixels[removeIdx];
        g += pixels[addIdx + 1] - pixels[removeIdx + 1];
        b += pixels[addIdx + 2] - pixels[removeIdx + 2];
        a += pixels[addIdx + 3] - pixels[removeIdx + 3];
      }
    }

    // Vertical pass
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let count = 0;
      for (let y = -radius; y <= radius; y++) {
        const idx = (Math.max(0, Math.min(height - 1, y)) * width + x) * 4;
        r += temp[idx];
        g += temp[idx + 1];
        b += temp[idx + 2];
        a += temp[idx + 3];
        count++;
      }
      for (let y = 0; y < height; y++) {
        const outIdx = (y * width + x) * 4;
        pixels[outIdx] = r / count;
        pixels[outIdx + 1] = g / count;
        pixels[outIdx + 2] = b / count;
        pixels[outIdx + 3] = a / count;

        // Slide window
        const removeIdx = (Math.max(0, y - radius) * width + x) * 4;
        const addIdx = (Math.min(height - 1, y + radius + 1) * width + x) * 4;
        r += temp[addIdx] - temp[removeIdx];
        g += temp[addIdx + 1] - temp[removeIdx + 1];
        b += temp[addIdx + 2] - temp[removeIdx + 2];
        a += temp[addIdx + 3] - temp[removeIdx + 3];
      }
    }
  }

  return new ImageData(pixels, width, height);
}

self.onmessage = function (e) {
  const { imageData, passes, radius } = e.data;
  const blurred = boxBlur(imageData, radius, passes);
  // @ts-ignore
  postMessage({ imageData: blurred }, [blurred.data.buffer]);
};
