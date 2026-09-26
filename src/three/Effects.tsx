import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";

export interface EffectsProps {
  bloomIntensity?: number;
  threshold?: number;
  radius?: number;
  /** World point to keep in focus; enables shallow depth of field when set. */
  focusTarget?: [number, number, number];
  focusRange?: number;
  bokehScale?: number;
}

/** Bloom is what turns thousands of tiny points into a glowing galaxy. */
export function Effects({
  bloomIntensity = 1.1,
  threshold = 0.08,
  radius = 0.72,
  focusTarget,
  focusRange = 1.4,
  bokehScale = 5,
}: EffectsProps) {
  return (
    <EffectComposer multisampling={0}>
      {/*
        Depth of field reads the depth buffer. The glass card writes depth, so its
        tilted surface goes sharp in the middle and soft at the near/far ends —
        the macro-lens look of the reference. Particles don't write depth, so they
        take the blur of whatever surface is behind them.
      */}
      {focusTarget ? (
        <DepthOfField target={focusTarget} worldFocusRange={focusRange} bokehScale={bokehScale} />
      ) : (
        <></>
      )}
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
