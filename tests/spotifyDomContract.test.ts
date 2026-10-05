import { describe, it, expect, beforeEach } from 'vitest';
import { PageViewSelectors } from '../src/constants/PageViewSelectors';

/**
 * Spotify 1.3.3 layout skeleton, transcribed from a live DOM dump.
 *
 * Spotify now ships every layout class hashed. The stable hooks that remain are
 * the ids Spicetify injects during preprocessing (`#main-view`,
 * `#Desktop_LeftSidebar_Id`), the ids Spotify emits itself
 * (`#Desktop_PanelContainer_Id`), `data-testid` attributes, and a handful of
 * semantic classes it kept. Anything else only resolves while Spicetify's
 * `css-map.json` happens to cover the running build — which is how the
 * `.Root__main-view` / `.Root__nav-bar` / `.Root__now-playing-bar` selectors
 * silently died and took the lyrics page with them.
 *
 * Rotating hashed class names are deliberately omitted: a fixture that contains
 * them would imply they are stable.
 */
const SPOTIFY_1_3_3_LAYOUT = `
  <div class="Root amai-app-bg-host">
    <div class="Root__top-container">
      <div id="global-nav-bar" class="Root__globalNav"></div>
      <div id="Desktop_LeftSidebar_Id">
        <nav>
          <div class="YourLibraryX">
            <header class="main-yourLibraryX-header main-yourLibraryX-headerIsCollapsed"></header>
            <div data-overlayscrollbars="host">
              <div data-overlayscrollbars-viewport="scrollbarHidden overflowXHidden overflowYScroll">
                <div class="main-yourLibraryX-libraryRootlist">
                  <div id="libRow" role="row"><div role="gridcell"></div></div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <div id="playbarRegion">
        <aside class="main-nowPlayingBar-container" data-testid="now-playing-bar">
          <div class="main-nowPlayingBar-nowPlayingBar">
            <div class="main-nowPlayingBar-center">
              <div data-testid="player-controls">
                <div class="player-controls__buttons" data-testid="general-controls"></div>
                <div class="playback-bar"></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <div id="main-view">
        <header class="main-topBar-container" data-testid="topbar"></header>
        <div class="main-view-container">
          <div class="before-scroll-node"></div>
          <div class="main-view-container__scroll-node" data-overlayscrollbars="host">
            <div data-overlayscrollbars-viewport="scrollbarHidden overflowXHidden overflowYScroll">
              <div class="main-view-container__scroll-node-child"></div>
            </div>
          </div>
          <div class="after-scroll-node"></div>
        </div>
      </div>
      <div>
        <div>
          <aside id="Desktop_PanelContainer_Id" class="NowPlayingView"></aside>
        </div>
      </div>
    </div>
  </div>
`;

describe('Spotify 1.3.3 DOM contract', () => {
  beforeEach(() => {
    document.body.innerHTML = SPOTIFY_1_3_3_LAYOUT;
  });

  it('resolves PageRoot to the main view scroll viewport', () => {
    const root = document.querySelector(PageViewSelectors.PageRoot);
    expect(root).not.toBeNull();
    expect(root?.hasAttribute('data-overlayscrollbars-viewport')).toBe(true);
    expect(root?.closest('#main-view')).not.toBeNull();
  });

  it('resolves the playbar and its controls wrapper', () => {
    expect(document.querySelector('[data-testid="now-playing-bar"]')).not.toBeNull();
    const controls = document.querySelector(
      '[data-testid="now-playing-bar"] [data-testid="player-controls"]',
    );
    expect(controls).not.toBeNull();
    // The lyrics overlay is appended to the controls' parent and hidden/shown
    // against these, so both must stay reachable.
    expect(controls?.parentElement?.classList.contains('main-nowPlayingBar-center')).toBe(true);
    expect(controls?.querySelector('.playback-bar')).not.toBeNull();
  });

  it('reaches the playbar region wrapper that paints the bar background', () => {
    // In 1.3.3 the region div (hash of the old `.Root__now-playing-bar`) is the
    // element painting the bar; the testid is on its inner child only.
    const wrapper = document.querySelector("div:has(> [data-testid='now-playing-bar'])");
    expect(wrapper?.id).toBe('playbarRegion');
  });

  it('never scopes the track-row hover to sidebar rows', () => {
    // The hover veil is scoped to `#main-view`; sidebar rows live outside it.
    const rows = document.querySelectorAll(
      "#main-view [role='row']:not(:has([role='columnheader']))",
    );
    expect(rows.length).toBe(0);
  });

  it('resolves the left sidebar and the Now Playing View panel', () => {
    expect(document.querySelector('#Desktop_LeftSidebar_Id')).not.toBeNull();
    expect(document.querySelector('#Desktop_LeftSidebar_Id .YourLibraryX')).not.toBeNull();
    expect(
      document.querySelector('#Desktop_LeftSidebar_Id .main-yourLibraryX-header'),
    ).not.toBeNull();
    expect(document.querySelector('aside.NowPlayingView')).not.toBeNull();
  });

  it('resolves the content node the open lyrics page hides', () => {
    expect(document.querySelector('.main-view-container__scroll-node-child')).not.toBeNull();
  });

  it('no longer provides the Root__* layout classes or a bare .player-controls', () => {
    for (const dead of [
      '.Root__main-view',
      '.Root__nav-bar',
      '.Root__now-playing-bar',
      '.Root__right-sidebar',
      '.player-controls',
      '.main-nowPlayingView-content',
      '.main-nowPlayingView-section',
      '.main-content-view',
    ]) {
      expect(document.querySelector(dead), `${dead} must not be relied on`).toBeNull();
    }
  });
});

/**
 * The Now Playing View panel, transcribed from a dump taken with it open.
 *
 * `.main-nowPlayingView-section` is hashed in 1.3.3 with no css-map entry, so
 * the glass rules reach a section structurally: a direct child of the open-panel
 * div that is not the cover-art block. That inference came from a single dump,
 * so it is pinned here — if Spotify reorders the panel these tests fail instead
 * of the styling silently disappearing.
 */
const NPV_PANEL = `
  <aside id="Desktop_PanelContainer_Id" class="NowPlayingView">
    <div>
      <div class="main-nowPlayingView-headerWrapper"></div>
      <div data-overlayscrollbars="host">
        <div data-overlayscrollbars-viewport="scrollbarHidden overflowXHidden overflowYScroll">
          <div>
            <div data-testid="NPV_Panel_OpenDiv">
              <div id="coverBlock">
                <div><div data-testid="cover-drop-target"><img alt="" /></div></div>
              </div>
              <div id="lyricsSection" data-testid="lyrics-npv-section"></div>
              <div id="section2"></div>
              <div id="section3"></div>
              <div id="section4"></div>
              <div id="section5"><ul></ul></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
`;

const NPV_SECTION_SELECTOR =
  '[data-testid="NPV_Panel_OpenDiv"] > div:not(:has([data-testid="cover-drop-target"]))';

describe('Now Playing View section selector', () => {
  beforeEach(() => {
    document.body.innerHTML = NPV_PANEL;
  });

  it('matches every section and nothing else', () => {
    const matched = [...document.querySelectorAll(NPV_SECTION_SELECTOR)].map((el) => el.id);
    expect(matched).toEqual(['lyricsSection', 'section2', 'section3', 'section4', 'section5']);
  });

  it('excludes the cover-art block', () => {
    expect(document.getElementById('coverBlock')?.matches(NPV_SECTION_SELECTOR)).toBe(false);
    expect(document.querySelector('[data-testid="cover-drop-target"]')).not.toBeNull();
  });
});

/**
 * The playlist page, transcribed from a dump taken on a playlist page.
 *
 * In 1.3.3 the opaque base-color layer the theme has to neutralize sits on a
 * hashed content wrapper — the old `.playlist-playlist-playlistContent` hook is
 * gone — with a gradient scrim as its first child. The transparency rule
 * reaches both structurally: the wrapper is the section child that is not the
 * entity header. Pinned here so a Spotify reorder fails a test instead of
 * silently restoring the opaque backdrop over the canvas.
 */
const PLAYLIST_PAGE = `
  <div id="main-view">
    <div class="main-view-container">
      <div class="main-view-container__scroll-node" data-overlayscrollbars="host">
        <div data-overlayscrollbars-viewport="scrollbarHidden overflowXHidden overflowYScroll">
          <div class="main-view-container__scroll-node-child">
            <main>
              <section role="presentation" data-testid="playlist-page">
                <div data-testid="entity-header">
                  <div id="headerColorLayer"></div>
                  <div class="contentSpacing">
                    <div data-testid="playlist-image"></div>
                  </div>
                </div>
                <div id="pageContent">
                  <div id="scrim"></div>
                  <div id="actionBar" data-testid="action-bar"></div>
                  <div class="contentSpacing">
                    <div role="grid">
                      <div id="headerWrapper">
                        <div id="headerRow" role="row">
                          <div role="columnheader"></div>
                        </div>
                      </div>
                      <div id="trackRow" role="row">
                        <div role="presentation">
                          <div role="gridcell"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const PLAYLIST_CONTENT_SELECTOR =
  "[data-testid='playlist-page'] > div:not([data-testid='entity-header']):not(:has([data-testid='entity-header']))";

describe('Playlist page content selector', () => {
  beforeEach(() => {
    document.body.innerHTML = PLAYLIST_PAGE;
  });

  it('matches the content wrapper and nothing else', () => {
    const matched = [...document.querySelectorAll(PLAYLIST_CONTENT_SELECTOR)].map((el) => el.id);
    expect(matched).toEqual(['pageContent']);
  });

  it('reaches the gradient scrim as the first child', () => {
    const scrim = document.querySelector(`${PLAYLIST_CONTENT_SELECTOR} > :first-child`);
    expect(scrim?.id).toBe('scrim');
  });

  it('keeps the track list grid inside the neutralized wrapper', () => {
    expect(document.querySelector(`${PLAYLIST_CONTENT_SELECTOR} [role='grid']`)).not.toBeNull();
  });
});

const TRACK_ROW_HOVER_SELECTOR = "#main-view [role='row']:not(:has([role='columnheader']))";

describe('Track list row hover selector', () => {
  beforeEach(() => {
    document.body.innerHTML = PLAYLIST_PAGE;
  });

  it('matches data rows and never the column-header row', () => {
    const rows = [...document.querySelectorAll(TRACK_ROW_HOVER_SELECTOR)].map((el) => el.id);
    expect(rows).toEqual(['trackRow']);
    expect(document.getElementById('headerRow')?.matches(TRACK_ROW_HOVER_SELECTOR)).toBe(false);
  });

  it('lands the veil on the same inner wrapper the native hover fill uses', () => {
    // Spotify paints the native row fill on this direct child, so the veil has
    // to sit on it to override the highlight rather than sit underneath it.
    const fill = document.querySelector(`${TRACK_ROW_HOVER_SELECTOR} > div`);
    expect(fill?.getAttribute('role')).toBe('presentation');
  });
});

const TRACK_HEADER_WRAPPER_SELECTOR = "#main-view [role='grid'] > div:has([role='columnheader'])";

describe('Track list column header selector', () => {
  beforeEach(() => {
    document.body.innerHTML = PLAYLIST_PAGE;
  });

  it('matches exactly the grid child that holds the column-header row', () => {
    const matched = [...document.querySelectorAll(TRACK_HEADER_WRAPPER_SELECTOR)].map(
      (el) => el.id,
    );
    expect(matched).toEqual(['headerWrapper']);
    expect(document.getElementById('trackRow')?.matches(TRACK_HEADER_WRAPPER_SELECTOR)).toBe(false);
  });
});

describe('Playlist header fill selector', () => {
  beforeEach(() => {
    document.body.innerHTML = PLAYLIST_PAGE;
  });

  it('reaches the base-color layer as the entity header first child', () => {
    const layer = document.querySelector("[data-testid='entity-header'] > div:first-child");
    expect(layer?.id).toBe('headerColorLayer');
  });

  it('keeps the action bar reachable as the neutralized surface', () => {
    expect(document.querySelector("[data-testid='action-bar']")).not.toBeNull();
  });
});

/**
 * The pre-1.3.3 layout, transcribed from the shapes the repo was written
 * against before Spotify hashed every class. The extension has to keep working
 * on both builds: every rule and constant carries the old semantic names as
 * aliases (inert once the names disappear), so this fixture pins that each
 * alias still has something to match on the previous version.
 */
const SPOTIFY_PREVIOUS_LAYOUT = `
  <div class="Root">
    <div class="Root__top-container">
      <div id="global-nav-bar"></div>
      <div class="Root__nav-bar">
        <div class="main-yourLibraryX-libraryContainer">
          <div class="main-yourLibraryX-headerContent"><button></button></div>
          <div class="main-yourLibraryX-libraryRootlist"></div>
        </div>
      </div>
      <div class="Root__main-view">
        <div class="main-view-container">
          <div data-overlayscrollbars="host">
            <div data-overlayscrollbars-viewport="scrollbarHidden overflowXHidden overflowYScroll">
              <div class="main-view-container__scroll-node-child">
                <div class="main-entityHeader-backgroundColor"></div>
                <section>
                  <div class="main-trackList-trackListHeader">
                    <div id="oldHeaderRow" role="row"><div role="columnheader"></div></div>
                  </div>
                  <div id="oldTrackRow" role="row" class="main-trackList-trackListRow">
                    <div role="presentation"><div role="gridcell"></div></div>
                  </div>
                  <div class="playlist-playlist-actionBarBackground-background"></div>
                  <div class="playlist-playlist-playlistContent"></div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="Root__right-sidebar"><aside class="NowPlayingView"></aside></div>
      <div class="Root__now-playing-bar">
        <aside class="main-nowPlayingBar-container" data-testid="now-playing-bar">
          <div class="main-nowPlayingBar-nowPlayingBar">
            <div class="main-nowPlayingBar-center">
              <div class="player-controls"></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
`;

const DUAL_PLAYBAR_SELECTOR = ':is([data-testid="now-playing-bar"], .Root__now-playing-bar)';
const DUAL_CONTROLS_SELECTOR = ':is([data-testid="player-controls"], .player-controls)';
const DUAL_SIDEBAR_SELECTOR = ':is(#Desktop_LeftSidebar_Id, .Root__nav-bar)';

describe('Previous Spotify version contract', () => {
  beforeEach(() => {
    document.body.innerHTML = SPOTIFY_PREVIOUS_LAYOUT;
  });

  it('resolves PageRoot on the unhashed layout too', () => {
    const root = document.querySelector(PageViewSelectors.PageRoot);
    expect(root).not.toBeNull();
    expect(root?.closest('.Root__main-view')).not.toBeNull();
  });

  it('keeps the dual playbar and controls selectors composable', () => {
    const bar = document.querySelector(DUAL_PLAYBAR_SELECTOR);
    expect(bar?.classList.contains('Root__now-playing-bar')).toBe(true);
    expect(bar?.querySelector(DUAL_CONTROLS_SELECTOR)?.classList.contains('player-controls')).toBe(
      true,
    );
    // The wait predicate composes the two constants — the `:is()` wrappers must
    // keep that string a valid selector.
    expect(
      document.querySelector(`${DUAL_PLAYBAR_SELECTOR} ${DUAL_CONTROLS_SELECTOR}`),
    ).not.toBeNull();
  });

  it('resolves the dual sidebar selector to the nav column', () => {
    const nav = document.querySelector(DUAL_SIDEBAR_SELECTOR);
    expect(nav?.classList.contains('Root__nav-bar')).toBe(true);
  });

  it('gates the structural row hover off the legacy rows', () => {
    // The legacy class re-arms the old hover selector and must exclude the row
    // from the structural one, or the frost would stack twice on old builds.
    const structural =
      "#main-view [role='row']:not(.main-trackList-trackListRow):not(:has([role='columnheader']))";
    expect(document.querySelectorAll(structural).length).toBe(0);
    expect(document.getElementById('oldTrackRow')?.matches('.main-trackList-trackListRow')).toBe(
      true,
    );
  });

  it('leaves every aliased selector something to match', () => {
    for (const alias of [
      '.Root__now-playing-bar',
      '.Root__main-view',
      '.Root__nav-bar',
      '.Root__right-sidebar',
      '.main-trackList-trackListRow',
      '.main-trackList-trackListHeader',
      '.main-entityHeader-backgroundColor',
      '.playlist-playlist-actionBarBackground-background',
      '.playlist-playlist-playlistContent',
      '.player-controls',
      '.main-yourLibraryX-headerContent',
      '.main-yourLibraryX-libraryContainer',
    ]) {
      expect(
        document.querySelector(alias),
        `${alias} must exist on the previous layout`,
      ).not.toBeNull();
    }
  });
});
