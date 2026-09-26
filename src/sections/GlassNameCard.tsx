import type { ReactNode } from "react";
import { site } from "../data/content";
import styles from "../styles/GlassNameCard.module.css";

/**
 * Transparent acrylic card that frames the hero name — the reference card's
 * clear glass, glowing peach rim, chip and mono "printed" details, rebuilt in
 * CSS so it stays crisp and responsive over the galaxy.
 */
export function GlassNameCard({ children }: { children: ReactNode }) {
  return (
    <div className={styles.card}>
      <span className={styles.chip} aria-hidden="true" />
      <span className={`${styles.meta} ${styles.topRight}`} aria-hidden="true">
        {site.cardLabel}
      </span>
      <div className={styles.body}>{children}</div>
      <span className={`${styles.meta} ${styles.bottomLeft}`} aria-hidden="true">
        {site.cardLine2}
      </span>
      <span className={`${styles.meta} ${styles.bottomRight}`} aria-hidden="true">
        {site.cardLine3}
      </span>
    </div>
  );
}
