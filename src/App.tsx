import { Leva } from "leva";
import { BackgroundCanvas } from "./three/BackgroundCanvas";
import { BgSwitcher } from "./three/BgSwitcher";
import styles from "./styles/App.module.css";

// Phase 1: background system + temporary scroll-test content.
// Real sections replace the placeholder <main> in Phase 2.
export default function App() {
  return (
    <>
      <Leva hidden={!import.meta.env.DEV} collapsed />
      <BackgroundCanvas />
      <BgSwitcher />
      <main className={styles.content}>
        <section className={styles.block}>
          <p className={styles.label}>{"// 01 — background test"}</p>
          <h1 className={styles.title}>
            Nand<em className="accent">i</em>ni Das
          </h1>
          <p className={styles.dim}>Move the mouse for parallax · scroll for drift</p>
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
