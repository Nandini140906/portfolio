import { useMediaQuery } from "./useMediaQuery";

/**
 * "Mobile" for perf purposes: narrow viewport OR a coarse (touch) primary pointer.
 * Drives lower particle counts, no bloom, no custom cursor.
 */
export function useIsMobile(): boolean {
  const narrow = useMediaQuery("(max-width: 768px)");
  const coarse = useMediaQuery("(pointer: coarse)");
  return narrow || coarse;
}
