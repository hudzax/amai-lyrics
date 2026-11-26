import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  open: vi.fn((): Promise<void> => Promise.resolve()),
  destroy: vi.fn((): Promise<void> => Promise.resolve()),
  isOpened: false,
}));

vi.mock('../components/Pages/PageView', () => ({
  default: {
    Open: mocks.open,
    Destroy: mocks.destroy,
    get IsOpened() {
      return mocks.isOpened;
    },
  },
}));
vi.mock('../components/Global/Global', () => ({
  default: { Event: { listen: vi.fn(() => 1) } },
}));

import { PageManager } from './PageManager';
import type { ButtonManager } from './ButtonManager';
import lifecycle from '../utils/lifecycle';

type HistoryListener = (location: { pathname: string }) => void;
let listener: HistoryListener | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.open.mockResolvedValue(undefined);
  mocks.destroy.mockResolvedValue(undefined);
  mocks.isOpened = false;
  listener = undefined;
  Spicetify.Platform.History.location.pathname = '/';
  vi.spyOn(Spicetify.Platform.History, 'listen').mockImplementation((callback) => {
    listener = callback as HistoryListener;
    return vi.fn();
  });
});

afterEach(() => {
  lifecycle.disposeAll();
  vi.restoreAllMocks();
});

function managerWith(setActive = vi.fn()): PageManager {
  return new PageManager({ setActive } as unknown as ButtonManager);
}

describe('PageManager navigation currency', () => {
  it('destroys a pending page open when a newer route leaves lyrics', async () => {
    let finishOpen: (() => void) | undefined;
    mocks.open.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishOpen = resolve;
        }),
    );
    const setActive = vi.fn();
    managerWith(setActive);

    listener?.({ pathname: '/AmaiLyrics' });
    await vi.waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    listener?.({ pathname: '/' });
    await vi.waitFor(() => expect(mocks.destroy).toHaveBeenCalledTimes(1));
    finishOpen?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(setActive).not.toHaveBeenCalledWith(true);
    expect(setActive).toHaveBeenLastCalledWith(false);
  });

  it('does not let an older destroy continuation deactivate a newer lyrics route', async () => {
    let finishDestroy: (() => void) | undefined;
    mocks.isOpened = true;
    mocks.destroy.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishDestroy = resolve;
        }),
    );
    const setActive = vi.fn();
    managerWith(setActive);

    listener?.({ pathname: '/' });
    await vi.waitFor(() => expect(mocks.destroy).toHaveBeenCalledTimes(1));
    listener?.({ pathname: '/AmaiLyrics' });
    await vi.waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(1));
    finishDestroy?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(setActive).toHaveBeenLastCalledWith(true);
    expect(setActive).not.toHaveBeenLastCalledWith(false);
  });
});
