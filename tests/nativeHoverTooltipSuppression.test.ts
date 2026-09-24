import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import lifecycle from '../src/utils/lifecycle';
import { installHoverTooltips } from '../src/utils/hoverTooltip';

/**
 * The HoverTooltip module suppresses native labels while preserving every
 * other hover/focus path. This suite exercises its event-policy seam through
 * the same install operation used by main().
 *
 * Hovering an ARTIST/ALBUM cell, a row action button (`+`
 * add-to-playlist/save, `...` more options, heart, hide), any bottom-playbar
 * control with a reconstructible native label, or a left-sidebar library
 * name/icon trigger used to stutter the whole app.
 *
 * Spotify wraps those cells' `<a>` links in a plain SPAN/DIV — and wraps each
 * action button with the tooltip cloned ONTO the `<button>` itself — carrying
 * the cloned React onMouseEnter for the hover tooltip (bundle module 12866).
 * On hover it mounts tippy + #context-menu and runs a rAF loop calling
 * getBoundingClientRect() every frame while the delayed content is still
 * empty — per-frame forced layout is the jank. Unlike the title cell, CSS
 * cannot opt out here: the trigger ANCESTORS the links (and disabling pointer
 * events on buttons would kill them), and React derives enter/leave from the
 * fiber path of mouseover/mouseout, not hit-testing.
 *
 * The fix therefore stops those native events on window (capture) before
 * React's root listener and re-dispatches a flagged clone retargeted to the
 * trigger's parent, which provably keeps every other enter/leave identical
 * while dropping only the trigger's subtree. These tests pin that contract:
 *   - blocked originals never reach the trigger or anything below it,
 *   - clones carry the retargeted side and the original other side,
 *   - global surfaces are covered through React handler signals and accessible
 *     labels; ordinary elements without either signal pass through byte-for-byte,
 *   - row buttons stay clickable (their menus open on click, never blocked),
 *   - only native hover/focus tooltip paths are intercepted — clicks, native
 *     mouseenter, and unrelated events stay untouched, and disposeAll
 *     restores normal delivery.
 */

interface Seen {
  type: string;
  target: EventTarget | null;
  related: EventTarget | null;
  flagged: boolean;
}

const el = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

const isFlagged = (event: Event): boolean =>
  (event as { __amaiRedispatchedHover?: boolean }).__amaiRedispatchedHover === true;

let seen: Seen[];
const recordDocument = (event: Event): void => {
  seen.push({
    type: event.type,
    target: event.target,
    related: (event as MouseEvent).relatedTarget,
    flagged: isFlagged(event),
  });
};
const DOC_TYPES = ['mouseover', 'mouseout'];

function fire(type: 'mouseover' | 'mouseout', target: Element, related: Element | null): void {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, relatedTarget: related }),
  );
}

beforeEach(() => {
  // A realistic row: title cell (direct <a> child), artist cell (SPAN trigger
  // wrapping the links), album cell (DIV trigger wrapping its link). Plus a
  // portaled-menu-like div OUTSIDE any row, a row whose link is nested deeper
  // than the trigger shape (both must never be intercepted), a left-sidebar
  // fixture (role=gridcell cards + an icon button), and a main-view grid row
  // whose gridcell sits OUTSIDE the sidebar.
  document.body.innerHTML = `
    <span id="outside"></span>
    <div role="row" class="main-trackList-trackListRow" id="row1">
      <div id="titleCell" class="main-trackList-rowTitleCell"><a id="titleLink" data-testid="internal-track-link" href="#">Song</a></div>
      <div id="artistCell">
        <span id="artistTrigger" class="main-trackList-rowSubHeader">
          <a id="artistLink1" href="#">Artist A</a>
          <a id="artistLink2" href="#">Artist B</a>
        </span>
      </div>
      <div id="albumCell">
        <div id="albumTrigger" class="main-trackList-rowMainSubtitle"><a id="albumLink" href="#">Album</a></div>
      </div>
      <div id="unlinkedTitleCell">
        <div id="unlinkedTitle" class="main-trackList-rowTitle standalone-ellipsis-one-line" title="🎧">🎧</div>
      </div>
      <div id="plainArtistCell">
        <span id="plainArtistTrigger"><a id="plainArtistLink" href="#">Plain Artist</a></span>
      </div>
      <div id="actionBar">
        <button id="addBtn" data-testid="add-button" type="button" aria-label="Add to playlist"><span id="addIcon">+</span></button>
        <button id="moreBtn" data-testid="more-button" type="button" aria-label="More options"><span id="moreIcon">…</span></button>
        <button id="rowPlayBtn" class="main-trackList-rowImagePlayButton" type="button" aria-label="Play"><span id="rowPlayIcon">▶</span></button>
      </div>
    </div>
    <div id="menuLike"><a id="menuLink" href="#">Menu item</a></div>
    <div id="pageBar"><button id="pageBtn" type="button">Play</button></div>
    <div role="row" id="row2">
      <div id="plainCell">
        <span id="deepTrigger"><em><a id="deepLink" href="#">Deep</a></em></span>
      </div>
    </div>
    <div class="Root__now-playing-bar" id="npBar">
      <div id="npControls">
        <button id="playBtn" data-testid="control-button-playpause" type="button" aria-label="Play"><span id="playIcon">▶</span></button>
        <button id="muteBtn" data-testid="volume-bar-toggle-mute-button" type="button"><span id="muteIcon">Mute</span></button>
        <div id="volSlider"><span id="volSliderKnob"></span></div>
      </div>
      <div id="npTitleCell"><a id="npLink" href="#">Now Playing Song</a></div>
    </div>
    <div id="mainView"><button id="viewBtn" type="button">Main view</button></div>
    <div id="globalSurface">
      <button id="globalButton" type="button">Global action</button>
      <div id="globalWrapper"><a id="globalLink" href="#">Global link</a></div>
    </div>
    <div class="Root__nav-bar" id="navBar">
      <div role="row" id="sbRow">
        <div role="gridcell" id="sbCell">
          <div id="sbCard"><span id="sbCardTitle">Liked Songs</span></div>
        </div>
        <div role="gridcell" id="sbDateCell"><span id="sbDateText">Updated today</span></div>
      </div>
      <div role="gridcell" id="sbLooseCell" data-testid="side-bar-library-card">
        <div id="sbLooseInner"><span id="sbLooseText">Some Album</span></div>
      </div>
      <div id="sbHeader">
        <button id="sbCreateBtn" data-testid="create-playlist" type="button" aria-label="Create playlist"><span id="sbCreateIcon">+</span></button>
        <input id="sbSearchInput" />
      </div>
      <div id="navLink"><a id="navLinkAnchor" href="/">Home</a></div>
    </div>
    <div role="row" id="recRow">
      <div role="gridcell" id="recCell"><span id="recText">Recent card</span></div>
    </div>
    <div role="row" id="calendarRow">
      <button id="calendarDay" data-testid="calendar-day" type="button">1</button>
    </div>
    <div role="row" class="main-trackList-trackListRow" id="genericTrackRow">
      <button id="genericTrackButton" data-testid="generic-track-action" type="button" aria-label="Generic action">Go</button>
      <div id="unmarkedLinkTrigger"><a id="unmarkedTrackLink" data-testid="generic-track-action" href="#">Unmarked action</a></div>
    </div>
    <div role="row" class="main-trackList-row" id="legacyTrackRow">
      <div id="legacyArtistCell"><span id="legacyArtistTrigger"><a id="legacyArtistLink" href="#">Legacy Artist</a></span></div>
    </div>
  `;
  seen = [];
  for (const id of ['globalButton', 'globalWrapper']) {
    Object.defineProperty(el(id), '__reactProps$test', {
      value: {
        onMouseEnter: () => {},
        onMouseLeave: () => {},
        onFocus: () => {},
        onBlur: () => {},
      },
    });
  }
  for (const type of DOC_TYPES) document.addEventListener(type, recordDocument);
  installHoverTooltips();
});

afterEach(() => {
  for (const type of DOC_TYPES) document.removeEventListener(type, recordDocument);
  lifecycle.disposeAll();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('native hover tooltip suppression', () => {
  it('gates the CSS title rule to the live extension lifecycle', () => {
    expect(document.documentElement.classList.contains('amai-native-hover-tooltip-fix')).toBe(true);

    lifecycle.disposeAll();

    expect(document.documentElement.classList.contains('amai-native-hover-tooltip-fix')).toBe(
      false,
    );
  });

  it('registers one idempotent global installation', () => {
    // The beforeEach installation already owns the window listeners. A second
    // call must not stack another retargeting protocol.
    installHoverTooltips();
    installHoverTooltips();

    fire('mouseover', el('artistLink1'), el('outside'));
    expect(seen).toHaveLength(1);
    expect(seen[0].flagged).toBe(true);
  });

  it('returns an idempotent disposer for the global installation', () => {
    const destroy = installHoverTooltips();
    destroy();

    fire('mouseover', el('artistLink1'), el('outside'));
    expect(seen).toHaveLength(1);
    expect(seen[0].flagged).toBe(false);
    expect(() => destroy()).not.toThrow();
  });

  it('blocks the artist trigger enter arriving via mouseout (entry from a sibling cell)', () => {
    // Moving title -> artist: React would fire the trigger's onMouseEnter from
    // the mouseout's enter-half (relatedTarget side). The original must never
    // reach the DOM below window; the clone must move only that side.
    const artistTriggerSpies = vi.fn();
    for (const type of DOC_TYPES) el('artistTrigger').addEventListener(type, artistTriggerSpies);
    const linkSpies = vi.fn();
    for (const type of DOC_TYPES) el('artistLink1').addEventListener(type, linkSpies);
    const titleSpies = vi.fn();
    el('titleLink').addEventListener('mouseout', titleSpies);

    fire('mouseout', el('titleLink'), el('artistLink1'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseout',
      target: el('titleLink'), // leave-half target untouched
      related: el('artistCell'), // enter-half moved above the trigger
      flagged: true,
    });
    // The trigger subtree saw NOTHING: original stopped at window, clone
    // started on titleLink (a sibling cell).
    expect(artistTriggerSpies).not.toHaveBeenCalled();
    expect(linkSpies).not.toHaveBeenCalled();
    // The title link received exactly one event: the clone (original blocked),
    // proving stopPropagation happens before React's root would see it.
    expect(titleSpies).toHaveBeenCalledTimes(1);
    expect(isFlagged(titleSpies.mock.calls[0][0] as Event)).toBe(true);
  });

  it('blocks the trigger enter arriving via mouseover with an outside relatedTarget', () => {
    const triggerSpies = vi.fn();
    for (const type of DOC_TYPES) el('artistTrigger').addEventListener(type, triggerSpies);
    for (const type of DOC_TYPES) el('artistLink1').addEventListener(type, triggerSpies);

    fire('mouseover', el('artistLink1'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('artistCell'), // target moved above the trigger
      related: el('outside'), // original relatedTarget preserved
      flagged: true,
    });
    expect(triggerSpies).not.toHaveBeenCalled();
  });

  it('blocks window re-entry (mouseover with a null relatedTarget)', () => {
    fire('mouseover', el('artistLink2'), null);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('artistCell'),
      related: null,
      flagged: true,
    });
  });

  it('lets a plain exit from the trigger pass through untouched', () => {
    // Leaving the trigger only fires its onMouseLeave (a no-op: the tooltip
    // never opened), so the event flows normally with nothing retargeted.
    const linkSpies = vi.fn();
    el('artistLink1').addEventListener('mouseout', linkSpies);

    fire('mouseout', el('artistLink1'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseout',
      target: el('artistLink1'),
      related: el('outside'),
      flagged: false,
    });
    expect(linkSpies).toHaveBeenCalledTimes(1);
    expect(isFlagged(linkSpies.mock.calls[0][0] as Event)).toBe(false);
  });

  it('passes movement between links inside the same trigger through unchanged', () => {
    // Both sides are inside one trigger. Retargeting this event would make
    // React fire the wrapper's onMouseLeave even though the pointer never left
    // it, so the original event must remain untouched.
    const triggerSpies = vi.fn();
    for (const type of DOC_TYPES) el('artistTrigger').addEventListener(type, triggerSpies);

    fire('mouseout', el('artistLink1'), el('artistLink2'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseout',
      target: el('artistLink1'),
      related: el('artistLink2'),
      flagged: false,
    });
    expect(triggerSpies).toHaveBeenCalledTimes(1);
  });

  it('covers the album cell (DIV trigger) with the same shape', () => {
    fire('mouseover', el('albumLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('albumCell'), // DIV trigger's parent
      related: el('outside'),
      flagged: true,
    });
    expect(el('albumTrigger').children).toHaveLength(1); // stays clickable: no CSS trickery
  });

  it('covers the known unlinked title trigger shape', () => {
    fire('mouseover', el('unlinkedTitle'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('unlinkedTitleCell'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('covers an unmarked direct-anchor wrapper in a confirmed track row', () => {
    fire('mouseover', el('plainArtistLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('plainArtistCell'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('recognizes the legacy main-trackList-row class', () => {
    fire('mouseover', el('legacyArtistLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('legacyArtistCell'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('covers any direct-anchor wrapper in a row, not just artist cells', () => {
    // The title cell is structurally the same trigger shape (row cell with a
    // direct <a> child), so the JS fix redundantly covers the title path too —
    // belt and suspenders under the existing default.css pointer-events rule.
    fire('mouseover', el('titleLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('row1'), // titleCell's parent: retarget skipped the whole trigger
      related: el('outside'),
      flagged: true,
    });
  });

  it('never intercepts link lists outside a row (menus, popovers)', () => {
    // menuLike has the trigger shape (DIV with a direct <a>) but sits outside
    // [role="row"] — portaled context menus must keep every event.
    const menuSpies = vi.fn();
    el('menuLink').addEventListener('mouseover', menuSpies);

    fire('mouseover', el('menuLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('menuLink'),
      related: el('outside'),
      flagged: false,
    });
    expect(menuSpies).toHaveBeenCalledTimes(1);
    expect(isFlagged(menuSpies.mock.calls[0][0] as Event)).toBe(false);
  });

  it('never intercepts in-row links that lack the trigger shape', () => {
    // deepTrigger's children are <em>, never a direct <a>: no match up to the
    // row, so the event passes byte-for-byte.
    fire('mouseover', el('deepLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('deepLink'),
      related: el('outside'),
      flagged: false,
    });
  });

  it('passes events whose start side is not a trigger (the cell div itself)', () => {
    // Starting at artistCell: its direct child is the SPAN, not an <a>, so the
    // walk finds nothing — no blocking, no clone, no self-dispatch.
    fire('mouseover', el('artistCell'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0].flagged).toBe(false);
    expect(seen[0].target).toBe(el('artistCell'));
  });

  it('leaves native mouseenter and clicks untouched', () => {
    const enterSpies = vi.fn();
    const clickSpies = vi.fn();
    document.addEventListener('mouseenter', enterSpies, true);
    document.addEventListener('click', clickSpies);

    el('artistLink1').dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: false, relatedTarget: el('outside') }),
    );
    el('artistLink1').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(enterSpies).toHaveBeenCalledTimes(1);
    expect(clickSpies).toHaveBeenCalledTimes(1);
    // No mouseover/mouseout was fabricated for either.
    expect(seen).toHaveLength(0);
  });

  it('lets an already-flagged clone through untouched (no re-retarget loop)', () => {
    const clone = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      relatedTarget: el('outside'),
    });
    Object.defineProperty(clone, '__amaiRedispatchedHover', { value: true });
    el('artistLink1').dispatchEvent(clone);

    // The handler bailed on the flag: target is still the raw link, and no
    // second (retargeted) event was produced.
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('artistLink1'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('does not treat a generic ARIA-row button as a track tooltip trigger', () => {
    const calendarSpies = vi.fn();
    el('calendarDay').addEventListener('mouseover', calendarSpies);

    fire('mouseover', el('calendarDay'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0].target).toBe(el('calendarDay'));
    expect(seen[0].flagged).toBe(false);
    expect(calendarSpies).toHaveBeenCalledTimes(1);
  });

  it('replaces an accessible track-row button even without a stable selector', () => {
    fire('mouseover', el('genericTrackButton'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('genericTrackRow'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('does not treat a functional direct-anchor control as a track trigger', () => {
    fire('mouseover', el('unmarkedTrackLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0].target).toBe(el('unmarkedTrackLink'));
    expect(seen[0].flagged).toBe(false);
  });

  it('covers every reconstructible bottom-playbar button, including mute', () => {
    const muteSpies = vi.fn();
    el('muteIcon').addEventListener('mouseover', muteSpies);

    fire('mouseover', el('muteIcon'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('npControls'),
      related: el('outside'),
      flagged: true,
    });
    expect(muteSpies).not.toHaveBeenCalled();
  });

  it('replaces functional play-on-hover row controls too', () => {
    fire('mouseover', el('rowPlayIcon'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('actionBar'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('leaves ordinary sidebar navigation links untouched', () => {
    fire('mouseover', el('navLinkAnchor'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0].target).toBe(el('navLinkAnchor'));
    expect(seen[0].flagged).toBe(false);
  });

  it('covers the row action buttons (BUTTON is a trigger shape)', () => {
    // `...` / `+` / heart / hide: the 56285 tooltip clones onMouseEnter onto
    // the <button> itself, so hovering the icon span must be blocked and the
    // clone must start one level above the button (on the action bar).
    const buttonSpies = vi.fn();
    for (const type of DOC_TYPES) el('moreBtn').addEventListener(type, buttonSpies);

    fire('mouseover', el('moreIcon'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('actionBar'), // button's parent: the whole button subtree is dropped
      related: el('outside'),
      flagged: true,
    });
    expect(buttonSpies).not.toHaveBeenCalled();
  });

  it('blocks a row button enter arriving via mouseout', () => {
    const buttonSpies = vi.fn();
    for (const type of DOC_TYPES) el('addBtn').addEventListener(type, buttonSpies);

    fire('mouseout', el('outside'), el('addIcon'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseout',
      target: el('outside'), // leave-half untouched
      related: el('actionBar'), // enter-half moved above the button
      flagged: true,
    });
    expect(buttonSpies).not.toHaveBeenCalled();
  });

  it('retargets movement between two row buttons', () => {
    // Both sides are triggers: each button's leave/enter is dropped, the
    // action bar's own enter/leave keeps firing unchanged above the clone.
    fire('mouseout', el('moreBtn'), el('addBtn'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseout',
      target: el('moreBtn'),
      related: el('actionBar'),
      flagged: true,
    });
  });

  it('keeps clicks on row buttons working (menus open on click)', () => {
    const clickSpies = vi.fn();
    el('moreBtn').addEventListener('click', clickSpies);

    el('moreBtn').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(clickSpies).toHaveBeenCalledTimes(1);
    expect(seen).toHaveLength(0); // no hover event was fabricated
  });

  it('detects native tooltip handlers anywhere in the app', () => {
    fire('mouseover', el('globalButton'), el('outside'));
    fire('mouseover', el('globalLink'), el('outside'));

    expect(seen).toHaveLength(2);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('globalSurface'),
      related: el('outside'),
      flagged: true,
    });
    expect(seen[1]).toEqual({
      type: 'mouseover',
      target: el('globalSurface'),
      related: el('outside'),
      flagged: true,
    });
  });

  it('retargets native focus tooltip handlers too', () => {
    const buttonFocus = vi.fn();
    const surfaceFocus = vi.fn();
    el('globalButton').addEventListener('focusin', buttonFocus);
    el('globalSurface').addEventListener('focusin', surfaceFocus);

    el('globalButton').dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, relatedTarget: el('outside') }),
    );

    expect(buttonFocus).not.toHaveBeenCalled();
    expect(surfaceFocus).toHaveBeenCalledTimes(1);
  });

  it('leaves ordinary unlabeled page buttons untouched', () => {
    // Without a native handler signal or a reconstructible label, an ordinary
    // page control keeps its original hover behavior.
    const pageSpies = vi.fn();
    el('pageBtn').addEventListener('mouseover', pageSpies);

    fire('mouseover', el('pageBtn'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('pageBtn'),
      related: el('outside'),
      flagged: false,
    });
    expect(pageSpies).toHaveBeenCalledTimes(1);
  });

  it('covers bottom-playbar control buttons (same 56285 chain, scoped by .Root__now-playing-bar)', () => {
    // Play/pause, seek ±15, shuffle, repeat, queue, devices, mute: the tooltip
    // clones onMouseEnter onto the <button>, so hovering its icon must be
    // blocked and the clone must start one level above the button.
    const buttonSpies = vi.fn();
    for (const type of DOC_TYPES) el('playBtn').addEventListener(type, buttonSpies);

    fire('mouseover', el('playIcon'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('npControls'), // button's parent: the whole button subtree is dropped
      related: el('outside'),
      flagged: true,
    });
    expect(buttonSpies).not.toHaveBeenCalled();
  });

  it('covers the now-playing-bar title/artist links through their parent cell', () => {
    // Same trigger shape as a row title cell: DIV with a direct <a> child,
    // bounded by .Root__now-playing-bar instead of a row.
    fire('mouseover', el('npLink'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('npBar'), // npTitleCell's parent
      related: el('outside'),
      flagged: true,
    });
  });

  it('passes playbar non-trigger surfaces and out-of-scope UI through untouched', () => {
    // The volume slider container holds no <a>/<button> child (it is not a
    // trigger shape — its own hover handlers must keep firing), and a main-view
    // button sits outside both managed surfaces.
    fire('mouseover', el('volSliderKnob'), el('outside'));
    fire('mouseover', el('viewBtn'), el('outside'));

    expect(seen).toHaveLength(2);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('volSliderKnob'),
      related: el('outside'),
      flagged: false,
    });
    expect(seen[1]).toEqual({
      type: 'mouseover',
      target: el('viewBtn'),
      related: el('outside'),
      flagged: false,
    });
  });

  it('covers the sidebar library card cell (role="gridcell" clone target, sidebar-only shape)', () => {
    // Sidebar cards clone their name tooltip onto the cell itself (module
    // 15620 lz.T) and navigate via click — no <a> exists for the wrapper
    // shape, so the gridcell role carries detection, gated on .Root__nav-bar.
    const cellSpies = vi.fn();
    for (const type of DOC_TYPES) el('sbCell').addEventListener(type, cellSpies);
    const titleSpies = vi.fn();
    for (const type of DOC_TYPES) el('sbCardTitle').addEventListener(type, titleSpies);

    fire('mouseover', el('sbCardTitle'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('sbRow'), // cell's parent (here the sidebar row): cell subtree dropped
      related: el('outside'),
      flagged: true,
    });
    expect(cellSpies).not.toHaveBeenCalled();
    expect(titleSpies).not.toHaveBeenCalled();
  });

  it('retargets a sidebar cell sitting directly on the surface to .Root__nav-bar', () => {
    const cellSpies = vi.fn();
    for (const type of DOC_TYPES) el('sbLooseCell').addEventListener(type, cellSpies);

    fire('mouseover', el('sbLooseText'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('navBar'), // no row in between: the sidebar surface is the boundary
      related: el('outside'),
      flagged: true,
    });
    expect(cellSpies).not.toHaveBeenCalled();
  });

  it('covers sidebar icon buttons (create/sort/view — same 56285 chain)', () => {
    const buttonSpies = vi.fn();
    for (const type of DOC_TYPES) el('sbCreateBtn').addEventListener(type, buttonSpies);

    fire('mouseover', el('sbCreateIcon'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('sbHeader'), // button's parent: the whole button subtree is dropped
      related: el('outside'),
      flagged: true,
    });
    expect(buttonSpies).not.toHaveBeenCalled();
  });

  it('does not treat a non-first sidebar gridcell as a library name card', () => {
    fire('mouseover', el('sbDateText'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0].target).toBe(el('sbDateText'));
    expect(seen[0].flagged).toBe(false);
  });

  it('passes non-sidebar gridcells and sidebar non-trigger surfaces through untouched', () => {
    // The gridcell shape is gated on .Root__nav-bar: the recents route's
    // cards (role="row" > gridcell in the main view) and calendar dialogs
    // keep byte-for-byte delivery, as does a plain sidebar input.
    const recSpies = vi.fn();
    el('recCell').addEventListener('mouseover', recSpies);
    const inputSpies = vi.fn();
    el('sbSearchInput').addEventListener('mouseover', inputSpies);

    fire('mouseover', el('recText'), el('outside'));
    fire('mouseover', el('sbSearchInput'), el('outside'));

    expect(seen).toHaveLength(2);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('recText'),
      related: el('outside'),
      flagged: false,
    });
    expect(seen[1]).toEqual({
      type: 'mouseover',
      target: el('sbSearchInput'),
      related: el('outside'),
      flagged: false,
    });
    expect(recSpies).toHaveBeenCalledTimes(1);
    expect(inputSpies).toHaveBeenCalledTimes(1);
  });

  it('disposeAll removes the listeners and restores normal event flow', () => {
    lifecycle.disposeAll();

    fire('mouseover', el('artistLink1'), el('outside'));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'mouseover',
      target: el('artistLink1'), // no retarget: the event policy is gone
      related: el('outside'),
      flagged: false,
    });
  });
});
