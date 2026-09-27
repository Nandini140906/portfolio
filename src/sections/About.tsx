import { SectionHeading } from "../components/SectionHeading";
import { about } from "../data/content";
import styles from "../styles/About.module.css";

export function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <div className={styles.grid}>
          <SectionHeading id="about-title" index="01" label="About" title={about.heading} />
          <div className={`panel ${styles.body}`}>
            {about.paragraphs.map((p, i) => (
              <p key={i} className={styles.para} data-reveal-lines>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
