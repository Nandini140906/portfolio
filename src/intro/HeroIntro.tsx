import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { IntroScene } from "./introScene";
import { IntroLine } from "./IntroText";
import { introLines } from "./introCopy";
import { setIntroCovering } from "./introStore";
import { usePlexusControls } from "../plexus/usePlexusControls";
import styles from "../styles/HeroIntro.module.css";

gsap.registerPlugin(useGSAP);

interface HeroIntroProps {
  onDone: () => void;
}

/**
 * Full-screen on-load sequence: streak → bud → multiply → burst → handoff.
 * Lazy-loaded; unmounts (and frees its canvas) as soon as it finishes or is skipped.
 */
export default function HeroIntro({ onDone }: HeroIntroProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobile = useRef(window.matchMedia("(max-width: 768px), (pointer: coarse)").matches).current;
  // The network finishes by joining onto the real hero card's outline.
  const scene = useRef(
    new IntroScene(mobile, () => document.querySelector("[data-hero-card]")?.getBoundingClientRect() ?? null),
  ).current;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  usePlexusControls();

  // Render loop.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      scene.frame(ctx, (now - t0) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.width = canvas.height = 0; // release the backing store right away
    };
  }, [scene, mobile]);

  // Timeline + skip.
  useGSAP(
    () => {
      const B = scene.beats;
      const d = mobile ? 0.9 : 1; // a touch quicker on phones
      const lines = lineRefs.current.filter((l): l is HTMLDivElement => !!l);
      gsap.set(lines, { autoAlpha: 0, y: 14, filter: "blur(6px)" });

      const tl = gsap.timeline({ onComplete: () => doneRef.current() });
      // Dev-only handle for scrubbing the intro from the console / tests.
      if (import.meta.env.DEV) (window as unknown as { __introTl?: gsap.core.Timeline }).__introTl = tl;
      const showLine = (i: number, at: number) => {
        if (!lines[i]) return;
        tl.to(lines[i], { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.55 * d, ease: "power2.out" }, at);
        if (i > 0 && lines[i - 1]) {
          tl.to(lines[i - 1], { autoAlpha: 0, y: -10, filter: "blur(6px)", duration: 0.4 * d, ease: "power1.in" }, at);
        }
      };

      // ~5.6s total: streak → bud → multiply → burst → join onto the card.
      tl.to(B, { streak: 1, duration: 1.1 * d, ease: "power2.inOut" }, 0.1 * d)
        .to(B, { bud: 1, duration: 0.7 * d, ease: "back.out(1.6)" }, 1.1 * d)
        .to(B, { streams: 1, duration: 1.6 * d, ease: "sine.inOut" }, 1.7 * d)
        .to(B, { burst: 1, duration: 1.1 * d, ease: "power2.out" }, 3.1 * d)
        .to(B, { zoom: 1.18, duration: 1.3 * d, ease: "power1.inOut" }, 3.1 * d)
        .addLabel("join", 4.3 * d)
        .to(B, { join: 1, duration: 1.0 * d, ease: "power2.inOut" }, "join")
        // Reveal: wake the page so the card assembles right under the traced outline.
        .call(() => setIntroCovering(false), undefined, 5.0 * d)
        .to(B, { fade: 1, duration: 0.6 * d, ease: "power1.in" }, 5.0 * d)
        .to(root.current, { autoAlpha: 0, duration: 0.6 * d, ease: "power1.inOut" }, 5.05 * d);

      showLine(0, 0.15 * d);
      showLine(1, 1.1 * d);
      showLine(2, 1.8 * d);
      showLine(3, 3.1 * d);
      if (lines[3]) tl.to(lines[3], { autoAlpha: 0, y: -10, duration: 0.4 * d }, "join");

      // Skip: jump straight to a quick handoff.
      let skipped = false;
      const skip = () => {
        if (skipped) return;
        skipped = true;
        tl.pause();
        // Quick version of the ending: snap the network onto the card, then reveal.
        gsap.to(lines, { autoAlpha: 0, duration: 0.25 });
        gsap.to(B, { burst: 1, zoom: 1, join: 1, duration: 0.5, ease: "power2.inOut" });
        gsap.delayedCall(0.35, () => setIntroCovering(false));
        gsap.to(B, { fade: 1, duration: 0.4, delay: 0.35 });
        gsap.to(root.current, { autoAlpha: 0, duration: 0.45, delay: 0.4, onComplete: () => doneRef.current() });
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") return; // let keyboard users reach the skip button
        // Space/arrows/PageDown would otherwise also scroll the page underneath.
        if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(e.key)) e.preventDefault();
        skip();
      };
      // Lock page scroll while the intro plays, so skipping lands on the Hero.
      const html = document.documentElement;
      const prevOverflow = html.style.overflow;
      html.style.overflow = "hidden";
      window.scrollTo(0, 0);
      setIntroCovering(true);
      window.addEventListener("wheel", skip, { passive: true });
      window.addEventListener("touchmove", skip, { passive: true });
      window.addEventListener("pointerdown", skip);
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("wheel", skip);
        window.removeEventListener("touchmove", skip);
        window.removeEventListener("pointerdown", skip);
        window.removeEventListener("keydown", onKey);
        html.style.overflow = prevOverflow;
        setIntroCovering(false);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.overlay} role="presentation">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.lines} aria-live="polite">
        {introLines.map((text, i) => (
          <IntroLine key={i} text={text} ref={(el) => (lineRefs.current[i] = el)} />
        ))}
      </div>
      <button type="button" className={styles.skip}>
        skip intro →
      </button>
    </div>
  );
}
