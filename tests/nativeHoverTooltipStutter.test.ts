import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Hovering a playlist/album track TITLE used to stutter the whole app.
 *
 * Spotify renders the title as `<a data-testid="internal-track-link"><div
 * class="main-trackList-rowTitle standalone-ellipsis-one-line">…</div></a>`.
 * The INNER div — not the anchor — carries the React onMouseEnter that mounts
 * the hover context tooltip: tippy + #context-menu go into document.body, a
 * forced whole-document layout (offsetHeight) runs, and popper keeps calling
 * getBoundingClientRect() every frame while the 1s-delayed content is still
 * empty. That per-frame forced layout is the jank.
 *
 * `default.css` fixes it by making exactly that inner div transparent to the
 * pointer, so the hover retargets to the parent <a>/row and no onMouseEnter
 * ever fires on the title trigger. These tests keep the rule scoped: if it
 * widens to the anchor or the row, real links / row surfaces start ignoring
 * the pointer; if it narrows or disappears, the stutter comes back.
 */
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const css = read('src/css/default.css');

/** The active-state rule block that disables pointer events on linked titles. */
function titleTriggerRule(): string | undefined {
  return css.match(/html\.amai-native-hover-tooltip-fix[\s\S]*?\{[^}]*\}/)?.[0];
}

describe('native hover-tooltip title fix (default.css)', () => {
  it('exists and targets the exact linked title trigger div', () => {
    const rule = titleTriggerRule();
    expect(rule).toBeDefined();
    // Both classes are required: together they identify ONLY the inner title
    // div, never the wrapping anchor or the row itself.
    expect(rule).toMatch(/main-trackList-rowTitle\.standalone-ellipsis-one-line/);
    expect(rule).toMatch(/pointer-events:\s*none/);
    expect(rule).toMatch(/\ba\s*>\s*\.main-trackList-rowTitle/);
  });

  it('never disables pointer events on the anchor or the row', () => {
    // A bare `.main-trackList-rowTitle` rule would also hit the wrapping <a>
    // (same class, one level up) and kill navigation; a row-level rule would
    // kill right-click / drag / the hover highlight. Neither is allowed.
    expect(css).not.toMatch(/^\.main-trackList-rowTitle\s*\{[^}]*pointer-events:\s*none/s);
    expect(css).not.toMatch(/^\.main-trackList-trackListRow[^{]*\{[^}]*pointer-events:\s*none/s);
  });

  it('stays scoped to known track rows and the active extension lifecycle', () => {
    // The rule must be reachable from a track-list ancestor, not float free as
    // a global `* { pointer-events: none }` style kill switch. The root class
    // also prevents an injected stylesheet from surviving extension teardown.
    expect(css).toMatch(
      /html\.amai-native-hover-tooltip-fix[\s\S]*\.main-trackList-trackListRow[\s\S]*a[\s\S]*\.main-trackList-rowTitle\.standalone-ellipsis-one-line/,
    );
    expect(css).toMatch(
      /html\.amai-native-hover-tooltip-fix[\s\S]*\[data-testid=['"]tracklist-row['"][\s\S]*a[\s\S]*\.main-trackList-rowTitle\.standalone-ellipsis-one-line/,
    );
    expect(css).not.toMatch(/^[^{}]*\*\s*\{[^}]*pointer-events:\s*none/m);
  });

  it('does not touch the artist/subtitle cells (their trigger wraps links)', () => {
    // Subtitle/artist cells use the same tooltip pattern, but there the
    // trigger div is an ANCESTOR of the artist <a> links — pointer-events:none
    // on it would inherit down and break those links. Title only, by design.
    expect(css).not.toContain('main-trackList-rowSubHeader');
    expect(css).not.toContain('main-trackList-rowMainSubtitle');
  });
});
