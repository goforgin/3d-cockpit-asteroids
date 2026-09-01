# 3D Cockpit Asteroids — Game Specification

## 1. Vision

A browser-based 3D reimagining of Atari's *Asteroids* (1979), played from inside the ship's cockpit. The player destroys asteroids in open space while managing limited shields and hyperspace jumps. Visual quality targets **high-end indie** (e.g. *Elite Dangerous* cockpit readability + *Rez* clarity + polished WebGL effects).

**Platform:** Web (desktop first)  
**Deploy target:** Vercel (static/client-side WebGL)  
**Session style:** Free play — no menus beyond start/pause/game over; immediate arcade loop.

---

## 2. Faithfulness to Original Asteroids

| Mechanic | Original | This Game |
|----------|----------|-----------|
| Lives | 3 ships | 3 ships |
| Bonus ship | Every 10,000 points | Every 10,000 points |
| Asteroid sizes | Large → Medium → Small | Large → Medium → Small (3 tiers) |
| Large asteroid points | 20 | 20 |
| Medium asteroid points | 50 | 50 |
| Small asteroid points | 100 | 100 |
| UFO (optional phase 2) | Appears after wave thresholds | Phase 2 — same scoring (200 large UFO, 1000 small) |
| Screen wrap | Yes | Yes — toroidal 3D play volume |
| Ship invulnerability | Brief after respawn | 3 seconds flashing |
| Difficulty ramp | More asteroids per wave | Same wave table (see §8) |

---

## 3. Controls

All input is **keyboard only** for v1.

| Key | Action | Behavior |
|-----|--------|----------|
| **←** | Rotate ship left (yaw) | Continuous while held; 180°/sec base |
| **→** | Rotate ship right (yaw) | Continuous while held |
| **↑** | Pitch ship up | Continuous while held; 120°/sec |
| **↓** | Pitch ship down | Continuous while held |
| **Alt** | Thrust | Adds forward velocity along ship nose; max speed cap; momentum + friction |
| **Space** | Fire | Rate-limited laser; fires toward **crosshair** (screen center raycast) |
| **Z** | Shield | Toggle or hold — absorbs one hit per activation chunk; limited pool per life |
| **Shift** | Hyperspace | Random teleport in play volume; brief vulnerability; cooldown |

### Aiming model
- **Ship orientation** = arrow keys (where the cockpit/nose points).
- **Weapons** fire along the **camera center ray** (crosshair), which equals ship forward axis when player only yaws — but pitch keys tilt nose, so crosshair and nose stay aligned.
- Crosshair: fixed center of viewport, subtle sci-fi reticle (SVG/CSS overlay, not 3D).

### Input constants (tunable in `src/game/constants.ts`)
```ts
ROTATION_YAW_SPEED = Math.PI          // rad/s
ROTATION_PITCH_SPEED = Math.PI * 0.67
THRUST_ACCEL = 25                     // units/s²
MAX_SPEED = 40                        // units/s
FRICTION = 0.98                       // per frame at 60fps
FIRE_RATE = 4                         // shots/s
LASER_SPEED = 120
LASER_LIFETIME = 1.5                  // seconds
SHIELD_HITS_PER_SHIP = 3              // total hits absorbed per life
SHIELD_DURATION = 2.0                 // seconds active per Z press (or toggle)
HYPERSPACE_COOLDOWN = 5.0             // seconds
RESPAWN_INVULN = 3.0                  // seconds
```

---

## 4. Play Space & Physics

### Volume
- Axis-aligned box: **400 × 400 × 400** world units (configurable).
- **Wrap:** When entity center crosses a face, teleport to opposite face (classic Asteroids wrap, extended to Y).

### Ship
- Capsule/cockpit collision radius: **2.0** units.
- Velocity-based movement; no gravity.
- Angular velocity optional (v1: instant rotation via arrow keys is acceptable for arcade feel).

### Asteroids
- **Large:** radius 8, splits into 2 medium on destroy.
- **Medium:** radius 4, splits into 2 small.
- **Small:** radius 2, destroyed completely.
- Random tumble rotation on all axes.
- Initial velocity random, magnitude 5–15 units/s.
- Collision: sphere-sphere with ship and lasers.

### Lasers
- Thin cylinder or line segment; destroy on asteroid hit.
- Max **4** active player lasers on screen (original limit).

---

## 5. Cockpit & Camera

### Camera
- **First-person** from pilot seat.
- FOV: **75°** vertical.
- Parented to ship transform (position + rotation).
- Subtle **head-bob** on thrust (amplitude 0.02, frequency tied to speed).
- **G-force tilt:** slight camera roll on sharp turns (optional polish).

### Cockpit mesh
- Detailed interior: dashboard, monitors, frame struts, scratched glass canopy.
- **Exterior visible** through canopy (stars, asteroids, laser bolts).
- HUD elements rendered as **screen-space overlay** (React DOM), not textured quads (easier for Qwen3-coder).
- Radar is a **secondary monitor** on dashboard (3D mesh with RenderTexture OR pure HUD panel in bottom-left styled as CRT).

### Lighting
- Interior: dim emissive panels, point lights on buttons.
- Exterior: starfield skydome + directional "sun" + asteroid-friendly ambient.
- Laser/explosion dynamic lights (max 3 simultaneous for perf).

---

## 6. Radar

Purpose: compensate for limited FOV; show asteroid bearing and range.

### Display
- Circular CRT-style scope, **120×120 px** HUD region (bottom-left of dashboard area).
- Range: full play volume (normalized to radius).
- Blips:
  - **Asteroids:** white/green dots, size by asteroid tier.
  - **Player:** center dot (fixed).
  - **UFO (phase 2):** red triangle.

### Data
- Update every frame from `asteroidPositions - shipPosition` in ship-local XZ plane (classic radar) + optional height indicator (tick mark).

---

## 7. Shields & Hyperspace

### Shields (Z)
- Pool: **3 hits per life** (not per second — discrete charges).
- On activation: visible bubble shader around ship for `SHIELD_DURATION` or until hit.
- On hit while shielded: consume 1 charge, play impact VFX, no life lost.
- When pool empty: Z does nothing + UI warning beep.

### Hyperspace (Shift)
- Cooldown **5 s**.
- Teleport to random position in volume; clear velocity.
- **Risk:** 1% chance instant death (classic nod); otherwise 1 s invulnerability after jump.
- VFX: chromatic aberration + star streak post-process for 0.3 s.

---

## 8. Waves & Scoring

### Wave start asteroid counts (classic table)
| Wave | Large asteroids |
|------|-----------------|
| 1 | 4 |
| 2 | 6 |
| 3 | 8 |
| 4+ | `min(4 + (wave-1)*2, 12)` |

Spawn positions: random on sphere shell of radius 150 centered in volume, velocity inward-ish.

### Score UI
- Top-center: `SCORE 00000` — 6 digits, odometer roll animation optional.
- Lives: ship icons bottom-center.
- Shield charges: 3 pips near crosshair.

### Game over
- No lives remaining → overlay "GAME OVER" + final score + press Enter to restart.

---

## 9. Graphics Quality Bar

### Targets
- 1080p @ **60 FPS** on mid-range GPU (GTX 1060 / M1 equivalent).
- **PBR materials** on cockpit and asteroids.
- **Post-processing:** bloom (lasers/explosions), vignette, subtle film grain, ACES tone mapping.
- **Particles:** explosion debris, thrust trail, shield ripple.

### Assets (see `docs/ASSET_PIPELINE.md`)
- Cockpit: GLB from Blender, &lt; 80k triangles.
- Asteroids: 3 icosphere-based meshes with displacement/normal maps (procedural variation).
- Starfield: large inverted sphere + HDR or procedural shader.
- Sounds: UI beeps, laser, explosion, thrust rumble, shield hum.

### Materials checklist
- [ ] Cockpit metal — roughness 0.4, subtle scratches (normal map)
- [ ] Glass canopy — transmission + slight dirt
- [ ] Dashboard emissive buttons
- [ ] Asteroid rock — triplanar or UV noise
- [ ] Laser — emissive cylinder + bloom
- [ ] Shield — Fresnel shader, cyan/purple

---

## 10. Audio

| Event | Sound |
|-------|-------|
| Fire | Short pew |
| Asteroid break | Crunch + debris |
| Ship explode | Bass thump |
| Thrust | Looping rumble (volume ∝ thrust) |
| Shield on/off | Electric hum |
| Shield hit | Clang |
| Hyperspace | Whoosh + static |
| Extra life | Classic bonus jingle (original-inspired) |
| UFO (phase 2) | Distinct siren |

Use **Howler.js**; preload in `public/audio/`.

---

## 11. UI / HUD Layout

```
┌─────────────────────────────────────────────────────────┐
│                    SCORE 012350                          │
│                                                         │
│                      ⊕ crosshair                        │
│                                                         │
│  ┌──────┐                                               │
│  │ RADAR│                              SHIELDS ●●○     │
│  └──────┘                                               │
│  [ thrust bar ]              LIVES ▲▲▲                 │
└─────────────────────────────────────────────────────────┘
```

- Font: monospaced sci-fi (e.g. **Orbitron** from Google Fonts).
- CRT scanline optional shader on radar only.

---

## 12. State Machine

```
BOOT → TITLE → PLAYING ⇄ PAUSED → GAME_OVER → TITLE
```

- `TITLE`: "PRESS ENTER" / click to start.
- `PLAYING`: simulation runs.
- `PAUSED`: Escape toggles.
- `GAME_OVER`: show score, wait for restart.

Store in **Zustand** (`src/store/gameStore.ts`).

---

## 13. Non-Goals (v1)

- Multiplayer
- Mobile touch controls
- VR
- Save/high-score persistence (localStorage optional phase 3)
- Procedural cockpit customization

---

## 14. Acceptance Criteria (MVP)

1. Cockpit view with starfield and moving asteroids visible through canopy.
2. Arrow keys rotate ship; Alt thrusts with momentum and wrap.
3. Space fires center-aimed lasers; asteroids split correctly; scoring matches table.
4. Radar shows live asteroid positions.
5. 3 lives, respawn invulnerability, bonus ship at 10,000 points.
6. Z shields with 3 charges per life; Shift hyperspace with cooldown.
7. Wave progression increases asteroid count.
8. 60 FPS on target hardware; deploys to Vercel without server errors.
