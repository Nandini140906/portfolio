import { useMemo } from "react";
import { useControls } from "leva";
import { GalaxyParticles } from "../GalaxyParticles";
import { CoreGlow } from "../CoreGlow";
import { generateAndromeda } from "../galaxy/generateAndromeda";

/** The Andromeda-style galaxy embedded in the hero card (leva folder "Card galaxy"). */
export function CardGalaxy({ isMobile, animate }: { isMobile: boolean; animate: boolean }) {
  const v = useControls(
    "Card galaxy",
    {
      count: { value: 60000, min: 5000, max: 150000, step: 1000 },
      radius: { value: 1.12, min: 0.3, max: 1.4, step: 0.01 },
      winding: { value: 4.6, min: 0.5, max: 8, step: 0.05 },
      armWidth: { value: 0.05, min: 0.005, max: 0.2, step: 0.001 },
      coreColor: "#ffc6ae",
      diskColor: "#b9ccff",
      sparkleColor: "#ffc79e",
      seed: { value: 21, min: 1, max: 999, step: 1 },
      size: { value: 22, min: 4, max: 80, step: 1 },
      intensity: { value: 1, min: 0, max: 3, step: 0.05 },
      sharpness: { value: 1, min: 0, max: 1, step: 0.01 },
      /** Disc inclination: 0 = edge-on, π/2 = face-on. */
      inclination: { value: 0.3, min: 0, max: 1.57, step: 0.01 },
      glow: { value: 0.5, min: 0, max: 2, step: 0.01 },
    },
    { collapsed: true },
  );

  const count = isMobile ? Math.round(v.count * 0.45) : v.count;
  const buffers = useMemo(
    () =>
      generateAndromeda({
        count,
        radius: v.radius,
        winding: v.winding,
        armWidth: v.armWidth,
        coreColor: v.coreColor,
        diskColor: v.diskColor,
        sparkleColor: v.sparkleColor,
        seed: v.seed,
      }),
    [count, v.radius, v.winding, v.armWidth, v.coreColor, v.diskColor, v.sparkleColor, v.seed],
  );

  return (
    // Rotating the XZ disc by `inclination` about X tips it toward the camera;
    // cos(π/2 − inclination) ≈ the ellipse's minor/major axis ratio on screen.
    <group rotation={[v.inclination, 0, 0]}>
      <GalaxyParticles
        buffers={buffers}
        size={v.size}
        intensity={v.intensity}
        sharpness={v.sharpness}
        twinkle={0.3}
        rotationSpeed={0.03}
        scrollSpin={0.5}
        animate={animate}
      />
      {/* Elongated peach core haze; kept dim so it stays peach instead of clipping to white. */}
      <CoreGlow radius={v.radius * 0.62} intensity={v.glow} color={v.coreColor} />
    </group>
  );
}
