import { plexusConfig, rgba } from "../config";
import type { Filament } from "../Filament";
import type { Plexus, PlexusNode } from "../Plexus";

/**
 * Canvas-2D renderer for the shared plexus look (used by the hero intro and the
 * constellation cursor). Everything is drawn with additive "lighter" compositing,
 * so overlapping glows build up like bloom.
 */

// Pre-rendered radial glow sprite: far cheaper than a fresh gradient per node.
let glowSprite: HTMLCanvasElement | null = null;
let glowKey = "";
function getGlow(): HTMLCanvasElement {
  const { color, hot } = plexusConfig;
  const key = `${color.r},${color.g},${color.b}|${hot.r},${hot.g},${hot.b}`;
  if (glowSprite && glowKey === key) return glowSprite;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // Hot white pin-point → gold → transparent: a camera-bloom falloff.
  grad.addColorStop(0, rgba(hot, 1));
  grad.addColorStop(0.08, rgba(hot, 0.9));
  grad.addColorStop(0.22, rgba(color, 0.45));
  grad.addColorStop(0.5, rgba(color, 0.12));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  glowSprite = c;
  glowKey = key;
  return c;
}

/** A soft glowing dot of radius r at (x, y). */
export function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  if (alpha <= 0.002 || r <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(getGlow(), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/** Links + nodes of a plexus. `scale` multiplies sizes (e.g. camera zoom). */
export function drawPlexus(ctx: CanvasRenderingContext2D, plexus: Plexus, maxDist: number, scale = 1, fade = 1): void {
  const { color, lineWidth, nodeRadius, bloomRadius } = plexusConfig;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = lineWidth;
  for (const l of plexus.links(maxDist)) {
    ctx.strokeStyle = rgba(color, l.alpha * fade);
    ctx.beginPath();
    ctx.moveTo(l.a.x, l.a.y);
    ctx.lineTo(l.b.x, l.b.y);
    ctx.stroke();
  }
  for (const n of plexus.nodes) drawNode(ctx, n, nodeRadius * scale, bloomRadius * scale, fade);
  ctx.globalCompositeOperation = "source-over";
}

function drawNode(ctx: CanvasRenderingContext2D, n: PlexusNode, dot: number, bloom: number, fade: number): void {
  const a = n.alpha * fade;
  if (a < 0.01) return;
  if (n.bright) {
    drawGlow(ctx, n.x, n.y, bloom * n.size, a);
  } else {
    ctx.fillStyle = rgba(plexusConfig.color, 0.75 * a);
    ctx.beginPath();
    ctx.arc(n.x, n.y, dot * n.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Filament: a smooth curve through the trail's midpoints (quadratic segments with
 * the recorded points as control points), drawn segment by segment so each piece
 * gets its own width and alpha — thin and faint at the tail, bright at the head.
 */
export function drawFilament(ctx: CanvasRenderingContext2D, f: Filament, now: number, scale = 1): void {
  const pts = f.points;
  if (pts.length < 2 || f.intensity <= 0) return;
  const { color, hot, filamentWidth, filamentLife, filamentHeadGlow } = plexusConfig;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  const n = pts.length;
  for (let i = 1; i < n - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const m0x = (p0.x + p1.x) / 2;
    const m0y = (p0.y + p1.y) / 2;
    const m1x = (p1.x + p2.x) / 2;
    const m1y = (p1.y + p2.y) / 2;
    // Position along the trail (0 tail → 1 head) × freshness.
    const along = i / (n - 1);
    const life = Math.max(0, 1 - (now - p1.t) / filamentLife);
    const k = along * life;
    ctx.strokeStyle = rgba(k > 0.7 ? hot : color, k * 0.9 * f.intensity);
    ctx.lineWidth = Math.max(0.3, filamentWidth * scale * (0.15 + 0.85 * k));
    ctx.beginPath();
    ctx.moveTo(m0x, m0y);
    ctx.quadraticCurveTo(p1.x, p1.y, m1x, m1y);
    ctx.stroke();
  }
  const head = pts[n - 1];
  if (f.showHead) drawGlow(ctx, head.x, head.y, filamentHeadGlow * scale, f.intensity);
  ctx.globalCompositeOperation = "source-over";
}
