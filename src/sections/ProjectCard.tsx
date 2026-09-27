import type { SyntheticEvent } from "react";
import { PLACEHOLDER_IMAGE, type Project } from "../data/projects";
import styles from "../styles/Projects.module.css";

/** Missing screenshot → neutral placeholder (instead of a broken image). */
const onImgError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img.src.endsWith(PLACEHOLDER_IMAGE)) img.src = PLACEHOLDER_IMAGE;
};

export function ProjectCard({ project }: { project: Project }) {
  const { title, blurb, stack, image, liveUrl, repoUrl, featured } = project;
  const hasLive = liveUrl && liveUrl !== "#";
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ""}`}>
      <div className={styles.media}>
        <img src={image} alt={`Screenshot of ${title}`} loading="lazy" onError={onImgError} />
        {featured && <span className={styles.badge}>Featured</span>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.blurb}>{blurb}</p>
        <ul className={styles.stack} aria-label="Tech stack">
          {stack.map((s, i) => (
            <li key={`${s}-${i}`}>{s}</li>
          ))}
        </ul>
        <div className={styles.links}>
          {hasLive ? (
            <a href={liveUrl} target="_blank" rel="noreferrer" className={styles.link} data-magnetic>
              Live site <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className={`${styles.link} ${styles.disabled}`}>Coming soon</span>
          )}
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noreferrer" className={styles.link} data-magnetic>
              Code <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
