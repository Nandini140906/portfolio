import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { Effects } from "./Effects";
import { GalaxyScene } from "./GalaxyScene";
import { attachMotionListeners } from "./motionStore";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { usePageVisible } from "../hooks/usePageVisible";
import styles from "../styles/BackgroundCanvas.module.css";

export function BackgroundCanvas() {
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const visible = usePageVisible();
  const animate = !reducedMotion;

  useEffect(attachMotionListeners, []);

  const bloom = useControls(
    "Bloom",
    {
      bloomIntensity: { value: 0.9, min: 0, max: 4, step: 0.05 },
      threshold: { value: 0.1, min: 0, max: 1, step: 0.01 },
      radius: { value: 0.7, min: 0, max: 1, step: 0.01 },
    },
    { collapsed: true },
  );

  return (
    <div className={styles.wrap} aria-hidden="true">
      <Canvas
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        // Hidden tab → stop rendering entirely. Reduced motion → only render on
        // demand (i.e. one static composed frame, re-rendered on resize/prop change).
        frameloop={!visible ? "never" : animate ? "always" : "demand"}
        camera={{ fov: 45, near: 0.1, far: 200, position: [0, 0, 8.5] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#07070c"]} />
        <Suspense fallback={null}>
          <GalaxyScene isMobile={isMobile} animate={animate} />
          {!isMobile && !reducedMotion && <Effects {...bloom} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
