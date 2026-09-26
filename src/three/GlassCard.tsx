import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { scroll } from "./motionStore";

export interface GlassCardProps {
  size?: [number, number, number];
  radius?: number;
  roughness?: number;
  thickness?: number;
  ior?: number;
  position?: [number, number, number];
  animate?: boolean;
  /** World units the card rises across full page scroll. */
  scrollLift?: number;
  isMobile?: boolean;
}

export function GlassCard({
  size = [4.4, 2.8, 0.3],
  radius = 0.16,
  roughness = 0.15,
  thickness = 0.12,
  ior = 1.3,
  position = [0, 0, 0],
  animate = true,
  scrollLift = 0.6,
  isMobile = false,
}: GlassCardProps) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = animate ? state.clock.elapsedTime : 0;
    // Idle float: slow bob + micro-rotation on incommensurate frequencies so the
    // motion never visibly loops.
    g.position.y = position[1] + Math.sin(t * 0.6) * 0.06 + scroll.progress * scrollLift;
    g.rotation.x = Math.sin(t * 0.43) * 0.025 - scroll.progress * 0.15;
    g.rotation.y = Math.sin(t * 0.31) * 0.04 + scroll.progress * 0.25;
    g.rotation.z = Math.sin(t * 0.27) * 0.01;
  });

  return (
    <group ref={group} position={position}>
      <RoundedBox args={size} radius={radius} smoothness={6} bevelSegments={6}>
        {/*
          drei's MeshTransmissionMaterial = MeshPhysicalMaterial (transmission: 1)
          plus a proper multi-sample frosted blur of what's behind it. The stock
          transmission blur samples a low mip level, which smeared the galaxy core
          into a grey haze and left blocky artefacts along the bevels.
        */}
        <MeshTransmissionMaterial
          transmission={1}
          thickness={thickness}
          roughness={roughness}
          ior={ior}
          clearcoat={1}
          clearcoatRoughness={0.1}
          chromaticAberration={0.04}
          anisotropicBlur={0.1}
          distortion={0}
          samples={isMobile ? 3 : 6}
          resolution={isMobile ? 256 : 768}
          backside={false}
          // Faint cool tint so the glass still reads against pure black.
          color="#eef1ff"
          attenuationColor="#cfe0ff"
          attenuationDistance={6}
          envMapIntensity={1.2}
        />
      </RoundedBox>
    </group>
  );
}
