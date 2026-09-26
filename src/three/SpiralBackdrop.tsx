import { useMemo } from "react";
import { useControls } from "leva";
import { GalaxyParticles } from "./GalaxyParticles";
import { generateSpiral } from "./galaxy/generateSpiral";

/**
 * The original "B" spiral (gold core, blue arms + far star field), used as a large,
 * dim background layer far behind the hero galaxy. Being much further from the
 * camera, it shifts less under pointer parallax — giving the scene real depth.
 */
export function SpiralBackdrop({ isMobile, animate }: { isMobile: boolean; animate: boolean }) {
  const v = useControls(
    "Background spiral (B)",
    {
      count: { value: 55000, min: 5000, max: 200000, step: 5000 },
      radius: { value: 7, min: 1, max: 15, step: 0.1 },
      branches: { value: 3, min: 1, max: 8, step: 1 },
      spin: { value: 3.4, min: -6, max: 6, step: 0.05 },
      randomness: { value: 0.5, min: 0, max: 1.5, step: 0.01 },
      randomnessPower: { value: 3.4, min: 1, max: 6, step: 0.1 },
      /** Soft-faded empty centre so B's arms wrap around the hero galaxy instead of its core fighting it. */
      innerHole: { value: 0.35, min: 0, max: 0.8, step: 0.01 },
      coreColor: "#ffc98a",
      armColor: "#93b8ff",
      size: { value: 120, min: 10, max: 600, step: 1 },
      intensity: { value: 0.33, min: 0, max: 2, step: 0.01 },
      /** World scale of the whole layer (it sits ~50 units from the camera). */
      scale: { value: 2.4, min: 0.5, max: 6, step: 0.05 },
      depth: { value: -30, min: -80, max: -5, step: 1 },
      /** Tip toward camera so we look down onto the disc, as in the original B. */
      tilt: { value: 0.55, min: 0, max: 1.57, step: 0.01 },
    },
    { collapsed: true },
  );

  const count = isMobile ? Math.round(v.count * 0.35) : v.count;
  const galaxy = useMemo(
    () =>
      generateSpiral({
        count,
        radius: v.radius,
        branches: v.branches,
        spin: v.spin,
        randomness: v.randomness,
        randomnessPower: v.randomnessPower,
        coreFraction: 0,
        coreColor: v.coreColor,
        armColor: v.armColor,
        seed: 11,
        innerHole: v.innerHole,
      }),
    [count, v.innerHole, v.radius, v.branches, v.spin, v.randomness, v.randomnessPower, v.coreColor, v.armColor],
  );

  // Far-field stars: same generator, no spin + huge scatter = a loose cloud.
  const stars = useMemo(
    () =>
      generateSpiral({
        count: isMobile ? 400 : 1000,
        radius: 60,
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
    <group position={[0, 0, v.depth]}>
      <group position={[0, 0, -30]} rotation={[Math.PI / 2, 0, 0]}>
        <GalaxyParticles buffers={stars} size={isMobile ? 110 : 170} intensity={0.25} twinkle={0.6} rotationSpeed={0.004} scrollSpin={0.1} animate={animate} />
      </group>
      <group scale={v.scale} rotation={[v.tilt, 0, 0.12]}>
        <GalaxyParticles
          buffers={galaxy}
          // Phones: smaller points so the sparser layer reads as fine dust, not grain.
          size={isMobile ? v.size * 0.55 : v.size}
          intensity={v.intensity}
          twinkle={0.35}
          rotationSpeed={0.025}
          scrollSpin={1.2}
          animate={animate}
        />
      </group>
    </group>
  );
}
