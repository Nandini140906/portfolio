import { HeroCard } from "../card/HeroCard";
import { CameraRig } from "../CameraRig";
import { Backdrop } from "../Backdrop";
import { useGalaxyControls } from "../useGalaxyControls";
import { capCount, type VariantProps } from "./types";

/** Card position shared with Effects so depth of field focuses on it. */
export const cardAnchor = (isMobile: boolean): [number, number, number] => (isMobile ? [0, 0.75, 0] : [1.55, 0, 0]);

/**
 * A — recreation of the reference image: a notched clear-acrylic card with a
 * glowing rim, an inclined Andromeda-like galaxy inside, warm bokeh around it,
 * on a slate studio backdrop with shallow depth of field.
 */
export function VariantA({ isMobile, animate }: VariantProps) {
  const { params, look } = useGalaxyControls(
    "Galaxy A",
    {
      count: 90000,
      radius: 0.95,
      branches: 5,
      spin: 7.5,
      randomness: 0.5,
      randomnessPower: 1.8,
      coreFraction: 0.14,
      coreColor: "#ffc4a8",
      armColor: "#c3d3ff",
      seed: 42,
      brightFraction: 0,
      colorFalloff: 1.1,
    },
    { size: 15, intensity: 0.75, twinkle: 0.25, rotationSpeed: 0.04 },
  );

  return (
    <>
      <CameraRig base={[0, 0.25, isMobile ? 9.2 : 7.5]} lookAt={[0, 0.1, 0]} parallax={0.25} scrollDolly={0.8} animate={animate} fov={35} />
      <Backdrop />
      <HeroCard
        galaxy={{ ...params, count: capCount(params.count, isMobile) }}
        look={look}
        position={cardAnchor(isMobile)}
        animate={animate}
        scale={isMobile ? 0.62 : 1.15}
        isMobile={isMobile}
      />
    </>
  );
}
