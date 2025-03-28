import Animator from '../../utils/Animator';
import { ResetLastLine } from '../../utils/Scrolling/ScrollToActiveLine';
import storage from '../../utils/storage';
import Global from '../Global/Global';
import PageView, { PageRoot, Tooltips } from '../Pages/PageView';
import { DeregisterNowBarBtn, OpenNowBar } from './NowBar';
import TransferElement from './TransferElement';

const Fullscreen = {
  Open,
  Close,
  Toggle,
  IsOpen: false,
};

const MediaBox_Data = {
  Eventified: false,
  Functions: {
    MouseIn: () => {
      if (MediaBox_Data.Animators.brightness.reversed)
        MediaBox_Data.Animators.brightness.Reverse();
      if (MediaBox_Data.Animators.blur.reversed)
        MediaBox_Data.Animators.blur.Reverse();
      MediaBox_Data.Animators.brightness.Start();
      MediaBox_Data.Animators.blur.Start();
    },
    MouseOut: () => {
      if (!MediaBox_Data.Animators.brightness.reversed)
        MediaBox_Data.Animators.brightness.Reverse();
      if (!MediaBox_Data.Animators.blur.reversed)
        MediaBox_Data.Animators.blur.Reverse();
      MediaBox_Data.Animators.brightness.Start();
      MediaBox_Data.Animators.blur.Start();
    },
    Reset: (MediaImage: HTMLElement) => {
      MediaImage.style.removeProperty('--ArtworkBrightness');
      MediaImage.style.removeProperty('--ArtworkBlur');
    },
    Eventify: (MediaImage: HTMLElement) => {
      MediaBox_Data.Animators.brightness.on('progress', (progress) => {
        MediaImage.style.setProperty('--ArtworkBrightness', `${progress}`);
      });
      MediaBox_Data.Animators.blur.on('progress', (progress) => {
        MediaImage.style.setProperty('--ArtworkBlur', `${progress}px`);
      });
      MediaBox_Data.Eventified = true;
    },
  },
  Animators: {
    brightness: new Animator(1, 0.5, 0.25),
    blur: new Animator(0, 0.2, 0.25),
  },
};

function Open() {
  const SpicyPage = document.querySelector<HTMLElement>(
    '.Root__main-view #SpicyLyricsPage',
  );
  const Root = document.body as HTMLElement;

  if (SpicyPage) {
    TransferElement(SpicyPage, Root);
    SpicyPage.classList.add('Fullscreen');
    Fullscreen.IsOpen = true;
    PageView.AppendViewControls(true);

    Tooltips.NowBarToggle?.destroy();

    const NowBarToggle = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .ViewControls #NowBarToggle',
    );

    if (NowBarToggle) {
      NowBarToggle.remove();
    }

    OpenNowBar();

    if (!document.fullscreenElement) {
      Root.querySelector('#SpicyLyricsPage')
        .requestFullscreen()
        .catch((err) => {
          alert(
            `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`,
          );
        });
    } else {
      document.exitFullscreen();
    }

    ResetLastLine();

    const MediaBox = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox',
    );
    const MediaImage = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
    );

    MediaBox_Data.Functions.Eventify(MediaImage);

    MediaBox.addEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
    MediaBox.addEventListener('mouseleave', MediaBox_Data.Functions.MouseOut);

    Global.Event.evoke('fullscreen:open', null);
  }
}

function Close() {
  const SpicyPage = document.querySelector<HTMLElement>('#SpicyLyricsPage');

  if (SpicyPage) {
    TransferElement(SpicyPage, PageRoot);
    SpicyPage.classList.remove('Fullscreen');
    Fullscreen.IsOpen = false;
    PageView.AppendViewControls(true);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    const NoLyrics = storage.get('currentLyricsData')?.includes('NO_LYRICS');
    if (NoLyrics) {
      OpenNowBar();
      document
        .querySelector('#SpicyLyricsPage .ContentBox .LyricsContainer')
        .classList.add('Hidden');
      DeregisterNowBarBtn();
    }
    ResetLastLine();

    const MediaBox = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox',
    );
    const MediaImage = document.querySelector<HTMLElement>(
      '#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
    );

    MediaBox.removeEventListener('mouseenter', MediaBox_Data.Functions.MouseIn);
    MediaBox.removeEventListener(
      'mouseleave',
      MediaBox_Data.Functions.MouseOut,
    );

    MediaBox_Data.Functions.Reset(MediaImage);

    Global.Event.evoke('fullscreen:exit', null);
  }
}

function Toggle() {
  const SpicyPage = document.querySelector<HTMLElement>('#SpicyLyricsPage');

  if (SpicyPage) {
    if (Fullscreen.IsOpen) {
      Close();
    } else {
      Open();
    }
  }
}

export default Fullscreen;
