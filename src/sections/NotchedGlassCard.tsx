import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { notchedPath } from "./notchedPath";
import { site } from "../data/content";
import styles from "../styles/NotchedGlassCard.module.css";

/**
 * Compact clear-acrylic card in the reference's shape (side notches, bottom slot,
 * glowing peach rim + inner bevel line). The outline is generated for the card's
 * measured pixel size so corners and notches never stretch.
 */
export function NotchedGlassCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      // offsetWidth/Height include padding (contentRect doesn't).
      setSize({ w: el.offsetWidth, h: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const outer = size.w ? notchedPath(size.w, size.h, 1) : "";
  const inner = size.w ? notchedPath(size.w, size.h, 6) : "";

  return (
    <div ref={ref} className={styles.card}>
      {/* Glass body, clipped to the notched outline. */}
      <div className={styles.glass} style={outer ? { clipPath: `path('${outer}')` } : undefined} />

      {outer && (
        <svg className={styles.rim} width={size.w} height={size.h} aria-hidden="true">
          <defs>
            <linearGradient id={`rim${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe6dc" stopOpacity="0.95" />
              <stop offset="0.35" stopColor="#ffcdb8" stopOpacity="0.35" />
              <stop offset="0.6" stopColor="#d7defc" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffd8c8" stopOpacity="0.9" />
            </linearGradient>
            <filter id={`glow${id}`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={outer} fill="none" stroke={`url(#rim${id})`} strokeWidth="1.4" filter={`url(#glow${id})`} />
          {/* Inner bevel line — the thickness of the acrylic slab. */}
          <path d={inner} fill="none" stroke="rgba(255, 228, 218, 0.22)" strokeWidth="1" />
        </svg>
      )}

      <div className={styles.content}>
        <div className={styles.topRow} aria-hidden="true">
          <span className={styles.chip} />
          <span className={styles.meta}>{site.cardLabel}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
