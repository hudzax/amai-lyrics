import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import fastdom from 'fastdom';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import { Maid } from '@hudzax/web-modules/Maid';

interface ImageElementWithSetup extends HTMLImageElement {
  _setupImageLoading?: boolean;
}

export function setupImageLoading(imageElement: ImageElementWithSetup, maid: Maid | null) {
  if (imageElement._setupImageLoading) return;
  imageElement._setupImageLoading = true;

  const onloadHandler = () => {
    fastdom.mutate(() => {
      imageElement.classList.add('loaded');
    });

    const highResUrl = imageElement.getAttribute('data-high-res');
    if (highResUrl) {
      const highResImage = new Image();
      highResImage.onload = () => {
        fastdom.mutate(() => {
          if (imageElement.src !== highResUrl) {
            imageElement.src = highResUrl;
          }
        });
      };
      highResImage.src = highResUrl;
    }
  };

  imageElement.onload = onloadHandler;
  maid?.Give(() => {
    imageElement.onload = null;
  });
}

export async function UpdatePageContent(isOpened: boolean) {
  if (!isOpened) return;

  const mediaImage = document.querySelector<HTMLImageElement>(PageViewSelectors.MediaImage);

  if (mediaImage) {
    const mutationPromise = new Promise<void>((resolve) => {
      fastdom.mutate(() => {
        if (mediaImage.classList.contains('loaded')) {
          mediaImage.classList.remove('loaded');
        }
        resolve();
      });
    });

    await Promise.all([mutationPromise, updateSongInfo(), updateArtwork(mediaImage)]);
  }
}

async function updateSongInfo() {
  const songNamePromise = SpotifyPlayer.GetSongName();
  const artistsPromise = SpotifyPlayer.GetArtists();

  const [songName, artists] = await Promise.all([songNamePromise, artistsPromise]);

  const songNameElem = document.querySelector<HTMLElement>(PageViewSelectors.SongName);
  const artistsElem = document.querySelector<HTMLElement>(PageViewSelectors.Artists);
  const joinedArtists = SpotifyPlayer.JoinArtists(artists);

  return new Promise<void>((resolve) => {
    fastdom.mutate(() => {
      if (songNameElem && songNameElem.textContent !== songName) {
        songNameElem.textContent = songName;
      }
      if (artistsElem && artistsElem.textContent !== joinedArtists) {
        artistsElem.textContent = joinedArtists;
      }
      resolve();
    });
  });
}

async function updateArtwork(mediaImage: HTMLImageElement) {
  try {
    const [standardUrl, highResUrl] = await Promise.all([
      SpotifyPlayer.Artwork.Get('l'),
      SpotifyPlayer.Artwork.Get('xl'),
    ]);

    return new Promise<void>((resolve) => {
      fastdom.mutate(() => {
        if (standardUrl && mediaImage.src !== standardUrl) {
          mediaImage.src = standardUrl;
        }
        if (highResUrl && mediaImage.getAttribute('data-high-res') !== highResUrl) {
          mediaImage.setAttribute('data-high-res', highResUrl);
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to load artwork:', error);
  }
}
