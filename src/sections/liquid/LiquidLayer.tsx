import { useEffect, useRef, type CSSProperties } from "react";
import { MAX_RIPPLES, liquidFragmentShader, liquidVertexShader } from "./liquidShader";

export interface TiltState {
  /** Current card rotation in degrees (smoothed). */
  rx: number;
  ry: number;
  /** How fast the card is moving (deg/s). */
  speed: number;
}

interface LiquidLayerProps {
  tilt: { current: TiltState };
  animate: boolean;
  className?: string;
  style?: CSSProperties;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

const RIPPLE_LIFE = 2.2; // seconds before a ripple slot is recycled
const RIPPLE_EVERY_PX = 38; // spawn a new ripple after the pointer travels this far

/**
 * "Dissolved liquid" inside the glass card: a small standalone WebGL canvas that
 * shades a slowly swirling height field (3D-looking highlights and caustic veins).
 * Hovering bulges the glass under the cursor and sends ripples out from it.
 */
export function LiquidLayer({ tilt, animate, className, style }: LiquidLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement; // the card — canvas itself is pointer-events: none
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return; // no WebGL → plain glass

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, liquidVertexShader));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, liquidFragmentShader));
      gl.linkProgram(program);
      gl.useProgram(program);
    } catch (e) {
      console.warn("[liquid] shader failed", e);
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(program, "uTime"),
      res: gl.getUniformLocation(program, "uRes"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      hover: gl.getUniformLocation(program, "uHover"),
      ripples: gl.getUniformLocation(program, "uRipples"),
      tilt: gl.getUniformLocation(program, "uTilt"),
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

    // --- pointer → hover + ripples ---------------------------------------
    const mouse = { x: 0.5, y: 0.5 };
    let hoverTarget = 0;
    let hover = 0;
    // Ripple slots: [x, y, bornAt]; bornAt < 0 = empty.
    const ripples = new Float32Array(MAX_RIPPLES * 3).fill(-1);
    const rippleData = new Float32Array(MAX_RIPPLES * 3);
    let nextSlot = 0;
    let lastSpawn = { x: -999, y: -999 };
    const clock = () => performance.now() / 1000;

    const spawn = (x: number, y: number) => {
      ripples.set([x, y, clock()], nextSlot * 3);
      nextSlot = (nextSlot + 1) % MAX_RIPPLES;
    };
    const toUv = (e: PointerEvent) => {
      // getBoundingClientRect is the tilted card's projected box — close enough
      // for a few degrees of tilt.
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, px: e.clientX, py: e.clientY };
    };
    const onEnter = (e: PointerEvent) => {
      hoverTarget = 1;
      const p = toUv(e);
      mouse.x = p.x;
      mouse.y = p.y;
      spawn(p.x, p.y);
      lastSpawn = { x: p.px, y: p.py };
    };
    const onMove = (e: PointerEvent) => {
      const p = toUv(e);
      mouse.x = p.x;
      mouse.y = p.y;
      if (Math.hypot(p.px - lastSpawn.x, p.py - lastSpawn.y) > RIPPLE_EVERY_PX) {
        spawn(p.x, p.y);
        lastSpawn = { x: p.px, y: p.py };
      }
    };
    const onLeave = () => {
      hoverTarget = 0;
    };
    const onDown = (e: PointerEvent) => {
      const p = toUv(e);
      spawn(p.x, p.y); // tap / click = a splash
    };
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);

    let raf = 0;
    const start = clock();
    let last = start;
    const draw = () => {
      const now = clock();
      const dt = Math.min(0.05, now - last);
      last = now;
      hover += (hoverTarget - hover) * (1 - Math.exp(-6 * dt));

      for (let k = 0; k < MAX_RIPPLES; k++) {
        const born = ripples[k * 3 + 2];
        const age = born < 0 ? -1 : now - born;
        rippleData[k * 3] = ripples[k * 3];
        rippleData[k * 3 + 1] = ripples[k * 3 + 1];
        rippleData[k * 3 + 2] = age >= 0 && age < RIPPLE_LIFE ? age : -1;
      }

      const s = tilt.current;
      gl.uniform1f(u.time, animate ? now - start : 6);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.hover, hover);
      gl.uniform3fv(u.ripples, rippleData);
      gl.uniform2f(u.tilt, s.rx, s.ry);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (animate && document.visibilityState === "visible") raf = requestAnimationFrame(draw);
    };
    draw();

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
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [animate, tilt]);

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />;
}
