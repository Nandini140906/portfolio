import { useEffect, useRef, useSyncExternalStore } from "react";
import { CursorScene } from "./cursorScene";
import { useMagnetic } from "./useMagnetic";
import styles from "../styles/Cursor.module.css";

const QUERY = "(pointer: fine) and (prefers-reduced-motion: no-preference)";
const INTERACTIVE = "a, button, [data-magnetic]";

/** Live check: only fine pointers (mouse/trackpad) and motion allowed. */
function useCursorEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * Gold constellation cursor (full-screen canvas overlay). Hides the native
 * cursor only while active; touch devices and reduced motion keep the normal one.
 */
export function ConstellationCursor() {
  const enabled = useCursorEnabled();
  useMagnetic(enabled);
  return enabled ? <CursorCanvas /> : null;
}

function CursorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const scene = new CursorScene();
    document.documentElement.classList.add("has-constellation-cursor");

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      scene.x = e.clientX;
      scene.y = e.clientY;
      scene.inside = true;
      scene.hoverTarget = (e.target as Element | null)?.closest?.(INTERACTIVE) ? 1 : 0;
    };
    const onLeave = () => {
      scene.inside = false;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      scene.frame(ctx, w, h, (now - t0) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-constellation-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
