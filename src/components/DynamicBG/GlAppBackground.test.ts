import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlAppBackground } from './GlAppBackground';

const COVER_URL = 'https://i.scdn.co/image/test-cover';

function createGlHarness() {
  const drawArrays = vi.fn();
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
    texImage2D: vi.fn(),
    drawArrays,
    viewport: vi.fn(),
    getExtension: vi.fn(() => null),
    deleteTexture: vi.fn(),
    deleteVertexArray: vi.fn(),
  };

  return { drawArrays, gl, sizeReads };
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

  it('draws again after 50 milliseconds', async () => {
    const { drawArrays } = await createBackground();
    expect(drawArrays).toHaveBeenCalledTimes(1);

    frameCallbacks.shift()!(10);
    expect(drawArrays).toHaveBeenCalledTimes(1);

    frameCallbacks.shift()!(50);
    expect(drawArrays).toHaveBeenCalledTimes(1);

    frameCallbacks.shift()!(60);
    expect(drawArrays).toHaveBeenCalledTimes(2);

    frameCallbacks.shift()!(70);
    expect(drawArrays).toHaveBeenCalledTimes(2);

    frameCallbacks.shift()!(110);
    expect(drawArrays).toHaveBeenCalledTimes(3);
  });

  it('never measures the canvas while the loop runs', async () => {
    const { drawArrays, sizeReads } = await createBackground();
    const readsAfterMount = { ...sizeReads };

    frameCallbacks.shift()!(10); // skipped
    frameCallbacks.shift()!(60); // drawn
    expect(drawArrays).toHaveBeenCalledTimes(2);
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
    expect(drawArrays).toHaveBeenCalledTimes(2);
  });
});
