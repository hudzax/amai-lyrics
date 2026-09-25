import { UpdateNowBar } from '../NowBar/NowBar';
import fastdom from 'fastdom';
import { Maid } from '@hudzax/web-modules/Maid';

interface ImageElementWithSetup extends HTMLImageElement {
  _setupImageLoading?: boolean;
}

export function setupImageLoading(imageElement: ImageElementWithSetup, maid: Maid | null) {
  if (imageElement._setupImageLoading) return;
  imageElement._setupImageLoading = true;

  // Track the pending high-res preload so it can be orphaned on teardown.
  let highResImage: HTMLImageElement | null = null;

  const onloadHandler = () => {
    if (!imageElement.isConnected) return;
    fastdom.mutate(() => {
      if (!imageElement.isConnected) return;
      imageElement.classList.add('loaded');
    });

    const highResUrl = imageElement.getAttribute('data-high-res');
    if (highResUrl) {
      highResImage = new Image();
      highResImage.onload = () => {
        if (!imageElement.isConnected) return;
        fastdom.mutate(() => {
          if (!imageElement.isConnected) return;
          if (imageElement.src !== highResUrl) {
            imageElement.src = highResUrl;
          }
        });
      };
      highResImage.onerror = () => {
        highResImage = null;
      };
      highResImage.src = highResUrl;
    }
  };

  imageElement.onload = onloadHandler;
  maid?.Give(() => {
    imageElement.onload = null;
    imageElement.onerror = null;
    if (highResImage) {
      highResImage.onload = null;
      highResImage.onerror = null;
      // Abort load by clearing src (best-effort). Remove attribute first to
      // avoid requesting "" as a URL in some browsers.
      try {
        highResImage.removeAttribute('src');
        highResImage.src = '';
      } catch {
        /* ignore */
      }
      highResImage = null;
    }
  });
}

export async function UpdatePageContent(isOpened: boolean) {
  if (isOpened) await UpdateNowBar();
}
