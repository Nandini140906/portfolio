import * as THREE from "three";

/** Card footprint in world units (portrait, ~credit-card proportions). */
export const CARD_W = 2;
export const CARD_H = 3.1;

type Pt = [x: number, y: number, radius: number];

/**
 * Outline of the notched sci-fi card from the reference: rounded rectangle with
 * a chamfered notch on each long side and a shallow slot in the bottom edge.
 * Each point carries its own corner radius so big corners are soft and the
 * notch corners stay crisp.
 */
function outline(): Pt[] {
  const hw = CARD_W / 2;
  const hh = CARD_H / 2;
  const d = 0.07; // notch depth
  const R = 0.16; // outer corner radius
  const r = 0.025; // notch corner radius
  return [
    [-hw, hh, R],
    [hw, hh, R],
    // right-side notch
    [hw, 0.2, r],
    [hw - d, 0.12, r],
    [hw - d, -0.34, r],
    [hw, -0.42, r],
    [hw, -hh, R],
    // bottom slot
    [0.38, -hh, r],
    [0.3, -hh + d * 0.8, r],
    [-0.3, -hh + d * 0.8, r],
    [-0.38, -hh, r],
    [-hw, -hh, R],
    // left-side notch
    [-hw, -0.42, r],
    [-hw + d, -0.34, r],
    [-hw + d, 0.12, r],
    [-hw, 0.2, r],
  ];
}

/**
 * Turns a polygon into a THREE.Shape with rounded corners: at each vertex we stop
 * `radius` short of it along the incoming edge, then quadratic-curve through the
 * vertex (as control point) to `radius` along the outgoing edge.
 */
export function createCardShape(): THREE.Shape {
  const pts = outline();
  const shape = new THREE.Shape();
  const n = pts.length;
  const along = (a: Pt, b: Pt, dist: number): [number, number] => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const t = Math.min(dist, len / 2) / len;
    return [a[0] + dx * t, a[1] + dy * t];
  };

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const [ix, iy] = along(cur, prev, cur[2]);
    const [ox, oy] = along(cur, next, cur[2]);
    if (i === 0) shape.moveTo(ix, iy);
    else shape.lineTo(ix, iy);
    shape.quadraticCurveTo(cur[0], cur[1], ox, oy);
  }
  shape.closePath();
  return shape;
}
