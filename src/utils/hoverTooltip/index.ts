import lifecycle from '../lifecycle';
import {
  HoverEventPolicy,
  isRedispatchedHoverEvent,
  HOVER_TOOLTIP_ACTIVE_CLASS,
} from './eventPolicy';
import { HoverTooltipPresenter } from './presenter';
import { createSpicetifyTippyAdapter, type HoverTippyAdapter } from './tippy';

export type { HoverTippyAdapter, HoverTippyInstance } from './tippy';

const HOVER_EVENTS = ['mouseover', 'mouseout', 'focusin', 'focusout'] as const;
const CANCEL_EVENTS = [
  'pointerdown',
  'mousedown',
  'click',
  'contextmenu',
  'dragstart',
  'touchstart',
] as const;

export interface HoverTooltipInstallOptions {
  /** Production uses the lazy Spicetify adapter; tests inject a local fake. */
  tippy?: HoverTippyAdapter;
}

interface HoverTooltipInstallation {
  destroy: () => void;
}

let activeInstallation: HoverTooltipInstallation | null = null;

/**
 * Install the global hover/focus tooltip policy and replacement.
 *
 * The returned disposer is idempotent. The application registers it with the
 * lifecycle module, while tests can own one installation directly.
 */
export function installHoverTooltips(options: HoverTooltipInstallOptions = {}): () => void {
  if (activeInstallation) return activeInstallation.destroy;

  const policy = new HoverEventPolicy();
  const presenter = new HoverTooltipPresenter(options.tippy ?? createSpicetifyTippyAdapter());
  const removeListeners: (() => void)[] = [];
  let destroyed = false;

  const addWindowListener = (
    type: string,
    handler: (event: Event) => void,
    capture: boolean,
  ): void => {
    // Keep the canonical lifecycle registration even when the instance is
    // destroyed early; the local disposer makes the returned lifetime explicit.
    lifecycle.trackWindow(type, handler as (...args: unknown[]) => void, capture);
    removeListeners.push(() => window.removeEventListener(type, handler, capture));
  };

  const handleHoverEvent = (event: Event): void => {
    if (destroyed) return;
    const chain = policy.handle(event);
    // The presenter sees the original even when the policy stopped propagation
    // at window capture. Redispatched clones are ignored by both paths.
    if (!isRedispatchedHoverEvent(event)) presenter.handle(event, chain);
  };

  for (const type of HOVER_EVENTS) {
    addWindowListener(type, handleHoverEvent, true);
  }
  for (const type of CANCEL_EVENTS) {
    addWindowListener(type, () => presenter.cancel(), true);
  }
  addWindowListener('scroll', () => presenter.cancel(), true);

  const root = typeof document === 'undefined' ? null : document.documentElement;
  root?.classList.add(HOVER_TOOLTIP_ACTIVE_CLASS);
  removeListeners.push(() => root?.classList.remove(HOVER_TOOLTIP_ACTIVE_CLASS));

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    for (const remove of removeListeners.splice(0).reverse()) remove();
    presenter.destroy();
    if (activeInstallation?.destroy === destroy) activeInstallation = null;
  };

  lifecycle.trackCallback(destroy);
  activeInstallation = { destroy };
  return destroy;
}
