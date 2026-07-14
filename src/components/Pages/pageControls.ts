import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import { Icons } from '../Styling/Icons';
import Fullscreen from '../Utils/Fullscreen';
import TransferElement from '../Utils/TransferElement';
import Session from '../Global/Session';
import fastdom from 'fastdom';

export const Tooltips: Record<string, { destroy: () => void } | null> = {
  Close: null,
  Kofi: null,
  FullscreenToggle: null,
  LyricsToggle: null,
};

export async function AppendViewControls(maid: Maid | null, ReAppend: boolean = false) {
  const elem = document.querySelector<HTMLElement>(PageViewSelectors.ViewControls);
  if (!elem) return;

  await new Promise<void>((resolve) => {
    fastdom.mutate(() => {
      if (ReAppend) elem.innerHTML = '';
      elem.innerHTML = `
            <button id="Close" class="ViewControl">${Icons.Close}</button>
            <button id="FullscreenToggle" class="ViewControl">${
              Fullscreen.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen
            }</button>
        `;
      resolve();
    });
  });

  if (Fullscreen.IsOpen) {
    const headerElem = document.querySelector<HTMLElement>(PageViewSelectors.Header);
    if (headerElem) {
      await new Promise<void>((resolve) => {
        fastdom.mutate(() => {
          TransferElement(elem, headerElem, 0);
          resolve();
        });
      });
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    const viewControlsElem = document.querySelector<HTMLElement>(
      PageViewSelectors.HeaderViewControls,
    );
    SetupTippy(viewControlsElem, maid);
  } else {
    const headerViewControlsElem = document.querySelector<HTMLElement>(
      PageViewSelectors.HeaderViewControls,
    );
    if (headerViewControlsElem) {
      const contentBoxElem = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
      if (contentBoxElem) {
        await new Promise<void>((resolve) => {
          fastdom.mutate(() => {
            TransferElement(elem, contentBoxElem);
            resolve();
          });
        });
      }
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    SetupTippy(elem, maid);
  }
}

function SetupTippy(elem: HTMLElement | null, maid: Maid | null) {
  if (!elem) return;
  const closeButton = elem.querySelector<HTMLButtonElement>(PageViewSelectors.CloseButton);

  if (closeButton) {
    Tooltips.Close = Spicetify.Tippy(closeButton, {
      ...Spicetify.TippyProps,
      content: `Exit Lyrics Page`,
    });

    const closeClickHandler = () => Session.GoBack();
    closeButton.addEventListener('click', closeClickHandler);
    maid?.Give(() => closeButton.removeEventListener('click', closeClickHandler));
  }

  const fullscreenBtn = elem.querySelector<HTMLButtonElement>(
    PageViewSelectors.FullscreenToggleButton,
  );

  if (fullscreenBtn) {
    Tooltips.FullscreenToggle = Spicetify.Tippy(fullscreenBtn, {
      ...Spicetify.TippyProps,
      content: `Toggle Fullscreen View`,
    });

    const fullscreenClickHandler = () => Fullscreen.Toggle();
    fullscreenBtn.addEventListener('click', fullscreenClickHandler);
    maid?.Give(() => fullscreenBtn.removeEventListener('click', fullscreenClickHandler));
  }
}
