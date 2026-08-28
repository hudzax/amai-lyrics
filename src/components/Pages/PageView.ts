import fetchLyrics from '../../utils/Lyrics/fetchLyrics';
import '../../css/Loaders/DotLoader.css';
import '../../css/Loaders/ProcessingIndicator.css';
import { ClearLyricsContentArrays, removeLinesEvListener } from '../../utils/Lyrics/lyrics';
import { clearApplyInfoTimeout } from '../../utils/Lyrics/Applyer/Info/ApplyInfo';
import ApplyDynamicBackground from '../DynamicBG/dynamicBackground';
import Defaults from '../Global/Defaults';
import { ClearScrollSimplebar } from '../../utils/Scrolling/Simplebar/ScrollSimplebar';
import ApplyLyrics from '../../utils/Lyrics/Global/Applyer';
import { clearLyricsUiTimeouts } from '../../utils/Lyrics/ui';
import { Session_NowBar_SetSide, Session_OpenNowBar } from '../Utils/NowBar';
import Fullscreen from '../Utils/Fullscreen';
import { ResetLastLine } from '../../utils/Scrolling/ScrollToActiveLine';
import fastdom from 'fastdom';
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

async function initializePageRoot() {
  return new Promise<void>((resolve) => {
    fastdom.measure(() => {
      PageRoot = document.querySelector<HTMLElement>(PageViewSelectors.PageRoot);
      resolve();
    });
  });
}

async function OpenPage() {
  if (PageView.IsOpened) return;

  maid = new Maid();

  await initializePageRoot();
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
    fetchLyrics(currentUri)
      .then(ApplyLyrics)
      .catch((e) => console.error('[Amai Lyrics] PageView fetch failed:', e));
  }

  Session_OpenNowBar();
  Session_NowBar_SetSide();

  await PageView.AppendViewControls();

  setupActionButtons(maid);

  PageView.IsOpened = true;
}

async function createPageElement() {
  return new Promise<void>((resolve) => {
    fastdom.mutate(() => {
      const elem = document.createElement('div');
      elem.id = 'SpicyLyricsPage';
      elem.innerHTML = PageHTML;
      if (PageRoot) {
        PageRoot.appendChild(elem);
      }

      const nowBar = document.querySelector<HTMLElement>(PageViewSelectors.NowBar);
      if (nowBar) {
        nowBar.innerHTML = NowBarHTML;
      }
      resolve();
    });
  });
}

async function DestroyPage() {
  if (!PageView.IsOpened) return;
  if (Fullscreen.IsOpen) Fullscreen.Close();
  const spicyLyricsPage = document.querySelector<HTMLElement>(PageViewSelectors.SpicyLyricsPage);
  if (!spicyLyricsPage) return;
  fastdom.mutate(() => {
    spicyLyricsPage?.remove();
  });
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
