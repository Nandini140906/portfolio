import { HeroCard } from "../card/HeroCard";
import { CameraRig } from "../CameraRig";
import { Backdrop } from "../Backdrop";
import type { VariantProps } from "./types";

/** Card position shared with Effects so depth of field focuses on it. */
export const cardAnchor = (isMobile: boolean): [number, number, number] => (isMobile ? [0, 0.75, 0] : [1.55, 0, 0]);

/**
 * A — recreation of the reference image: a notched clear-acrylic card with a
 * glowing rim, an inclined Andromeda-like galaxy inside, warm bokeh around it,
 * on a slate studio backdrop with shallow depth of field.
 */
export function VariantA({ isMobile, animate }: VariantProps) {
  return (
    <>
      <CameraRig base={[0, 0.25, isMobile ? 9.2 : 7.5]} lookAt={[0, 0.1, 0]} parallax={0.25} scrollDolly={0.8} animate={animate} fov={35} />
      <Backdrop />
      <HeroCard
        position={cardAnchor(isMobile)}
        animate={animate}
        scale={isMobile ? 0.62 : 1.15}
        isMobile={isMobile}
      />
    </>
  );
}
