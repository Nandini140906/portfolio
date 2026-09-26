import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * A soft additive radial sprite that sits in the galaxy's disc plane. Points alone
 * read as "grainy"; this fills the core with the smooth peach glow of the reference.
 */
export function CoreGlow({ radius = 0.6, color = "#ffcfb3", intensity = 0.9 }: { radius?: number; color?: string; intensity?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec2 vUv;
          void main() {
            float r = length(vUv - 0.5) * 2.0;           // 0 centre → 1 edge
            // Two falloffs: a tight hot centre + a wide faint halo.
            float g = pow(max(0.0, 1.0 - r), 4.0) * 1.4 + pow(max(0.0, 1.0 - r), 1.6) * 0.25;
            gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        transparent: false, // see GalaxyParticles: keeps it in the glass's transmission buffer
      }),
    [color, intensity],
  );
  useEffect(() => () => material.dispose(), [material]);

  return (
    // Plane lies in XZ (the disc plane) so it inherits the galaxy's tilt.
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[radius * 2, radius * 2]} />
    </mesh>
  );
}
