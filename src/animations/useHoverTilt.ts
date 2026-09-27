import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Subtle 3D tilt toward the cursor + slight lift while hovering an element.
 * Fine pointers only; disabled under prefers-reduced-motion.
 */
export function useHoverTilt(ref: RefObject<HTMLElement>, maxDeg = 5): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    const opts = { duration: 0.5, ease: "power3.out" };
    const rx = gsap.quickTo(el, "rotationX", opts);
    const ry = gsap.quickTo(el, "rotationY", opts);
    const lift = gsap.quickTo(el, "y", opts);
    gsap.set(el, { transformPerspective: 900 });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * maxDeg * 2);
      rx(-ny * maxDeg * 2);
      lift(-6);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
      lift(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, maxDeg]);
}
