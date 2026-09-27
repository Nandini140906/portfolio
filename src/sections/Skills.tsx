import { SectionHeading } from "../components/SectionHeading";
import { skills } from "../data/content";
import styles from "../styles/Skills.module.css";

export function Skills() {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeading id="skills-title" index="03" label="Stack" title="Tools I *reach* for" />
        <div className={styles.grid} data-reveal-stagger>
          {skills.map((g, gi) => (
            <div key={g.group} className={`panel ${styles.group}`}>
              <header className={styles.groupHead}>
                <span className={styles.num}>{String(gi + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.groupTitle}>{g.group}</h3>
                  <p className={styles.groupBlurb}>{g.blurb}</p>
                </div>
              </header>
              {/* Vertical list: one skill per row with a plain-words note. */}
              <ul className={styles.list} data-reveal-chips>
                {g.items.map((s) => (
                  <li key={s.name} className={styles.item}>
                    <span className={styles.name}>{s.name}</span>
                    <span className={styles.note}>{s.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
