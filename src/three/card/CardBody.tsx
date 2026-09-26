import { useEffect, useMemo } from "react";
import { Line, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { createCardShape } from "./cardShape";

export const CARD_DEPTH = 0.07;
const BEVEL = 0.035;

export interface CardBodyProps {
  roughness?: number;
  rimColor?: string;
  rimOpacity?: number;
  isMobile?: boolean;
}

/** The clear acrylic slab + its glowing peach rim. */
export function CardBody({ roughness = 0.02, rimColor = "#ffe0d6", rimOpacity = 0.9, isMobile = false }: CardBodyProps) {
  const shape = useMemo(createCardShape, []);

  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: CARD_DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 5,
      curveSegments: 10,
    });
    g.translate(0, 0, -CARD_DEPTH / 2); // centre the slab on z = 0
    return g;
  }, [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Outline points for the rim lines. Pushed out by the bevel size so the glow
  // sits on the slab's outer edge rather than inside it.
  const rim = useMemo(() => {
    const pts = shape.getSpacedPoints(220);
    const c = new THREE.Vector2();
    return pts.map((p) => {
      const dir = p.clone().sub(c).normalize();
      return new THREE.Vector3(p.x + dir.x * BEVEL * 0.6, p.y + dir.y * BEVEL * 0.6, 0);
    });
  }, [shape]);

  const zFront = CARD_DEPTH / 2 + BEVEL * 0.5;

  return (
    <group>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.25}
          roughness={roughness}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.05}
          // No aberration / anisotropic blur: they smeared the galaxy's glitter into
          // streaks. The reference galaxy reads through perfectly clear acrylic.
          chromaticAberration={0}
          anisotropicBlur={0}
          distortion={0}
          samples={isMobile ? 3 : 8}
          // Full-res transmission buffer on desktop (undefined = canvas size) keeps dots crisp.
          resolution={isMobile ? 512 : undefined}
          backside={false}
          color="#f3f0ff"
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Front + back rim glow. toneMapped=false lets values exceed 1 so bloom catches them. */}
      {[zFront, -zFront].map((z) => (
        <Line
          key={z}
          points={rim}
          position={[0, 0, z]}
          color={rimColor}
          lineWidth={isMobile ? 1.2 : 1.6}
          transparent
          opacity={rimOpacity}
          toneMapped={false}
        />
      ))}
    </group>
  );
}
