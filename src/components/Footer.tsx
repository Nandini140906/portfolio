import { site } from "../data/content";
import styles from "../styles/Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>{"// est. 2026"}</span>
      <span>
        © {new Date().getFullYear()} {site.name}
      </span>
      <a href="#top" className={styles.top}>
        Back to top ↑
      </a>
    </footer>
  );
}
