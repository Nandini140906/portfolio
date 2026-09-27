import { SectionHeading } from "../components/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { projects } from "../data/projects";
import styles from "../styles/Projects.module.css";

export function Projects() {
  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <div className="container">
        <SectionHeading id="work-title" index="02" label="Selected work" title="Things I've *built*" />
        <div className={styles.grid} data-reveal-stagger>
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
