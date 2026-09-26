import { useMemo } from "react";
import { GalaxyParticles } from "./GalaxyParticles";
import type { GalaxyParams } from "./galaxy/generateGalaxy";

/**
 * Sparse, dim far-field stars behind everything — gives depth so the
 * scene never reads as "object on flat black". Reuses the galaxy shader
 * with zero spin/huge randomness (i.e. a scattered cloud, not arms).
 */
export function StarDust({ count, animate }: { count: number; animate: boolean }) {
  const params = useMemo<GalaxyParams>(
    () => ({
      count,
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
    [count],
  );
  return (
    <GalaxyParticles
      params={params}
      position={[0, 0, -18]}
      tilt={[Math.PI / 2, 0, 0]}
      size={40}
      intensity={0.35}
      twinkle={0.6}
      rotationSpeed={0.004}
      scrollSpin={0.1}
      animate={animate}
    />
  );
}
