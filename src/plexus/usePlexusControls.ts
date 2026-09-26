import { useEffect } from "react";
import { useControls } from "leva";
import { plexusConfig } from "./config";

const toHex = (c: { r: number; g: number; b: number }) =>
  "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");
const fromHex = (h: string) => ({
  r: parseInt(h.slice(1, 3), 16),
  g: parseInt(h.slice(3, 5), 16),
  b: parseInt(h.slice(5, 7), 16),
});

/** Dev leva panel "Plexus" that writes straight into the shared config object. */
export function usePlexusControls(): void {
  const v = useControls(
    "Plexus",
    {
      color: toHex(plexusConfig.color),
      lineAlphaMin: { value: plexusConfig.lineAlphaMin, min: 0, max: 1, step: 0.01 },
      lineAlphaMax: { value: plexusConfig.lineAlphaMax, min: 0, max: 1, step: 0.01 },
      lineWidth: { value: plexusConfig.lineWidth, min: 0.2, max: 3, step: 0.1 },
      linkDist: { value: plexusConfig.linkDist, min: 20, max: 300, step: 1 },
      nodeRadius: { value: plexusConfig.nodeRadius, min: 0.3, max: 5, step: 0.1 },
      bloomRadius: { value: plexusConfig.bloomRadius, min: 2, max: 50, step: 0.5 },
      brightFraction: { value: plexusConfig.brightFraction, min: 0, max: 1, step: 0.01 },
      filamentWidth: { value: plexusConfig.filamentWidth, min: 0.5, max: 8, step: 0.1 },
      filamentLife: { value: plexusConfig.filamentLife, min: 0.1, max: 2, step: 0.05 },
      spring: { value: plexusConfig.spring, min: 1, max: 80, step: 1 },
      damping: { value: plexusConfig.damping, min: 0.5, max: 30, step: 0.5 },
      drift: { value: plexusConfig.drift, min: 0, max: 30, step: 0.5 },
    },
    { collapsed: true },
  );

  useEffect(() => {
    const { color, ...rest } = v;
    Object.assign(plexusConfig, rest, { color: fromHex(color) });
  }, [v]);
}
