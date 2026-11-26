import { loadAndApplyLyrics, clearLyricsUiTimeouts } from '../../utils/Lyrics/fetchLyrics';
import '../../css/Loaders/DotLoader.css';
import '../../css/Loaders/ProcessingIndicator.css';
import { clear, detachClickToSeek } from '../../utils/Lyrics/registry';
import { clearApplyInfoTimeout } from '../../utils/Lyrics/Applyer/Info/ApplyInfo';
import { AutoScroll } from '../../utils/Scrolling/AutoScroll';
import { setPageOpen } from '../../utils/PagePresence';
import { InvalidateNowBar, Session_NowBar_SetSide, Session_OpenNowBar } from '../NowBar/NowBar';
import Fullscreen from '../Utils/Fullscreen';

import { mutateAsync } from '../../utils/fastdomAsync';
import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import { PageHTML, NowBarHTML } from './PageHTML';
import { setupImageLoading } from './pageContent';
import { AppendViewControls, Tooltips } from './pageControls';
import { setupActionButtons } from './pageButtons';

let maid: Maid | null = null;
let pageGeneration = 0;
let openPromise: Promise<void> | null = null;
let destroyPromise: Promise<void> | null = null;

const PageView = {
  Open: OpenPage,
  Destroy: DestroyPage,
  AppendViewControls: () => AppendViewControls(maid),
  IsOpened: false,
};

export let PageRoot: HTMLElement | null = null;

function initializePageRoot(): void {
  // querySelector is not a layout read — no fastdom batch needed.
  PageRoot = document.querySelector<HTMLElement>(PageViewSelectors.PageRoot);
}

function OpenPage(): Promise<void> {
  if (PageView.IsOpened) return Promise.resolve();
  if (destroyPromise) {
    const generation = pageGeneration;
    return destroyPromise.then(() => {
      if (generation === pageGeneration) return OpenPage();
      return undefined;
    });
  }
  if (openPromise) return openPromise;

  const generation = ++pageGeneration;
  const promise = openPage(generation);
  openPromise = promise;
  const clearOpenPromise = () => {
    if (openPromise === promise) openPromise = null;
  };
  void promise.then(clearOpenPromise, clearOpenPromise);
  return promise;
}

async function openPage(generation: number): Promise<void> {
  const isCurrent = () => generation === pageGeneration;
  const pageMaid = new Maid();
  maid = pageMaid;

  initializePageRoot();
  await createPageElement(isCurrent);
  if (!isCurrent()) return;
  // A fresh page must not inherit a pending delayed loader-show from the page
  // generation createPageElement just replaced: ShowLoaderContainer re-queries
  // when it fires, so an orphaned timer would paint the overlay onto the new
  // page with no request left to hide it — OpenPage only fetches when a track
  // is playing.
  clearLyricsUiTimeouts();

  setPageOpen(true);

  const contentBox = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
  if (contentBox) {
    const { artworkSurfacesSingleton } = await import('../DynamicBG/ArtworkSurfaces');
    if (!isCurrent()) return;
    if (contentBox.isConnected) await artworkSurfacesSingleton.refreshLyricsPage();
    if (!isCurrent()) return;
  }

  const mediaImage = document.querySelector<HTMLImageElement>(PageViewSelectors.MediaImage);
  if (mediaImage) {
    setupImageLoading(mediaImage, pageMaid);
  }

  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    loadAndApplyLyrics(currentUri).catch((e) =>
      console.error('[Amai Lyrics] PageView fetch failed:', e),
    );
  }

  Session_OpenNowBar();
  Session_NowBar_SetSide();

  await AppendViewControls(pageMaid);
  if (!isCurrent()) return;

  setupActionButtons(pageMaid);

  PageView.IsOpened = true;
}

async function createPageElement(isCurrent: () => boolean) {
  await mutateAsync(() => {
    if (!isCurrent()) return;
    // Remove any pre-existing page node (e.g. one left behind by a hot-reload
    // before the previous instance's teardown ran) to avoid duplicate
    // #AmaiLyricsPage nodes — ~75 selectors throughout the app resolve the
    // stale node otherwise.
    const existing = document.getElementById('AmaiLyricsPage');
    if (existing) existing.remove();

    const elem = document.createElement('div');
    elem.id = 'AmaiLyricsPage';
    // SAFETY: PageHTML is a static trusted template bundled with the extension, not user-supplied lyrics text.
    elem.replaceChildren(document.createRange().createContextualFragment(PageHTML));
    if (PageRoot) {
      PageRoot.appendChild(elem);
    }

    const nowBar = document.querySelector<HTMLElement>(PageViewSelectors.NowBar);
    if (nowBar) {
      // SAFETY: NowBarHTML is a static trusted template bundled with the extension, not user-supplied lyrics text.
      nowBar.replaceChildren(document.createRange().createContextualFragment(NowBarHTML));
    }
  });
}

function DestroyPage(): Promise<void> {
  // Every destroy request invalidates opens, including a second request while
  // an earlier removal is still awaiting its DOM mutation.
  pageGeneration++;
  openPromise = null;
  InvalidateNowBar();
  if (destroyPromise) return destroyPromise;

  const promise = destroyPage();
  destroyPromise = promise;
  const clearDestroyPromise = () => {
    if (destroyPromise === promise) destroyPromise = null;
  };
  void promise.then(clearDestroyPromise, clearDestroyPromise);
  return promise;
}

async function destroyPage(): Promise<void> {
  const pageMaid = maid;
  maid = null;
  const wasActive =
    PageView.IsOpened ||
    pageMaid !== null ||
    !!document.querySelector(PageViewSelectors.AmaiLyricsPage);
  PageView.IsOpened = false;
  clearLyricsUiTimeouts();
  if (!wasActive) return;

  if (Fullscreen.isPageFullscreen()) Fullscreen.leave();
  const amaiLyricsPage = document.querySelector<HTMLElement>(PageViewSelectors.AmaiLyricsPage);
  if (amaiLyricsPage) {
    // Await the removal before closing presence: otherwise isPageOpen() reads
    // "gone" for a frame while the node is still mounted, and in-flight
    // measures in that window read stale DOM.
    try {
      await mutateAsync(() => {
        amaiLyricsPage.remove();
      });
    } catch (error) {
      console.error('[Amai Lyrics] PageView destroy failed:', error);
    }
  }
  setPageOpen(false);
  detachClickToSeek();
  clear();
  clearApplyInfoTimeout();
  Object.values(Tooltips).forEach((a) => a?.destroy());
  Object.keys(Tooltips).forEach((k) => (Tooltips[k] = null));
  // One scroll seam owns reset plus the leak-safe container teardown behind
  // a single call (it keeps the stored removeEventListener refs inside).
  AutoScroll.destroy();
  try {
    pageMaid?.CleanUp();
    // Maid.Destroy is idempotent; CleanUp alone would leave Maid reusable but
    // we null the ref anyway so next Open gets a fresh instance.
    // SAFETY: the Maid type does not declare optional Destroy, but runtime Maid instances may expose it; the optional call is a safe no-op when absent.
    (pageMaid as unknown as { Destroy?: () => void })?.Destroy?.();
  } catch {
    /* ignore maid cleanup error */
  }

  // Clean up any orphan loader / indicator timeouts that would otherwise hold
  // detached DOM refs until they fire.
  clearLyricsUiTimeouts();
}

export default PageView;
