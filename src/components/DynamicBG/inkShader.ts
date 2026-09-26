/**
 * GLSL ES 3.00 shaders for the WebGL2 app-frame background: "ink diffusion".
 *
 * The goal is abstraction — fluid ink/smoke, not a picture of anything:
 *
 * - Palette only: artwork is looked up through coordinates derived from the
 *   noise field, never from screen position. The mapping sweeps the whole
 *   texture across the frame without ever corresponding to the image, so
 *   only the cover's COLOURS survive — no composition, no readable shapes.
 *   The source is a tiny 32x32 bitmap (`ART_SIZE` in `GlAppBackground`), so
 *   even the lookup's local detail is pure colour mush.
 * - Form: an isotropic double domain warp (the old anisotropic stretch that
 *   made horizontal "silk ribbons" is gone) plus two warped fBm density
 *   layers at different scales, thresholded into soft billows — clouds of
 *   pigment suspended in a dark medium, with no linework or filigree.
 * - Motion: unchanged from the old design — a steady glacial wind plus
 *   bounded, sine-eased meander per warp layer (coprime periods). The ink
 *   drifts as one mass, never scrolls mechanically, never repeats visibly;
 *   when the caller evaluates the flow uniforms at `STATIC_TIME`
 *   (`GlAppBackground`) every term freezes into a non-degenerate still.
 * - Crossfade: a flow-and-luminance-ordered soft dissolve ("veils") whose
 *   threshold is exactly 0 at `uMix = 0` and 1 at `uMix = 1` for every
 *   pixel, preserving the frame-identical ping-pong swap contract in
 *   `GlAppBackground`. Do not perturb the `thr`/`soft` bounds — the swap
 *   only lands frame-identical while that holds.
 * - Legibility: the fullscreen pass bakes what the CSS pipeline used to do
 *   with filters/scrims — the same top/bottom legibility scrims as the old
 *   `.amai-app-bg::after` gradient, a soft vignette, and film grain
 *   weighted into the shadows where broad gradients would band.
 *
 * Chosen over WebGPU/vgpu because Spotify's sandboxed Electron cannot build
 * a D3D12 WebGPU device (dxil.dll load refused) — WebGL goes through
 * ANGLE/D3D11 and works there.
 *
 * TWO PROGRAMS, because the frame's two halves have opposite resolution
 * needs. The field's finest real feature is a ~70 CSS px billow edge (fbm's
 * fourth octave, at 6% amplitude); the grain's is one pixel. Welding them
 * into a single pass forced one resolution knob to serve both, which is what
 * made a 60 fps cadence look unaffordable:
 *
 * - `FIELD_FRAGMENT_SHADER` renders the warp/density/palette field, the grade
 *   and the scrims into a small offscreen texture (`FIELD_SCALE` in
 *   `GlAppBackground`) — about a third of the fragments of a full-res pass.
 * - `PRESENT_FRAGMENT_SHADER` samples that texture (bilinear upscale is free
 *   in hardware) and adds the grain at output resolution. One texture tap and
 *   one hash per pixel, so the expensive half and the frame rate are now
 *   independent knobs.
 *
 * Both passes address pixels through `gl_FragCoord`, which is bottom-origin in
 * GL. The field pass flips it once to match the artwork upload orientation, so
 * its `uv` is top-origin; the present pass does not flip, because the field
 * texture was RENDERED rather than uploaded and so already shares that
 * orientation — sampling `gl_FragCoord / uResolution` lines up row for row.
 *
 * Cost note: the field is 8 fBm evaluations per pixel (warp x4 and density x2
 * at four octaves, palette x2 at two). Everything constant across the frame —
 * the winds, the sways, the global breath, the grain seed — is a uniform
 * computed once per frame by `GlAppBackground`, not per pixel. The pass is
 * still fill-rate bound, so the budget knobs live next to it: `FIELD_SCALE`
 * (the field's cost), `BACKING_SCALE` (the present pass's and the compositor's)
 * and `BG_FPS`. If a low-end GPU ever shows up in profiling, drop a density
 * layer from the field first — it is now the only expensive thing per frame.
 */
export const VERTEX_SHADER = `#version 300 es
// Attribute-less fullscreen triangle: positions from gl_VertexID, no buffers.
// Shared by both programs, so neither needs a vertex buffer or attributes.
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

/**
 * Pass 1 — the ink field, rendered into the low-res framebuffer.
 * Everything except the film grain lives here. Output is the graded,
 * scrimmed, vignetted colour, ready for the present pass to add grain to.
 */
export const FIELD_FRAGMENT_SHADER = `#version 300 es
precision highp float;

// Frame-constant flow terms. Each one is identical for every pixel and used to
// be recomputed per fragment; see GlAppBackground.computeFlow for the values.
uniform vec4 uFlowA; // wind1.xy, sway1.xy
uniform vec4 uFlowB; // wind2.xy, sway2.xy
uniform float uBreath; // global luminance breath, incl. the base dim
uniform float uMix;
uniform float uAspect; // LAYOUT aspect, not the field texture's
uniform vec2 uFieldSize; // field framebuffer, in pixels
uniform sampler2D uTexOld;
uniform sampler2D uTexNew;

out vec4 outColor;

float hash(vec2 p) {
  vec2 q = fract(p * vec2(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(q);
    q = q * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// Two octaves instead of four, renormalised to fbm()'s value range (its weights
// sum to 0.75 against fbm()'s 0.9375, hence the 1.25) so callers see the same
// distribution and only lose the sub-detail.
float fbmLow(vec2 p) {
  float v = 0.0;
  vec2 q = p;
  v += 0.5 * vnoise(q);
  q = q * 2.03 + vec2(1.7, 9.2);
  v += 0.25 * vnoise(q);
  return v * 1.25;
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x, uFieldSize.y - gl_FragCoord.y) / uFieldSize;
  vec2 st = (uv - 0.5) * vec2(uAspect, 1.0);

  // ---- flow: one mass of ink moving as a whole ------------------------
  // Steady glacial wind + bounded sine-eased meander per layer. Motion
  // level is deliberately unchanged from the old design; only the FORM is
  // new — the abstraction comes from shape, not speed. Both terms are
  // frame-constant, so the CPU evaluates the sines (see uFlowA/uFlowB).
  vec2 wind1 = uFlowA.xy;
  vec2 sway1 = uFlowA.zw;
  vec2 wind2 = uFlowB.xy;
  vec2 sway2 = uFlowB.zw;

  // ---- form: isotropic double domain warp (marbling, no ribbons) ------
  // No anisotropic stretch: the ink curls in all directions instead of
  // being pulled into horizontal bands.
  vec2 p = st;
  vec2 q = vec2(
    fbm(p + wind1 + sway1),
    fbm(p + vec2(5.2, 1.3) + wind2 + sway2)
  );
  vec2 r = vec2(
    fbm(p + 1.60 * q + vec2(1.7, 9.2) + wind2.yx + sway1.yx),
    fbm(p + 1.60 * q + vec2(8.3, 2.8) - wind1.yx + sway2.xy)
  );

  // ---- palette-only artwork lookup ------------------------------------
  // Lookup coordinates come from noise (+ the warp field for coherence),
  // never from screen position: neighbouring pixels land on nearby palette
  // texels (coherent colour masses), but no screen-to-image correspondence
  // exists — the cover's imagery and composition cannot survive the trip.
  // fbmLow, not fbm: the target is a 32x32 texture that is bilinear-upscaled,
  // so the two finest octaves only jitter the coordinate inside one texel —
  // cost that the source resolution throws away.
  vec2 palCoord = clamp(
    vec2(
      fbmLow(p * 0.55 + r + wind1 + 3.7),
      fbmLow(p * 0.55 - r.yx + wind2 + 7.1)
    ),
    vec2(0.003),
    vec2(0.997)
  );
  vec3 oldC = texture(uTexOld, palCoord).rgb;
  vec3 newC = texture(uTexNew, palCoord).rgb;

  // ---- crossfade: coherent veil dissolve ------------------------------
  // Exact endpoints (w=0 at uMix=0, w=1 at uMix=1 for EVERY pixel) keep the
  // ping-pong swap frame-identical. Thresholds ride the warp field + the
  // outgoing cover's luminance, so the fade travels as coherent veils that
  // follow the flow; per-cell jitter stays tiny (no salt-and-pepper).
  // The cell is measured in FIELD texels, so its on-screen size scales with
  // FIELD_SCALE — coarser than the old single-pass grain, still far below the
  // veil width, and the endpoint contract above does not depend on it.
  float lold = dot(oldC, vec3(0.2126, 0.7152, 0.0722));
  float cell = hash(floor(gl_FragCoord.xy / 3.0) + 7.7);
  float soft = 0.32;
  float nFlow = smoothstep(0.30, 0.70, r.x);
  float nLum = smoothstep(0.05, 0.55, lold);
  float thr = clamp(nFlow * 0.55 + nLum * 0.39 + cell * 0.06, 0.0, 1.0) * (1.0 - soft);
  float w = smoothstep(thr, thr + soft, uMix);
  vec3 pigment = mix(oldC, newC, w);

  // ---- ink: billows of pigment suspended in a dark medium -------------
  // Two warped density layers at different scales, thresholded softly —
  // cloud edges, never the old contour veins (filigree removed on purpose:
  // linework reads as structure, not abstraction). The pigment boost
  // offsets the medium blend to keep the old pipeline's mean luminance, so
  // legibility is unchanged.
  float dBig = fbm(p * 1.15 + 1.35 * q + wind1 + sway2);
  float dFine = fbm(p * 2.40 + vec2(4.7, 2.9) - 1.10 * r + wind2);
  float dens = smoothstep(0.20, 0.66, mix(dBig, dFine, 0.35));
  vec3 medium = vec3(0.045, 0.045, 0.062);
  vec3 col = mix(medium, pigment * 1.5, dens);

  // ---- grade: deep blacks, one slow global breath ---------------------
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, 1.22);
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.55);
  col *= uBreath;
  col *= 1.0 + 0.10 * (r.x - 0.5);

  // Top/bottom legibility scrims — same contract as the old CSS ::after.
  float scrim = mix(0.42, 1.0,
    smoothstep(0.0, 0.20, uv.y) * (1.0 - smoothstep(0.74, 0.97, uv.y)));
  col *= scrim;
  col *= 1.0 - 0.28 * smoothstep(0.35, 1.15, length(st));

  // The breath and the scrims keep this well under 1.0, so an RGBA8 target
  // costs no range the old single-pass output did not already quantise away.
  outColor = vec4(max(col, 0.0), 1.0);
}
`;

/**
 * Pass 2 — the present. Samples the field texture (hardware bilinear does the
 * upscale) and adds the film grain at output resolution.
 *
 * This is the entire reason the field can run at a ninth of the pixels: the
 * grain is the frame's anti-banding device and its only 1-px feature, so it
 * has to be evaluated where it will be seen, not downsampled with everything
 * else.
 */
export const PRESENT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uField;
uniform vec2 uGrainSeed; // per-frame grain offset
uniform vec2 uResolution; // canvas backing store, in pixels

out vec4 outColor;

float hash(vec2 p) {
  vec2 q = fract(p * vec2(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

void main() {
  vec3 col = texture(uField, gl_FragCoord.xy / uResolution).rgb;

  // Grain weighted into the shadows where banding lives. It rides the FIELD's
  // own luminance — the same value the single-pass shader used — so the two
  // passes cannot drift apart in how much noise they lay down.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float g = hash(gl_FragCoord.xy + uGrainSeed) - 0.5;
  col += g * mix(0.020, 0.006, smoothstep(0.0, 0.45, lum));

  outColor = vec4(max(col, 0.0), 1.0);
}
`;
