import { renderAccent } from "./Accent";
import styles from "../styles/SectionHeading.module.css";

interface SectionHeadingProps {
  /** e.g. "01" → rendered as the mono label "// 01 — About". */
  index: string;
  label: string;
  /** Heading text; one *word* becomes the gold italic accent. */
  title: string;
  id?: string;
}

export function SectionHeading({ index, label, title, id }: SectionHeadingProps) {
  return (
    <header className={styles.head}>
      <p className={styles.label}>
        <span className={styles.index}>{`// ${index}`}</span> — {label}
      </p>
      <h2 id={id} className={styles.title}>
        {renderAccent(title)}
      </h2>
    </header>
  );
}
