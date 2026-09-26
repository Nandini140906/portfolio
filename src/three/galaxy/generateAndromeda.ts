import * as THREE from "three";

export interface GalaxyBuffers {
  positions: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
}

export interface AndromedaParams {
  count: number;
  radius: number;
  /** Winding of the two arms (radians per unit of ln r). Higher → more ring-like turns. */
  winding: number;
  /** Arm thickness as a fraction of radius. Small → crisp, well-defined arms. */
  armWidth: number;
  /** 0–1: how much loose dust is scattered between/beyond the arms (the "noise"). */
  dust: number;
  /** 0–1: how many larger warm glints are sprinkled through the disc. */
  sparkle: number;
  coreColor: string;
  diskColor: string;
  sparkleColor: string;
  seed: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Andromeda-style galaxy built from five populations:
 *   bulge   — dense peach gaussian core
 *   inner   — faint diffuse peach→lavender disc inside the arms
 *   arms    — two tightly-wound log-spiral arms; at high inclination their
 *             ~1.5 turns read as the elliptical rings of the reference image
 *   dust    — fine dim glitter across the disc (scaled by `dust`)
 *   sparkle — a sprinkling of larger warm glints (scaled by `sparkle`)
 * The disc lies in the XZ plane (normal +Y).
 */
export function generateAndromeda(p: AndromedaParams): GalaxyBuffers {
  const rand = mulberry32(p.seed);
  // Box–Muller standard normal.
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());

  // Population weights → cumulative thresholds. Arms absorb whatever dust/sparkle don't use.
  const wBulge = 0.1;
  const wInner = 0.18;
  const wDust = 0.18 * p.dust;
  const wSparkle = 0.0015 * p.sparkle;
  const wArms = 1 - wBulge - wInner - wDust - wSparkle;
  const tBulge = wBulge;
  const tInner = tBulge + wInner;
  const tArms = tInner + wArms;
  const tDust = tArms + wDust;

  const n = p.count;
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const scales = new Float32Array(n);
  const seeds = new Float32Array(n);

  const core = new THREE.Color(p.coreColor);
  const disk = new THREE.Color(p.diskColor);
  const sparkle = new THREE.Color(p.sparkleColor);
  const white = new THREE.Color("#ffffff");
  const c = new THREE.Color();
  const R = p.radius;
  const r0 = 0.28 * R; // where the arms start

  for (let i = 0; i < n; i++) {
    const u = rand();
    let x: number;
    let y: number;
    let z: number;
    let scale = 0.5 + rand() * 0.5;
    let brightness: number;

    if (u < tBulge) {
      x = gauss() * 0.11 * R;
      z = gauss() * 0.11 * R;
      y = gauss() * 0.05 * R;
      c.copy(core).lerp(white, rand() * 0.25);
      brightness = 0.55;
      scale *= 0.8;
    } else if (u < tInner) {
      const r = (0.12 + Math.pow(rand(), 0.7) * 0.5) * R;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.02 * R;
      c.copy(core).lerp(disk, (r / R) * 1.4);
      brightness = 0.4;
    } else if (u < tArms) {
      // Log spiral θ = arm·π + winding·ln(r/r0): constant pitch, so the arms stay
      // evenly spaced as they wrap into ring-like bands.
      const arm = rand() < 0.5 ? 0 : 1;
      const r = r0 + Math.pow(rand(), 0.85) * (R - r0);
      const theta = arm * Math.PI + p.winding * Math.log(r / r0);
      // Gaussian scatter across the arm (tight) and a little along it.
      const w = p.armWidth * R * (0.6 + 0.8 * (r / R));
      const along = gauss() * w * 1.5;
      const across = gauss() * w;
      x = Math.cos(theta) * (r + across) - Math.sin(theta) * along;
      z = Math.sin(theta) * (r + across) + Math.cos(theta) * along;
      y = gauss() * 0.012 * R;
      c.copy(disk).lerp(white, rand() * 0.55);
      // Wide brightness spread makes the arms read as glitter, not a solid band.
      brightness = 0.25 + Math.pow(rand(), 2) * 0.6;
      if (rand() < 0.05) {
        scale = 1.1 + rand() * 0.6;
        brightness = 1;
      }
    } else if (u < tDust) {
      // Kept inside the disc (≤1.05R) so nothing sprays out across the page.
      const r = Math.pow(rand(), 0.6) * 1.05 * R;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.03 * R;
      c.copy(disk).lerp(white, rand() * 0.4);
      brightness = 0.25 + rand() * 0.25;
      scale *= 0.75;
    } else {
      const r = Math.sqrt(rand()) * 1.1 * R;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.05 * R;
      c.copy(sparkle).lerp(white, rand() * 0.3);
      brightness = 1.1;
      // Warm glints of mixed size — the big ones read as bokeh once bloom hits them.
      scale = rand() < 0.45 ? 2.6 + rand() * 2.2 : 1.3 + rand() * 0.8;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 3] = c.r * brightness;
    colors[i * 3 + 1] = c.g * brightness;
    colors[i * 3 + 2] = c.b * brightness;
    scales[i] = scale;
    seeds[i] = rand();
  }

  return { positions, colors, scales, seeds };
}
