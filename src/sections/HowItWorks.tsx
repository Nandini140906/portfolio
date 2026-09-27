import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import type { Project } from "../data/projects";
import styles from "../styles/HowItWorks.module.css";

interface HowItWorksProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

/**
 * Plain-language walkthrough of a project. A regular fixed overlay portalled to
 * <body> (not a native top-layer <dialog>), so the constellation cursor (z 50)
 * stays visible above it. Esc / backdrop click close it; focus is kept inside
 * while open and restored afterwards; the page behind doesn't scroll.
 */
export function HowItWorks({ project, open, onClose }: HowItWorksProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hiw = project.howItWorks;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("[data-close]")?.focus();

    if (panel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.from(panel, { autoAlpha: 0, y: 24, scale: 0.98, duration: 0.45, ease: "power3.out", clearProps: "all" });
      gsap.from(panel.querySelectorAll("[data-step]"), { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.08, delay: 0.15, ease: "power2.out" });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel) return;
      // Simple focus trap.
      const f = panel.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !hiw) return null;

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${project.slug}-hiw-title`}
      >
        <header className={styles.head}>
          <div>
            <p className={styles.label}>How it works</p>
            <h3 id={`${project.slug}-hiw-title`} className={styles.title}>
              {project.title}
            </h3>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close" data-close data-magnetic>
            ✕
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.summary}>{hiw.summary}</p>

          <ol className={styles.steps}>
            {hiw.steps.map((step, i) => (
              <li key={step.title} className={styles.step} data-step>
                <div className={styles.stepHead}>
                  <span className={styles.num}>Step {i + 1}</span>
                  <h4 className={styles.stepTitle}>{step.title}</h4>
                </div>
                <p className={styles.text}>{step.text}</p>
                <img src={step.image} alt="" loading="lazy" className={styles.img} />
                {step.parts && (
                  <dl className={styles.parts}>
                    {step.parts.map((part) => (
                      <div key={part.name} className={styles.part}>
                        <dt>{part.name}</dt>
                        <dd>{part.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ol>

          <section className={styles.results} data-step aria-label="The result">
            <h4 className={styles.resultsTitle}>The result</h4>
            <ul>
              {hiw.results.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
