/**
 * Paints the live DOM text inside `root` (the card's heading + tagline) onto a
 * canvas, word by word at the exact positions the browser laid them out, so the
 * WebGL liquid layer can distort a pixel-perfect copy of it.
 *
 * Positions are measured with the card's CSS transform temporarily removed
 * (the card tilts/floats every frame), then expressed relative to the card box.
 */
export function paintText(
  canvas: HTMLCanvasElement,
  card: HTMLElement,
  root: HTMLElement,
  scale: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prevTransform = card.style.transform;
  card.style.transform = "none";
  const origin = card.getBoundingClientRect();
  // Ancestors may still be scaled (e.g. the card's entrance animation): convert
  // screen px back to the card's own layout px.
  const k = card.offsetWidth ? origin.width / card.offsetWidth : 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  // Soft dark halo keeps the type legible over the galaxy glow (mirrors the CSS text-shadow).
  ctx.shadowColor = "rgba(5, 5, 10, 0.9)";
  ctx.shadowBlur = 22 * scale;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    const el = node.parentElement;
    if (!el || !text.trim() || el.closest("[aria-hidden='true']")) continue;

    const cs = getComputedStyle(el);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    // Canvas letterSpacing is Chromium/Safari 17+; harmless elsewhere.
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    // (The DOM copy is hidden with opacity, so its computed colour is still real.)
    ctx.fillStyle = cs.color;

    // Word-by-word so wrapped lines land in the right place.
    const re = /\S+/g;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getClientRects()[0];
      if (!r) continue;
      const metrics = ctx.measureText(m[0]);
      const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
      // Inline content-area height = ascent + descent, centred in the rect.
      const top = (r.top - origin.top) / k;
      const baseline = top + (r.height / k - (ascent + descent)) / 2 + ascent;
      ctx.fillText(m[0], (r.left - origin.left) / k, baseline);
    }
  }
  range.detach();
  card.style.transform = prevTransform;
}
