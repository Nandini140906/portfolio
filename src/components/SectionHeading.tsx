import { renderAccent } from "./Accent";
import styles from "../styles/SectionHeading.module.css";

interface SectionHeadingProps {
  /** e.g. "01" → "(01) ——— About" label + giant outlined numeral behind. */
  index: string;
  label: string;
  /** Heading text; one *word* becomes the serif-italic gradient accent. */
  title: string;
  id?: string;
}

/**
 * Editorial section heading: mixes a tight sans for the plain words with an
 * oversized serif-italic gradient accent word (the type pairing from the
 * reference clip), a numbered rule label, and a huge outlined index behind it.
 */
export function SectionHeading({ index, label, title, id }: SectionHeadingProps) {
  return (
    <header className={styles.head} data-reveal-head>
      <span className={styles.ghost} aria-hidden="true">
        {index}
      </span>
      <p className={styles.label}>
        <span className={styles.index}>({index})</span>
        <span className={styles.rule} aria-hidden="true" />
        {label}
      </p>
      <h2 id={id} className={styles.title}>
        {renderAccent(title)}
      </h2>
    </header>
  );
}
