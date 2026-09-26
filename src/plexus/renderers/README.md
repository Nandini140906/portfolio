# Plexus renderers

`Plexus.ts` and `Filament.ts` are pure data/simulation — no drawing. Renderers read
them and must take every visual constant from `../config.ts` so the intro and the
cursor always match.

## `canvas2d.ts` (in use)

Used by **both** the hero intro (`src/intro`) and the constellation cursor
(`src/cursor`). Additive `lighter` compositing + a cached radial glow sprite gives
bloom-like nodes without a WebGL post-processing pass, which keeps the intro light
enough to lazy-load and free completely when it ends.

## Porting to R3F (if ever needed)

- **Nodes** → one `THREE.Points`; per-node `alpha`/`size` as attributes, fragment
  shader = the same falloff as the glow sprite (hot centre `config.hot` → `config.color`).
  Additive blending, `depthWrite: false`, then `<Bloom>` instead of the sprite halo.
- **Links** → one `THREE.LineSegments` with a preallocated position buffer
  (`maxLinks * 2` verts) and vertex colours; write `plexus.links()` into it each frame
  and set `geometry.setDrawRange(0, links.length * 2)`. Alpha → multiply into colour
  (additive blending makes that equivalent).
- **Filament** → a `THREE.Points` or ribbon mesh along `filament.points`, size/alpha
  from the same `along × life` factor used in `drawFilament`.
