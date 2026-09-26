import { GalaxyParticles } from "../GalaxyParticles";
import { CameraRig } from "../CameraRig";
import { StarDust } from "../StarDust";
import { useGalaxyControls } from "../useGalaxyControls";
import { capCount, type VariantProps } from "./types";

/** B — fullscreen, immersive galaxy field. No card; camera close and above the disc. */
export function VariantB({ isMobile, animate }: VariantProps) {
  const { params, look } = useGalaxyControls(
    "Galaxy B",
    {
      count: 90000,
      radius: 7,
      branches: 3,
      spin: 2.4,
      randomness: 0.3,
      randomnessPower: 2.8,
      coreFraction: 0.14,
      coreColor: "#ffc98a",
      armColor: "#93b8ff",
      seed: 11,
    },
    { size: 26, intensity: 1, twinkle: 0.35, rotationSpeed: 0.025 },
  );

  return (
    <>
      <CameraRig base={[0, 2.6, 5.2]} lookAt={[0, -0.4, 0]} parallax={0.6} scrollDolly={2.2} animate={animate} />
      <StarDust count={isMobile ? 1500 : 5000} animate={animate} />
      <GalaxyParticles
        params={{ ...params, count: capCount(params.count, isMobile) }}
        {...look}
        animate={animate}
        tilt={[0.25, 0, 0.12]}
        scrollSpin={1.6}
      />
    </>
  );
}
