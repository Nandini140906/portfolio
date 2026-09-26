import { useMemo } from "react";
import { useControls } from "leva";
import { CameraRig } from "./CameraRig";
import { Backdrop } from "./Backdrop";
import { SpiralBackdrop } from "./SpiralBackdrop";
import { GoldDrops } from "./GoldDrops";
import { CoreGlow } from "./CoreGlow";
import { GalaxyParticles } from "./GalaxyParticles";
import { generateAndromeda } from "./galaxy/generateAndromeda";

export interface GalaxySceneProps {
  isMobile: boolean;
  /** false under prefers-reduced-motion → static composed frame. */
  animate: boolean;
}

/**
 * Hero scene: the reference galaxy (compact, inclined Andromeda-like disc — glowing
 * peach core, glittery silver-blue ring arms, warm sparkles) in front of the big,
 * dim "B" spiral as a far background layer.
 * Deliberately contained (no dust spraying across the page). Tunable via the
 * "Galaxy" leva panel in dev.
 */
export function GalaxyScene({ isMobile, animate }: GalaxySceneProps) {
  const v = useControls(
    "Galaxy",
    {
      count: { value: 35000, min: 10000, max: 200000, step: 5000 },
      radius: { value: 3.1, min: 0.5, max: 6, step: 0.05 },
      winding: { value: 4.6, min: 0.5, max: 8, step: 0.05 },
      armWidth: { value: 0.045, min: 0.005, max: 0.2, step: 0.001 },
      dust: { value: 0.12, min: 0, max: 1, step: 0.01 },
      sparkle: { value: 1.4, min: 0, max: 3, step: 0.05 },
      coreColor: "#ffc4ab",
      diskColor: "#bccfff",
      sparkleColor: "#ffbf98",
      seed: { value: 21, min: 1, max: 999, step: 1 },
      size: { value: 85, min: 5, max: 300, step: 1 },
      intensity: { value: 1.05, min: 0, max: 3, step: 0.05 },
      sharpness: { value: 0.8, min: 0, max: 1, step: 0.01 },
      /** Disc tilt toward camera: 0 = edge-on, 1.57 = face-on. */
      inclination: { value: 0.42, min: 0, max: 1.57, step: 0.01 },
      /** In-screen roll so the ellipse rises to the right, like the reference. */
      roll: { value: 0.3, min: -1.57, max: 1.57, step: 0.01 },
      glow: { value: 0.7, min: 0, max: 2, step: 0.01 },
      /** Vertical position (world units); 0 = centred behind the name card. */
      offsetY: { value: 0, min: -3, max: 3, step: 0.01 },
      /** Golden light-drops scattered across the whole screen. */
      drops: { value: 140, min: 0, max: 500, step: 5 },
      dropSize: { value: 260, min: 20, max: 800, step: 5 },
      dropGlow: { value: 1, min: 0, max: 3, step: 0.05 },
    },
    { collapsed: true },
  );

  const count = isMobile ? Math.round(v.count * 0.4) : v.count;
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
        Far camera + narrow lens ≈ the long-lens product shot of the reference: almost
        no perspective, so the near side of the disc isn't magnified into noise.
        Phones back off further so the whole ellipse fits the narrow width.
      */}
      <CameraRig
        base={[0, 0, isMobile ? 30 : 19]}
        parallax={0.6}
        scrollDolly={3}
        animate={animate}
        fov={22}
      />
      <Backdrop position={[0, 0, -110]} size={500} />
      <SpiralBackdrop isMobile={isMobile} animate={animate} />
      <group position={[0, v.offsetY, 0]}>
        {/*
          Roll (z) lays the ellipse diagonally on screen; inclination (x) tips the XZ
          disc toward camera — its on-screen minor/major ratio is ≈ sin(inclination).
        */}
        <group rotation={[0, 0, v.roll]}>
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
      </group>
      {/* Width/height of the drop field match what the long-lens camera sees. */}
      <GoldDrops
        count={isMobile ? Math.round(v.drops * 0.45) : v.drops}
        extent={isMobile ? [3.6, 7, 4] : [9, 5, 4]}
        size={v.dropSize}
        intensity={v.dropGlow}
        animate={animate}
      />
    </>
  );
}
