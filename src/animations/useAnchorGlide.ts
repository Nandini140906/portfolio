import { useEffect } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

/** Offset so sections land just below the fixed nav. */
const NAV_OFFSET = 64;

/**
 * Every in-page link (<a href="#…">) glides to its target with an eased scroll
 * instead of jumping. Instant under prefers-reduced-motion.
 */
export function useAnchorGlide(): void {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const href = a?.getAttribute("href");
      if (!href || href === "#") return;
      const target = href === "#top" ? document.body : document.querySelector<HTMLElement>(href);
      if (!target) return;
      e.preventDefault();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to(window, {
        scrollTo: { y: href === "#top" ? 0 : target, offsetY: NAV_OFFSET, autoKill: true },
        duration: reduced ? 0 : 1.2,
        ease: "power3.inOut",
      });
      history.replaceState(null, "", href);
      // Move keyboard focus to the destination for screen reader / keyboard users.
      if (href !== "#top") {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
