/**
 * Should the intro play on this page load?
 *  - every load / refresh by default
 *  - never under prefers-reduced-motion
 *  - `?intro=0` turns it off (handy while developing other sections)
 */
export function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("intro") === "0") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
