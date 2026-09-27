import { forwardRef } from "react";
import { renderAccent } from "../components/Accent";
import styles from "../styles/HeroIntro.module.css";

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
