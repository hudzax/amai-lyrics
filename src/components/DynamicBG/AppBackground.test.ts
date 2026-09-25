import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import storage from '../../utils/storage';
import {
  AppBackground,
  isAppBackgroundEnabled,
  resolveAppBgHost,
  syncAppBgMarker,
  APP_BG_HOST_SELECTOR,
  APP_BG_HOST_FALLBACK_SELECTOR,
} from './AppBackground';
import { APP_BG_IMG_A_ID, APP_BG_IMG_B_ID, APP_BG_ON_CLASS } from './identity';

function setupMainView(): HTMLElement {
  document.body.innerHTML =
    '<div class="Root"><div id="global-nav-bar"></div><div class="Root__top-container"><div class="Root__main-view"><div class="main-view-container"></div></div></div><div class="Root__now-playing-bar"></div></div>';
  return document.querySelector<HTMLElement>(APP_BG_HOST_SELECTOR)!;
}

beforeEach(() => {
  setupMainView();
  storage.set('enable_app_background', 'true');
  document.documentElement.classList.remove(APP_BG_ON_CLASS);
});

afterEach(() => {
  document.body.innerHTML = '';
  storage.set('enable_app_background', null);
  document.documentElement.classList.remove(APP_BG_ON_CLASS);
});

describe('isAppBackgroundEnabled', () => {
  it('defaults off', () => {
    storage.set('enable_app_background', null);
    expect(isAppBackgroundEnabled()).toBe(false);
  });

  it('respects explicit off/on', () => {
    storage.set('enable_app_background', 'false');
    expect(isAppBackgroundEnabled()).toBe(false);
    storage.set('enable_app_background', 'true');
    expect(isAppBackgroundEnabled()).toBe(true);
  });
});

describe('AppBackground', () => {
  it('creates a direct-child background with normalized artwork URL', () => {
    const bg = new AppBackground();
    bg.apply('spotify:image:abc123');

    const host = document.querySelector(APP_BG_HOST_SELECTOR)!;
    expect(host.classList.contains('amai-app-bg-host')).toBe(true);
    const node = host.querySelector(':scope > .sweet-dynamic-bg.amai-app-bg') as HTMLElement | null;
    expect(node).not.toBeNull();
    expect(node?.getAttribute('current-img')).toBe('https://i.scdn.co/image/abc123');
    expect(node?.querySelector(`#${APP_BG_IMG_A_ID}`)).not.toBeNull();
    expect(node?.querySelector(`#${APP_BG_IMG_B_ID}`)).not.toBeNull();
  });

  it('does nothing when disabled', () => {
    storage.set('enable_app_background', 'false');
    const bg = new AppBackground();
    bg.apply('https://i.scdn.co/image/abc123');

    expect(document.querySelector('.sweet-dynamic-bg.amai-app-bg')).toBeNull();
    expect(
      document.querySelector(APP_BG_HOST_SELECTOR)?.classList.contains('amai-app-bg-host'),
    ).toBe(false);
  });

  it('ignores missing artwork and duplicate applies', () => {
    const bg = new AppBackground();
    bg.apply(undefined);
    expect(document.querySelector('.sweet-dynamic-bg.amai-app-bg')).toBeNull();

    bg.apply('https://i.scdn.co/image/abc123');
    bg.apply('https://i.scdn.co/image/abc123');
    const host = document.querySelector(APP_BG_HOST_SELECTOR)!;
    expect(host.querySelectorAll(':scope > .sweet-dynamic-bg.amai-app-bg').length).toBe(1);
  });

  it('remove() only removes the app BG, not the nested lyrics page BG', () => {
    const host = setupMainView();
    host.insertAdjacentHTML(
      'beforeend',
      '<div id="AmaiLyricsPage"><div class="ContentBox"><div class="sweet-dynamic-bg"><img id="bg-img-a" class="bg-image primary active"></div></div></div>',
    );

    const bg = new AppBackground();
    bg.apply('https://i.scdn.co/image/abc123');
    expect(bg.isApplied()).toBe(true);

    bg.remove();
    expect(bg.isApplied()).toBe(false);
    // Nested lyrics background survives.
    expect(document.querySelector('#AmaiLyricsPage .sweet-dynamic-bg')).not.toBeNull();
    expect(host.classList.contains('amai-app-bg-host')).toBe(false);
  });

  it('destroy() cleans up the DOM node for hot-reload', () => {
    const bg = new AppBackground();
    bg.apply('https://i.scdn.co/image/abc123');
    expect(bg.isApplied()).toBe(true);
    bg.destroy();
    expect(bg.isApplied()).toBe(false);
    expect(document.querySelector('.sweet-dynamic-bg.amai-app-bg')).toBeNull();
  });

  it('falls back to the top container when .Root is absent', () => {
    document.body.innerHTML =
      '<div class="Root__top-container"><div class="Root__main-view"></div></div>';
    expect(resolveAppBgHost()?.classList.contains('Root__top-container')).toBe(true);

    const bg = new AppBackground();
    bg.apply('https://i.scdn.co/image/abc123');
    expect(bg.isApplied()).toBe(true);
    const fallbackHost = document.querySelector(APP_BG_HOST_FALLBACK_SELECTOR)!;
    expect(fallbackHost.querySelectorAll(':scope > .sweet-dynamic-bg.amai-app-bg').length).toBe(1);
  });

  it('resolves .Root first when both hosts exist', () => {
    setupMainView();
    expect(resolveAppBgHost()?.classList.contains('Root')).toBe(true);
  });

  it('sets the single-canvas marker on apply and clears it on remove/destroy', () => {
    const bg = new AppBackground();
    bg.apply('https://i.scdn.co/image/abc123');
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(true);

    bg.remove();
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(false);

    bg.apply('https://i.scdn.co/image/abc123');
    bg.destroy();
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(false);
  });

  it('does not set the marker when disabled', () => {
    storage.set('enable_app_background', 'false');
    new AppBackground().apply('https://i.scdn.co/image/abc123');
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(false);
  });

  it('syncAppBgMarker follows the toggle', () => {
    syncAppBgMarker();
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(true);
    storage.set('enable_app_background', 'false');
    syncAppBgMarker();
    expect(document.documentElement.classList.contains(APP_BG_ON_CLASS)).toBe(false);
  });

  it('resolveAppBgHost prefers the fullscreen lyrics page over .Root', () => {
    expect(resolveAppBgHost()?.classList.contains('Root')).toBe(true);
    const page = document.createElement('div');
    page.id = 'AmaiLyricsPage';
    page.className = 'Fullscreen';
    document.body.appendChild(page);
    expect(resolveAppBgHost()).toBe(page);
  });

  it('carries the canvas into the fullscreen page and back without duplicating', () => {
    const bg = new AppBackground();
    bg.apply('spotify:image:abc123');
    const root = document.querySelector<HTMLElement>('.Root')!;
    const canvas = root.querySelector<HTMLElement>(':scope > .sweet-dynamic-bg.amai-app-bg')!;
    expect(root.classList.contains('amai-app-bg-host')).toBe(true);

    // Fullscreen.Open() transfers the page to <body> and tags it; the
    // fullscreen:open listener re-applies with resolveAppBgHost pointing at it.
    const page = document.createElement('div');
    page.id = 'AmaiLyricsPage';
    page.className = 'Fullscreen';
    document.body.appendChild(page);
    bg.apply('spotify:image:abc123');

    // Same node carried over — not orphaned and re-created (the old code path
    // re-resolved findAppBg on a host switch and built a duplicate canvas).
    expect(page.querySelector(':scope > .sweet-dynamic-bg.amai-app-bg')).toBe(canvas);
    expect(document.querySelectorAll('.amai-app-bg')).toHaveLength(1);
    expect(page.classList.contains('amai-app-bg-host')).toBe(true);
    // The vacated .Root releases its classes even though this apply() dedups.
    expect(root.classList.contains('amai-app-bg-host')).toBe(false);
    expect(root.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);

    // Exit: the fullscreen:exit listener re-applies with the class gone.
    page.classList.remove('Fullscreen');
    bg.apply('spotify:image:abc123');

    expect(root.querySelector(':scope > .sweet-dynamic-bg.amai-app-bg')).toBe(canvas);
    expect(document.querySelectorAll('.amai-app-bg')).toHaveLength(1);
    expect(root.classList.contains('amai-app-bg-host')).toBe(true);
    expect(page.classList.contains('amai-app-bg-host')).toBe(false);
    expect(page.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);
    bg.remove();
  });

  it('remove() while fullscreen also releases the .Root host classes behind it', () => {
    const bg = new AppBackground();
    bg.apply('spotify:image:abc123');
    const root = document.querySelector<HTMLElement>('.Root')!;
    const page = document.createElement('div');
    page.id = 'AmaiLyricsPage';
    page.className = 'Fullscreen';
    document.body.appendChild(page);
    bg.apply('spotify:image:abc123'); // canvas parks in the page

    bg.remove();

    expect(document.querySelector('.amai-app-bg')).toBeNull();
    // Regression guard: cached.host is the page here, so a host-only cleanup
    // would leave .Root transparent-UI classes leaking over Spotify's frame.
    expect(root.classList.contains('amai-app-bg-host')).toBe(false);
    expect(root.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);
    expect(page.classList.contains('amai-app-bg-host')).toBe(false);
  });
});
