import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import lifecycle from '../src/utils/lifecycle';
import { installNativeHoverTooltipSuppressor } from '../src/utils/nativeHoverTooltipSuppressor';
import { installAmaiHoverTooltips } from '../src/utils/amaiHoverTooltips';

/**
 * The stutter fix (nativeHoverTooltipSuppressor) silences Spotify's hover
 * tooltips on the rows, bottom playbar and left sidebar; this module puts the
 * labels back as Amai's own bubbles — plain Spicetify.Tippy with the
 * amai-lyrics theme and text that is complete at creation time, so no rAF
 * measuring loop can reappear.
 *
 * These tests pin the contract:
 *   - creation only after the pointer DWELLS on one trigger (200ms; crossing
 *     into another trigger resets the wait, leaving cancels it),
 *   - content = aria-label for row, playbar AND sidebar buttons, direct <a>
 *     texts for link wrappers (title included: its anchor's parent cell is
 *     the trigger, in rows and on the now-playing bar alike), cell text for
 *     sidebar gridcell cards (leaf-joined, so JSX siblings don't glue),
 *   - at most one instance exists; leave / scroll / disposeAll destroy it,
 *   - flagged re-dispatched clones from the suppressor never drive show/hide,
 *     and the suppressor's stopPropagation does not starve this listener
 *     (same-node window-capture listeners still fire),
 *   - global surfaces are covered through React handler signals and accessible
 *     labels; ordinary elements without either signal remain untouched, and a
 *     missing Spicetify.Tippy never throws (it loads asynchronously in
 *     production).
 *
 * Both installers run in every test, mirroring main()'s wiring, so the
 * interplay between suppression and tooltips is exercised end to end.
 */

interface FakeTippyInstance {
  show: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  onHide: ReturnType<typeof vi.fn>;
}

const el = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

function fire(type: 'mouseover' | 'mouseout', target: Element, related: Element | null): void {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, relatedTarget: related }),
  );
}

function fireFocus(type: 'focusin' | 'focusout', target: Element, related: Element | null): void {
  target.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget: related }));
}

// Assignment target for Spicetify.Tippy: the ambient namespace const is
// read-only to the type system, but the runtime object (from tests/setup.ts)
// is a plain mutable stub.
const g = globalThis as unknown as { Spicetify: { Tippy?: unknown } };

let created: Array<{ element: Element; props: Record<string, unknown> }>;
let instances: FakeTippyInstance[];
let tippyFake: (element: Element, props: Record<string, unknown>) => FakeTippyInstance;
let originalTippy: unknown;

beforeEach(() => {
  vi.useFakeTimers();
  // Mirrors production: title cell (anchor → parent-cell trigger), artist
  // span, album div, the `+`/`...` action buttons with aria-labels, a
  // page-level button OUTSIDE any row, plus a left-sidebar fixture (a
  // role=gridcell card whose name/meta spans are JSX-adjacent — no
  // whitespace — an icon button with aria-label, a text chip without one)
  // and a main-view grid row outside the sidebar.
  document.body.innerHTML = `
    <span id="outside"></span>
    <div role="row" class="main-trackList-trackListRow" id="row1">
      <div id="titleCell" class="main-trackList-rowTitleCell"><a id="titleLink" data-testid="internal-track-link" href="#">Song Name</a></div>
      <div id="artistCell">
        <span id="artistTrigger" class="main-trackList-rowSubHeader">
          <a id="artistLink1" href="#">Artist A</a>
          <a id="artistLink2" href="#">Artist B</a>
        </span>
      </div>
      <div id="albumCell">
        <div id="albumTrigger" class="main-trackList-rowMainSubtitle"><a id="albumLink" href="#">Album Name</a></div>
      </div>
      <div id="labelledCell">
        <span id="labelledTrigger" class="main-trackList-rowArtist"><a id="labelledLink" aria-label="Named Artist"></a></span>
      </div>
      <div id="unlinkedTitleCell">
        <div id="unlinkedTitle" class="main-trackList-rowTitle standalone-ellipsis-one-line" title="🎧">🎧</div>
      </div>
      <div id="actionBar">
        <button id="moreBtn" data-testid="more-button" type="button" aria-label="More options for Song Name">
          <span id="moreIcon">…</span>
        </button>
        <button id="addBtn" data-testid="add-button" type="button" aria-label="Add to playlist">
          <span id="addIcon">+</span>
        </button>
      </div>
    </div>
    <div id="pageBar">
      <button id="pageBtn" type="button" aria-label="Play">Play</button>
    </div>
    <div id="globalSurface">
      <button id="globalButton" type="button">Global action</button>
    </div>
    <div class="Root__now-playing-bar" id="npBar">
      <div id="npControls">
        <button id="playBtn" data-testid="control-button-playpause" type="button" aria-label="Play"><span id="playIcon">▶</span></button>
        <button id="muteBtn" data-testid="volume-bar-toggle-mute-button" type="button" aria-label="Mute"><span id="muteIcon">🔇</span></button>
        <button id="extBtn" type="button" aria-label="Queue"><span id="extIcon">≡</span></button>
      </div>
      <div id="npTitleCell"><a id="npLink" href="#">Now Playing Song</a></div>
    </div>
    <div class="Root__nav-bar" id="navBar">
      <div role="row" id="sbRow">
        <div role="gridcell" id="sbCell">
          <div id="sbCard"><span id="sbCardName">Liked Songs</span><span id="sbCardMeta">Playlist · Someone</span></div>
        </div>
        <div role="gridcell" id="sbDateCell"><span id="sbDateText">Updated today</span></div>
      </div>
      <div role="row" id="sbSymbolRow">
        <div role="gridcell" id="sbSymbolCell"><span id="sbSymbolText">🎧</span></div>
      </div>
      <div id="sbHeader">
        <button id="sbCreateBtn" data-testid="create-playlist" type="button" aria-label="Create playlist">
          <span id="sbCreateIcon">+</span>
        </button>
        <button id="sbTextTooltipBtn" class="main-yourLibraryX-iconOnly" type="button">Playlists</button>
        <button id="sbChipBtn" type="button">Playlists</button>
      </div>
    </div>
    <div role="row" id="recRow">
      <div role="gridcell" id="recCell"><span id="recText">Recent card</span></div>
    </div>
  `;
  Object.defineProperty(el('globalButton'), '__reactProps$test', {
    value: {
      onMouseEnter: () => {},
      onMouseLeave: () => {},
      onFocus: () => {},
      onBlur: () => {},
    },
  });
  created = [];
  instances = [];
  tippyFake = (element, props) => {
    const onHide = vi.fn(() => {
      const callback = props.onHide;
      if (typeof callback === 'function') (callback as () => void)();
    });
    const instance: FakeTippyInstance = {
      show: vi.fn(),
      destroy: vi.fn(),
      setContent: vi.fn(),
      onHide,
    };
    created.push({ element, props });
    instances.push(instance);
    return instance;
  };
  originalTippy = g.Spicetify.Tippy;
  g.Spicetify.Tippy = tippyFake;

  installNativeHoverTooltipSuppressor();
  installAmaiHoverTooltips();
});

afterEach(() => {
  lifecycle.disposeAll();
  g.Spicetify.Tippy = originalTippy;
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('native Amai hover tooltips', () => {
  it('shows an Amai-themed tooltip on a row action button after the delay', () => {
    // This entry is BLOCKED by the suppressor (the clone is dispatched nested,
    // on the action bar), so the tooltip here also proves the same-node
    // property the design depends on: stopPropagation on window does not stop
    // sibling window-capture listeners — the original still reaches sync().
    fire('mouseover', el('moreIcon'), el('outside'));
    expect(created).toHaveLength(0); // nothing yet: the pointer may still sweep on

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('moreBtn'));
    expect(created[0].props).toMatchObject({
      content: 'More options for Song Name',
      theme: 'amai-lyrics',
      animation: 'amai',
      arrow: false,
      placement: 'top',
    });
    expect(instances[0].show).toHaveBeenCalledTimes(1);
  });

  it('uses the link texts for the artist wrapper', () => {
    fire('mouseover', el('artistLink1'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('artistTrigger'));
    expect(created[0].props).toMatchObject({ content: 'Artist A, Artist B' });
  });

  it('reconstructs accessible labels from direct-anchor attributes', () => {
    fire('mouseover', el('labelledLink'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('labelledLink'));
    expect(created[0].props).toMatchObject({ content: 'Named Artist' });
  });

  it('restores the title tooltip through the anchor’s parent cell', () => {
    // Production hovers land on the <a> (the inner div is pointer-events:
    // none), and the walk finds its parent — the div with a direct <a> child.
    fire('mouseover', el('titleLink'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('titleCell'));
    expect(created[0].props).toMatchObject({ content: 'Song Name' });
  });

  it('replaces an unlinked title trigger with its symbol label', () => {
    fire('mouseover', el('unlinkedTitle'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('unlinkedTitle'));
    expect(created[0].props).toMatchObject({ content: '🎧' });
  });

  it('cancels the tooltip when the pointer leaves before the delay elapses', () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(50);
    fire('mouseout', el('moreBtn'), el('outside')); // exit while still pending

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(0);
    expect(instances).toHaveLength(0);
  });

  it('cancels a pending tooltip when the control is activated', () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(50);
    el('moreBtn').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(0);
  });

  it('updates a visible tooltip when its accessible label changes', async () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(instances).toHaveLength(1);

    el('moreBtn').setAttribute('aria-label', 'Updated options');
    await Promise.resolve();

    expect(instances[0].setContent).toHaveBeenCalledWith('Updated options');
    expect(created).toHaveLength(1);
  });

  it('destroys the visible tooltip when the pointer leaves, then recreates on re-entry', () => {
    fire('mouseover', el('addIcon'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(instances).toHaveLength(1);

    fire('mouseout', el('addBtn'), el('outside'));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);

    // Re-entry starts a fresh create/show cycle — module state reset cleanly.
    fire('mouseover', el('addBtn'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(created).toHaveLength(2);
    expect(created[1].element).toBe(el('addBtn'));
    expect(instances[1].show).toHaveBeenCalledTimes(1);
  });

  it('switching triggers cancels the pending one — only the settled trigger shows', () => {
    fire('mouseover', el('titleLink'), el('outside')); // pending for title @ t=0
    vi.advanceTimersByTime(100);
    // Title → artist is an ENTRY via mouseout in production (production-real).
    fire('mouseout', el('titleLink'), el('artistLink1'));

    vi.advanceTimersByTime(200); // t=300: only the artist timer (armed @ 100) fires

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('artistTrigger'));
    expect(created[0].props).toMatchObject({ content: 'Artist A, Artist B' });
  });

  it('ignores the suppressor’s flagged re-dispatched clones', () => {
    fire('mouseover', el('artistLink1'), el('outside')); // pending for artist
    // A clone aimed OUTSIDE would clear the pending timer if the flag guard
    // were missing (its start side resolves to no trigger).
    const clone = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      relatedTarget: el('outside'),
    });
    Object.defineProperty(clone, '__amaiRedispatchedHover', { value: true });
    el('outside').dispatchEvent(clone);

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1); // the real hover still showed
    expect(created[0].element).toBe(el('artistTrigger'));
  });

  it('replaces a page-level native tooltip outside the original surfaces', () => {
    fire('mouseover', el('pageBtn'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('pageBtn'));
    expect(created[0].props).toMatchObject({ content: 'Play' });
  });

  it('replaces a native focus tooltip outside the original surfaces', () => {
    fireFocus('focusin', el('globalButton'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('globalButton'));
    expect(created[0].props).toMatchObject({ content: 'Global action' });

    fireFocus('focusout', el('globalButton'), el('outside'));
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('shows an Amai tooltip on a bottom-playbar control button (aria-label content)', () => {
    fire('mouseover', el('playIcon'), el('outside'));
    expect(created).toHaveLength(0); // dwell required here too

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('playBtn'));
    expect(created[0].props).toMatchObject({
      content: 'Play',
      theme: 'amai-lyrics',
      animation: 'amai',
    });
    expect(instances[0].show).toHaveBeenCalledTimes(1);
  });

  it('replaces the bottom-playbar mute tooltip as well', () => {
    fire('mouseover', el('muteIcon'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('muteBtn'));
    expect(created[0].props).toMatchObject({ content: 'Mute', placement: 'top' });
  });

  it('restores the now-playing-bar title text through the anchor’s parent cell', () => {
    fire('mouseover', el('npLink'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('npTitleCell'));
    expect(created[0].props).toMatchObject({ content: 'Now Playing Song' });
  });

  it('leaves a matched playbar control with an existing Tippy untouched', () => {
    // A third-party/extension instance must receive the original event; the
    // suppressor must not block it and then merely skip our replacement.
    const ownInstance = {};
    (el('playBtn') as unknown as { _tippy?: unknown })._tippy = ownInstance;
    const hoverSpy = vi.fn();
    el('playBtn').addEventListener('mouseover', hoverSpy);

    fire('mouseover', el('playIcon'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(hoverSpy).toHaveBeenCalledTimes(1);
    expect(created).toHaveLength(0);
    expect((el('playBtn') as unknown as { _tippy?: unknown })._tippy).toBe(ownInstance);
  });

  it('scroll destroys the visible tooltip instead of stranding it', () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(instances).toHaveLength(1);

    document.dispatchEvent(new Event('scroll'));

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys a visible tooltip when its trigger is removed', async () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(instances).toHaveLength(1);

    el('moreBtn').remove();
    await Promise.resolve();

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });

  it('clears the shown cache when Tippy hides itself', () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(instances).toHaveLength(1);

    instances[0].onHide();
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(2);
  });

  it('skips gracefully while Spicetify.Tippy is still loading, then works on the same hover', () => {
    g.Spicetify.Tippy = undefined;
    fire('mouseover', el('moreIcon'), el('outside'));
    expect(() => vi.advanceTimersByTime(200)).not.toThrow();
    expect(created).toHaveLength(0); // the dwell completed before Tippy loaded

    g.Spicetify.Tippy = tippyFake;
    vi.advanceTimersByTime(250);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('moreBtn'));
  });

  it('shows an Amai tooltip on a sidebar library card (cell text, leaf-joined)', () => {
    // Sidebar cards contain no anchors (click navigation), so the innermost
    // trigger is the role="gridcell" itself; its label is the cell text.
    fire('mouseover', el('sbCardName'), el('outside'));
    expect(created).toHaveLength(0); // dwell required here too

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('sbCell'));
    // Leaf-joined with spaces: adjacent JSX siblings would read as
    // "Liked SongsPlaylist · Someone" if we took textContent whole.
    expect(created[0].props).toMatchObject({
      content: 'Liked Songs Playlist · Someone',
      placement: 'right',
    });
    expect(instances[0].show).toHaveBeenCalledTimes(1);
  });

  it('keeps an emoji-only sidebar label as valid tooltip content', () => {
    fire('mouseover', el('sbSymbolText'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('sbSymbolCell'));
    expect(created[0].props).toMatchObject({ content: '🎧', placement: 'right' });
  });

  it('shows an Amai tooltip on a sidebar icon button (aria-label content)', () => {
    fire('mouseover', el('sbCreateIcon'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('sbCreateBtn'));
    expect(created[0].props).toMatchObject({
      content: 'Create playlist',
      theme: 'amai-lyrics',
      animation: 'amai',
      placement: 'right',
    });
  });

  it('does not intercept an unmarked sidebar text chip', () => {
    // It is not one of Spotify's known tooltip-bearing controls, so its
    // native hover behavior remains untouched and no replacement is created.
    fire('mouseover', el('sbChipBtn'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(0);
    expect(instances).toHaveLength(0);
  });

  it('uses visible text when a known tooltip button has no aria-label', () => {
    fire('mouseover', el('sbTextTooltipBtn'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].element).toBe(el('sbTextTooltipBtn'));
    expect(created[0].props).toMatchObject({ content: 'Playlists' });
  });

  it('uses aria-labelledby when a button has no direct label', () => {
    const label = document.createElement('span');
    label.id = 'sharedTooltipLabel';
    label.textContent = 'Shared label';
    document.body.appendChild(label);
    const button = el('sbCreateBtn');
    button.removeAttribute('aria-label');
    button.setAttribute('aria-labelledby', label.id);

    fire('mouseover', el('sbCreateIcon'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(1);
    expect(created[0].props).toMatchObject({ content: 'Shared label' });
  });

  it('never resolves a trigger for gridcells outside the sidebar', () => {
    fire('mouseover', el('recText'), el('outside'));
    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(0);
    expect(instances).toHaveLength(0);
  });

  it('disposeAll cancels a pending tooltip', () => {
    fire('mouseover', el('moreIcon'), el('outside')); // pending, not yet shown
    lifecycle.disposeAll();

    vi.advanceTimersByTime(200);

    expect(created).toHaveLength(0);
  });

  it('disposeAll destroys the visible tooltip', () => {
    fire('mouseover', el('moreIcon'), el('outside'));
    vi.advanceTimersByTime(200);
    expect(instances).toHaveLength(1);

    lifecycle.disposeAll();

    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  });
});
