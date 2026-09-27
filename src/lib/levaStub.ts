/**
 * Production stand-in for `leva` (aliased in vite.config.ts). The dev tuning
 * panel is hidden in production anyway, so this just returns each control's
 * default value — and keeps leva's ~100 KB out of the shipped bundle.
 * Supports the only form used here: useControls(name, schema, options?).
 */
type Schema = Record<string, unknown>;

function defaults<S extends Schema>(schema: S): { [K in keyof S]: unknown } {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) {
    out[k] = v && typeof v === "object" && "value" in (v as object) ? (v as { value: unknown }).value : v;
  }
  return out as { [K in keyof S]: unknown };
}

// Typed as `any` on purpose: mirrors leva's inferred return type closely enough
// for our call sites without re-implementing its type machinery.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControls(_name: string, schema: Schema, _opts?: unknown): any {
  return defaults(schema);
}

export function Leva(_props: unknown): null {
  return null;
}
