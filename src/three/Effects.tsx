import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

export interface EffectsProps {
  bloomIntensity?: number;
  threshold?: number;
  radius?: number;
}

/** Bloom gives the galaxy its glow; vignette keeps the eye centred. */
export function Effects({ bloomIntensity = 0.9, threshold = 0.1, radius = 0.7 }: EffectsProps) {
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
