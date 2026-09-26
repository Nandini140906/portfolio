import * as THREE from "three";

export interface GalaxyParams {
  count: number;
  radius: number;
  branches: number;
  /** How tightly the arms wind (radians of twist per unit of ln(1 + r)). */
  spin: number;
  /** Max scatter away from the arm, as a fraction of the particle's radius. */
  randomness: number;
  /** >1 pushes scatter toward the arm centre-line (sharper arms). */
  randomnessPower: number;
  /** Fraction of particles placed in the spherical core bulge instead of the arms. */
  coreFraction: number;
  coreColor: string;
  armColor: string;
  seed: number;
  /** Fraction of particles drawn as larger, brighter "stars" (0 = perfectly smooth dust). */
  brightFraction?: number;
  /** Exponent for the core→arm colour ramp; higher keeps the warm core colour further out. */
  colorFalloff?: number;
}

export interface GalaxyBuffers {
  positions: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
}

/** Small deterministic PRNG (mulberry32) so a given seed always yields the same galaxy. */
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

export function generateGalaxy(p: GalaxyParams): GalaxyBuffers {
  const rand = mulberry32(p.seed);
  const positions = new Float32Array(p.count * 3);
  const colors = new Float32Array(p.count * 3);
  const scales = new Float32Array(p.count);
  const seeds = new Float32Array(p.count);

  const core = new THREE.Color(p.coreColor);
  const arm = new THREE.Color(p.armColor);
  const tmp = new THREE.Color();

  // Signed scatter: magnitude biased toward 0 by randomnessPower, random sign.
  const scatter = () => Math.pow(rand(), p.randomnessPower) * (rand() < 0.5 ? 1 : -1);

  for (let i = 0; i < p.count; i++) {
    const i3 = i * 3;
    let x: number;
    let y: number;
    let z: number;
    let r: number;

    if (rand() < p.coreFraction) {
      // Core bulge: roughly gaussian sphere, flattened on Y.
      // Sum of 3 uniforms ≈ normal distribution (cheap central-limit trick).
      const g = () => (rand() + rand() + rand() - 1.5) / 1.5;
      x = g() * p.radius * 0.18;
      y = g() * p.radius * 0.07;
      z = g() * p.radius * 0.18;
      r = Math.hypot(x, z);
    } else {
      // Radius biased toward the centre (pow > 1 → denser core, sparse rim).
      r = Math.pow(rand(), 1.5) * p.radius;
      const branchAngle = ((i % p.branches) / p.branches) * Math.PI * 2;
      // Logarithmic spiral: angle grows with ln(r), so arms keep a constant pitch
      // angle as they widen — the look of real spiral galaxies.
      const spinAngle = Math.log1p(r) * p.spin;
      const angle = branchAngle + spinAngle;
      const spread = p.randomness * r;
      x = Math.cos(angle) * r + scatter() * spread;
      y = scatter() * spread * 0.35; // thin disc
      z = Math.sin(angle) * r + scatter() * spread;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Gold core → blue-white arms. pow < 1 makes the gold fall off quickly
    // so most of the disc reads blue, with a hot centre.
    const t = Math.min(1, Math.pow(r / p.radius, p.colorFalloff ?? 0.55));
    tmp.copy(core).lerp(arm, t);
    colors[i3] = tmp.r;
    colors[i3 + 1] = tmp.g;
    colors[i3 + 2] = tmp.b;

    // Most particles small; a few (brightFraction) noticeably bright "stars".
    scales[i] = rand() < (p.brightFraction ?? 0.03) ? 1.6 + rand() * 1.4 : 0.35 + rand() * 0.9;
    seeds[i] = rand();
  }

  return { positions, colors, scales, seeds };
}
