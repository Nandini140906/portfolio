import { useEffect, useRef, type CSSProperties } from "react";
import { waterFragmentShader, waterVertexShader } from "./waterShader";

export interface TiltState {
  /** Current card rotation in degrees (smoothed). */
  rx: number;
  ry: number;
  /** How fast the card is moving — drives extra slosh. */
  speed: number;
}

interface WaterLayerProps {
  tilt: { current: TiltState };
  animate: boolean;
  className?: string;
  style?: CSSProperties;
  /** Resting water height 0–1. */
  level?: number;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

/**
 * Water sloshing inside the glass card: a tiny standalone WebGL canvas (separate
 * from the galaxy canvas) drawing caustics, a wavy surface line and bubbles.
 * The surface counter-tilts against the card's 3D rotation so the water stays level.
 */
export function WaterLayer({ tilt, animate, className, style, level = 0.37 }: WaterLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return; // no WebGL → card simply has no water

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, waterVertexShader));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, waterFragmentShader));
      gl.linkProgram(program);
      gl.useProgram(program);
    } catch (e) {
      console.warn("[water] shader failed", e);
      return;
    }

    // One full-screen triangle pair.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(program, "uTime"),
      res: gl.getUniformLocation(program, "uRes"),
      level: gl.getUniformLocation(program, "uLevel"),
      tilt: gl.getUniformLocation(program, "uTilt"),
      slosh: gl.getUniformLocation(program, "uSlosh"),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let slosh = 0;
    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const t = animate ? (performance.now() - start) / 1000 : 4;
      const s = tilt.current;
      // Surface slope opposes the card's Y-rotation (degrees → small slope), so the
      // liquid reads as staying level while the glass tilts around it.
      const slope = -s.ry * 0.012;
      // Movement kicks the waves up; they settle back exponentially.
      slosh += (Math.min(0.03, s.speed * 0.004) - slosh) * 0.06;
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.level, level - s.rx * 0.004);
      gl.uniform1f(u.tilt, slope);
      gl.uniform1f(u.slosh, slosh);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (animate && document.visibilityState === "visible") raf = requestAnimationFrame(draw);
    };
    draw();

    // Resume when the tab becomes visible again.
    const onVis = () => {
      if (animate && document.visibilityState === "visible") {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [animate, level, tilt]);

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />;
}
