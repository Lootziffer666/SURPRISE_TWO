# Asset Replacement Backlog — Procedural → Real Models

Source of truth: `src/entities/AssetFactory.js` (all gameplay assets are currently
generated from Three.js primitives per the prototype constraint). This list ranks
every replaceable asset by visual impact, documents its current primitive
composition, measured triangle/vertex counts, and footprint, and states the
target requirements for the GLTF/GLB replacement.

Measured with the current factory build (flat-shaded, shared materials):

| Asset | Meshes | Tris | Bounding box (X×Y×Z) |
|---|---|---|---|
| createPlayer | 7 | 1264 | 1.04×1.55×0.82 |
| createTree | 5 | 92 | 1.70×4.10×1.70 |
| createBear | 10 | 1140 | 1.50×1.60×3.22 |
| createWood | 1 | 28 | 0.49×0.24×0.48 |
| createRawMeat | 1 | 12 | 0.46×0.16×0.34 |
| createCookedMeat | 1 | 12 | 0.46×0.18×0.34 |
| createCash | 2 | 24 | 0.42×0.16×0.32 |
| createFencePost | 3 | 36 | 0.34×1.25×0.34 |
| createCampfire | 13 | 652 | 2.12×1.31×2.40 |
| createRock | 2 | 160 | 0.90×0.75×0.80 |
| createMarket | 8 | 96 | 3.70×2.58×1.80 |

## Replacement priority

### 1. Player (`createPlayer`) — highest impact
- Current: capsule body, sphere head, box backpack, capsule arms/legs; rigid
  limb swing via `userData.limbs` (rotation.x sine). 1264 tris, ~1.0×1.6×0.8 m.
- Why first: on screen 100% of playtime, the only animated character, and the
  anchor for the inventory stack. Primitive look is most visible here.
- Replacement target: rigged low-poly character (character + skinned mesh),
  3–8k triangles, max 4 texture atlases (albedo/normal), ~25 bones minimum:
  hips, spine, head, 2×arm (upper/lower), 2×leg (upper/lower).
- Contract that must survive: root object named `Player`, faces +Z,
  `userData.limbs` (4 Object3D refs for swing) or a proper AnimationMixer,
  `userData.stackMount` = Group at (0, 1.2, −0.4) where `InventoryStack`
  attaches. Feet at y=0, origin centered under the character.

### 2. Campfire (`createCampfire`) — focal gameplay point
- Current: 5 rotated log cylinders, 2 cone flames (emissive, animated in
  `MapManager.update` via names `flameA`/`flameB`), 6 stone spheres. 652 tris.
- Replacement target: stone ring + log crisscross model, 1.5–3k triangles,
  ~2.2 m diameter footprint; flame as separate shader/particle VFX (not baked
  geometry). Keep `flameA`/`flameB` names as flame anchor Object3Ds so the
  scale-pulse animation keeps working.

### 3. Market stall (`createMarket`) — selling zone landmark
- Current: 8 boxes (counter, top, 2 posts, roof + snow, 2 crates). 96 tris,
  3.7×2.6×1.8 m. Reads as flat boxes from the isometric angle.
- Replacement target: timber market stall with striped canopy, 2–5k triangles,
  2 texture sets max. Footprint must stay ≈3.7×1.8 m; keep the counter top at
  ~1.05 m so world labels do not clip.

### 4. Tree (`createTree`) — most instances on the map
- Current: trunk cylinder + 3 pine cones + snow cap, 92 tris each, 4.1 m tall.
  16 instances in the starting area, 5 more in the expansion, individually
  scaled 0.82–1.17 and rotated.
- Replacement target: 2–3 variants (pine tall, pine round, snow-laden),
  300–800 triangles each so dozens of instances stay cheap. Introduce
  `InstancedMesh` or shared geometry at swap time. Trunk base at y=0,
  canopy top ≈4 m, collision-free radius ≤0.9 m.

### 5. Bear (`createBear`) — character-grade prop
- Current: box body/head/snout, sphere nose/ears, 4 box legs. 1140 tris,
  1.5×1.6×3.2 m. Proportions are boxy even for a stylized bear.
- Replacement target: stylized polar bear, 1.5–4k triangles, optional idle
  animation (breathing, head turn). Keep footprint ≤1.6×3.3 m so it does not
  block the path between campfire and market.

### 6. Resource pickups (wood, rawMeat, cookedMeat, cash)
- Current: single cylinders/boxes; 12–28 tris each. These are spawned,
  collected, stacked on the player's back, and respawned — the most
  instantiated objects in the game.
- Replacement targets (each ≤0.55×0.3×0.5 m, one mesh preferred):
  - Wood log: 150–300 tris, bark texture, end-grain rings.
  - Raw meat slab: 100–250 tris, marbled red albedo, slight sheen
    (roughness ~0.4).
  - Cooked meat slab: 100–250 tris, seared brown albedo, grill lines.
  - Cash bundle: 150–400 tris, band + bills; emissive edge optional.
- Stack contract: bounding-box height is measured at runtime by
  `InventoryStack` (gap 0.04 m), so any replacement must keep a predictable
  Y-extent and an origin at the base.

### 7. Fence post (`createFencePost`) — many instances, unblocker for InstancedMesh
- Current: 3 boxes (pole, cap, snow). 36 tris, 0.34×1.25×0.34 m. ~80 posts
  across 4 fence groups. The fence-sink animation tweens `post.position.y`
  per post, so replacements must stay per-post objects (or switch the tween
  to per-instance matrices when moving to InstancedMesh).
- Replacement target: snow-capped wooden post, 50–150 tris.

### 8. Rock (`createRock`) — pure decoration
- Current: 2 low-poly spheres. 160 tris. 4 instances.
- Replacement target: boulder cluster 200–500 tris with snow cap.

### 9. Terrain, paths, pond, zone markers — replace last or never
- Terrain: flat box (24×0.5×20 m) — replace with a heightfield mesh only if
  the art direction demands rolling snow; currently intentionally flat for
  gameplay clarity.
- Paths: thin boxes; replace with a decal/texture, not a model.
- Pond: 28-tri blue disc slightly above terrain — replace with an animated
  water material/shader, not a mesh swap.
- Zone markers (torus ring + disc): keep procedural; they are UI affordances,
  and emissive color-coded rings should remain shader-driven.

## Global replacement notes

- Format: GLB (binary glTF 2.0), Y-up, meters, Draco compression optional
  (needs decoder setup in the loader).
- All replacements are loaded in `AssetFactory`; every factory method already
  returns a `Group`, so swapping internals keeps the public contract
  (`createPlayer/createTree/...` + `createResource(type)`) stable.
- Materials: share a common `MeshStandardMaterial` set; the factory currently
  caches by color key — switch the cache to GLTF material reuse.
- Target total scene budget after replacement: < 60k triangles, < 25 draw
  call material groups; use InstancedMesh for trees and fence posts.
- Shadows: keep `castShadow`/`receiveShadow` flags from the current `mesh()`
  helper when handing over to real models.
