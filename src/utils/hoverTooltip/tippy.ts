export interface HoverTippyInstance {
  show: () => void;
  destroy: () => void;
  setContent?: (content: string) => void;
  state?: { isVisible?: boolean };
}

export interface HoverTippyAdapter {
  isReady(): boolean;
  create(element: Element, props: Record<string, unknown>): HoverTippyInstance;
}

type TippyFactory = (element: Element, props: Record<string, unknown>) => HoverTippyInstance;

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
