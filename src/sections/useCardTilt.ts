import { useEffect, useRef, type RefObject } from "react";
import { attachMotionListeners, pointer } from "../three/motionStore";
import type { TiltState } from "./liquid/LiquidLayer";

const MAX_RX = 9; // degrees, pointer up/down
const MAX_RY = 12; // degrees, pointer left/right

/**
 * Smoothly tilts an element in 3D toward the pointer (applied straight to its
 * transform — no React re-renders). Returns the live tilt so the liquid layer can
 * shift its highlights.
 */
export function useCardTilt(ref: RefObject<HTMLElement>, enabled: boolean) {
  const tilt = useRef<TiltState>({ rx: 0, ry: 0, speed: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      if (el) el.style.transform = "";
      return;
    }
    attachMotionListeners();
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = tilt.current;
      const tx = pointer.y * MAX_RX;
      const ty = pointer.x * MAX_RY;
      // Exponential smoothing (frame-rate independent), λ = 5.
      const k = 1 - Math.exp(-5 * dt);
      const nrx = s.rx + (tx - s.rx) * k;
      const nry = s.ry + (ty - s.ry) * k;
      s.speed = dt > 0 ? Math.hypot(nrx - s.rx, nry - s.ry) / dt : 0;
      s.rx = nrx;
      s.ry = nry;
      el.style.transform = `perspective(900px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, enabled]);

  return tilt;
}
