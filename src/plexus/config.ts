/**
 * Single source of truth for the filament + plexus look. The hero intro and the
 * constellation cursor both render from these values, so they always match.
 * Mutable on purpose: the dev leva panel (usePlexusControls) writes into it live.
 */
export const plexusConfig = {
  /** Warm gold, = --gold in tokens.css. */
  color: { r: 255, g: 201, b: 138 },
  /** Near-white hot centre for bright nodes and filament heads. */
  hot: { r: 255, g: 241, b: 220 },

  /** Link opacity range: closest pairs → max, pairs at the threshold → min (then cut). */
  lineAlphaMin: 0.15,
  lineAlphaMax: 0.4,
  lineWidth: 0.8,
  /** Link distance threshold, px (at 1× zoom). */
  linkDist: 130,

  /** Plain node dot radius, px. */
  nodeRadius: 1.3,
  /** Glow radius of "bloom" nodes, px. */
  bloomRadius: 14,
  /** Share of nodes that are bright bloom nodes (the rest are small dim points). */
  brightFraction: 0.28,

  /** Filament head-to-tail width, px. */
  filamentWidth: 2.6,
  /** Seconds a filament trail point lives before it has fully faded. */
  filamentLife: 0.55,
  /** Glow radius of a filament's head, px. */
  filamentHeadGlow: 18,

  /** Spring pulling nodes to their targets (1/s²) and damping (1/s). */
  spring: 22,
  damping: 7,
  /** Idle noise drift amplitude, px. */
  drift: 6,
};

export type PlexusConfig = typeof plexusConfig;

export const rgba = (c: { r: number; g: number; b: number }, a: number) => `rgba(${c.r},${c.g},${c.b},${a})`;
