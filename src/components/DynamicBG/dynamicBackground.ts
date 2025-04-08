import { SpotifyPlayer } from '../Global/SpotifyPlayer';

export default async function ApplyDynamicBackground(element) {
  if (!element) return;

  // Cache player data
  const playerData = Spicetify.Player.data;
  const isEpisode = playerData.item.type === 'episode';

  // Fetch cover image
  const currentImgCover = await SpotifyPlayer.Artwork.Get('d');

  const prevDiv = element.querySelector(
    '.spicy-dynamic-bg',
  ) as HTMLDivElement | null;

  if (prevDiv) {
    if (prevDiv.getAttribute('current_tag') === currentImgCover) {
      // No change needed
      return;
    }
    prevDiv.setAttribute('current_tag', currentImgCover);
    prevDiv.innerHTML = `
                <img class="Front" src="${currentImgCover}" />
                <img class="Back" src="${currentImgCover}" />
                <img class="BackCenter" src="${currentImgCover}" />
            `;
    return;
  }

  const dynamicBgDiv = document.createElement('div');
  dynamicBgDiv.classList.add('spicy-dynamic-bg');
  dynamicBgDiv.setAttribute('current_tag', currentImgCover);
  dynamicBgDiv.innerHTML = `
            <img class="Front" src="${currentImgCover}" />
            <img class="Back" src="${currentImgCover}" />
            <img class="BackCenter" src="${currentImgCover}" />
        `;
  element.appendChild(dynamicBgDiv);
}
