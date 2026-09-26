import * as THREE from "three";
import type { GalaxyBuffers } from "./generateGalaxy";

export interface AndromedaParams {
  count: number;
  radius: number;
  /** Winding of the two arms (radians per unit of ln r). Higher → more ring-like turns. */
  winding: number;
  /** Arm thickness as a fraction of radius. Small → crisp, well-defined arms. */
  armWidth: number;
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
 * Andromeda-style galaxy, modelled as five populations (fractions of `count`):
 *   bulge   10%  — dense peach gaussian core
 *   inner   22%  — faint diffuse peach→lavender disc inside the arms
 *   arms    50%  — two tightly-wound log-spiral arms; at high inclination their
 *                  ~1.5 turns read as the elliptical rings of the reference
 *   dust    17.6% — fine dim glitter across the whole disc and just beyond
 *   sparkle 0.4% — a sprinkling of larger warm glints
 * Disc lies in the XZ plane (normal +Y).
 */
export function generateAndromeda(p: AndromedaParams): GalaxyBuffers {
  const rand = mulberry32(p.seed);
  // Box–Muller standard normal.
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());

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
    let x = 0;
    let y = 0;
    let z = 0;
    let scale = 0.5 + rand() * 0.5;
    let brightness = 1;

    if (u < 0.1) {
      // Bulge.
      x = gauss() * 0.11 * R;
      z = gauss() * 0.11 * R;
      y = gauss() * 0.05 * R;
      c.copy(core).lerp(white, rand() * 0.25);
      brightness = 0.55;
      scale *= 0.8;
    } else if (u < 0.32) {
      // Inner diffuse disc.
      const r = (0.12 + Math.pow(rand(), 0.7) * 0.5) * R;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.02 * R;
      c.copy(core).lerp(disk, (r / R) * 1.4);
      brightness = 0.4;
    } else if (u < 0.82) {
      // Spiral arms. Log spiral θ = arm·π + winding·ln(r/r0): constant pitch,
      // so the arms stay evenly spaced as they wrap into ring-like bands.
      const arm = rand() < 0.5 ? 0 : 1;
      const r = r0 + Math.pow(rand(), 0.85) * (R - r0);
      const theta = arm * Math.PI + p.winding * Math.log(r / r0);
      // Gaussian scatter across the arm (tight) and a little along it.
      const w = p.armWidth * R * (0.6 + 0.8 * (r / R));
      const along = gauss() * w * 1.5;
      const across = gauss() * w;
      const tx = -Math.sin(theta);
      const tz = Math.cos(theta);
      x = Math.cos(theta) * r + tx * along + Math.cos(theta) * across;
      z = Math.sin(theta) * r + tz * along + Math.sin(theta) * across;
      y = gauss() * 0.012 * R;
      c.copy(disk).lerp(white, rand() * 0.55);
      // Wide brightness spread is what makes the arms read as glitter, not a solid band.
      brightness = 0.25 + Math.pow(rand(), 2) * 0.6;
      if (rand() < 0.05) {
        scale = 1.1 + rand() * 0.6;
        brightness = 1;
      }
    } else if (u < 0.996) {
      // Fine dust over the whole disc, thinning past the arms.
      const r = Math.pow(rand(), 0.6) * 1.25 * R;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.03 * R;
      c.copy(disk).lerp(white, rand() * 0.4);
      brightness = 0.3 + rand() * 0.3;
      scale *= 0.75;
    } else {
      // Warm sparkles scattered through the disc.
      const r = Math.sqrt(rand()) * 1.05 * R;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.05 * R;
      c.copy(sparkle).lerp(white, rand() * 0.3);
      brightness = 1.1;
      scale = rand() < 0.4 ? 2.2 + rand() * 1.4 : 1.2 + rand() * 0.6;
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
