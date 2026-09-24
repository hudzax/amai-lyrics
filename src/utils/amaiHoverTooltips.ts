import lifecycle from './lifecycle';
import Whentil from './Whentil';
import { getHoverTooltipContent } from './hoverTooltipContent';
import {
  findHoverTooltipTriggerChain,
  getRememberedHoverTooltipChain,
  NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY,
} from './nativeHoverTooltipSuppressor';

/**
 * Puts Amai hover/focus labels back on every native trigger after
 * `nativeHoverTooltipSuppressor` quiets Spotify's — as lightweight Tippy
 * bubbles (`.tippy-box[data-theme='amai-lyrics']` from
 * `src/css/Tooltips.css`).
 *
 * Why Spotify's version stuttered and ours does not: Spotify's tooltip is not
 * a plain tippy instance — it mounts tippy + `#context-menu` and then runs
 * `updateAfterFirstLayout`, a requestAnimationFrame loop calling
 * `getBoundingClientRect()` every frame until the 1s-DELAYED content gives the
 * menu a non-zero width (see the suppression module's doc for the full root
 * cause). We create a normal tippy with text that is complete at creation
 * time, show it once programmatically, and destroy it on leave: one
 * position calculation per hover, zero animation-frame loops.
 *
 * How it wires up:
 *   - The suppressor and replacement share window-capture listeners for
 *     `mouseover`/`mouseout` and `focusin`/`focusout`. Re-dispatched clones
 *     are flagged and skipped, while the original event remains visible to
 *     this module on the same window node.
 *   - `findHoverTooltipTriggerChain` walks the entire document ancestry, so
 *     dynamically mounted pages, dialogs, portals, and virtualized views are
 *     covered without a surface allowlist. The innermost match supplies the
 *     content: accessible labels, titles, direct-anchor text, or leaf text.
 *   - A body MutationObserver exists only while a tooltip/pending trigger is
 *     active; it refreshes visible labels after text/attribute mutations and
 *     cleans up removed triggers.
 *   - Show is delayed (200ms, same as ButtonManager's `delay: [200, 0]`)
 *     and the timer resets whenever the pointer crosses into a DIFFERENT
 *     trigger, so sweeping across a row pops nothing; only dwelling does.
 *     Leaving, activation, scrolling, trigger removal, or teardown destroys
 *     the instance immediately — at most ONE bubble exists at any time.
 *
 * Interference guarantees:
 *   - only hover/focus tooltip paths are read; clicks, drag, context menus,
 *     keyboard activation, and CSS `:hover` remain untouched;
 *   - a trigger whose native tooltip shares a functional hover handler is
 *     intentionally replaced, so the native handler is suppressed along with
 *     the tooltip; keyboard activation still works;
 *   - pre-existing third-party Tippy instances are left on their original
 *     event path and are never clobbered.
 *
 * `Spicetify.Tippy` loads asynchronously; if it is not there yet, the pending
 * hover waits on a cancellable `Whentil` readiness task and shows on the same
 * dwell once Tippy becomes available. Everything runs through `lifecycle`, so
 * hot-reload teardown cancels the pending timer/task and destroys any visible
 * bubble.
 */

/** Matches the ButtonManager/pageControls feel: 200ms in, immediate out. */
const SHOW_DELAY_MS = 200;

interface AmaiTipInstance {
  show: () => void;
  destroy: () => void;
  setContent?: (content: string) => void;
  state?: { isVisible?: boolean };
}

type TippyFactory = (element: Element, props: Record<string, unknown>) => AmaiTipInstance;

type OwnedTippyElement = HTMLElement & {
  _tippy?: AmaiTipInstance;
  [key: string]: unknown;
};

function markTooltipOwned(trigger: HTMLElement, owner: unknown): void {
  (trigger as OwnedTippyElement)[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY] = owner;
}

function syncTooltipOwnership(trigger: HTMLElement, instance: AmaiTipInstance): void {
  const element = trigger as OwnedTippyElement;
  markTooltipOwned(trigger, element._tippy ?? instance);
}

function clearTooltipOwnership(trigger: HTMLElement, instance: AmaiTipInstance): void {
  const element = trigger as OwnedTippyElement;
  const owner = element[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY];
  if (owner === instance || owner === element._tippy) {
    delete element[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY];
  }
}

/** The single tooltip currently visible, if any (invariant: at most one). */
let shown: { trigger: HTMLElement; instance: AmaiTipInstance; content: string } | null = null;
let pendingTrigger: HTMLElement | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let readinessTask: ReturnType<typeof Whentil.When> | null = null;
let referenceObserver: MutationObserver | null = null;
// Keep strong references only while an instance may still need cleanup after
// Tippy hides it externally; the set is pruned on destroy and emptied on
// teardown, so hidden instances cannot outlive the extension.
const ownedInstances = new Set<AmaiTipInstance>();
const ownedTriggers = new WeakMap<AmaiTipInstance, HTMLElement>();
const destroyingInstances = new WeakSet<AmaiTipInstance>();

function destroyInstance(instance: AmaiTipInstance): void {
  if (!ownedInstances.has(instance) || destroyingInstances.has(instance)) return;
  destroyingInstances.add(instance);
  try {
    instance.destroy();
  } catch {
    /* popper already torn down */
  } finally {
    const trigger = ownedTriggers.get(instance);
    if (trigger) clearTooltipOwnership(trigger, instance);
    ownedTriggers.delete(instance);
    ownedInstances.delete(instance);
    destroyingInstances.delete(instance);
  }
}

function getTippyFactory(): TippyFactory | null {
  if (typeof Spicetify === 'undefined' || typeof Spicetify.Tippy !== 'function') return null;
  return Spicetify.Tippy as TippyFactory;
}

function maybeStopReferenceObserver(): void {
  if (pendingTimer === null && pendingTrigger === null && shown === null) {
    referenceObserver?.disconnect();
    referenceObserver = null;
  }
}

function mutationTouchesTrigger(mutation: MutationRecord, trigger: HTMLElement): boolean {
  const target = mutation.target;
  if (target === trigger || trigger.contains(target)) return true;
  if (mutation.type !== 'attributes' && mutation.type !== 'characterData') return false;

  const labelledBy = (trigger.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  if (labelledBy.length === 0) return false;

  let current: Node | null = target;
  while (current) {
    if (current.nodeType === 1 && labelledBy.includes((current as Element).id)) return true;
    current = current.parentNode;
  }
  return false;
}

function ensureReferenceObserver(): void {
  if (
    referenceObserver ||
    typeof MutationObserver === 'undefined' ||
    typeof document === 'undefined' ||
    !document.body
  ) {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    // A disconnect can race with an already queued callback. Ignore callbacks
    // from an observer that has since been replaced by a newer hover cycle.
    if (referenceObserver !== observer) return;
    if (pendingTrigger && !pendingTrigger.isConnected) clearPending();
    const visible = shown;
    if (visible && !visible.trigger.isConnected) hideShown();
    else if (
      visible &&
      mutations.some((mutation) => mutationTouchesTrigger(mutation, visible.trigger))
    ) {
      updateShown(visible.trigger);
    }
    maybeStopReferenceObserver();
  });
  referenceObserver = observer;
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-labelledby', 'title'],
  });
}

function clearPending(): void {
  if (pendingTimer !== null) clearTimeout(pendingTimer);
  readinessTask?.Cancel();
  readinessTask = null;
  pendingTimer = null;
  pendingTrigger = null;
  maybeStopReferenceObserver();
}

function hideShown(): void {
  if (!shown) return;
  const current = shown;
  shown = null;
  destroyInstance(current.instance);
  maybeStopReferenceObserver();
}

function waitForTippy(trigger: HTMLElement): void {
  if (readinessTask) return;

  const task = Whentil.When(
    () => getTippyFactory() !== null,
    () => {
      readinessTask = null;
      if (pendingTrigger === trigger) showFor(trigger);
    },
  );
  readinessTask = task;
  lifecycle.trackWhentil(task);
}

function placementFor(trigger: HTMLElement): 'top' | 'right' {
  return trigger.closest('.Root__nav-bar') ? 'right' : 'top';
}

function updateShown(trigger: HTMLElement): boolean {
  if (shown?.trigger !== trigger) return false;
  if (shown.instance.state?.isVisible === false) {
    hideShown();
    return true;
  }
  const content = getHoverTooltipContent(trigger);
  if (!content) {
    hideShown();
    return true;
  }
  if (content !== shown.content) {
    shown.content = content;
    try {
      shown.instance.setContent?.(content);
    } catch {
      hideShown();
    }
  }
  return true;
}

function showFor(trigger: HTMLElement): void {
  pendingTimer = null;
  if (pendingTrigger !== trigger) return;
  if (!trigger.isConnected) {
    clearPending();
    return;
  }

  const tippyFactory = getTippyFactory();
  if (!tippyFactory) {
    waitForTippy(trigger);
    return;
  }

  // Already owns a tippy instance (Spicetify/extension playbar buttons —
  // including our own playbar button via ButtonManager): theirs stays theirs.
  // Creating a second instance would stack two bubbles on one element and
  // clobber `_tippy`, leaking the other popper. An instance left behind by
  // this module after an external hide is ours to retire before recreating.
  const existing = (trigger as unknown as { _tippy?: AmaiTipInstance })._tippy;
  if (existing) {
    if (!ownedInstances.has(existing)) {
      clearPending();
      return;
    }
    destroyInstance(existing);
  }

  const content = getHoverTooltipContent(trigger);
  if (!content) {
    clearPending();
    return;
  }

  clearPending();
  hideShown();
  let instance: AmaiTipInstance | null = null;
  try {
    instance = tippyFactory(trigger, {
      content,
      theme: 'amai-lyrics',
      animation: 'amai',
      arrow: false,
      placement: placementFor(trigger),
      onHide: () => {
        if (shown?.instance === instance) shown = null;
        if (instance) destroyInstance(instance);
        maybeStopReferenceObserver();
      },
      onDestroy: () => {
        if (shown?.instance === instance) shown = null;
        if (instance) {
          clearTooltipOwnership(trigger, instance);
          ownedTriggers.delete(instance);
          ownedInstances.delete(instance);
        }
        maybeStopReferenceObserver();
      },
    });
    ownedInstances.add(instance);
    ownedTriggers.set(instance, trigger);
    markTooltipOwned(trigger, instance);
    const record = { trigger, instance, content };
    shown = record;
    ensureReferenceObserver();
    instance.show();
    if (shown?.instance === instance && ownedInstances.has(instance)) {
      syncTooltipOwnership(trigger, instance);
    }
  } catch (error) {
    if (shown?.instance === instance) shown = null;
    if (instance) destroyInstance(instance);
    maybeStopReferenceObserver();
    console.error('[Amai Lyrics] Failed to show track-row tooltip:', error);
  }
}

function sync(event: Event): void {
  // Our own re-dispatched clones: their sides are retargeted, so they must
  // never drive show/hide decisions (the original always arrives too).
  if ((event as Event & { __amaiRedispatchedHover?: boolean }).__amaiRedispatchedHover) return;
  // The suppressor and replacement share the same four event types.
  if (
    event.type !== 'mouseover' &&
    event.type !== 'mouseout' &&
    event.type !== 'focusin' &&
    event.type !== 'focusout'
  ) {
    return;
  }

  const pointer = event as MouseEvent | FocusEvent;
  const entering = pointer.type === 'mouseover' || pointer.type === 'focusin';
  // Where the pointer/focus IS NOW (target on enter, relatedTarget on leave) —
  // the same "start side" the suppressor uses to spot trigger crossings.
  const start = entering ? pointer.target : pointer.relatedTarget;
  const chain = getRememberedHoverTooltipChain(event) ?? findHoverTooltipTriggerChain(start);
  const trigger = chain.length > 0 ? chain[0] : null; // innermost

  if (!trigger) {
    clearPending();
    hideShown();
    return;
  }
  // Already showing for this trigger, or its timer is running: settle, don't
  // restart (movement INSIDE one trigger must not postpone the tooltip).
  if (shown?.trigger === trigger || pendingTrigger === trigger) {
    if (shown?.trigger === trigger) updateShown(trigger);
    return;
  }

  // Pointer moved to a different trigger: drop whatever was armed for the old
  // one and start the delay fresh for the new.
  clearPending();
  hideShown();
  pendingTrigger = trigger;
  ensureReferenceObserver();
  pendingTimer = setTimeout(() => showFor(trigger), SHOW_DELAY_MS);
}

function cancelOnActivation(): void {
  clearPending();
  hideShown();
}

export function installAmaiHoverTooltips(): void {
  // Capture on window, same registration style as the suppressor: both
  // listeners observe every ORIGINAL mouseover/mouseout/focus event
  // (stopPropagation from the suppressor only halts propagation to other
  // nodes, not sibling listeners on window itself).
  lifecycle.trackWindow('mouseover', sync, true);
  lifecycle.trackWindow('mouseout', sync, true);
  lifecycle.trackWindow('focusin', sync, true);
  lifecycle.trackWindow('focusout', sync, true);
  // A click, touch, context menu, or drag can happen while the 200 ms timer
  // is pending. Cancel before the action opens its menu so the replacement
  // cannot appear over it.
  for (const type of [
    'pointerdown',
    'mousedown',
    'click',
    'contextmenu',
    'dragstart',
    'touchstart',
  ]) {
    lifecycle.trackWindow(type, cancelOnActivation, true);
  }
  // Capture-phase scroll reaches us from any scrolling container (scroll does
  // not bubble, but capture still walks through window). Virtualized rows can
  // unmount under a stationary pointer — scrolling kills the bubble instead of
  // leaving it stranded over unrelated content.
  lifecycle.trackWindow(
    'scroll',
    () => {
      clearPending();
      hideShown();
    },
    true,
  );
  lifecycle.trackCallback(() => {
    clearPending();
    hideShown();
    for (const instance of Array.from(ownedInstances)) {
      destroyInstance(instance);
    }
    ownedInstances.clear();
    referenceObserver?.disconnect();
    referenceObserver = null;
  });
}
