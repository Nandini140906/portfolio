import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pointer, scroll } from "./motionStore";

export interface CameraRigProps {
  base: [number, number, number];
  lookAt?: [number, number, number];
  /** Max world-unit offset from pointer parallax. */
  parallax?: number;
  /** World units the camera dollies forward across full page scroll. */
  scrollDolly?: number;
  animate?: boolean;
  fov?: number;
}

const target = new THREE.Vector3();
const look = new THREE.Vector3();

export function CameraRig({
  base,
  lookAt = [0, 0, 0],
  parallax = 0.35,
  scrollDolly = 1.2,
  animate = true,
  fov = 45,
}: CameraRigProps) {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  useFrame((_, delta) => {
    const px = animate ? pointer.x : 0;
    const py = animate ? pointer.y : 0;
    const p = animate ? scroll.progress : 0;

    target.set(base[0] + px * parallax, base[1] + py * parallax * 0.6 - p * 0.4, base[2] - p * scrollDolly - (animate ? scroll.nudge : 0));

    if (!animate) {
      camera.position.copy(target);
    } else {
      // Frame-rate independent exponential smoothing (λ=2.5 → ~0.4s to settle).
      camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.5, delta);
    }
    camera.lookAt(look.set(...lookAt));
  });

  return null;
}
