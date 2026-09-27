import { useSyncExternalStore } from "react";
import { shouldPlayIntro } from "./introGate";

/**
 * True while the intro fully covers the screen. The background galaxy pauses
 * rendering meanwhile (nobody can see it) and resumes at the handoff.
 * Starts true when the intro will play, so nothing renders (or animates in)
 * underneath before the intro's code has even loaded.
 */
let covering = shouldPlayIntro();
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
