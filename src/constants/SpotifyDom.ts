/**
 * SpotifyDomContract — the single owner of this extension's knowledge of
 * Spotify's DOM.
 *
 * Most surfaces below answer to more than one spelling, because Spotify has
 * shipped three generations of this layout and Spicetify's `css-map.json` only
 * restores the semantic `Root__*` names on the builds it happens to cover. A
 * surface whose spelling has never changed stays a single-entry list:
 *
 *   1. `Root__*`            — pre-1.3.3. Restored by Spicetify when covered.
 *   2. `data-testid` / ids  — emitted by Spotify itself, so always present.
 *   3. structural           — `role`, `data-overlayscrollbars-*`. The only
 *                             hook left when 1.3.3 hashes a class with no
 *                             css-map entry.
 *
 * Callers name the surface and take one of four forms. Choosing the wrong form
 * is the whole hazard, so the choice is stated here rather than at 300 call
 * sites:
 *
 *   - `anySurface()`   → `:is(a, b)` (`a` alone when the surface has one
 *     spelling). For `querySelector` / `matches` / `closest`; matching is
 *     identical to the comma list.
 *   - `allSurface()`   → `a, b`. The comma-list form. No caller can use it to
 *     *write* a stylesheet — CSS is bundled as text and never sees this module —
 *     so it exists to pin `:is()`/comma-list equivalence in the contract test,
 *     and to state the form a hand-written stylesheet rule must spell.
 *   - `primarySurface()` → the newest spelling alone, for the cases that need
 *     exactly one (composing a descendant, keying a map).
 *   - `legacySurface()` → the oldest spelling alone, for a caller that falls
 *     back to the pre-1.3.3 node as its own lookup step.
 *
 * Reading `SPOTIFY_SURFACES[name][i]` directly is not a fourth form: the alias
 * order is this module's private invariant, and `SPOTIFY_SURFACES` is exported
 * only so the contract tests can walk every surface.
 *
 * **Never use `anySurface()` in a stylesheet.** `:is()` takes the specificity of
 * its most specific argument, so `:is(#Desktop_LeftSidebar_Id, .Root__nav-bar)`
 * scores (1,0,0) for *both* arms and silently promotes the legacy
 * `.Root__nav-bar` arm from (0,1,0) — changing the cascade on exactly the older
 * builds the alias exists to serve. The comma list keeps each arm's own
 * specificity. Tests pin both forms.
 *
 * The alias lists are ordered newest-generation-first; `primarySurface()` and
 * the stylesheet ordering both depend on that.
 */

/**
 * The selector spellings one surface answers to, newest generation first.
 * An entry may be a compound selector (`aside.NowPlayingView`) — the list holds
 * complete selectors, not bare names.
 */
type SurfaceAliases = readonly [string, ...string[]];

/**
 * Spotify surfaces this extension depends on, each with every spelling it
 * answers to. Only surfaces that are aliased or referenced from more than one
 * file live here: a literal used once, in one form, in one place earns no
 * indirection (`'.playback-bar'`, `'header.main-topBar-container'`).
 */
const SURFACES = {
  /** The app frame's root element — the host the app canvas is appended to. */
  appFrameHost: ['.Root', '.Root__top-container'],

  /** The navigation column, including the library. */
  sidebar: ['#Desktop_LeftSidebar_Id', '.Root__nav-bar'],

  /** The bottom playbar's container. */
  playbar: ['[data-testid="now-playing-bar"]', '.Root__now-playing-bar'],

  /**
   * The playbar's transport-controls wrapper — the element the lyrics overlay
   * is positioned over and hidden against.
   */
  playerControls: ['[data-testid="player-controls"]', '.player-controls'],

  /**
   * The playbar's centre column, the overlay's positioning parent. CSS-only
   * (no TS caller); kept for the stylesheets' hover-reveal rules.
   */
  playbarCenter: ['.main-nowPlayingBar-center', '.now-playing-bar__center'],

  /**
   * The Now Playing View panel. Unlike the layout classes this one is *not*
   * aliased — `aside.NowPlayingView` is emitted by Spotify itself and resolves
   * on every generation. The legacy `.Root__right-sidebar` is the panel's
   * parent region, a different element, so it is its own surface below.
   */
  nowPlayingPanel: ['aside.NowPlayingView'],

  /** The right-hand region that outlives the panel; absent on 1.3.3. */
  nowPlayingRegion: ['.Root__right-sidebar'],

  /**
   * A Now Playing View content section. 1.3.3 hashes
   * `.main-nowPlayingView-section` with no css-map entry, so the live form is
   * reached structurally: any direct child of the open-panel div that is not
   * the cover-art block. Inferred from a single DOM dump, so it is pinned by
   * tests/spotifyDomContract.test.ts.
   */
  nowPlayingSection: [
    "aside.NowPlayingView:has([data-testid='NPV_Panel_OpenDiv'], canvas) [data-testid='NPV_Panel_OpenDiv'] > div:not(:has([data-testid='cover-drop-target']))",
    '.Root__right-sidebar:has(.main-nowPlayingView-section, canvas) .main-nowPlayingView-section',
  ],

  /** The main view's root — the height chain the open lyrics page depends on. */
  mainView: ['#main-view', '.Root__main-view', '.main-content-view'],

  /** The main view's scroll viewport. */
  mainViewContainer: ['.main-view-container'],

  /** The scroll viewport node inside the main view container. */
  mainViewScrollViewport: ['.main-view-container div[data-overlayscrollbars-viewport]'],

  /** The hidden content the open lyrics page replaces. */
  mainViewScrollChild: [
    '.main-view-container__scroll-node-child',
    '.main-view-container__scroll-node-child-spacer',
  ],

  /** The search field in the global nav bar. */
  globalNav: ['#global-nav-bar'],

  /** A track-list data row. */
  trackRow: [
    '[data-testid="tracklist-row"]',
    '.main-trackList-trackListRow',
    '.main-trackList-row',
  ],

  /** A track-list row reached structurally, excluding the column-header row. */
  trackRowStructural: [
    "#main-view [role='row']:not(.main-trackList-trackListRow):not(:has([role='columnheader']))",
  ],

  /** The track-list column-header row's wrapper. */
  trackHeader: [
    "#main-view [role='grid'] > div:has([role='columnheader'])",
    '.main-trackList-trackListHeader',
  ],

  /** The linked title cell that carries Spotify's hover-tooltip trigger. */
  trackTitleTrigger: ['.main-trackList-rowTitle.standalone-ellipsis-one-line'],

  /** The playlist header's base-colour layer. */
  playlistHeaderFill: [
    "[data-testid='entity-header'] > div:first-child",
    '.main-entityHeader-backgroundColor',
  ],

  /**
   * A playlist page's content wrapper, which carries the opaque base-colour
   * layer and its gradient scrim. 1.3.3 hashes it, so the live form is the
   * section child that is not the entity header; the legacy
   * `.playlist-playlist-playlistContent` still matches on older builds and is
   * the arm that keeps the transparency rule working there.
   */
  playlistContent: [
    "[data-testid='playlist-page'] > div:not([data-testid='entity-header']):not(:has([data-testid='entity-header']))",
    '.playlist-playlist-playlistContent',
  ],

  /** A left-sidebar library item's name cell. */
  libraryCell: [
    '.main-yourLibraryX-libraryCard',
    '.main-yourLibraryX-libraryItem',
    '[data-testid="side-bar-library-card"]',
    '[data-testid="your-library-item"]',
  ],

  /** The library header's own buttons — renamed in 1.3.3, so both names stand. */
  libraryHeaderButton: ['.main-yourLibraryX-header', '.main-yourLibraryX-headerContent'],
} as const;

/**
 * Compile-time guard that every surface is a non-empty alias tuple. `satisfies`
 * would state this directly, but the bundler ships esbuild 0.14 (2022), which
 * predates the operator and fails to parse it — so the check is expressed as a
 * conditional type instead. It emits nothing at runtime; `tsc --noEmit` is what
 * enforces it. A surface written as `[]` makes `SurfaceAliasesHold` resolve to
 * `never`, which the assignment below rejects.
 */
type SurfaceAliasesHold = typeof SURFACES extends Record<string, SurfaceAliases> ? true : never;
const surfaceAliasesHold: SurfaceAliasesHold = true;
void surfaceAliasesHold;

export type SpotifySurface = keyof typeof SURFACES;

/** Every surface's alias list, for the contract tests that walk them all. */
export const SPOTIFY_SURFACES = SURFACES;

/** The newest spelling of a surface, alone. */
export function primarySurface(surface: SpotifySurface): string {
  return SURFACES[surface][0];
}

/**
 * The oldest spelling of a surface, alone — the pre-1.3.3 name Spicetify's
 * css-map restores. For callers that must look the legacy node up as its own
 * step rather than as one arm of a list (`resolveAppBgHost` falls back to it
 * only when the primary spelling is absent).
 *
 * Takes the *last* alias rather than a fixed index, so adding a generation to
 * a surface does not silently repoint this at the new one.
 */
export function legacySurface(surface: SpotifySurface): string {
  return SURFACES[surface][SURFACES[surface].length - 1];
}

/**
 * A generation-agnostic selector for `querySelector` / `matches` / `closest`.
 * Safe to compose: `` `${anySurface('playbar')} ${anySurface('playerControls')}` ``
 * stays a valid selector.
 *
 * A single-alias surface returns the bare selector — `:is(x)` would add a
 * specificity layer for nothing.
 */
export function anySurface(surface: SpotifySurface): string {
  const aliases = SURFACES[surface];
  if (aliases.length === 1) return aliases[0];
  return `:is(${aliases.join(', ')})`;
}

/**
 * The comma-separated form for stylesheets, which must keep each arm's own
 * specificity. See the module header for why `anySurface()` cannot be used here.
 */
export function allSurface(surface: SpotifySurface): string {
  return SURFACES[surface].join(', ');
}

/**
 * Distribute a descendant chain across every generation of each surface, and
 * join the results as a comma list:
 *
 *   surfaceChain('sidebar', 'libraryHeaderButton', 'button')
 *     → '#Desktop_LeftSidebar_Id .main-yourLibraryX-header button,
 *        #Desktop_LeftSidebar_Id .main-yourLibraryX-headerContent button,
 *        .Root__nav-bar .main-yourLibraryX-header button,
 *        .Root__nav-bar .main-yourLibraryX-headerContent button'
 *
 * A comma list cannot distribute on its own — `allSurface('sidebar') allSurface(…)`
 * would produce one selector whose comma arms re-associate — so the cross-product
 * has to be spelled out. Parts are joined with a descendant combinator; each is
 * either a surface name or a literal selector fragment.
 *
 * The parameter is `string`, not `SpotifySurface | string`: that union collapses
 * to `string` because `SpotifySurface` is a subtype of it, so it would document a
 * check the compiler does not perform. A mistyped surface name is therefore not
 * caught here — it falls through to the literal branch and emits a dead selector,
 * which resolves to nothing rather than throwing. Every call site passes a
 * literal or a real name, and the contract test covers both shapes; a stricter
 * signature needs the surface names and the fragments as separate arguments.
 */
export function surfaceChain(...parts: readonly string[]): string {
  let chains: string[] = [''];
  for (const part of parts) {
    // SAFETY: SURFACES is `as const`, so its keys are a closed literal union
    // that disallows an arbitrary string index. hasOwnProperty has just proved
    // the key exists, so widening the key type to `string` cannot miss. The
    // check is deliberately not `in`: `in` walks the prototype chain, so a
    // fragment named after any Object member ('toString', 'constructor')
    // resolves to that function and `.map` on it throws.
    const aliases = Object.prototype.hasOwnProperty.call(SURFACES, part)
      ? (SURFACES as Record<string, SurfaceAliases>)[part]
      : [part];
    chains = chains.flatMap((prefix) => aliases.map((alias) => `${prefix} ${alias}`.trim()));
  }
  return chains.join(', ');
}
