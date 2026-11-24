import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadAndApplyLyrics: vi.fn(async () => ({ status: 'NO_LYRICS' })),
  clearLyricsUiTimeouts: vi.fn(),
  refreshLyricsPage: vi.fn(async (): Promise<void> => undefined),
  applyDynamicBackground: vi.fn(async () => undefined),
  appendViewControls: vi.fn(async () => undefined),
  setupActionButtons: vi.fn(),
  setupImageLoading: vi.fn(),
  sessionOpenNowBar: vi.fn(),
  sessionNowBarSetSide: vi.fn(),
}));

vi.mock('../../utils/Lyrics/fetchLyrics', () => ({
  loadAndApplyLyrics: mocks.loadAndApplyLyrics,
  clearLyricsUiTimeouts: mocks.clearLyricsUiTimeouts,
}));
vi.mock('../../utils/Lyrics/registry', () => ({
  clear: vi.fn(),
  detachClickToSeek: vi.fn(),
}));
vi.mock('../../utils/Lyrics/Applyer/Info/ApplyInfo', () => ({
  clearApplyInfoTimeout: vi.fn(),
}));
vi.mock('../DynamicBG/dynamicBackground', () => ({
  default: mocks.applyDynamicBackground,
}));
vi.mock('../DynamicBG/ArtworkSurfaces', () => ({
  artworkSurfacesSingleton: { refreshLyricsPage: mocks.refreshLyricsPage },
}));
vi.mock('../../utils/Scrolling/AutoScroll', () => ({
  AutoScroll: { reset: vi.fn(), destroy: vi.fn() },
}));
vi.mock('../../utils/PagePresence', () => ({ setPageOpen: vi.fn() }));
vi.mock('../NowBar/NowBar', () => ({
  InvalidateNowBar: vi.fn(),
  Session_NowBar_SetSide: mocks.sessionNowBarSetSide,
  Session_OpenNowBar: mocks.sessionOpenNowBar,
}));
vi.mock('../Utils/Fullscreen', () => ({
  default: { isPageFullscreen: vi.fn(() => false), leave: vi.fn() },
}));
vi.mock('../../utils/fastdomAsync', () => ({
  mutateAsync: vi.fn(async (callback: () => void) => callback()),
}));
vi.mock('@hudzax/web-modules/Maid', () => ({
  Maid: class {
    CleanUp() {}
    Destroy() {}
  },
}));
vi.mock('./PageHTML', () => ({
  PageHTML: '<div class="ContentBox"><div class="NowBar"></div></div>',
  NowBarHTML: '',
}));
vi.mock('./pageContent', () => ({ setupImageLoading: mocks.setupImageLoading }));
vi.mock('./pageControls', () => ({
  AppendViewControls: mocks.appendViewControls,
  Tooltips: {},
}));
vi.mock('./pageButtons', () => ({ setupActionButtons: mocks.setupActionButtons }));

import PageView from './PageView';

beforeEach(() => {
  vi.clearAllMocks();
  PageView.IsOpened = false;
  Spicetify.Player.data.item.uri = 'spotify:track:page-open';
  document.body.innerHTML =
    '<div class="main-view-container"><div data-overlayscrollbars-viewport="true"></div></div>';
});

describe('PageView artwork seam', () => {
  it('awaits the ArtworkSurfaces page paint before loading lyrics', async () => {
    let finishPaint: (() => void) | undefined;
    mocks.refreshLyricsPage.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishPaint = resolve;
        }),
    );

    const opening = PageView.Open();
    await vi.waitFor(() => expect(mocks.refreshLyricsPage).toHaveBeenCalledTimes(1));
    expect(mocks.loadAndApplyLyrics).not.toHaveBeenCalled();

    finishPaint?.();
    await opening;

    expect(mocks.applyDynamicBackground).not.toHaveBeenCalled();
    expect(mocks.loadAndApplyLyrics).toHaveBeenCalledWith('spotify:track:page-open');
  });
});
