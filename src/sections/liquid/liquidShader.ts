// Full-screen-quad shaders for the "dissolved liquid glass" inside the name card.

export const MAX_RIPPLES = 8;

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
  #define MAX_RIPPLES ${MAX_RIPPLES}

  uniform float uTime;
  uniform vec2 uRes;            // canvas size in px
  uniform vec2 uMouse;          // pointer in uv (0–1, y up)
  uniform float uHover;         // 0 → 1 while the pointer is over the card
  uniform vec3 uRipples[MAX_RIPPLES]; // (x, y, age in s); age < 0 = unused
  uniform vec2 uTilt;           // card rotation (deg) — shifts the light
  varying vec2 vUv;

  // --- value noise + fbm ---------------------------------------------------
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

  // Height of the liquid surface at p (aspect-corrected card coords).
  float height(vec2 p) {
    float t = uTime * 0.12;
    // Domain warping: fbm fed through fbm → slow, smoky, "dissolved" swirls.
    vec2 q = vec2(fbm(p * 0.7 + vec2(0.0, t)), fbm(p * 0.7 + vec2(5.2, -t)));
    float h = fbm(p * 0.8 + q * 1.5 + vec2(t * 0.6, 0.0)) * 0.42;

    vec2 m = vec2(uMouse.x * uRes.x / uRes.y, uMouse.y);
    float dm = length(p - m);
    // Hover: a soft lens-like bulge under the cursor.
    h += uHover * 0.35 * exp(-dm * dm * 18.0);

    // Ripples: outgoing damped rings, amplitude decays with age and distance.
    for (int k = 0; k < MAX_RIPPLES; k++) {
      vec3 r = uRipples[k];
      if (r.z < 0.0) continue;
      vec2 c = vec2(r.x * uRes.x / uRes.y, r.y);
      float d = length(p - c);
      float front = r.z * 0.55;                       // ring speed
      float env = exp(-pow((d - front) * 9.0, 2.0));  // band around the wavefront
      h += sin((d - front) * 60.0) * env * 0.06 * exp(-r.z * 1.6);
    }
    return h;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);

    // Surface normal from central differences of the height field.
    float e = 1.5 / uRes.y;
    float hx = height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0));
    float hy = height(p + vec2(0.0, e)) - height(p - vec2(0.0, e));
    vec3 n = normalize(vec3(-hx, -hy, 2.0 * e * 5.0));

    // Key light from top-left; card tilt swings it so highlights slide across the glass.
    vec3 L = normalize(vec3(-0.5 - uTilt.y * 0.03, 0.6 + uTilt.x * 0.03, 0.8));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(n, H), 0.0), 60.0);
    float sheen = pow(max(dot(n, H), 0.0), 8.0);

    // Slope magnitude: bright on steep flanks of the swirls = refraction-like
    // "caustic" veins where the liquid bends light most.
    float slope = length(vec2(hx, hy)) / e;
    float vein = smoothstep(0.2, 1.1, slope);

    // Iridescent tint: hue drifts with the normal (thin-film look), peach ↔ lavender ↔ blue.
    vec3 peach = vec3(1.0, 0.8, 0.68);
    vec3 lav = vec3(0.78, 0.74, 1.0);
    vec3 blue = vec3(0.6, 0.78, 1.0);
    float hue = 0.5 + 0.5 * sin(n.x * 9.0 + n.y * 6.0 + uTime * 0.2);
    vec3 tint = mix(mix(peach, lav, hue), blue, smoothstep(0.6, 1.0, hue) * 0.5);

    vec3 col = tint * (vein * 0.2 + sheen * 0.04) + vec3(1.0, 0.95, 0.9) * spec * 0.55;
    // A little extra glow under the cursor so hovering feels "lit".
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);
    col += peach * uHover * 0.08 * exp(-pow(length(p - m) * 5.0, 2.0));

    float alpha = clamp(max(max(col.r, col.g), col.b) * 1.1, 0.0, 1.0);
    // Premultiplied output.
    gl_FragColor = vec4(col, alpha);
  }
`;
