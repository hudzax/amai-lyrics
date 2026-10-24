import { primarySurface } from './SpotifyDom';

/**
 * The single owner of the extension's own page-DOM selectors: every spelling
 * that reaches into the #AmaiLyricsPage subtree lives here, never inline at a
 * call site — tests/pageViewSelectors.test.ts pins that the literal appears in
 * no other non-test src file. Spotify's DOM has its own owner (SpotifyDom.ts,
 * the SpotifyDomContract) and is out of scope; only the page this extension
 * creates and mounts itself is named here.
 */
export const PageViewSelectors = {
  // Owned by the SpotifyDomContract (SpotifyDom.ts → `mainViewScrollViewport`):
  // Spotify 1.3.3 ships every layout class hashed, and `Root__main-view` only
  // exists when Spicetify's css-map happens to cover the running build.
  // `.main-view-container` and the OverlayScrollbars viewport attribute are
  // emitted by Spotify itself, so this resolves either way. Referenced here
  // rather than spelled twice so a Spotify rename is one edit, not two.
  PageRoot: primarySurface('mainViewScrollViewport'),
  AmaiLyricsPage: '#AmaiLyricsPage',
  // The fullscreen presentation is the `.Fullscreen` class on the page node —
  // FullscreenMode is its only writer; this is how every reader spells the
  // "page presented fullscreen" query.
  FullscreenPage: '#AmaiLyricsPage.Fullscreen',
  ContentBox: '#AmaiLyricsPage .ContentBox',
  MediaImage: '#AmaiLyricsPage .MediaImage',
  SongName: '#AmaiLyricsPage .SongName span',
  Artists: '#AmaiLyricsPage .Artists span',
  ViewControls: '#AmaiLyricsPage .ContentBox .ViewControls',
  NowBarToggle: '#AmaiLyricsPage .ContentBox .ViewControls #NowBarToggle',
  Header: '#AmaiLyricsPage .ContentBox .NowBar .Header',
  HeaderViewControls: '#AmaiLyricsPage .ContentBox .NowBar .Header .ViewControls',
  HeaderMediaBox: '#AmaiLyricsPage .ContentBox .NowBar .Header .MediaBox',
  HeaderMediaBoxImage: '#AmaiLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage',
  RefreshLyricsButton: '#RefreshLyrics',
  WatchMusicVideoButton: '#WatchMusicVideoButton',
  SettingsButton: '#AmaiSettingsButton',
  ActionButtonContainer: '#AmaiLyricsPage .ContentBox .NowBar .AmaiPageButtonContainer',
  CloseButton: '#Close',
  FullscreenToggleButton: '#FullscreenToggle',
  // The mounted NowBar panel root, scoped through the content box.
  ContentBoxNowBar: '#AmaiLyricsPage .ContentBox .NowBar',
  NowBar: '#AmaiLyricsPage .NowBar',
  ContentBoxLyricsContainer: '#AmaiLyricsPage .ContentBox .LyricsContainer',
  LyricsContainer: '#AmaiLyricsPage .LyricsContainer',
  // The scroller's lyric content: the SimpleBar viewport LyricsRenderer paints
  // into and the row/credits/translation writers write to.
  LyricsContentInContainer: '#AmaiLyricsPage .LyricsContainer .LyricsContent',
  SimplebarContent: '#AmaiLyricsPage .LyricsContainer .LyricsContent .simplebar-content',
  LoaderContainer: '#AmaiLyricsPage .LyricsContainer .loaderContainer',
  ProcessingIndicator: '#AmaiLyricsPage .LyricsContainer .processingIndicator',
  LyricsContent: '#AmaiLyricsPage .LyricsContent',
  NotificationContainer: '#AmaiLyricsPage .NotificationContainer',
};
