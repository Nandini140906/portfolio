import { GalaxyParticles } from "../GalaxyParticles";
import { GlassCard } from "../GlassCard";
import { CameraRig } from "../CameraRig";
import { StarDust } from "../StarDust";
import { useGalaxyControls } from "../useGalaxyControls";
import { capCount, type VariantProps } from "./types";

/**
 * C — glass card as a floating hero object in front of a large, dim backdrop.
 * Two galaxy layers at different depths → real parallax when the camera moves.
 */
export function VariantC({ isMobile, animate }: VariantProps) {
  const far = useGalaxyControls(
    "Galaxy C · far",
    {
      count: 60000,
      radius: 11,
      branches: 4,
      spin: 2.2,
      randomness: 0.4,
      randomnessPower: 2.4,
      coreFraction: 0.12,
      coreColor: "#ffc98a",
      armColor: "#93b8ff",
      seed: 5,
    },
    { size: 40, intensity: 0.5, twinkle: 0.4, rotationSpeed: 0.015 },
  );
  const near = useGalaxyControls(
    "Galaxy C · near",
    {
      count: 25000,
      radius: 4,
      branches: 2,
      spin: -2.8,
      randomness: 0.5,
      randomnessPower: 2,
      coreFraction: 0.05,
      coreColor: "#ffb066",
      armColor: "#cfe0ff",
      seed: 77,
    },
    { size: 18, intensity: 0.55, twinkle: 0.5, rotationSpeed: -0.03 },
  );

  const card: [number, number, number] = isMobile ? [2.6, 3.4, 0.28] : [3.6, 2.3, 0.3];

  return (
    <>
      <CameraRig base={[0, 0, isMobile ? 8 : 6.5]} parallax={0.7} scrollDolly={1.5} animate={animate} />
      <StarDust count={isMobile ? 1500 : 5000} animate={animate} />
      <GalaxyParticles
        params={{ ...far.params, count: capCount(far.params.count, isMobile) }}
        {...far.look}
        animate={animate}
        position={[1.5, -0.5, -9]}
        tilt={[1.1, 0, 0.4]}
        scrollSpin={0.6}
      />
      <GalaxyParticles
        params={{ ...near.params, count: capCount(near.params.count, isMobile) }}
        {...near.look}
        animate={animate}
        position={[-1.2, 0.4, -3.5]}
        tilt={[0.9, 0, -0.5]}
        scrollSpin={-0.9}
      />
      <GlassCard size={card} position={[0, 0, 1]} roughness={0.22} animate={animate} scrollLift={0.9} isMobile={isMobile} />
    </>
  );
}
