import { SpotifyPlayer } from '../Global/SpotifyPlayer';
// import storage from '../../utils/storage'; // No longer needed?

/**
 * Creates or updates the dynamic background elements.
 * Uses two image elements for cross-fading.
 * Relies on CSS for blur, transitions, and animations.
 */
async function setupDynamicBackground(
  element: HTMLElement,
  imageUrl: string,
): Promise<HTMLDivElement> {
  let bgContainer = element.querySelector('.sweet-dynamic-bg') as HTMLDivElement | null;

  if (!bgContainer) {
    // --- Create container and images on first run ---
    bgContainer = document.createElement('div');
    bgContainer.className = 'sweet-dynamic-bg';
    bgContainer.setAttribute('current-img', imageUrl); // Set initial image

    // Create placeholder for immediate visual feedback
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    bgContainer.appendChild(placeholder);

    // Create the two image elements for crossfading
    const imgA = document.createElement('img');
    imgA.id = 'bg-img-a';
    imgA.className = 'bg-image primary active'; // Start with A as active primary
    imgA.decoding = 'async';
    imgA.loading = 'eager'; // Load the first image eagerly
    imgA.src = imageUrl;
    imgA.addEventListener(
      'load',
      () => {
        // Remove placeholder after first image loads
        if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      },
      { once: true, passive: true },
    );
    bgContainer.appendChild(imgA);

    const imgB = document.createElement('img');
    imgB.id = 'bg-img-b';
    imgB.className = 'bg-image secondary'; // B starts as inactive secondary
    imgB.decoding = 'async';
    imgB.loading = 'lazy'; // Load subsequent images lazily
    // Don't set src for imgB initially
    bgContainer.appendChild(imgB);

    // Add container to the target element
    element.appendChild(bgContainer);

    // Set initial random CSS variables (only once or less frequently?)
    // For now, set them on creation
    const rotationPrimary = Math.floor(Math.random() * 360);
    const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360; // Offset by 15 degrees
    document.documentElement.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
    document.documentElement.style.setProperty(
      '--bg-rotation-secondary',
      `${rotationSecondary}deg`,
    );
    const scalePrimary = 1.0 + Math.random() * 0.2; // Between 1.0 and 1.2
    const scaleSecondary = 1.1 + Math.random() * 0.2; // Between 1.1 and 1.3
    document.documentElement.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
    document.documentElement.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);
    const hueShift = Math.floor(Math.random() * 30);
    document.documentElement.style.setProperty('--bg-hue-shift', `${hueShift}deg`);
  }

  return bgContainer;
}

// Debounce utility to avoid redundant updates
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

/**
 * Updates the dynamic background with a new image using crossfade.
 */
const updateDynamicBackground = debounce(
  (bgContainer: HTMLDivElement, newImageUrl: string) => {
    // Find the active and inactive images
    const imgA = bgContainer.querySelector('#bg-img-a') as HTMLImageElement;
    const imgB = bgContainer.querySelector('#bg-img-b') as HTMLImageElement;

    if (!imgA || !imgB) {
      console.error('Dynamic background image elements not found!');
      return;
    }

    const activeImg = imgA.classList.contains('active') ? imgA : imgB;
    const inactiveImg = activeImg === imgA ? imgB : imgA;

    // Prevent redundant loads
    if (inactiveImg.src === newImageUrl) return;

    // Update the inactive image source
    inactiveImg.src = newImageUrl;

    // Once the inactive image loads, start the crossfade
    inactiveImg.onload = () => {
      // Swap active classes
      activeImg.classList.remove('active');
      inactiveImg.classList.add('active');
      // Set new random CSS variables for each transition for more variety
      const rotationPrimary = Math.floor(Math.random() * 360);
      const rotationSecondary = (Math.floor(Math.random() * 360) + 15) % 360; // Offset by 15 degrees
      document.documentElement.style.setProperty('--bg-rotation-primary', `${rotationPrimary}deg`);
      document.documentElement.style.setProperty(
        '--bg-rotation-secondary',
        `${rotationSecondary}deg`,
      );
      const scalePrimary = 1.0 + Math.random() * 0.2; // Between 1.0 and 1.2
      const scaleSecondary = 1.1 + Math.random() * 0.2; // Between 1.1 and 1.3
      document.documentElement.style.setProperty('--bg-scale-primary', `${scalePrimary}`);
      document.documentElement.style.setProperty('--bg-scale-secondary', `${scaleSecondary}`);
      const hueShift = Math.floor(Math.random() * 30);
      document.documentElement.style.setProperty('--bg-hue-shift', `${hueShift}deg`);
    };

    inactiveImg.onerror = () => {
      console.error('Error loading new background image:', newImageUrl);
      // Optional: Handle error, e.g., hide the failed image or revert
    };

    // Update the current image attribute on the container
    bgContainer.setAttribute('current-img', newImageUrl);
  },
  100, // Debounce delay in ms
);

/**
 * Main function to apply the dynamic background to a given element.
 * Fetches the current artwork and calls setup/update functions.
 */
export default async function ApplyDynamicBackground(element: HTMLElement) {
  if (!element) return;

  // Fetch cover image and convert to proper URL if needed
  let currentImgCover = await SpotifyPlayer.Artwork.Get('d');
  if (currentImgCover.startsWith('spotify:image:')) {
    const imageId = currentImgCover.replace('spotify:image:', '');
    currentImgCover = `https://i.scdn.co/image/${imageId}`;
  }

  // Ensure the container and images are set up
  const bgContainer = await setupDynamicBackground(element, currentImgCover);

  // Check if the image needs updating
  const displayedImg = bgContainer.getAttribute('current-img');
  if (displayedImg !== currentImgCover) {
    updateDynamicBackground(bgContainer, currentImgCover);
  }

  /*
  // --- Original logic for setting CSS variables ---
  // Kept here for reference, now integrated into setup/update
  // Set random rotation degrees for variety
  const rotationPrimary = Math.floor(Math.random() * 360);
  const rotationSecondary = Math.floor(Math.random() * 360);
  document.documentElement.style.setProperty(
    '--bg-rotation-primary',
    `${rotationPrimary}deg`, // Example: Keep setting variables if needed
  );
  // ... rest of variable setting ...
  */
}
