import type { ReactNode } from "react";

/** "a *word* here" → ["a ", <em class="accent">word</em>, " here"] (gold italic). */
export function renderAccent(text: string): ReactNode[] {
  return text.split(/\*(.+?)\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} className="accent">
        {part}
      </em>
    ) : (
      part
    ),
  );
}
