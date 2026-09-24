import lifecycle from '../lifecycle';
import Whentil from '../Whentil';
import { getHoverTooltipContent } from './content';
import { isRedispatchedHoverEvent, NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY } from './eventPolicy';
import type { HoverTippyAdapter, HoverTippyInstance } from './tippy';

/** Matches the ButtonManager/pageControls feel: 200ms in, immediate out. */
const SHOW_DELAY_MS = 200;

type OwnedTippyElement = HTMLElement & {
  _tippy?: HoverTippyInstance;
  [key: string]: unknown;
};

type ShownTooltip = {
  trigger: HTMLElement;
  instance: HoverTippyInstance;
  content: string;
};

function markTooltipOwned(trigger: HTMLElement, owner: unknown): void {
  (trigger as OwnedTippyElement)[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY] = owner;
}

function syncTooltipOwnership(trigger: HTMLElement, instance: HoverTippyInstance): void {
  const element = trigger as OwnedTippyElement;
  markTooltipOwned(trigger, element._tippy ?? instance);
}

function clearTooltipOwnership(trigger: HTMLElement, instance: HoverTippyInstance): void {
  const element = trigger as OwnedTippyElement;
  const owner = element[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY];
  if (owner === instance || owner === element._tippy) {
    delete element[NATIVE_HOVER_TOOLTIP_OWNED_PROPERTY];
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

function placementFor(trigger: HTMLElement): 'top' | 'right' {
  return trigger.closest('.Root__nav-bar') ? 'right' : 'top';
}

/**
 * Owns the replacement label lifetime for one HoverTooltip installation.
 * Trigger detection and native retargeting belong to HoverEventPolicy; this
 * module only receives the normalized chain for the current event.
 */
export class HoverTooltipPresenter {
  private readonly adapter: HoverTippyAdapter;
  private shown: ShownTooltip | null = null;
  private pendingTrigger: HTMLElement | null = null;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private readinessTask: ReturnType<typeof Whentil.When> | null = null;
  private referenceObserver: MutationObserver | null = null;
  private readonly ownedInstances = new Set<HoverTippyInstance>();
  private readonly ownedTriggers = new WeakMap<HoverTippyInstance, HTMLElement>();
  private readonly destroyingInstances = new WeakSet<HoverTippyInstance>();
  private destroyed = false;

  public constructor(adapter: HoverTippyAdapter) {
    this.adapter = adapter;
  }

  /** Process one normalized original event and its trigger chain. */
  public handle(event: Event, chain: HTMLElement[]): void {
    if (this.destroyed || isRedispatchedHoverEvent(event)) return;
    if (
      event.type !== 'mouseover' &&
      event.type !== 'mouseout' &&
      event.type !== 'focusin' &&
      event.type !== 'focusout'
    ) {
      return;
    }

    const trigger = chain[0] ?? null;
    if (!trigger) {
      this.clearPending();
      this.hideShown();
      return;
    }

    // Movement inside one trigger must not restart its dwell timer.
    if (this.shown?.trigger === trigger || this.pendingTrigger === trigger) {
      if (this.shown?.trigger === trigger) this.updateShown(trigger);
      return;
    }

    this.clearPending();
    this.hideShown();
    this.pendingTrigger = trigger;
    this.ensureReferenceObserver();
    this.pendingTimer = setTimeout(() => this.showFor(trigger), SHOW_DELAY_MS);
  }

  /** Cancel a pending or visible label before an activation/scroll gesture. */
  public cancel(): void {
    if (this.destroyed) return;
    this.clearPending();
    this.hideShown();
  }

  /** Release every owned Tippy instance and observer owned by this presenter. */
  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearPending();
    this.hideShown();
    for (const instance of Array.from(this.ownedInstances)) {
      this.destroyInstance(instance);
    }
    this.ownedInstances.clear();
    this.referenceObserver?.disconnect();
    this.referenceObserver = null;
  }

  private maybeStopReferenceObserver(): void {
    if (this.pendingTimer === null && this.pendingTrigger === null && this.shown === null) {
      this.referenceObserver?.disconnect();
      this.referenceObserver = null;
    }
  }

  private ensureReferenceObserver(): void {
    if (
      this.referenceObserver ||
      typeof MutationObserver === 'undefined' ||
      typeof document === 'undefined' ||
      !document.body
    ) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      if (this.destroyed || this.referenceObserver !== observer) return;
      if (this.pendingTrigger && !this.pendingTrigger.isConnected) this.clearPending();
      const visible = this.shown;
      if (visible && !visible.trigger.isConnected) {
        this.hideShown();
      } else if (
        visible &&
        mutations.some((mutation) => mutationTouchesTrigger(mutation, visible.trigger))
      ) {
        this.updateShown(visible.trigger);
      }
      this.maybeStopReferenceObserver();
    });
    this.referenceObserver = observer;
    lifecycle.trackObserver(observer);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'title'],
    });
  }

  private clearPending(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    this.readinessTask?.Cancel();
    this.readinessTask = null;
    this.pendingTrigger = null;
    this.maybeStopReferenceObserver();
  }

  private hideShown(): void {
    if (!this.shown) return;
    const current = this.shown;
    this.shown = null;
    this.destroyInstance(current.instance);
    this.maybeStopReferenceObserver();
  }

  private waitForTippy(trigger: HTMLElement): void {
    if (this.readinessTask) return;

    const task = Whentil.When(
      () => this.adapter.isReady(),
      () => {
        this.readinessTask = null;
        if (!this.destroyed && this.pendingTrigger === trigger) this.showFor(trigger);
      },
    );
    this.readinessTask = task;
    lifecycle.trackWhentil(task);
  }

  private updateShown(trigger: HTMLElement): boolean {
    if (this.shown?.trigger !== trigger) return false;
    if (this.shown.instance.state?.isVisible === false) {
      this.hideShown();
      return true;
    }
    const content = getHoverTooltipContent(trigger);
    if (!content) {
      this.hideShown();
      return true;
    }
    if (content !== this.shown.content) {
      this.shown.content = content;
      try {
        this.shown.instance.setContent?.(content);
      } catch {
        this.hideShown();
      }
    }
    return true;
  }

  private showFor(trigger: HTMLElement): void {
    this.pendingTimer = null;
    if (this.destroyed || this.pendingTrigger !== trigger) return;
    if (!trigger.isConnected) {
      this.clearPending();
      return;
    }

    if (!this.adapter.isReady()) {
      this.waitForTippy(trigger);
      return;
    }

    // A pre-existing Tippy belongs to Spotify or another extension. Never
    // create a second bubble or retarget that instance.
    const existing = (trigger as OwnedTippyElement)._tippy;
    if (existing) {
      if (!this.ownedInstances.has(existing)) {
        this.clearPending();
        return;
      }
      this.destroyInstance(existing);
    }

    const content = getHoverTooltipContent(trigger);
    if (!content) {
      this.clearPending();
      return;
    }

    this.clearPending();
    this.hideShown();
    let instance: HoverTippyInstance | null = null;
    try {
      instance = this.adapter.create(trigger, {
        content,
        theme: 'amai-lyrics',
        animation: 'amai',
        arrow: false,
        placement: placementFor(trigger),
        onHide: () => {
          if (this.shown?.instance === instance) this.shown = null;
          if (instance) this.destroyInstance(instance);
          this.maybeStopReferenceObserver();
        },
        onDestroy: () => {
          if (this.shown?.instance === instance) this.shown = null;
          if (instance) {
            clearTooltipOwnership(trigger, instance);
            this.ownedTriggers.delete(instance);
            this.ownedInstances.delete(instance);
          }
          this.maybeStopReferenceObserver();
        },
      });
      this.ownedInstances.add(instance);
      this.ownedTriggers.set(instance, trigger);
      markTooltipOwned(trigger, instance);
      this.shown = { trigger, instance, content };
      this.ensureReferenceObserver();
      instance.show();
      if (this.shown?.instance === instance && this.ownedInstances.has(instance)) {
        syncTooltipOwnership(trigger, instance);
      }
    } catch (error) {
      if (this.shown?.instance === instance) this.shown = null;
      if (instance) this.destroyInstance(instance);
      this.maybeStopReferenceObserver();
      console.error('[Amai Lyrics] Failed to show hover tooltip:', error);
    }
  }

  private destroyInstance(instance: HoverTippyInstance): void {
    if (!this.ownedInstances.has(instance) || this.destroyingInstances.has(instance)) return;
    this.destroyingInstances.add(instance);
    try {
      instance.destroy();
    } catch {
      /* popper already torn down */
    } finally {
      const trigger = this.ownedTriggers.get(instance);
      if (trigger) clearTooltipOwnership(trigger, instance);
      this.ownedTriggers.delete(instance);
      this.ownedInstances.delete(instance);
      this.destroyingInstances.delete(instance);
    }
  }
}
