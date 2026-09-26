import { plexusConfig } from "./config";

export interface FilamentPoint {
  x: number;
  y: number;
  /** Time (s) the point was recorded. */
  t: number;
}

/**
 * A glowing light-streak: a short history of head positions. Points age out after
 * `filamentLife` seconds; the renderer draws them as a smooth tapering curve whose
 * alpha and width fall off toward the tail, with a bright node at the head.
 */
export class Filament {
  readonly points: FilamentPoint[] = [];
  /** Overall opacity multiplier (fade a whole filament in/out). */
  intensity = 1;
  /** Hide the head glow (e.g. once the streak has landed and become a node). */
  showHead = true;

  /** Record the head position. Skips sub-pixel moves so the tail stays smooth. */
  push(x: number, y: number, now: number): void {
    const last = this.points[this.points.length - 1];
    if (last && Math.abs(last.x - x) + Math.abs(last.y - y) < 0.75) {
      last.t = now; // head still here — keep it fresh
      return;
    }
    this.points.push({ x, y, t: now });
  }

  /** Drop points older than the configured life. */
  prune(now: number): void {
    const life = plexusConfig.filamentLife;
    let drop = 0;
    while (drop < this.points.length && now - this.points[drop].t > life) drop++;
    if (drop) this.points.splice(0, drop);
  }

  get head(): FilamentPoint | undefined {
    return this.points[this.points.length - 1];
  }
}
