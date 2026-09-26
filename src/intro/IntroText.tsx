import { forwardRef, type ReactNode } from "react";
import styles from "../styles/HeroIntro.module.css";

/** "a *word* here" → ["a ", <em>word</em>, " here"] (gold italic accent). */
function renderAccent(line: string): ReactNode[] {
  return line.split(/\*(.+?)\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} className="accent">
        {part}
      </em>
    ) : (
      part
    ),
  );
}

/**
 * One intro line with the ghosted reflection underneath (a flipped, faded,
 * slightly blurred copy — like type standing on a glossy floor).
 */
export const IntroLine = forwardRef<HTMLDivElement, { text: string }>(function IntroLine({ text }, ref) {
  const content = renderAccent(text);
  return (
    <div ref={ref} className={styles.line}>
      <p className={styles.text}>{content}</p>
      <p className={styles.reflection} aria-hidden="true">
        {content}
      </p>
    </div>
  );
});
