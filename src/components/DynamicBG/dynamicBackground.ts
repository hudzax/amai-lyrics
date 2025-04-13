import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import fastdom from '../../utils/fastdom';
import storage from '../../utils/storage';

// Feature detection for performance optimization
const supportsCanvas =
  typeof document !== 'undefined' &&
  !!document.createElement('canvas').getContext;
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Creates a canvas-based blurred version of the image for better performance
 * This is more efficient than CSS blur filters on large images
 */
function createBlurredCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'canvas-bg';

    // Use a smaller canvas size for better performance
    canvas.width = 256;
    canvas.height = 256;

    // Set willReadFrequently to true for better performance with getImageData
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      resolve(canvas); // Return empty canvas if context not available
      return;
    }

    // Convert Spotify URI to proper URL if needed
    if (imageUrl.startsWith('spotify:image:')) {
      const imageId = imageUrl.replace('spotify:image:', '');
      imageUrl = `https://i.scdn.co/image/${imageId}`;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for CORS
    img.onload = () => {
      try {
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Only skip blur if user has explicitly enabled low quality mode or prefers reduced motion
        if (typeof Worker !== 'undefined') {
          // Use a Web Worker for the blur
          try {
            // Dynamically import the worker as a blob
            const workerUrl = URL.createObjectURL(
              new Blob(
                [
                  // @ts-ignore
                  require('!!raw-loader!./blurWorker.ts').default,
                ],
                { type: 'application/javascript' },
              ),
            );
            const worker = new Worker(workerUrl);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );

            worker.onmessage = function (e) {
              try {
                const blurred = e.data.imageData;
                ctx.putImageData(blurred, 0, 0);

                // Color manipulation as before
                const data = blurred.data;
                for (let i = 0; i < data.length; i += 4) {
                  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  data[i] = data[i] + (data[i] - avg) * 0.5;
                  data[i + 1] = data[i + 1] + (data[i + 1] - avg) * 0.5;
                  data[i + 2] = data[i + 2] + (data[i + 2] - avg) * 0.5;
                  data[i] = data[i] * 0.8;
                  data[i + 1] = data[i + 1] * 0.8;
                  data[i + 2] = data[i + 2] * 0.8;
                }
                ctx.putImageData(blurred, 0, 0);

                // Mark as loaded after a frame to ensure smooth transition
                requestAnimationFrame(() => {
                  canvas.classList.add('loaded');
                  resolve(canvas);
                });
              } catch (err) {
                console.error(
                  'Error processing blurred image from worker:',
                  err,
                );
                resolve(canvas);
              } finally {
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
              }
            };

            worker.onerror = function (err) {
              console.error('Blur worker error:', err);
              // Fallback to synchronous blur
              for (let i = 0; i < 4; i++) {
                boxBlur(ctx, canvas, 15);
              }
              // Color manipulation as before
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i] + (data[i] - avg) * 0.5;
                data[i + 1] = data[i + 1] + (data[i + 1] - avg) * 0.5;
                data[i + 2] = data[i + 2] + (data[i + 2] - avg) * 0.5;
                data[i] = data[i] * 0.8;
                data[i + 1] = data[i + 1] * 0.8;
                data[i + 2] = data[i + 2] * 0.8;
              }
              ctx.putImageData(imageData, 0, 0);
              requestAnimationFrame(() => {
                canvas.classList.add('loaded');
                resolve(canvas);
              });
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
            };

            // Send image data to worker
            worker.postMessage(
              {
                imageData,
                passes: 4,
                radius: 15,
              },
              [imageData.data.buffer],
            );
          } catch (err) {
            // Fallback to synchronous blur if worker setup fails
            for (let i = 0; i < 4; i++) {
              boxBlur(ctx, canvas, 15);
            }
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = data[i] + (data[i] - avg) * 0.5;
              data[i + 1] = data[i + 1] + (data[i + 1] - avg) * 0.5;
              data[i + 2] = data[i + 2] + (data[i + 2] - avg) * 0.5;
              data[i] = data[i] * 0.8;
              data[i + 1] = data[i + 1] * 0.8;
              data[i + 2] = data[i + 2] * 0.8;
            }
            ctx.putImageData(imageData, 0, 0);
            requestAnimationFrame(() => {
              canvas.classList.add('loaded');
              resolve(canvas);
            });
          }
        } else {
          // Fallback to synchronous blur when Web Worker is not supported
          for (let i = 0; i < 4; i++) {
            boxBlur(ctx, canvas, 15);
          }
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i] + (data[i] - avg) * 0.5;
            data[i + 1] = data[i + 1] + (data[i + 1] - avg) * 0.5;
            data[i + 2] = data[i + 2] + (data[i + 2] - avg) * 0.5;
            data[i] = data[i] * 0.8;
            data[i + 1] = data[i + 1] * 0.8;
            data[i + 2] = data[i + 2] * 0.8;
          }
          ctx.putImageData(imageData, 0, 0);
          requestAnimationFrame(() => {
            canvas.classList.add('loaded');
            resolve(canvas);
          });
        }
      } catch (error) {
        console.error('Error processing canvas:', error);
        resolve(canvas); // Return canvas even on error
      }
    };

    img.onerror = (e) => {
      console.error('Error loading image for canvas:', e);
      resolve(canvas); // Return empty canvas on error
    };
    img.src = imageUrl;
  });
}

/**
 * Simple and efficient box blur implementation
 * Much more performant than Gaussian blur for our purposes
 */
function boxBlur(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  radius: number,
) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    let runningTotal = [0, 0, 0];

    // Initial sum for the first radius pixels
    for (let x = 0; x < radius; x++) {
      const idx = (y * width + x) * 4;
      runningTotal[0] += pixels[idx];
      runningTotal[1] += pixels[idx + 1];
      runningTotal[2] += pixels[idx + 2];
    }

    // Blur horizontally
    for (let x = 0; x < width; x++) {
      // Add the next pixel to the sum
      if (x + radius < width) {
        const idx = (y * width + x + radius) * 4;
        runningTotal[0] += pixels[idx];
        runningTotal[1] += pixels[idx + 1];
        runningTotal[2] += pixels[idx + 2];
      }

      // Remove the trailing pixel from the sum
      if (x - radius - 1 >= 0) {
        const idx = (y * width + x - radius - 1) * 4;
        runningTotal[0] -= pixels[idx];
        runningTotal[1] -= pixels[idx + 1];
        runningTotal[2] -= pixels[idx + 2];
      }

      // Set the blurred value
      const currentIdx = (y * width + x) * 4;
      const count = Math.min(radius + x + 1, width) - Math.max(x - radius, 0);
      pixels[currentIdx] = runningTotal[0] / count;
      pixels[currentIdx + 1] = runningTotal[1] / count;
      pixels[currentIdx + 2] = runningTotal[2] / count;
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let runningTotal = [0, 0, 0];

    // Initial sum for the first radius pixels
    for (let y = 0; y < radius; y++) {
      const idx = (y * width + x) * 4;
      runningTotal[0] += pixels[idx];
      runningTotal[1] += pixels[idx + 1];
      runningTotal[2] += pixels[idx + 2];
    }

    // Blur vertically
    for (let y = 0; y < height; y++) {
      // Add the next pixel to the sum
      if (y + radius < height) {
        const idx = ((y + radius) * width + x) * 4;
        runningTotal[0] += pixels[idx];
        runningTotal[1] += pixels[idx + 1];
        runningTotal[2] += pixels[idx + 2];
      }

      // Remove the trailing pixel from the sum
      if (y - radius - 1 >= 0) {
        const idx = ((y - radius - 1) * width + x) * 4;
        runningTotal[0] -= pixels[idx];
        runningTotal[1] -= pixels[idx + 1];
        runningTotal[2] -= pixels[idx + 2];
      }

      // Set the blurred value
      const currentIdx = (y * width + x) * 4;
      const count = Math.min(radius + y + 1, height) - Math.max(y - radius, 0);
      pixels[currentIdx] = runningTotal[0] / count;
      pixels[currentIdx + 1] = runningTotal[1] / count;
      pixels[currentIdx + 2] = runningTotal[2] / count;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Optimized dynamic background implementation
 * - Uses fewer DOM elements
 * - Leverages canvas for better blur performance
 * - Adapts to device capabilities
 */
export default async function ApplyDynamicBackground(element) {
  if (!element) return;

  // Check if user prefers reduced motion
  const reducedMotion = prefersReducedMotion;

  // Set random rotation degrees for variety
  const rotationPrimary = Math.floor(Math.random() * 360);
  const rotationSecondary = Math.floor(Math.random() * 360);
  document.documentElement.style.setProperty(
    '--bg-rotation-primary',
    `${rotationPrimary}deg`,
  );
  document.documentElement.style.setProperty(
    '--bg-rotation-secondary',
    `${rotationSecondary}deg`,
  );

  // Set random scale variations for more dynamic effect
  const scalePrimary = 0.9 + Math.random() * 0.3; // Between 0.9 and 1.2
  const scaleSecondary = 0.9 + Math.random() * 0.3; // Between 0.9 and 1.2
  document.documentElement.style.setProperty(
    '--bg-scale-primary',
    `${scalePrimary}`,
  );
  document.documentElement.style.setProperty(
    '--bg-scale-secondary',
    `${scaleSecondary}`,
  );

  // Set a random hue shift for variety
  const hueShift = Math.floor(Math.random() * 30);
  document.documentElement.style.setProperty(
    '--bg-hue-shift',
    `${hueShift}deg`,
  );

  // Fetch cover image and convert to proper URL if needed
  let currentImgCover = await SpotifyPlayer.Artwork.Get('d');

  // Convert Spotify URI to proper URL if needed
  if (currentImgCover.startsWith('spotify:image:')) {
    const imageId = currentImgCover.replace('spotify:image:', '');
    currentImgCover = `https://i.scdn.co/image/${imageId}`;
  }

  // Use fastdom to prevent layout thrashing
  return fastdom.readThenWrite(
    // Read phase - check if we need to update
    () => {
      const bgContainer = element.querySelector(
        '.sweet-dynamic-bg',
      ) as HTMLDivElement | null;
      return {
        bgContainer,
        needsUpdate:
          !bgContainer ||
          bgContainer.getAttribute('current-img') !== currentImgCover,
        currentImgCover,
        reducedMotion,
      };
    },
    // Write phase - create or update the background
    async ({ bgContainer, needsUpdate, currentImgCover, reducedMotion }) => {
      if (!needsUpdate) return;

      if (bgContainer) {
        // Update existing background
        bgContainer.setAttribute('current-img', currentImgCover);

        // Get existing elements
        const primaryImg = bgContainer.querySelector(
          '.primary',
        ) as HTMLImageElement;
        const secondaryImg = bgContainer.querySelector(
          '.secondary',
        ) as HTMLImageElement;

        // Preload the new image to prevent flickering
        const newImg = new Image();
        newImg.onload = () => {
          // Create a new primary image element that will replace the old one
          if (primaryImg) {
            // Create a clone of the primary image with the new source
            const newPrimaryImg = document.createElement('img');
            newPrimaryImg.className = 'primary';
            newPrimaryImg.decoding = 'async';
            newPrimaryImg.loading = 'eager';
            newPrimaryImg.src = currentImgCover;
            newPrimaryImg.style.opacity = '0'; // Start invisible

            // Position the new image in the same place
            bgContainer.appendChild(newPrimaryImg);

            // Once the new image is loaded, fade it in and fade out the old one
            newPrimaryImg.onload = () => {
              // Delay to ensure the browser has painted the new element
              setTimeout(() => {
                // Start transition by adding the loaded class to new image
                newPrimaryImg.classList.add('loaded');

                // After transition completes, remove the old image
                setTimeout(() => {
                  primaryImg.remove();
                }, 1000); // Match the CSS transition duration
              }, 50);
            };
          }

          // Update secondary image with the same approach
          if (secondaryImg) {
            const newSecondaryImg = document.createElement('img');
            newSecondaryImg.className = 'secondary';
            newSecondaryImg.decoding = 'async';
            newSecondaryImg.loading = 'eager';
            newSecondaryImg.src = currentImgCover;

            // Add to container
            bgContainer.appendChild(newSecondaryImg);

            // After the container is marked as loaded, the secondary will fade in
            // due to the .sweet-dynamic-bg-loaded .secondary selector

            // Remove old secondary after transition
            setTimeout(() => {
              secondaryImg.remove();
            }, 1200); // Match the CSS transition duration
          }

          // Update canvas if supported and not in low quality mode
          // (low quality is only enabled if user preference or reduced motion is set)
          if (supportsCanvas && !reducedMotion) {
            // Create new canvas with blur effect
            createBlurredCanvas(currentImgCover).then((canvas) => {
              // Add the new canvas
              bgContainer.appendChild(canvas);

              // After the new canvas is visible, remove the old one
              setTimeout(() => {
                const oldCanvas = bgContainer.querySelector(
                  '.canvas-bg:not(.loaded)',
                );
                if (oldCanvas) {
                  oldCanvas.remove();
                }
              }, 1000); // Match the CSS transition duration
            });
          }
        };
        newImg.src = currentImgCover;
      } else {
        // Create new background container
        const container = document.createElement('div');
        container.className = 'sweet-dynamic-bg';

        container.setAttribute('current-img', currentImgCover);

        // Create placeholder for immediate visual
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        container.appendChild(placeholder);

        // Create primary image
        const primaryImg = document.createElement('img');
        primaryImg.className = 'primary';
        primaryImg.decoding = 'async';
        primaryImg.loading = 'eager';
        primaryImg.src = currentImgCover;
        container.appendChild(primaryImg);

        // Add onload handler for smooth transition
        primaryImg.onload = () => {
          requestAnimationFrame(() => {
            primaryImg.classList.add('loaded');
          });
        };

        // Create secondary image for depth effect
        const secondaryImg = document.createElement('img');
        secondaryImg.className = 'secondary';
        secondaryImg.decoding = 'async';
        secondaryImg.loading = 'lazy';
        secondaryImg.src = currentImgCover;
        container.appendChild(secondaryImg);

        // Add canvas-based blur if supported and not in low quality mode
        // (low quality is only enabled if user preference or reduced motion is set)
        if (supportsCanvas && !reducedMotion) {
          createBlurredCanvas(currentImgCover).then((canvas) => {
            container.appendChild(canvas);
          });
        }

        // Add container to DOM
        element.appendChild(container);

        // Mark as loaded after a frame
        requestAnimationFrame(() => {
          container.classList.add('spicy-dynamic-bg-loaded');
        });
      }
    },
  );
}
