import { plexusConfig } from "./config";

export interface PlexusNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where the spring pulls this node. */
  tx: number;
  ty: number;
  /** Current / target visibility 0–1 (eased, so nodes fade in and out). */
  alpha: number;
  targetAlpha: number;
  /** Size multiplier (e.g. from fake depth). */
  size: number;
  /** Bright bloom node vs small dim point. */
  bright: boolean;
  /** Per-node random phase for noise drift. */
  seed: number;
}

export interface PlexusLink {
  a: PlexusNode;
  b: PlexusNode;
  /** Final link opacity (distance falloff × both nodes' alpha). */
  alpha: number;
}

/**
 * Framework-agnostic node system: spring-to-target motion with a gentle noise
 * drift, eased fade in/out, and distance-thresholded links. Renderers (Canvas 2D
 * today) only read `nodes` and `links()`.
 */
export class Plexus {
  nodes: PlexusNode[] = [];
  private readonly linkBuf: PlexusLink[] = [];

  add(x: number, y: number, opts: Partial<PlexusNode> = {}): PlexusNode {
    const n: PlexusNode = {
      x,
      y,
      vx: 0,
      vy: 0,
      tx: x,
      ty: y,
      alpha: 0,
      targetAlpha: 1,
      size: 1,
      bright: Math.random() < plexusConfig.brightFraction,
      seed: Math.random() * 1000,
      ...opts,
    };
    this.nodes.push(n);
    return n;
  }

  clear(): void {
    this.nodes.length = 0;
  }

  /** Advance the simulation. `t` = seconds since start (drives the drift noise). */
  update(dt: number, t: number): void {
    const { spring, damping, drift } = plexusConfig;
    for (const n of this.nodes) {
      // Drift: two sines per axis on the node's own phase ≈ smooth 1D noise,
      // added to the target so nodes "breathe" around where they belong.
      const dx = (Math.sin(t * 0.7 + n.seed) + Math.sin(t * 1.31 + n.seed * 1.7) * 0.5) * drift;
      const dy = (Math.cos(t * 0.63 + n.seed * 1.3) + Math.sin(t * 1.17 + n.seed * 0.7) * 0.5) * drift;
      // Damped spring: a = k·(target − x) − c·v  (semi-implicit Euler, stable at 60fps).
      n.vx += (spring * (n.tx + dx - n.x) - damping * n.vx) * dt;
      n.vy += (spring * (n.ty + dy - n.y) - damping * n.vy) * dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.alpha += (n.targetAlpha - n.alpha) * (1 - Math.exp(-6 * dt));
    }
  }

  /**
   * Pairs of visible nodes closer than maxDist. Opacity falls off linearly from
   * lineAlphaMax (touching) to lineAlphaMin (at maxDist). O(n²) — fine for the
   * ≤150 nodes we ever use. The returned array is reused between calls.
   */
  links(maxDist = plexusConfig.linkDist): PlexusLink[] {
    const out = this.linkBuf;
    out.length = 0;
    if (maxDist <= 0) return out;
    const { lineAlphaMin, lineAlphaMax } = plexusConfig;
    const max2 = maxDist * maxDist;
    const ns = this.nodes;
    for (let i = 0; i < ns.length; i++) {
      const a = ns[i];
      if (a.alpha < 0.03) continue;
      for (let j = i + 1; j < ns.length; j++) {
        const b = ns[j];
        if (b.alpha < 0.03) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > max2) continue;
        const f = Math.sqrt(d2) / maxDist;
        out.push({ a, b, alpha: (lineAlphaMax + (lineAlphaMin - lineAlphaMax) * f) * Math.min(a.alpha, b.alpha) });
      }
    }
    return out;
  }
}
