import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import storage from '../../utils/storage';
import {
  AppBackground,
  isAppBackgroundEnabled,
  resolveAppBgHost,
  syncAppBgMarker,
  APP_BG_HOST_SELECTOR,
  APP_BG_HOST_FALLBACK_SELECTOR,
  APP_BG_IMG_A_ID,
  APP_BG_IMG_B_ID,
  APP_BG_ON_CLASS,
} from './AppBackground';

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
      '<div id="SpicyLyricsPage"><div class="ContentBox"><div class="sweet-dynamic-bg"><img id="bg-img-a" class="bg-image primary active"></div></div></div>',
    );

    const bg = new AppBackground();
    bg.apply('https://i.scdn.co/image/abc123');
    expect(bg.isApplied()).toBe(true);

    bg.remove();
    expect(bg.isApplied()).toBe(false);
    // Nested lyrics background survives.
    expect(document.querySelector('#SpicyLyricsPage .sweet-dynamic-bg')).not.toBeNull();
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
});
