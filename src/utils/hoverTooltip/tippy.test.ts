import { describe, expect, it, vi } from 'vitest';
import {
  AMAI_BUBBLE_PROPS,
  AMAI_BUBBLE_SHOW_DELAY_MS,
  createAmaiBubble,
  type HoverTippyAdapter,
  type HoverTippyInstance,
} from './tippy';

function fakeAdapter(): {
  adapter: HoverTippyAdapter;
  instance: HoverTippyInstance;
} {
  const instance: HoverTippyInstance = {
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    adapter: {
      isReady: () => true,
      create: vi.fn(() => instance),
    },
    instance,
  };
}

describe('createAmaiBubble', () => {
  it('applies the shared appearance, content, placement, and dwell', () => {
    const { adapter, instance } = fakeAdapter();
    const element = document.createElement('button');

    expect(createAmaiBubble(adapter, element, 'Amai Lyrics')).toBe(instance);
    expect(adapter.create).toHaveBeenCalledWith(element, {
      ...AMAI_BUBBLE_PROPS,
      content: 'Amai Lyrics',
      placement: 'top',
      delay: [AMAI_BUBBLE_SHOW_DELAY_MS, 0],
    });
  });

  it('pins the values the stylesheet theme depends on', () => {
    expect(AMAI_BUBBLE_PROPS).toEqual({
      theme: 'amai-lyrics',
      animation: 'amai',
      arrow: false,
    });
    expect(AMAI_BUBBLE_SHOW_DELAY_MS).toBe(200);
  });
});
