/**
 * Wraps each word of a plain-text element in an inline-block span (idempotent),
 * and returns the spans grouped by rendered line. Words stay inline, so text still
 * reflows naturally on resize — only the stagger grouping is measured once.
 */
export function splitWordsByLine(el: HTMLElement): HTMLElement[][] {
  if (!el.dataset.split) {
    const text = el.textContent ?? "";
    el.textContent = "";
    // Screen readers get one intact copy (visually hidden); the animated
    // per-word spans are hidden from them. (aria-label isn't allowed on <p>.)
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    el.appendChild(sr);
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
        return;
      }
      const s = document.createElement("span");
      s.className = "split-word";
      s.setAttribute("aria-hidden", "true");
      s.textContent = part;
      el.appendChild(s);
    });
    el.dataset.split = "1";
  }

  const words = Array.from(el.querySelectorAll<HTMLElement>(".split-word"));
  const lines: HTMLElement[][] = [];
  let lastTop = Number.NaN;
  for (const w of words) {
    const top = w.offsetTop;
    if (lines.length === 0 || Math.abs(top - lastTop) > 2) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(w);
  }
  return lines;
}
