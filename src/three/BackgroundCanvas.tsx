import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { Effects } from "./Effects";
import { GlassLighting } from "./GlassLighting";
import { VariantA } from "./variants/VariantA";
import { VariantB } from "./variants/VariantB";
import { VariantC } from "./variants/VariantC";
import { attachMotionListeners } from "./motionStore";
import { setBgVariant, useBgVariant, type BgVariant } from "./bgVariant";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { usePageVisible } from "../hooks/usePageVisible";
import styles from "../styles/BackgroundCanvas.module.css";

const VARIANTS = { a: VariantA, b: VariantB, c: VariantC } as const;

/** Leva dropdown, two-way synced with the ?bg= store + corner switcher. */
function useVariantControl(variant: BgVariant) {
  const [, set] = useControls("Background", () => ({
    variant: {
      value: variant,
      options: { "A · card window": "a", "B · fullscreen field": "b", "C · card over backdrop": "c" },
      onChange: (v: BgVariant) => setBgVariant(v),
    },
  }));
  useEffect(() => set({ variant }), [variant, set]);
}

export function BackgroundCanvas() {
  const variant = useBgVariant();
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const visible = usePageVisible();
  const animate = !reducedMotion;

  useEffect(attachMotionListeners, []);
  useVariantControl(variant);

  const bloom = useControls("Bloom", {
    bloomIntensity: { value: 1.1, min: 0, max: 4, step: 0.05 },
    threshold: { value: 0.08, min: 0, max: 1, step: 0.01 },
    radius: { value: 0.72, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true });

  const Scene = VARIANTS[variant];

  return (
    <div className={styles.wrap} aria-hidden="true">
      <Canvas
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        // Hidden tab → stop rendering entirely. Reduced motion → only render on
        // demand (i.e. one static composed frame, re-rendered on resize/prop change).
        frameloop={!visible ? "never" : animate ? "always" : "demand"}
        camera={{ fov: 45, near: 0.1, far: 120, position: [0, 0, 6] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#07070c"]} />
        <Suspense fallback={null}>
          <GlassLighting />
          <Scene key={variant} isMobile={isMobile} animate={animate} />
          {!isMobile && !reducedMotion && <Effects {...bloom} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
