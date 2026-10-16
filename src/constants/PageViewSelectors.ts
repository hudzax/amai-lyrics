import { primarySurface } from './SpotifyDom';

export const PageViewSelectors = {
  // Owned by the SpotifyDomContract (SpotifyDom.ts → `mainViewScrollViewport`):
  // Spotify 1.3.3 ships every layout class hashed, and `Root__main-view` only
  // exists when Spicetify's css-map happens to cover the running build.
  // `.main-view-container` and the OverlayScrollbars viewport attribute are
  // emitted by Spotify itself, so this resolves either way. Referenced here
  // rather than spelled twice so a Spotify rename is one edit, not two.
  PageRoot: primarySurface('mainViewScrollViewport'),
  AmaiLyricsPage: '#AmaiLyricsPage',
  ContentBox: '#AmaiLyricsPage .ContentBox',
  MediaImage: '#AmaiLyricsPage .MediaImage',
  SongName: '#AmaiLyricsPage .SongName span',
  Artists: '#AmaiLyricsPage .Artists span',
  ViewControls: '#AmaiLyricsPage .ContentBox .ViewControls',
  Header: '#AmaiLyricsPage .ContentBox .NowBar .Header',
  HeaderViewControls: '#AmaiLyricsPage .ContentBox .NowBar .Header .ViewControls',
  RefreshLyricsButton: '#RefreshLyrics',
  WatchMusicVideoButton: '#WatchMusicVideoButton',
  SettingsButton: '#AmaiSettingsButton',
  ActionButtonContainer: '#AmaiLyricsPage .ContentBox .NowBar .AmaiPageButtonContainer',
  CloseButton: '#Close',
  FullscreenToggleButton: '#FullscreenToggle',
  LoaderContainer: '#AmaiLyricsPage .loaderContainer',
  LyricsContent: '#AmaiLyricsPage .LyricsContent',
  NowBar: '#AmaiLyricsPage .NowBar',
  NotificationContainer: '#AmaiLyricsPage .NotificationContainer',
};
