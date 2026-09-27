// Full-screen-quad shaders for the glass name card.
//
// Two layers in one pass:
//  1. the ambient "dissolved" swirl inside the glass (subtle, always on);
//  2. the card's text (a canvas copy of the DOM text), seen through a smooth
//     glass lens that follows the cursor — letters under it are gently
//     magnified and pick up a faint chrome sheen toward the lens rim.

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

  uniform float uTime;
  uniform vec2 uRes;          // canvas size in px
  uniform vec2 uMouse;        // smoothed pointer, uv (0–1, y up)
  uniform float uHover;       // 0 → 1 while the pointer is over the card
  uniform vec2 uTilt;         // card rotation (deg) — swings the highlights
  uniform sampler2D uText;    // premultiplied text layer (y already flipped)
  uniform float uHasText;
  varying vec2 vUv;

  const float LENS_R = 0.34;  // lens radius, in card-heights
  const float MAGNIFY = 0.22; // how much the centre of the lens enlarges

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

  // Slow domain-warped swirl — the "dissolved" liquid inside the glass.
  float swirl(vec2 p) {
    float t = uTime * 0.12;
    vec2 q = vec2(fbm(p * 0.7 + vec2(0.0, t)), fbm(p * 0.7 + vec2(5.2, -t)));
    return fbm(p * 0.8 + q * 1.5 + vec2(t * 0.6, 0.0)) * 0.42;
  }

  void main() {
    float asp = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * asp, vUv.y);
    float e = 1.5 / uRes.y;

    // ---- lens geometry ----
    vec2 m = vec2(uMouse.x * asp, uMouse.y);
    vec2 d = p - m;
    float r = length(d) / LENS_R;                 // 0 at centre → 1 at rim
    // Smooth dome profile: 1 in the middle, easing to 0 at the rim (no hard edge).
    float dome = uHover * (1.0 - smoothstep(0.0, 1.0, r));
    dome *= dome;
    // Lens surface normal: slope of the dome points away from the centre.
    vec2 lensSlope = r < 1.0 ? (d / max(length(d), 1e-4)) * uHover * smoothstep(0.15, 0.85, r) * (1.0 - smoothstep(0.85, 1.0, r)) : vec2(0.0);

    // ---- 1. ambient swirl ----
    float sx = swirl(p + vec2(e, 0.0)) - swirl(p - vec2(e, 0.0));
    float sy = swirl(p + vec2(0.0, e)) - swirl(p - vec2(0.0, e));
    vec2 hx = vec2(sx, sy);
    vec3 n = normalize(vec3(-hx, 2.0 * e * 5.0));

    vec3 L = normalize(vec3(-0.5 - uTilt.y * 0.03, 0.6 + uTilt.x * 0.03, 0.8));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, H), 0.0), 60.0);
    float sheen = pow(max(dot(n, H), 0.0), 8.0);
    float vein = smoothstep(0.2, 1.1, length(hx) / e);

    vec3 peach = vec3(1.0, 0.8, 0.68);
    vec3 lav = vec3(0.78, 0.74, 1.0);
    vec3 blue = vec3(0.6, 0.78, 1.0);
    float hue = 0.5 + 0.5 * sin(n.x * 9.0 + n.y * 6.0 + uTime * 0.2);
    vec3 tint = mix(mix(peach, lav, hue), blue, smoothstep(0.6, 1.0, hue) * 0.5);
    vec3 glassCol = tint * (vein * 0.2 + sheen * 0.04) + vec3(1.0, 0.95, 0.9) * spec * 0.55;

    // Lens highlight: a soft specular crescent on the upper-left of the drop,
    // like light catching a curved glass surface.
    vec3 ln = normalize(vec3(-lensSlope * 0.9, 1.0));
    float lensSpec = pow(max(dot(ln, H), 0.0), 40.0) * length(lensSlope);
    glassCol += vec3(1.0, 0.96, 0.92) * lensSpec * 0.35;
    float glassA = clamp(max(max(glassCol.r, glassCol.g), glassCol.b) * 1.1, 0.0, 1.0);

    if (uHasText < 0.5) { gl_FragColor = vec4(glassCol, glassA); return; }

    // ---- 2. text seen through the lens ----
    // Magnify: sample closer to the lens centre (pulls letters outward = bigger).
    vec2 off = -d * MAGNIFY * dome;
    off.x /= asp;
    vec4 txt = texture2D(uText, vUv + off);

    // Faint chrome sheen where the glass curves most (lens shoulder), never on
    // untouched text.
    float curve = length(lensSlope);
    vec3 chromeTint = mix(vec3(0.86, 0.86, 0.96), vec3(1.0, 0.9, 0.84), 0.5 + 0.5 * ln.y);
    vec3 txtCol = mix(txt.rgb, chromeTint * txt.a, curve * 0.35);
    txtCol += txt.a * vec3(1.0, 0.97, 0.94) * lensSpec * 0.4;

    // Text over glass (premultiplied "over").
    vec3 col = txtCol + glassCol * (1.0 - txt.a);
    float a = txt.a + glassA * (1.0 - txt.a);
    gl_FragColor = vec4(col, a);
  }
`;
