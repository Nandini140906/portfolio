type Pt = [x: number, y: number, radius: number];

/**
 * SVG path for the reference card's outline — rounded rectangle with a chamfered
 * notch in each side and a slot in the bottom edge — at a given pixel size.
 * `inset` shrinks it uniformly (used for the inner bevel line of the acrylic).
 */
export function notchedPath(w: number, h: number, inset = 0): string {
  const i = inset;
  const R = Math.max(4, 18 - i); // outer corner radius
  const r = 3; // notch corner radius
  const d = 7; // notch depth
  const L = i;
  const T = i;
  const Rt = w - i;
  const B = h - i;
  // Notch spans as fractions of height/width (mirrors the reference's asymmetry).
  const ln = [0.52, 0.78].map((f) => h * f);
  const rn = [0.26, 0.5].map((f) => h * f);
  const bs = [0.1, 0.3].map((f) => w * f);

  const pts: Pt[] = [
    [L, T, R],
    [Rt, T, R],
    [Rt, rn[0], r],
    [Rt - d, rn[0] + d, r],
    [Rt - d, rn[1] - d, r],
    [Rt, rn[1], r],
    [Rt, B, R],
    [bs[1], B, r],
    [bs[1] - d, B - d * 0.8, r],
    [bs[0] + d, B - d * 0.8, r],
    [bs[0], B, r],
    [L, B, R],
    [L, ln[1], r],
    [L + d, ln[1] - d, r],
    [L + d, ln[0] + d, r],
    [L, ln[0], r],
  ];

  // Round each vertex: stop `radius` short of it, quadratic-curve through it.
  const n = pts.length;
  const toward = (a: Pt, b: Pt, dist: number) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(dist, len / 2) / len;
    return `${(a[0] + dx * t).toFixed(2)} ${(a[1] + dy * t).toFixed(2)}`;
  };
  let path = "";
  for (let k = 0; k < n; k++) {
    const prev = pts[(k - 1 + n) % n];
    const cur = pts[k];
    const next = pts[(k + 1) % n];
    path += `${k === 0 ? "M" : "L"}${toward(cur, prev, cur[2])} Q${cur[0]} ${cur[1]} ${toward(cur, next, cur[2])} `;
  }
  return path + "Z";
}
