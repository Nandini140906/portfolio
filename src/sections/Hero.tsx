import { NotchedGlassCard } from "./NotchedGlassCard";
import { site } from "../data/content";
import styles from "../styles/Hero.module.css";

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-label="Intro">
      <p className={styles.micro}>{site.heroLabel}</p>
      <NotchedGlassCard>
        <h1 className={styles.title}>
          Nand<em className="accent">i</em>ni Das
        </h1>
        <p className={styles.tagline}>{site.tagline}</p>
      </NotchedGlassCard>
      <a href="#about" className={styles.cue} aria-label="Scroll to About">
        <span>scroll</span>
        <i className={styles.cueLine} aria-hidden="true" />
      </a>
    </section>
  );
}
