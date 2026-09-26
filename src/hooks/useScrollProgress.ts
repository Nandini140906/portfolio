import { useEffect } from "react";
import { attachMotionListeners, scroll } from "../three/motionStore";

/**
 * Returns a live object whose `.progress` is the page scroll position 0 → 1.
 * Read it inside useFrame / rAF (it's mutated in place, no re-renders).
 */
export function useScrollProgress(): { readonly progress: number } {
  useEffect(attachMotionListeners, []);
  return scroll;
}
