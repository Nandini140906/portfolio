import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { MAX_TRAIL, liquidFragmentShader, liquidVertexShader } from "./liquidShader";
import { paintText } from "./paintText";

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
  /** Element whose text gets the liquid-chrome treatment (its DOM copy is hidden). */
  textRoot?: RefObject<HTMLElement>;
  /** Called with true once the WebGL text is live (so the DOM text can be hidden). */
  onTextReady?: (ready: boolean) => void;
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

const TRAIL_LIFE = 1.4; // s for a wake blob to fully settle
const TRAIL_EVERY_PX = 9; // drop a new blob after the pointer travels this far
const BLOB_AMP = 0.32; // wake height per blob
const BLOB_RADIUS = 0.13; // card-heights

/**
 * Liquid glass card layer: a small standalone WebGL canvas that draws the ambient
 * dissolved swirl and a copy of the card's text. Moving the cursor across the card
 * leaves a liquid wake that bends the letters and turns them iridescent chrome,
 * then they settle back — the "liquid metal type" effect.
 */
export function LiquidLayer({ tilt, animate, textRoot, onTextReady, className, style }: LiquidLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onTextReady);
  readyRef.current = onTextReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement; // the card — canvas itself is pointer-events: none
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return; // no WebGL → plain glass + DOM text

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, liquidVertexShader));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, liquidFragmentShader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
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
      trail: gl.getUniformLocation(program, "uTrail"),
      tilt: gl.getUniformLocation(program, "uTilt"),
      text: gl.getUniformLocation(program, "uText"),
      hasText: gl.getUniformLocation(program, "uHasText"),
    };

    // ---- text texture ------------------------------------------------------
    const textCanvas = document.createElement("canvas");
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u.text, 0);
    let hasText = false;

    let dpr = 1;
    const refreshText = () => {
      const root = textRoot?.current;
      if (!root) return;
      textCanvas.width = canvas.width;
      textCanvas.height = canvas.height;
      paintText(textCanvas, host, root, dpr);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Flip so canvas row 0 (top) lands at uv.y = 1; premultiply to match the
      // shader's premultiplied compositing.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      if (!hasText) {
        hasText = true;
        readyRef.current?.(true);
      }
    };

    const resize = () => {
      // Up to 2× so the type stays as sharp as the DOM text it replaces.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        refreshText();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    // Web fonts may land after first paint — repaint the text once they're ready.
    let alive = true;
    document.fonts?.ready.then(() => alive && refreshText());

    // ---- pointer → wake ----------------------------------------------------
    const target = { x: 0.5, y: 0.5 };
    const mouse = { x: 0.5, y: 0.5 };
    let hoverTarget = 0;
    let hover = 0;
    // Trail slots: x, y, bornAt, amp (bornAt < 0 = empty).
    const trail = new Float32Array(MAX_TRAIL * 4).fill(-1);
    const trailData = new Float32Array(MAX_TRAIL * 4);
    let nextSlot = 0;
    let lastPx = { x: -1e4, y: -1e4 };
    const clock = () => performance.now() / 1000;

    const drop = (x: number, y: number, amp: number) => {
      trail.set([x, y, clock(), amp], nextSlot * 4);
      nextSlot = (nextSlot + 1) % MAX_TRAIL;
    };
    const toUv = (e: PointerEvent) => {
      // Projected (tilted) box — close enough for a few degrees of tilt.
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
    };
    const onEnter = (e: PointerEvent) => {
      hoverTarget = 1;
      const p = toUv(e);
      target.x = mouse.x = p.x;
      target.y = mouse.y = p.y;
      lastPx = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      const p = toUv(e);
      target.x = p.x;
      target.y = p.y;
      const dist = Math.hypot(e.clientX - lastPx.x, e.clientY - lastPx.y);
      if (dist > TRAIL_EVERY_PX) {
        // Faster strokes make a stronger wake (capped).
        drop(p.x, p.y, BLOB_AMP * Math.min(1.6, 0.6 + dist / 30));
        lastPx = { x: e.clientX, y: e.clientY };
      }
    };
    const onLeave = () => {
      hoverTarget = 0;
    };
    const onDown = (e: PointerEvent) => {
      const p = toUv(e);
      drop(p.x, p.y, BLOB_AMP * 2.2); // click / tap = a splash
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
      // The bulge lags the cursor a little, like a drop dragged through liquid.
      const k = 1 - Math.exp(-10 * dt);
      mouse.x += (target.x - mouse.x) * k;
      mouse.y += (target.y - mouse.y) * k;

      for (let i = 0; i < MAX_TRAIL; i++) {
        const born = trail[i * 4 + 2];
        const age = born < 0 ? Infinity : now - born;
        const life = age < TRAIL_LIFE ? 1 - age / TRAIL_LIFE : 0;
        trailData[i * 4] = trail[i * 4];
        trailData[i * 4 + 1] = trail[i * 4 + 1];
        // Ease out (life²) so letters "heal" smoothly; blobs also spread as they fade.
        trailData[i * 4 + 2] = life > 0 ? trail[i * 4 + 3] * life * life : 0;
        trailData[i * 4 + 3] = BLOB_RADIUS * (1 + (1 - life) * 0.6);
      }

      const s = tilt.current;
      gl.uniform1f(u.time, animate ? now - start : 6);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.hover, hover);
      gl.uniform4fv(u.trail, trailData);
      gl.uniform2f(u.tilt, s.rx, s.ry);
      gl.uniform1f(u.hasText, hasText ? 1 : 0);
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
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      ro.disconnect();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      if (hasText) readyRef.current?.(false);
    };
  }, [animate, tilt, textRoot]);

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />;
}
