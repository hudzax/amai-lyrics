import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import { Icons } from '../Styling/Icons';
import Fullscreen from '../Utils/Fullscreen';
import TransferElement from '../Utils/TransferElement';
import Session from '../Global/Session';
import { mutateAsync } from '../../utils/fastdomAsync';

export const Tooltips: Record<string, { destroy: () => void } | null> = {
  Close: null,
  Kofi: null,
  FullscreenToggle: null,
  LyricsToggle: null,
};

export async function AppendViewControls(maid: Maid | null) {
  const elem = document.querySelector<HTMLElement>(PageViewSelectors.ViewControls);
  if (!elem) return;

  // Parse once and swap: replaceChildren(fragment) replaces all children,
  // so no separate clear step is needed on the ReAppend path.
  // SAFETY: Icons.* and Fullscreen state are static bundled values, not user-supplied text.
  await mutateAsync(() => {
    elem.replaceChildren(
      document.createRange().createContextualFragment(`
            <button id="Close" class="ViewControl">${Icons.Close}</button>
            <button id="FullscreenToggle" class="ViewControl">${
              Fullscreen.IsOpen ? Icons.CloseFullscreen : Icons.Fullscreen
            }</button>
        `),
    );
  });

  if (Fullscreen.IsOpen) {
    const headerElem = document.querySelector<HTMLElement>(PageViewSelectors.Header);
    if (headerElem) {
      await mutateAsync(() => {
        TransferElement(elem, headerElem, 0);
      });
    }
    Object.values(Tooltips).forEach((a) => a?.destroy());
    const viewControlsElem = document.querySelector<HTMLElement>(
      PageViewSelectors.HeaderViewControls,
    );
    SetupTippy(viewControlsElem, maid);
  } else {
    // Non-fullscreen: dock the controls inside the left-side button stack,
    // below the version text (appended at the end of the container).
    const actionContainer = document.querySelector<HTMLElement>(
      PageViewSelectors.ActionButtonContainer,
    );
    if (actionContainer && actionContainer.lastElementChild !== elem) {
      await mutateAsync(() => {
        TransferElement(elem, actionContainer);
      });
    } else if (!actionContainer) {
      // Fallback to the legacy bottom-edge dock when the button stack is missing.
      const headerViewControlsElem = document.querySelector<HTMLElement>(
        PageViewSelectors.HeaderViewControls,
      );
      if (headerViewControlsElem) {
        const contentBoxElem = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
        if (contentBoxElem) {
          await mutateAsync(() => {
            TransferElement(elem, contentBoxElem);
          });
        }
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
