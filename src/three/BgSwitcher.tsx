import { BG_VARIANTS, setBgVariant, showBgSwitcher, useBgVariant } from "./bgVariant";
import styles from "../styles/BgSwitcher.module.css";

/** Tiny dev-only corner toggle to flip background variants without leva. */
export function BgSwitcher() {
  const current = useBgVariant();
  if (!showBgSwitcher) return null;

  return (
    <div className={styles.switcher} role="group" aria-label="Background variant">
      <span className={styles.label}>bg</span>
      {BG_VARIANTS.map((v) => (
        <button
          key={v}
          type="button"
          className={styles.btn}
          aria-pressed={v === current}
          onClick={() => setBgVariant(v)}
        >
          {v === "card" ? "Card" : "B"}
        </button>
      ))}
    </div>
  );
}
