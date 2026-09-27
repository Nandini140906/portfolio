import { Plexus } from "../plexus/Plexus";
import { Filament } from "../plexus/Filament";
import { plexusConfig, rgba } from "../plexus/config";
import { drawFilament, drawGlow, drawPlexus } from "../plexus/renderers/canvas2d";

const NODES = 12;

/**
 * The constellation cursor's simulation + drawing, built on the shared plexus
 * engine so it matches the intro exactly: a filament streak trailing the
 * pointer, and a small plexus of nodes orbiting and lagging behind it.
 */
export class CursorScene {
  private readonly plexus = new Plexus();
  private readonly trail = new Filament();
  private readonly orbit: { angle: number; radius: number; speed: number }[] = [];
  /** Pointer position (CSS px) and whether it's in the window. */
  x = -100;
  y = -100;
  inside = false;
  /** 0 → 1 while over a link/button: the cluster tightens and brightens. */
  private hover = 0;
  hoverTarget = 0;
  /** 0 → 1 over text/info: the web fades out, only the string (trail) remains. */
  private reading = 0;
  readingTarget = 0;
  private presence = 0;

  constructor() {
    for (let i = 0; i < NODES; i++) {
      const angle = (i / NODES) * Math.PI * 2 + Math.random() * 0.5;
      this.orbit.push({
        angle,
        radius: 22 + Math.random() * 42,
        speed: (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.35),
      });
      // Only a few bright bloom dots; the rest are small dim points.
      this.plexus.add(this.x, this.y, { bright: i % 4 === 0, alpha: 0, targetAlpha: 0 });
    }
  }

  frame(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, dt: number): void {
    ctx.clearRect(0, 0, w, h);
    const ease = (k: number) => 1 - Math.exp(-k * dt);
    this.hover += (this.hoverTarget - this.hover) * ease(8);
    this.reading += (this.readingTarget - this.reading) * ease(6);
    const web = 1 - this.reading; // visibility of the node web
    this.presence += ((this.inside ? 1 : 0) - this.presence) * ease(5);
    if (this.presence < 0.01 && this.trail.points.length === 0) return;

    // Hover pulls the orbit in tight (the web "locks on" to the element).
    const spread = 1 - 0.55 * this.hover;
    this.plexus.nodes.forEach((n, i) => {
      const o = this.orbit[i];
      const a = o.angle + now * o.speed;
      n.tx = this.x + Math.cos(a) * o.radius * spread;
      n.ty = this.y + Math.sin(a) * o.radius * spread;
      n.targetAlpha = this.presence * (0.55 + 0.45 * this.hover) * web;
      if (n.alpha < 0.01) {
        n.x = this.x;
        n.y = this.y;
      }
    });
    this.plexus.update(dt, now);

    if (this.inside) this.trail.push(this.x, this.y, now);
    this.trail.prune(now);

    const fade = Math.min(1, this.presence * (1 + 0.4 * this.hover)) * web;
    // Thin links from the nearest nodes back to the pointer head.
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = plexusConfig.lineWidth;
    for (const n of this.plexus.nodes) {
      const d = Math.hypot(n.x - this.x, n.y - this.y);
      if (d > 48 * spread + 10) continue;
      ctx.strokeStyle = rgba(plexusConfig.color, plexusConfig.lineAlphaMax * (1 - d / 70) * n.alpha * web);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    drawFilament(ctx, this.trail, now, 0.75);
    if (web > 0.01) drawPlexus(ctx, this.plexus, plexusConfig.linkDist * 0.55, 0.7, fade);
    // Bright head node; swells a little on hover, shrinks to a small point while reading.
    const headR = plexusConfig.filamentHeadGlow * (0.7 + 0.5 * this.hover) * (1 - 0.55 * this.reading);
    drawGlow(ctx, this.x, this.y, headR, this.presence);
  }
}
