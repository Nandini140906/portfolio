import { Suspense, lazy, useState } from "react";
import { Leva } from "leva";
import { BackgroundCanvas } from "./three/BackgroundCanvas";
import { Nav } from "./components/Nav";
import { ConstellationCursor } from "./cursor/ConstellationCursor";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Projects } from "./sections/Projects";
import { Skills } from "./sections/Skills";
import { Contact } from "./sections/Contact";
import { shouldPlayIntro } from "./intro/introGate";
import { setIntroCovering, useIntroCovering } from "./intro/introStore";
import { useScrollAnimations } from "./animations/useScrollAnimations";
import { useAnchorGlide } from "./animations/useAnchorGlide";
import styles from "./styles/App.module.css";

// Intro code is split into its own chunk so it never delays the site's first paint.
const HeroIntro = lazy(() => import("./intro/HeroIntro"));

export default function App() {
  // Decided once on mount: every load, unless ?intro=0 or reduced motion.
  const [introActive, setIntroActive] = useState(shouldPlayIntro);
  // Skip compositing the (expensive, invisible) page while the intro covers it.
  const introCovering = useIntroCovering();
  // Reveals are set up once the page is actually visible (after the intro hands off).
  useScrollAnimations(!introCovering);
  useAnchorGlide();
  const hidden = introCovering ? { visibility: "hidden" as const } : undefined;

  return (
    <>
      <Leva hidden={!import.meta.env.DEV} collapsed />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
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
      <ConstellationCursor />
      <div style={hidden}>
        <Nav />
      </div>
      <main id="main" className={styles.content} style={hidden}>
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
