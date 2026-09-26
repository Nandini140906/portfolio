// Soft, additive, twinkling point sprites.

export const galaxyVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTwinkle;

  attribute float aScale;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Twinkle: each particle gets its own frequency + phase from aSeed so they
    // never pulse in sync. Range [1 - uTwinkle, 1].
    float tw = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 6.2831));

    // Perspective size attenuation: size ∝ 1 / view-space depth
    // (mvPosition.z is negative in front of the camera).
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mvPosition.z);

    vColor = color;
    vTwinkle = tw;
  }
`;

export const galaxyFragmentShader = /* glsl */ `
  uniform float uIntensity;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Distance from sprite centre, 0 at centre → 0.5 at edge.
    float d = length(gl_PointCoord - 0.5);
    // Soft radial falloff; the high exponent gives a bright pin-point
    // with a faint halo, which bloom then spreads.
    float strength = pow(max(0.0, 1.0 - d * 2.0), 2.6);
    if (strength < 0.002) discard;

    gl_FragColor = vec4(vColor * strength * vTwinkle * uIntensity, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
