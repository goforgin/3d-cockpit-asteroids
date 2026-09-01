# Asset Pipeline

## Cockpit (hero asset)

### Blender modeling checklist
1. **Scale:** ship interior ~4m wide; export scale 1 unit = 1 meter
2. **Origin:** pilot eye position at (0, 0, 0) — camera attaches here
3. **LODs:** single LOD for v1
4. **Parts:**
   - `cockpit_frame` — metal PBR
   - `dashboard` — emissive screens (separate material)
   - `canopy_glass` — transparent, single sided
   - `seat` — dark fabric

### Textures (2K max)
- `cockpit_albedo.jpg`
- `cockpit_normal.jpg`
- `cockpit_roughness.jpg`
- `cockpit_emissive.jpg` (button glow)

### Export
```
File → Export → glTF 2.0 (.glb)
✓ Apply Modifiers
✓ UVs, Normals, Materials
```

---

## Asteroids (procedural-friendly)

### Approach A — Code-only (fastest for Qwen3-coder)
- `IcosahedronGeometry` with random vertex displacement (simplex noise)
- Single rock texture triplanar in shader
- 3 base radii (8, 4, 2) — tint variation per instance

### Approach B — Blender sculpt
- Sculpt 1 rock → duplicate 3 sizes → export `asteroid_large.glb`
- Reuse mesh with non-uniform scale in code

### Variation
- Per asteroid: `rotationSpeed`, `hueShift`, `displacementSeed`

---

## Starfield

### Option 1 — drei `<Stars />`
```tsx
<Stars radius={300} depth={50} count={8000} factor={4} fade speed={0.5} />
```

### Option 2 — HDR
- `public/textures/starfield.hdr` + `Environment` from drei

Use both: HDR for reflections, Stars for parallax depth.

---

## VFX (code-driven)

| Effect | Implementation |
|--------|----------------|
| Laser | Cylinder mesh + emissive `#00ffff` + bloom |
| Explosion | 30-50 `Points` with velocity + fade 0.5s |
| Thrust | Cone particles, orange, emit from rear |
| Shield | `MeshPhysicalMaterial` + Fresnel custom shader |
| Hyperspace | `ChromaticAberration` + `Bloom` spike 0.3s |

---

## Audio files

Place in `public/audio/`. Prefer **.mp3** for size; **.ogg** for quality.

| File | Duration | Notes |
|------|----------|-------|
| `laser.mp3` | 0.1s | |
| `explosion.mp3` | 0.5s | |
| `thrust.mp3` | 2s loop | seamless |
| `shield_on.mp3` | 0.3s | |
| `shield_hit.mp3` | 0.2s | |
| `hyperspace.mp3` | 0.8s | |
| `extra_life.mp3` | 1s | arpeggio |
| `ui_beep.mp3` | 0.05s | |

**Placeholder:** [Kenney Digital Audio](https://kenney.nl/assets/digital-audio) or Freesound (CC0).

---

## File size budget (Vercel)

| Asset type | Budget |
|------------|--------|
| cockpit.glb | < 5 MB |
| textures (total) | < 10 MB |
| audio (total) | < 3 MB |
| **dist/ total** | < 25 MB ideal |

Compress with:
- `gltf-transform optimize` (CLI)
- `ffmpeg -b:a 96k` for audio

---

## Placeholder strategy (until art ready)

Phase 1–6 can use:
- Gray box cockpit with emissive quads for "screens"
- Gray icospheres for asteroids
- Colored meshes for lasers

Swap GLBs in Phase 7 without code changes (same paths).
