import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CardBody } from "./CardBody";
import { CardFace } from "./CardFace";
import { CardGalaxy } from "./CardGalaxy";
import { BokehField } from "../BokehField";
import { pointer, scroll } from "../motionStore";

export interface HeroCardProps {
  /** Resting pose: the reference card leans right and tips its top away from camera. */
  rotation?: [number, number, number];
  position?: [number, number, number];
  scale?: number;
  animate?: boolean;
  isMobile?: boolean;
}

export function HeroCard({
  rotation = [-0.42, 0.28, -0.46],
  position = [0, 0, 0],
  scale = 1,
  animate = true,
  isMobile = false,
}: HeroCardProps) {
  const pose = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = pose.current;
    if (!g) return;
    const t = animate ? state.clock.elapsedTime : 0;
    const px = animate ? pointer.x : 0;
    const py = animate ? pointer.y : 0;
    const p = animate ? scroll.progress : 0;

    // Idle float + pointer tilt (card turns a few degrees to "look at" the cursor)
    // + scroll: card rises and turns as the page moves on.
    const tx = rotation[0] + Math.sin(t * 0.43) * 0.03 - py * 0.12 - p * 0.3;
    const ty = rotation[1] + Math.sin(t * 0.31) * 0.05 + px * 0.18 + p * 0.6;
    const tz = rotation[2] + Math.sin(t * 0.27) * 0.015;
    const k = animate ? 3 : 1000;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, k, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, k, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, tz, k, delta);
    g.position.y = position[1] + Math.sin(t * 0.6) * 0.05 + p * 0.8;
  });

  return (
    <group position={position} scale={scale}>
      <group ref={pose} rotation={rotation}>
        {/*
          Galaxy embedded in the slab. The z-squash flattens the tilted disc into the
          card's thin volume without changing how it looks from the front (squashing
          along the view axis is invisible); the z-rotation lays it diagonally.
        */}
        <group scale={[1, 1, 0.12]} rotation={[0, 0, 0.95]}>
          <CardGalaxy isMobile={isMobile} animate={animate} />
        </group>
        <CardFace z={-0.012} />
        <CardBody isMobile={isMobile} />
        <BokehField count={isMobile ? 30 : 70} extent={[1.05, 1.45, 0.35]} animate={animate} />
      </group>
    </group>
  );
}
