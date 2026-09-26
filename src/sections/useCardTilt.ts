import { useEffect, useRef, type RefObject } from "react";
import { attachMotionListeners, pointer } from "../three/motionStore";
import type { TiltState } from "./liquid/LiquidLayer";

const MAX_RX = 9; // degrees, pointer up/down
const MAX_RY = 12; // degrees, pointer left/right
/** Resting pose: a slight lean so the slab's thickness shows even when idle. */
const REST_RX = 6;
const REST_RY = -8;
/** Slab thickness in px — how far the back face shifts as the card turns. */
export const CARD_DEPTH = 26;

/**
 * Floats the card and tilts it in 3D toward the pointer, writing straight to the
 * element's transform (no React re-renders). Also:
 *  - sets --dx / --dy (px) on the card: where the slab's back face projects,
 *    used to draw the extruded side so it reads as a thick 3D block;
 *  - scales the optional ground shadow opposite to the float height.
 * Returns the live tilt so the liquid layer can shift its highlights.
 */
export function useCardTilt(
  ref: RefObject<HTMLElement>,
  enabled: boolean,
  shadowRef?: RefObject<HTMLElement>,
) {
  const tilt = useRef<TiltState>({ rx: REST_RX, ry: REST_RY, speed: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const shadow = shadowRef?.current ?? null;

    const apply = (rx: number, ry: number, bob: number, sway: number) => {
      el.style.transform = `perspective(900px) translate3d(0, ${bob.toFixed(2)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${sway.toFixed(2)}deg)`;
      // Back face of a slab rotated by (rx, ry): rotating the point (0, 0, -D)
      // about Y moves it by -D·sin(ry) in x; about X by +D·sin(rx) in screen-y.
      const toRad = Math.PI / 180;
      el.style.setProperty("--dx", (-CARD_DEPTH * Math.sin(ry * toRad) * 2.2).toFixed(2));
      el.style.setProperty("--dy", (CARD_DEPTH * Math.sin(rx * toRad) * 2.2 + 3).toFixed(2));
      if (shadow) {
        // Card rises (bob < 0) → shadow shrinks and fades; sinks → tightens.
        const lift = -bob / 8; // -1 … 1
        shadow.style.transform = `translateX(-50%) scale(${(1 - lift * 0.08).toFixed(3)})`;
        shadow.style.opacity = (0.55 - lift * 0.15).toFixed(3);
      }
    };

    if (!enabled) {
      apply(REST_RX, REST_RY, 0, 0); // reduced motion: static 3D pose
      return;
    }

    attachMotionListeners();
    let raf = 0;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const s = tilt.current;
      const tx = REST_RX + pointer.y * MAX_RX;
      const ty = REST_RY + pointer.x * MAX_RY;
      // Exponential smoothing (frame-rate independent), λ = 5.
      const k = 1 - Math.exp(-5 * dt);
      const nrx = s.rx + (tx - s.rx) * k;
      const nry = s.ry + (ty - s.ry) * k;
      s.speed = dt > 0 ? Math.hypot(nrx - s.rx, nry - s.ry) / dt : 0;
      s.rx = nrx;
      s.ry = nry;
      // Float: slow bob + gentle sway on incommensurate periods so it never loops visibly.
      const bob = Math.sin(t * 0.9) * 8;
      const sway = Math.sin(t * 0.53) * 0.8;
      apply(s.rx + Math.sin(t * 0.71) * 1.2, s.ry + Math.sin(t * 0.47) * 1.5, bob, sway);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, shadowRef, enabled]);

  return tilt;
}
