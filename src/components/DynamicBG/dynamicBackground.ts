import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import { debounce } from '../../utils/debounce';
import { normalizeImageUrl, setRandomCSSVariables, createBackgroundImage } from './utils';

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
    bgContainer = document.createElement('div');
    bgContainer.className = 'sweet-dynamic-bg';
    bgContainer.setAttribute('current-img', imageUrl);

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    bgContainer.appendChild(placeholder);

    const imgA = createBackgroundImage('bg-img-a', 'bg-image primary active', imageUrl, 'eager');
    imgA.addEventListener(
      'load',
      () => {
        if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      },
      { once: true, passive: true },
    );
    bgContainer.appendChild(imgA);

    const imgB = createBackgroundImage('bg-img-b', 'bg-image secondary', '', 'lazy');
    bgContainer.appendChild(imgB);

    element.appendChild(bgContainer);
    setRandomCSSVariables();
  }

  return bgContainer;
}

/**
 * Updates the dynamic background with a new image using crossfade.
 */
const updateDynamicBackground = debounce((bgContainer: HTMLDivElement, newImageUrl: string) => {
  const imgA = bgContainer.querySelector('#bg-img-a') as HTMLImageElement;
  const imgB = bgContainer.querySelector('#bg-img-b') as HTMLImageElement;

  if (!imgA || !imgB) {
    console.error('Dynamic background image elements not found!');
    return;
  }

  const activeImg = imgA.classList.contains('active') ? imgA : imgB;
  const inactiveImg = activeImg === imgA ? imgB : imgA;

  if (inactiveImg.src === newImageUrl) return;

  inactiveImg.src = newImageUrl;
  inactiveImg.onload = () => {
    requestAnimationFrame(() => {
      activeImg.classList.remove('active');
      inactiveImg.classList.add('active');
      bgContainer.setAttribute('current-img', newImageUrl);
      setRandomCSSVariables();
    });
  };
  inactiveImg.onerror = () => {
    console.error('Error loading new background image:', newImageUrl);
  };
}, 100);

/**
 * Main function to apply the dynamic background to a given element.
 * Fetches the current artwork and calls setup/update functions.
 */
export default async function ApplyDynamicBackground(element: HTMLElement) {
  if (!element) return;

  const rawCover = await SpotifyPlayer.Artwork.Get('d');
  const currentImgCover = normalizeImageUrl(rawCover) ?? rawCover;

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
