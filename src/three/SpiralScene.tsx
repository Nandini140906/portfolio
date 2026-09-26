import { useMemo } from "react";
import { useControls } from "leva";
import { CameraRig } from "./CameraRig";
import { GalaxyParticles } from "./GalaxyParticles";
import { generateSpiral } from "./galaxy/generateSpiral";
import type { GalaxySceneProps } from "./GalaxyScene";

/**
 * The original "B": a big fullscreen spiral galaxy (gold core, blue arms) seen from
 * just above the disc, with a sparse far-field of stars behind it.
 */
export function SpiralScene({ isMobile, animate }: GalaxySceneProps) {
  const v = useControls(
    "Galaxy B",
    {
      count: { value: 90000, min: 5000, max: 200000, step: 5000 },
      radius: { value: 7, min: 1, max: 15, step: 0.1 },
      branches: { value: 3, min: 1, max: 8, step: 1 },
      spin: { value: 2.4, min: -6, max: 6, step: 0.05 },
      randomness: { value: 0.3, min: 0, max: 1.5, step: 0.01 },
      randomnessPower: { value: 2.8, min: 1, max: 6, step: 0.1 },
      coreColor: "#ffc98a",
      armColor: "#93b8ff",
      size: { value: 26, min: 2, max: 120, step: 1 },
      intensity: { value: 1, min: 0, max: 4, step: 0.05 },
    },
    { collapsed: true },
  );

  const count = isMobile ? Math.round(v.count * 0.2) : v.count;
  const galaxy = useMemo(
    () =>
      generateSpiral({
        count,
        radius: v.radius,
        branches: v.branches,
        spin: v.spin,
        randomness: v.randomness,
        randomnessPower: v.randomnessPower,
        coreFraction: 0.14,
        coreColor: v.coreColor,
        armColor: v.armColor,
        seed: 11,
      }),
    [count, v.radius, v.branches, v.spin, v.randomness, v.randomnessPower, v.coreColor, v.armColor],
  );

  // Far-field stars: the same generator with no spin and huge scatter = a loose cloud.
  const stars = useMemo(
    () =>
      generateSpiral({
        count: isMobile ? 1500 : 5000,
        radius: 30,
        branches: 1,
        spin: 0,
        randomness: 1.2,
        randomnessPower: 1,
        coreFraction: 0,
        coreColor: "#cfe0ff",
        armColor: "#93b8ff",
        seed: 7,
      }),
    [isMobile],
  );

  return (
    <>
      <CameraRig base={[0, 2.6, 5.2]} lookAt={[0, -0.4, 0]} parallax={0.6} scrollDolly={2.2} animate={animate} fov={45} />
      <group position={[0, 0, -18]} rotation={[Math.PI / 2, 0, 0]}>
        <GalaxyParticles buffers={stars} size={40} intensity={0.35} twinkle={0.6} rotationSpeed={0.004} scrollSpin={0.1} animate={animate} />
      </group>
      <group rotation={[0.25, 0, 0.12]}>
        <GalaxyParticles
          buffers={galaxy}
          size={v.size}
          intensity={v.intensity}
          twinkle={0.35}
          rotationSpeed={0.025}
          scrollSpin={1.6}
          animate={animate}
        />
      </group>
    </>
  );
}
