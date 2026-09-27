import { useEffect, useState } from "react";
import { contact, nav } from "../data/content";
import styles from "../styles/Nav.module.css";

/** Minimal fixed top nav: mono logo + section links; gains a glass backing once scrolled. */
const linkedin = contact.socials.find((s) => s.label === "LinkedIn")?.href;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#top" className={styles.logo} aria-label="Nandini Das — back to top">
        N<span className={styles.dot}>·</span>D
      </a>
      <nav aria-label="Primary">
        <ul className={styles.links}>
          {nav.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={styles.link}>
                {l.label}
              </a>
            </li>
          ))}
          {linkedin && (
            <li>
              <a href={linkedin} target="_blank" rel="noreferrer" className={`${styles.link} ${styles.ext}`}>
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
