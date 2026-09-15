import { loadAndApplyLyrics } from '../../utils/Lyrics/fetchLyrics';
import '../../css/Loaders/DotLoader.css';
import '../../css/Loaders/ProcessingIndicator.css';
import { ClearLyricsContentArrays, removeLinesEvListener } from '../../utils/Lyrics/lyrics';
import { clearApplyInfoTimeout } from '../../utils/Lyrics/Applyer/Info/ApplyInfo';
import ApplyDynamicBackground from '../DynamicBG/dynamicBackground';
import Defaults from '../Global/Defaults';
import { ClearScrollSimplebar } from '../../utils/Scrolling/Simplebar/ScrollSimplebar';
import { clearLyricsUiTimeouts } from '../../utils/Lyrics/ui';
import { Session_NowBar_SetSide, Session_OpenNowBar } from '../Utils/NowBar';
import Fullscreen from '../Utils/Fullscreen';
import { ResetLastLine } from '../../utils/Scrolling/ScrollToActiveLine';
import { mutateAsync } from '../../utils/fastdomAsync';
import { Maid } from '@hudzax/web-modules/Maid';
import { PageViewSelectors } from '../../constants/PageViewSelectors';
import { PageHTML, NowBarHTML } from './PageHTML';
import { setupImageLoading, UpdatePageContent as UpdateContent } from './pageContent';
import { AppendViewControls, Tooltips } from './pageControls';
import { setupActionButtons } from './pageButtons';

let maid: Maid | null = null;

const PageView = {
  Open: OpenPage,
  Destroy: DestroyPage,
  AppendViewControls: () => AppendViewControls(maid),
  UpdatePageContent: () => UpdateContent(PageView.IsOpened),
  IsOpened: false,
};

export let PageRoot: HTMLElement | null = null;

function initializePageRoot(): void {
  // querySelector is not a layout read — no fastdom batch needed.
  PageRoot = document.querySelector<HTMLElement>(PageViewSelectors.PageRoot);
}

async function OpenPage() {
  if (PageView.IsOpened) return;

  maid = new Maid();

  initializePageRoot();
  await createPageElement();

  Defaults.LyricsContainerExists = true;

  const contentBox = document.querySelector<HTMLElement>(PageViewSelectors.ContentBox);
  if (contentBox) {
    await ApplyDynamicBackground(contentBox);
  }

  const mediaImage = document.querySelector<HTMLImageElement>(PageViewSelectors.MediaImage);
  if (mediaImage) {
    setupImageLoading(mediaImage, maid);
  }

  await PageView.UpdatePageContent();

  const currentUri = Spicetify.Player.data?.item?.uri;
  if (currentUri) {
    loadAndApplyLyrics(currentUri).catch((e) =>
      console.error('[Amai Lyrics] PageView fetch failed:', e),
    );
  }

  Session_OpenNowBar();
  Session_NowBar_SetSide();

  await PageView.AppendViewControls();

  setupActionButtons(maid);

  PageView.IsOpened = true;
}

async function createPageElement() {
  await mutateAsync(() => {
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

async function DestroyPage() {
  if (!PageView.IsOpened) return;
  if (Fullscreen.IsOpen) Fullscreen.Close();
  const amaiLyricsPage = document.querySelector<HTMLElement>(PageViewSelectors.AmaiLyricsPage);
  if (amaiLyricsPage) {
    // Await the removal before flipping LyricsContainerExists: otherwise the
    // flag reads "gone" for a frame while the node is still mounted, and
    // in-flight measures in that window read stale DOM.
    try {
      await mutateAsync(() => {
        amaiLyricsPage.remove();
      });
    } catch (error) {
      console.error('[Amai Lyrics] PageView destroy failed:', error);
    }
  }
  Defaults.LyricsContainerExists = false;
  removeLinesEvListener();
  ClearLyricsContentArrays();
  clearApplyInfoTimeout();
  Object.values(Tooltips).forEach((a) => a?.destroy());
  Object.keys(Tooltips).forEach((k) => (Tooltips[k] = null));
  ResetLastLine();
  // Use the leak-safe clear helper — directly unMounting here would bypass
  // the stored removeEventListener refs and leave listeners on the detached
  // SimpleBar container.
  ClearScrollSimplebar();
  try {
    maid?.CleanUp();
    // Maid.Destroy is idempotent; CleanUp alone would leave Maid reusable but
    // we null the ref anyway so next Open gets a fresh instance.
    // SAFETY: the Maid type does not declare optional Destroy, but runtime Maid instances may expose it; the optional call is a safe no-op when absent.
    (maid as unknown as { Destroy?: () => void })?.Destroy?.();
  } catch {
    /* ignore maid cleanup error */
  }
  maid = null;
  PageView.IsOpened = false;

  // Clean up any orphan loader / indicator timeouts that would otherwise hold
  // detached DOM refs until they fire.
  clearLyricsUiTimeouts();
}

export default PageView;
