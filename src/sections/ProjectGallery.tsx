import { useEffect, useRef } from "react";
import type { Project } from "../data/projects";
import styles from "../styles/ProjectGallery.module.css";

interface ProjectGalleryProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

/**
 * "How it works" view for a project: its gallery pictures as numbered steps with
 * captions. Native <dialog> → Esc to close, focus trapped, page behind inert.
 */
export function ProjectGallery({ project, open, onClose }: ProjectGalleryProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!project.gallery?.length) return null;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={`${project.slug}-gallery-title`}
      onClose={onClose}
      // Click on the backdrop (outside the panel) closes it.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <div>
            <p className={styles.label}>{"// how it works"}</p>
            <h3 id={`${project.slug}-gallery-title`} className={styles.title}>
              {project.title}
            </h3>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <ol className={styles.steps}>
          {project.gallery.map((step, i) => (
            <li key={step.src + i} className={styles.step}>
              <p className={styles.caption}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                {step.caption}
              </p>
              <img src={step.src} alt={step.caption} loading="lazy" className={styles.img} />
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}
