import { useCallback, useRef, useState, type SyntheticEvent } from "react";
import { HowItWorks } from "./HowItWorks";
import { useHoverTilt } from "../animations/useHoverTilt";
import { PLACEHOLDER_IMAGE, type Project } from "../data/projects";
import styles from "../styles/Projects.module.css";

export function ProjectCard({ project }: { project: Project }) {
  const { title, blurb, stack, image, liveUrl, repoUrl, note, featured, fallbackImage, howItWorks } = project;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const closeGallery = useCallback(() => setGalleryOpen(false), []);
  // Broken / unavailable screenshot → project fallback, then the neutral placeholder.
  const onImgError = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const next = fallbackImage && !img.src.endsWith(fallbackImage) ? fallbackImage : PLACEHOLDER_IMAGE;
    if (!img.src.endsWith(next)) img.src = next;
  };
  const ref = useRef<HTMLElement>(null);
  useHoverTilt(ref);
  const hasLive = !!liveUrl && liveUrl !== "#";
  return (
    <article ref={ref} className={`${styles.card} ${featured ? styles.featured : ""}`}>
      <div className={styles.media}>
        <img src={image} alt={`Screenshot of ${title}`} loading="lazy" onError={onImgError} />
        {howItWorks ? (
          <button type="button" className={styles.mediaBtn} onClick={() => setGalleryOpen(true)} aria-label={`How ${title} works`}>
            <span>How it works →</span>
          </button>
        ) : hasLive ? (
          // Live site: the whole screenshot links to the website.
          <a href={liveUrl} target="_blank" rel="noreferrer" className={styles.mediaBtn} aria-label={`Visit ${title} (opens in a new tab)`}>
            <span>Visit website ↗</span>
          </a>
        ) : null}
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
            <span className={`${styles.link} ${styles.disabled}`}>{note ?? "Coming soon"}</span>
          )}
          {howItWorks ? (
            <button type="button" className={`${styles.link} ${styles.linkBtn}`} onClick={() => setGalleryOpen(true)} data-magnetic>
              How it works <span aria-hidden="true">→</span>
            </button>
          ) : null}
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noreferrer" className={styles.link} data-magnetic>
              Code <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
      <HowItWorks project={project} open={galleryOpen} onClose={closeGallery} />
    </article>
  );
}
