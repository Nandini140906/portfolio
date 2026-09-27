// Full-screen-quad shaders for the liquid-chrome glass card.
//
// Two layers in one pass:
//  1. the ambient "dissolved" swirl inside the glass (subtle, always on);
//  2. the card's text (a canvas copy of the DOM text) which melts like liquid
//     metal along the cursor's wake — displaced, and tinted iridescent chrome
//     wherever it's bent — then settles back to crisp type.

export const MAX_TRAIL = 18;

export const liquidVertexShader = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

export const liquidFragmentShader = /* glsl */ `
  precision highp float;
  #define MAX_TRAIL ${MAX_TRAIL}

  uniform float uTime;
  uniform vec2 uRes;               // canvas size in px
  uniform vec2 uMouse;             // smoothed pointer, uv (0–1, y up)
  uniform float uHover;            // 0 → 1 while the pointer is over the card
  uniform vec4 uTrail[MAX_TRAIL];  // wake blobs: (x, y, strength 0–1, radius)
  uniform vec2 uTilt;              // card rotation (deg) — swings the highlights
  uniform sampler2D uText;         // premultiplied text layer (y already flipped)
  uniform float uHasText;
  varying vec2 vUv;

  // --- value noise + fbm (ambient swirl) ---------------------------------
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }

  float aspect() { return uRes.x / uRes.y; }

  // Slow domain-warped swirl — the "dissolved" liquid inside the glass.
  float swirl(vec2 p) {
    float t = uTime * 0.12;
    vec2 q = vec2(fbm(p * 0.7 + vec2(0.0, t)), fbm(p * 0.7 + vec2(5.2, -t)));
    return fbm(p * 0.8 + q * 1.5 + vec2(t * 0.6, 0.0)) * 0.42;
  }

  // Cursor wake: a sum of soft gaussian bumps along the recent pointer path,
  // plus a bulge under the (lagging) cursor. Units: card-height.
  float wake(vec2 p) {
    float h = 0.0;
    vec2 m = vec2(uMouse.x * aspect(), uMouse.y);
    vec2 dm = p - m;
    h += uHover * 0.18 * exp(-dot(dm, dm) / 0.012);
    for (int k = 0; k < MAX_TRAIL; k++) {
      vec4 b = uTrail[k];
      if (b.z <= 0.0) continue;
      vec2 d = p - vec2(b.x * aspect(), b.y);
      // Slight wobble so the wake reads as liquid, not a rigid lens.
      float wob = 1.0 + 0.25 * sin(dot(d, vec2(40.0, 33.0)) + uTime * 3.0);
      h += b.z * wob * exp(-dot(d, d) / (b.w * b.w));
    }
    return h;
  }

  // Iridescent chrome: silver base with lavender/blue/peach bands that follow
  // the surface normal, like the reference's liquid-metal letters.
  vec3 chrome(vec3 n, float t) {
    float band = n.x * 1.6 + n.y * 2.3 + t;
    vec3 irid = 0.5 + 0.5 * cos(6.28318 * (band + vec3(0.0, 0.18, 0.4)));
    vec3 silver = mix(vec3(0.42, 0.44, 0.55), vec3(0.95, 0.95, 1.0), 0.5 + 0.5 * n.y);
    vec3 tint = mix(vec3(0.78, 0.74, 1.0), vec3(1.0, 0.84, 0.76), irid.x);
    return mix(silver, silver * tint * 1.25, 0.55) + irid * 0.08;
  }

  void main() {
    float asp = aspect();
    vec2 p = vec2(vUv.x * asp, vUv.y);
    float e = 1.5 / uRes.y;

    // ---- 1. ambient swirl ----
    float sx = swirl(p + vec2(e, 0.0)) - swirl(p - vec2(e, 0.0));
    float sy = swirl(p + vec2(0.0, e)) - swirl(p - vec2(0.0, e));
    // ---- wake gradient ----
    float wx = wake(p + vec2(e, 0.0)) - wake(p - vec2(e, 0.0));
    float wy = wake(p + vec2(0.0, e)) - wake(p - vec2(0.0, e));
    vec2 wg = vec2(wx, wy) / (2.0 * e);            // true slope of the wake

    vec2 hx = vec2(sx, sy) + vec2(wx, wy) * 0.35;
    vec3 n = normalize(vec3(-hx, 2.0 * e * 5.0));

    vec3 L = normalize(vec3(-0.5 - uTilt.y * 0.03, 0.6 + uTilt.x * 0.03, 0.8));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, H), 0.0), 60.0);
    float sheen = pow(max(dot(n, H), 0.0), 8.0);
    float slope = length(hx) / e;
    float vein = smoothstep(0.2, 1.1, slope);

    vec3 peach = vec3(1.0, 0.8, 0.68);
    vec3 lav = vec3(0.78, 0.74, 1.0);
    vec3 blue = vec3(0.6, 0.78, 1.0);
    float hue = 0.5 + 0.5 * sin(n.x * 9.0 + n.y * 6.0 + uTime * 0.2);
    vec3 tint = mix(mix(peach, lav, hue), blue, smoothstep(0.6, 1.0, hue) * 0.5);
    vec3 glassCol = tint * (vein * 0.2 + sheen * 0.04) + vec3(1.0, 0.95, 0.9) * spec * 0.55;
    float glassA = clamp(max(max(glassCol.r, glassCol.g), glassCol.b) * 1.1, 0.0, 1.0);

    if (uHasText < 0.5) { gl_FragColor = vec4(glassCol, glassA); return; }

    // ---- 2. liquid-chrome text ----
    // Refraction: sample the text through the wake surface. Offset ∝ slope,
    // converted to uv (x divided by aspect).
    vec2 off = -wg * 0.028;
    off.x /= asp;
    // Mild chromatic split where it bends — the rainbow fringe on liquid metal.
    float bend = clamp(length(wg) * 0.9, 0.0, 1.0);
    vec2 ca = off * 0.18 * bend;
    vec4 tR = texture2D(uText, vUv + off + ca);
    vec4 tG = texture2D(uText, vUv + off);
    vec4 tB = texture2D(uText, vUv + off - ca);
    vec4 txt = vec4(tR.r, tG.g, tB.b, max(tG.a, max(tR.a, tB.a)));

    // Chrome where the wake bends the letters, fading back to the true colour.
    float chromeAmt = smoothstep(0.08, 0.7, bend);
    vec3 wn = normalize(vec3(-wg * 0.25, 1.0));
    vec3 metal = chrome(wn, uTime * 0.15) * (0.75 + 0.6 * pow(max(dot(wn, H), 0.0), 20.0));
    // txt is premultiplied: recolour = metal × coverage.
    vec3 txtCol = mix(txt.rgb, metal * txt.a, chromeAmt);

    // Text over glass (premultiplied "over").
    vec3 col = txtCol + glassCol * (1.0 - txt.a);
    float a = txt.a + glassA * (1.0 - txt.a);
    gl_FragColor = vec4(col, a);
  }
`;
