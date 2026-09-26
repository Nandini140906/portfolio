import { Leva } from "leva";
import { BackgroundCanvas } from "./three/BackgroundCanvas";
import { NotchedGlassCard } from "./sections/NotchedGlassCard";
import { site } from "./data/content";
import styles from "./styles/App.module.css";

// Phase 1: background + hero glass card, plus temporary scroll-test blocks.
// Real sections replace the placeholder blocks in Phase 2.
export default function App() {
  return (
    <>
      <Leva hidden={!import.meta.env.DEV} collapsed />
      <BackgroundCanvas />
      <main className={styles.content}>
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
