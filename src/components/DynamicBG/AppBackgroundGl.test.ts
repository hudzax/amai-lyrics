import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import storage from '../../utils/storage';

const { createGl } = vi.hoisted(() => ({ createGl: vi.fn() }));

vi.mock('./GlAppBackground', () => ({
  GlAppBackground: { create: createGl },
  GL_REVEAL_MS: 900,
}));

import { AppBackground, APP_BG_ON_CLASS, ensureAppBgHostClasses } from './AppBackground';

const COVER_A = 'https://i.scdn.co/image/aaa';
const COVER_B = 'https://i.scdn.co/image/bbb';

function setupHarness(): HTMLElement {
  document.body.innerHTML =
    '<div class="Root"><div id="global-nav-bar"></div><div class="Root__top-container"><div class="Root__main-view"><div class="main-view-container"></div></div></div><div class="Root__now-playing-bar"></div></div>';
  // The boot gate only checks the interface exists; the renderer module is
  // mocked, so no real WebGL2 context is ever created here.
  Object.defineProperty(window, 'WebGL2RenderingContext', {
    value: function WebGL2RenderingContext() {},
    configurable: true,
  });
  return document.querySelector<HTMLElement>('.Root')!;
}

function makeFakeGl() {
  const element = document.createElement('div');
  element.className = 'sweet-dynamic-bg amai-app-bg amai-bg-gpu';
  return {
    element,
    getElement: vi.fn(() => element),
    apply: vi.fn(),
    hasArtwork: vi.fn(() => true),
    // Faithful to GlAppBackground.reattach(): it re-tags the host via
    // ensureAppBgHostClasses BEFORE mounting. Without this the teardown
    // assertions below pass vacuously — the real reattach is what re-adds
    // the host classes after remove() stripped them.
    reattach: vi.fn((host: Element) => {
      ensureAppBgHostClasses(host);
      host.appendChild(element);
    }),
    remove: vi.fn(() => element.remove()),
  };
}

/** Flush the async boot: dynamic import + awaited create() + microtasks. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Park create() on a promise whose resolution mirrors the real implementation:
 * reattach() (host tagging + mount) runs BEFORE create() returns, i.e. before
 * bootGl's generation check. A deferred create that skips it makes the
 * teardown assertions pass vacuously — that omission hid the host-class leak.
 */
function deferCreate(gl: ReturnType<typeof makeFakeGl>): () => void {
  let resolveCreate: (() => void) | undefined;
  createGl.mockImplementation(
    (host: Element) =>
      new Promise((resolve) => {
        resolveCreate = () => {
          gl.reattach(host);
          resolve(gl);
        };
      }),
  );
  return () => {
    if (!resolveCreate) throw new Error('create() is not parked yet');
    resolveCreate();
  };
}

beforeEach(() => {
  setupHarness();
  storage.set('enable_app_background', 'true');
  document.documentElement.classList.remove(APP_BG_ON_CLASS);
  createGl.mockReset();
});

afterEach(() => {
  document.body.innerHTML = '';
  storage.set('enable_app_background', null);
  document.documentElement.classList.remove(APP_BG_ON_CLASS);
  delete (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext;
});

describe('AppBackground WebGL2 routing', () => {
  it('paints the DOM canvas immediately, then swaps in the GL canvas once booted', async () => {
    const gl = makeFakeGl();
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    // Synchronous DOM placeholder while the (async) boot is in flight.
    expect(document.querySelector('.amai-app-bg:not(.amai-bg-gpu)')).not.toBeNull();

    await settle();

    expect(createGl).toHaveBeenCalledTimes(1);
    expect(createGl.mock.calls[0][1]).toBe(COVER_A);
    const host = document.querySelector('.Root')!;
    expect(host.querySelector(':scope > .amai-bg-gpu')).toBe(gl.element);
    // The DOM placeholder stays up while the GL canvas fades in — removing it
    // at swap time is what made the background "snap" once the frame landed.
    expect(host.querySelector('.amai-app-bg:not(.amai-bg-gpu)')).not.toBeNull();

    // Reveal is 900ms (GL_REVEAL_MS) + 50ms margin; after it the placeholder is gone.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(host.querySelector('.amai-app-bg:not(.amai-bg-gpu)')).toBeNull();
  });

  it('routes subsequent song changes through the GL canvas without new DOM images', async () => {
    const gl = makeFakeGl();
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle();
    // Let the reveal finish so the DOM placeholder (which holds the DOM-path
    // crossfade <img>s) is gone before asserting the GL path creates none.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    bg.apply(COVER_B);
    expect(gl.apply).toHaveBeenCalledWith(COVER_B);
    expect(document.querySelectorAll('.amai-app-bg img').length).toBe(0);
  });

  it('remove() releases the GL canvas and allows a fresh boot on re-enable', async () => {
    const gl = makeFakeGl();
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle();
    bg.remove();
    expect(gl.remove).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.amai-bg-gpu')).toBeNull();
    expect(document.querySelector('.Root')!.classList.contains('amai-app-bg-host')).toBe(false);

    bg.apply(COVER_A);
    await settle();
    expect(createGl).toHaveBeenCalledTimes(2);
  });

  it('skips the boot entirely when WebGL2 is absent, with no console noise', async () => {
    delete (window as unknown as { WebGL2RenderingContext?: unknown }).WebGL2RenderingContext;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bg = new AppBackground();
    bg.apply(COVER_A);
    await settle();

    expect(createGl).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(document.querySelector('.amai-app-bg:not(.amai-bg-gpu)')).not.toBeNull();
    expect(document.querySelector('#amai-app-bg-img-a')).not.toBeNull();

    warn.mockRestore();
    errorSpy.mockRestore();
  });

  it('degrades quietly when the runtime cannot create a GL context', async () => {
    const contextFailure = new Error('WebGL2: context unavailable in this runtime');
    createGl.mockRejectedValue(contextFailure);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bg = new AppBackground();
    bg.apply(COVER_A);
    await settle();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('CSS');
    // The designed fallback stays on screen, and no retry is attempted.
    expect(document.querySelector('.amai-app-bg:not(.amai-bg-gpu)')).not.toBeNull();
    bg.apply(COVER_B);
    await settle();
    expect(createGl).toHaveBeenCalledTimes(1);

    warn.mockRestore();
    errorSpy.mockRestore();
  });

  it('still logs unexpected boot errors in full', async () => {
    createGl.mockRejectedValue(new TypeError('shader uniform uTime undefined'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bg = new AppBackground();
    bg.apply(COVER_A);
    await settle();

    expect(warn).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    warn.mockRestore();
    errorSpy.mockRestore();
  });

  it('tears down a canvas that finishes booting after remove() was called', async () => {
    const gl = makeFakeGl();
    const resolveCreate = deferCreate(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle(); // boot reaches create() and parks on the pending promise
    expect(createGl).toHaveBeenCalledTimes(1);
    bg.remove();
    expect(document.querySelector('.Root')!.classList.contains('amai-app-bg-host')).toBe(false);
    resolveCreate(); // real create() reattaches (re-tagging the host) first
    await settle();

    expect(gl.remove).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.amai-bg-gpu')).toBeNull();
    // Regression: create()'s reattach re-added these after remove() stripped
    // them, and gl.remove() only drops the container — the leaked
    // .amai-app-bg-host kept Spotify's surfaces transparent with no canvas.
    const host = document.querySelector('.Root')!;
    expect(host.classList.contains('amai-app-bg-host')).toBe(false);
    expect(host.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);
  });

  it('seeds the newest cover when a song changes before the renderer import lands', async () => {
    const gl = makeFakeGl();
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    bg.apply(COVER_B); // boot still waiting on the dynamic import
    await settle();

    // The seed must be B: seeding A here pins the previous track's colours
    // to the canvas until some later apply() happens to fire.
    expect(createGl.mock.calls[0][1]).toBe(COVER_B);
    expect(gl.apply).not.toHaveBeenCalled();
    bg.remove();
  });

  it('re-pushes the cover when the seed artwork fetch failed', async () => {
    const gl = makeFakeGl();
    gl.hasArtwork.mockReturnValue(false); // seed landed on the dark fallback
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle();

    // Same URL as the seed, but the seed never produced artwork — without
    // the push the canvas stays dark for the rest of the track.
    expect(gl.apply).toHaveBeenCalledTimes(1);
    expect(gl.apply).toHaveBeenCalledWith(COVER_A);
    bg.remove();
  });

  it('pushes a cover that changed mid-seed to the mounted canvas', async () => {
    const gl = makeFakeGl();
    const resolveCreate = deferCreate(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle(); // boot reached create() and parks on the pending promise
    expect(createGl.mock.calls[0][1]).toBe(COVER_A);
    bg.apply(COVER_B); // song change lands while the seed artwork is fetching
    resolveCreate();
    await settle();

    expect(gl.apply).toHaveBeenCalledTimes(1);
    expect(gl.apply).toHaveBeenCalledWith(COVER_B);
    bg.remove();
  });

  it('does not mount a canvas whose context was lost while it was still seeding', async () => {
    const gl = makeFakeGl();
    let resolveCreate: (value: ReturnType<typeof makeFakeGl>) => void;
    let onFail: (() => void) | undefined;
    // Deliberately NOT deferCreate(): after a context loss the real instance
    // is disposed, so its reattach() would early-return — resolving without
    // a re-tag is the faithful sequence here.
    createGl.mockImplementation(
      (_host: Element, _cover: string, opts: { onFail(): void }) =>
        new Promise((resolve) => {
          onFail = opts.onFail;
          resolveCreate = resolve;
        }),
    );
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle();
    expect(onFail).toBeDefined();
    onFail!(); // webglcontextlost before create() resolves
    resolveCreate!(gl);
    await settle();

    expect(gl.remove).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.amai-bg-gpu')).toBeNull();
    expect(gl.apply).not.toHaveBeenCalled();
    // The DOM fallback rebuilt by handleGlFail must survive the reveal
    // window — a stale boot completion used to detach it here and strand
    // the cache on a disposed canvas ('ready', no background, no retry).
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(document.querySelector('.amai-app-bg:not(.amai-bg-gpu)')).not.toBeNull();
    // ...and must KEEP its host classes: the stale-completion cleanup is
    // conditional on no background remaining, unlike the remove() race.
    expect(document.querySelector('.Root')!.classList.contains('amai-app-bg-host')).toBe(true);
    bg.apply(COVER_B);
    await settle();
    expect(createGl).toHaveBeenCalledTimes(1);
    expect(document.querySelector('#amai-app-bg-img-a')).not.toBeNull();
  });

  it('follows the lyrics page into fullscreen and back', async () => {
    const gl = makeFakeGl();
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle();
    // Finish the reveal so the DOM placeholder is gone — otherwise findAppBg
    // on .Root still finds it and legitimately keeps the host classes.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const root = document.querySelector('.Root')!;
    expect(root.querySelector(':scope > .amai-bg-gpu')).toBe(gl.element);

    // Fullscreen.Open() transfers the page to <body> and tags it .Fullscreen;
    // the fullscreen:open listener re-applies, and resolveAppBgHost now points
    // at the page — the canvas must move in with it (a .Root child would sit
    // behind the UA top layer, buried under Spotify's opaque UI).
    const page = document.createElement('div');
    page.id = 'AmaiLyricsPage';
    page.className = 'Fullscreen';
    document.body.appendChild(page);
    bg.apply(COVER_A);

    expect(page.querySelector(':scope > .amai-bg-gpu')).toBe(gl.element);
    expect(root.querySelector(':scope > .amai-bg-gpu')).toBeNull();
    expect(page.classList.contains('amai-app-bg-host')).toBe(true);
    // The vacated .Root releases its classes once the canvas has left it.
    expect(root.classList.contains('amai-app-bg-host')).toBe(false);
    expect(root.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);

    // Exit: the fullscreen:exit listener re-applies with the class gone.
    page.classList.remove('Fullscreen');
    bg.apply(COVER_A);

    expect(root.querySelector(':scope > .amai-bg-gpu')).toBe(gl.element);
    expect(root.classList.contains('amai-app-bg-host')).toBe(true);
    expect(page.classList.contains('amai-app-bg-host')).toBe(false);
    expect(page.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);
    expect(document.querySelectorAll('.amai-app-bg')).toHaveLength(1);
    bg.remove();
  });

  it('clears a placeholder stranded behind fullscreen when remove() cancels its reveal timer', async () => {
    const gl = makeFakeGl();
    createGl.mockResolvedValue(gl);
    const bg = new AppBackground();

    bg.apply(COVER_A);
    await settle(); // boot done; the DOM placeholder is still mid-reveal in .Root
    const root = document.querySelector('.Root')!;
    expect(root.querySelector(':scope > .amai-app-bg:not(.amai-bg-gpu)')).not.toBeNull();

    const page = document.createElement('div');
    page.id = 'AmaiLyricsPage';
    page.className = 'Fullscreen';
    document.body.appendChild(page);
    bg.apply(COVER_A); // canvas moves to the page; release skips — placeholder left
    expect(root.classList.contains('amai-app-bg-host')).toBe(true);

    bg.remove(); // cancels the placeholder's detach timer AND strips the page

    // Regression guard: remove() scanned only its own host (the page), so the
    // placeholder and .Root's classes stranded here — transparent Spotify UI
    // with a stale canvas behind the fullscreen page.
    expect(root.querySelector(':scope > .amai-app-bg')).toBeNull();
    expect(root.classList.contains('amai-app-bg-host')).toBe(false);
    expect(root.classList.contains('sweet-dynamic-bg-in-this')).toBe(false);
    expect(document.querySelector('.amai-bg-gpu')).toBeNull();
    expect(page.classList.contains('amai-app-bg-host')).toBe(false);
  });

  it('keeps shader compile failures visible instead of downgrading them', async () => {
    const compileError = new Error(
      'WebGL2 fragment shader failed to compile: ERROR: 0:1: unexpected token',
    );
    createGl.mockRejectedValue(compileError);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bg = new AppBackground();
    bg.apply(COVER_A);
    await settle();

    expect(warn).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][1]).toBe(compileError);

    warn.mockRestore();
    errorSpy.mockRestore();
  });
});
