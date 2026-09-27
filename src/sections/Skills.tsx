import { SectionHeading } from "../components/SectionHeading";
import { skills } from "../data/content";
import styles from "../styles/Skills.module.css";

export function Skills() {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeading id="skills-title" index="03" label="Stack" title="Tools I *reach* for" />
        <div className={styles.grid}>
          {skills.map((g, gi) => (
            <div key={g.group} className={`panel ${styles.group}`}>
              <h3 className={styles.groupTitle}>
                <span className={styles.num}>{String(gi + 1).padStart(2, "0")}</span>
                {g.group}
              </h3>
              <ul className={styles.chips}>
                {g.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
