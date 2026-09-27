import { Suspense, lazy, useState } from "react";
import { Leva } from "leva";
import { BackgroundCanvas } from "./three/BackgroundCanvas";
import { NotchedGlassCard } from "./sections/NotchedGlassCard";
import { site } from "./data/content";
import { shouldPlayIntro } from "./intro/introGate";
import { setIntroCovering, useIntroCovering } from "./intro/introStore";
import styles from "./styles/App.module.css";

// Intro code is split into its own chunk so it never delays the site's first paint.
const HeroIntro = lazy(() => import("./intro/HeroIntro"));

// Phase 1: background + hero glass card, plus temporary scroll-test blocks.
// Real sections replace the placeholder blocks in Phase 2.
export default function App() {
  // Decided once on mount: every load, unless ?intro=0 or reduced motion.
  const [introActive, setIntroActive] = useState(shouldPlayIntro);
  // Skip compositing the (expensive, invisible) page while the intro covers it.
  const introCovering = useIntroCovering();

  return (
    <>
      <Leva hidden={!import.meta.env.DEV} collapsed />
      {introActive && (
        // Fallback covers the page for the split second the intro chunk takes to load.
        <Suspense fallback={<div className={styles.introCover} />}>
          <HeroIntro
            onDone={() => {
              setIntroCovering(false); // safety: never leave the page hidden
              setIntroActive(false);
            }}
          />
        </Suspense>
      )}
      <BackgroundCanvas />
      <main className={styles.content} style={introCovering ? { visibility: "hidden" } : undefined}>
        <section className={styles.block}>
          <NotchedGlassCard>
            <h1 className={styles.title}>
              Nand<em className="accent">i</em>ni Das
            </h1>
            <p className={styles.tagline}>{site.tagline}</p>
          </NotchedGlassCard>
        </section>
        <section className={styles.block}>
          <p className={styles.label}>{"// scroll 50%"}</p>
        </section>
        <section className={styles.block}>
          <p className={styles.label}>{"// scroll 100%"}</p>
        </section>
      </main>
    </>
  );
}
