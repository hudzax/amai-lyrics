import { createAppBgContainer, ensureAppBgHostClasses } from './identity';
import { FIELD_FRAGMENT_SHADER, PRESENT_FRAGMENT_SHADER, VERTEX_SHADER } from './inkShader';

/**
 * WebGL2 app-frame background: a low-res field pass plus a present pass, no
 * rendering library.
 *
 * Owns its container/canvas (a `.sweet-dynamic-bg.amai-app-bg.amai-bg-gpu`
 * direct child of the app-frame host, same contract as the DOM fallback),
 * the GL context, the two artwork textures, the field framebuffer and the rAF
 * loop. Each frame renders the ink field into a small offscreen texture and
 * then presents it to the canvas with the film grain laid on top at output
 * resolution — see `inkShader` for why those two are separate programs.
 * Crossfade is a shader-side `uMix` blend between the two artwork textures, so
 * uploading the incoming artwork never blocks paint.
 *
 * WebGL2 (not WebGPU) is deliberate: Spotify's sandboxed Electron exposes
 * `navigator.gpu` but refuses the D3D12 DXC libraries, so a WebGPU device
 * can never be created there. WebGL runs through ANGLE/D3D11 and works.
 *
 * Only reachable through a dynamic import from `AppBackground` after a
 * WebGL2 probe succeeds, so GPU-less shells and jsdom tests never load it.
 */

/**
 * The shader looks artwork up through noise-driven palette coordinates, so
 * spatial detail is meaningless by design — a 32x32 RGBA source (~4 KB) is
 * plenty: linear upscale of that texture IS the blur, and the tiny size
 * guarantees even the lookup's local neighbourhood is pure colour mush
 * rather than anything readable from the cover.
 */
const ART_SIZE = 32;
const CROSSFADE_SECONDS = 1.6;
/**
 * Upper bound on the draw cadence, not a target: the loop is rAF-driven and
 * draws on every frame it is allowed to. On a 60 Hz panel that is every frame
 * — the 1 ms epsilon in `tick` absorbs rAF jitter so the gate never skips one.
 * The cap only bites on high-refresh displays, where an uncapped field pass
 * would cost proportionally more for drift the eye already reads as
 * continuous.
 */
const BG_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / BG_FPS;
/** Fixed warp position for prefers-reduced-motion (non-degenerate field). */
const STATIC_TIME = 9.5;
/** Clamp long rAF gaps (tab hidden, GC pause) so the warp never jumps. */
const MAX_FRAME_DT_MS = 1000 / 15;
/** Cap on backing-store pixels per CSS pixel: soft warped gradients need no more than 1x. */
const MAX_DPR = 1;
/**
 * Canvas backing store as a fraction of the layout size — the present pass's
 * output resolution, and the size of the texture the compositor copies (and
 * every backdrop-filter above it re-blurs) each frame.
 *
 * This no longer has to cover the field's detail, only the grain's: the field
 * arrives pre-blurred by the hardware upscale, so the knob now trades grain
 * crispness against compositor cost and nothing else. At 0.6 the grain is
 * ~1.7 CSS px wide rather than 1 — raise it toward 1 if the grain reads as
 * mush, drop it if the compositor is what shows up in profiling.
 */
const BACKING_SCALE = 0.6;
/**
 * Field framebuffer as a fraction of the layout size. The field is a soft
 * warped gradient whose finest real feature is a ~70 CSS px billow edge (fbm's
 * fourth octave, at 6% amplitude), so 0.35 still samples that with ~20 texels
 * per feature while rasterising a third of the fragments of a full-res pass.
 *
 * This is the knob that paid for the 60 fps cadence: fragment cost scales with
 * the square of it, so at 0.35 one field frame costs ~34% of what the old
 * single pass cost — which is exactly the headroom three times the frame rate
 * needed. Lower it further for weak GPUs; the visible failure is billow edges
 * turning blocky through the upscale, well before the grain (which is rendered
 * at `BACKING_SCALE` and untouched by this) does.
 */
const FIELD_SCALE = 0.35;
/**
 * Reveal fade duration. The canvas is only mounted once its first frame is
 * drawn, then fades in over the DOM placeholder underneath it; `AppBackground`
 * drops that placeholder after this much time has passed.
 */
export const GL_REVEAL_MS = 900;

async function loadArtworkBitmap(url: string): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await createImageBitmap(blob, {
      resizeWidth: ART_SIZE,
      resizeHeight: ART_SIZE,
      resizeQuality: 'high',
    });
  } catch {
    return null;
  }
}

export interface GlAppBackgroundOptions {
  /** Fired when the GL context is lost irrecoverably. The owner falls back to the DOM canvas. */
  onFail(): void;
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
  label: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error(`WebGL2: could not create ${label} shader`);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'no log';
    gl.deleteShader(shader);
    throw new Error(`WebGL2 ${label} shader failed to compile: ${log}`);
  }
  return shader;
}

/**
 * Compile + link one of the two programs. Both share the attribute-less
 * fullscreen-triangle vertex shader, so `label` only has to disambiguate the
 * fragment stage in the error that reaches `AppBackground.bootGl`.
 */
function buildProgram(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
  label: string,
): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER, `${label} vertex`);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
  const program = gl.createProgram();
  if (!program) throw new Error(`WebGL2: could not create the ${label} program`);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'no log';
    gl.deleteProgram(program);
    throw new Error(`WebGL2 ${label} program failed to link: ${log}`);
  }
  return program;
}

export class GlAppBackground {
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLDivElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly fieldProgram: WebGLProgram;
  private readonly presentProgram: WebGLProgram;
  private readonly fieldUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly presentUniforms: Record<string, WebGLUniformLocation | null>;
  private readonly vao: WebGLVertexArrayObject;
  /** Offscreen target the field pass renders into; the present pass samples it. */
  private readonly fieldTex: WebGLTexture;
  private readonly fieldFbo: WebGLFramebuffer;
  private texOld: WebGLTexture;
  private texCurrent: WebGLTexture;
  private readonly onFail: () => void;
  private readonly motionQuery: MediaQueryList;
  /** Reports the canvas's layout size so the loop never has to measure it. */
  private readonly sizeObserver: ResizeObserver;
  private motionEnabled: boolean;
  private rafId: number | null = null;
  /** Coalesces resize redraws to at most one per frame. */
  private resizeRafQueued = false;
  private lastTickMs = 0;
  private elapsed = 0;
  private mix = 0;
  private mixStart = 0;
  private crossfading = false;
  private loadToken = 0;
  private currentUrl: string | null = null;
  private backingW = 0;
  private backingH = 0;
  private fieldW = 0;
  private fieldH = 0;
  private mountedOnce = false;
  private disposed = false;

  private constructor(opts: GlAppBackgroundOptions) {
    this.onFail = opts.onFail;
    this.container = createAppBgContainer(true);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'amai-bg-canvas';
    this.container.appendChild(this.canvas);
    // Deliberately NOT mounted here: a canvas mounted empty shows a black
    // flash until artwork lands and the pipeline warms up. `create()` seeds
    // detached and `reattach()` mounts already painted.

    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      // Fill-rate bound, so ask for the strong adapter: 'low-power' pinned this
      // pass to the weakest GPU on a dual-GPU laptop. On a single-GPU machine
      // the hint is a no-op.
      powerPreference: 'high-performance',
      desynchronized: true,
    });
    if (!gl) throw new Error('WebGL2: context unavailable in this runtime');
    this.gl = gl;

    this.fieldProgram = buildProgram(gl, FIELD_FRAGMENT_SHADER, 'field');
    this.presentProgram = buildProgram(gl, PRESENT_FRAGMENT_SHADER, 'present');

    gl.useProgram(this.fieldProgram);
    this.fieldUniforms = {
      uFlowA: gl.getUniformLocation(this.fieldProgram, 'uFlowA'),
      uFlowB: gl.getUniformLocation(this.fieldProgram, 'uFlowB'),
      uBreath: gl.getUniformLocation(this.fieldProgram, 'uBreath'),
      uMix: gl.getUniformLocation(this.fieldProgram, 'uMix'),
      uAspect: gl.getUniformLocation(this.fieldProgram, 'uAspect'),
      uFieldSize: gl.getUniformLocation(this.fieldProgram, 'uFieldSize'),
      uTexOld: gl.getUniformLocation(this.fieldProgram, 'uTexOld'),
      uTexNew: gl.getUniformLocation(this.fieldProgram, 'uTexNew'),
    };
    // Texture units are constant for the program's lifetime.
    gl.uniform1i(this.fieldUniforms.uTexOld, 0);
    gl.uniform1i(this.fieldUniforms.uTexNew, 1);

    gl.useProgram(this.presentProgram);
    this.presentUniforms = {
      uField: gl.getUniformLocation(this.presentProgram, 'uField'),
      uGrainSeed: gl.getUniformLocation(this.presentProgram, 'uGrainSeed'),
      uResolution: gl.getUniformLocation(this.presentProgram, 'uResolution'),
    };
    gl.uniform1i(this.presentUniforms.uField, 0);

    // One VAO serves both programs: it carries no attributes (the fullscreen
    // triangle comes from gl_VertexID), and binding a program leaves the bound
    // VAO alone — so this is bound once here and never touched again.
    this.vao = gl.createVertexArray() ?? ({} as WebGLVertexArrayObject);
    gl.bindVertexArray(this.vao);

    this.fieldTex = this.createFieldTarget();
    this.fieldFbo = this.createFieldFramebuffer();

    this.texOld = this.createArtTexture();
    this.texCurrent = this.createArtTexture();

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionEnabled = !this.motionQuery.matches;

    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    document.addEventListener('visibilitychange', this.handleVisibility);
    // The window listener alone misses layout changes that don't resize the
    // window (nav collapse, the host transfer into fullscreen); the observer
    // covers those, and replaces the per-frame `clientWidth` read.
    this.sizeObserver = new ResizeObserver(this.handleResize);
    this.sizeObserver.observe(this.canvas);
    window.addEventListener('resize', this.handleResize, { passive: true });
    this.motionQuery.addEventListener('change', this.handleMotionChange);
  }

  /** Compile + seed detached; the first VISIBLE paint happens on reattach. Any failure throws — caller stays on the DOM path. */
  static async create(
    host: Element,
    coverUrl: string,
    opts: GlAppBackgroundOptions,
  ): Promise<GlAppBackground> {
    const glBg = new GlAppBackground(opts);
    try {
      await glBg.seedArtwork(coverUrl);
      // Mount last: reattach paints synchronously and fades in, so the
      // canvas is never visible empty or mid-warmup.
      glBg.reattach(host);
      glBg.ensureLoop();
      return glBg;
    } catch (error) {
      glBg.remove();
      throw error;
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  /**
   * False only while the boot seed fetch failed AND no `apply()` has run —
   * `AppBackground.bootGl` uses it to re-push the cover after mount, so a
   * transient artwork fetch failure doesn't pin the canvas to the dark seed
   * until the next track change.
   */
  public hasArtwork(): boolean {
    return this.currentUrl !== null;
  }

  public isApplied(): boolean {
    return !this.disposed && this.container.isConnected;
  }

  /**
   * Mount (or re-mount after a Spotify frame recreation) and paint
   * synchronously before the browser can present an empty buffer. The very
   * first mount on a live host fades in over whatever sits behind it —
   * during boot that is the DOM placeholder `AppBackground` keeps mounted
   * until the reveal completes.
   */
  public reattach(host: Element): void {
    if (this.disposed || this.container.parentElement === host) return;
    ensureAppBgHostClasses(host);
    host.appendChild(this.container);
    this.resizeBackingStore();
    this.drawFrame();
    if (!this.mountedOnce && host.isConnected) {
      this.mountedOnce = true;
      // Skip the fade under prefers-reduced-motion; `animate` is optional so
      // older engines / test stubs without WAAPI just appear instantly.
      if (this.motionEnabled) {
        this.container.animate?.([{ opacity: 0 }, { opacity: 1 }], {
          duration: GL_REVEAL_MS,
          easing: 'ease',
        });
      }
    }
  }

  /** Upload new artwork into the spare texture and start the shader crossfade. */
  public apply(coverUrl: string): void {
    if (this.disposed || coverUrl === this.currentUrl) return;
    this.currentUrl = coverUrl;
    const token = ++this.loadToken;
    void loadArtworkBitmap(coverUrl).then((bitmap) => {
      if (this.disposed || token !== this.loadToken) {
        bitmap?.close();
        return;
      }
      if (!bitmap) return; // keep the current artwork on fetch failure
      // Rapid skip mid-fade: snap the previous crossfade to its end first —
      // texCurrent is on screen right now and must not be overwritten live.
      if (this.crossfading) {
        this.mix = 1;
        this.finishCrossfade();
      }
      this.uploadArtwork(this.texCurrent, bitmap);
      bitmap.close();
      this.container.setAttribute('current-img', coverUrl);
      this.mixStart = this.elapsed;
      this.crossfading = true;
      this.ensureLoop();
    });
  }

  /** Stop the loop, release GL resources, detach the canvas. Idempotent. */
  public remove(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('resize', this.handleResize);
    this.sizeObserver.disconnect();
    this.motionQuery.removeEventListener('change', this.handleMotionChange);
    // Free the driver context eagerly — browsers cap concurrent contexts.
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl.deleteTexture(this.texOld);
    this.gl.deleteTexture(this.texCurrent);
    this.gl.deleteFramebuffer(this.fieldFbo);
    this.gl.deleteTexture(this.fieldTex);
    this.gl.deleteProgram(this.fieldProgram);
    this.gl.deleteProgram(this.presentProgram);
    this.gl.deleteVertexArray(this.vao);
    this.container.remove();
  }

  private createArtTexture(): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error('WebGL2: could not create texture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Linear filtering + clamped edges: the bilinear upscale IS the blur.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  /**
   * The field pass's render target. Linear filtering is what makes the upscale
   * free: the present pass's single tap interpolates between field texels in
   * hardware, so no explicit blur exists anywhere.
   *
   * Seeded at 1x1 purely so the framebuffer completeness check has storage to
   * attach — `resizeBackingStore` allocates the real size before the first draw.
   */
  private createFieldTarget(): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error('WebGL2: could not create the field texture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return tex;
  }

  /**
   * Attach the field target. RGBA8 is colour-renderable in WebGL2 core, so no
   * extension is involved and no fallback format is needed; anything short of
   * COMPLETE means the driver cannot honour a guaranteed format, and throwing
   * here keeps the caller on the DOM canvas exactly like a link failure does.
   */
  private createFieldFramebuffer(): WebGLFramebuffer {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error('WebGL2: could not create the field framebuffer');
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fieldTex, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!complete) throw new Error('WebGL2: the field framebuffer is incomplete');
    return fbo;
  }

  private texImage(source: TexImageSource | Uint8Array): void {
    const gl = this.gl;
    if (source instanceof Uint8Array) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        ART_SIZE,
        ART_SIZE,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
  }

  /**
   * Dark neutral seed so the canvas paints even before the first artwork lands.
   * A successful seed records `currentUrl` (dedup + `hasArtwork()`); a failed
   * one deliberately leaves it null so the owner re-pushes the cover.
   */
  private seedArtwork(coverUrl: string): Promise<void> {
    return loadArtworkBitmap(coverUrl).then((bitmap) => {
      this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
      if (!bitmap) {
        const dark = new Uint8Array(ART_SIZE * ART_SIZE * 4);
        for (let i = 0; i < ART_SIZE * ART_SIZE; i++) {
          dark[i * 4] = 28;
          dark[i * 4 + 1] = 28;
          dark[i * 4 + 2] = 34;
          dark[i * 4 + 3] = 255;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texOld);
        this.texImage(dark);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texCurrent);
        this.texImage(dark);
        return;
      }
      this.uploadArtwork(this.texOld, bitmap);
      this.uploadArtwork(this.texCurrent, bitmap);
      bitmap.close();
      this.currentUrl = coverUrl;
      this.container.setAttribute('current-img', coverUrl);
    });
  }

  private uploadArtwork(target: WebGLTexture, bitmap: ImageBitmap): void {
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_2D, target);
    this.texImage(bitmap);
  }

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('resize', this.handleResize);
    this.sizeObserver.disconnect();
    this.motionQuery.removeEventListener('change', this.handleMotionChange);
    this.container.remove();
    this.onFail();
  };

  private readonly handleVisibility = (): void => {
    if (this.disposed) return;
    if (document.hidden) this.stopLoop();
    else this.ensureLoop();
  };

  private readonly handleMotionChange = (): void => {
    if (this.disposed) return;
    this.motionEnabled = !this.motionQuery.matches;
    this.ensureLoop();
  };

  /**
   * Anything that changes the canvas's layout size (the observer for layout,
   * the window listener for zoom and monitor changes). Nothing else refreshes
   * either render target or `uAspect`/`uFieldSize`/`uResolution` — the draw
   * loop never measures the element, and under prefers-reduced-motion it idles
   * after one settled frame — so without this both passes would keep rendering
   * at the old size with a stale aspect until the next artwork. rAF-coalesced
   * so a drag-resize reallocates at most once per frame.
   */
  private readonly handleResize = (): void => {
    if (this.disposed || this.resizeRafQueued) return;
    this.resizeRafQueued = true;
    requestAnimationFrame(() => {
      this.resizeRafQueued = false;
      if (this.disposed) return;
      this.resizeBackingStore();
      this.drawFrame();
    });
  };

  private ensureLoop(): void {
    if (this.disposed || this.rafId !== null || document.hidden) return;
    this.lastTickMs = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private resizeBackingStore(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return; // detached — keep the last sizes
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const bw = Math.max(1, Math.round(w * dpr * BACKING_SCALE));
    const bh = Math.max(1, Math.round(h * dpr * BACKING_SCALE));
    const fw = Math.max(1, Math.round(w * dpr * FIELD_SCALE));
    const fh = Math.max(1, Math.round(h * dpr * FIELD_SCALE));
    if (bw === this.backingW && bh === this.backingH && fw === this.fieldW && fh === this.fieldH) {
      return;
    }
    this.backingW = bw;
    this.backingH = bh;
    this.fieldW = fw;
    this.fieldH = fh;
    this.canvas.width = bw;
    this.canvas.height = bh;

    const gl = this.gl;
    // Reallocating the storage leaves the framebuffer attachment intact: the
    // attachment names the texture object, not the allocation behind it.
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // Uniforms belong to a program, so each has to be current to be written.
    // Each pass sets its own viewport at draw time — nothing to do here.
    gl.useProgram(this.fieldProgram);
    gl.uniform2f(this.fieldUniforms.uFieldSize, fw, fh);
    gl.uniform1f(this.fieldUniforms.uAspect, w / h);
    gl.useProgram(this.presentProgram);
    gl.uniform2f(this.presentUniforms.uResolution, bw, bh);
  }

  /** One frame: the field into its framebuffer, then the field out to the canvas. */
  private drawFrame(): void {
    this.renderField();
    this.presentField();
  }

  /** Pass 1 — the expensive half, rasterised at `FIELD_SCALE` of the layout. */
  private renderField(): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fieldFbo);
    gl.viewport(0, 0, this.fieldW, this.fieldH);
    gl.useProgram(this.fieldProgram);
    this.computeFlow();
    gl.uniform1f(this.fieldUniforms.uMix, this.mix);
    // Both artwork textures re-bind every frame. That is correctness here, not
    // just tidiness: `presentField` leaves the field texture bound on unit 0,
    // and unit 0 must point somewhere else before this draw, because sampling
    // the texture a bound framebuffer renders into is a feedback loop.
    // `uploadArtwork` also leaves the active unit wherever it found it, and
    // finishing a crossfade relabels both objects.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texOld);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texCurrent);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Pass 2 — upscale the field and lay the grain down at output resolution. */
  private presentField(): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.backingW, this.backingH);
    gl.useProgram(this.presentProgram);
    const t = this.motionEnabled ? this.elapsed : STATIC_TIME;
    // GLSL fract() of a non-negative operand is JS's remainder operator.
    gl.uniform2f(this.presentUniforms.uGrainSeed, ((t * 0.7) % 1) * 43, ((t * 0.31) % 1) * 17);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * The field shader's frame-constant terms — wind, sway, luminance breath.
   * Each used to be evaluated once per pixel. Under `prefers-reduced-motion`
   * the field freezes because these are evaluated at the fixed `STATIC_TIME`
   * position instead of the accumulated drift.
   */
  private computeFlow(): void {
    const gl = this.gl;
    const t = this.motionEnabled ? this.elapsed : STATIC_TIME;
    gl.uniform4f(
      this.fieldUniforms.uFlowA,
      0.02 * t,
      -0.011 * t,
      Math.sin(t * 0.045) * 0.35,
      Math.cos(t * 0.033) * 0.35,
    );
    gl.uniform4f(
      this.fieldUniforms.uFlowB,
      -0.013 * t,
      0.008 * t,
      Math.sin(t * 0.028 + 1.9) * 0.3,
      Math.cos(t * 0.051 + 0.6) * 0.3,
    );
    gl.uniform1f(this.fieldUniforms.uBreath, 0.35 * (1 + 0.05 * Math.sin(t * 0.1)));
  }

  private readonly tick = (now: number): void => {
    if (this.disposed) return;
    if (this.lastTickMs === 0) this.lastTickMs = now;
    const delta = now - this.lastTickMs;
    if (delta < FRAME_INTERVAL_MS - 1) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }
    this.lastTickMs = now;
    this.elapsed += Math.min(delta, MAX_FRAME_DT_MS) / 1000;

    if (this.crossfading) {
      const p = Math.min(1, (this.elapsed - this.mixStart) / CROSSFADE_SECONDS);
      this.mix = p * p * (3 - 2 * p);
      if (p >= 1) this.finishCrossfade();
    }

    this.drawFrame();

    // Reduced motion: one settled frame is enough — idle the loop until the
    // next artwork or motion change.
    if (!this.motionEnabled && !this.crossfading) {
      this.rafId = null;
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  private finishCrossfade(): void {
    this.crossfading = false;
    this.mix = 0;
    // Retire the old texture as the incoming target, keep the new artwork base.
    const incoming = this.texOld;
    this.texOld = this.texCurrent;
    this.texCurrent = incoming;
  }
}
