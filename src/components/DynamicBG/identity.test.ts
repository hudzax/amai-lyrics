import { describe, it, expect, beforeEach } from 'vitest';
import {
  APP_BG_CLASS,
  APP_BG_CONTAINER_CLASS,
  APP_BG_GPU_CLASS,
  APP_BG_HOST_CLASS,
  APP_BG_HOST_HELPER_CLASS,
  APP_BG_IMG_A_ID,
  APP_BG_IMG_B_ID,
  APP_BG_LOADED_CLASS,
  APP_BG_LIB_GRID_CLASS,
  APP_BG_ON_CLASS,
  NESTED_BG_IMG_A_ID,
  NESTED_BG_IMG_B_ID,
  createAppBgContainer,
  ensureAppBgHostClasses,
  syncLibraryGridState,
} from './identity';

// The stylesheets select these names by hand, so the literals are pinned here.
// A rename that misses a CSS rule fails this test instead of silently dropping
// the canvas's positioning.
describe('dynamic background identity', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('pins the names the stylesheets select', () => {
    expect(APP_BG_ON_CLASS).toBe('amai-app-bg-on');
    expect(APP_BG_HOST_CLASS).toBe('amai-app-bg-host');
    expect(APP_BG_CONTAINER_CLASS).toBe('sweet-dynamic-bg');
    expect(APP_BG_HOST_HELPER_CLASS).toBe('sweet-dynamic-bg-in-this');
    expect(APP_BG_LOADED_CLASS).toBe('sweet-dynamic-bg-loaded');
    expect(APP_BG_CLASS).toBe('amai-app-bg');
    expect(APP_BG_GPU_CLASS).toBe('amai-bg-gpu');
    expect(APP_BG_LIB_GRID_CLASS).toBe('amai-lib-grid');
  });

  it('keeps the app-frame layer ids distinct from the nested pair', () => {
    expect(APP_BG_IMG_A_ID).toBe('amai-app-bg-img-a');
    expect(APP_BG_IMG_B_ID).toBe('amai-app-bg-img-b');
    expect(NESTED_BG_IMG_A_ID).toBe('bg-img-a');
    expect(NESTED_BG_IMG_B_ID).toBe('bg-img-b');
  });

  it('builds the DOM container, and the GPU container with its extra class', () => {
    expect(createAppBgContainer().className).toBe('sweet-dynamic-bg amai-app-bg');
    expect(createAppBgContainer(true).className).toBe('sweet-dynamic-bg amai-app-bg amai-bg-gpu');
  });

  it('tags a host with both positioning classes and syncs the grid marker', () => {
    const host = document.createElement('div');
    const navBar = document.createElement('div');
    navBar.className = 'Root__nav-bar';
    navBar.innerHTML = "<div data-encore-id='card'></div>";
    host.appendChild(navBar);

    ensureAppBgHostClasses(host);

    expect(host.classList.contains(APP_BG_HOST_CLASS)).toBe(true);
    expect(host.classList.contains(APP_BG_HOST_HELPER_CLASS)).toBe(true);
    expect(navBar.classList.contains(APP_BG_LIB_GRID_CLASS)).toBe(true);
  });

  it('drops the grid marker when the library shows no cards', () => {
    const navBar = document.createElement('div');
    navBar.className = 'Root__nav-bar';
    navBar.classList.add(APP_BG_LIB_GRID_CLASS);
    document.body.appendChild(navBar);

    syncLibraryGridState();

    expect(navBar.classList.contains(APP_BG_LIB_GRID_CLASS)).toBe(false);
  });
});
