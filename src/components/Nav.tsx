import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { contact, nav, site } from "../data/content";
import { useIntroCovering } from "../intro/introStore";
import styles from "../styles/Nav.module.css";

const linkedin = contact.socials.find((s) => s.label === "LinkedIn")?.href;
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Fixed top nav: name, section links with a glowing pill that slides to the
 * section currently in view and a scroll-progress line (link clicks glide via useAnchorGlide).
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const introCovering = useIntroCovering();

  // Scrolled state + progress line (written straight to the DOM, no re-render per frame).
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Which section is in view: the one crossing the middle band of the screen.
  useEffect(() => {
    const ids = nav.map((l) => l.href.slice(1));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    const top = document.getElementById("top");
    const clear = new IntersectionObserver(([e]) => e.isIntersecting && setActive(null), { rootMargin: "-45% 0px -50% 0px" });
    if (top) clear.observe(top);
    return () => {
      io.disconnect();
      clear.disconnect();
    };
  }, []);

  // Slide the pill to the active link.
  useLayoutEffect(() => {
    const pill = pillRef.current;
    const list = listRef.current;
    if (!pill || !list) return;
    const link = active ? list.querySelector<HTMLElement>(`a[href="#${active}"]`) : null;
    if (!link) {
      gsap.to(pill, { autoAlpha: 0, duration: 0.3 });
      return;
    }
    const lr = link.getBoundingClientRect();
    const pr = list.getBoundingClientRect();
    gsap.to(pill, {
      autoAlpha: 1,
      x: lr.left - pr.left - 12,
      width: lr.width + 24,
      duration: reduced() ? 0 : 0.55,
      ease: "power3.out",
    });
  }, [active]);

  // Entrance once the intro has handed off.
  useEffect(() => {
    if (introCovering || reduced() || !rootRef.current) return;
    const items = rootRef.current.querySelectorAll("[data-nav-item]");
    gsap.from(items, { autoAlpha: 0, y: -16, duration: 0.8, stagger: 0.07, ease: "power3.out", delay: 0.3, clearProps: "all" });
  }, [introCovering]);


  return (
    <header ref={rootRef} className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#top" className={styles.logo} data-nav-item>
        {site.name.split(" ")[0]} <em className={styles.logoAccent}>{site.name.split(" ").slice(1).join(" ")}</em>
      </a>
      <nav aria-label="Primary" data-nav-item>
        <ul ref={listRef} className={styles.links}>
          <span ref={pillRef} className={styles.pill} aria-hidden="true" />
          {nav.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`${styles.link} ${active === l.href.slice(1) ? styles.active : ""}`}
                data-magnetic
                aria-current={active === l.href.slice(1) ? "true" : undefined}
              >
                {l.label}
              </a>
            </li>
          ))}
          {linkedin && (
            <li className={styles.hideSm}>
              <a href={linkedin} target="_blank" rel="noreferrer" className={styles.link}>
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </li>
          )}
        </ul>
      </nav>
      <span ref={progressRef} className={styles.progress} aria-hidden="true" />
    </header>
  );
}
