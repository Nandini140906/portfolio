// Full-screen-quad shaders for the water inside the glass name card.

export const waterVertexShader = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

export const waterFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;       // canvas size in px
  uniform float uLevel;    // resting water height, 0 (bottom) → 1 (top)
  uniform float uTilt;     // surface slope from the card tilt (keeps water level)
  uniform float uSlosh;    // extra wave amplitude while the card is moving
  varying vec2 vUv;

  const float TAU = 6.28318530718;

  // Classic iterative water-caustic pattern (after "Tileable Water Caustic",
  // joltz0r / Dave Hoskins): repeatedly warp a point with sin/cos of itself
  // and accumulate 1/distance — the bright interference web of light on a pool floor.
  float caustic(vec2 uv, float t) {
    vec2 p = mod(uv * TAU, TAU) - 250.0;
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 8.0);
  }

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uv = vUv;
    float t = uTime;

    // Water surface: resting level + tilt compensation + two travelling waves
    // (different speeds/frequencies so the motion never looks periodic).
    float amp = 0.02 + uSlosh;
    float surface = uLevel
      + uTilt * (uv.x - 0.5)
      + sin(uv.x * 7.0 + t * 1.7) * amp
      + sin(uv.x * 15.0 - t * 2.4) * amp * 0.35;

    float below = smoothstep(surface + 0.006, surface - 0.006, uv.y);
    float depth = clamp((surface - uv.y) / max(surface, 0.001), 0.0, 1.0);

    vec3 col = vec3(0.0);
    float alpha = 0.0;

    // Water body: cool tint deepening toward the bottom.
    vec3 waterTint = mix(vec3(0.55, 0.68, 1.0), vec3(0.32, 0.42, 0.85), depth);
    col += waterTint * 0.16 * below;
    alpha += 0.16 * below;

    // Caustic light: warm peach near the surface → cool blue deeper down.
    vec2 cuv = vec2(uv.x * aspect, uv.y) * 0.9;
    float cz = caustic(cuv + vec2(0.0, t * 0.02), t * 0.55 + 23.0);
    vec3 causticCol = mix(vec3(1.0, 0.82, 0.68), vec3(0.7, 0.8, 1.0), depth);
    col += causticCol * cz * 0.55 * below;
    alpha += cz * 0.35 * below;

    // Meniscus: thin bright line where the surface meets the glass,
    // plus a soft glow just under it.
    float line = exp(-pow((uv.y - surface) * uRes.y / 1.6, 2.0));
    float underGlow = exp(-pow((surface - uv.y) * uRes.y / 14.0, 2.0)) * below;
    col += vec3(1.0, 0.9, 0.84) * (line * 0.5 + underGlow * 0.18);
    alpha += line * 0.4 + underGlow * 0.12;

    // Rising bubbles: small rings wobbling upward, popping at the surface.
    for (int k = 0; k < 9; k++) {
      float fk = float(k);
      float speed = 0.06 + hash(fk * 3.1) * 0.08;
      float bx = 0.08 + hash(fk * 7.3) * 0.84;
      float by = fract(t * speed + hash(fk * 1.7));
      bx += sin(t * 2.0 + fk) * 0.008;
      float yPos = by * surface;
      vec2 d = vec2((uv.x - bx) * aspect, uv.y - yPos) * uRes.y;
      float r = 2.0 + hash(fk * 5.9) * 3.0;
      float ring = smoothstep(1.2, 0.0, abs(length(d) - r));
      float fade = smoothstep(1.0, 0.85, by);
      col += vec3(0.95, 0.97, 1.0) * ring * 0.6 * fade;
      alpha += ring * 0.45 * fade;
    }

    // Faint moving reflection of the caustics above the waterline (light on glass).
    col += vec3(1.0, 0.9, 0.85) * cz * 0.08 * (1.0 - below);
    alpha += cz * 0.05 * (1.0 - below);

    alpha = clamp(alpha, 0.0, 1.0);
    // Premultiplied output (canvas is composited with premultipliedAlpha: true).
    gl_FragColor = vec4(col, alpha);
  }
`;
