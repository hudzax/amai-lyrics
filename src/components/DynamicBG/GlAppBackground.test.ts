import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlAppBackground } from './GlAppBackground';

const COVER_URL = 'https://i.scdn.co/image/test-cover';

function createGlHarness() {
  const drawArrays = vi.fn();
  const bindFramebuffer = vi.fn();
  const texImage2D = vi.fn();
  /** Counts layout reads — the loop measuring the canvas every frame is the regression. */
  const sizeReads = { width: 0, height: 0 };
  const gl = {
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    FRAGMENT_SHADER: 0x8b30,
    VERTEX_SHADER: 0x8b31,
    RGBA: 0x1908,
    RGBA8: 0x8058,
    UNSIGNED_BYTE: 0x1401,
    TEXTURE0: 0x84c0,
    TEXTURE1: 0x84c1,
    TEXTURE_2D: 0x0de1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812f,
    TRIANGLES: 0x0004,
    FRAMEBUFFER: 0x8d40,
    COLOR_ATTACHMENT0: 0x8ce0,
    FRAMEBUFFER_COMPLETE: 0x8cd5,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    getUniformLocation: vi.fn((_program: object, name: string) => ({ name })),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform4f: vi.fn(),
    activeTexture: vi.fn(),
    createVertexArray: vi.fn(() => ({})),
    bindVertexArray: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D,
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer,
    framebufferTexture2D: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 0x8cd5),
    deleteFramebuffer: vi.fn(),
    drawArrays,
    viewport: vi.fn(),
    getExtension: vi.fn(() => null),
    deleteTexture: vi.fn(),
    deleteVertexArray: vi.fn(),
  };

  return { bindFramebuffer, drawArrays, gl, sizeReads, texImage2D };
}

describe('GlAppBackground rendering budget', () => {
  const originalDevicePixelRatio = window.devicePixelRatio;
  let frameCallbacks: FrameRequestCallback[];
  let getContextSpy: ReturnType<typeof vi.spyOn> | undefined;
  let background: GlAppBackground | null = null;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let matchMediaDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    frameCallbacks = [];
    background = null;
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => ({}) })),
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ close: vi.fn() })),
    );
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      if (id > 0) frameCallbacks[id - 1] = () => {};
    });
  });

  afterEach(() => {
    background?.remove();
    background = null;
    getContextSpy?.mockRestore();
    vi.unstubAllGlobals();
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    if (matchMediaDescriptor) {
      Object.defineProperty(window, 'matchMedia', matchMediaDescriptor);
    } else {
      delete (window as { matchMedia?: typeof window.matchMedia }).matchMedia;
    }
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: originalDevicePixelRatio,
    });
  });

  async function createBackground() {
    const harness = createGlHarness();
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(function (this: HTMLCanvasElement) {
        Object.defineProperties(this, {
          clientWidth: {
            configurable: true,
            get: () => {
              harness.sizeReads.width += 1;
              return 100;
            },
          },
          clientHeight: {
            configurable: true,
            get: () => {
              harness.sizeReads.height += 1;
              return 50;
            },
          },
        });
        return harness.gl as unknown as WebGL2RenderingContext;
      });
    const host = document.createElement('div');
    document.body.appendChild(host);
    background = await GlAppBackground.create(host, COVER_URL, { onFail: vi.fn() });
    return { ...harness, background };
  }

  it('renders the backing store at BACKING_SCALE of the layout size', async () => {
    const { background } = await createBackground();
    const canvas = background.getElement().querySelector('canvas')!;

    // Budget pin, not arithmetic: 0.6 of the 1x-capped device pixels. Raise
    // BACKING_SCALE and these numbers move with it on purpose.
    expect(canvas.width).toBe(60);
    expect(canvas.height).toBe(30);
  });

  it('renders the field target below the backing store', async () => {
    const { gl, texImage2D } = await createBackground();

    // The whole point of the split: the expensive pass rasterises fewer pixels
    // than the canvas presents, so FIELD_SCALE must stay below BACKING_SCALE.
    // Budget pin — 0.35 of the 1x-capped device pixels.
    expect(texImage2D).toHaveBeenCalledWith(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      35,
      18,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
  });

  it('draws the field offscreen and presents it to the canvas', async () => {
    const { bindFramebuffer, drawArrays } = await createBackground();

    // create()'s reattach paints one synchronous frame: two passes, the first
    // into the field framebuffer and the second into the default one. If that
    // final null target ever goes missing the frame renders offscreen and the
    // canvas stays black.
    expect(drawArrays).toHaveBeenCalledTimes(2);
    const [fieldTarget, presentTarget] = bindFramebuffer.mock.calls.slice(-2);
    expect(fieldTarget[1]).toEqual(expect.any(Object));
    expect(presentTarget[1]).toBeNull();
  });

  it('asks for the strong adapter', async () => {
    await createBackground();

    expect(getContextSpy).toHaveBeenCalledWith(
      'webgl2',
      expect.objectContaining({ powerPreference: 'high-performance' }),
    );
  });

  it('watches the canvas for layout changes', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const { background } = await createBackground();
    const canvas = background.getElement().querySelector('canvas')!;

    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe.mock.calls[0][0]).toBe(canvas);
    observe.mockRestore();
  });

  it('draws on every display frame at 60 Hz', async () => {
    const { drawArrays } = await createBackground();
    expect(drawArrays).toHaveBeenCalledTimes(2); // reattach's single frame

    // The first tick only seeds the clock, so it never draws.
    frameCallbacks.shift()!(16.7);
    expect(drawArrays).toHaveBeenCalledTimes(2);

    for (const t of [33.4, 50.1, 66.8]) frameCallbacks.shift()!(t);
    // Three display frames, three draws, two passes each. The 1 ms epsilon on
    // the cadence gate is what lets a jittering 16.7 ms rAF through every time.
    expect(drawArrays).toHaveBeenCalledTimes(8);
  });

  it('caps the cadence below the display rate', async () => {
    const { drawArrays } = await createBackground();
    expect(drawArrays).toHaveBeenCalledTimes(2);

    // 240 Hz: four callbacks land inside one 60 fps interval, so none of them
    // may draw. An uncapped loop would rasterise the field four times over.
    for (const t of [4.2, 8.4, 12.6, 16.8]) frameCallbacks.shift()!(t);
    expect(drawArrays).toHaveBeenCalledTimes(2);
  });

  it('never measures the canvas while the loop runs', async () => {
    const { drawArrays, sizeReads } = await createBackground();
    const readsAfterMount = { ...sizeReads };

    frameCallbacks.shift()!(16.7); // seeds the clock, skipped
    frameCallbacks.shift()!(33.4); // both passes drawn
    expect(drawArrays).toHaveBeenCalledTimes(4);
    expect(sizeReads).toEqual(readsAfterMount);
  });

  it('still re-measures and repaints when the size changes', async () => {
    const { drawArrays, sizeReads } = await createBackground();
    // The loop no longer polls, so the resize handler is the only path from a
    // layout change to a new backing store — if it stops reading, nothing else
    // will notice.
    window.dispatchEvent(new Event('resize'));
    const redraw = frameCallbacks[frameCallbacks.length - 1]; // queued after the tick
    redraw(0);

    expect(sizeReads.width).toBe(2);
    expect(sizeReads.height).toBe(2);
    expect(drawArrays).toHaveBeenCalledTimes(4);
  });
});
