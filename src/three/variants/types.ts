export interface VariantProps {
  isMobile: boolean;
  /** false under prefers-reduced-motion → static composed frame. */
  animate: boolean;
}

/** Caps particle counts on mobile. */
export const MOBILE_COUNT_SCALE = 0.2;

export function capCount(count: number, isMobile: boolean): number {
  return isMobile ? Math.round(count * MOBILE_COUNT_SCALE) : count;
}
