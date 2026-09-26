import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CARD_H, CARD_W } from "./cardShape";
import { site } from "../../data/content";

const PX_PER_UNIT = 512;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Paints the card's "printed" details (chip, labels, number lines) on a canvas.
 * Drawn after web fonts load so Space Mono is used instead of a fallback.
 */
function paint(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 100; // 1% of card width, keeps layout resolution-independent
  ctx.clearRect(0, 0, W, H);

  // Milky acrylic body: a faint cool fill that brightens toward the edges, so the
  // clear slab reads lighter than the backdrop (as in the reference) instead of
  // as a dark hole.
  ctx.fillStyle = "rgba(190, 200, 225, 0.035)";
  ctx.fillRect(0, 0, W, H);
  const edge = 7 * u;
  const sides: Array<[number, number, number, number, number, number, number, number]> = [
    [0, 0, 0, edge, 0, 0, W, edge],
    [0, H, 0, H - edge, 0, H - edge, W, edge],
    [0, 0, edge, 0, 0, 0, edge, H],
    [W, 0, W - edge, 0, W - edge, 0, edge, H],
  ];
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(235, 225, 245, 0.16)");
    g.addColorStop(1, "rgba(235, 225, 245, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  }

  const ink = "rgba(236, 232, 255, 0.78)";
  const faint = "rgba(236, 232, 255, 0.28)";

  // Chip (top-left): frosted rounded square with contact lines.
  roundRect(ctx, 9 * u, 8 * u, 20 * u, 15 * u, 2.2 * u);
  ctx.fillStyle = "rgba(230, 228, 245, 0.22)";
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 238, 255, 0.45)";
  ctx.lineWidth = 0.5 * u;
  ctx.stroke();
  ctx.strokeStyle = "rgba(240, 238, 255, 0.3)";
  ctx.lineWidth = 0.35 * u;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(10.5 * u, (8 + i * 3.75) * u);
    ctx.lineTo(27.5 * u, (8 + i * 3.75) * u);
    ctx.stroke();
  }

  ctx.fillStyle = ink;
  ctx.textBaseline = "alphabetic";

  // Top-right label.
  ctx.font = `700 ${4.2 * u}px "Space Mono", monospace`;
  ctx.textAlign = "right";
  ctx.fillText(site.cardLabel, 91 * u, 13 * u);
  ctx.fillStyle = faint;
  roundRect(ctx, 66 * u, 16 * u, 25 * u, 1.1 * u, 0.5 * u);
  ctx.fill();

  // Bottom-left "card number" style lines.
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.font = `400 ${5 * u}px "Space Mono", monospace`;
  ctx.fillText(site.cardLine1, 9 * u, H - 30 * u);
  ctx.font = `400 ${4.2 * u}px "Space Mono", monospace`;
  ctx.fillText(site.cardLine2, 9 * u, H - 23 * u);
  ctx.fillStyle = faint;
  ctx.fillText(site.cardLine3, 9 * u, H - 16.5 * u);

  // Bottom-right frosted blocks.
  ctx.fillStyle = "rgba(230, 228, 245, 0.14)";
  roundRect(ctx, 72 * u, H - 34 * u, 19 * u, 7 * u, 1.2 * u);
  ctx.fill();
  roundRect(ctx, 72 * u, H - 24 * u, 19 * u, 7 * u, 1.2 * u);
  ctx.fill();
}

/** Flat textured plane embedded inside the glass, just behind the front face. */
export function CardFace({ z = 0.012 }: { z?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_W * PX_PER_UNIT;
    canvas.height = CARD_H * PX_PER_UNIT;
    paint(canvas);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);

  useEffect(() => {
    let alive = true;
    // Repaint once the mono font is actually available.
    document.fonts
      .load(`16px "Space Mono"`)
      .then(() => document.fonts.load(`700 16px "Space Mono"`))
      .then(() => {
        if (!alive) return;
        paint(texture.image as HTMLCanvasElement);
        texture.needsUpdate = true;
      })
      .catch(() => {});
    return () => {
      alive = false;
      texture.dispose();
    };
  }, [texture]);

  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[CARD_W, CARD_H]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
