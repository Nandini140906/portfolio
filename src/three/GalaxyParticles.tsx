import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateGalaxy, type GalaxyBuffers, type GalaxyParams } from "./galaxy/generateGalaxy";
import { galaxyFragmentShader, galaxyVertexShader } from "./galaxy/galaxyShader";
import { scroll } from "./motionStore";

export interface GalaxyParticlesProps {
  /** Either spiral params for the default generator… */
  params?: GalaxyParams;
  /** …or pre-generated buffers from a custom generator (e.g. generateAndromeda). */
  buffers?: GalaxyBuffers;
  /** 0 = soft glowing blobs, 1 = crisp pin-point glitter. */
  sharpness?: number;
  /** Base point size before perspective attenuation. */
  size?: number;
  intensity?: number;
  /** 0 = steady, 1 = fully pulsing. */
  twinkle?: number;
  /** Auto-rotate speed, rad/s. */
  rotationSpeed?: number;
  /** Extra rotation (rad) added across full page scroll. */
  scrollSpin?: number;
  animate?: boolean;
  position?: [number, number, number];
  /** Tilt of the disc — applied on an outer group so spin stays around the disc's own axis. */
  tilt?: [number, number, number];
}

export function GalaxyParticles({
  params,
  buffers,
  sharpness = 0,
  size = 28,
  intensity = 1,
  twinkle = 0.35,
  rotationSpeed = 0.04,
  scrollSpin = 0.8,
  animate = true,
  position = [0, 0, 0],
  tilt = [0, 0, 0],
}: GalaxyParticlesProps) {
  const points = useRef<THREE.Points>(null);
  const spin = useRef(0);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const b = buffers ?? generateGalaxy(params!);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(b.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(b.colors, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(b.scales, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(b.seeds, 1));
    return g;
    // Params object identity changes every render; key the memo by value instead.
  }, [buffers, JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uPixelRatio: { value: dpr },
          uIntensity: { value: intensity },
          uTwinkle: { value: twinkle },
          uSharpness: { value: sharpness },
        },
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        // Deliberately NOT transparent: three.js only draws *opaque* objects into the
        // transmission buffer that MeshPhysicalMaterial samples, so this is what makes
        // the galaxy visible through the glass card. Additive blending still applies.
        transparent: false,
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps -- uniforms synced below
  );

  // Free GPU buffers when regenerated / unmounted.
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // Keep uniforms in sync with props without rebuilding the material.
  material.uniforms.uSize.value = size;
  material.uniforms.uPixelRatio.value = dpr;
  material.uniforms.uIntensity.value = intensity;
  material.uniforms.uTwinkle.value = animate ? twinkle : 0;
  material.uniforms.uSharpness.value = sharpness;

  useFrame((state, delta) => {
    if (!points.current || !animate) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    spin.current += delta * rotationSpeed;
    points.current.rotation.y = spin.current + scroll.progress * scrollSpin;
  });

  return (
    <group position={position} rotation={tilt}>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
