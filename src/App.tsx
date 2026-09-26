import { useIsMobile } from "./hooks/useIsMobile";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

// Phase 0 placeholder shell — replaced by the canvas + sections in later phases.
export default function App() {
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--dimmer)", textTransform: "uppercase" }}>
          {"// 00 — scaffold"}
        </p>
        <h1 style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
          Nand<em className="accent">i</em>ni Das
        </h1>
        <p style={{ color: "var(--dim)" }}>Developer &amp; automation builder</p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--dimmer)" }}>
          mobile: {String(isMobile)} · reduced-motion: {String(reducedMotion)}
        </p>
      </div>
    </main>
  );
}
