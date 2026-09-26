import { folder, useControls } from "leva";
import type { GalaxyParams } from "./galaxy/generateGalaxy";

export interface GalaxyLook {
  size: number;
  intensity: number;
  twinkle: number;
  rotationSpeed: number;
}

/** Leva panel for one galaxy layer. Values fall back to the defaults in prod (panel hidden). */
export function useGalaxyControls(
  name: string,
  params: GalaxyParams,
  look: GalaxyLook,
): { params: GalaxyParams; look: GalaxyLook } {
  const v = useControls(
    name,
    {
      shape: folder({
        count: { value: params.count, min: 1000, max: 150000, step: 1000 },
        radius: { value: params.radius, min: 0.5, max: 20, step: 0.1 },
        branches: { value: params.branches, min: 1, max: 8, step: 1 },
        spin: { value: params.spin, min: -6, max: 6, step: 0.05 },
        randomness: { value: params.randomness, min: 0, max: 1.5, step: 0.01 },
        randomnessPower: { value: params.randomnessPower, min: 1, max: 6, step: 0.1 },
        coreFraction: { value: params.coreFraction, min: 0, max: 0.6, step: 0.01 },
        coreColor: params.coreColor,
        armColor: params.armColor,
        seed: { value: params.seed, min: 1, max: 999, step: 1 },
      }),
      look: folder({
        size: { value: look.size, min: 2, max: 120, step: 1 },
        intensity: { value: look.intensity, min: 0, max: 4, step: 0.05 },
        twinkle: { value: look.twinkle, min: 0, max: 1, step: 0.01 },
        rotationSpeed: { value: look.rotationSpeed, min: 0, max: 0.5, step: 0.005 },
      }),
    },
    { collapsed: true },
  );

  const { size, intensity, twinkle, rotationSpeed, ...shape } = v;
  return { params: shape, look: { size, intensity, twinkle, rotationSpeed } };
}
