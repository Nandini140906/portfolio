import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { notchedPath } from "./notchedPath";
import { LiquidLayer } from "./liquid/LiquidLayer";
import { useCardTilt } from "./useCardTilt";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useIntroCovering } from "../intro/introStore";
import styles from "../styles/NotchedGlassCard.module.css";

/** Fractions of the way to the back face at which side-edge outlines are drawn. */
const DEPTH_STEPS = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];

/**
 * Compact clear-acrylic card in the reference's shape (side notches, bottom slot,
 * glowing peach rim + inner bevel line) with dissolved liquid swirling inside.
 * The card floats and tilts in 3D toward the pointer; moving the cursor over it
 * melts the type into liquid chrome along the cursor's path.
 * The outline is generated for the card's measured pixel size so corners and
 * notches never stretch.
 */
export function NotchedGlassCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();
  const introCovering = useIntroCovering(); // hidden under the intro → don't animate
  const shadowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // True once the WebGL layer is drawing the text — then the DOM copy goes invisible
  // (still selectable + read by screen readers). Without WebGL it simply stays.
  const [liquidText, setLiquidText] = useState(false);
  const tilt = useCardTilt(ref, !reducedMotion, shadowRef);

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

  // Assembly: once the intro hands off (or on load when there's no intro), the card
  // rises in from depth, its glowing rim traces itself around the outline the
  // intro's network just joined onto, and the halo blooms in.
  const floatRef = useRef<HTMLDivElement>(null);
  const assembled = useRef(false);
  useLayoutEffect(() => {
    if (assembled.current || introCovering || !size.w) return;
    assembled.current = true;
    if (reducedMotion) return;
    const root = floatRef.current!;
    const tl = gsap.timeline();
    tl.from(root, {
      autoAlpha: 0,
      scale: 0.86,
      y: 28,
      duration: 1.1,
      ease: "power3.out",
      // Opacity/transform on this ancestor would disable the glass's backdrop blur,
      // so drop them the moment the entrance finishes.
      clearProps: "opacity,visibility,transform",
    })
      .fromTo(
        root.querySelectorAll("[data-draw]"),
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" },
        0.05,
      )
      .from(root.querySelectorAll("[data-bloom]"), { opacity: 0, duration: 1, ease: "power1.out" }, 0.45);
    return () => {
      tl.kill();
    };
  }, [introCovering, reducedMotion, size.w]);

  const outer = size.w ? notchedPath(size.w, size.h, 1) : "";
  const inner = size.w ? notchedPath(size.w, size.h, 6) : "";

  return (
    <div ref={floatRef} className={styles.float}>
      {/* Soft ground shadow; scales opposite to the float so the card reads as hovering. */}
      <div ref={shadowRef} className={styles.shadow} aria-hidden="true" />
    <div ref={ref} className={styles.card} data-hero-card>
      {/* Soft blurred halo spilling out past the edges. */}
      {outer && (
        <svg className={styles.halo} width={size.w} height={size.h} aria-hidden="true" data-bloom>
          <defs>
            <filter id={`halo${id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>
          <path d={outer} fill="none" stroke="rgba(255, 214, 196, 0.5)" strokeWidth="10" filter={`url(#halo${id})`} />
        </svg>
      )}
      {/*
        Extruded side of the slab: copies of the outline stepped toward the projected
        back face (--dx/--dy, set per frame by useCardTilt). Together they draw the
        thick acrylic edge that makes the card read as a 3D block.
      */}
      {outer && (
        <svg className={styles.depth} width={size.w} height={size.h} aria-hidden="true">
          {/*
            Mask out the front face: the side is only drawn where it peeks out past
            the glass. (Anything under the glass would also be what its backdrop blur
            samples, darkening the galaxy seen through it.)
          */}
          <mask id={`side${id}`} maskUnits="userSpaceOnUse" x={-100} y={-100} width={size.w + 200} height={size.h + 200}>
            <rect x={-100} y={-100} width={size.w + 200} height={size.h + 200} fill="white" />
            <path d={outer} fill="black" />
          </mask>
          <g mask={`url(#side${id})`}>
          <path
            d={outer}
            className={styles.backFace}
            style={{ transform: "translate(calc(var(--dx, 0) * 1px), calc(var(--dy, 0) * 1px))" }}
          />
          {DEPTH_STEPS.map((f) => (
            <path
              key={f}
              d={outer}
              fill="none"
              stroke={`rgba(255, 222, 208, ${(0.2 * (1 - f) + 0.05).toFixed(3)})`}
              strokeWidth="1.2"
              style={{ transform: `translate(calc(var(--dx, 0) * ${f}px), calc(var(--dy, 0) * ${f}px))` }}
            />
          ))}
          </g>
        </svg>
      )}
      {/* Glass body, clipped to the notched outline. */}
      <div className={styles.glass} style={outer ? { clipPath: `path('${outer}')` } : undefined} />
      {/* Dissolved-liquid glass effect, clipped to the inner bevel so it sits within the slab. */}
      {inner && (
        <LiquidLayer
          tilt={tilt}
          animate={!reducedMotion && !introCovering}
          textRoot={contentRef}
          onTextReady={setLiquidText}
          className={styles.liquid}
          style={{ clipPath: `path('${inner}')` }}
        />
      )}

      {outer && (
        <svg className={styles.rim} width={size.w} height={size.h} aria-hidden="true">
          <defs>
            <linearGradient id={`rim${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe6dc" stopOpacity="0.95" />
              <stop offset="0.35" stopColor="#ffcdb8" stopOpacity="0.35" />
              <stop offset="0.6" stopColor="#d7defc" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffd8c8" stopOpacity="0.9" />
            </linearGradient>
            <filter id={`soft${id}`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id={`glow${id}`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Frosted inner edge: wide blurred stroke clipped inside the outline. */}
          <clipPath id={`clip${id}`}>
            <path d={outer} />
          </clipPath>
          <path
            d={outer}
            fill="none"
            stroke="rgba(236, 232, 255, 0.28)"
            strokeWidth="18"
            filter={`url(#soft${id})`}
            clipPath={`url(#clip${id})`}
          />
          <path
            d={outer}
            fill="none"
            stroke={`url(#rim${id})`}
            strokeWidth="1.4"
            filter={`url(#glow${id})`}
            pathLength={1}
            data-draw
          />
          {/* Inner bevel line — the thickness of the acrylic slab. */}
          <path d={inner} fill="none" stroke="rgba(255, 228, 218, 0.22)" strokeWidth="1" pathLength={1} data-draw />
        </svg>
      )}

      <div ref={contentRef} className={`${styles.content} ${liquidText ? styles.textLive : ""}`}>
        <div className={styles.topRow} aria-hidden="true">
          <span className={styles.chip} />
        </div>
        {children}
      </div>
    </div>
    </div>
  );
}
