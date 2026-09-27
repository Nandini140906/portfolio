import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reveal, scroll } from "../three/motionStore";
import { splitWordsByLine } from "./splitWords";

gsap.registerPlugin(ScrollTrigger);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

// Scattered galaxy until the Hero reveal (skipped entirely under reduced motion).
if (typeof window !== "undefined" && window.matchMedia(MOTION_OK).matches) reveal.converge = 0;

const q = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/**
 * All scroll-driven animation for the page, set up once the intro has handed off.
 * Markup opts in with data attributes:
 *   data-hero-micro / data-hero-cue  Hero label + scroll cue (on-load entrance)
 *   data-reveal-head                 section heading: label fades, title wipes up
 *   data-reveal-lines                paragraph revealed line by line
 *   data-reveal-stagger              direct children stagger up on enter
 *   data-reveal-chips                <li> chips stagger in (inside a stagger item)
 *   data-reveal                      single element fades + rises
 * Also scrubs values in motionStore so the 3D background responds to scrolling.
 * Under prefers-reduced-motion nothing animates: content is simply visible.
 */
export function useScrollAnimations(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      let cancelled = false;
      const fromUp = { autoAlpha: 0, y: 40 };

      // ---- Hero entrance (the card assembles itself; see NotchedGlassCard) ----
      gsap.to(reveal, { converge: 1, duration: 2.2, ease: "power3.out" });
      gsap.from(q("[data-hero-micro]"), { ...fromUp, y: 14, duration: 0.8, delay: 0.5, ease: "power2.out" });
      gsap.from(q("[data-hero-cue]"), { autoAlpha: 0, y: -10, duration: 0.8, delay: 1.1, ease: "power2.out" });

      // ---- Background linkage ----
      // Scroll velocity briefly speeds up the galaxy's spin, easing back when you stop.
      const boostTo = gsap.quickTo(scroll, "boost", { duration: 0.6, ease: "power2.out" });
      const velocity = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => boostTo(Math.min(5, Math.abs(self.getVelocity()) / 500)),
      });
      const onScrollEnd = () => boostTo(0);
      ScrollTrigger.addEventListener("scrollEnd", onScrollEnd);
      // Each section boundary gives the camera a gentle push-in and back. Sections
      // report their own progress; the strongest bump wins (they'd overwrite each
      // other if each tweened scroll.nudge directly).
      const bumps: number[] = [];
      const nudgeTo = gsap.quickTo(scroll, "nudge", { duration: 0.5, ease: "power2.out" });
      const sectionTriggers = q("main section:not(#top)").map((sec, i) =>
        ScrollTrigger.create({
          trigger: sec,
          start: "top 85%",
          end: "top 15%",
          onUpdate: (self) => {
            bumps[i] = Math.sin(Math.PI * self.progress); // 0 → 1 → 0 across the window
            nudgeTo(0.9 * Math.max(0, ...bumps));
          },
          onToggle: (self) => {
            if (!self.isActive) {
              bumps[i] = 0;
              nudgeTo(0.9 * Math.max(0, ...bumps));
            }
          },
        }),
      );

      // ---- Section reveals ----
      const enter = (trigger: Element) => ({ trigger, start: "top 82%", once: true });

      for (const head of q("[data-reveal-head]")) {
        const tl = gsap.timeline({ scrollTrigger: enter(head) });
        tl.from(head.querySelector("p"), { autoAlpha: 0, x: -12, duration: 0.6, ease: "power2.out" });
        // Mask wipe upward: the title is revealed bottom → top while rising slightly.
        tl.from(
          head.querySelector("h2"),
          { clipPath: "inset(0 0 100% 0)", y: 24, duration: 1, ease: "power3.out", clearProps: "clipPath" },
          0.1,
        );
      }

      for (const el of q("[data-reveal]")) {
        gsap.from(el, { ...fromUp, duration: 1, ease: "power3.out", clearProps: "opacity,visibility,transform", scrollTrigger: enter(el) });
      }

      for (const grid of q("[data-reveal-stagger]")) {
        gsap.from(Array.from(grid.children), {
          ...fromUp,
          y: 60,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
          scrollTrigger: enter(grid),
        });
        for (const chips of q("[data-reveal-chips]", grid)) {
          gsap.from(q("li", chips), {
            autoAlpha: 0,
            y: 10,
            scale: 0.92,
            duration: 0.45,
            stagger: 0.05,
            ease: "back.out(2)",
            delay: 0.35,
            scrollTrigger: enter(grid),
          });
        }
      }

      // Line-by-line paragraphs need final fonts to measure line breaks.
      document.fonts.ready.then(() => {
        if (cancelled) return;
        for (const p of q("[data-reveal-lines]")) {
          const lines = splitWordsByLine(p);
          const tl = gsap.timeline({ scrollTrigger: enter(p) });
          lines.forEach((line, i) => {
            tl.from(line, { autoAlpha: 0, y: 18, duration: 0.7, ease: "power2.out" }, i * 0.09);
          });
        }
        ScrollTrigger.refresh();
      });

      return () => {
        cancelled = true;
        velocity.kill();
        sectionTriggers.forEach((t) => t.kill());
        ScrollTrigger.removeEventListener("scrollEnd", onScrollEnd);
        scroll.boost = 0;
        scroll.nudge = 0;
        reveal.converge = 1;
      };
    });

    // Reduced motion: formed galaxy, no scroll-driven extras.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      reveal.converge = 1;
    });

    return () => mm.revert();
  }, [ready]);
}
