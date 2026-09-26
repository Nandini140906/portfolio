import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

export interface EffectsProps {
  bloomIntensity?: number;
  threshold?: number;
  radius?: number;
}

/** Bloom is what turns thousands of tiny points into a glowing galaxy. */
export function Effects({ bloomIntensity = 1.1, threshold = 0.08, radius = 0.72 }: EffectsProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={bloomIntensity}
        luminanceThreshold={threshold}
        luminanceSmoothing={0.2}
        radius={radius}
      />
      <Vignette offset={0.25} darkness={0.7} />
    </EffectComposer>
  );
}
