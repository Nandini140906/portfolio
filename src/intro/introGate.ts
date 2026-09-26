const KEY = "nd-intro-played";

/**
 * Should the intro play on this page load?
 *  - `?intro=1` always forces it (dev / demo replays)
 *  - never under prefers-reduced-motion
 *  - otherwise once per browser session (sessionStorage), so navigating back
 *    doesn't replay it. If storage is blocked we play it — worst case it replays.
 */
export function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("intro") === "1") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.sessionStorage.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

export function markIntroPlayed(): void {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked — ignore */
  }
}
