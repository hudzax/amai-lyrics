import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPOTIFY_SURFACES, primarySurface, type SpotifySurface } from '../src/constants/SpotifyDom';

/**
 * The stylesheets half of the SpotifyDomContract.
 *
 * The TypeScript half is covered by tests/spotifyDomContract.test.ts, which
 * resolves every surface against transcribed DOM fixtures. That suite cannot see
 * the CSS: the stylesheets are bundled as text and injected as one `<style>`, so
 * a selector there is never evaluated by a test and a Spotify rename in CSS is
 * discovered by a user instead of by CI.
 *
 * That is exactly how the last three theme fixes shipped. 11408a7 ("the lyrics
 * page rendered blank and most surfaces lost their styling") and 633c2e5 ("the
 * root is back on both DOM generations so the page keeps its height") were both
 * repairs to CSS selectors that no test could have caught. This suite is the
 * guard for that class of regression.
 *
 * Expectations are declared per file rather than derived, because the
 * asymmetry is deliberate: Glassmorphism.css addresses rows through BOTH a
 * structural arm (`#main-view [role='row']:not(...)`) and the legacy class
 * (`.main-trackList-trackListRow`), so it deliberately carries no
 * `.Root__main-view`. A blanket "every alias must appear" rule would fail on
 * correct code. Each entry below states what that file is expected to carry.
 */

const root = process.cwd();

/**
 * Read a stylesheet with its comments stripped.
 *
 * This matters: these files document their selectors in comments, so a plain
 * `css.includes(selector)` check is satisfied by a comment that merely *names*
 * the selector after the rule itself was deleted. Replaying 633c2e5 (the
 * height-chain fix) against a comment-inclusive check passed even with the
 * `#main-view` rule removed, because a comment nearby still said `#main-view`.
 * Assertions must see only what the browser would.
 */
const read = (path: string): string =>
  readFileSync(join(root, path), 'utf8')
    // A comment becomes a space, not nothing: deleting it outright would fuse
    // the tokens on either side (`.a/* x */.b` → `.a.b`) and let a stripped
    // rule masquerade as a compound one.
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Stylesheets wrap long selectors across lines, so a descendant combinator
    // is a newline plus indentation in the file and a single space in the
    // contract module. Collapse every whitespace run — which is what CSS itself
    // does for combinators — or a multi-line rule is unmatchable and reads as
    // deleted. This is what let the structural row arm go unpinned.
    .replace(/\s+/g, ' ');

/**
 * CSS convention here is single-quoted attribute values
 * (`[data-testid='player-controls']`) while the contract module uses double
 * quotes, matching the TypeScript call sites it was extracted from. Compare on
 * a normalised form so the same selector spelled in either quoting style
 * matches. Whitespace collapses to match `read()`.
 */
const normalise = (selector: string): string =>
  selector.replace(/"/g, "'").replace(/\s+/g, ' ').trim();

interface FileExpectation {
  /** Spellings that must appear in this file, in any quoting style. */
  required: string[];
  /** Why this file is expected to carry them — usually the commit that broke. */
  why: string;
}

const EXPECTATIONS: Record<string, FileExpectation> = {
  'src/css/default.css': {
    why: 'the Page-Not-Visible height chain (633c2e5) plus the Now Playing View tint',
    required: [
      // The height chain lost its root selectors once and the lyrics page
      // rendered collapsed; all three generations must stay listed.
      ...SPOTIFY_SURFACES.mainView,
      ...SPOTIFY_SURFACES.mainViewContainer,
      ...SPOTIFY_SURFACES.mainViewScrollViewport,
      ...SPOTIFY_SURFACES.mainViewScrollChild,
      ...SPOTIFY_SURFACES.nowPlayingPanel,
      ...SPOTIFY_SURFACES.nowPlayingRegion,
      ...SPOTIFY_SURFACES.nowPlayingSection,
      ...SPOTIFY_SURFACES.trackRow,
      ...SPOTIFY_SURFACES.trackTitleTrigger,
    ],
  },

  'src/css/Glassmorphism.css': {
    why: 'the app frame, nav column and Now Playing View materials',
    required: [
      ...SPOTIFY_SURFACES.sidebar,
      ...SPOTIFY_SURFACES.nowPlayingPanel,
      ...SPOTIFY_SURFACES.nowPlayingRegion,
      ...SPOTIFY_SURFACES.nowPlayingSection,
      ...SPOTIFY_SURFACES.globalNav,
      // Deliberately only the structural arm and only the legacy class: this
      // file pairs `#main-view [role='row']:not(.main-trackList-trackListRow)`
      // with `.main-trackList-trackListRow` so the veil cannot stack twice on
      // older builds. Neither `.Root__main-view` nor the other two row
      // spellings belong here.
      primarySurface('mainView'),
      primarySurface('trackRow'),
      // The structural arm is the load-bearing half on 1.3.3, where the
      // trackList classes are hashed and `.main-trackList-trackListRow` no
      // longer matches. It was left unpinned once already; it is the exact
      // shape 11408a7 broke.
      ...SPOTIFY_SURFACES.trackRowStructural,
    ],
  },

  'src/css/PlaybarLyrics.css': {
    why: 'the playbar overlay hides the native controls and reveals them on hover',
    required: [...SPOTIFY_SURFACES.playerControls, ...SPOTIFY_SURFACES.playbarCenter],
  },

  'src/css/Lyrics/main.css': {
    why: 'the lyrics page surfaces and the row hover veil',
    required: [
      ...SPOTIFY_SURFACES.nowPlayingPanel,
      ...SPOTIFY_SURFACES.nowPlayingRegion,
      ...SPOTIFY_SURFACES.nowPlayingSection,
      // Same deliberate single-arm pairing as Glassmorphism.css, and the same
      // structural arm carrying the load on 1.3.3.
      primarySurface('mainView'),
      primarySurface('trackRow'),
      ...SPOTIFY_SURFACES.trackRowStructural,
    ],
  },

  'src/css/DynamicBG/sweet-dynamic-bg.css': {
    why: 'the app-frame transparency chain and the canvas hosts',
    required: [
      ...SPOTIFY_SURFACES.appFrameHost,
      ...SPOTIFY_SURFACES.sidebar,
      ...SPOTIFY_SURFACES.playbar,
      ...SPOTIFY_SURFACES.nowPlayingPanel,
      ...SPOTIFY_SURFACES.nowPlayingRegion,
      ...SPOTIFY_SURFACES.mainView,
      ...SPOTIFY_SURFACES.globalNav,
      ...SPOTIFY_SURFACES.trackHeader,
      ...SPOTIFY_SURFACES.playlistHeaderFill,
      ...SPOTIFY_SURFACES.playlistContent,
      ...SPOTIFY_SURFACES.libraryHeaderButton,
      ...SPOTIFY_SURFACES.mainViewScrollViewport,
      ...SPOTIFY_SURFACES.mainViewScrollChild,
      ...SPOTIFY_SURFACES.mainViewContainer,
    ],
  },
};

describe('stylesheets keep the SpotifyDomContract aliases', () => {
  for (const [file, { required, why }] of Object.entries(EXPECTATIONS)) {
    describe(file, () => {
      it(`carries every alias it is expected to — ${why}`, () => {
        // Read inside the test, not at collection time: a renamed path should
        // fail this assertion with its own message rather than aborting the
        // whole file before any test runs.
        const css = normalise(read(file));
        const missing = required.filter((alias) => !css.includes(normalise(alias)));
        expect(missing, `${file} dropped these selector spellings`).toEqual([]);
      });
    });
  }

  it('never keys a live rule on a hashed Spotify class', () => {
    // sweet-dynamic-bg.css states the rule itself: "never by hashed class name,
    // those rotate every Spotify build". The one exception is a pre-1.3.3
    // content wrapper that is still load-bearing on older builds, so it stays —
    // but it is the only one, and it must stay documented as legacy.
    const css = read('src/css/DynamicBG/sweet-dynamic-bg.css');
    const HASHED = /\.[A-Za-z0-9]{16,}(?=[\s,{:>]|$)/g;
    const hashes = new Set(css.match(HASHED) ?? []);
    expect([...hashes]).toEqual(['.AAdBM1nhG73supMfnYX7']);
  });

  it('keeps the legacy hash documented as legacy', () => {
    // Raw text on purpose: this assertion is about the comment.
    const css = readFileSync(join(root, 'src/css/DynamicBG/sweet-dynamic-bg.css'), 'utf8');
    // Locate the RULE, not the comment that names it — the comment above the
    // rule mentions the same selector, so a loose pattern finds the wrong spot.
    // `search` returns -1 when absent, so the assertion needs no non-null
    // assertion to read the offset.
    const index = css.search(/(^|\n)[^\n{]*\.AAdBM1nhG73supMfnYX7[^\n{]*\{/);
    expect(index, 'the legacy hash rule must still exist').toBeGreaterThan(-1);
    // The comment immediately above it must say what it is and that it is not
    // a pattern to copy — otherwise the next reader deletes or duplicates it.
    const preceding = css.slice(Math.max(0, index - 700), index);
    expect(preceding).toMatch(/legacy/i);
    expect(preceding).toMatch(/pre-1\.3\.3|older builds/i);
    expect(preceding).toMatch(/do not copy|not copy/i);
  });
});

describe('the contract module and the stylesheets agree on quoting', () => {
  it('spells every alias so a normalised CSS lookup can find it', () => {
    // Index the record from the typed name list, matching
    // spotifyDomContract.test.ts.
    // SAFETY: `Object.keys` widens to `string[]`, so the key type is narrowed
    // back to `SpotifySurface` by hand — there is no `Object.entries` shape
    // that keeps the keys and the alias tuples both narrowed at once.
    const surfaceNames = Object.keys(SPOTIFY_SURFACES) as SpotifySurface[];
    for (const surface of surfaceNames) {
      for (const alias of SPOTIFY_SURFACES[surface]) {
        // A double quote inside a selector is the only thing normalise() has to
        // rewrite; anything else (a trailing comma, stray whitespace) would
        // make the alias unmatchable in a stylesheet.
        expect(alias, `${surface} alias must not carry a trailing comma`).not.toMatch(/,\s*$/);
        expect(alias, `${surface} alias must be trimmed`).toBe(alias.trim());
      }
    }
  });
});
