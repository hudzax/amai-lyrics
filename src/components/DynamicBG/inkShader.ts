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
 *   with `uTime = STATIC_TIME` (reduced motion) every term freezes into a
 *   non-degenerate still.
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
 * `uv` is top-origin (v grows downward): `gl_FragCoord` is flipped once
 * here, matching the artwork upload orientation, so the rest needs no flips.
 *
 * Cost note: 8 four-octave fBm evaluations per pixel (warp ×4, palette ×2,
 * density ×2) inside one pass at 30 fps / DPR ≤ 1.5 — same budget class as
 * the previous 4-evaluation design; drop a density layer first if a
 * low-end GPU ever shows up in profiling.
 */
export const VERTEX_SHADER = `#version 300 es
// Attribute-less fullscreen triangle: positions from gl_VertexID, no buffers.
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uMix;
uniform float uAspect;
uniform float uWidth;
uniform float uHeight;
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

void main() {
  vec2 uv = vec2(gl_FragCoord.x, uHeight - gl_FragCoord.y) / vec2(uWidth, uHeight);
  vec2 st = (uv - 0.5) * vec2(uAspect, 1.0);

  // ---- flow: one mass of ink moving as a whole ------------------------
  // Steady glacial wind + bounded sine-eased meander per layer. Motion
  // level is deliberately unchanged from the old design; only the FORM is
  // new — the abstraction comes from shape, not speed.
  float s = uTime;
  vec2 wind1 = vec2(0.020, -0.011) * s;
  vec2 sway1 = vec2(sin(s * 0.045), cos(s * 0.033)) * 0.35;
  vec2 wind2 = vec2(-0.013, 0.008) * s;
  vec2 sway2 = vec2(sin(s * 0.028 + 1.9), cos(s * 0.051 + 0.6)) * 0.30;

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
  vec2 palCoord = clamp(
    vec2(
      fbm(p * 0.55 + r + wind1 + 3.7),
      fbm(p * 0.55 - r.yx + wind2 + 7.1)
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
  col *= 0.35 * (1.0 + 0.05 * sin(s * 0.10));
  col *= 1.0 + 0.10 * (r.x - 0.5);

  // Top/bottom legibility scrims — same contract as the old CSS ::after.
  float scrim = mix(0.42, 1.0,
    smoothstep(0.0, 0.20, uv.y) * (1.0 - smoothstep(0.74, 0.97, uv.y)));
  col *= scrim;
  col *= 1.0 - 0.28 * smoothstep(0.35, 1.15, length(st));

  // ---- film grain, weighted into the shadows where banding lives -------
  float lum2 = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float g = hash(gl_FragCoord.xy + vec2(fract(s * 0.70) * 43.0, fract(s * 0.31) * 17.0)) - 0.5;
  col += g * mix(0.020, 0.006, smoothstep(0.0, 0.45, lum2));

  outColor = vec4(max(col, 0.0), 1.0);
}
`;
