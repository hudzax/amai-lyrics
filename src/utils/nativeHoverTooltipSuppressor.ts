import lifecycle from './lifecycle';
import { getHoverTooltipContent } from './hoverTooltipContent';

/**
 * Suppresses Spotify's native hover and focus tooltip handlers anywhere in
 * the document, then the Amai replacement restores the same labels with a
 * lightweight Tippy instance. The primary signal is React's cloned
 * enter/leave/focus/blur props, so dynamically mounted pages, dialogs,
 * portals, and virtualized views do not need a page-specific selector list;
 * accessible-label/title and known Spotify structural shapes provide a
 * fallback when private props are unavailable.
 *
 * Root cause (Spotify bundle, module 12866's `y` clone): the tooltip wrapper
 * clones React `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` onto the
 * element it wraps — a `<span>` around the artist `<a>` links, a `<div>` around
 * the album link, and the `<button>` itself for every row action button
 * (bundle modules 48894 `...`, 39774 `+`, 42102 heart/save, 22858 hide all
 * wrap the `56285` label tooltip around `11174.H` ButtonTertiary, which
 * renders a plain `<button>` — and chunk `4881.js` shows the playbar controls
 * follow the identical chain: play/pause, repeat, seek ±15, shuffle and the
 * mute button each render `56285` `label`/`showDelay` around `11174.H` or an
 * equivalent button carrying `aria-label` + `data-testid="control-button-*"`).
 * The left sidebar is the same module again: `xpui-routes-your-library-x.js`
 * wraps its library items in `el.Z` — the `56285` label tooltip (rich name/
 * type label, `placement:"right"`, `showDelay:0`) — which clones the handlers
 * onto the item's `role="gridcell"` cell (module 15620 `lz.T` renders exactly
 * that role; sidebar list rows render `role="row"` via module 39994).
 * Any `mouseover`/`mouseout` whose React fiber path crosses that element fires
 * its `onMouseEnter`, which mounts tippy + `#context-menu` and starts
 * `updateAfterFirstLayout`: a requestAnimationFrame loop calling
 * `getBoundingClientRect()` every frame until the delayed tooltip content gives
 * the menu a non-zero width. One forced whole-document layout per frame, for up
 * to a second, on every hover — that is the stutter.
 *
 * Why CSS cannot fix it: the trigger is an ancestor of the links.
 * `pointer-events: none` would inherit down and break artist/album navigation,
 * and re-enabling the links would not help either — React computes
 * enter/leave from the fiber path of `mouseover`/`mouseout`, not from
 * hit-testing, so any pointer event crossing the wrapper still reaches its
 * handler no matter what `pointer-events` says on the way in.
 *
 * What this does instead: a window-CAPTURE listener stops the native event
 * before it reaches React's root listener, then re-dispatches a flagged clone
 * whose "inside" side (the `relatedTarget` half of `mouseout`, the target half
 * of `mouseover`) is moved up to the trigger's parent. The trigger's parent is
 * an ancestor of everything inside the trigger, which makes the re-targeted
 * event compute the exact same common ancestor with the outside element:
 *
 *   - the outside element's enter/leave fires unchanged (the mouseout
 *     leave-half keeps its original target and identical common ancestor),
 *   - the trigger's subtree is the only thing dropped from every path, so
 *     the trigger's own onMouseEnter can never fire,
 *   - cell wrappers, rows, and other cells still receive their enter/leave —
 *     no React hover state is orphaned,
 *   - leaving the trigger passes straight through (a trigger's onMouseLeave
 *     may still fire, but it is a no-op: the tooltip never opened).
 *
 * Scope and trade-offs:
 *   - The global capture listeners cover `mouseover`/`mouseout` and
 *     `focusin`/`focusout`; pointer, click, drag, context-menu, and CSS
 *     `:hover` behavior remain untouched. Clicks and keyboard activation still
 *     work even when the native tooltip and a functional hover handler share a
 *     React fiber.
 *   - A control is a candidate when React exposes a native tooltip handler
 *     pair, when it has an accessible label/title that can be reconstructed,
 *     or when it matches a known Spotify structural shape. Elements without
 *     a reconstructible label are left alone rather than receiving a blank
 *     replacement.
 *   - Functional hover state is intentionally not preserved on a trigger that
 *     also owns a native tooltip: the event retarget suppresses the shared
 *     React enter/leave path. This is the only reliable way to replace native
 *     tooltips whose handler is fused with hover behavior.
 *   - Pre-existing third-party/extension Tippy instances are left alone; the
 *     ownership marker ensures our own instances can still be retargeted on
 *     later hovers without clobbering another extension.
 *   - Always on, no settings toggle — same posture as the title CSS fix.
 *
 * Registered through `lifecycle`, so the hot-reload teardown removes it.
 *
 * The labels this quiets come back through `amaiHoverTooltips`, which
 * shows Amai's own themed bubbles on these same triggers — plain tippy with
 * immediate text content, so none of the rAF/measuring machinery above.
 */

/**
 * Non-enumerable flag stamped on clones we re-dispatch, so this same handler
 * (and any other copy of it) lets them pass through untouched instead of
 * re-retargeting in a loop.
 */
const REDISPATCHED_FLAG = '__amaiRedispatchedHover';
const eventChains = new WeakMap<Event, HTMLElement[]>();

export function rememberHoverTooltipChain(event: Event, chain: HTMLElement[]): void {
  eventChains.set(event, chain);
}

export function getRememberedHoverTooltipChain(event: Event): HTMLElement[] | undefined {
  return eventChains.get(event);
}

/** CSS gate for the title-cell pointer-events rule. */
export const NATIVE_HOVER_TOOLTIP_ACTIVE_CLASS = 'amai-native-hover-tooltip-fix';

/** DOM marker used to distinguish our replacement instances from Spotify's. */
export const NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY = '__amaiNativeHoverTooltipOwned';

type TooltipBearingElement = HTMLElement & {
  _tippy?: unknown;
  [key: string]: unknown;
};

/**
 * An existing third-party Tippy must receive its original mouseover. The
 * replacement module marks instances it owns, so only those can be retargeted
 * on later hovers without taking over another extension's bubble.
 */
export function hasUnownedTippy(element: Element): boolean {
  const candidate = element as TooltipBearingElement;
  return (
    Boolean(candidate._tippy) && candidate[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY] !== candidate._tippy
  );
}

const REACT_PROPS_PREFIX = '__reactProps$';
const reactPropsKeys = new WeakMap<Element, string | null>();

type ReactProps = Record<string, unknown>;

function asReactProps(value: unknown): ReactProps | null {
  return value && typeof value === 'object' ? (value as ReactProps) : null;
}

function hasReactTooltipHandlers(props: ReactProps | null): boolean {
  if (!props) return false;
  const hasHandlerPair = (enter: string, leave: string): boolean =>
    typeof props[enter] === 'function' && typeof props[leave] === 'function';
  return (
    hasHandlerPair('onMouseEnter', 'onMouseLeave') ||
    hasHandlerPair('onMouseOver', 'onMouseOut') ||
    hasHandlerPair('onFocus', 'onBlur') ||
    hasHandlerPair('onFocusIn', 'onFocusOut')
  );
}

function getReactTooltipProps(element: Element): ReactProps | null {
  let key: string | null;
  if (reactPropsKeys.has(element)) {
    key = reactPropsKeys.get(element) ?? null;
  } else {
    key =
      Object.getOwnPropertyNames(element).find((name) => name.startsWith(REACT_PROPS_PREFIX)) ??
      null;
    reactPropsKeys.set(element, key);
  }
  if (!key) return null;
  return asReactProps((element as unknown as Record<string, unknown>)[key]);
}

function hasExplicitTooltipLabel(element: Element): boolean {
  if (
    !element.hasAttribute('aria-label') &&
    !element.hasAttribute('aria-labelledby') &&
    !element.hasAttribute('title') &&
    !element.hasAttribute('data-tooltip-content') &&
    !element.hasAttribute('aria-description')
  ) {
    return false;
  }

  if (
    element.hasAttribute('title') ||
    element.hasAttribute('data-tooltip-content') ||
    element.hasAttribute('aria-description')
  ) {
    return true;
  }

  const role = element.getAttribute('role');
  if (
    element.tagName === 'BUTTON' ||
    element.tagName === 'A' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    (role !== null &&
      /^(button|link|menuitem|menuitemcheckbox|menuitemradio|tab|gridcell)$/i.test(role))
  ) {
    return true;
  }

  return element.children.length === 0;
}

function hasNativeTooltipSignal(element: Element): boolean {
  return hasExplicitTooltipLabel(element) || hasReactTooltipHandlers(getReactTooltipProps(element));
}

type RedispatchedHover = Event & { __amaiRedispatchedHover?: boolean };

/**
 * True for the elements Spotify clones its hover/focus handlers onto:
 *   - any element exposing React's native enter/leave or focus/blur handler
 *     pair, regardless of page or surface;
 *   - any element with a reconstructible accessible label/title;
 *   - known Spotify fallback shapes such as track-row action buttons, direct
 *     link wrappers, title triggers, sidebar name cells, and playbar controls.
 * React's private props are the strongest global signal; structural
 * selectors and accessible labels are fallbacks for virtualized/test DOM
 * where those props are not observable.
 */
const TRACK_ROW_SCOPE =
  '.main-trackList-trackListRow, .main-trackList-row, [data-testid="tracklist-row"]';
const PLAYBAR_SCOPE = '.Root__now-playing-bar';
const SIDEBAR_SCOPE = '.Root__nav-bar';

/** Link-shaped controls that are interaction surfaces, not native tooltip cells. */
const FUNCTIONAL_LINK_WRAPPER_SELECTOR = [
  '[role="button"]',
  '[data-testid*="action"]',
  '[data-testid*="control"]',
  '[data-testid*="button"]',
  '.main-trackList-rowMoreButton',
  '.main-trackList-rowHeartButton',
  '.main-trackList-rowHideButton',
  '.main-trackList-rowImagePlayButton',
  '.main-row-playPauseButton',
].join(', ');

/** The title's inner div is also a native trigger when it is not linked. */
const TRACK_TITLE_TRIGGER_SELECTOR = '.main-trackList-rowTitle.standalone-ellipsis-one-line';

/** Known sidebar name/card cells, including cells without a row wrapper. */
const SIDEBAR_LIBRARY_CELL_SELECTOR = [
  '.main-yourLibraryX-libraryCard',
  '.main-yourLibraryX-libraryItem',
  '[data-testid="side-bar-library-card"]',
  '[data-testid="your-library-item"]',
].join(', ');

/** Spotify's known tooltip-bearing track-row buttons. */
const TRACK_TOOLTIP_BUTTON_SELECTOR = [
  '[data-testid="add-button"]',
  '[data-testid="more-button"]',
  '[data-testid="row-heart-button"]',
  '[data-testid="hide-button"]',
  '.main-addButton-button',
  '.main-moreButton-button',
  '.main-trackList-rowMoreButton',
  '.main-trackList-rowHeartButton',
  '.main-trackList-rowHideButton',
  'button[data-encore-id="buttonTertiary"]',
].join(', ');

/** Sidebar controls that Spotify's tooltip HOC renders as tertiary buttons. */
const SIDEBAR_TOOLTIP_BUTTON_SELECTOR = [
  '.main-yourLibraryX-iconOnly',
  '.main-yourLibraryX-collapseButtonWrapper',
  '.main-yourLibraryX-headerContent button',
  '.main-yourLibraryX-filterArea button',
  '.main-yourLibraryX-libraryFilter button',
  'button[data-testid="create-playlist"]',
  'button[data-testid^="your-library-"]',
].join(', ');

function isTrackRow(element: Element): boolean {
  return Boolean(element.closest(TRACK_ROW_SCOPE));
}

function isKnownTooltipButton(
  element: HTMLElement,
  nativeSignal = hasNativeTooltipSignal(element),
): boolean {
  if (hasUnownedTippy(element)) return false;
  if (nativeSignal) return true;
  if (isTrackRow(element)) return element.matches(TRACK_TOOLTIP_BUTTON_SELECTOR);
  if (element.closest(PLAYBAR_SCOPE)) return true;
  if (element.closest(SIDEBAR_SCOPE)) return element.matches(SIDEBAR_TOOLTIP_BUTTON_SELECTOR);
  return false;
}

function isSidebarLibraryCell(element: Element): boolean {
  if (element.getAttribute('role') !== 'gridcell') return false;
  const nav = element.closest(SIDEBAR_SCOPE);
  if (!nav) return false;

  const row = element.closest('[role="row"]');
  if (row && row.closest(SIDEBAR_SCOPE) === nav) {
    if (
      element.matches(SIDEBAR_LIBRARY_CELL_SELECTOR) ||
      element.querySelector(SIDEBAR_LIBRARY_CELL_SELECTOR)
    ) {
      return true;
    }
    const cells = Array.from(row.children).filter(
      (child) => child.getAttribute('role') === 'gridcell',
    );
    // Your-library rows put the tooltip-bearing name cell first. Later cells
    // (dates, menus, metadata) must not acquire a spurious right-side label.
    return cells[0] === element;
  }

  // A few sidebar cards are mounted without a row wrapper. Require a known
  // card/item marker for that shape rather than treating every loose gridcell
  // as a library name trigger.
  if (element.parentElement !== nav) return false;
  return (
    element.matches(SIDEBAR_LIBRARY_CELL_SELECTOR) ||
    Boolean(element.querySelector(SIDEBAR_LIBRARY_CELL_SELECTOR))
  );
}

function hasDirectAnchorChild(element: Element): boolean {
  for (const child of element.children) {
    if (child.tagName === 'A') return true;
  }
  return false;
}

function isHoverTrigger(element: Element): boolean {
  if (hasUnownedTippy(element)) return false;

  // Avoid walking/label-extracting large ordinary containers on every global
  // mouse event. Only compute content after a native signal or a known
  // structural candidate has been found.
  const nativeSignal = hasNativeTooltipSignal(element);
  const isButton = element.tagName === 'BUTTON';
  const isSidebarCell = isSidebarLibraryCell(element);
  const isTextWrapper = element.tagName === 'SPAN' || element.tagName === 'DIV';
  const isTitleTrigger =
    isTextWrapper && element.matches(TRACK_TITLE_TRIGGER_SELECTOR) && isTrackRow(element);
  const hasDirectAnchor = isTextWrapper && hasDirectAnchorChild(element);
  if (!nativeSignal && !isButton && !isSidebarCell && !hasDirectAnchor && !isTitleTrigger) {
    return false;
  }

  const content = getHoverTooltipContent(element as HTMLElement);

  // React's private props are the strongest global signal available from the
  // DOM: Spotify's native tooltip HOC clones enter/leave and focus/blur
  // handlers onto the trigger. This catches controls in pages, dialogs, and
  // virtualized surfaces that have no stable CSS selector.
  if (nativeSignal) return content !== null;

  if (isButton) {
    return isKnownTooltipButton(element as HTMLElement, false) && content !== null;
  }

  if (isSidebarCell) return content !== null;

  // A nav link is often a direct-anchor wrapper too. Only sidebar library
  // cells are handled above; ordinary navigation links without a native
  // tooltip signal retain their handlers.
  if (element.closest(SIDEBAR_SCOPE)) return false;

  if (!isTextWrapper) return false;

  const inTrackRow = isTrackRow(element);
  if (isTitleTrigger) {
    return content !== null;
  }

  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.tagName !== 'A') continue;
    if (hasUnownedTippy(child)) return false;
    if (hasNativeTooltipSignal(child)) return content !== null;
    if (
      inTrackRow &&
      (element.matches(FUNCTIONAL_LINK_WRAPPER_SELECTOR) ||
        child.matches(FUNCTIONAL_LINK_WRAPPER_SELECTOR))
    ) {
      return false;
    }
    if (inTrackRow || element.closest(PLAYBAR_SCOPE)) return content !== null;
  }
  return false;
}

/**
 * Every trigger-shaped element from `start` up to the document body. There is
 * no page/surface allowlist: dynamically mounted controls, dialogs, portals,
 * and virtualized views all use the same event path.
 *
 * Two consumers pick opposite ends of the chain:
 *   - suppression takes the LAST (outermost): nested triggers collapse into a
 *     single retarget, and the retargeted trigger's parent is outside the
 *     chain, which keeps the LCA-preservation proof valid;
 *   - the Amai tooltip replacement (`amaiHoverTooltips`) takes the FIRST
 *     (innermost): the element the pointer/focus is actually over, so its
 *     label describes the right thing.
 */
export function findHoverTooltipTriggerChain(start: EventTarget | null): HTMLElement[] {
  if (!start || (start as Node).nodeType !== 1) return [];
  const element = start as Element;
  const ownerDocument = element.ownerDocument;
  const boundary = ownerDocument.body ?? ownerDocument.documentElement;
  const chain: HTMLElement[] = [];
  let current: Element | null = element;
  while (current && current !== boundary) {
    if (isHoverTrigger(current)) chain.push(current as HTMLElement);
    current = current.parentElement;
  }
  return chain;
}

function containsEventTarget(trigger: HTMLElement, target: EventTarget | null): boolean {
  if (!target || (target as Node).nodeType !== 1) return false;
  const node = target as Node;
  return node === trigger || trigger.contains(node);
}

function findCrossingTrigger(
  start: EventTarget | null,
  other: EventTarget | null,
  knownChain?: HTMLElement[],
): HTMLElement | null {
  const chain = knownChain ?? findHoverTooltipTriggerChain(start);
  if (chain.length === 0) return null;

  const outer = chain[chain.length - 1];
  const crossesNestedTrigger = chain.some((candidate) => !containsEventTarget(candidate, other));
  if (containsEventTarget(outer, other) && !crossesNestedTrigger) return null;

  // When a nested trigger is involved, retarget above the outermost known
  // trigger. Its parent is outside the chain, so the clone cannot re-enter a
  // parent trigger while still removing the nested tooltip enter.
  return outer;
}

function handleHover(event: Event): void {
  // Our own re-dispatched clones: pass through, never re-retarget them.
  if ((event as RedispatchedHover).__amaiRedispatchedHover) return;
  // Registration only ever subscribes to these two types; the guard keeps the
  // entering/leaving split below honest if that ever changes.
  if (event.type !== 'mouseover' && event.type !== 'mouseout') return;

  const mouse = event as MouseEvent;
  const entering = mouse.type === 'mouseover';
  // The half React turns into onMouseEnter: the target on mouseover, the
  // relatedTarget on mouseout. Only retarget when that side actually crosses
  // a trigger boundary; movement within one trigger must remain byte-for-byte.
  const start = entering ? mouse.target : mouse.relatedTarget;
  const other = entering ? mouse.relatedTarget : mouse.target;
  const chain = findHoverTooltipTriggerChain(start);
  rememberHoverTooltipChain(event, chain);
  const trigger = findCrossingTrigger(start, other, chain);
  if (!trigger) return;

  const parent = trigger.parentElement;
  const dispatchTarget = (entering ? parent : mouse.target) as Element | null;
  if (!parent || !dispatchTarget) return;

  // Stop the original before React's root listener can see it, then hand
  // every other listener a clone that no longer crosses the trigger.
  mouse.stopPropagation();

  const clone = new MouseEvent(mouse.type, {
    bubbles: true,
    cancelable: mouse.cancelable,
    // Carry the original's view (the Window in a real browser); null is the
    // spec default and what synthetic events in tests produce. Passing the
    // jsdom `window` literal here would be rejected by its constructor.
    view: mouse.view ?? null,
    detail: mouse.detail,
    screenX: mouse.screenX,
    screenY: mouse.screenY,
    clientX: mouse.clientX,
    clientY: mouse.clientY,
    button: mouse.button,
    buttons: mouse.buttons,
    ctrlKey: mouse.ctrlKey,
    shiftKey: mouse.shiftKey,
    altKey: mouse.altKey,
    metaKey: mouse.metaKey,
    // mouseover keeps its original relatedTarget (only the target side moves);
    // mouseout keeps its original target and moves the enter-side relatedTarget.
    relatedTarget: entering ? mouse.relatedTarget : parent,
  });
  Object.defineProperty(clone, REDISPATCHED_FLAG, { value: true });
  dispatchTarget.dispatchEvent(clone);
}

function handleFocus(event: Event): void {
  if ((event as RedispatchedHover).__amaiRedispatchedHover) return;
  if (event.type !== 'focusin' && event.type !== 'focusout') return;

  const focus = event as FocusEvent;
  const entering = focus.type === 'focusin';
  const start = entering ? focus.target : focus.relatedTarget;
  const other = entering ? focus.relatedTarget : focus.target;
  const chain = findHoverTooltipTriggerChain(start);
  rememberHoverTooltipChain(event, chain);
  const trigger = findCrossingTrigger(start, other, chain);
  if (!trigger) return;

  const parent = trigger.parentElement;
  const dispatchTarget = entering ? parent : focus.target;
  if (!parent || !dispatchTarget) return;

  focus.stopPropagation();
  const clone = new FocusEvent(focus.type, {
    bubbles: true,
    cancelable: focus.cancelable,
    relatedTarget: entering ? focus.relatedTarget : parent,
  });
  Object.defineProperty(clone, REDISPATCHED_FLAG, { value: true });
  dispatchTarget.dispatchEvent(clone);
}

export function installNativeHoverTooltipSuppressor(): void {
  // Capture on window: runs before React's root-container bubble listener, so
  // stopPropagation() here means React never sees the original event. The
  // handler reference is shared by both types — the DOM dedupes a double
  // install of the identical (type, listener, capture) tuple.
  lifecycle.trackWindow('mouseover', handleHover, true);
  lifecycle.trackWindow('mouseout', handleHover, true);
  lifecycle.trackWindow('focusin', handleFocus, true);
  lifecycle.trackWindow('focusout', handleFocus, true);

  // CSS is injected once per stylesheet lifetime, but this extension can be
  // torn down and re-initialized by hot reload. Gate the title-cell rule on
  // the live lifecycle so a disabled instance cannot leave pointer-events
  // disabled in Spotify.
  const root = typeof document === 'undefined' ? null : document.documentElement;
  root?.classList.add(NATIVE_HOVER_TOOLTIP_ACTIVE_CLASS);
  lifecycle.trackCallback(() => {
    root?.classList.remove(NATIVE_HOVER_TOOLTIP_ACTIVE_CLASS);
  });
}
