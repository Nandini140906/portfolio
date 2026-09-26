import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface BokehFieldProps {
  count?: number;
  /** Half-extents of the box the orbs float in. */
  extent?: [number, number, number];
  colors?: string[];
  size?: number;
  intensity?: number;
  animate?: boolean;
  seed?: number;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec3 p = position;
    // Slow independent drift on each axis (seeded phase) — orbs "breathe" in place.
    p.x += sin(uTime * 0.23 + aSeed * 40.0) * 0.05;
    p.y += cos(uTime * 0.19 + aSeed * 23.0) * 0.07;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio / -mv.z;
    vColor = color;
    vFade = 0.55 + 0.45 * sin(uTime * 0.5 + aSeed * 12.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    // Camera-lens bokeh: a flat disc with a soft edge and a slightly brighter rim.
    float disc = smoothstep(0.5, 0.36, d);
    float rim = smoothstep(0.22, 0.44, d) * 0.35;
    float a = disc * (0.55 + rim);
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * a * vFade * uIntensity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Out-of-focus warm light orbs drifting around the card. */
export function BokehField({
  count = 60,
  extent = [1.3, 1.8, 0.5],
  colors = ["#ffc9a3", "#ffb88a", "#ffdcc8", "#f6b6a0"],
  size = 90,
  intensity = 1,
  animate = true,
  seed = 3,
}: BokehFieldProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    let a = seed;
    const rand = () => ((a = (a * 16807) % 2147483647) - 1) / 2147483646;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const seeds = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() * 2 - 1) * extent[0];
      pos[i * 3 + 1] = (rand() * 2 - 1) * extent[1];
      pos[i * 3 + 2] = (rand() * 2 - 1) * extent[2];
      c.set(colors[Math.floor(rand() * colors.length)]);
      col.set([c.r, c.g, c.b], i * 3);
      // Mostly small pin-points, a few big soft discs.
      scale[i] = rand() < 0.2 ? 0.9 + rand() * 1.1 : 0.2 + rand() * 0.35;
      seeds[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [count, extent, colors, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSize: { value: size }, uPixelRatio: { value: dpr }, uIntensity: { value: intensity } }),
    [], // eslint-disable-line react-hooks/exhaustive-deps -- values synced below
  );
  uniforms.uSize.value = size;
  uniforms.uPixelRatio.value = dpr;
  uniforms.uIntensity.value = intensity;

  useFrame((s) => {
    if (animate) uniforms.uTime.value = s.clock.elapsedTime;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        // Transparent → drawn after the glass, so orbs in front of the card stay crisp
        // while ones behind it are occluded and seen only through the frosted glass.
        transparent
      />
    </points>
  );
}
