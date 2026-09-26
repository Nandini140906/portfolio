import { Environment, Lightformer } from "@react-three/drei";

/**
 * Procedural environment (no HDR download) — a few soft area lights that the
 * glass card's clearcoat reflects as faint edge highlights.
 */
export function GlassLighting() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2} color="#cfe0ff" position={[0, 5, -2]} scale={[10, 1, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#ffc98a" position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 1, 1]} />
      <Lightformer form="rect" intensity={1} color="#93b8ff" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 1, 1]} />
    </Environment>
  );
}
