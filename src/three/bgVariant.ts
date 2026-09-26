import { useSyncExternalStore } from "react";

export const BG_VARIANTS = ["a", "b", "c"] as const;
export type BgVariant = (typeof BG_VARIANTS)[number];

// TODO: once you pick a winner at Checkpoint 1, change the default here.
export const DEFAULT_BG: BgVariant = "a";

function fromUrl(): BgVariant {
  if (typeof window === "undefined") return DEFAULT_BG;
  const v = new URLSearchParams(window.location.search).get("bg")?.toLowerCase();
  return (BG_VARIANTS as readonly string[]).includes(v ?? "") ? (v as BgVariant) : DEFAULT_BG;
}

let current: BgVariant = fromUrl();
const listeners = new Set<() => void>();

export function setBgVariant(v: BgVariant): void {
  if (v === current) return;
  current = v;
  // Keep ?bg= in sync so the current view is always deep-linkable.
  const url = new URL(window.location.href);
  url.searchParams.set("bg", v);
  window.history.replaceState(null, "", url);
  listeners.forEach((l) => l());
}

export function useBgVariant(): BgVariant {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => DEFAULT_BG,
  );
}

/** Show the corner switcher in dev, or when someone deep-links with ?bg=. */
export const showBgSwitcher =
  import.meta.env.DEV ||
  (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("bg"));
