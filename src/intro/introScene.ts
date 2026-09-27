import { Plexus, type PlexusNode } from "../plexus/Plexus";
import { Filament } from "../plexus/Filament";
import { plexusConfig } from "../plexus/config";
import { drawFilament, drawGlow, drawPlexus } from "../plexus/renderers/canvas2d";

/** Beat progress values, each 0 → 1, driven by the GSAP timeline in HeroIntro. */
export interface IntroBeats {
  streak: number; // 1. a single filament flies in and lands centre
  bud: number; // 2. a small cluster fans out from the landing point
  streams: number; // 3. many weaving streams arc out and converge
  burst: number; // 4. everything resolves into a dense 3D plexus
  zoom: number; // camera push-in (1 = none)
  join: number; // 5. handoff: the network collapses onto the hero card's outline
  fade: number; // overlay fade (dust + nodes dim)
}

interface NetNode {
  node: PlexusNode;
  /** Position in the 3D network (px units, centred on 0). */
  X: number;
  Y: number;
  Z: number;
  /** Stream it drops out of, and where along it (0–1). */
  stream: number;
  u0: number;
  /** Burst progress at which it joins the network. */
  joinAt: number;
}

interface Stream {
  filament: Filament;
  angle: number;
  radius: number;
  sweep: number;
  delay: number;
}

interface Speck {
  x: number;
  y: number;
  r: number;
  a: number;
  seed: number;
}

const BUD_COUNT = 7;

export class IntroScene {
  readonly beats: IntroBeats = { streak: 0, bud: 0, streams: 0, burst: 0, zoom: 1, join: 0, fade: 0 };

  private readonly plexus = new Plexus();
  private readonly seed = new Filament();
  private streams: Stream[] = [];
  private net: NetNode[] = [];
  private dust: Speck[] = [];
  private w = 1;
  private h = 1;

  /**
   * @param getTarget where the hero card sits on screen (CSS px); the network
   *   joins onto this outline at the end. Null → a centred default box.
   */
  constructor(
    private readonly mobile: boolean,
    private readonly getTarget: () => DOMRect | null = () => null,
  ) {}

  /** Point at t ∈ [0,1) along a rectangle's perimeter (clockwise from top-left). */
  private static perimeter(r: { x: number; y: number; w: number; h: number }, t: number): [number, number] {
    const P = 2 * (r.w + r.h);
    let d = (((t % 1) + 1) % 1) * P;
    if (d < r.w) return [r.x + d, r.y];
    d -= r.w;
    if (d < r.h) return [r.x + r.w, r.y + d];
    d -= r.h;
    if (d < r.w) return [r.x + r.w - d, r.y + r.h];
    d -= r.w;
    return [r.x, r.y + r.h - d];
  }

  /** (Re)build everything for a viewport size in CSS px. */
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    const m = Math.min(w, h);
    const rand = Math.random;

    const K = this.mobile ? 5 : 9;
    this.streams = Array.from({ length: K }, (_, i) => ({
      filament: new Filament(),
      angle: (i / K) * Math.PI * 2 + rand() * 0.6,
      // Big arcs that reach well across the viewport before returning to centre.
      radius: (0.28 + rand() * 0.22) * Math.max(w, h),
      sweep: (rand() < 0.5 ? -1 : 1) * (1.2 + rand() * 1.1),
      delay: (i / K) * 0.35,
    }));

    this.plexus.clear();
    const N = this.mobile ? 55 : 110;
    const R = m * 0.42;
    this.net = Array.from({ length: N }, (_, i) => {
      // Random point in a ball (cube-root radius → uniform volume), squashed a bit in Y.
      const u = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = R * (0.3 + 0.7 * Math.cbrt(rand()));
      const node = this.plexus.add(w / 2, h / 2, { targetAlpha: 0, alpha: 0 });
      return {
        node,
        X: s * Math.cos(phi) * r,
        Y: u * r * 0.8,
        Z: s * Math.sin(phi) * r,
        stream: i % K,
        u0: 0.2 + rand() * 0.7,
        joinAt: (i / N) * 0.65,
      };
    });
    // The bud cluster (first few nodes) is always bright — it's the story's "seed".
    for (let i = 0; i < BUD_COUNT; i++) this.net[i].node.bright = true;

    this.dust = Array.from({ length: this.mobile ? 40 : 90 }, () => ({
      x: rand() * w,
      y: rand() * h,
      r: 1.5 + rand() * 3.5,
      a: 0.08 + rand() * 0.22,
      seed: rand() * 100,
    }));
  }

  /** Point on the seed streak: a quadratic Bézier from off-screen left to centre. */
  private streakPos(k: number): [number, number] {
    const { w, h } = this;
    const p0 = [-0.08 * w, 0.72 * h];
    const c = [0.22 * w, 0.18 * h];
    const p1 = [w / 2, h / 2];
    const a = (1 - k) * (1 - k);
    const b = 2 * (1 - k) * k;
    const d = k * k;
    return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
  }

  /**
   * Point on stream s at u ∈ [0,1]: leaves centre, arcs out and returns
   * (radius ∝ sin(πu)), while the angle sweeps — a weaving loop.
   */
  private streamPos(s: Stream, u: number): [number, number] {
    const r = s.radius * Math.sin(Math.PI * u);
    const a = s.angle + s.sweep * u;
    return [this.w / 2 + Math.cos(a) * r, this.h / 2 + Math.sin(a) * r * 0.7];
  }

  frame(ctx: CanvasRenderingContext2D, now: number, dt: number): void {
    const { w, h, beats: B } = this;
    const cx = w / 2;
    const cy = h / 2;
    const fadeOut = 1 - B.fade;
    const tr = this.getTarget();
    const box = tr
      ? { x: tr.left, y: tr.top, w: tr.width, h: tr.height }
      : { x: w * 0.2, y: h * 0.38, w: w * 0.6, h: h * 0.24 };
    // Smoothstep'd join so nodes ease in and settle onto the outline.
    const J = B.join * B.join * (3 - 2 * B.join);

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#07070c";
    ctx.fillRect(0, 0, w, h);

    // Floating dust (screen space, behind everything).
    for (const d of this.dust) {
      const y = (d.y - now * 6 + h) % h;
      const x = d.x + Math.sin(now * 0.3 + d.seed) * 8;
      const tw = 0.6 + 0.4 * Math.sin(now * 1.3 + d.seed);
      drawGlow(ctx, x, y, d.r * 3, d.a * tw * fadeOut);
    }

    // Camera push-in; eases back to 1× during the join so the outline lands
    // exactly where the real card is.
    const zoom = 1 + (B.zoom - 1) * (1 - J);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    // 1. Seed streak.
    if (B.streak > 0 && B.streak < 1) {
      const [x, y] = this.streakPos(B.streak);
      this.seed.push(x, y, now);
    }
    this.seed.showHead = B.streak < 1;
    this.seed.prune(now);
    drawFilament(ctx, this.seed, now);

    // 3. Weaving streams.
    for (const s of this.streams) {
      const u = (B.streams - s.delay) / (1 - 0.35);
      if (u > 0 && u < 1) {
        const [x, y] = this.streamPos(s, u);
        s.filament.push(x, y, now);
      }
      s.filament.showHead = u > 0 && u < 1;
      s.filament.prune(now);
      drawFilament(ctx, s.filament, now, this.mobile ? 0.8 : 1);
    }

    // Network rotation → 3D projection for the burst layout.
    const rot = now * 0.12 + B.burst * 0.8;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const F = Math.min(w, h) * 1.1; // perspective focal length

    this.net.forEach((nn, i) => {
      const n = nn.node;
      const isBud = i < BUD_COUNT;
      const x3 = nn.X * cos - nn.Z * sin;
      const z3 = nn.X * sin + nn.Z * cos;
      const persp = F / (F + z3);
      const joined = B.burst > nn.joinAt;

      if (joined || J > 0) {
        // 4. In the network: projected 3D position; nearer = bigger.
        const nx = cx + x3 * persp;
        const ny = cy - h * 0.05 + nn.Y * persp; // sits a touch high, clear of the text
        // 5. Join: glide onto evenly spaced points of the card's outline.
        const [ox, oy] = IntroScene.perimeter(box, i / this.net.length + 0.08);
        n.tx = nx + (ox - nx) * J;
        n.ty = ny + (oy - ny) * J;
        n.size = persp + (1 - persp) * J;
        n.targetAlpha = Math.min(1, 0.35 + 0.65 * persp + J) * fadeOut;
      } else if (isBud && B.bud > 0) {
        // 2. Bud: fan out around the landing point.
        const a = (i / BUD_COUNT) * Math.PI * 2 + 0.4;
        const r = (30 + (i % 3) * 22) * B.bud;
        n.tx = cx + Math.cos(a) * r;
        n.ty = cy + Math.sin(a) * r;
        if (n.alpha < 0.01) {
          n.x = cx;
          n.y = cy;
        }
        n.targetAlpha = B.bud;
      } else if (!isBud && B.streams > 0) {
        // 3. Nodes drop out of the streams as their heads pass.
        const s = this.streams[nn.stream];
        const u = (B.streams - s.delay) / (1 - 0.35);
        if (u > nn.u0) {
          const [ox, oy] = this.streamPos(s, nn.u0);
          if (n.alpha < 0.01 && n.targetAlpha === 0) {
            n.x = ox;
            n.y = oy;
          }
          n.tx = ox;
          n.ty = oy;
          n.targetAlpha = 0.55;
        }
      }
    });

    this.plexus.update(dt, now);
    // Link reach grows with the story: short in the bud, full in the network.
    const L = plexusConfig.linkDist * (this.mobile ? 0.8 : 1);
    let linkDist = B.burst > 0 ? L * (0.6 + 0.2 * B.burst) : L * 0.7 * Math.max(B.bud, B.streams > 0 ? 1 : 0);
    // While joining, links shrink to neighbours only → a glowing traced outline.
    if (J > 0) {
      const spacing = (2 * (box.w + box.h)) / this.net.length;
      linkDist = linkDist + (spacing * 2.6 - linkDist) * J;
    }
    drawPlexus(ctx, this.plexus, linkDist, 1, fadeOut);

    // Landed seed node — the brightest point until the network takes over.
    if (B.streak >= 1) drawGlow(ctx, cx, cy, plexusConfig.bloomRadius * 2.2, (1 - B.burst * 0.6) * (1 - J) * fadeOut);

    ctx.restore();
  }
}
