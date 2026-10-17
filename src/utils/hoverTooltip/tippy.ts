export interface HoverTippyInstance {
  show: () => void;
  hide: () => void;
  destroy: () => void;
  setContent?: (content: string) => void;
  state?: { isVisible?: boolean };
}

export interface HoverTippyAdapter {
  isReady(): boolean;
  create(element: Element, props: Record<string, unknown>): HoverTippyInstance;
}

type TippyFactory = (element: Element, props: Record<string, unknown>) => HoverTippyInstance;

/**
 * The appearance every Amai bubble shares. The default render is deliberate:
 * Spicetify's TippyProps render outputs `.main-contextMenu-tippy`, which
 * Spotify leaves unstyled (see src/css/Tooltips.css).
 */
export const AMAI_BUBBLE_PROPS = {
  theme: 'amai-lyrics',
  animation: 'amai',
  arrow: false,
} as const;

/** How long a passive bubble waits before showing; the hover replacement's dwell matches it. */
export const AMAI_BUBBLE_SHOW_DELAY_MS = 200;

/**
 * One recipe for the bubbles the extension owns: the page controls, the
 * playbar button, and any other plainly-labeled trigger. The HoverTooltip
 * presenter shares the appearance but keeps its own trigger policy.
 */
export function createAmaiBubble(
  adapter: HoverTippyAdapter,
  element: Element,
  content: string,
  placement: 'top' | 'right' = 'top',
): HoverTippyInstance {
  return adapter.create(element, {
    ...AMAI_BUBBLE_PROPS,
    content,
    placement,
    delay: [AMAI_BUBBLE_SHOW_DELAY_MS, 0],
  });
}

/** Production adapter. Readiness is checked lazily because Spicetify.Tippy loads asynchronously. */
export function createSpicetifyTippyAdapter(): HoverTippyAdapter {
  return {
    isReady(): boolean {
      return typeof Spicetify !== 'undefined' && typeof Spicetify.Tippy === 'function';
    },
    create(element, props): HoverTippyInstance {
      if (typeof Spicetify === 'undefined' || typeof Spicetify.Tippy !== 'function') {
        throw new Error('Spicetify.Tippy is not ready');
      }
      return (Spicetify.Tippy as unknown as TippyFactory)(element, props);
    },
  };
}

/** The one production adapter the tooltip seam and the passive bubbles share. */
export const spicetifyTippyAdapter = createSpicetifyTippyAdapter();
