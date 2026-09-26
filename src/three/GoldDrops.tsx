import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface GoldDropsProps {
  count?: number;
  /** Half-extents of the box the drops float in (world units). */
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
  varying float vPulse;
  void main() {
    vec3 p = position;
    // Slow independent float on each axis (seeded phase) so the drops drift
    // like dust in light, never in lockstep.
    p.x += sin(uTime * 0.17 + aSeed * 40.0) * 0.12;
    p.y += cos(uTime * 0.13 + aSeed * 23.0) * 0.16;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio / -mv.z;
    vColor = color;
    // Gentle breathing brightness, 0.55 → 1.
    vPulse = 0.55 + 0.45 * (0.5 + 0.5 * sin(uTime * (0.4 + aSeed * 0.6) + aSeed * 12.0));
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vPulse;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    // Drop of light: hot gaussian centre + wide soft halo (bloom spreads it further).
    float core = exp(-d * d * 55.0);
    float halo = exp(-d * d * 9.0) * 0.35;
    // Window to zero before the sprite edge so big drops never show a square.
    float a = (core + halo) * smoothstep(0.5, 0.3, d);
    if (a < 0.004) discard;
    // Centre runs slightly whiter than the rim, like a real glowing droplet.
    vec3 col = mix(vColor, vec3(1.0, 0.97, 0.88), core * 0.45);
    gl_FragColor = vec4(col * a * vPulse * uIntensity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Warm golden light-drops scattered across the whole screen at varied depths. */
export function GoldDrops({
  count = 140,
  extent = [9, 5, 5],
  colors = ["#ffc98a", "#ffb066", "#ffd9a0", "#ffe3b0"],
  size = 260,
  intensity = 1,
  animate = true,
  seed = 9,
}: GoldDropsProps) {
  const dpr = useThree((s) => s.viewport.dpr);

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
      // Mostly small bright drops, ~15% larger soft ones.
      scale[i] = rand() < 0.15 ? 0.9 + rand() * 0.8 : 0.25 + rand() * 0.4;
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
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </points>
  );
}
