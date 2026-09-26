import { useSyncExternalStore } from "react";

/**
 * True while the intro fully covers the screen. The background galaxy pauses
 * rendering meanwhile (nobody can see it) and resumes at the handoff.
 */
let covering = false;
const listeners = new Set<() => void>();

export function setIntroCovering(v: boolean): void {
  if (v === covering) return;
  covering = v;
  listeners.forEach((l) => l());
}

export function useIntroCovering(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => covering,
    () => false,
  );
}
