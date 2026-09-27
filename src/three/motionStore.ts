// Plain module-level stores read inside useFrame — no React re-renders.

/** Pointer in normalised device coords (-1..1), from a window listener because the
 *  canvas wrapper is pointer-events:none and never receives events itself. */
export const pointer = { x: 0, y: 0 };

/**
 * Whole-page scroll progress 0 → 1, plus values written by the GSAP
 * ScrollTriggers in src/animations (scrubbed, so always smooth):
 *  - boost: extra galaxy spin while scrolling (from scroll velocity, eases to 0)
 *  - nudge: extra camera dolly (world units) that pulses at section boundaries
 */
export const scroll = { progress: 0, boost: 0, nudge: 0 };

/** 0 = galaxy scattered/expanded, 1 = formed. Tweened in on the Hero reveal. */
export const reveal = { converge: 1 };

let attached = false;

export function attachMotionListeners(): void {
  if (attached || typeof window === "undefined") return;
  attached = true;

  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scroll.progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}

// Dev-only handle for inspecting live motion values from the console / tests.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __motion?: object }).__motion = { pointer, scroll, reveal };
}
