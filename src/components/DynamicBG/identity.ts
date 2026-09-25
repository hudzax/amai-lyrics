/**
 * Identity of the dynamic-background canvases: the class and id strings the
 * painters, the frame boot and the stylesheets all have to agree on. CSS
 * selects these by hand, so the values are load-bearing. The ids are
 * per-painter join keys between a container and its two crossfade layers:
 * the app frame keeps its own pair because the sidebar and lyrics-page
 * painters scope their queries to their own container and may coexist with
 * it in one document.
 */

/** Marker on `<html>` while the app-frame background feature is enabled.
 * Contract: CSS selectors using it must LEAD with it
 * (`.amai-app-bg-on body ...`) — it is an ancestor of <body>, never a
 * descendant, so `body ... .amai-app-bg-on ...` can never match. */
export const APP_BG_ON_CLASS = 'amai-app-bg-on';
export const APP_BG_HOST_CLASS = 'amai-app-bg-host';
export const APP_BG_CLASS = 'amai-app-bg';
/** Container class shared by all three background canvases. */
export const APP_BG_CONTAINER_CLASS = 'sweet-dynamic-bg';
/** Marks the host a canvas was appended into; CSS positions against it. */
export const APP_BG_HOST_HELPER_CLASS = 'sweet-dynamic-bg-in-this';
/** Added once the first layer's artwork has painted. No CSS rule selects it. */
export const APP_BG_LOADED_CLASS = 'sweet-dynamic-bg-loaded';
export const APP_BG_IMG_A_ID = 'amai-app-bg-img-a';
export const APP_BG_IMG_B_ID = 'amai-app-bg-img-b';
/** Two-layer ids for the sidebar and lyrics-page painters. */
export const NESTED_BG_IMG_A_ID = 'bg-img-a';
export const NESTED_BG_IMG_B_ID = 'bg-img-b';
/** Toggled on `.Root__nav-bar` when the library shows cards (expanded grid).
 * Replaces the `:has([data-encore-id='card'])` selector, which forces the
 * style engine to re-evaluate on every descendant mutation. */
export const APP_BG_LIB_GRID_CLASS = 'amai-lib-grid';
/** Container class for the WebGL2 shader canvas. CSS layers/scrims/filters
 * must be neutralized while it is present — the shader paints everything. */
export const APP_BG_GPU_CLASS = 'amai-bg-gpu';

/** Build the shared background container node (DOM fallback or GPU canvas). */
export function createAppBgContainer(gpuMode = false): HTMLDivElement {
  const div = document.createElement('div');
  div.className = `${APP_BG_CONTAINER_CLASS} ${APP_BG_CLASS}${gpuMode ? ` ${APP_BG_GPU_CLASS}` : ''}`;
  return div;
}

/** Host/helper classes + nav grid sync — the positioning contract both backends share. */
export function ensureAppBgHostClasses(host: Element): void {
  host.classList.add(APP_BG_HOST_HELPER_CLASS, APP_BG_HOST_CLASS);
  syncLibraryGridState(host);
}

/** Sync the opaque-library-grid class (see `APP_BG_LIB_GRID_CLASS`).
 * Exported so the toggle handler and observers can refresh it without a
 * full `apply()` — cheap single `querySelector` inside the nav column. */
export function syncLibraryGridState(scope?: ParentNode): void {
  const navBar = (scope ?? document).querySelector?.('.Root__nav-bar');
  if (!navBar) return;
  navBar.classList.toggle(APP_BG_LIB_GRID_CLASS, !!navBar.querySelector("[data-encore-id='card']"));
}
