import { GalaxyParticles } from "../GalaxyParticles";
import { GlassCard } from "../GlassCard";
import { CameraRig } from "../CameraRig";
import { StarDust } from "../StarDust";
import { useGalaxyControls } from "../useGalaxyControls";
import { capCount, type VariantProps } from "./types";

/**
 * A — literal recreation of the reference: frosted glass card front-and-centre
 * with the galaxy sitting inside its footprint, the card acting as a window.
 */
export function VariantA({ isMobile, animate }: VariantProps) {
  const { params, look } = useGalaxyControls(
    "Galaxy A",
    {
      count: 60000,
      radius: 1.45,
      branches: 3,
      spin: 2.6,
      randomness: 0.32,
      randomnessPower: 2.6,
      coreFraction: 0.18,
      coreColor: "#ffc98a",
      armColor: "#93b8ff",
      seed: 42,
    },
    { size: 16, intensity: 1.1, twinkle: 0.35, rotationSpeed: 0.05 },
  );

  // Card shrinks on narrow portrait screens so it stays in frame.
  const card: [number, number, number] = isMobile ? [2.5, 3.4, 0.28] : [4.6, 3.0, 0.32];

  return (
    <>
      <CameraRig base={[0, 0.1, isMobile ? 8 : 6]} parallax={0.4} scrollDolly={1} animate={animate} />
      <StarDust count={isMobile ? 1500 : 5000} animate={animate} />
      {/* Galaxy tilted ~60° toward camera and centred just behind the card's mid-plane. */}
      <GalaxyParticles
        // On mobile the galaxy shrinks with the (narrower) card so it stays inside the window.
        params={{ ...params, count: capCount(params.count, isMobile), radius: isMobile ? params.radius * 0.8 : params.radius }}
        {...look}
        animate={animate}
        position={[0, 0, -0.6]}
        tilt={[0.95, 0, -0.3]}
        scrollSpin={1.2}
      />
      <GlassCard size={card} animate={animate} isMobile={isMobile} />
    </>
  );
}
