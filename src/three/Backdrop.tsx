import { useMemo } from "react";
import * as THREE from "three";

/**
 * Large far plane with a soft slate-blue radial gradient + a faint lighter
 * "floor" band low in frame — the studio backdrop from the reference image.
 */
export function Backdrop({ position = [0, 0, -10] as [number, number, number], size = 60 }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uCenter: { value: new THREE.Color("#1a212c") },
          uEdge: { value: new THREE.Color("#07070c") },
          uFloor: { value: new THREE.Color("#141a22") },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uCenter;
          uniform vec3 uEdge;
          uniform vec3 uFloor;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - 0.5;
            p.y *= 1.4;
            float r = length(p) * 2.0;
            vec3 col = mix(uCenter, uEdge, smoothstep(0.0, 0.75, r));
            // Floor band: brightens slightly just below centre, like a tabletop catching light.
            float floorBand = smoothstep(0.44, 0.40, vUv.y) * smoothstep(0.2, 0.40, vUv.y);
            col = mix(col, uFloor, floorBand * 0.6);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
        depthWrite: true,
      }),
    [],
  );
  return (
    <mesh position={position} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
