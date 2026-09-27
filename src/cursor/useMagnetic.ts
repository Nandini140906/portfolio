import { useEffect } from "react";
import gsap from "gsap";

const SELECTOR = "[data-magnetic]";
const STRENGTH = 0.28; // share of the pointer's offset from centre the element follows
const MAX_PULL = 14; // px

/**
 * Magnetic elements: anything with data-magnetic is pulled slightly toward the
 * pointer while hovered and springs back on leave. One delegated listener for the
 * whole page, so elements added later (e.g. inside dialogs) just work.
 */
export function useMagnetic(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let current: HTMLElement | null = null;
    const movers = new WeakMap<HTMLElement, { x: gsap.QuickToFunc; y: gsap.QuickToFunc }>();
    const get = (el: HTMLElement) => {
      let m = movers.get(el);
      if (!m) {
        const o = { duration: 0.45, ease: "power3.out" };
        m = { x: gsap.quickTo(el, "x", o), y: gsap.quickTo(el, "y", o) };
        movers.set(el, m);
      }
      return m;
    };
    const release = (el: HTMLElement) => {
      const m = get(el);
      m.x(0);
      m.y(0);
    };

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLElement | null;
      if (current && current !== el) release(current);
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const clamp = (v: number) => Math.max(-MAX_PULL, Math.min(MAX_PULL, v * STRENGTH));
      const m = get(el);
      m.x(clamp(dx));
      m.y(clamp(dy));
    };
    const onLeaveWindow = () => {
      if (current) release(current);
      current = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      if (current) release(current);
    };
  }, [enabled]);
}
