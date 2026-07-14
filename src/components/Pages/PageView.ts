import fetchLyrics from '../../utils/Lyrics/fetchLyrics';
import '../../css/Loaders/DotLoader.css';
import '../../css/Loaders/ProcessingIndicator.css';
import { removeLinesEvListener } from '../../utils/Lyrics/lyrics';
import ApplyDynamicBackground from '../DynamicBG/dynamicBackground';
import Defaults from '../Global/Defaults';
import { ScrollSimplebar } from '../../utils/Scrolling/Simplebar/ScrollSimplebar';
import ApplyLyrics from '../../utils/Lyrics/Global/Applyer';
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
    fetchLyrics(currentUri).then(ApplyLyrics);
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
  Object.values(Tooltips).forEach((a) => a?.destroy());
  ResetLastLine();
  ScrollSimplebar?.unMount();
  maid?.CleanUp();
  maid = null;
  PageView.IsOpened = false;

  // Clean up processing indicator timeout if it exists
  if (window.ProcessingIndicatorTimeout) {
    clearTimeout(window.ProcessingIndicatorTimeout);
    window.ProcessingIndicatorTimeout = null;
  }
}

export default PageView;
