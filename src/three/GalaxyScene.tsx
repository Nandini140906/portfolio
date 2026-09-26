import { useMemo } from "react";
import { useControls } from "leva";
import { CameraRig } from "./CameraRig";
import { Backdrop } from "./Backdrop";
import { BokehField } from "./BokehField";
import { CoreGlow } from "./CoreGlow";
import { GalaxyParticles } from "./GalaxyParticles";
import { generateAndromeda } from "./galaxy/generateAndromeda";

export interface GalaxySceneProps {
  isMobile: boolean;
  /** false under prefers-reduced-motion → static composed frame. */
  animate: boolean;
}

/**
 * Fullscreen Andromeda-style galaxy: inclined disc with two clean spiral arms,
 * peach core and silver-blue glitter, on a slate backdrop. Tunable via the
 * "Galaxy" leva panel in dev.
 */
export function GalaxyScene({ isMobile, animate }: GalaxySceneProps) {
  const v = useControls(
    "Galaxy",
    {
      count: { value: 110000, min: 10000, max: 250000, step: 5000 },
      radius: { value: 4.2, min: 1, max: 10, step: 0.1 },
      winding: { value: 4.6, min: 0.5, max: 8, step: 0.05 },
      armWidth: { value: 0.04, min: 0.005, max: 0.2, step: 0.001 },
      dust: { value: 0.25, min: 0, max: 1, step: 0.01 },
      sparkle: { value: 0.35, min: 0, max: 1, step: 0.01 },
      coreColor: "#ffc6ae",
      diskColor: "#b9ccff",
      sparkleColor: "#ffc79e",
      seed: { value: 21, min: 1, max: 999, step: 1 },
      size: { value: 46, min: 5, max: 200, step: 1 },
      intensity: { value: 0.9, min: 0, max: 3, step: 0.05 },
      sharpness: { value: 0.85, min: 0, max: 1, step: 0.01 },
      /** Disc tilt toward camera: 0 = edge-on, 1.57 = face-on. */
      inclination: { value: 0.38, min: 0, max: 1.57, step: 0.01 },
      /** In-screen roll so the ellipse runs diagonally, like the reference. */
      roll: { value: 0.32, min: -1.57, max: 1.57, step: 0.01 },
      glow: { value: 0.45, min: 0, max: 2, step: 0.01 },
      bokeh: { value: 16, min: 0, max: 80, step: 1 },
    },
    { collapsed: true },
  );

  const count = isMobile ? Math.round(v.count * 0.25) : v.count;
  const buffers = useMemo(
    () =>
      generateAndromeda({
        count,
        radius: v.radius,
        winding: v.winding,
        armWidth: v.armWidth,
        dust: v.dust,
        sparkle: v.sparkle,
        coreColor: v.coreColor,
        diskColor: v.diskColor,
        sparkleColor: v.sparkleColor,
        seed: v.seed,
      }),
    [count, v.radius, v.winding, v.armWidth, v.dust, v.sparkle, v.coreColor, v.diskColor, v.sparkleColor, v.seed],
  );

  return (
    <>
      {/*
        Camera sits far back with a narrow lens: less perspective, so the near side of
        the disc isn't magnified into a thick, noisy band.
      */}
      <CameraRig base={[0, 0, isMobile ? 17 : 13]} parallax={0.7} scrollDolly={3} animate={animate} fov={isMobile ? 38 : 30} />
      <Backdrop position={[0, 0, -20]} size={120} />
      {/*
        Roll (z) lays the ellipse diagonally on screen; inclination (x) tips the XZ
        disc toward camera — its on-screen minor/major ratio is ≈ sin(inclination).
      */}
      {/* Portrait phones: turn the ellipse to run top→bottom so it frames the card. */}
      <group rotation={[0, 0, isMobile ? 1.15 : v.roll]}>
        <group rotation={[v.inclination, 0, 0]}>
          <GalaxyParticles
            buffers={buffers}
            size={v.size}
            intensity={v.intensity}
            sharpness={v.sharpness}
            twinkle={0.3}
            rotationSpeed={0.02}
            scrollSpin={0.8}
            animate={animate}
          />
          <CoreGlow radius={v.radius * 0.6} intensity={v.glow} color={v.coreColor} />
        </group>
      </group>
      {/* A few big, soft out-of-focus orbs in front of the disc for depth. */}
      <BokehField
        count={isMobile ? Math.round(v.bokeh / 2) : v.bokeh}
        extent={[7, 4, 1.5]}
        size={220}
        intensity={0.6}
        animate={animate}
      />
    </>
  );
}
